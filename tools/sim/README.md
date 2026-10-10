# Economy simulation

A headless bot plays the game logic (no DOM) for N simulated hours and prints level times, income and milestones.

    SEED=3 node tools/sim/run.js 26        # 26 simulated hours, seeded RNG
    SEED=3 node tools/sim/runlog.js 12 20000 log.txt   # purchases of $20,000 and up

The bot hatches and feeds, breeds its best pair, displays adults, accepts fair offers, sells surplus at the market and
buys the cheapest affordable upgrade (store → capacity → quality → decor). It does not do expeditions, shows or the campaign.
