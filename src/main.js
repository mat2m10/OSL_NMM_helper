// src/main.js
import * as THREE from "./vendor/three.module.js";
import { OrbitControls } from "./vendor/OrbitControls.js";
import { MINIATURE_COLORS_RGB } from "./data/miniatureColors.js";
import { PRESETS } from "./data/presets.js";
import { buildRecipeHTML, formatRecipeText } from "./ui/recipe.js";
import { rgbToHex, hexToRgb } from "./lib/colorMath.js";
import { initLights } from "./scene/lights.js";

/* ===========================
   small DOM + value helpers
   =========================== */
const byId = (id) => document.getElementById(id);
const hexFromInput = (el, fallback = "#ffffff") =>
  el && typeof el.value === "string" ? el.value : fallback;

/* ===========================
   DOM refs (declare once)
   =========================== */
const canvas         = byId("viewport");
const presetSelect   = byId("preset");
const shapeSelect    = byId("shape");
const citadelSelect  = byId("citadelColor");

const lightColor     = byId("lightColor");
const lightIntensity = byId("lightIntensity");
const fillColor      = byId("fillColor");
const fillIntensity  = byId("fillIntensity");
const rimColor       = byId("rimColor");
const rimIntensity   = byId("rimIntensity");

const keyEnabled     = byId("keyEnabled");
const fillEnabled    = byId("fillEnabled");
const rimEnabled     = byId("rimEnabled");

// az/el/dist inputs
const keyAz  = byId("keyAz"),  keyEl  = byId("keyEl"),  keyDist  = byId("keyDist");
const fillAz = byId("fillAz"), fillEl = byId("fillEl"), fillDist = byId("fillDist");
const rimAz  = byId("rimAz"),  rimEl  = byId("rimEl"),  rimDist  = byId("rimDist");

// recipe & copy UI
const recipePanel   = byId("recipe");
const recipeBody    = byId("recipeBody");
const copyRecipeBtn = byId("copyRecipe");
const newColorName  = byId("newColorName");
const newColorHex   = byId("newColorHex");
const addColorBtn   = byId("addColorBtn");
const baseSwatch    = byId("baseSwatch");

// color-picker UI
const enterPickerBtn = byId("enterPicker");
const pickerOverlay  = byId("pickerOverlay");
const pickerCross    = byId("pickerCross");
const pickerChip     = byId("pickerChip");

// picker samples live here
let pickedSamples = [];

/* ===========================
   three.js setup
   =========================== */
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  preserveDrawingBuffer: true, // required for readPixels
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
camera.position.set(2.5, 1.8, 3.2);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// object & ground
let geometry = new THREE.SphereGeometry(1, 64, 64);
const material = new THREE.MeshStandardMaterial({
  color: 0xcccccc,
  metalness: 0.6,
  roughness: 0.25,
});
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10),
  new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 1, metalness: 0 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -1.1;
scene.add(ground);

/* ===========================
   user colour storage / palette
   =========================== */
const STORAGE_KEY = "osl_nmm_user_colors_v1";
let runtimePaletteRGB = { ...MINIATURE_COLORS_RGB };
let userColorsCache = loadUserColors();
applyUserColorsToPalette(userColorsCache);

