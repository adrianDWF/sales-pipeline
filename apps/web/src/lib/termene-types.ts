export type TermeneCompanyLookup = {
  cui: string;
  name: string;
  address: string | null;
  registrationDate: string | null;
  caenCode: string | null;
  caenLabel: string | null;
  fiscalStatus: string | null;
  vatStatus: string | null;
  companySize: string | null;
  termeneScore: number | null;
  paymentCapacity: number | null;
  insolvencyRisk: string | null;
  hasAnafDebts: boolean;
  phone: string | null;
  website: string | null;
  shareCapital: number | null;
  turnover: number | null;
  turnoverYear: number | null;
  isActive: boolean;
};

export function parseStoredTermeneData(value: unknown): TermeneCompanyLookup | null {
  if (!value || typeof value !== "object") return null;
  const data = value as TermeneCompanyLookup;
  if (!data.cui || !data.name) return null;
  return data;
}
