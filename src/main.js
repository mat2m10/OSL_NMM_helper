import * as THREE from "./vendor/three.module.js";
import { OrbitControls } from "./vendor/OrbitControls.js";

const canvas = document.getElementById("viewport");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

// Camera
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
camera.position.set(2.5, 1.8, 3.2);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Default geometry & material (we'll make this selectable later)
const geometry = new THREE.SphereGeometry(1, 64, 64);
// start with a moderately shiny material (good baseline for NMM experiments)
const material = new THREE.MeshStandardMaterial({
  color: 0xcccccc,
  metalness: 0.6,
  roughness: 0.25,
});
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

// Ground plane (subtle reference)
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10),
  new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 1, metalness: 0 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -1.1;
scene.add(ground);

// Lights (we’ll make them user-editable later)
const ambient = new THREE.AmbientLight(0xffffff, 0.25);
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
keyLight.position.set(3, 4, 2);
scene.add(keyLight);

// Handle resize
function resize() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (canvas.width !== w || canvas.height !== h) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
}
window.addEventListener("resize", resize);
resize();

// Render loop
function tick() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();