function loadUserColors() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const obj = JSON.parse(raw);
    return obj && typeof obj === "object" ? obj : {};
  } catch {
    return {};
  }
}
function saveUserColors(map) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}
function applyUserColorsToPalette(hexMap) {
  for (const [name, h] of Object.entries(hexMap)) {
    if (!/^#?[0-9a-fA-F]{6}$/.test(h)) continue;
    const norm = h.startsWith("#") ? h : `#${h}`;
    runtimePaletteRGB[name] = hexToRgb(norm);
  }
}
function addUserColor(name, hex) {
  const cleanName = (name || "").trim();
  const cleanHex  = (hex  || "").trim();
  if (!cleanName) throw new Error("Name required");
  if (!/^#?[0-9a-fA-F]{6}$/.test(cleanHex)) throw new Error("Hex like #ffd200");

  const norm = cleanHex.startsWith("#") ? cleanHex : `#${cleanHex}`;
  userColorsCache[cleanName] = norm;
  saveUserColors(userColorsCache);
  runtimePaletteRGB[cleanName] = hexToRgb(norm);

  populateCitadel();
  if (citadelSelect) {
    const opt = Array.from(citadelSelect.options).find(o => o.textContent === cleanName);
    if (opt) citadelSelect.value = opt.value;
  }
  material.color.set(norm);
  if (baseSwatch) baseSwatch.style.background = norm;
  updateRecipe();
}
addColorBtn?.addEventListener("click", () => {
  try {
    addUserColor(newColorName?.value, newColorHex?.value);
    addColorBtn.textContent = "Added";
    setTimeout(() => (addColorBtn.textContent = "Add"), 800);
  } catch (e) {
    addColorBtn.textContent = e?.message || "Invalid";
    setTimeout(() => (addColorBtn.textContent = "Add"), 1200);
  }
});

/* ===========================
   UI wiring (palette, geometry)
   =========================== */
function populateCitadel() {
  if (!citadelSelect) return;
  const prev = citadelSelect.value?.toLowerCase();
  citadelSelect.innerHTML = "";

  const entries = Object.entries(runtimePaletteRGB).sort((a, b) => a[0].localeCompare(b[0]));
  for (const [name, rgb] of entries) {
    const h = rgbToHex(rgb);
    const opt = document.createElement("option");
    opt.value = h;
    opt.textContent = name;
    citadelSelect.appendChild(opt);
  }

  const found = Array.from(citadelSelect.options).find(o => o.value.toLowerCase() === prev);
  citadelSelect.value = found ? found.value : citadelSelect.options[0]?.value;

  const currentHex = citadelSelect.value;
  material.color.set(currentHex);
  if (baseSwatch) baseSwatch.style.background = currentHex;
}

function setGeometry(kind) {
  let g;
  switch (kind) {
    case "cube":     g = new THREE.BoxGeometry(1.6, 1.6, 1.6, 1, 1, 1); break;
    case "cylinder": g = new THREE.CylinderGeometry(1, 1, 2, 64, 1);   break;
    case "cone":     g = new THREE.ConeGeometry(1, 2, 64, 1);          break;
    default:         g = new THREE.SphereGeometry(1, 64, 64);
  }
  mesh.geometry.dispose();
  mesh.geometry = g;
}

function getPaintNameAndHex() {
  if (!citadelSelect) return { name: "Custom", hex: "#cccccc" };
  const opt = citadelSelect.options[citadelSelect.selectedIndex];
  return { name: opt?.textContent || "Custom", hex: opt?.value || "#cccccc" };
}

function updateRecipe() {
  if (!recipeBody) return;

  const { name: baseName, hex: baseHex } = getPaintNameAndHex();
  const shape = shapeSelect?.value || "sphere";

  const keyHex  = hexFromInput(lightColor, "#ffffff");
  const keyInt  = (keyEnabled?.checked ? 1 : 0) * parseFloat(lightIntensity?.value || "1.0");

  const fillHex = hexFromInput(fillColor,  "#88aaff");
  const fillInt = (fillEnabled?.checked ? 1 : 0) * parseFloat(fillIntensity?.value || "0.5");

  const rimHex  = hexFromInput(rimColor,   "#ffcc88");
  const rimInt  = (rimEnabled?.checked ? 1 : 0) * parseFloat(rimIntensity?.value || "0.6");

  const state = { baseName, baseHex, shape, keyHex, keyInt, fillHex, fillInt, rimHex, rimInt, metalness: material.metalness };
  recipeBody.innerHTML = buildRecipeHTML(state, runtimePaletteRGB);
}
// initial render of recipe panel (empty samples)
updateRecipe();

/* ===========================
   lights (via module)
   =========================== */
const { ambient, LIGHTS, updateLight, setFromConf } = initLights(scene, updateRecipe);

/* ===========================
   presets / startup
   =========================== */
function applyPreset(id) {
  const p = PRESETS[id];
  if (!p) return;

  if (p.background !== undefined) scene.background = new THREE.Color(p.background);
  if (typeof p.metalness === "number") material.metalness = p.metalness;
  if (typeof p.roughness === "number") material.roughness = p.roughness;

  // surface colour
  if (p.objectColor) {
    const rgb = runtimePaletteRGB[p.objectColor];
    const objHex = rgb ? rgbToHex(rgb) : "#cccccc";
    material.color.set(objHex);
    if (citadelSelect) {
      const opt = Array.from(citadelSelect.options).find(o => o.value.toLowerCase() === objHex.toLowerCase());
      if (opt) citadelSelect.value = opt.value;
    }
    if (baseSwatch) baseSwatch.style.background = objHex;
  }

  // lights
  if (typeof p.ambient === "number") ambient.intensity = p.ambient;
  setFromConf("key",  p.key);
  setFromConf("fill", p.fill);
  setFromConf("rim",  p.rim);

  updateRecipe();
}

function applyStartupState() {
  // Shape
  if (shapeSelect) { shapeSelect.value = "sphere"; setGeometry("sphere"); }

  // Base colour: Macragge Blue
  const targetName = "Macragge Blue";
  const rgb = runtimePaletteRGB[targetName];
  const objHex = rgb ? rgbToHex(rgb) : "#1e3c8c";
  if (citadelSelect) {
    const opts  = Array.from(citadelSelect.options);
    const byTxt = opts.find(o => o.textContent === targetName);
    const byHex = opts.find(o => o.value.toLowerCase() === objHex.toLowerCase());
    citadelSelect.value = (byTxt?.value || byHex?.value || citadelSelect.value);
  }
  material.color.set(objHex);
  baseSwatch && (baseSwatch.style.background = objHex);

  // Show preset name (do not apply preset)
  if (presetSelect) presetSelect.value = "nmmSteel";

  // Lights
  if (typeof ambient !== "undefined") ambient.intensity = 0;

  if (keyEnabled) keyEnabled.checked = true;
  if (lightColor) lightColor.value = "#ffffff";
  if (lightIntensity) lightIntensity.value = 1.30;
  setFromConf("key", { color: "#ffffff", intensity: 1.3, pos: [0.7, 4, 2] });

  if (fillEnabled) fillEnabled.checked = false;
  if (fillColor) fillColor.value = "#ffffff";
  if (fillIntensity) fillIntensity.value = "0";
  setFromConf("fill", { color: "#ffffff", intensity: 0, pos: [0,0,1] });

  if (rimEnabled) rimEnabled.checked = false;
  if (rimColor) rimColor.value = "#ffffff";
  if (rimIntensity) rimIntensity.value = "0";
  setFromConf("rim", { color: "#ffffff", intensity: 0, pos: [0,0,1] });

  updateRecipe();
}

/* ===========================
   listeners
   =========================== */
shapeSelect?.addEventListener("change", (e) => { setGeometry(e.target.value); updateRecipe(); });
citadelSelect?.addEventListener("change", (e) => {
  const h = e.target.value;
  material.color.set(h);
  if (baseSwatch) baseSwatch.style.background = h;
  updateRecipe();
});
presetSelect?.addEventListener("change", (e) => applyPreset(e.target.value));

/* ===========================
   init & loop
   =========================== */
populateCitadel();
function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (canvas.width !== w || canvas.height !== h) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
}
window.addEventListener("resize", resize);
resize();

applyStartupState();

let isPickerPaused = false;
function tick() {
  if (!isPickerPaused) {
    controls.update();
    renderer.render(scene, camera);
  }
  requestAnimationFrame(tick);
}
tick();

/* ===========================
   COLOR PICKER (with samples)
   =========================== */

// utilities for color math (local)
const HEX_RX = /^#?([0-9a-f]{6})$/i;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const toHex2 = (n) => n.toString(16).padStart(2, "0");

function hexToVec(hex) {
  const m = HEX_RX.exec(hex);
  if (!m) return null;
  const v = parseInt(m[1], 16);
  return [ (v>>16)&255, (v>>8)&255, v&255 ];
}
function vecToHex(v) {
  const [r,g,b] = v.map(x => Math.round(x));
  return `#${toHex2(r)}${toHex2(g)}${toHex2(b)}`;
}
function dist2(a,b){ const dx=a[0]-b[0], dy=a[1]-b[1], dz=a[2]-b[2]; return dx*dx+dy*dy+dz*dz; }
function dot(a,b){ return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]; }
function sub(a,b){ return [a[0]-b[0], a[1]-b[1], a[2]-b[2]]; }
function add(a,b){ return [a[0]+b[0], a[1]+b[1], a[2]+b[2]]; }
function mul(a,s){ return [a[0]*s, a[1]*s, a[2]*s]; }

