#!/usr/bin/env python3
"""Import leads from Sales Pipeline Master Data xlsx. Replaces all existing leads."""

from __future__ import annotations

import json
import os
import re
import sys
import unicodedata
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

import pandas as pd
import requests

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_XLSX = Path.home() / "Downloads" / (
    "Sales Pipeline Master Data 2026 (DWF & Upswing_ leads, channels etc ).xlsx"
)

# Irina Zamfir — assign all imported leads for now; original owner kept in form_payload.
IRINA_PROFILE_ID = "1c8838d0-3bf0-42b2-9283-05e70cb83a70"

FIRST_CONTACT_STATUS = {
    "first contact": "first_contact",
    "dialog deschis": "open_dialog",
    "propunere in lucru": "proposal_prep",
    "propuneri prezentate": "proposal_presented",
    "semnare contract": "contract_signing",
    "blocate/amanate": "open_dialog",
    "lost": "lost",
}

STATUS_OLD_MAP = {
    "semnat": "finalized",
    "refuz": "lost",
    "necalificat": "lost",
    "open lead": "new_lead",
    "in analiza": "first_contact",
    "hold": "open_dialog",
    "offer sent": "proposal_presented",
    "buget prea mic": "lost",
    "buget prea mic seo": "lost",
    "iunie mtg": "open_dialog",
    "to invoice one time, ramane la agentia curenta darplateste pentru analiza": "negotiation",
}

SERVICE_COLUMNS = {
    "SEO": "SEO",
    "GEO": "GEO",
    "PPC": "PPC",
    "SEO LOCAL": "SEO Local",
    "VIDEO": "Video",
}

DEFAULT_STAGE_TASKS: dict[str, list[str]] = {
    "new_lead": [
        "Completează detaliile companiei",
        "Analiza site (nr pagini)",
        "Competitor",
        "Analiza proiect / cerinte",
    ],
    "first_contact": ["Prima conversație", "Identifică decidentul", "Notează nevoile"],
    "open_dialog": ["Follow-up programat", "Clarifică bugetul"],
    "proposal_prep": ["Draft propunere", "Review intern"],
    "proposal_presented": ["Așteaptă feedback", "Follow-up propunere"],
    "negotiation": ["Negociere termeni", "Ajustări propunere"],
    "contract_signing": ["Trimite contract", "Semnare"],
    "finalized": ["Onboarding client"],
    "lost": [],
}


def load_env(path: Path) -> dict[str, str]:
    env: dict[str, str] = {}
    if not path.exists():
        return env
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        env[key.strip()] = value.strip().strip('"')
    return env


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_text.lower()).strip("-")
    return slug or "lead"


def clean_website(value: object) -> str | None:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    text = str(value).strip()
    if not text or text.lower() in {"nan", "none"}:
        return None
    if " " in text and not text.startswith("http"):
        text = text.split()[0]
    if not text.startswith("http"):
        text = f"https://{text}"
    try:
        parsed = urlparse(text)
        if parsed.netloc:
            return text.rstrip("/")
    except Exception:
        pass
    return text[:500]


def derive_email(company: str, website: str | None, row_index: int) -> str:
    if website:
        try:
            host = urlparse(website if "://" in website else f"https://{website}").netloc
            host = host.lower().removeprefix("www.")
            # Strip zero-width / invisible chars
            host = re.sub(r"[\u200b-\u200d\ufeff]", "", host)
            if host and "@" not in host and "." in host and not host.endswith("."):
                candidate = f"contact@{host}"
                if re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", candidate):
                    return candidate
        except Exception:
            pass
    return f"import+{slugify(company)}-{row_index}@placeholder.dwf.ro"


def map_status(first_contact: object, status_old: object, tip_lead: object) -> str:
    fc = str(first_contact).strip().lower() if pd.notna(first_contact) else ""
    so = str(status_old).strip().lower() if pd.notna(status_old) else ""

    if fc in FIRST_CONTACT_STATUS:
        status = FIRST_CONTACT_STATUS[fc]
        if so == "semnat" and status == "contract_signing":
            return "finalized"
        return status

    if so in STATUS_OLD_MAP:
        return STATUS_OLD_MAP[so]

    tip = str(tip_lead).strip().lower() if pd.notna(tip_lead) else ""
    if tip == "necalificat":
        return "lost"
    return "new_lead"


def map_priority(tip_lead: object) -> str:
    tip = str(tip_lead).strip().lower() if pd.notna(tip_lead) else ""
    if tip == "calificat":
        return "high"
    if tip == "necalificat":
        return "low"
    return "medium"


def map_source(row: pd.Series) -> str:
    parts: list[str] = []
    for col in ("Sursa", "Canal OLD", "Paid"):
        val = row.get(col)
        if pd.notna(val) and str(val).strip():
            parts.append(str(val).strip())
    return " · ".join(parts) if parts else "import"


def build_notes(row: pd.Series) -> str | None:
    chunks: list[str] = []
    responsabil = str(row.get("Responsabil", "")).strip()
    if responsabil:
        chunks.append(f"Responsabil (import): {responsabil}")

    for col in ("Motiv", "Motiv Lost", "Tip lead ", "Status OLD", "Luna in care s-a semnat"):
        val = row.get(col)
        if pd.notna(val) and str(val).strip():
            label = col.strip()
            chunks.append(f"{label}: {str(val).strip()}")

    return "\n".join(chunks) if chunks else None


