# 🐠 Fish Tycoon

A desktop fish-breeding tycoon game inspired by the classic *Fish Tycoon*. Pure HTML/CSS/JS — no build step.

## Run
- **Quickest:** open `index.html` in any modern browser.
- **As a desktop app:** `npm install && npm start` (Electron wrapper in `main.js`).

Progress auto-saves to local storage (and fish keep growing while you're away, up to 4 hours).

## Features
- **Store** – an isometric 3D fish shop: your displayed fish swim in glass cases, customers walk in through the door and queue at the counter with their offers. Accept, decline or hire a cashier to auto-accept. Store upgrades add stools, posters and a cashier to the room.
- **Aquarium Hall** – keep every tank you buy; each has a water rating (size + filter + aerator) that decides which fish tier it supports. Freshwater and (later) saltwater tanks.
- **Shop** – tiered eggs (T1–T5, fresh & salt; each egg family hatches 4 species, Mystery eggs hatch all 8 of the tier), tanks, tank upgrades, plants/rocks/accessories/backgrounds with bonuses (growth, value, modifier chance, tier-up, inheritance), food upgrades, tank skins, store and breeding upgrades.
- **Growing** – hatched fish start as babies; feed them to grow faster (better food = bigger multiplier).
- **Modifiers** – 31 modifiers in 4 tiers (up to Mythic) multiply value and stack (each only once per fish), and each has its own live effect: pearl shimmer, golden sparkles, flames, snow, electric arcs, northern lights, a twinkling galaxy, rainbow cycling, shadow wisps, a celestial halo…
- **Breeding** – any two adult fish of the same water type. Offspring takes either parent's species, has a small chance of a higher tier, inherits each parent's modifiers with some probability and can roll new ones — so you can stack modifiers generation after generation.
- **Art** – everything is generated as 3D voxel models at runtime (no image files) and rendered with [three.js](https://threejs.org) (vendored in `js/vendor`, MIT) from an isometric camera: anatomy-based fish with rayed fins, gills, scales and tails that really swim and bend, 21 hand-built voxel decorations (plants sway), and a glass aquarium sized per tank type. Needs a browser with WebGL.
- **Decor** can be placed and removed freely (back to your inventory).

## Management & progression
- **Water quality** – feeding dirties a tank; dirty water slows growth and lowers value. Clean tanks for a fee; filters and aerators help.
- **Locked automation** – *Feed all* and *Hatch all* are bought as upgrades in Shop → Management.
- **Staff** – hire feeders, aquarists, handlers and hatchers (3 levels each). They draw wages every minute.
- **Favourites** – star a fish to protect it from selling and auto-actions.
- **Names & family tree** – every fish is named (rename it any time) and records its parents and generation; open its family tree from the fish card.
- **Contracts** – special orders with deadlines asking for species/tier/modifiers, paying a premium.
- **Collection book** – discover every species and modifier; claim milestone rewards. The store shows your most valuable fish yet.
- **Achievements & stats** – 35 achievements with cash rewards and a lifetime stats page.
- **Seasonal events** – six real-date events (Valentine's, St. Patrick's, Spring, Summer, Halloween, Winter), each with its own tank, event species and modifiers (e.g. Pot of Gold, Lucky Charms). Selling event fish earns event tokens, spent on event skins, backgrounds and decor. Preview any event from the Events tab.
- **Hero fish** – expensive, unsellable companions (cleaner wrasse, nurse shark, sage koi, octopus, turtle, jellyfish, dragon eel) that roam a tank without using capacity and grant bonuses (e.g. nurse shark speeds baby growth).
- **Camera** – wheel zoom, drag to pan, double-click reset, rotate and tilt buttons, and a photo button.
