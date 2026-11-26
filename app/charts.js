// Hand-rolled SVG charts for HomeLedger — no libraries, no network.
// donutChart draws a spending donut; trendChart draws grouped bars of
// income vs spending across months. Both return plain SVG strings.

import { formatShort } from './data.js';

const TAU = Math.PI * 2;

function polar(cx, cy, r, angle) {
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
}

// segments: [{ label, value, color }]. The hole shows the total in the middle.
export function donutChart(segments, size = 240) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 14;
  const inner = r * 0.62;
  let angle = -Math.PI / 2;
  let paths = '';
  for (const seg of segments) {
    if (seg.value <= 0) continue;
    const frac = seg.value / total;
    const a0 = angle;
    const a1 = angle + frac * TAU;
    const large = frac > 0.5 ? 1 : 0;
    const [x0, y0] = polar(cx, cy, r, a0);
    const [x1, y1] = polar(cx, cy, r, a1);
    const [ix1, iy1] = polar(cx, cy, inner, a1);
    const [ix0, iy0] = polar(cx, cy, inner, a0);
    if (frac >= 0.999) {
      paths += `<circle cx="${cx}" cy="${cy}" r="${(r + inner) / 2}" fill="none" stroke="${seg.color}" stroke-width="${r - inner}" />`;
    } else {
      paths += `<path d="M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)} L ${ix1.toFixed(1)} ${iy1.toFixed(1)} A ${inner} ${inner} 0 ${large} 0 ${ix0.toFixed(1)} ${iy0.toFixed(1)} Z" fill="${seg.color}"><title>${seg.label}: ${formatShort(seg.value)}</title></path>`;
    }
    angle = a1;
  }
  return `<svg class="donut" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="Spending by category donut chart">${paths}<text x="${cx}" y="${cy - 6}" text-anchor="middle" class="donut-total">${formatShort(total)}</text><text x="${cx}" y="${cy + 16}" text-anchor="middle" class="donut-label">spent in Nov</text></svg>`;
}

// rows: [{ month, income, spending }]. Grouped bars, income teal, spending coral.
export function trendChart(rows, width = 640, height = 260) {
  const padL = 52;
  const padB = 28;
  const padT = 14;
  const max = Math.max(...rows.map((r) => Math.max(r.income, r.spending))) * 1.08;
  const plotW = width - padL - 12;
  const plotH = height - padT - padB;
  const slot = plotW / rows.length;
  const barW = Math.min(30, slot * 0.28);
  let out = `<svg class="trend" viewBox="0 0 ${width} ${height}" width="100%" role="img" aria-label="Monthly income versus spending chart">`;
  // Gridlines and value labels at 0 / 5 jt / 10 jt / 15 jt.
  for (const v of [0, 5000000, 10000000, 15000000]) {
    const y = padT + plotH - (v / max) * plotH;
    out += `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${width - 12}" y2="${y.toFixed(1)}" class="grid" /><text x="${padL - 8}" y="${(y + 4).toFixed(1)}" text-anchor="end" class="axis">${formatShort(v)}</text>`;
  }
  rows.forEach((r, i) => {
    const cx = padL + slot * i + slot / 2;
    const hInc = (r.income / max) * plotH;
    const hSp = (r.spending / max) * plotH;
    out += `<rect x="${(cx - barW - 3).toFixed(1)}" y="${(padT + plotH - hInc).toFixed(1)}" width="${barW}" height="${hInc.toFixed(1)}" rx="3" fill="#0f766e"><title>${r.month} income ${formatShort(r.income)}</title></rect>`;
    out += `<rect x="${(cx + 3).toFixed(1)}" y="${(padT + plotH - hSp).toFixed(1)}" width="${barW}" height="${hSp.toFixed(1)}" rx="3" fill="#c65b4e"><title>${r.month} spending ${formatShort(r.spending)}</title></rect>`;
    out += `<text x="${cx.toFixed(1)}" y="${height - 8}" text-anchor="middle" class="axis">${r.month}</text>`;
  });
  out += '</svg>';
  return out;
}

// A thin horizontal bar used for category comparison rows.
export function barRow(label, value, max, color, note) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return `<div class="bar-row"><div class="bar-head"><span>${label}</span><strong>${formatShort(value)}</strong></div><div class="bar-track"><div class="bar-fill" style="width:${pct.toFixed(1)}%;background:${color}"></div></div><div class="bar-note">${note}</div></div>`;
}
