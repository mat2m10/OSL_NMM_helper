import { open } from "@tauri-apps/plugin-opener";

document.getElementById("open-docs").addEventListener("click", () => {
  open("https://tauri.app/");
});
