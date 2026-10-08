# 🐠 Fish Tycoon

A desktop fish-breeding tycoon game inspired by the classic *Fish Tycoon*. Pure HTML/CSS/JS — no build step.

## Run
- **Quickest:** open `index.html` in any modern browser.
- **As a desktop app:** `npm install && npm start` (Electron wrapper in `main.js`).

Progress auto-saves to local storage (and fish keep growing while you're away, up to 4 hours).

## Features
- **Store** – put grown fish on display; customers (browsers, enthusiasts, bargain hunters, collectors) make offers. Hire a cashier to auto-accept.
- **Aquarium Hall** – keep every tank you buy; each has a water rating (size + filter + aerator) that decides which fish tier it supports. Freshwater and (later) saltwater tanks.
- **Shop** – tiered eggs (T1–T5, fresh & salt), tanks, tank upgrades, plants/rocks/accessories/backgrounds with bonuses (growth, value, modifier chance, tier-up, inheritance), food upgrades, tank skins, store and breeding upgrades.
- **Growing** – hatched fish start as babies; feed them to grow faster (better food = bigger multiplier).
- **Modifiers** – 11 modifiers in 3 tiers (Pearlescent … Cosmic) multiply value and stack; each only once per fish.
- **Breeding** – any two adult fish of the same water type. Offspring takes either parent's species, has a small chance of a higher tier, inherits each parent's modifiers with some probability and can roll new ones — so you can stack modifiers generation after generation.
- **Art** – everything is generated as 3D voxel models at runtime (no image files) and rendered with [three.js](https://threejs.org) (vendored in `js/vendor`, MIT) from an isometric camera: anatomy-based fish with rayed fins, gills, scales and tails that really swim and bend, 21 hand-built voxel decorations (plants sway), and a glass aquarium sized per tank type. Needs a browser with WebGL.
- **Decor** can be placed and removed freely (back to your inventory).