// palette getters (dynamic so user-added colors are included)
function getPalette() {
  return Object.entries(runtimePaletteRGB).map(([name, rgb]) => {
    const h = rgbToHex(rgb);
    return { name, hex: h, vec: hexToVec(h) };
  });
}
function nearestPaint(targetHex) {
  const t = hexToVec(targetHex);
  let best = null, bestD = Infinity;
  for (const p of getPalette()) {
    const d = dist2(t, p.vec);
    if (d < bestD) { bestD = d; best = p; }
  }
  return best;
}
function bestTwoPaintMix(targetHex) {
  const t = hexToVec(targetHex);
  const pal = getPalette();
  const ranked = [...pal].sort((a,b)=>dist2(t,a.vec)-dist2(t,b.vec)).slice(0,20);
  let best = null, bestD = Infinity;

  for (let i=0;i<ranked.length;i++){
    for (let j=i+1;j<ranked.length;j++){
      const A = ranked[i].vec, B = ranked[j].vec;
      const AB = sub(B,A);
      const denom = dot(AB,AB) || 1;
      let lambda = dot(sub(t,A), AB) / denom;
      lambda = clamp01(lambda);
      const mix = add(A, mul(AB, lambda));
      const d = dist2(t, mix);
      if (d < bestD) {
        bestD = d;
        best = { a: ranked[i], b: ranked[j], lambda, hex: vecToHex(mix) };
      }
    }
  }
  if (!best) return { aName:"", bName:"", aHex:"#000000", bHex:"#000000", aPct:50, bPct:50, mixHex:"#000000" };
  const bPct = Math.round(best.lambda*100);
  const aPct = 100 - bPct;
  return {
    aName: best.a.name, aHex: best.a.hex,
    bName: best.b.name, bHex: best.b.hex,
    aPct, bPct, mixHex: best.hex
  };
}

