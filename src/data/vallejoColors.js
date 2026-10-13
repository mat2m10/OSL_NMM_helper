// src/data/vallejoColors.js
// Vallejo palette: primarily Model Color (70.xxx) + Game Color (72.xxx) + a few Model Air (71.xxx).
// Data: ./palettes/vallejo.json
import { loadPaletteHex, toRgbPalette } from "./loadPalette.js";

export const VALLEJO_COLORS_HEX = await loadPaletteHex("vallejo.json");
export const VALLEJO_COLORS_RGB = toRgbPalette(VALLEJO_COLORS_HEX);
