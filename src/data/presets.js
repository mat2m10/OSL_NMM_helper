// src/data/presets.js
export const PRESETS = {
  nmmSteel: {
    objectColor: "Leadbelcher",
    metalness: 0.9, roughness: 0.05, ambient: 0.15,
    key:  { color: "#ffffff", intensity: 1.2, pos: [3, 4, 2] },
    fill: { color: "#88aaff", intensity: 0.35, pos: [-2, 1.5, -1] },
    rim:  { color: "#ffffff", intensity: 0.8, pos: [-3, 2, -3] },
    background: 0x111111,
  },
  warmOsl: {
    objectColor: "XV-88",
    metalness: 0.2, roughness: 0.6, ambient: 0.1,
    key:  { color: "#ff9a3c", intensity: 1.4, pos: [0.8, 1.5, 0.6] },
    fill: { color: "#335577", intensity: 0.25, pos: [-2, 1.2, -1] },
    rim:  { color: "#ffd27a", intensity: 0.5, pos: [-1.5, 1.8, -1.5] },
    background: 0x0f0f12,
  },
  coldMoon: {
    objectColor: "Macragge Blue",
    metalness: 0.1, roughness: 0.5, ambient: 0.2,
    key:  { color: "#b9d7ff", intensity: 1.1, pos: [2.5, 3.5, 1.5] },
    fill: { color: "#88aaff", intensity: 0.5, pos: [-2, 1.3, -0.8] },
    rim:  { color: "#ffffff", intensity: 0.4, pos: [-2.5, 2.0, -2.2] },
    background: 0x0c1016,
  },
};
