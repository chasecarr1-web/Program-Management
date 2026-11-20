/* Lightweight dependency-free SVG charts with hover tooltips and click-through */
(function (E) {
  const { U } = E;
  const CH = (E.Charts = {});

  // Categorical palette (validated for CVD separation on the navy chart surface)
  CH.SERIES = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#0ca30c', '#9085e9', '#e66767'];
  // Reserved status palette
  CH.STATUS = { good: '#0ca30c', warning: '#fab219', serious: '#ec835a', critical: '#d03b3b', info: '#3987e5', neutral: '#5b6b85' };

  const specs = new Map();
  let seq = 0;

  /** Returns a placeholder; chart is drawn after the view is mounted (needs width). */
  CH.slot = function (spec, cls = '') {
    const id = `ch${++seq}`;
    specs.set(id, spec);
    return `<div class="chart ${cls}" id="${id}" style="height:${spec.height || 240}px"></div>`;
  };
  CH.drawAll = function () {
    specs.forEach((spec, id) => {
      const el = document.getElementById(id);
      if (!el) {
        specs.delete(id);
        return;
      }
      draw(el, spec);
    });
  };
  CH.clear = () => specs.clear();

  function draw(el, spec) {
    const w = Math.max(200, el.clientWidth);
    const h = spec.height || 240;
    let svg = '';
    if (spec.type === 'bar') svg = bar(spec, w, h);
    else if (spec.type === 'hbar') svg = hbar(spec, w, h);
    else if (spec.type === 'line') svg = line(spec, w, h);
    else if (spec.type === 'donut') svg = donut(spec, w, h);
    const legend = legendHtml(spec);
    el.innerHTML = (legend ? legend : '') + svg;
  }

  function legendHtml(spec) {
    let items = [];
    if (spec.type === 'donut') items = spec.items.map((d, i) => ({ name: d.label, color: d.color || CH.SERIES[i % 8], value: d.value }));
    else if (spec.series && spec.series.length > 1) items = spec.series.map((s, i) => ({ name: s.name, color: s.color || CH.SERIES[i % 8] }));
    if (!items.length || spec.legend === false) return '';
    return `<div class="legend">${items
      .map(
        (it) =>
          `<span class="lg-item"><i style="background:${it.color}"></i>${U.esc(it.name)}${
            it.value != null && spec.type === 'donut' ? ` <b>${spec.fmt ? spec.fmt(it.value) : it.value}</b>` : ''
          }</span>`
      )
      .join('')}</div>`;
  }

  const nice = (max) => {
    if (max <= 0) return 1;
    const exp = Math.pow(10, Math.floor(Math.log10(max)));
    const f = max / exp;
    const n = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
    return n * exp;
  };
  // whole-number data with a small range gets one gridline per unit instead of fractional ticks
  const tickCount = (vals, span) => {
    const ints = vals.every((v) => v == null || Number.isInteger(v));
    if (ints && span <= 8 && span >= 1) return span;
    return 4;
  };
  const fmtDefault = (v) => (Math.abs(v) >= 1000 ? U.money(v, true).replace('$', '') : U.num(v, v % 1 ? 1 : 0));
  const legendH = (spec) => (spec.type === 'donut' || (spec.series && spec.series.length > 1 && spec.legend !== false) ? 26 : 0);

  function clickAttrs(spec, label) {
    if (!spec.click) return '';
    const v = spec.click.values ? spec.click.values[label] ?? label : label;
    return ` data-action="${spec.click.action}" data-key="${U.attr(spec.click.key || '')}" data-val="${U.attr(v)}" style="cursor:pointer"`;
  }
  // bar path with 4px rounded data end, square at baseline
  function vbarPath(x, y, bw, bh, r) {
    if (bh <= 0) return '';
    r = Math.min(r, bw / 2, bh);
    return `M${x},${y + bh}V${y + r}Q${x},${y} ${x + r},${y}H${x + bw - r}Q${x + bw},${y} ${x + bw},${y + r}V${y + bh}Z`;
  }
  function hbarPath(x, y, bw, bh, r) {
    if (bw <= 0) return '';
    r = Math.min(r, bh / 2, bw);
    return `M${x},${y}H${x + bw - r}Q${x + bw},${y} ${x + bw},${y + r}V${y + bh - r}Q${x + bw},${y + bh} ${x + bw - r},${y + bh}H${x}Z`;
  }

  function bar(spec, w, h) {
    const H = h - legendH(spec);
    const { labels, series } = spec;
    const fmt = spec.fmt || fmtDefault;
    const stacked = spec.stacked;
    const m = { t: 14, r: 10, b: spec.rotate ? 58 : 30, l: 44 };
    const iw = w - m.l - m.r;
    const ih = H - m.t - m.b;
    let max = 0;
    let min = 0;
    labels.forEach((_, i) => {
      if (stacked) max = Math.max(max, series.reduce((s, se) => s + Math.max(0, se.values[i] || 0), 0));
      else
        series.forEach((se) => {
          max = Math.max(max, se.values[i] || 0);
          min = Math.min(min, se.values[i] || 0);
        });
    });
    const top = nice(max || 1);
    const bot = min < 0 ? -nice(-min) : 0;
    const span = top - bot;
    const nT = tickCount(series.flatMap((x) => x.values), span);
    const y = (v) => m.t + ih * (1 - (v - bot) / span);
    const band = iw / labels.length;
    const groupW = Math.min(band * 0.72, stacked ? 46 : 22 * series.length + 8);
    let g = '';
    for (let i = 0; i <= nT; i++) {
      const v = bot + (span * i) / nT;
      g += `<line class="grid" x1="${m.l}" x2="${w - m.r}" y1="${y(v)}" y2="${y(v)}"/><text class="axis" x="${m.l - 6}" y="${y(v) + 4}" text-anchor="end">${fmt(v)}</text>`;
    }
    let marks = '';
    labels.forEach((lab, i) => {
      const cx = m.l + band * i + band / 2;
      const tipParts = series.map((se, si) => `${se.name}: ${fmt(se.values[i] || 0)}`).join('<br>');
      if (stacked) {
        let acc = 0;
        const x = cx - groupW / 2;
        const nonzero = series.map((se, si) => [se, si]).filter(([se]) => (se.values[i] || 0) > 0);
        nonzero.forEach(([se, si], k) => {
          const v = se.values[i] || 0;
          const y0 = y(acc);
          const y1 = y(acc + v);
          const isTop = k === nonzero.length - 1;
          const hh = Math.max(0, y0 - y1 - (k > 0 ? 2 : 0));
          const yy = y1;
          marks += isTop
            ? `<path d="${vbarPath(x, yy, groupW, hh, 4)}" fill="${se.color || CH.SERIES[si % 8]}"/>`
            : `<rect x="${x}" y="${yy}" width="${groupW}" height="${hh}" fill="${se.color || CH.SERIES[si % 8]}"/>`;
          acc += v;
        });
        const total = series.reduce((s, se) => s + (se.values[i] || 0), 0);
        if (spec.totals !== false && total > 0) marks += `<text class="val" x="${cx}" y="${y(total) - 5}" text-anchor="middle">${fmt(total)}</text>`;
      } else {
        const bw = (groupW - 2 * (series.length - 1)) / series.length;
        series.forEach((se, si) => {
          const v = se.values[i] || 0;
          const x = cx - groupW / 2 + si * (bw + 2);
          const color = (se.colors && se.colors[i]) || se.color || CH.SERIES[si % 8];
          if (v >= 0) marks += `<path d="${vbarPath(x, y(v), bw, y(0) - y(v), 4)}" fill="${color}"/>`;
          else marks += `<rect x="${x}" y="${y(0)}" width="${bw}" height="${y(v) - y(0)}" rx="2" fill="${color}"/>`;
          if (spec.values && series.length === 1) marks += `<text class="val" x="${x + bw / 2}" y="${(v >= 0 ? y(v) : y(v) + 12) - 5}" text-anchor="middle">${fmt(v)}</text>`;
        });
      }
      const lx = cx;
      const ly = H - m.b + 16;
      const short = String(lab).length > 14 ? String(lab).slice(0, 13) + '…' : lab;
      marks += spec.rotate
        ? `<text class="axis" transform="translate(${lx},${ly - 6}) rotate(-35)" text-anchor="end">${U.esc(short)}</text>`
        : `<text class="axis" x="${lx}" y="${ly}" text-anchor="middle">${U.esc(short)}</text>`;
      marks += `<rect class="hit" x="${m.l + band * i}" y="${m.t}" width="${band}" height="${ih}" data-tip="<b>${U.attr(lab)}</b><br>${U.attr(tipParts)}"${clickAttrs(spec, lab)}/>`;
    });
    const base = `<line class="baseline" x1="${m.l}" x2="${w - m.r}" y1="${y(0)}" y2="${y(0)}"/>`;
    return `<svg width="${w}" height="${H}" role="img" aria-label="${U.attr(spec.title || 'bar chart')}">${g}${base}${marks}</svg>`;
  }

  function hbar(spec, w, h) {
    const H = h - legendH(spec);
    const { labels, series } = spec;
    const fmt = spec.fmt || fmtDefault;
    const lw = spec.labelWidth || Math.min(170, Math.max(80, Math.max(...labels.map((l) => String(l).length)) * 6.6));
    const m = { t: 6, r: 46, b: 6, l: lw + 10 };
    const iw = w - m.l - m.r;
    const band = (H - m.t - m.b) / labels.length;
    const bh = Math.min(18, band * 0.66);
    const totals = labels.map((_, i) => series.reduce((s, se) => s + (se.values[i] || 0), 0));
    const max = nice(Math.max(...totals, 1));
    const x = (v) => (iw * v) / max;
    let out = '';
    labels.forEach((lab, i) => {
      const cy = m.t + band * i + band / 2;
      let acc = 0;
      const nonzero = series.map((se, si) => [se, si]).filter(([se]) => (se.values[i] || 0) > 0);
      nonzero.forEach(([se, si], k) => {
        const v = se.values[i] || 0;
        const xx = m.l + x(acc) + (k > 0 ? 2 : 0);
        const ww = Math.max(0, x(v) - (k > 0 ? 2 : 0));
        const color = (se.colors && se.colors[i]) || se.color || CH.SERIES[si % 8];
        out +=
          k === nonzero.length - 1
            ? `<path d="${hbarPath(xx, cy - bh / 2, ww, bh, 4)}" fill="${color}"/>`
            : `<rect x="${xx}" y="${cy - bh / 2}" width="${ww}" height="${bh}" fill="${color}"/>`;
        acc += v;
      });
      const short = String(lab).length > 26 ? String(lab).slice(0, 25) + '…' : lab;
      out += `<text class="axis lbl" x="${m.l - 8}" y="${cy + 4}" text-anchor="end">${U.esc(short)}</text>`;
      out += `<text class="val" x="${m.l + x(totals[i]) + 6}" y="${cy + 4}">${fmt(totals[i])}</text>`;
      const tip = series.length > 1 ? series.map((se) => `${se.name}: ${fmt(se.values[i] || 0)}`).join('<br>') : fmt(totals[i]);
      out += `<rect class="hit" x="0" y="${m.t + band * i}" width="${w}" height="${band}" data-tip="<b>${U.attr(lab)}</b><br>${U.attr(tip)}"${clickAttrs(spec, lab)}/>`;
    });
    out = `<line class="baseline" x1="${m.l}" x2="${m.l}" y1="${m.t}" y2="${H - m.b}"/>` + out;
    return `<svg width="${w}" height="${H}" role="img" aria-label="${U.attr(spec.title || 'bar chart')}">${out}</svg>`;
  }

  function line(spec, w, h) {
    const H = h - legendH(spec);
    const { labels, series } = spec;
    const fmt = spec.fmt || fmtDefault;
    const m = { t: 14, r: 16, b: 30, l: 44 };
    const iw = w - m.l - m.r;
    const ih = H - m.t - m.b;
    const max = nice(Math.max(1, ...series.flatMap((s) => s.values.filter((v) => v != null))) * (spec.yMaxPad || 1));
    const top = spec.yMax || max;
    const x = (i) => m.l + (labels.length === 1 ? iw / 2 : (iw * i) / (labels.length - 1));
    const y = (v) => m.t + ih * (1 - v / top);
    const nT = tickCount(series.flatMap((x) => x.values), top);
    let g = '';
    for (let i = 0; i <= nT; i++) {
      const v = (top * i) / nT;
      g += `<line class="grid" x1="${m.l}" x2="${w - m.r}" y1="${y(v)}" y2="${y(v)}"/><text class="axis" x="${m.l - 6}" y="${y(v) + 4}" text-anchor="end">${fmt(v)}</text>`;
    }
    const step = Math.ceil(labels.length / Math.max(1, Math.floor(iw / 56)));
    labels.forEach((l, i) => {
      if (i % step === 0 || i === labels.length - 1) g += `<text class="axis" x="${x(i)}" y="${H - m.b + 16}" text-anchor="middle">${U.esc(l)}</text>`;
    });
    let paths = '';
    series.forEach((se, si) => {
      const color = se.color || CH.SERIES[si % 8];
      const pts = se.values.map((v, i) => (v == null ? null : [x(i), y(v)]));
      let d = '';
      let pen = false;
      pts.forEach((p) => {
        if (!p) {
          pen = false;
          return;
        }
        d += `${pen ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`;
        pen = true;
      });
      if (spec.area && series.length === 1) {
        const valid = pts.filter(Boolean);
        if (valid.length > 1)
          paths += `<path d="${d}L${valid[valid.length - 1][0]},${y(0)}L${valid[0][0]},${y(0)}Z" fill="${color}" opacity="0.14"/>`;
      }
      paths += `<path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" ${se.dash ? 'stroke-dasharray="5 4"' : ''}/>`;
      pts.forEach((p) => {
        if (p) paths += `<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="${color}" stroke="var(--chart-surface)" stroke-width="2"/>`;
      });
      // direct label at last point for <= 4 series
      const last = [...pts].reverse().find(Boolean);
      if (last && series.length > 1 && series.length <= 4 && spec.directLabels) paths += `<text class="axis" x="${last[0] - 4}" y="${last[1] - 8}" text-anchor="end">${U.esc(se.name)}</text>`;
    });
    let hits = '';
    const bw = labels.length > 1 ? iw / (labels.length - 1) : iw;
    labels.forEach((l, i) => {
      const tip = series.map((se) => `${se.name}: ${se.values[i] == null ? '—' : fmt(se.values[i])}`).join('<br>');
      hits += `<rect class="hit crosshair" x="${x(i) - bw / 2}" y="${m.t}" width="${bw}" height="${ih}" data-x="${x(i)}" data-tip="<b>${U.attr(l)}</b><br>${U.attr(tip)}"${clickAttrs(spec, l)}/>`;
    });
    const base = `<line class="baseline" x1="${m.l}" x2="${w - m.r}" y1="${y(0)}" y2="${y(0)}"/>`;
    return `<svg width="${w}" height="${H}" role="img" aria-label="${U.attr(spec.title || 'line chart')}">${g}${base}<line class="xhair" x1="0" x2="0" y1="${m.t}" y2="${m.t + ih}"/>${paths}${hits}</svg>`;
  }

  function donut(spec, w, h) {
    const H = h - legendH(spec);
    const total = spec.items.reduce((s, d) => s + d.value, 0);
    const r = Math.min(w, H) / 2 - 6;
    const cx = w / 2;
    const cy = H / 2;
    const ir = r * 0.66;
    let a0 = -Math.PI / 2;
    let out = '';
    const fmt = spec.fmt || ((v) => v);
    const gap = spec.items.filter((d) => d.value > 0).length > 1 ? 0.025 : 0;
    spec.items.forEach((d, i) => {
      if (!d.value) return;
      const frac = d.value / (total || 1);
      const a1 = a0 + frac * Math.PI * 2;
      const s = a0 + gap / 2;
      const e = Math.max(s + 0.001, a1 - gap / 2);
      const large = e - s > Math.PI ? 1 : 0;
      const p = (ang, rad) => `${cx + rad * Math.cos(ang)},${cy + rad * Math.sin(ang)}`;
      const color = d.color || CH.SERIES[i % 8];
      const path =
        frac >= 0.999
          ? `M${cx - r},${cy}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0M${cx - ir},${cy}a${ir},${ir} 0 1,1 ${2 * ir},0a${ir},${ir} 0 1,1 ${-2 * ir},0`
          : `M${p(s, r)}A${r},${r} 0 ${large} 1 ${p(e, r)}L${p(e, ir)}A${ir},${ir} 0 ${large} 0 ${p(s, ir)}Z`;
      out += `<path d="${path}" fill="${color}" fill-rule="evenodd" class="seg" data-tip="<b>${U.attr(d.label)}</b><br>${fmt(d.value)} (${((frac || 0) * 100).toFixed(0)}%)"${clickAttrs(spec, d.label)}/>`;
      a0 = a1;
    });
    out += `<text class="donut-big" x="${cx}" y="${cy + 4}" text-anchor="middle">${U.esc(spec.center != null ? spec.center : fmt(total))}</text>`;
    if (spec.centerSub) out += `<text class="axis" x="${cx}" y="${cy + 22}" text-anchor="middle">${U.esc(spec.centerSub)}</text>`;
    return `<svg width="${w}" height="${H}" role="img" aria-label="${U.attr(spec.title || 'donut chart')}">${out}</svg>`;
  }

  /* Sparkline (inline svg string, no tooltip) */
  CH.spark = function (values, color = CH.SERIES[0], w = 90, h = 26) {
    const v = values.filter((x) => x != null);
    if (v.length < 2) return '';
    const max = Math.max(...v);
    const min = Math.min(...v);
    const span = max - min || 1;
    const pts = values.map((x, i) => `${((w - 4) * i) / (values.length - 1) + 2},${h - 3 - ((h - 6) * (x - min)) / span}`);
    return `<svg class="spark" width="${w}" height="${h}" aria-hidden="true"><polyline points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
  };

  /* -------- tooltip layer -------- */
  CH.initTooltip = function () {
    const tip = document.createElement('div');
    tip.className = 'tooltip';
    document.body.appendChild(tip);
    document.addEventListener('mousemove', (e) => {
      const t = e.target.closest && e.target.closest('[data-tip]');
      if (!t) {
        tip.style.display = 'none';
        document.querySelectorAll('.xhair.on').forEach((x) => x.classList.remove('on'));
        return;
      }
      tip.innerHTML = t.getAttribute('data-tip');
      tip.style.display = 'block';
      const tw = tip.offsetWidth;
      const th = tip.offsetHeight;
      let x = e.clientX + 14;
      let y = e.clientY + 14;
      if (x + tw > window.innerWidth - 8) x = e.clientX - tw - 14;
      if (y + th > window.innerHeight - 8) y = e.clientY - th - 14;
      tip.style.left = x + 'px';
      tip.style.top = y + 'px';
      if (t.classList.contains('crosshair')) {
        const svg = t.ownerSVGElement;
        const xh = svg && svg.querySelector('.xhair');
        if (xh) {
          xh.setAttribute('x1', t.dataset.x);
          xh.setAttribute('x2', t.dataset.x);
          xh.classList.add('on');
        }
      }
    });
    window.addEventListener('resize', U.debounce(CH.drawAll, 150));
  };
})(window.ECM);
