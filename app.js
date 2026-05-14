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
  // Simplified Argentina outline (320x540 viewBox). Schematic — not cartographic.
  // Goes clockwise from NW: north edge → NE (Misiones) → Atlantic coast → TDF → Andes back up.
  const AR_PATH = [
    "M 100,28",
    "L 138,22 L 178,20 L 215,26",          // north edge (Jujuy → Salta → Formosa)
    "L 240,36 L 252,58 L 256,82 L 244,98", // Misiones/Iguazú bulge
    "L 246,128 L 250,160",                  // Corrientes → Entre Ríos
    "C 260,195 274,235 264,278",            // Río de la Plata / Mar del Plata east bulge
    "L 250,316 L 234,352 L 224,390",        // Buenos Aires south → Patagonia coast
    "L 218,428 L 210,462 L 198,492",        // Chubut → Santa Cruz
    "L 184,512 L 172,520",                  // approaching TDF
    "L 162,514 L 152,500 L 144,486",        // TDF point and back up
    "C 118,478 92,468 78,448",              // SW Patagonia inland curve
    "L 68,412 L 62,376 L 60,338",           // Andes Chubut → Neuquén
    "C 54,298 50,260 60,222",               // the Mendoza/San Juan "neck"
    "L 70,182 L 80,142 L 88,102 L 94,62",   // Andes NW (San Juan → Salta W)
    "Z"
  ].join(" ");

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
    return `
      <tr class="detail-row">
        <td colspan="8">
          <div class="detail">
            <div>
              <h4>Descripción</h4>
              <p class="muted">${escapeHtml(p.description)}</p>
              <dl style="margin-top:14px">
                <dt>Empresa</dt><dd>${escapeHtml(p.companies)}</dd>
                <dt>Ubicación</dt><dd>${escapeHtml(p.location)}</dd>
                <dt>Estado</dt><dd><span class="status ${p.status}"><span class="sdot"></span>${data.statuses[p.status].label}</span></dd>
                <dt>Inversión</dt><dd>${fmtUSD(p.amount)}</dd>
              </dl>
            </div>
            <div>
              <h4>Timeline</h4>
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
          </div>
        </td>
      </tr>
    `;
  }

  // Row click → toggle expand
  list.addEventListener('click', (e) => {
    const row = e.target.closest('.project-row');
    if (!row) return;
    const id = +row.dataset.id;
    if (openIds.has(id)) openIds.delete(id); else openIds.add(id);
    renderProjects();
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

  // Bootstrap
  renderSectorBars();
  renderStatusDonut();
  renderProvinceTable();
  renderMap();
  renderProjects();
})();
