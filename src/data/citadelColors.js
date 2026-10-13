// src/data/citadelColors.js
// Citadel palette. Data: ./palettes/citadel.json
import { loadPaletteHex, toRgbPalette } from "./loadPalette.js";

export const CITADEL_COLORS_HEX = await loadPaletteHex("citadel.json");
export const CITADEL_COLORS_RGB = toRgbPalette(CITADEL_COLORS_HEX);
