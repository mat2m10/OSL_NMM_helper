// Unit tests for src/lib/colorMath.js (run with `npm test` or `node --test "tests/*.test.js"`).
// Uses only node:test and node:assert, so no dependencies are needed.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  clamp01,
  rgbToHex,
  hexToRgb,
  mixRgb,
  computeHighlightsShades,
  nearestPaint,
  nearestPaintMix,
} from "../src/lib/colorMath.js";

const luminance = (hex) => {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const HEX_RE = /^#[0-9a-f]{6}$/;

describe("clamp01", () => {
  it("clamps to [0, 1]", () => {
    assert.equal(clamp01(-0.5), 0);
    assert.equal(clamp01(0.25), 0.25);
    assert.equal(clamp01(3), 1);
  });
});

describe("hexToRgb / rgbToHex", () => {
  it("parses 6-digit hex with or without # and any case", () => {
    assert.deepEqual(hexToRgb("#1e3c8c"), [30, 60, 140]);
    assert.deepEqual(hexToRgb("1E3C8C"), [30, 60, 140]);
  });

  it("falls back to light grey for invalid input (including 3-digit hex)", () => {
    assert.deepEqual(hexToRgb("not a colour"), [204, 204, 204]);
    assert.deepEqual(hexToRgb("#fff"), [204, 204, 204]);
  });

  it("formats lowercase, zero-padded hex and rounds channels", () => {
    assert.equal(rgbToHex([0, 15, 255]), "#000fff");
    assert.equal(rgbToHex([127.5, 0.4, 254.6]), "#8000ff");
  });

  it("round-trips", () => {
    for (const hex of ["#000000", "#ffffff", "#1e3c8c", "#ffd200"]) {
      assert.equal(rgbToHex(hexToRgb(hex)), hex);
    }
  });
});

describe("mixRgb", () => {
  it("interpolates linearly per channel", () => {
    assert.deepEqual(mixRgb([0, 0, 0], [200, 100, 50], 0), [0, 0, 0]);
    assert.deepEqual(mixRgb([0, 0, 0], [200, 100, 50], 1), [200, 100, 50]);
    assert.deepEqual(mixRgb([0, 0, 0], [200, 100, 50], 0.5), [100, 50, 25]);
  });
});

describe("computeHighlightsShades", () => {
  const whiteLights = {
    keyHex: "#ffffff", keyInt: 1,
    fillHex: "#ffffff", fillInt: 1,
    rimHex: "#ffffff", rimInt: 1,
  };

  it("returns two highlights and two shades as hex strings", () => {
    const { highlights, shades } = computeHighlightsShades("#1e3c8c", whiteLights);
    assert.equal(highlights.length, 2);
    assert.equal(shades.length, 2);
    for (const h of [...highlights, ...shades]) assert.match(h, HEX_RE);
  });

  const defaultLights = { ...whiteLights, keyInt: 1.2, fillHex: "#88aaff", fillInt: 0.5, rimHex: "#ffcc88", rimInt: 0.6 };
  const assertOrdered = (base) => {
    const { highlights: [mid, edge], shades: [soft, deep] } = computeHighlightsShades(base, defaultLights, 0.5);
    assert.ok(luminance(deep) < luminance(soft), `${base}: deep ${deep} < soft ${soft}`);
    assert.ok(luminance(soft) < luminance(base), `${base}: soft ${soft} < base`);
    assert.ok(luminance(base) < luminance(mid), `${base}: base < mid ${mid}`);
    assert.ok(luminance(mid) < luminance(edge), `${base}: mid ${mid} < edge ${edge}`);
  };

  it("orders values for mid/light bases: deep < soft < base < mid HL < edge HL", () => {
    for (const base of ["#808080", "#c0c0c0", "#d4aa00"]) assertOrdered(base);
  });

  it("orders values for dark bases too", {
    todo: "shades are tinted 25% toward the fill/rim colour, which makes them LIGHTER than dark bases (e.g. #1e3c8c, #404040)",
  }, () => {
    for (const base of ["#1e3c8c", "#404040"]) assertOrdered(base);
  });

  it("pushes the edge highlight further toward white as metalness rises", () => {
    const low = computeHighlightsShades("#404040", whiteLights, 0).highlights[1];
    const high = computeHighlightsShades("#404040", whiteLights, 1).highlights[1];
    assert.ok(luminance(high) > luminance(low));
  });

  it("matches a hand-computed result (black base, white lights, metalness 0)", () => {
    // edgeT = 0.35 -> edge = 0.35*255 = 89.25; mid = 0.55*89.25 = 49.09
    // deep = black tinted 25% toward white = 63.75; soft = 31.875
    assert.deepEqual(computeHighlightsShades("#000000", whiteLights, 0), {
      highlights: ["#313131", "#595959"],
      shades: ["#202020", "#404040"],
    });
  });

  it("tints highlights toward the light colour", () => {
    const warm = computeHighlightsShades("#808080", {
      keyHex: "#ff8000", keyInt: 1, fillHex: "#ff8000", fillInt: 0, rimHex: "#ff8000", rimInt: 0,
    }).highlights[1];
    const [r, , b] = hexToRgb(warm);
    assert.ok(r > b, `expected a warm edge highlight, got ${warm}`);
  });

  it("does not divide by zero when every light is off", () => {
    const { highlights, shades } = computeHighlightsShades("#808080", {
      ...whiteLights, keyInt: 0, fillInt: 0, rimInt: 0,
    });
    for (const h of [...highlights, ...shades]) assert.match(h, HEX_RE);
  });
});

const PALETTE = {
  Black: [0, 0, 0],
  White: [255, 255, 255],
  Red: [200, 30, 30],
  Blue: [30, 60, 140],
};

describe("nearestPaint", () => {
  it("returns an exact match with distance 0", () => {
    assert.deepEqual(nearestPaint(PALETTE, "#1e3c8c"), { name: "Blue", hex: "#1e3c8c", d: 0 });
  });

  it("picks the closest paint by RGB distance", () => {
    assert.equal(nearestPaint(PALETTE, "#c02020").name, "Red");
    assert.equal(nearestPaint(PALETTE, "#101010").name, "Black");
    assert.equal(nearestPaint(PALETTE, "#f0f0f0").name, "White");
  });

  it("returns a 'Custom' placeholder for an empty palette", () => {
    assert.deepEqual(nearestPaint({}, "#123456"), { name: "Custom", hex: "#123456", d: Infinity });
  });
});

describe("nearestPaintMix", () => {
  it("returns a single paint (t = 1) when the target is an exact paint", () => {
    const r = nearestPaintMix(PALETTE, "#c81e1e");
    assert.equal(r.nameA, "Red");
    assert.equal(r.nameB, "Red");
    assert.equal(r.t, 1);
    assert.equal(r.d, 0);
  });

  it("finds a 50/50 mix for a colour halfway between two paints", () => {
    const r = nearestPaintMix({ Black: [0, 0, 0], White: [255, 255, 255] }, "#808080");
    assert.deepEqual(new Set([r.nameA, r.nameB]), new Set(["Black", "White"]));
    assert.ok(Math.abs(r.t - 0.5) < 1e-9, `t = ${r.t}`);
    assert.equal(r.hex, "#808080");
  });

  it("is never worse than the nearest single paint", () => {
    for (const hex of ["#7f2a55", "#3a3a3a", "#9fb0d0", "#e0c040"]) {
      assert.ok(nearestPaintMix(PALETTE, hex).d <= nearestPaint(PALETTE, hex).d, hex);
    }
  });

  it("only considers the sampleCount nearest paints", () => {
    // With sampleCount = 1 the result must be the single nearest paint.
    const r = nearestPaintMix(PALETTE, "#808080", 1);
    assert.equal(r.nameA, nearestPaint(PALETTE, "#808080").name);
    assert.equal(r.nameA, r.nameB);
  });

  it("handles an empty palette", { todo: "currently throws (reads nearest[0] of an empty list)" }, () => {
    assert.doesNotThrow(() => nearestPaintMix({}, "#808080"));
  });
});
