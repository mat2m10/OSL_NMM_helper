// src/lib/colorMath.js

export const clamp01 = (x) => Math.min(1, Math.max(0, x));

export const rgbToHex = ([r, g, b]) =>
  "#" + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, "0")).join("");

export const hexToRgb = (hex) => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? [parseInt(m[1],16), parseInt(m[2],16), parseInt(m[3],16)] : [204,204,204];
};

const mix = (a, b, t) => a + (b - a) * t;
export const mixRgb = (A, B, t) => [mix(A[0], B[0], t), mix(A[1], B[1], t), mix(A[2], B[2], t)];

const dist2 = (A, B) => (A[0]-B[0])**2 + (A[1]-B[1])**2 + (A[2]-B[2])**2;

export function computeHighlightsShades(baseHex, { keyHex, keyInt, fillHex, fillInt, rimHex, rimInt }, metalness=0.5) {
  const base = hexToRgb(baseHex);
  const key  = hexToRgb(keyHex);
  const fill = hexToRgb(fillHex);
  const rim  = hexToRgb(rimHex);
  const sumI = Math.max(1e-6, keyInt + fillInt + rimInt);

  // overall light tint
  const tint = [
    (key[0]*keyInt + fill[0]*fillInt + rim[0]*rimInt)/sumI,
    (key[1]*keyInt + fill[1]*fillInt + rim[1]*rimInt)/sumI,
    (key[2]*keyInt + fill[2]*fillInt + rim[2]*rimInt)/sumI,
  ];

  // highlights toward a tinted white
  const tintedWhite = mixRgb(tint, [255,255,255], 0.6);
  const edgeT = clamp01(0.35 + 0.55 * metalness);
  const edgeHL = mixRgb(base, tintedWhite, edgeT);
  const midHL  = mixRgb(base, edgeHL, 0.55);

  // shades cooled slightly by fill/rim
  const cool = mixRgb(fill, rim, 0.5);
  const deepT = clamp01(0.55 - 0.25 * metalness);
  const deepSh = mixRgb(base, [0,0,0], deepT);
  const deepShTint = mixRgb(deepSh, cool, 0.25);
  const softSh = mixRgb(base, deepShTint, 0.5);

  return {
    highlights: [ rgbToHex(midHL), rgbToHex(edgeHL) ],
    shades:     [ rgbToHex(softSh), rgbToHex(deepShTint) ],
  };
}

export function nearestPaint(paletteRGB, hex) {
  const tgt = hexToRgb(hex);
  let best = { name: "Custom", hex, d: Infinity };
  for (const [name, arr] of Object.entries(paletteRGB)) {
    const d = dist2(tgt, arr);
    if (d < best.d) best = { name, hex: rgbToHex(arr), d };
  }
  return best;
}

export function nearestPaintMix(paletteRGB, hex, sampleCount=6, step=0.05) {
  const tgt = hexToRgb(hex);
  const nearest = Object.entries(paletteRGB)
    .map(([name, arr]) => ({ name, arr, d: dist2(tgt, arr) }))
    .sort((a,b) => a.d - b.d)
    .slice(0, sampleCount);

  let best = { nameA: nearest[0].name, nameB: nearest[0].name, t: 1, hex, d: nearest[0].d };
  for (let i = 0; i < nearest.length; i++) {
    for (let j = i; j < nearest.length; j++) {
      const A = nearest[i], B = nearest[j];
      for (let t = 0; t <= 1.0001; t += step) {
        const mixRGB = mixRgb(A.arr, B.arr, t);
        const d = dist2(tgt, mixRGB);
        if (d < best.d) best = { nameA: A.name, nameB: B.name, t, hex: rgbToHex(mixRGB), d };
      }
    }
  }
  return best;
}