def row_to_payload(row: pd.Series, row_index: int) -> dict | None:
    company_raw = row.get("Nume companie")
    if pd.isna(company_raw) or not str(company_raw).strip():
        return None

    company = str(company_raw).strip()
    website = clean_website(row.get("Adresa site"))
    status = map_status(row.get("First contact"), row.get("Status OLD"), row.get("Tip lead "))
    created = row.get("Luna 1")
    if pd.notna(created):
        created_at = pd.Timestamp(created).tz_localize("UTC").isoformat()
    else:
        created_at = datetime.now(timezone.utc).isoformat()

    deal_value = row.get("Valoare/luna")
    deal_value_num = None
    if pd.notna(deal_value):
        try:
            deal_value_num = float(deal_value)
        except (TypeError, ValueError):
            deal_value_num = None

    form_payload = {
        k: (None if pd.isna(v) else (v.isoformat() if isinstance(v, pd.Timestamp) else v))
        for k, v in row.items()
    }
    form_payload["import_source"] = "master_data_2026"
    form_payload["responsabil_original"] = str(row.get("Responsabil", "")).strip() or None
    form_payload["row_index"] = row_index

    return {
        "lead": {
            "name": company,
            "email": derive_email(company, website, row_index),
            "phone": None,
            "company": company,
            "website_url": website,
            "message": None,
            "source": map_source(row)[:200],
            "external_id": f"master-2026-{row_index:04d}",
            "form_payload": form_payload,
            "status": status,
            "assigned_to": IRINA_PROFILE_ID,
            "notes": build_notes(row),
            "priority": map_priority(row.get("Tip lead ")),
            "deal_value": deal_value_num,
            "deal_currency": "EUR",
            "created_at": created_at,
            "updated_at": created_at,
        },
        "services": [
            {"service_name": label, "currency": "EUR"}
            for col, label in SERVICE_COLUMNS.items()
            if pd.notna(row.get(col)) and float(row.get(col) or 0) > 0
        ],
        "status": status,
    }


class SupabaseAdmin:
    def __init__(self, url: str, key: str) -> None:
        self.base = url.rstrip("/") + "/rest/v1"
        self.headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

    def delete_all_leads(self) -> None:
        resp = requests.delete(
            f"{self.base}/leads?id=not.is.null",
            headers={**self.headers, "Prefer": "return=minimal"},
            timeout=120,
        )
        resp.raise_for_status()

    def insert_leads(self, rows: list[dict]) -> list[dict]:
        resp = requests.post(
            f"{self.base}/leads",
            headers=self.headers,
            json=rows,
            timeout=120,
        )
        if not resp.ok:
            raise RuntimeError(f"Lead insert failed ({resp.status_code}): {resp.text[:500]}")
        return resp.json()

    def insert_services(self, rows: list[dict]) -> None:
        if not rows:
            return
        resp = requests.post(
            f"{self.base}/lead_services",
            headers={**self.headers, "Prefer": "return=minimal"},
            json=rows,
            timeout=120,
        )
        if not resp.ok:
            raise RuntimeError(f"Services insert failed ({resp.status_code}): {resp.text[:500]}")

    def insert_tasks(self, rows: list[dict]) -> None:
        if not rows:
            return
        resp = requests.post(
            f"{self.base}/lead_tasks",
            headers={**self.headers, "Prefer": "return=minimal"},
            json=rows,
            timeout=120,
        )
        if not resp.ok:
            raise RuntimeError(f"Tasks insert failed ({resp.status_code}): {resp.text[:500]}")


def main() -> int:
    xlsx_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_XLSX
    if not xlsx_path.exists():
        print(f"File not found: {xlsx_path}", file=sys.stderr)
        return 1

    env = load_env(ROOT / "apps/api/.env")
    url = env.get("SUPABASE_URL") or env.get("NEXT_PUBLIC_SUPABASE_URL")
    key = env.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        print("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in apps/api/.env", file=sys.stderr)
        return 1

    df = pd.read_excel(xlsx_path, sheet_name="DB")
    payloads = []
    for idx, row in df.iterrows():
        payload = row_to_payload(row, int(idx) + 1)
        if payload:
            payloads.append(payload)

    print(f"Prepared {len(payloads)} leads from {xlsx_path.name}")

    admin = SupabaseAdmin(url, key)
    print("Deleting existing leads...")
    admin.delete_all_leads()

    batch_size = 50
    total_services = 0
    total_tasks = 0

    for start in range(0, len(payloads), batch_size):
        batch = payloads[start : start + batch_size]
        inserted = admin.insert_leads([item["lead"] for item in batch])

        service_rows: list[dict] = []
        task_rows: list[dict] = []

        for item, lead_row in zip(batch, inserted, strict=True):
            lead_id = lead_row["id"]
            for service in item["services"]:
                service_rows.append({"lead_id": lead_id, **service})
            for sort_order, title in enumerate(DEFAULT_STAGE_TASKS.get(item["status"], [])):
                task_rows.append(
                    {
                        "lead_id": lead_id,
                        "stage": item["status"],
                        "title": title,
                        "completed": False,
                        "sort_order": sort_order,
                    }
                )

        admin.insert_services(service_rows)
        admin.insert_tasks(task_rows)
        total_services += len(service_rows)
        total_tasks += len(task_rows)
        print(f"  Inserted {min(start + batch_size, len(payloads))}/{len(payloads)}")

    print(
        json.dumps(
            {
                "ok": True,
                "leads": len(payloads),
                "services": total_services,
                "tasks": total_tasks,
                "assigned_to": IRINA_PROFILE_ID,
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
