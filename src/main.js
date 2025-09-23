// src/main.js
import * as THREE from "./vendor/three.module.js";
import { OrbitControls } from "./vendor/OrbitControls.js";
import { MINIATURE_COLORS_RGB } from "./data/miniatureColors.js";
import { PRESETS } from "./data/presets.js";
import { buildRecipeHTML, formatRecipeText } from "./ui/recipe.js";
import { rgbToHex, hexToRgb } from "./lib/colorMath.js";
import { initLights } from "./scene/lights.js";

// ---- small DOM helpers ----
const byId = (id) => document.getElementById(id);
const hexFromInput = (el, fallback = "#ffffff") =>
  el && typeof el.value === "string" ? el.value : fallback;

// ---------- DOM refs ----------
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

const recipeBody     = byId("recipeBody");
const copyRecipeBtn  = byId("copyRecipe");
const newColorName   = byId("newColorName");
const newColorHex    = byId("newColorHex");
const addColorBtn    = byId("addColorBtn");
const baseSwatch     = byId("baseSwatch");

// color-picker UI
const enterPickerBtn = byId("enterPicker");
const pickerOverlay  = byId("pickerOverlay");
const pickerCross    = byId("pickerCross");
const pickerChip     = byId("pickerChip");

// ---------- three.js setup ----------
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  // keep last frame so we can sample it
  preserveDrawingBuffer: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
camera.position.set(2.5, 1.8, 3.2);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// ---------- object & ground ----------
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

// ---- user colour storage / palette ----
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

// ---------- UI wiring ----------
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

  if (copyRecipeBtn && !copyRecipeBtn._wired) {
    copyRecipeBtn._wired = true;
    copyRecipeBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(formatRecipeText(state));
        copyRecipeBtn.textContent = "Copied!";
      } catch {
        copyRecipeBtn.textContent = "Copy failed";
      }
      setTimeout(() => (copyRecipeBtn.textContent = "Copy"), 900);
    });
  }
}

// ---- lights (via module) ----
const { ambient, LIGHTS, updateLight, setFromConf } = initLights(scene, updateRecipe);

// ---- presets / startup ----
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
  // 1) Shape
  if (shapeSelect) { 
    shapeSelect.value = "sphere"; 
    setGeometry("sphere"); 
  }

  // 2) Object colour: Macragge Blue
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

  // Show preset name in dropdown (do NOT apply a preset)
  if (presetSelect) presetSelect.value = "nmmSteel";

  // 3) Lights: only key ON; everything else zeroed
  // Ambient off
  if (typeof ambient !== "undefined") ambient.intensity = 0;

  // Key ON, white. Pick your default intensity here:
  //   1.20 = softer look, 2.00 = brighter specular like your earlier build
  if (keyEnabled) keyEnabled.checked = true;
  if (lightColor) lightColor.value = "#ffffff";
  if (lightIntensity) lightIntensity.value = "1.20"; // change to "2.0" if you prefer
  if (LIGHTS?.key) LIGHTS.key.base = parseFloat(lightIntensity.value);
  updateLight("key");

  // Fill OFF + intensity 0
  if (fillEnabled) fillEnabled.checked = false;
  if (fillIntensity) fillIntensity.value = "0";
  if (LIGHTS?.fill) LIGHTS.fill.base = 0;
  updateLight("fill");

  // Rim OFF + intensity 0
  if (rimEnabled) rimEnabled.checked = false;
  if (rimIntensity) rimIntensity.value = "0";
  if (LIGHTS?.rim) LIGHTS.rim.base = 0;
  updateLight("rim");

  // 4) Recipe panel
  updateRecipe();
}


// listeners
shapeSelect?.addEventListener("change", (e) => { setGeometry(e.target.value); updateRecipe(); });
citadelSelect?.addEventListener("change", (e) => {
  const h = e.target.value;
  material.color.set(h);
  if (baseSwatch) baseSwatch.style.background = h;
  updateRecipe();
});
presetSelect?.addEventListener("change", (e) => applyPreset(e.target.value));

// init & loop
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

// ---------- render loop ----------
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
   COLOR PICKER IMPLEMENTATION
   =========================== */

// DPR-correct sampling of the WebGL canvas at window coords
function sampleCanvasHexAt(clientX, clientY) {
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();

  // only sample when inside canvas area
  if (clientX < rect.left || clientX >= rect.right || clientY < rect.top || clientY >= rect.bottom) {
    return null;
  }

  const fbW = canvas.width;
  const fbH = canvas.height;
  const sx = Math.floor((clientX - rect.left) * (fbW / rect.width));
  const sy = Math.floor((clientY - rect.top)  * (fbH / rect.height));
  const py = fbH - sy - 1; // WebGL origin bottom-left

  const gl = renderer.getContext();
  const pix = new Uint8Array(4);
  gl.readPixels(sx, py, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pix);
  const [r, g, b, a] = pix;

  if (a === 0) return null; // transparent (shouldn’t happen with solid bg)

  const toHex = (v) => v.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function setChipAppearance(hex) {
  if (!pickerChip) return;
  const value = hex || "#------";
  pickerChip.textContent = value;
  pickerChip.style.background = hex || "#eee";

  // flip text for contrast
  if (hex) {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    const luma = 0.2126*r + 0.7152*g + 0.0722*b;
    pickerChip.style.color = luma < 140 ? "#fff" : "#111";
  } else {
    pickerChip.style.color = "#111";
  }
}

// Follow cursor: move cross + chip, update live hex
pickerOverlay?.addEventListener("mousemove", (e) => {
  if (pickerOverlay.hidden) return;

  // crosshair at cursor
  if (pickerCross) {
    pickerCross.style.left = `${e.clientX}px`;
    pickerCross.style.top  = `${e.clientY}px`;
  }
  // chip near cursor
  if (pickerChip) {
    pickerChip.style.left = `${e.clientX + 16}px`;
    pickerChip.style.top  = `${e.clientY + 16}px`;
  }

  const hex = sampleCanvasHexAt(e.clientX, e.clientY);
  setChipAppearance(hex);
});

// Click to copy hex; also prefill custom color; exit picker
pickerOverlay?.addEventListener("click", async (e) => {
  const hex = sampleCanvasHexAt(e.clientX, e.clientY);
  if (!hex) return;
  try {
    await navigator.clipboard.writeText(hex.toUpperCase());
    if (pickerChip) pickerChip.textContent = `${hex.toUpperCase()} ✓`;
    if (newColorHex) newColorHex.value = hex;
  } catch {
    if (pickerChip) pickerChip.textContent = `${hex.toUpperCase()} (copy failed)`;
  }
  // slight delay so user can see ✓, then exit
  setTimeout(exitPickerMode, 140);
});

// open / close picker
enterPickerBtn?.addEventListener("click", enterPickerMode);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") exitPickerMode(); });
pickerOverlay?.addEventListener("contextmenu", (e) => { e.preventDefault(); exitPickerMode(); });

function enterPickerMode() {
  isPickerPaused = true;      // freeze current frame (buffer preserved)
  controls.enabled = false;
  if (pickerOverlay) pickerOverlay.hidden = false;
}
function exitPickerMode() {
  if (pickerOverlay) pickerOverlay.hidden = true;
  controls.enabled = true;
  isPickerPaused = false;     // resume rendering
}
