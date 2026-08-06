# RIGI Tracker

## Qué es
Tracker de proyectos de inversión bajo el Régimen de Incentivo a las Grandes Inversiones (RIGI) de Argentina. Datos desde la sheet oficial del Ministerio de Economía. URL: https://rigi-tracker.vercel.app

## Stack
- `index.html` — estructura del sitio (HTML + CSS inline + números hardcodeados en hero/KPIs/timeline que NO se actualizan solos)
- `data.js` — **TODOS los datos viven acá**: `window.RIGI.projects[]` (aprobados) y `window.RIGI.pendingProjects[]` (en evaluación). NO meter datos en index.html.
- `app.js` — render de todo (SVG + vanilla JS, sin frameworks)
- `style.css` — design tokens (Kalia design system: light, dense, neutral, Inter, accent #2563eb, sin emojis ni gradientes)
- `sync-rigi-from-gov.py` — auto-sync desde sheet oficial (cron cada 72h)

## Estructura de datos (data.js)
- Proyecto aprobado: `{id, sector, status, name, company, province, amount, location, approvalDate, operationalDate, directJobs, annualExportsUSDm, companyCountry, ticker, description, timeline, impact, opportunities[], companies}`
- Pending: misma estructura pero `announcementDate`/`decisionDate` en vez de approvalDate
- Sectors: energy, oilgas, mining, siderurgia, infrastructure — cada uno con `--c-{sector}`, `.dot-{sector}`, `.tag.{sector}` en style.css
- Statuses: operativo, construccion, desarrollo, ampliacion, exploracion, aprobado, anunciado
- Provincias: coordenadas SVG en RIGI.provinces (incluye La Pampa)

## Reglas críticas
1. **Los números hardcodeados en index.html (hero, KPI strip, filtros, timeline, paneles) NO se actualizan desde data.js.** Al agregar/quitar proyectos hay que actualizarlos a mano: title, meta description, og:title, hero h1, kpi-strip, pill counts, section-title, panel-meta, timeline entries, paneles Súper RIGI/RIMI.
2. **Total oficial vs calculado**: usar SIEMPRE la suma exacta de data.js (ej: Caputo dijo US$46.700M, data.js suma US$46.309M — usar 46.309).
3. Al agregar timeline entry nuevo, mover la clase `now` del anterior al nuevo.
4. Empleos: campo `directJobs` = totales (directos + indirectos) de la sheet oficial. Sin datos → '—'.
5. Footer: créditos a @nanopisaroni con link a X (https://x.com/nanopisaroni). NO Kalei Ventures.
6. Nuevas provincias → agregar coordenadas al SVG del mapa + RIGI.provinces.
7. Fuentes confiables: sheet oficial Min. Economía (primaria), Boletín Oficial, Infobae, Ámbito, TN. Verificar con ≥2 fuentes independientes.

## Deploy
```bash
vercel --prod --yes
```
O push a master (Vercel auto-deploy desde GitHub). Proyecto Vercel: rigi-tracker.
Verificar post-deploy: `curl -s -H 'Cache-Control: no-cache' https://rigi-tracker.vercel.app/ | grep -o '<title>.*</title>'`