// live sampling helpers
function sampleCanvasHexAt(clientX, clientY) {
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  if (clientX < rect.left || clientX >= rect.right || clientY < rect.top || clientY >= rect.bottom) {
    return null;
  }
  const fbW = canvas.width, fbH = canvas.height;
  const sx = Math.floor((clientX - rect.left) * (fbW / rect.width));
  const sy = Math.floor((clientY - rect.top)  * (fbH / rect.height));
  const py = fbH - sy - 1;

  const gl = renderer.getContext();
  const pix = new Uint8Array(4);
  gl.readPixels(sx, py, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pix);
  const [r,g,b,a] = pix;
  if (a === 0) return null;
  return `#${toHex2(r)}${toHex2(g)}${toHex2(b)}`;
}

function setChipAppearance(hex) {
  if (!pickerChip) return;
  const value = hex || "#------";
  pickerChip.textContent = value;
  pickerChip.style.background = hex || "#eee";
  if (hex) {
    const [r,g,b] = hexToVec(hex);
    const luma = 0.2126*r + 0.7152*g + 0.0722*b;
    pickerChip.style.color = luma < 140 ? "#fff" : "#111";
  } else {
    pickerChip.style.color = "#111";
  }
}

// picker recipe rendering
function renderPickerRecipe() {
  if (!recipeBody) return;

  const { name: baseName, hex: baseHex } = getPaintNameAndHex();

  const lightRow = (label, enabled, colInput, intInput, azEl, elEl, distEl) => {
    if (!enabled) return "";
    const hex = hexFromInput(colInput, "#ffffff").toUpperCase();
    const I = parseFloat(intInput?.value || "0").toFixed(2);
    const az = azEl?.value ?? "0";
    const el = elEl?.value ?? "0";
    const di = distEl?.value ?? "1";
    return `
      <p><strong>${label}:</strong>
        <span class="swatch" style="background:${hex}"></span>
        ${hex}, I=${I}, az=${az}°, el=${el}°, dist=${di}
      </p>`;
  };

  let html = `
    <p><strong>Base:</strong>
      <span class="swatch" style="background:${baseHex}"></span>
      ${baseName} <code>${baseHex.toUpperCase()}</code>
    </p>
    ${lightRow("Key",  !!keyEnabled?.checked,  lightColor, lightIntensity, keyAz, keyEl, keyDist)}
    ${lightRow("Fill", !!fillEnabled?.checked, fillColor, fillIntensity, fillAz, fillEl, fillDist)}
    ${lightRow("Rim",  !!rimEnabled?.checked,  rimColor,  rimIntensity,  rimAz, rimEl, rimDist)}
  `;

  if (pickedSamples.length) {
    html += `<hr><p><strong>Samples:</strong></p>`;
    for (const s of pickedSamples) {
      const close = nearestPaint(s.hex);
      const mix   = bestTwoPaintMix(s.hex);
      html += `
        <div style="margin:6px 0; line-height:1.35">
          <span class="swatch" style="background:${s.hex}"></span>
          <code>${s.hex.toUpperCase()}</code><br/>
          <small>Closest:
            <span class="swatch" style="background:${close.hex}"></span>
            ${close.name} <code>${close.hex.toUpperCase()}</code>
          </small><br/>
          <small>Mix:
            ${mix.aPct}% ${mix.aName}
            <span class="swatch" style="background:${mix.aHex}"></span>
            + ${mix.bPct}% ${mix.bName}
            <span class="swatch" style="background:${mix.bHex}"></span>
            → <code>${mix.mixHex.toUpperCase()}</code>
          </small>
        </div>
      `;
    }
  }

  recipeBody.innerHTML = html;
  if (recipePanel) recipePanel.style.display = "";
}

