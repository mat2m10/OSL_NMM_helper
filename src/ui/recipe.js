// src/ui/recipe.js
import { computeHighlightsShades, nearestPaint, nearestPaintMix } from "../lib/colorMath.js";

export function buildRecipeHTML(state, paletteRGB) {
  const { baseHex, baseName, shape, keyHex, keyInt, fillHex, fillInt, rimHex, rimInt, metalness } = state;

  const { highlights, shades } = computeHighlightsShades(
    baseHex,
    { keyHex, keyInt, fillHex, fillInt, rimHex, rimInt },
    metalness
  );

  const labelFor = (hex) => {
    const one = nearestPaint(paletteRGB, hex);
    const mix = nearestPaintMix(paletteRGB, hex);
    const improved = mix.d < one.d * 0.65; // heuristic
    return improved
      ? `≈ mix: ${mix.nameA} ${(1-mix.t)*100|0}% + ${mix.nameB} ${(mix.t*100)|0}%`
      : `≈ ${one.name}`;
  };

  return `
    <p><strong>Shape:</strong> ${shape}</p>
    <p><span class="swatch" style="background:${baseHex}"></span><strong>Base:</strong> ${baseName} (${baseHex})</p>
    <p><span class="swatch" style="background:${keyHex}"></span><strong>Key:</strong> ${keyHex}, I=${Number(keyInt).toFixed(2)}</p>
    <p><span class="swatch" style="background:${fillHex}"></span><strong>Fill:</strong> ${fillHex}, I=${Number(fillInt).toFixed(2)}</p>
    <p><span class="swatch" style="background:${rimHex}"></span><strong>Rim:</strong> ${rimHex}, I=${Number(rimInt).toFixed(2)}</p>

    <p><strong>Highlights:</strong></p>
    <p><span class="swatch" style="background:${highlights[0]}"></span> Mid highlight ${highlights[0]} <em>${labelFor(highlights[0])}</em></p>
    <p><span class="swatch" style="background:${highlights[1]}"></span> Edge highlight ${highlights[1]} <em>${labelFor(highlights[1])}</em></p>

    <p><strong>Shades:</strong></p>
    <p><span class="swatch" style="background:${shades[0]}"></span> Soft shade ${shades[0]} <em>${labelFor(shades[0])}</em></p>
    <p><span class="swatch" style="background:${shades[1]}"></span> Deep shade ${shades[1]} <em>${labelFor(shades[1])}</em></p>
  `;
}

export function formatRecipeText(state) {
  const { baseHex, baseName, shape, keyHex, keyInt, fillHex, fillInt, rimHex, rimInt } = state;
  return `OSL NMM Helper – Recipe
Shape: ${shape}
Base: ${baseName} (${baseHex})
Key: ${keyHex}, intensity ${Number(keyInt).toFixed(2)}
Fill: ${fillHex}, intensity ${Number(fillInt).toFixed(2)}
Rim: ${rimHex}, intensity ${Number(rimInt).toFixed(2)}`;
}
