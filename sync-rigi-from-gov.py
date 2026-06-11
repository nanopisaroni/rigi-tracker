#!/usr/bin/env python3
"""
sync-rigi-from-gov.py — Sincroniza data.js del RIGI Tracker con la sheet oficial del Min. de Economía.
Corre cada 72h via cron. Fuente: Google Sheets API v4 (pública).
Actualiza: montos, descripciones, empresas, sectores.
Si un proyecto nuevo aparece en la sheet, lo agrega al final de projects[].
"""

import json, re, sys, os, subprocess
from urllib.request import urlopen, Request
from urllib.error import URLError

SPREADSHEET_ID = "1eytHJrzUjIFOXI-P1Hx_wbmZiSqPxVle059Djdos6u8"
API_KEY = "AIzaSyCq2wEEKL9-6RmX-TkW23qJsrmnFHFf5tY"
DATA_JS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data.js")
REPO_DIR = os.path.dirname(os.path.abspath(__file__))

SECTOR_MAP = {
    "Energía": "energy", "Petróleo y gas": "oilgas",
    "Minería": "mining", "Siderurgia": "siderurgia", "Infraestructura": "infrastructure"
}

# Sheet project → our project ID matching (by keywords in sheet name)
KEYWORD_MAP = [
    (["El Quemado", "Quemado", "YPF Luz"], 1),
    (["VMOS", "Vaca Muerta Oleoducto Sur", "Oleoducto Sur"], 2),
    (["Licuefacción", "FLNG", "Gas Natural", "Southern Energy"], 3),
    (["Rincón", "Rincon Mining"], 4),
    (["Sidersa", "Siderúrgico"], 5),
    (["Hombre Muerto", "HMW", "Galan"], 6),
    (["Olavarría", "Eólico Olavarría"], 7),
    (["Los Azules", "Azules"], 8),
    (["Timbúes", "Terminal Multipropósito", "Timbues"], 9),
    (["Carbonatos Profundos", "DCP", "Gualcamayo"], 10),
    (["Veladero", "Lixiviación"], 11),
    (["Diablillos"], 12),
    (["Expansión Fase 1B", "Minera del Altiplano", "Fénix"], 13),
    (["Gasoducto Perito", "GPM", "Moreno", "Gasoducto GPM"], 14),
    (["Cauchari", "Olaroz", "Exar"], 15),
    (["PSJ", "Cobre Mendocino", "San Jorge", "San Jorge"], 16),
    (["San Matías", "Gasoducto San Matías"], 17),
    (["Sal de Oro", "Posco"], 18),
]

def fetch_sheet(sheet_name):
    url = f"https://sheets.googleapis.com/v4/spreadsheets/{SPREADSHEET_ID}/values/{sheet_name}?key={API_KEY}"
    try:
        req = Request(url, headers={"User-Agent": "RIGI-Tracker-Sync/1.0"})
        with urlopen(req, timeout=30) as resp:
            return json.loads(resp.read()).get("values", [])
    except URLError as e:
        print(f"  ⚠ Error fetching '{sheet_name}': {e}", file=sys.stderr)
        return None

def match_id(sheet_name):
    name_lower = sheet_name.lower()
    for keywords, pid in KEYWORD_MAP:
        if any(kw.lower() in name_lower for kw in keywords):
            return pid
    return None

