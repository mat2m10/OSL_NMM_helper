// src/data/miniatureColors.js
// Kept so existing imports don't break. You can delete MINIATURE_* later if unused.

// helper to convert hex -> [r,g,b]
export const hexToRgb = (hex) => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? [parseInt(m[1],16), parseInt(m[2],16), parseInt(m[3],16)] : [204,204,204];
};

// (empty default palette to avoid crashes if someone imports it)
export const MINIATURE_COLORS_HEX = {};
export const MINIATURE_COLORS_RGB = {};