/* ===========================
   picker interactions
   =========================== */
pickerOverlay?.addEventListener("mousemove", (e) => {
  if (pickerOverlay.hidden) return;

  if (pickerCross) {
    pickerCross.style.left = `${e.clientX}px`;
    pickerCross.style.top  = `${e.clientY}px`;
  }
  if (pickerChip) {
    pickerChip.style.left = `${e.clientX + 16}px`;
    pickerChip.style.top  = `${e.clientY + 16}px`;
  }

  const hex = sampleCanvasHexAt(e.clientX, e.clientY);
  setChipAppearance(hex);
});

// Click to add a sample (do NOT exit picker)
pickerOverlay?.addEventListener("click", async (e) => {
  const hex = sampleCanvasHexAt(e.clientX, e.clientY);
  if (!hex) return;

  pickedSamples.push({ hex });
  setChipAppearance(hex);

  try { await navigator.clipboard.writeText(hex.toUpperCase()); } catch {}
  if (newColorHex) newColorHex.value = hex;

  renderPickerRecipe();
});

// open / close picker
enterPickerBtn?.addEventListener("click", enterPickerMode);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") exitPickerMode(); });
pickerOverlay?.addEventListener("contextmenu", (e) => { e.preventDefault(); exitPickerMode(); });

function enterPickerMode() {
  isPickerPaused = true;      // freeze current frame
  controls.enabled = false;
  if (pickerOverlay) pickerOverlay.hidden = false;
  pickedSamples = [];
  renderPickerRecipe();
}
function exitPickerMode() {
  if (pickerOverlay) pickerOverlay.hidden = true;
  controls.enabled = true;
  isPickerPaused = false;     // resume rendering
  setChipAppearance(null);
}

