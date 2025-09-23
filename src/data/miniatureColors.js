// src/data/miniatureColors.js
// Canonical palette (hex). Add/modify freely here:
export const MINIATURE_COLORS_HEX = {
  "Abaddon Black": "#000000",
  "White Scar": "#f5f5f5",
  "Leadbelcher": "#8f9499",
  "Ironbreaker": "#c8cdd2",
  "Runefang Steel": "#dce1e6",
  "Mechanicus Standard Grey": "#595e62",
  "Eshin Grey": "#43464a",
  "Dawnstone": "#969ba0",
  "Administratum Grey": "#bec3c8",

  "Khorne Red": "#5c1114",
  "Mephiston Red": "#96171c",
  "Evil Sunz Scarlet": "#be2824",
  "Wild Rider Red": "#dc3c28",
  "Troll Slayer Orange": "#eb5a23",
  "Averland Sunset": "#e6aa14",
  "Yriel Yellow": "#ffd700",
  "Flash Gitz Yellow": "#fff000",

  "Rhinox Hide": "#3c2319",
  "Mournfang Brown": "#6e4123",
  "XV-88": "#875f2d",
  "Zamesi Desert": "#be964b",
  "Ushabti Bone": "#dccda0",
  "Rakarth Flesh": "#c8c3b4",
  "Bugman's Glow": "#a55f50",
  "Cadian Fleshtone": "#d29678",

  "Caliban Green": "#0a321e",
  "Warpstone Glow": "#1e8c46",
  "Moot Green": "#78dc50",
  "Castellan Green": "#233c23",
  "Death Guard Green": "#737d5a",
  "Nurgling Green": "#afbe7d",

  "Kantor Blue": "#14235a",
  "Macragge Blue": "#1e3c8c",
  "Altdorf Guard Blue": "#2355be",
  "Caledor Sky": "#2d78be",
  "Teclis Blue": "#3ca0d2",
  "Lothern Blue": "#6ec8e6",
  "Incubi Darkness": "#0a323c",
  "Stegadon Scale Green": "#14506e",

  "Naggaroth Night": "#281432",
  "Xereus Purple": "#55286e",
  "Genestealer Purple": "#965aaa",
  "Screamer Pink": "#96285a",
  "Emperor's Children": "#eb5faf",
};

// helper to convert hex -> [r,g,b]
const hexToRgb = (hex) => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? [parseInt(m[1],16), parseInt(m[2],16), parseInt(m[3],16)] : [204,204,204];
};

// Derived palette (RGB arrays) for algorithms that expect numeric channels
export const MINIATURE_COLORS_RGB = Object.fromEntries(
  Object.entries(MINIATURE_COLORS_HEX).map(([name, hex]) => [name, hexToRgb(hex)])
);
