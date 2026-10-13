// src/data/armyPainterColors.js
// The Army Painter palette. Data: ./palettes/armyPainter.json
import { loadPaletteHex, toRgbPalette } from "./loadPalette.js";

export const ARMY_PAINTER_COLORS_HEX = await loadPaletteHex("armyPainter.json");
export const ARMY_PAINTER_COLORS_RGB = toRgbPalette(ARMY_PAINTER_COLORS_HEX);
