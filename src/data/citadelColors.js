// src/data/citadelColors.js
// Citadel palette. Data: ./palettes/citadel.json
import { fillPalette } from "./loadPalette.js";

// Filled in place once citadel.json has loaded; await citadelReady before reading.
export const CITADEL_COLORS_HEX = {};
export const CITADEL_COLORS_RGB = {};
export const citadelReady = fillPalette("citadel.json", CITADEL_COLORS_HEX, CITADEL_COLORS_RGB);
