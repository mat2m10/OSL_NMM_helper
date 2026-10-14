# Paint palettes

One JSON file per brand, mapping the paint name shown in the app to a
`#rrggbb` display colour. Order is kept in the dropdown.

| File | Brand | Source | Last checked |
|------|-------|--------|--------------|
| `citadel.json` | Citadel (Games Workshop) | TODO | TODO |
| `vallejo.json` | Vallejo (Model Color 70.xxx, Game Color 72.xxx, some Model Air 71.xxx) | TODO | TODO |
| `armyPainter.json` | The Army Painter | TODO | TODO |

Hex values are display approximations of the real paints, not lab
measurements. To add or fix a paint, edit the JSON (keep `"Name": "#rrggbb"`)
and open a PR.
