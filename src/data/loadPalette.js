// src/data/loadPalette.js
// Loads a paint palette (name -> "#rrggbb") from src/data/palettes/*.json.
//
// Palettes live in JSON so they are easy to update or contribute to without
// touching code. Hex values are *UI display approximations* of the real
// paints (good for swatches and matching, not lab-accurate).
//
// TODO(owner): record where each palette's hex values come from and when they
// were last checked (e.g. a "Source: ..., checked YYYY-MM-DD" line per brand
// in src/data/palettes/README.md).
import { hexToRgb } from "../lib/colorMath.js";

export async function loadPaletteHex(file) {
  try {
    const res = await fetch(new URL(`./palettes/${file}`, import.meta.url));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    // Keep the app usable: main.js falls back to a default colour when a
    // brand palette is empty.
    console.error(`Could not load palette ${file}:`, err);
    return {};
  }
}

// Derived palette (RGB arrays) for algorithms that expect numeric channels
export const toRgbPalette = (hexMap) =>
  Object.fromEntries(Object.entries(hexMap).map(([name, hex]) => [name, hexToRgb(hex)]));
