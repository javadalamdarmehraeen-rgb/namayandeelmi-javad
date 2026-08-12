#!/usr/bin/env node
/**      Ramer–Douglas–Peucker */
import { readFileSync, writeFileSync, statSync } from "node:fs";
const input = process.argv[2] || "public/data/iran-provinces.geojson";
const output = process.argv[3] || "public/data/iran-provinces-lite.geojson";
const tolerance = Number(process.argv[4] || 0.012);
const distanceToSegment = (p, a, b) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  if (!dx && !dy) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
};
function simplify(points, eps) {
  if (points.length <= 4) return points;
  const wasClosed = points[0][0] === points.at(-1)[0] && points[0][1] === points.at(-1)[1];
  const line = wasClosed ? points.slice(0, -1) : points;
  //                
  let split = 0;
  if (wasClosed) {
    let max = -1;
    for (let i = 1; i < line.length; i++) {
      const d = Math.hypot(line[i][0] - line[0][0], line[i][1] - line[0][1]);
      if (d > max) { max = d; split = i; }
    }
    const a = rdp(line.slice(0, split + 1), eps);
    const b = rdp([...line.slice(split), line[0]], eps);
    const result = [...a.slice(0, -1), ...b];
    return result.length >= 4 ? result : points;
  }
  return rdp(line, eps);
}
function rdp(points, eps) {
  if (points.length <= 2) return points;
  let max = 0;
  let idx = 0;
  const first = points[0];
  const last = points.at(-1);
  for (let i = 1; i < points.length - 1; i++) {
    const d = distanceToSegment(points[i], first, last);
    if (d > max) { max = d; idx = i; }

  }
  if (max > eps) {
    const left = rdp(points.slice(0, idx + 1), eps);
    const right = rdp(points.slice(idx), eps);
    return [...left.slice(0, -1), ...right];
  }
  return [first, last];
}
const geo = JSON.parse(readFileSync(input, "utf8"));
for (const feature of geo.features) {
  const g = feature.geometry;
  if (g.type === "Polygon") g.coordinates = g.coordinates.map((ring) => simplify(ring, tolerance));
  if (g.type === "MultiPolygon") {
    g.coordinates = g.coordinates.map((poly) => poly.map((ring) => simplify(ring, tolerance)));
  }
  const raw = String(feature.properties?.province_name || feature.properties?.name || "");
  const name = raw.replace(/^\s+/, "");
  feature.properties.name_fa = name === "   " ? "  " : name;
}
writeFileSync(output, JSON.stringify(geo));
console.log(` ${geo.features.length} : ${statSync(input).size} → ${statSync(output).size} bytes`);
