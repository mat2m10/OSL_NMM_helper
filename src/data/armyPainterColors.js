// src/data/armyPainterColors.js
// The Army Painter palette. Data: ./palettes/armyPainter.json
import { fillPalette } from "./loadPalette.js";

// Filled in place once armyPainter.json has loaded; await armyPainterReady before reading.
export const ARMY_PAINTER_COLORS_HEX = {};
export const ARMY_PAINTER_COLORS_RGB = {};
export const armyPainterReady = fillPalette("armyPainter.json", ARMY_PAINTER_COLORS_HEX, ARMY_PAINTER_COLORS_RGB);
