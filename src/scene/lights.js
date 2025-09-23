// src/scene/lights.js
import * as THREE from "../vendor/three.module.js";

// degrees → radians
const toRad = (d) => (d * Math.PI) / 180;

function setDirFromSpherical(light, azDeg, elDeg, dist) {
  const az = toRad(azDeg);
  const el = toRad(elDeg);
  const r  = Math.max(0.1, dist);
  const x = r * Math.cos(el) * Math.sin(az);
  const y = r * Math.sin(el);
  const z = r * Math.cos(el) * Math.cos(az);
  light.position.set(x, y, z);
  light.lookAt(0, 0, 0);
}

// DirectionalLight doesn't attenuate with distance; fake it for UX
function distToIntensity(base, dist) {
  const scale = 5 / Math.max(0.1, dist); // closer => stronger
  return Math.max(0, base * scale);
}

function computeSphericalFromPosition(p) {
  const r = Math.sqrt(p.x*p.x + p.y*p.y + p.z*p.z) || 1;
  const elDeg = (Math.asin(p.y / r) * 180) / Math.PI;
  const azDeg = (Math.atan2(p.x, p.z) * 180) / Math.PI;
  return { r, elDeg, azDeg };
}

/**
 * Initialize scene lights and wire all UI sliders/toggles.
 * @param {THREE.Scene} scene
 * @param {Function} onChange - called whenever a light changes (use to update recipe)
 * @returns {{ambient,keyLight,fillLight,rimLight,LIGHTS,updateLight,setFromConf}}
 */
export function initLights(scene, onChange) {
  // --- create lights ---
  const ambient = new THREE.AmbientLight(0xffffff, 0.25);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
  keyLight.position.set(3, 4, 2);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x88aaff, 0.5);
  fillLight.position.set(-2, 1.5, -1);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xffcc88, 0.6);
  rimLight.position.set(-2.5, 2.0, -2.5);
  scene.add(rimLight);

  // --- DOM refs ---
  const $ = (id) => document.getElementById(id);

  const LIGHTS = {
    key: {
      light: keyLight,
      enabledEl: $("keyEnabled"),
      colorEl: $("lightColor"),
      swatchEl: $("keySwatch"),
      baseIntEl: $("lightIntensity"),
      azEl: $("keyAz"),
      elEl: $("keyEl"),
      distEl: $("keyDist"),
      base: parseFloat(($("lightIntensity")?.value) || "1.2"),
    },
    fill: {
      light: fillLight,
      enabledEl: $("fillEnabled"),
      colorEl: $("fillColor"),
      swatchEl: $("fillSwatch"),
      baseIntEl: $("fillIntensity"),
      azEl: $("fillAz"),
      elEl: $("fillEl"),
      distEl: $("fillDist"),
      base: parseFloat(($("fillIntensity")?.value) || "0.5"),
    },
    rim: {
      light: rimLight,
      enabledEl: $("rimEnabled"),
      colorEl: $("rimColor"),
      swatchEl: $("rimSwatch"),
      baseIntEl: $("rimIntensity"),
      azEl: $("rimAz"),
      elEl: $("rimEl"),
      distEl: $("rimDist"),
      base: parseFloat(($("rimIntensity")?.value) || "0.6"),
    },
  };

  function hexFromInput(el, fallback = "#ffffff") {
    return el && typeof el.value === "string" ? el.value : fallback;
  }

  function updateLight(name) {
    const S = LIGHTS[name];
    if (!S) return;
    const enabled = S.enabledEl?.checked ?? true;
    const az   = parseFloat(S.azEl?.value   ?? "0");
    const el   = parseFloat(S.elEl?.value   ?? "45");
    const dist = parseFloat(S.distEl?.value ?? "5");

    setDirFromSpherical(S.light, az, el, dist);

    if (S.colorEl) {
      const hex = hexFromInput(S.colorEl, "#ffffff");
      S.light.color.set(hex);
      if (S.swatchEl) S.swatchEl.style.background = hex;
    }

    S.light.visible   = enabled;
    S.light.intensity = enabled ? distToIntensity(S.base, dist) : 0;

    onChange && onChange();
  }

  function initLight(name) {
    const S = LIGHTS[name];
    if (!S) return;

    // seed sliders from current 3D position
    if (S.azEl && S.elEl && S.distEl) {
      const { r, elDeg, azDeg } = computeSphericalFromPosition(S.light.position);
      if (!S.azEl.value)   S.azEl.value   = String(Math.round(azDeg));
      if (!S.elEl.value)   S.elEl.value   = String(Math.round(elDeg));
      if (!S.distEl.value) S.distEl.value = String(r.toFixed(1));
    }

    // listeners
    S.enabledEl?.addEventListener("change", () => updateLight(name));
    S.colorEl?.addEventListener("input", () => updateLight(name));
    S.baseIntEl?.addEventListener("input", (e) => {
      S.base = parseFloat(e.target.value || "0");
      updateLight(name);
    });
    S.azEl?.addEventListener("input", () => updateLight(name));
    S.elEl?.addEventListener("input", () => updateLight(name));
    S.distEl?.addEventListener("input", () => updateLight(name));

    updateLight(name);
  }

  // initialize all three
  initLight("key");
  initLight("fill");
  initLight("rim");

  // helper used by presets
  function setFromConf(name, conf) {
    const S = LIGHTS[name];
    if (!S || !conf) return;
    if (conf.color && S.colorEl) S.colorEl.value = conf.color;
    if (typeof conf.intensity === "number" && S.baseIntEl) {
      S.baseIntEl.value = String(conf.intensity);
      S.base = conf.intensity;
    }
    if (Array.isArray(conf.pos)) {
      const p = new THREE.Vector3(conf.pos[0], conf.pos[1], conf.pos[2]);
      const { r, elDeg, azDeg } = computeSphericalFromPosition(p);
      if (S.azEl)   S.azEl.value   = String(Math.round(azDeg));
      if (S.elEl)   S.elEl.value   = String(Math.round(elDeg));
      if (S.distEl) S.distEl.value = String(r.toFixed(1));
    }
    updateLight(name);
  }

  return { ambient, keyLight, fillLight, rimLight, LIGHTS, updateLight, setFromConf };
}