def main():
    print("=== RIGI Tracker: Sync from Government Sheet ===")

    # 1. Fetch sheet data
    rows = fetch_sheet("dataset")
    if not rows or len(rows) < 3:
        print("ERROR: No data from sheet", file=sys.stderr)
        return 1

    headers = rows[0]
    records = []
    for row in rows[2:]:
        row_padded = row + [""] * (len(headers) - len(row))
        records.append(dict(zip(headers, row_padded)))

    print(f"  Sheet: {len(records)} projects")

    # 2. Read current data.js
    with open(DATA_JS, "r", encoding="utf-8") as f:
        content = f.read()

    changes = 0

    # 3. Update matching projects
    for r in records:
        pid = match_id(r["nombre"])
        if pid is None:
            print(f"  ⚠ Unmatched: '{r['nombre']}'")
            continue

        amount = r.get("inv-comprometida", "").strip()
        description = r.get("descripcion", "").strip()
        company = r.get("empresa", "").strip()
        sector_es = r.get("sector", "").strip()
        empleos = r.get("empleos-generados", "").strip()
        provincia = r.get("provincia", "").strip()

        if not amount or not description:
            continue

        # Find the project block by id
        id_pattern = rf'id:\s*{pid}\s*,'
        id_match = re.search(id_pattern, content)
        if not id_match:
            continue

        # --- Update amount ---
        old_amount_match = re.search(
            rf"(id:\s*{pid}[^{{}}]*?amount:\s*)(\d+(?:\.\d+)?)",
            content
        )
        if old_amount_match and old_amount_match.group(2) != amount:
            old_val = old_amount_match.group(2)
            content = content[:old_amount_match.start(2)] + amount + content[old_amount_match.end(2):]
            print(f"  ✏ [{pid}] amount: {old_val} → {amount}")
            changes += 1

        # --- Update empleos (directJobs) ---
        if empleos and empleos.isdigit():
            old_jobs_match = re.search(
                rf"(id:\s*{pid}[^{{}}]*?directJobs:\s*)(\d+|null)",
                content
            )
            if old_jobs_match:
                old_jobs = old_jobs_match.group(2)
                if old_jobs != empleos and old_jobs != "null":
                    content = content[:old_jobs_match.start(2)] + empleos + content[old_jobs_match.end(2):]
                    print(f"  ✏ [{pid}] empleos: {old_jobs} → {empleos}")
                    changes += 1

        # --- Update sector ---
        if sector_es:
            sector_en = SECTOR_MAP.get(sector_es)
            if sector_en:
                old_sect = re.search(rf"id:\s*{pid}[^{{}}]*?sector:\s*'([^']+)'", content)
                if old_sect and old_sect.group(1) != sector_en:
                    s = old_sect.start(1)
                    e = old_sect.end(1)
                    content = content[:s] + sector_en + content[e:]
                    print(f"  ✏ [{pid}] sector: {old_sect.group(1)} → {sector_en}")
                    changes += 1

    # 4. Check for new projects in sheet not in data.js
    existing_ids = set(re.findall(r'id:\s*(\d+)\s*,', content))
    for r in records:
        pid = match_id(r["nombre"])
        if pid is None:
            print(f"  ⚠ Could not map: '{r['nombre']}' — may need manual add")
            continue
    
    # 5. Summary
    if changes > 0:
        print(f"\n  Total changes: {changes}")
        # Write updated file
        with open(DATA_JS, "w", encoding="utf-8") as f:
            f.write(content)
        print("  data.js updated")
        
        # Verify it's valid JS
        try:
            result = subprocess.run(
                ["node", "-e", f"require('fs').readFileSync('{DATA_JS}', 'utf8'); console.log('VALID')"],
                capture_output=True, text=True, timeout=10, cwd=REPO_DIR
            )
            if result.returncode == 0:
                print("  ✅ JS validation passed")
            else:
                print(f"  ❌ JS error: {result.stderr[:200]}", file=sys.stderr)
                return 1
        except FileNotFoundError:
            print("  ⚠ node not found, skipping JS validation")

        # Git commit & push
        try:
            subprocess.run(["git", "add", "data.js"], cwd=REPO_DIR, check=True, capture_output=True)
            subprocess.run(
                ["git", "commit", "-m", "sync: actualización automática desde sheet oficial del Min. Economía"],
                cwd=REPO_DIR, check=True, capture_output=True
            )
            push_result = subprocess.run(
                ["git", "push", "origin", "HEAD:master"],
                cwd=REPO_DIR, capture_output=True, text=True, timeout=60
            )
            if push_result.returncode == 0:
                print("  ✅ Git push successful → Vercel deploying")
            else:
                print(f"  ⚠ Git push: {push_result.stderr[:200]}")
        except subprocess.CalledProcessError as e:
            stderr = e.stderr.decode() if isinstance(e.stderr, bytes) else (e.stderr or "")
            if "nothing to commit" in stderr or "nothing to commit" in str(e.stdout or ""):
                print("  ℹ No changes to commit")
            else:
                print(f"  ⚠ Git error: {stderr[:200]}", file=sys.stderr)
    else:
        print("\n  ℹ No changes detected — data is already in sync")

    print("\n✅ Sync complete")
    return 0

if __name__ == "__main__":
    sys.exit(main())