/* ===========================
   Copy button — build text NOW
   =========================== */
function buildCopyTextNow() {
  const { name: baseName, hex: baseHex } = getPaintNameAndHex();
  const on = (x) => !!x?.checked;
  const val = (x, f = (v)=>v) => x ? f(x.value) : undefined;

  const key = {
    enabled: on(keyEnabled),
    hex: hexFromInput(lightColor, "#ffffff").toUpperCase(),
    I: Number(val(lightIntensity, parseFloat)).toFixed(2),
    az: val(keyAz) ?? "0", el: val(keyEl) ?? "0", dist: val(keyDist) ?? "1",
  };
  const fill = {
    enabled: on(fillEnabled),
    hex: hexFromInput(fillColor, "#88AAFF").toUpperCase(),
    I: Number(val(fillIntensity, parseFloat)).toFixed(2),
    az: val(fillAz) ?? "0", el: val(fillEl) ?? "0", dist: val(fillDist) ?? "1",
  };
  const rim = {
    enabled: on(rimEnabled),
    hex: hexFromInput(rimColor, "#FFCC88").toUpperCase(),
    I: Number(val(rimIntensity, parseFloat)).toFixed(2),
    az: val(rimAz) ?? "0", el: val(rimEl) ?? "0", dist: val(rimDist) ?? "1",
  };

  if (pickedSamples.length) {
    const lines = [];
    lines.push(`Base: ${baseName} ${baseHex.toUpperCase()}`);
    if (key.enabled)  lines.push(`Key:  ${key.hex}, I=${key.I}, az=${key.az}°, el=${key.el}°, dist=${key.dist}`);
    if (fill.enabled) lines.push(`Fill: ${fill.hex}, I=${fill.I}, az=${fill.az}°, el=${fill.el}°, dist=${fill.dist}`);
    if (rim.enabled)  lines.push(`Rim:  ${rim.hex}, I=${rim.I}, az=${rim.az}°, el=${rim.el}°, dist=${rim.dist}`);
    lines.push("");
    lines.push("Samples:");
    for (const s of pickedSamples) {
      const close = nearestPaint(s.hex);
      const mix   = bestTwoPaintMix(s.hex);
      lines.push([
        s.hex.toUpperCase(),
        `Closest: ${close.name} ${close.hex.toUpperCase()}`,
        `Mix: ${mix.aPct}% ${mix.aName} + ${mix.bPct}% ${mix.bName} → ${mix.mixHex.toUpperCase()}`
      ].join(" | "));
    }
    return lines.join("\n");
  }

  const shape = shapeSelect?.value || "sphere";
  const state = {
    baseName, baseHex, shape,
    keyHex:  key.hex,  keyInt:  key.enabled  ? Number(key.I)  : 0,
    fillHex: fill.hex, fillInt: fill.enabled ? Number(fill.I) : 0,
    rimHex:  rim.hex,  rimInt:  rim.enabled  ? Number(rim.I)  : 0,
    metalness: material.metalness
  };
  return formatRecipeText(state);
}

copyRecipeBtn?.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(buildCopyTextNow());
    copyRecipeBtn.textContent = "Copied!";
  } catch {
    copyRecipeBtn.textContent = "Copy failed";
  }
  setTimeout(() => (copyRecipeBtn.textContent = "Copy"), 900);
});
