// RIGI Tracker — app
// Vanilla JS. Renders charts (SVG), table, map and wires up filters/sort/search.

(function () {
  const data = window.RIGI;
  if (!data) return;

  const fmtUSD = (m) => {
    if (m >= 1000) {
      const v = (m / 1000);
      const s = v >= 10 ? v.toFixed(1).replace(/\.0$/, '') : v.toFixed(2);
      return 'US$' + s + ' MM';
    }
    return 'US$' + m + ' M';
  };
  const fmtUSDshort = (m) => {
    if (m >= 1000) return 'US$' + (m / 1000).toFixed(2).replace(/\.?0+$/, '') + ' MM';
    return 'US$' + m + ' M';
  };

  // ===== Aggregates =====
  function bySector(metric) {
    const totals = {};
    Object.keys(data.sectors).forEach(k => (totals[k] = { amount: 0, count: 0 }));
    data.projects.forEach(p => {
      totals[p.sector].amount += p.amount;
      totals[p.sector].count += 1;
    });
    return Object.entries(totals).map(([key, v]) => ({
      key,
      label: data.sectors[key].label,
      color: data.sectors[key].color,
      value: metric === 'count' ? v.count : v.amount,
      amount: v.amount,
      count: v.count
    })).sort((a, b) => b.value - a.value);
  }

  function byStatus() {
    const totals = {};
    Object.keys(data.statuses).forEach(k => (totals[k] = 0));
    data.projects.forEach(p => (totals[p.status] += 1));
    return Object.entries(totals)
      .filter(([, v]) => v > 0)
      .map(([key, count]) => ({
        key,
        label: data.statuses[key].label,
        color: data.statuses[key].color,
        count
      }))
      .sort((a, b) => b.count - a.count);
  }

  function byProvince() {
    const tot = {};
    data.projects.forEach(p => {
      if (!tot[p.province]) tot[p.province] = { count: 0, amount: 0, sectors: new Set() };
      tot[p.province].count += 1;
      tot[p.province].amount += p.amount;
      tot[p.province].sectors.add(p.sector);
    });
    return Object.entries(tot).map(([name, v]) => ({
      name,
      region: data.provinces[name] ? data.provinces[name].region : '—',
      count: v.count,
      amount: v.amount,
      sectors: [...v.sectors]
    })).sort((a, b) => b.amount - a.amount);
  }

  // ===== Sector bar chart =====
  let sectorMetric = 'amount';
  const sectorBars = document.getElementById('sectorBars');
  const sectorTotal = document.getElementById('sectorTotal');

  function renderSectorBars() {
    const rows = bySector(sectorMetric);
    const max = Math.max(...rows.map(r => r.value));
    const totalAmount = data.projects.reduce((acc, p) => acc + p.amount, 0);
    const totalCount = data.projects.length;
    sectorTotal.textContent = sectorMetric === 'count'
      ? `${totalCount} proyectos`
      : fmtUSD(totalAmount) + ' total';
    sectorBars.innerHTML = rows.map(r => {
      const pct = max ? Math.round((r.value / max) * 100) : 0;
      const sharePct = sectorMetric === 'count'
        ? Math.round((r.count / totalCount) * 100)
        : Math.round((r.amount / totalAmount) * 100);
      const valueLabel = sectorMetric === 'count'
        ? r.count + ' proy.'
        : fmtUSDshort(r.amount);
      return `
        <div class="bar-row">
          <div class="bar-name"><span class="dot" style="background:${r.color}"></span>${r.label}</div>
          <div class="bar-track"><div class="bar-fill" style="width:${pct}%; background:${r.color}"></div></div>
          <div class="bar-value">${valueLabel}<span class="sub">${sharePct}%</span></div>
        </div>
      `;
    }).join('');
  }

  document.querySelectorAll('.seg-btn').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.seg-btn').forEach(x => {
        x.classList.remove('active');
        x.setAttribute('aria-selected', 'false');
      });
      b.classList.add('active');
      b.setAttribute('aria-selected', 'true');
      sectorMetric = b.dataset.metric;
      renderSectorBars();
    });
  });

  // ===== Status donut =====
  function renderStatusDonut() {
    const rows = byStatus();
    const total = rows.reduce((acc, r) => acc + r.count, 0);
    const svg = document.getElementById('statusDonut');
    const legend = document.getElementById('statusLegend');
    const cx = 80, cy = 80, r = 60;
    const C = 2 * Math.PI * r;
    let offset = 0;
    const segs = rows.map(row => {
      const frac = row.count / total;
      const len = C * frac;
      const seg = `<circle class="donut-seg" cx="${cx}" cy="${cy}" r="${r}"
        stroke="${row.color}"
        stroke-dasharray="${len} ${C - len}"
        stroke-dashoffset="${-offset}"
        transform="rotate(-90 ${cx} ${cy})">
        <title>${row.label}: ${row.count}</title>
      </circle>`;
      offset += len;
      return seg;
    }).join('');
    svg.innerHTML = `
      <circle class="donut-track" cx="${cx}" cy="${cy}" r="${r}"/>
      ${segs}
      <text class="donut-center" x="${cx}" y="${cy - 2}" text-anchor="middle" dominant-baseline="central">${total}</text>
      <text class="donut-sub" x="${cx}" y="${cy + 16}" text-anchor="middle">proyectos</text>
    `;
    legend.innerHTML = rows.map(row => `
      <li>
        <span class="swatch" style="background:${row.color}"></span>
        <span>${row.label}</span>
        <span class="val">${row.count}</span>
      </li>
    `).join('');
  }

  // ===== Province table =====
  function renderProvinceTable() {
    const rows = byProvince();
    const max = Math.max(...rows.map(r => r.amount));
    const totalAmount = rows.reduce((acc, r) => acc + r.amount, 0);
    const tbody = document.querySelector('#provinceTable tbody');
    tbody.innerHTML = rows.map(r => {
      const sharePct = Math.round((r.amount / totalAmount) * 100);
      const widthPct = Math.round((r.amount / max) * 100);
      return `
        <tr>
          <td><span style="font-weight:500">${r.name}</span><span class="prov-region-inline"> · ${r.region}</span></td>
          <td class="hide-sm"><span style="color:var(--text-3); font-size:12px">${r.region}</span></td>
          <td class="num">${r.count}</td>
          <td class="num">${fmtUSDshort(r.amount)} <span class="prov-share-inline">· ${sharePct}%</span></td>
          <td class="share-col hide-sm">
            <div style="display:flex; align-items:center; gap:8px">
              <div class="share-bar" style="flex:1"><span style="width:${widthPct}%"></span></div>
              <span style="font-family:var(--mono); font-size:11px; color:var(--text-2); min-width:30px; text-align:right">${sharePct}%</span>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // ===== Argentina map =====
  // Argentina mainland outline (320x540 viewBox). More detailed schematic
  // tracing real geography: NW Jujuy → north edge → Misiones/Iguazú bulge →
  // Litoral → Río de la Plata indent → Mar del Plata bulge → Patagonia coast
  // with Valdes peninsula → Santa Cruz → mainland S → Andes back up.
  const AR_PATH = [
    "M 88,18",
    "L 130,14 L 175,14 L 215,20",         // north edge (Jujuy → Formosa)
    "L 240,30 L 256,50",                   // NE going to Misiones
    "L 272,68 L 286,90",                   // Misiones / Iguazú bulge
    "L 278,108 L 254,122",                 // Misiones S
    "L 240,148 L 236,178 L 238,202",       // Corrientes / Entre Ríos
    "L 232,218",                            // BA · Río de la Plata indent
    "L 250,238 L 268,260",                 // Mar del Plata bulge
    "L 264,278 L 244,288",                 // Necochea
    "L 218,300 L 192,312",                 // Bahía Blanca
    "L 168,322 L 152,334",                 // Río Negro coast
    "L 158,346 L 168,354",                 // Valdes peninsula (small bulge E)
    "L 152,368 L 138,386",                 // back inland
    "L 128,420 L 122,448",                 // Chubut / Santa Cruz coast
    "L 114,478 L 104,505",                 // San Julián area
    "L 96,520",                             // mainland southern tip
    "L 78,512 L 66,488",                   // back NW across Magallanes
    "L 58,452 L 54,418 L 54,384",          // Andes Chubut
    "L 56,350 L 56,318",                   // Río Negro / Neuquén W
    "L 52,284 L 48,250",                   // Mendoza S Andes
    "L 46,218 L 46,184",                   // Mendoza W
    "L 50,150 L 56,118",                   // San Juan W (the neck)
    "L 64,88 L 72,58",                     // La Rioja / Catamarca / Salta W
    "L 80,30",                              // Jujuy W
    "Z"
  ].join(" ");
  // Tierra del Fuego (Argentine sector) — small separate shape
  const TDF_PATH = "M 104,526 L 132,526 L 138,538 L 110,540 Z";

  function renderMap() {
    const svg = document.getElementById('arMap');
    const tip = document.getElementById('mapTip');
    if (!svg) return;

    const provData = byProvince();
    const max = Math.max(...provData.map(p => p.amount));
    // Bubble radius: sqrt scale so area ~ amount
    const minR = 7, maxR = 22;
    const rOf = (amount) => {
      const t = Math.sqrt(amount / max);
      return minR + (maxR - minR) * t;
    };

    // Label nudges per province (dx negative = right-aligned to the LEFT of bubble)
    const labelOffset = {
      'Jujuy':        { dx: 14, dy: 3 },
      'Salta':        { dx: 16, dy: 3 },
      'Catamarca':    { dx: -14, dy: 3 },
      'Santa Fe':     { dx: 16, dy: 3 },
      'San Juan':     { dx: -22, dy: 3 },
      'Mendoza':      { dx: -16, dy: 3 },
      'Buenos Aires': { dx: 14, dy: 3 },
      'Neuquén':      { dx: -16, dy: 3 },
      'Río Negro':    { dx: 28, dy: 3 }
    };

    let bubbles = '';
    let labels = '';
    provData.forEach(p => {
      const coords = data.provinces[p.name];
      if (!coords) return;
      const r = rOf(p.amount);
      bubbles += `<circle class="ar-bubble" cx="${coords.x}" cy="${coords.y}" r="${r}"
        data-name="${p.name}" data-amount="${p.amount}" data-count="${p.count}"/>`;
      const off = labelOffset[p.name] || { dx: 12, dy: 0 };
      const anchor = off.dx < 0 ? 'end' : 'start';
      labels += `<text class="ar-label" x="${coords.x + off.dx}" y="${coords.y + off.dy}" text-anchor="${anchor}">${p.name} · ${p.count}</text>`;
    });

    svg.innerHTML = `
      <path class="ar-land" d="${AR_PATH}"/>
      <path class="ar-land" d="${TDF_PATH}"/>
      ${bubbles}
      ${labels}
    `;

    // tooltip
    const wrap = svg.parentElement;
    svg.querySelectorAll('.ar-bubble').forEach(c => {
      c.addEventListener('mousemove', (e) => {
        const rect = wrap.getBoundingClientRect();
        tip.innerHTML = `<strong>${c.dataset.name}</strong> · ${c.dataset.count} proy.<br><small>${fmtUSDshort(+c.dataset.amount)}</small>`;
        tip.style.left = (e.clientX - rect.left) + 'px';
        tip.style.top = (e.clientY - rect.top - 8) + 'px';
        tip.classList.add('show');
      });
      c.addEventListener('mouseleave', () => tip.classList.remove('show'));
    });
  }

  // ===== Projects table =====
  const list = document.getElementById('projectList');
  const emptyState = document.getElementById('emptyState');
  const search = document.getElementById('projectSearch');
  let currentFilter = 'all';
  let currentSort = { key: 'amount', dir: 'desc' };
  let openIds = new Set();

  // pill counts already in HTML, just sync hover

  function statusKey(s) { return s; }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  const MONTHS = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const MONTHS_LONG = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  function fmtDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso + 'T12:00:00Z');
    return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  }
  function fmtDateLong(iso) {
    if (!iso) return '—';
    const d = new Date(iso + 'T12:00:00Z');
    return `${d.getUTCDate()} de ${MONTHS_LONG[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
  }
  const COUNTRY_LABELS = {
    AR: 'Argentina', GB: 'Reino Unido', AU: 'Australia', CA: 'Canadá',
    CN: 'China', US: 'EE.UU.', CH: 'Suiza', ES: 'España', LU: 'Luxemburgo',
    BM: 'Bermudas', NO: 'Noruega'
  };

  function filteredProjects() {
    const q = (search.value || '').trim().toLowerCase();
    return data.projects.filter(p => {
      if (currentFilter !== 'all' && p.sector !== currentFilter) return false;
      if (!q) return true;
      const hay = (p.name + ' ' + p.company + ' ' + p.province + ' ' + p.location).toLowerCase();
      return hay.includes(q);
    });
  }

  function sortProjects(arr) {
    const { key, dir } = currentSort;
    const mult = dir === 'asc' ? 1 : -1;
    return [...arr].sort((a, b) => {
      const A = a[key], B = b[key];
      if (typeof A === 'number') return (A - B) * mult;
      return String(A).localeCompare(String(B), 'es') * mult;
    });
  }

  function renderProjects() {
    const filtered = sortProjects(filteredProjects());
    if (!filtered.length) {
      list.innerHTML = '';
      emptyState.hidden = false;
    } else {
      emptyState.hidden = true;
      list.innerHTML = filtered.map(p => renderRow(p)).join('');
    }
    // header sort indicator
    document.querySelectorAll('.projects-table th[data-sort]').forEach(th => {
      th.classList.toggle('sorted', th.dataset.sort === currentSort.key);
      th.classList.toggle('asc', th.dataset.sort === currentSort.key && currentSort.dir === 'asc');
    });
  }

  function renderRow(p) {
    const isOpen = openIds.has(p.id);
    const statusInfo = data.statuses[p.status];
    return `
      <tr class="project-row ${isOpen ? 'open' : ''}" data-id="${p.id}">
        <td class="col-num">${String(p.id).padStart(2, '0')}</td>
        <td>
          <div class="proj-name">${escapeHtml(p.name)}</div>
          <div class="proj-meta">${escapeHtml(p.location)}</div>
        </td>
        <td class="hide-sm">${escapeHtml(p.company)}</td>
        <td><span class="tag ${p.sector}"><span class="dot dot-${p.sector}"></span>${data.sectors[p.sector].label}</span></td>
        <td class="hide-sm">${escapeHtml(p.province)}</td>
        <td class="num proj-amount">${fmtUSDshort(p.amount)}</td>
        <td class="hide-md"><span class="status ${p.status}"><span class="sdot"></span>${statusInfo.label}</span></td>
        <td class="col-arrow"><span class="arrow"></span></td>
      </tr>
      ${isOpen ? renderDetail(p) : ''}
    `;
  }

  function renderDetail(p) {
    const country = p.companyCountry ? (COUNTRY_LABELS[p.companyCountry] || p.companyCountry) : null;
    const jobs = p.directJobs ? p.directJobs.toLocaleString('es-AR') : null;
    const exports = p.annualExportsUSDm ? `US$${p.annualExportsUSDm} M/año` : null;
    return `
      <tr class="detail-row">
        <td colspan="8">
          <div class="detail">
            <div>
              <h4>Descripción</h4>
              <p class="muted">${escapeHtml(p.description)}</p>
              <dl style="margin-top:14px">
                <dt>Empresa</dt><dd>${escapeHtml(p.companies)}</dd>
                ${country ? `<dt>Origen</dt><dd>${country}</dd>` : ''}
                <dt>Ubicación</dt><dd>${escapeHtml(p.location)}</dd>
                <dt>Estado</dt><dd><span class="status ${p.status}"><span class="sdot"></span>${data.statuses[p.status].label}</span></dd>
                <dt>Inversión</dt><dd>${fmtUSD(p.amount)}</dd>
                ${jobs ? `<dt>Empleos</dt><dd>${jobs} directos</dd>` : ''}
                ${exports ? `<dt>Exportaciones</dt><dd>${exports}</dd>` : ''}
              </dl>
            </div>
            <div>
              <h4>Hitos</h4>
              <dl>
                <dt>Aprobado RIGI</dt><dd>${fmtDateLong(p.approvalDate)}</dd>
                <dt>Op. estimada</dt><dd>${escapeHtml(p.operationalDate || '—')}</dd>
              </dl>
              <h4 style="margin-top:14px">Timeline</h4>
              <p class="muted">${escapeHtml(p.timeline)}</p>
              <h4 style="margin-top:14px">Impacto esperado</h4>
              <p class="muted">${escapeHtml(p.impact)}</p>
            </div>
            <div class="full">
              <h4>Oportunidades de negocio</h4>
              <ul>
                ${p.opportunities.map(o => `<li>${escapeHtml(o)}</li>`).join('')}
              </ul>
            </div>
            ${p.ticker ? renderTickerShell(p) : ''}
          </div>
        </td>
      </tr>
    `;
  }

  function renderTickerShell(p) {
    return `
      <div class="ticker" data-ticker="${p.ticker}" data-ticker-name="${escapeHtml(p.tickerName || '')}" data-ticker-exch="${p.tickerExchange || ''}" data-project-id="${p.id}">
        <div class="ticker-head">
          <div class="ticker-id">
            <span class="ticker-symbol">${escapeHtml(p.ticker)}</span>
            <span class="ticker-exch">${escapeHtml(p.tickerExchange || '')}</span>
            <span class="ticker-name">· ${escapeHtml(p.tickerName || '')}</span>
          </div>
          <div class="ticker-ranges" role="tablist" aria-label="Rango de tiempo">
            <button class="ticker-range" data-range="1d" role="tab" aria-selected="false">1D</button>
            <button class="ticker-range active" data-range="5d" role="tab" aria-selected="true">7D</button>
            <button class="ticker-range" data-range="1mo" role="tab" aria-selected="false">30D</button>
            <button class="ticker-range" data-range="3mo" role="tab" aria-selected="false">3M</button>
          </div>
        </div>
        <div class="ticker-body">
          <div class="ticker-skel"></div>
        </div>
      </div>
    `;
  }

  // Row click → toggle expand (ignore clicks inside the expanded detail)
  list.addEventListener('click', (e) => {
    if (e.target.closest('.detail-row')) return;
    const row = e.target.closest('.project-row');
    if (!row) return;
    const id = +row.dataset.id;
    if (openIds.has(id)) openIds.delete(id); else openIds.add(id);
    renderProjects();
    if (openIds.has(id)) {
      const tk = document.querySelector(`.detail-row .ticker[data-project-id="${id}"]`);
      if (tk) loadTicker(tk, '5d');
    }
  });

  // Ticker range tabs (delegated)
  list.addEventListener('click', (e) => {
    const btn = e.target.closest('.ticker-range');
    if (!btn) return;
    e.stopPropagation();
    const wrap = btn.closest('.ticker');
    if (!wrap) return;
    wrap.querySelectorAll('.ticker-range').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    loadTicker(wrap, btn.dataset.range);
  });

  // Filter pills
  document.querySelectorAll('.pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pill').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      currentFilter = btn.dataset.filter;
      openIds.clear();
      renderProjects();
    });
  });

  // Sort
  document.querySelectorAll('.projects-table th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      if (currentSort.key === key) {
        currentSort.dir = currentSort.dir === 'asc' ? 'desc' : 'asc';
      } else {
        currentSort.key = key;
        currentSort.dir = (key === 'amount' || key === 'id') ? 'desc' : 'asc';
      }
      renderProjects();
    });
  });

  // Search
  let searchT;
  search.addEventListener('input', () => {
    clearTimeout(searchT);
    searchT = setTimeout(renderProjects, 80);
  });

  // Counts in pills (in case data changes)
  document.querySelectorAll('.pill-count').forEach(el => {
    const k = el.parentElement.dataset.filter;
    const n = k === 'all' ? data.projects.length : data.projects.filter(p => p.sector === k).length;
    el.textContent = n;
  });

  // Mobile menu toggle
  const toggle = document.getElementById('topnavToggle');
  const nav = document.querySelector('.topnav');
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  // Close mobile menu when a link is tapped
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    if (window.innerWidth <= 768) {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  }));

  // ===== Hero approval timeline =====
  // Renders in pixel space (viewBox === rendered size) so circles never get
  // distorted on narrow viewports. Re-renders on resize (debounced).
  function renderApprovalTimeline() {
    const svg = document.getElementById('atlSvg');
    const wrap = document.getElementById('atlChart');
    const tip = document.getElementById('atlTip');
    if (!svg || !wrap) return;

    // Compute pixel viewport. Width matches wrap inner width; height responds.
    const wrapRect = wrap.getBoundingClientRect();
    const W = Math.max(320, Math.round(wrapRect.width || 1100));
    const mobile = W < 640;
    const H = mobile ? 240 : 220;

    const padL = mobile ? 78 : 96;
    const padR = mobile ? 12 : 24;
    const padT = 18;
    const padB = mobile ? 36 : 32;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    const startDate = new Date('2025-01-01T00:00:00Z');
    const endDate = new Date('2026-06-01T00:00:00Z');
    const dateRange = endDate - startDate;
    const xOf = (iso) => {
      const d = new Date(iso + 'T12:00:00Z');
      return padL + ((d - startDate) / dateRange) * plotW;
    };

    const laneOrder = ['oilgas', 'mining', 'energy', 'infrastructure'];
    const laneZoneH = plotH * 0.62;
    const laneZoneTop = padT;
    const laneStep = laneZoneH / 4;
    const laneY = (sector) => laneZoneTop + laneOrder.indexOf(sector) * laneStep + laneStep / 2;

    const maxAmount = Math.max(...data.projects.map(p => p.amount));
    const rMin = mobile ? 3 : 4;
    const rMax = mobile ? 9 : 12;
    const rOf = (amount) => rMin + Math.sqrt(amount / maxAmount) * (rMax - rMin);

    const cumTop = padT + plotH * 0.70;
    const cumBottom = padT + plotH;
    const cumH = cumBottom - cumTop;
    const sorted = [...data.projects].sort((a, b) => a.approvalDate.localeCompare(b.approvalDate));
    const totalAmount = sorted.reduce((acc, p) => acc + p.amount, 0);

    let cum = 0;
    const linePts = [[padL, cumBottom]];
    sorted.forEach(p => {
      const x = xOf(p.approvalDate);
      linePts.push([x, cumBottom - (cum / totalAmount) * cumH]);
      cum += p.amount;
      linePts.push([x, cumBottom - (cum / totalAmount) * cumH]);
    });
    linePts.push([padL + plotW, cumBottom - (cum / totalAmount) * cumH]);
    const areaPts = [...linePts, [padL + plotW, cumBottom]];
    const cumPath = 'M ' + areaPts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' L ') + ' Z';
    const cumLinePath = 'M ' + linePts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' L ');

    // Month grid + labels
    const months = [];
    const cursor = new Date(startDate);
    while (cursor < endDate) {
      months.push(new Date(cursor));
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
    // Decide label spacing based on available width so we don't overlap on mobile.
    const minLabelPx = 56;
    const labelStrideMonths = Math.max(1, Math.ceil(months.length * minLabelPx / plotW));
    const monthLabels = months.map((m, i) => {
      const mi = m.getUTCMonth();
      const yi = m.getUTCFullYear();
      const x = xOf(m.toISOString().slice(0, 10));
      const showLabel = i % labelStrideMonths === 0;
      const label = showLabel
        ? `${MONTHS[mi]}${mi === 0 || i === 0 ? "'" + String(yi).slice(2) : ''}`
        : null;
      return { x, label };
    });

    const gridLines = monthLabels.filter(m => m.label).map(m =>
      `<line class="atl-grid" x1="${m.x.toFixed(1)}" y1="${padT}" x2="${m.x.toFixed(1)}" y2="${(padT + plotH).toFixed(1)}"/>`
    ).join('');
    const xAxis = monthLabels.filter(m => m.label).map(m =>
      `<text class="atl-axis" x="${m.x.toFixed(1)}" y="${(H - 12).toFixed(1)}" text-anchor="middle">${m.label}</text>`
    ).join('');

    const laneLabels = laneOrder.map((s, i) => {
      const y = laneZoneTop + i * laneStep + laneStep / 2 + 3;
      const text = mobile && data.sectors[s].label === 'Infraestructura' ? 'Infra' : data.sectors[s].label;
      return `<text class="atl-lane-label" x="${(padL - 8).toFixed(1)}" y="${y.toFixed(1)}">${text}</text>`;
    }).join('');

    const laneSep = laneOrder.slice(1).map((_, i) => {
      const y = laneZoneTop + (i + 1) * laneStep;
      return `<line class="atl-grid" x1="${padL}" y1="${y.toFixed(1)}" x2="${(padL + plotW).toFixed(1)}" y2="${y.toFixed(1)}"/>`;
    }).join('');

    // Same-sector-same-date bubble jitter (offsetting along the lane horizontally)
    const seen = {};
    const bubbles = data.projects.map(p => {
      const key = p.sector + p.approvalDate;
      const idx = seen[key] || 0;
      seen[key] = idx + 1;
      let x = xOf(p.approvalDate);
      const r = rOf(p.amount);
      if (idx > 0) {
        const dir = idx % 2 === 1 ? 1 : -1;
        x += dir * (r * 0.9) * Math.ceil(idx / 2);
      }
      const y = laneY(p.sector);
      return `<circle class="atl-bubble" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}"
        fill="${data.sectors[p.sector].color}"
        data-id="${p.id}"
        data-name="${escapeHtml(p.name)}"
        data-amount="${p.amount}"
        data-date="${p.approvalDate}"
        data-sector="${data.sectors[p.sector].label}"/>`;
    }).join('');

    const totalLabel = 'US$' + (totalAmount / 1000).toFixed(2).replace(/\.?0+$/, '') + ' MM';

    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('width', String(W));
    svg.setAttribute('height', String(H));
    svg.innerHTML = `
      ${gridLines}
      ${laneSep}
      ${laneLabels}
      <path class="atl-cum" d="${cumPath}"/>
      <path class="atl-cum" d="${cumLinePath}" fill="none"/>
      <text class="atl-axis" x="${(padL - 8).toFixed(1)}" y="${(cumBottom + 4).toFixed(1)}" text-anchor="end">US$0</text>
      <text class="atl-axis" x="${(padL - 8).toFixed(1)}" y="${(cumTop + 4).toFixed(1)}" text-anchor="end">${totalLabel}</text>
      ${bubbles}
      ${xAxis}
    `;

    const legend = document.getElementById('atlLegend');
    if (legend) {
      legend.innerHTML = laneOrder.map(s =>
        `<span><span class="ldot" style="background:${data.sectors[s].color}"></span>${data.sectors[s].label}</span>`
      ).join('') + `<span style="color:var(--text-3)"><span class="ldot" style="background:${getComputedStyle(document.documentElement).getPropertyValue('--blue').trim() || '#2563eb'}; opacity:.45"></span>acumulado</span>`;
    }

    // Bubble hover/click interactions
    svg.querySelectorAll('.atl-bubble').forEach(c => {
      c.addEventListener('mousemove', (e) => {
        const rect = wrap.getBoundingClientRect();
        tip.innerHTML = `<strong>${c.dataset.name}</strong> · ${c.dataset.sector}<small>${fmtDate(c.dataset.date)} · ${fmtUSDshort(+c.dataset.amount)}</small>`;
        tip.style.left = (e.clientX - rect.left) + 'px';
        tip.style.top = (e.clientY - rect.top - 8) + 'px';
        tip.classList.add('show');
      });
      c.addEventListener('mouseleave', () => tip.classList.remove('show'));
      c.addEventListener('click', () => {
        const id = +c.dataset.id;
        openIds.clear();
        openIds.add(id);
        document.querySelector('.pill[data-filter="all"]').click();
        renderProjects();
        const row = document.querySelector(`.project-row[data-id="${id}"]`);
        if (row) row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const tk = document.querySelector(`.detail-row .ticker[data-project-id="${id}"]`);
        if (tk) loadTicker(tk, '5d');
      });
    });
  }

  let atlResizeT;
  window.addEventListener('resize', () => {
    clearTimeout(atlResizeT);
    atlResizeT = setTimeout(renderApprovalTimeline, 120);
  });

  // ===== Stock ticker fetch + render =====
  // Hits our own /api/stock Vercel function. It tries Yahoo Finance first
  // (for sparkline + meta) and falls back to Stooq (for current quote without
  // sparkline) when Yahoo is rate-limiting. The `sparkline` flag tells us
  // whether the response has historical points or only a current snapshot.
  async function fetchStock(ticker, range) {
    try {
      const r = await fetch(`/api/stock?symbol=${encodeURIComponent(ticker)}&range=${encodeURIComponent(range)}`, { mode: 'cors' });
      if (!r.ok) return null;
      const json = await r.json();
      const ts = json.timestamp || [];
      const closes = json.close || [];
      const points = ts.map((t, i) => ({ t: t * 1000, c: closes[i] })).filter(p => p.c != null);
      return {
        meta: json.meta || {},
        points,
        source: json.source || 'unknown',
        sparkline: !!json.sparkline && points.length > 0
      };
    } catch (e) {
      return null;
    }
  }

  async function loadTicker(wrap, range) {
    const ticker = wrap.dataset.ticker;
    const body = wrap.querySelector('.ticker-body');
    body.innerHTML = '<div class="ticker-skel"></div>';
    const data = await fetchStock(ticker, range);
    if (!data) {
      body.innerHTML = `<div class="ticker-status error">No se pudieron cargar los datos en vivo. <a href="https://finance.yahoo.com/quote/${encodeURIComponent(ticker)}" target="_blank" rel="noopener" style="color:var(--blue)">Ver en Yahoo Finance →</a></div>`;
      return;
    }
    if (!data.sparkline) {
      renderTickerSnapshot(body, data, range, ticker);
      return;
    }
    renderTickerChart(body, data, range, ticker);
  }

  function renderTickerSnapshot(body, data, range, ticker) {
    const m = data.meta || {};
    const currency = m.currency || 'USD';
    const symPrefix = currency === 'USD' ? 'US$' : (currency + ' ');
    const price = m.regularMarketPrice;
    const open = m.regularMarketOpen;
    const high = m.regularMarketDayHigh;
    const low = m.regularMarketDayLow;
    const vol = m.regularMarketVolume;
    const change = (price != null && open != null) ? price - open : null;
    const pct = (change != null && open) ? (change / open) * 100 : null;
    const dir = change == null ? 'flat' : change > 0.001 ? 'up' : change < -0.001 ? 'down' : 'flat';
    const changeStr = change == null ? '' :
      (change >= 0 ? '+' : '') + symPrefix + Math.abs(change).toFixed(2) +
      (pct != null ? ' · ' + (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%' : '');

    body.innerHTML = `
      <div class="ticker-price-block">
        <span class="ticker-price">${price != null ? symPrefix + price.toFixed(2) : '—'}</span>
        ${changeStr ? `<span class="ticker-change ${dir}">${changeStr}</span>` : ''}
        <span style="color:var(--text-3); font-size:11px">cambio del día</span>
      </div>
      <div class="ticker-status" style="margin-top:8px; background:var(--surface); padding:10px 12px; border-radius:6px; border:1px solid var(--border)">
        Histórico de ${range === '1d' ? '1 día' : range === '5d' ? '7 días' : range === '1mo' ? '30 días' : '3 meses'} no disponible en este momento. Mostrando cotización actual desde Stooq.
        <a href="https://finance.yahoo.com/quote/${encodeURIComponent(ticker)}/chart" target="_blank" rel="noopener" style="color:var(--blue); margin-left:6px">Ver gráfico en Yahoo Finance ↗</a>
      </div>
      <div class="ticker-meta">
        ${open != null ? `<span>Apertura <strong>${symPrefix}${open.toFixed(2)}</strong></span>` : ''}
        ${high != null ? `<span>Máx día <strong>${symPrefix}${high.toFixed(2)}</strong></span>` : ''}
        ${low != null ? `<span>Mín día <strong>${symPrefix}${low.toFixed(2)}</strong></span>` : ''}
        ${vol != null ? `<span>Vol <strong>${(vol / 1e6).toFixed(2)}M</strong></span>` : ''}
      </div>
    `;
  }

  function renderTickerChart(body, data, range, ticker) {
    const pts = data.points;
    if (pts.length < 2) {
      body.innerHTML = `<div class="ticker-status">Sin suficientes datos para el rango ${range}.</div>`;
      return;
    }
    const first = pts[0].c;
    const last = pts[pts.length - 1].c;
    const change = last - first;
    const pct = (change / first) * 100;
    const dir = change > 0.0001 ? 'up' : change < -0.0001 ? 'down' : 'flat';
    const currency = data.meta?.currency || 'USD';
    const CURRENCY_SYMBOLS = { USD: 'US$', AUD: 'A$', CAD: 'C$', GBP: '£', EUR: '€', HKD: 'HK$' };
    const symPrefix = CURRENCY_SYMBOLS[currency] || (currency + ' ');

    const W = 800, H = 100;
    const minP = Math.min(...pts.map(p => p.c));
    const maxP = Math.max(...pts.map(p => p.c));
    const span = (maxP - minP) || 1;
    const xOf = (i) => (i / (pts.length - 1)) * W;
    const yOf = (p) => H - 6 - ((p - minP) / span) * (H - 12);
    const linePath = 'M ' + pts.map((p, i) => xOf(i).toFixed(1) + ',' + yOf(p.c).toFixed(1)).join(' L ');
    const areaPath = linePath + ` L ${W},${H} L 0,${H} Z`;
    const baseY = yOf(first);

    // last point dot
    const lastX = xOf(pts.length - 1);
    const lastY = yOf(last);

    const changeStr = (change >= 0 ? '+' : '') + symPrefix + Math.abs(change).toFixed(2) + ' · ' + (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%';
    const priceStr = symPrefix + last.toFixed(2);
    const high = data.meta?.regularMarketDayHigh;
    const low = data.meta?.regularMarketDayLow;
    const vol = data.meta?.regularMarketVolume;
    const prevClose = data.meta?.previousClose;

    const rangeLabel = { '1d': '1 día', '5d': '7 días', '1mo': '30 días', '3mo': '3 meses' }[range] || range;

    body.innerHTML = `
      <div class="ticker-price-block">
        <span class="ticker-price">${priceStr}</span>
        <span class="ticker-change ${dir}">${changeStr}</span>
        <span style="color:var(--text-3); font-size:11px">en ${rangeLabel}</span>
      </div>
      <div class="ticker-chart">
        <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
          <line class="tk-base" x1="0" y1="${baseY.toFixed(1)}" x2="${W}" y2="${baseY.toFixed(1)}"/>
          <path class="tk-area ${dir}" d="${areaPath}"/>
          <path class="tk-line ${dir}" d="${linePath}"/>
          <circle cx="${lastX.toFixed(1)}" cy="${lastY.toFixed(1)}" r="2.5" fill="currentColor" class="tk-line ${dir}"/>
        </svg>
      </div>
      <div class="ticker-meta">
        ${prevClose != null ? `<span>Cierre previo <strong>${symPrefix}${prevClose.toFixed(2)}</strong></span>` : ''}
        ${high != null ? `<span>Máx día <strong>${symPrefix}${high.toFixed(2)}</strong></span>` : ''}
        ${low != null ? `<span>Mín día <strong>${symPrefix}${low.toFixed(2)}</strong></span>` : ''}
        ${vol != null ? `<span>Vol <strong>${(vol / 1e6).toFixed(1)}M</strong></span>` : ''}
        <span><a href="https://finance.yahoo.com/quote/${encodeURIComponent(ticker)}" target="_blank" rel="noopener" style="color:var(--text-3); text-decoration:underline">Yahoo Finance ↗</a></span>
      </div>
    `;
  }

  // Bootstrap
  renderApprovalTimeline();
  renderSectorBars();
  renderStatusDonut();
  renderProvinceTable();
  renderMap();
  renderProjects();
})();
