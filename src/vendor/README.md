# Vendored third-party code

These files are checked in so the app runs with no Node build step.
Do not edit them by hand; replace them from upstream when upgrading.

| File | Upstream | Version | License |
|------|----------|---------|---------|
| `three.module.js` | [three](https://www.npmjs.com/package/three) `build/three.module.js` | 0.160.0 (r160) | MIT, Copyright 2010-2023 Three.js Authors |
| `OrbitControls.js` | [three](https://www.npmjs.com/package/three) `examples/jsm/controls/OrbitControls.js` | 0.160.0 (r160) | MIT, Copyright 2010-2023 Three.js Authors |

Local changes: `OrbitControls.js` imports from `'./three.module.js'` instead of
`'three'` (line 12). `three.module.js` is byte-identical to upstream.

SHA-256 (as committed):

```
76dea8151bc9352aef3528b4262e249b2604f62543828328db978d060d61a495  three.module.js
6b2f7df940a94e9aefe48466d8722c882e1430072c1dd680e978e0d70527ff00  OrbitControls.js
```

## Upgrading

```bash
V=0.160.0   # new version
curl -fsSLo src/vendor/three.module.js  "https://unpkg.com/three@$V/build/three.module.js"
curl -fsSLo src/vendor/OrbitControls.js "https://unpkg.com/three@$V/examples/jsm/controls/OrbitControls.js"
sed -i "s#from 'three';#from './three.module.js';#" src/vendor/OrbitControls.js
```

Then update the version and hashes above.
