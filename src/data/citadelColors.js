// src/data/citadelColors.js
import { hexToRgb } from "../lib/colorMath.js";
// Canonical palette (hex). Display approximations for UI swatches.
export const CITADEL_COLORS_HEX = {
  // Blacks / whites / primers
  "Abaddon Black": "#000000",
  "Corvus Black": "#1a1b1d",
  "Corax White": "#f1f1f1",
  "Grey Seer": "#d9dbde",
  "White Scar": "#f5f5f5",

  // Greys (Base/Layer)
  "Mechanicus Standard Grey": "#595e62",
  "Eshin Grey": "#43464a",
  "Dawnstone": "#969ba0",
  "Administratum Grey": "#bec3c8",
  "Skavenblight Dinge": "#5a5d62",
  "Stormvermin Fur": "#76797f",
  "Celestra Grey": "#bfc6cc",
  "Ulthuan Grey": "#e6eaee",

  // Metals
  "Leadbelcher": "#8f9499",
  "Ironbreaker": "#c8cdd2",
  "Runefang Steel": "#dce1e6",
  "Iron Hands Steel": "#a9afb6",
  "Stormhost Silver": "#e4e8ec",
  "Balthasar Gold": "#7c5b2e",
  "Gehennas Gold": "#b07a2e",
  "Auric Armour Gold": "#caa24c",
  "Retributor Armour": "#caa23a",
  "Liberator Gold": "#d8c27c",
  "Sycorax Bronze": "#b88a4a",
  "Brass Scorpion": "#8a5a2e",
  "Hashut Copper": "#9a5b3a",

  // Reds & oranges
  "Khorne Red": "#5c1114",
  "Mephiston Red": "#96171c",
  "Wazdakka Red": "#b32424",
  "Evil Sunz Scarlet": "#be2824",
  "Wild Rider Red": "#dc3c28",
  "Troll Slayer Orange": "#eb5a23",
  "Fire Dragon Bright": "#ff7a2a",

  // Yellows
  "Averland Sunset": "#e6aa14",
  "Yriel Yellow": "#ffd700",
  "Flash Gitz Yellow": "#fff000",
  "Dorn Yellow": "#ffe466",

  // Browns / leathers / bones
  "Rhinox Hide": "#3c2319",
  "Dryad Bark": "#3a2a1f",
  "Gorthor Brown": "#6a4a36",
  "Mournfang Brown": "#6e4123",
  "XV-88": "#875f2d",
  "Steel Legion Drab": "#6a5a3a",
  "Tallarn Sand": "#b69054",
  "Zamesi Desert": "#be964b",
  "Karak Stone": "#bfa57a",
  "Baneblade Brown": "#b6ab98",
  "Rakarth Flesh": "#c8c3b4",
  "Ushabti Bone": "#dccda0",
  "Screaming Skull": "#efe3be",
  "Pallid Wych Flesh": "#efe9de",

  // Skin tones
  "Bugman's Glow": "#a55f50",
  "Cadian Fleshtone": "#d29678",
  "Kislev Flesh": "#e1bda3",
  "Flayed One Flesh": "#edd7c5",

  // Greens
  "Caliban Green": "#0a321e",
  "Warpstone Glow": "#1e8c46",
  "Moot Green": "#78dc50",
  "Castellan Green": "#233c23",
  "Death Guard Green": "#737d5a",
  "Nurgling Green": "#afbe7d",
  "Waaagh! Flesh": "#123a23",
  "Warboss Green": "#3a9a3a",
  "Skarsnik Green": "#a8d98a",
  "Deathworld Forest": "#485a3a",
  "Elysian Green": "#6b8a4a",
  "Ogryn Camo": "#aebb78",
  "Loren Forest": "#335a2d",
  "Straken Green": "#6a8e3a",

  // Teals / turquoises
  "Incubi Darkness": "#0a323c",
  "Stegadon Scale Green": "#14506e",
  "Sotek Green": "#1f7e89",
  "Kabalite Green": "#1e8b75",
  "Sybarite Green": "#6bc2a6",
  "Temple Guard Blue": "#1fa8c0",
  "Baharroth Blue": "#a6e7f3",

  // Blues
  "Kantor Blue": "#14235a",
  "Macragge Blue": "#1e3c8c",
  "Altdorf Guard Blue": "#2355be",
  "Caledor Sky": "#2d78be",
  "Teclis Blue": "#3ca0d2",
  "Lothern Blue": "#6ec8e6",
  "Thousand Sons Blue": "#275e73",
  "Ahriman Blue": "#3e8db3",
  "The Fang": "#3a4d6b",
  "Russ Grey": "#7a96b5",
  "Fenrisian Grey": "#b7cadb",

  // Purples / pinks
  "Naggaroth Night": "#281432",
  "Xereus Purple": "#55286e",
  "Genestealer Purple": "#965aaa",
  "Dechala Lilac": "#cbb1d6",
  "Screamer Pink": "#96285a",
  "Pink Horror": "#d9578a",
  "Emperor's Children": "#eb5faf",
  "Fulgrim Pink": "#ff8fc5",
};


// Derived palette (RGB arrays) for algorithms that expect numeric channels
export const CITADEL_COLORS_RGB = Object.fromEntries(
  Object.entries(CITADEL_COLORS_HEX).map(([name, hex]) => [name, hexToRgb(hex)])
);
