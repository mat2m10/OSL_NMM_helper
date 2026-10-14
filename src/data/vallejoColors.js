// src/data/vallejoColors.js
// Vallejo palette: primarily Model Color (70.xxx) + Game Color (72.xxx) + a few Model Air (71.xxx).
// Data: ./palettes/vallejo.json
import { fillPalette } from "./loadPalette.js";

// Filled in place once vallejo.json has loaded; await vallejoReady before reading.
export const VALLEJO_COLORS_HEX = {};
export const VALLEJO_COLORS_RGB = {};
export const vallejoReady = fillPalette("vallejo.json", VALLEJO_COLORS_HEX, VALLEJO_COLORS_RGB);
