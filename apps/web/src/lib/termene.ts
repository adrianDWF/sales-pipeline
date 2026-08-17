import "server-only";

import type { TermeneCompanyLookup } from "@/lib/termene-types";

export type { TermeneCompanyLookup };

type TermeneLabelValue = {
  label?: string | null;
};

function readLabel(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const label = (value as TermeneLabelValue).label;
  return typeof label === "string" && label.trim() ? label.trim() : null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function normalizeCuiInput(input: string): number | null {
  const digits = input.replace(/\D/g, "");
  if (!digits) return null;
  const parsed = Number.parseInt(digits, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function readNestedNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value && typeof value === "object" && "valoare" in value) {
    return readNumber((value as { valoare?: unknown }).valoare);
  }
  return null;
}

function parseLatestTurnover(data: Record<string, unknown>): {
  turnover: number | null;
  turnoverYear: number | null;
} {
  const bilanturi = data.bilanturi_mfinante_scurte as Record<string, unknown> | undefined;
  if (!bilanturi) return { turnover: null, turnoverYear: null };

  const years = Object.keys(bilanturi)
    .filter((key) => /^an_\d{4}$/.test(key))
    .map((key) => Number.parseInt(key.replace("an_", ""), 10))
    .filter((year) => Number.isFinite(year));

  const latestYear = years.length > 0 ? Math.max(...years) : null;

  const ultimul = bilanturi.ultimul_raportat as Record<string, unknown> | undefined;
  const turnoverFromLatest =
    readNestedNumber(ultimul?.cifra_de_afaceri_neta) ??
    (latestYear != null
      ? readNestedNumber(
          (bilanturi[`an_${latestYear}`] as Record<string, unknown> | undefined)
            ?.cifra_de_afaceri_neta,
        )
      : null);

  return { turnover: turnoverFromLatest, turnoverYear: latestYear };
}

export function parseTermeneResponse(payload: unknown): TermeneCompanyLookup | null {
  if (!payload || typeof payload !== "object") return null;

  const data = payload as Record<string, unknown>;
  if ("errors" in data) return null;

  const firma = data.firma as Record<string, unknown> | undefined;
  const adresa = data.adresa as Record<string, unknown> | undefined;
  const codCaen = data.cod_caen as Record<string, unknown> | undefined;
  const dateContact = data.date_contact as Record<string, unknown> | undefined;
  const dataInfiintarii = data.data_infiintarii as Record<string, unknown> | undefined;
  const marimeFirma = data.marime_firma as Record<string, unknown> | undefined;
  const evaluare = data.evaluare_termene as Record<string, unknown> | undefined;
  const datoriiAnaf = data.datorii_anaf as Record<string, unknown> | undefined;
  const riscInsolventa = data.risc_insolventa_termene as Record<string, unknown> | undefined;

  const cui =
    firma?.cui != null
      ? String(firma.cui)
      : normalizeCuiInput(String(data.cui ?? ""))?.toString() ?? null;
  const name =
    readString(firma?.nume_mfinante) ??
    readString(firma?.nume_recom) ??
    readString(firma?.nume_fara_forma_org);

  if (!cui || !name) return null;

  const anafAddress = adresa?.anaf as Record<string, unknown> | undefined;
  const sediuAddress = adresa?.sediu_social as Record<string, unknown> | undefined;
  const address =
    readString(anafAddress?.formatat) ??
    readString(sediuAddress?.formatat) ??
    readString(anafAddress?.neprelucrat);

  const principalCaen = codCaen?.principal_recom as Record<string, unknown> | undefined;
  const caenCode = readString(principalCaen?.cod);
  const caenLabel = readString(principalCaen?.label);

  const fiscalStatus = readLabel(
    (data.statut_fiscal as Record<string, unknown> | undefined)?.curent,
  );
  const vatStatus = readLabel((data.statut_tva as Record<string, unknown> | undefined)?.curent);

  const currentSize = marimeFirma?.curenta as Record<string, unknown> | undefined;
  const companySize = readString(currentSize?.marime);

  const termeneScore = readNumber(evaluare?.nota);
  const paymentCapacity = readNumber(evaluare?.capacitate_de_plata);
  const insolvencyRisk = readString(riscInsolventa?.label);

  const currentDebts = datoriiAnaf?.curent as Record<string, unknown> | undefined;
  const hasAnafDebts = currentDebts?.activa === true;

  const phones = Array.isArray(dateContact?.telefon) ? dateContact.telefon : [];
  const websites = Array.isArray(dateContact?.web) ? dateContact.web : [];
  const phone = phones.find((item) => typeof item === "string") as string | undefined;
  const websiteRaw = websites.find((item) => typeof item === "string") as string | undefined;
  const website = websiteRaw
    ? websiteRaw.startsWith("http")
      ? websiteRaw
      : `https://${websiteRaw}`
    : null;

  const registrationDate = readString(dataInfiintarii?.data);
  const shareCapital = readNumber(firma?.capital_social);
  const isActive = fiscalStatus?.toLowerCase().includes("activ") ?? false;
  const { turnover, turnoverYear } = parseLatestTurnover(data);

  return {
    cui,
    name,
    address,
    registrationDate,
    caenCode,
    caenLabel,
    fiscalStatus,
    vatStatus,
    companySize,
    termeneScore,
    paymentCapacity,
    insolvencyRisk,
    hasAnafDebts,
    phone: phone ?? null,
    website,
    shareCapital,
    turnover,
    turnoverYear,
    isActive,
  };
}

export async function fetchTermeneCompany(cui: number): Promise<TermeneCompanyLookup> {
  const url = process.env.TERMENE_API_URL ?? "https://api.termene.ro/v2";
  const username = process.env.TERMENE_USERNAME;
  const password = process.env.TERMENE_PASSWORD;
  const schemaKey = process.env.TERMENE_SCHEMA_KEY;

  if (!username || !password || !schemaKey) {
    throw new Error("Termene API is not configured");
  }

  const auth = Buffer.from(`${username}:${password}`).toString("base64");
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ cui, schemaKey }),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      "errors" in payload &&
      typeof (payload as { errors?: { message?: string } }).errors?.message === "string"
        ? (payload as { errors: { message: string } }).errors.message
        : `Termene request failed (${response.status})`;
    throw new Error(message);
  }

  const parsed = parseTermeneResponse(payload);
  if (!parsed) {
    throw new Error("No company data found for this CUI");
  }

  return parsed;
}
