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

## v1.1 – quality of life
- **Auto-rules** (Shop → Management → Auto-Sorter, then Inventory) – up to eight rules such as *sell adults with no modifiers below tier 3*, *keep the best 2 of each species* or *sell everything tagged "Sell soon"*. Preview what would be sold, run them on demand, or flip the master switch to run them every few seconds. Favourites, protected tags, fish on display, show entrants, fish that fit an open order and fish that satisfy the current campaign boss are never touched.
- **Sale tanks** – mark a tank as a Sale tank (tank page → Sale tank). The Display Handler and Auto-fill only draw from Sale tanks and fish tagged “Sell soon”; breeding stock in normal tanks is never sold automatically, and bred eggs never auto-hatch into a Sale tank.
- **Fish tags** – Breeding stock, Boss candidate, Show fish, Keeper (all protected) and Sell soon. Tag from any fish panel or tag everything you are looking at; the Inventory and Breeding filters have a Tag filter, and Sell all / Auto-fill skip protected tags.
- **Progressive menu** – Home and Fish Shows unlock at store level 2, Expeditions and Research at 3, the Campaign at 4. A new player sees 10 tabs instead of 15, gets a one-time "new" card when something unlocks and a NEW badge until they visit it. Existing saves keep everything they already had.
- **First-hour checklist** – six small goals (hatch, grow up, sell, clean, breed, reach level 2) with rewards and a completion bonus, shown on the Store page.
- **While you were away** – one card on launch: what grew up, what is still growing, boats and daily rewards waiting, tanks that need cleaning.
- **Day & night** – a game clock (8 real minutes per day; or follow your computer's clock, or force day/night in the Menu). The scenes are tinted for dawn, dusk and night, and the store has a lunch rush and an evening crowd (customers ×2 at noon, about half at night; averages out to the same traffic as before).
- **Breeding planner** – Breeding → Planner (also from the Campaign and special orders): pick a species and up to five modifiers and it finds the cheapest chain of pairings using the fish you own, including how many eggs to buy and how long it should take.
- **Version** – the version and changelog are on the Menu page; the Windows installer is named after it.

## Latest changes
- **No more resets** – scenes survive page refreshes, so fish keep swimming smoothly and customers keep walking.
- **Living store** – customers enter, wander between your display tanks, and only walk to the counter (with an offer bubble above their heads) when they want to buy. They leave when their patience runs out.
- **Mystery babies** – every baby looks the same ("Hatched a Common Baby"); species and modifiers are revealed when it grows up.
- **Drag & drop hatching** – drag an egg from the tray onto an aquarium (or onto a tank card in the hall) to hatch it. Works for event tanks too.
- **Dirty glass & sponge** – smudges appear below 85% water quality (more at 75/50/25%, algae below 10%). Drag the sponge over the glass to clean it. Dirty water lowers the value of the fish in that tank.
- **Tank sidebar** – every aquarium lists its fish; click one to select it in the tank, then sell, breed or move it. The inventory can be filtered by aquarium.
- **Staff roster** – see everyone you have hired and pause them while money is tight.
- **Breeding** – each parent modifier is inherited independently (none, one or several) plus a small chance of one brand-new modifier.
- **Economy** – steeper egg prices (breed instead!), pricier tanks and hall slots, and many more upgrades: a Research lab (11 permanent upgrades), new tank, store and breeding upgrades, new food, skins, mutagens and facilities.
- **Events** – eggs cost event tokens and event fish sell for tokens only. Each event gives welcome tokens and now has 7 rewards (skin, background, decoration, trophy, mutagen kit, egg crate and a permanent charm).
- **Home** – an isometric living room with a huge aquarium showing your 20 most valuable fish ever. Boop fish, lure them with the mouse and sprinkle food.
- **End-game** – build *The Great Sanctuary* (Stats page) in five stages to become an Ocean Legend.

## Expeditions, shows and dailies
- **Expeditions** – an isometric sea map with 8 voxel islands (Coral Lagoon, Mangrove Swamp, Kelp Forest, Amazon River, Arctic Ice Shelf, Deep Trench, Volcanic Vents, Sunken City). Boats sail there in real time (even while you are away) and return with **wild eggs** of 41 exclusive species plus a special modifier per location (Reef-Glow, Kelp-Wrapped, Mud-Skinned, Jungle-Painted, Glacial, Abyssal, Ember-Forged, Ancient). Choose supplies, buy more boats and upgrade the fleet (hull, crew, nets, sonar, storm shelter). Storms can cut a trip short.
- **Fish shows** – five leagues (Local Fair → World Aquatic Grand Prix) unlocked with store level and fame. Each show has a category (Grand Champion, Modifier Marvel, Rare Breed, Bloodline Cup, Freshwater Cup, Reef Cup); enter up to three fish, then the judges rank you against seven rival breeders. Top three win prizes, fame and **medals** (+5% / +2.5% / +1.2% fish value, up to +60%). Watch it all happen in an isometric show hall with a podium and an audience.
- **Tournaments** – three head-to-head rounds in different categories; every fish can fight once. The prize is triple the league's first prize.
- **Daily page** – a 7-day login streak with escalating rewards (shields forgive a missed day, long streaks give permanent value bonuses) and three daily quests with a bonus chest.

## Research tree & Ocean Campaign
- **Research** – a prerequisite tree of 39 upgrades in six branches (Husbandry, Genetics, Commerce, Exploration, Showmanship, Management) with a keystone capstone at the bottom of each. Nodes cost money *and* research points (RP). RP come from discovering species and modifiers, winning shows and tournaments, returning from expeditions, daily quests, achievements, the Sanctuary and campaign bosses — or you can fund it with money. Effects reach every system: growth, tank capacity, mutation/inheritance/clutch size, breeding speed, customer traffic and offers, expedition speed, catches and storms, show scores, fame and prizes, and staff.
- **Ocean Campaign** – twelve voxel islands in an isometric archipelago, hidden in fog until you beat the boss before them. Each boss fish demands an exact species with specific modifiers (and sometimes a minimum generation, or a modifier only found on expeditions): breed it, then challenge the boss. Victory brings money, research points, mutagens and a permanent perk, and the last island makes you Admiral of the Seas.
