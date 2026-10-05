/* ==========================================================================
   GLITCH//LS — curated content (the "baseline").
   Reviewed: October 5, 2026 (after the Kortz Center Heist update, Halloween event week).

   data/live.js (written by updater/update.mjs) is merged over this at load time:
   this week's event, payouts, prices, and the community glitch list. Anything the updater
   can't refresh falls back to what's here.

   All payouts are GTA$. Figures are community-sourced and shift with Rockstar's economy patches.
   `estimate: true` means the run time or payout is our own estimate, not a sourced number.
   ========================================================================== */

const SITE = {
  reviewed: "2026-10-05",
  reviewedLabel: "October 5, 2026",
  gta6Release: "2026-11-19T00:00:00",
  hubUrl: "https://gtaglitches.com/working-glitches",
};

/* Entry prices of the cheapest realistic option for each property (approximate). */
const PROPERTIES = [
  { id: "agency",   name: "Agency",                cost: 2010000 },
  { id: "kosatka",  name: "Kosatka Submarine",     cost: 2200000 },
  { id: "studio",   name: "Mansion + Art Studio",  cost: 16200000 },
  { id: "hangar",   name: "McKenzie Field Hangar", cost: 1475000 },
  { id: "autoshop", name: "Auto Shop",             cost: 1670000 },
  { id: "salvage",  name: "Salvage Yard",          cost: 1620000 },
  { id: "bail",     name: "Bail Office",           cost: 1650000 },
  { id: "carwash",  name: "Hands On Car Wash",     cost: 1000000 },
  { id: "acid",     name: "Acid Lab",              cost: 750000 },
  { id: "bunker",   name: "Bunker",                cost: 1165000 },
  { id: "nightclub",name: "Nightclub",             cost: 1500000 },
];

/* --------------------------------------------------------------------------
   Active money methods (legit — no ban risk).
   payout       typical payout per repeat run     firstWeekly  first run after the Thursday reset
   minutes      active minutes per run            cooldown     minutes before the method can be started again
   weeklyLimit  max runs per week                 replayFee    fee that comes off repeat runs
   tutorial     { needs[], steps[], tips[], watch[] } shown in the guide popup
   -------------------------------------------------------------------------- */
const METHODS = [
  {
    id: "dre", name: "The Data Leaks (Dr. Dre Contract)", type: "contract", requires: "agency",
    payout: 900000, firstWeekly: 1099800, minutes: 45, cooldown: 48, solo: true, estimate: true,
    payoutLabel: "$900K ($1.1M first of the week)",
    blurb: "GTA Boss ranks this the best solo earner in the game. Own an Agency, finish one Security Contract, then run the Dre contract on repeat. The July 2026 rebalance cut the base payout from $1M to $900K.",
    tips: ["The first completion each week pays $1,099,800.", "Run time is an estimate: no source has timed the full solo loop."],
    tutorial: {
      needs: ["An Agency (cheapest is about $2.01M)", "One completed Security Contract (this unlocks the Dre contract)", "An armored vehicle and strong weapons for the finale"],
      steps: [
        "Buy an Agency and finish your first Security Contract from the computer in your office.",
        "Start Dr. Dre's contract from the same computer and play the setup work in order.",
        "Launch the finale (The Data Leaks) and play it through to the payout.",
        "Collect $900,000, or $1,099,800 if it's your first completion since Thursday's reset.",
        "The contract can be replayed after a cooldown of roughly 48 to 60 minutes (sources vary). Spend the wait on another job, such as Auto Shop contracts or Security Contracts.",
      ],
      tips: ["Replays skip the full setup, so a rotation of Dre plus one other method keeps you earning all session."],
      watch: ["Payout dropped from $1M to $900K in the July 2026 economy pass. Older videos quote the old number."],
    },
  },
  {
    id: "kortz", name: "The Kortz Center Heist", type: "heist", requires: "studio",
    payout: 400000, firstWeekly: 2200000, minutes: 75, cooldown: 144, replayFee: 100000, solo: true,
    payoutLabel: "~$2.2M first of the week · ~$400K after",
    blurb: "The newest heist (July 14, 2026). You steal paintings from the Kortz Center for Raf De Angelis. The first primary sale each week pays 4×. Repeat runs drop to about $400K minus a $100K planning fee.",
    tips: ["First sale of the week: La Dernière Débauche pays $1,925,000.", "Do it once per week for the bonus, then move on to something else."],
    tutorial: {
      needs: ["A Mansion plus the Art Studio upgrade (Art Studio is $4.7M; GTA Boss counts $16.2M all-in)", "Solo or up to 4 players"],
      steps: [
        "Own a Mansion and buy the Art Studio. The planning board is inside the Art Studio.",
        "Start the heist from the planning board, or by calling Raf De Angelis from your phone.",
        "Pick an approach, escape route and loadout, then complete the prep missions.",
        "Play the finale at the Kortz Center in Pacific Bluffs: get into the vault and take the primary painting.",
        "Fill your loot bag with secondary art on the way out. Each painting takes about half the bag, so take the most valuable first.",
        "Sell the primary target. The first sale after the weekly reset pays 4×, up to $1.925M for La Dernière Débauche.",
      ],
      tips: ["A verified solo stealth run paid about $2.18M.", "After a run, Raf calls back in about 2h 24m. Replaying costs $100K.", "Starting a replay within 15 minutes of Raf's call puts you on Hard mode for +10% pay."],
      watch: ["Repeat runs pay only about $400K gross ($300K after the fee). Don't grind this one.", "Rockstar patched 13 heist bugs on July 30, so older stealth tips may no longer work."],
    },
  },
  {
    id: "cayo", name: "The Cayo Perico Heist", type: "heist", requires: "kosatka",
    payout: 655000, minutes: 60, cooldown: 144, solo: true,
    payoutLabel: "$400K–$910K primary + secondaries",
    blurb: "Rockstar cut target values in July 2026 and Cayo gets no weekly first-run bonus anymore, but it's still the most reliable heist you can fully solo.",
    tips: ["The payout shown is the middle of the primary-target range. Secondary loot adds on top.", "Gold secondaries need a second player to be worth carrying."],
    tutorial: {
      needs: ["A Kosatka submarine ($2.2M)", "Solo works. A partner helps with gold"],
      steps: [
        "Buy the Kosatka and open the heist planning screen inside the submarine.",
        "Scope out the island and choose your primary target (values run $400K to $910K).",
        "Complete the prep missions for your approach.",
        "Run the finale: infiltrate the compound, take the primary target, then fill your bag with the best secondaries.",
        "Leave the island. Solo players then face a 144-minute cooldown.",
      ],
      tips: ["Fill the 144-minute cooldown with Dre or Auto Shop runs."],
      watch: ["Target values were reduced in July 2026, so old videos overstate the payout."],
    },
  },
  {
    id: "titan", name: "The Titan Job (Oscar Guzman Flies Again)", type: "heist", requires: "hangar",
    payout: 750000, firstWeekly: 1125000, minutes: 60, cooldown: 60, solo: true, estimate: true,
    payoutLabel: "$750K Hard ($1.125M first of the week)",
    blurb: "A heist run from the McKenzie Field Hangar. Normal pays $500K and Hard pays $750K. Since the July 2026 economy pass, the first Hard clear each week pays 1.5× ($1,125,000).",
    tips: ["Optimized runs are reported at 50 to 65 minutes (single source, so treat as provisional)."],
    tutorial: {
      needs: ["McKenzie Field Hangar ($1.475M)"],
      steps: [
        "Buy the McKenzie Field Hangar.",
        "Start The Titan Job from your hangar and complete the prep missions.",
        "Play the finale on Hard: $750,000.",
        "Your first Hard clear after Thursday's reset pays $1,125,000.",
      ],
      tips: ["Hard pays 50% more than Normal."],
      watch: ["Run times come from a single source. Expect your first runs to take 70 to 90 minutes."],
    },
  },
  {
    id: "cluckin", name: "Cluckin' Bell Farm Raid", type: "heist", requires: null,
    payout: 400000, firstWeekly: 600000, minutes: 55, cooldown: 60, solo: true, estimate: true,
    payoutLabel: "$400K ($600K first of the week)",
    blurb: "The best money method that needs no property. It's fully soloable and costs nothing to start.",
    tips: ["Do this before buying anything. It funds your first Agency or Kosatka."],
    tutorial: {
      needs: ["Nothing. No property or purchase needed"],
      steps: [
        "Find the Cluckin' Bell Farm Raid in your in-game job or heist list and start it.",
        "Complete the prep missions, then the finale.",
        "Collect $400,000, or $600,000 on your first completion each week.",
        "Wait out the roughly one-hour cooldown before repeating.",
      ],
      tips: ["It's your best starter method: free, solo, and the first run pays 50% extra."],
      watch: ["Run time is our estimate. GTA Boss lists only the cooldown (about one hour)."],
    },
  },
  {
    id: "knoway", name: "KnoWay Out (A Clean Break)", type: "contract", requires: null,
    payout: 367500, firstWeekly: 683550, minutes: 45, cooldown: 48, solo: true, estimate: true,
    payoutLabel: "$367.5K Hard ($683K first of the week)",
    blurb: "Part of 'A Safehouse in the Hills' (Dec 2025), where Michael De Santa and Avi go after the KnoWay AI surveillance network. GTA Boss lists it as free to start, with the biggest weekly multiplier in the game (1.86×).",
    tips: ["Normal pays $245K, Hard pays $367.5K.", "Total run time is our estimate. An optimized solo Hard finale is reported at under 9 minutes."],
    tutorial: {
      needs: ["Nothing extra. GTA Boss lists no property cost", "Play on Hard for the better payout"],
      steps: [
        "Start KnoWay Out (GTA Boss says it's accessible through a payphone in Little Seoul).",
        "Complete the missions and the finale on Hard.",
        "Collect $367,500. Your first Hard clear after the weekly reset pays up to $683,550.",
      ],
      tips: ["Do it on Thursday for the 1.86× first-run bonus."],
      watch: ["Mission order and timing are thinly documented. Check the GTA Boss walkthrough linked in the sources."],
    },
  },
  {
    id: "salvage", name: "Salvage Yard Robberies", type: "contract", requires: "salvage",
    payout: 325000, minutes: 35, cooldown: 0, weeklyLimit: 3, solo: true, estimate: true,
    payoutLabel: "$240K–$410K per vehicle",
    blurb: "Three robberies per week, each one a vehicle to steal. Keep the car or salvage it for cash. Capped at 3 a week, so it's a great top-up rather than a grind.",
    tips: ["This week's three robberies are listed in the 'This Week' section."],
    tutorial: {
      needs: ["Salvage Yard ($1.62M)"],
      steps: [
        "Buy the Salvage Yard and check the weekly robbery list on its computer.",
        "Start a robbery and complete its prep, then steal the target vehicle.",
        "Get the vehicle back to your yard.",
        "Decide whether to keep the car or salvage it. Payout is $240K to $410K gross per vehicle.",
        "Repeat for up to 3 robberies a week.",
      ],
      tips: ["Top-tier robberies (listed each week) pay the most."],
      watch: ["Only 3 per week. Fill the rest of your session with other methods."],
    },
  },
  {
    id: "autoshop", name: "Auto Shop Contracts", type: "contract", requires: "autoshop",
    payout: 160000, minutes: 30, cooldown: 0, solo: true, estimate: true,
    payoutLabel: "$153K–$166K net",
    blurb: "Short repeatable contracts. GTA Boss estimates $306K to $333K per hour when rotating three contracts (a single-source figure).",
    tips: ["Payout is net after the 10% cut."],
    tutorial: {
      needs: ["Auto Shop ($1.67M)"],
      steps: [
        "Buy an Auto Shop.",
        "Pick a contract from the shop's board.",
        "Complete the contract.",
        "Collect your net payout (about $153K to $166K) and start the next one.",
      ],
      tips: ["Rotating between different contracts keeps each run quick."],
      watch: ["There's no weekly first-run bonus on Auto Shop contracts."],
    },
  },
  {
    id: "security", name: "Agency Security Contracts", type: "contract", requires: "agency",
    payout: 45000, minutes: 10, cooldown: 0, solo: true, estimate: true,
    payoutLabel: "$30K–$60K each",
    blurb: "Quick contracts from your Agency computer. You need one of them completed to unlock the Dre contract, and event weeks sometimes add a cash bonus for finishing several.",
    tips: ["Check 'This Week' for any bonus tied to Security Contracts."],
    tutorial: {
      needs: ["An Agency"],
      steps: [
        "Open the computer in your Agency office and choose a Security Contract.",
        "Complete the mission.",
        "Collect $30K to $60K.",
        "Finish your first one to unlock the Dr. Dre contract.",
      ],
      tips: ["Good filler between cooldowns."],
      watch: [],
    },
  },
  {
    id: "bail", name: "Bail Office Bounties", type: "contract", requires: "bail",
    payout: 60000, minutes: 15, cooldown: 0, solo: true, estimate: true,
    payoutLabel: "$52K–$130K (Most Wanted pays most)",
    blurb: "Rockstar raised every bounty payout by about 50% in May 2026. Most Wanted targets pay $120K to $130K if you bring them in alive.",
    tips: ["Bring targets in alive for full pay."],
    tutorial: {
      needs: ["A Bail Office (cheapest is $1.65M in Paleto Bay)"],
      steps: [
        "Buy a Bail Office and open its computer to see the bounty list.",
        "Pick a bounty (Most Wanted pays the most) and track the target down.",
        "Capture them alive.",
        "Deliver them to collect the reward.",
      ],
      tips: ["Event weeks often double these. See 'This Week'."],
      watch: ["Killing the target cuts your payout."],
    },
  },
  {
    id: "dispatch", name: "Dispatch Work", type: "contract", requires: null,
    payout: 15000, minutes: 10, cooldown: 0, solo: true, estimate: true,
    payoutLabel: "~$15K per job (estimate)",
    blurb: "Quick no-property jobs. Our payout and time here are estimates, but event weeks often double them, which makes it good filler.",
    tips: ["See 'This Week' to check whether it's boosted."],
    tutorial: {
      needs: ["Nothing"],
      steps: [
        "Start Dispatch Work from the in-game jobs list.",
        "Complete the job.",
        "Start the next one right away.",
      ],
      tips: ["Most useful during event weeks when it's boosted."],
      watch: ["The payout figure is our estimate."],
    },
  },
  {
    id: "carwash", name: "Money Laundering (Hands On Car Wash)", type: "contract", requires: "carwash",
    payout: 35000, minutes: 10, cooldown: 0, solo: true,
    payoutLabel: "~$35K per mission",
    blurb: "From the Money Fronts update (June 2025). Laundering missions fill your Car Wash safe. Heat builds up as you go, and at max Heat the safe stops paying.",
    tips: ["Smoke on the Water and Higgins Helitours boost your Weed Farm and Counterfeit Cash incomes by 35%, and Cargo Freight goods value by 10% (Helitours)."],
    tutorial: {
      needs: ["Hands On Car Wash ($1M)", "Optional: Smoke on the Water ($850K) and Higgins Helitours ($900K)"],
      steps: [
        "Buy the Hands On Car Wash. It's required before you can buy the other two businesses.",
        "Start a money-laundering mission from the Car Wash. Each takes about 10 minutes.",
        "Complete it for about $35,000.",
        "Keep your Heat level low. At max Heat the safe stops earning.",
        "Collect the safe: roughly $30,000 per in-game day (about 48 real minutes) when you own all three businesses. The safe holds up to $100,000.",
      ],
      tips: ["Owning all three businesses is what unlocks the full safe income."],
      watch: ["Maxed-out Heat shuts off the safe income."],
    },
  },
];

/* Passive income while you play (net, per real hour). */
const PASSIVE = [
  { id: "acid", name: "Acid Lab", perHour: 35800, requires: "acid", note: "~$335K per full batch. The rate rises to about $84K/hr if you steal the supplies free.",
    tutorial: { needs: ["Acid Lab ($750K)"], steps: ["Buy the Acid Lab.", "Get supplies. Stealing them is free and raises the rate to about $84K/hr.", "Let it produce while you do other jobs.", "Sell the batch (about $335K full)."], tips: ["It always sells in one vehicle, so solo selling is easy."], watch: [] } },
  { id: "bunker", name: "Bunker", perHour: 57700, requires: "bunker", note: "$1.05M full stock. Solo players can sell up to $175K of stock per trip.",
    tutorial: { needs: ["Bunker (about $1.17M)"], steps: ["Buy a Bunker.", "Resupply it and let it produce.", "Sell stock in trips of up to $175K when solo.", "A full stock is worth about $1.05M."], tips: [], watch: ["Selling a full stock solo takes several trips."] } },
  { id: "nightclub", name: "Nightclub warehouse", perHour: 27500, requires: "nightclub", note: "~$1.83M net for a full warehouse. Always sells in one vehicle, whatever the size.",
    tutorial: { needs: ["Nightclub (about $1.5M)"], steps: ["Buy a Nightclub and assign technicians.", "Let the warehouse fill.", "Sell it all in one vehicle, any size."], tips: ["The nightclub safe also pays up to about $50K per in-game day while popularity stays high."], watch: [] } },
  { id: "carwash", name: "Car Wash safe", perHour: 37500, requires: "carwash", note: "~$30K per in-game day once you own all three Money Fronts businesses.",
    tutorial: { needs: ["Hands On Car Wash plus the other two Money Fronts businesses"], steps: ["Own all three Money Fronts businesses.", "Keep Heat low by not spamming laundering missions.", "Collect the safe (up to $100K)."], tips: [], watch: ["Max Heat stops the safe from earning."] } },
];

const PRESETS = [
  { label: "Agency",          amount: 2010000 },
  { label: "Kosatka",         amount: 2200000 },
  { label: "Art Studio",      amount: 4700000 },
  { label: "Oppressor Mk II", amount: 8000000 },
  { label: "Mansion",         amount: 12800000 },
  { label: "Everything",      amount: 50000000 },
];

const MONEY_TRICKS = [
  { name: "Weekly Bonus Stacking", how: "First runs of the week on Kortz, Titan, KnoWay Out, Dre and Cluckin' Bell pay 1.2× to 4×. Doing all of them each Thursday adds up to roughly $5.7M without grinding repeats." },
  { name: "Cooldown Rotation", how: "Start Cayo. During its 144-minute cooldown, run Dre, Auto Shop or Security Contracts. Nothing sits idle and your hourly rate roughly doubles." },
  { name: "Event-Week Freebies", how: "Event weeks regularly add free cash rewards (like a bonus for completing a handful of Security Contracts). Check 'This Week' every Thursday." },
  { name: "Daily Collectibles Loop", how: "Buried Stashes, Shipwrecks and Treasure Chests reset daily at $25K each. Cheap, fast cash on top of anything else you do." },
];

/* --------------------------------------------------------------------------
   Money glitches. Status comes from the community "working" list and is re-checked by the
   auto-updater. Risk (1–5) is our own estimate. `match` links an entry to the community list.
   Exploit steps change with every patch and aren't published here: each popup gives an overview,
   what you need, and a link to the current community guide.
   -------------------------------------------------------------------------- */
const MONEY_GLITCHES = [
  {
    name: "Solo Replay Money Glitch (V2)", status: "working", platforms: ["PS", "Xbox"], players: "Solo", risk: 3,
    payout: "Repeats a finale payout (Dre finale: $900K per replay)", match: "solo replay money glitch",
    how: "Replays a heist or contract finale without the completion saving, so you can collect the payout again. Guides mostly use the Dr. Dre finale.",
    tutorial: {
      needs: ["PlayStation or Xbox", "An Agency with the Dre contract unlocked (the usual target)", "Precise timing and a recent guide"],
      stages: [
        "Get the finale ready: own the property and finish the setup so the finale can be launched.",
        "Launch the finale and play it through to the payout.",
        "Make the result fail to save. Guides describe either briefly cutting your console's network connection at an exact moment, or using Quick Join with Contact Missions to host the finale solo.",
        "Get back online and relaunch the finale. Repeat.",
      ],
      tips: ["Reports say it works best if you don't push it too hard."],
      watch: ["The exact moment and menu path change with patches, so follow a current video.", "Cutting your connection can leave you stuck in a loading screen."],
    },
  },
  {
    name: "No-Save Heist Replay (PC workaround)", status: "workaround", platforms: ["PC"], players: "Solo", risk: 4,
    payout: "Repeats a finale payout", match: "no save heist replay|no save tool|dr dre linux",
    how: "The PC counterpart of the replay glitch. The community list has several variants: a 'No Save Heist Replay' workaround, an AutoHotkey 'No Save Tool', and a Linux version for the Dre contract.",
    tutorial: {
      needs: ["PC (GTA Online)", "A current guide. Several variants exist and older ones break"],
      stages: [
        "Pick the variant that matches your setup from the community list.",
        "Follow the guide to stop the heist completion from saving.",
        "Relaunch the finale and repeat.",
      ],
      tips: [],
      watch: ["Anti-cheat (BattlEye) runs on PC. Third-party tools and macros are the most likely thing to get an account flagged."],
    },
  },
  {
    name: "Dre Contract Finale Skip", status: "working", platforms: ["PC", "PS", "Xbox"], players: "Semi-Solo", risk: 2, match: "dre contract finale skip",
    payout: "Dre finale payout without the setup missions",
    how: "Lets you reach the Dre finale without completing the setup missions. It's listed as 'semi-solo', which usually means it needs a helper or second account for one step.",
    tutorial: {
      needs: ["An Agency", "Possibly a second player or account (semi-solo)"],
      stages: ["Follow the community guide to jump straight to the finale.", "Play the finale and collect the payout."],
      tips: ["It saves time rather than creating money, so it's one of the safer entries."],
      watch: ["Steps are patch-sensitive. Use a current guide."],
    },
  },
  {
    name: "Clean Car Dupe", status: "working", platforms: ["PS", "Xbox"], players: "Non-Solo", risk: 4, match: "clean car dupe",
    payout: "Sale value of the duplicated car",
    how: "Car dupe or 'merge' glitches create an extra copy of a vehicle you can sell. This variant is listed as non-solo, so it needs a helper.",
    tutorial: {
      needs: ["PlayStation or Xbox", "A helper (non-solo)", "A high-value car worth duplicating"],
      stages: [
        "Choose a vehicle that sells for a lot. Podium and event cars are worth nothing when sold.",
        "Follow the guide to duplicate it with your helper.",
        "Sell the extra copy.",
      ],
      tips: ["Newer 2026 merge methods are described as using a 'magic slot' and special garages such as the Mansion or Mobile Operations Center."],
      watch: ["Don't sell several expensive cars in a row. Sudden jumps in cash are the classic wipe trigger.", "Rockstar patches dupes often."],
    },
  },
  {
    name: "Solo Car Dupe", status: "working", platforms: ["PS", "Xbox"], players: "Solo", risk: 4, match: "^solo car dupe",
    payout: "Sale value of the duplicated car",
    how: "The solo version of the car dupe. Listed as working on PlayStation and Xbox.",
    tutorial: {
      needs: ["PlayStation or Xbox", "A high-value car"],
      stages: ["Follow the current community guide.", "Sell the extra copy."],
      tips: [],
      watch: ["Same wipe risks as any dupe. Space out sales and keep a normal-looking account."],
    },
  },
  {
    name: "Sentinel XS Unlimited Car Dupe", status: "working", platforms: ["PS", "Xbox"], players: "Semi-Solo", risk: 4, match: "sentinel xs",
    payout: "Sale value of duplicated cars",
    how: "A vehicle-specific dupe reported for current-gen consoles that uses the Sentinel XS.",
    tutorial: {
      needs: ["PS5 or Xbox Series X|S", "A Sentinel XS", "Possibly a helper (semi-solo)"],
      stages: ["Follow the current community guide.", "Sell the extra copies."],
      tips: [],
      watch: ["Same wipe risks as any dupe."],
    },
  },
  {
    name: "Semi Frozen Money Glitch (new-gen workaround)", status: "workaround", platforms: ["PS", "Xbox"], players: "Solo", risk: 5, match: "semi frozen money",
    payout: "Large lump sums",
    how: "Community guides describe 'frozen money' as duplicating a frozen-money state onto a second character or account. The list has versions with and without save-editing tools (the 'NO SW/HTOS' one avoids them).",
    tutorial: {
      needs: ["PS5 or Xbox Series", "Some variants need a save-editing tool"],
      stages: ["Pick a variant, ideally one that avoids third-party save tools.", "Follow the guide step by step."],
      tips: [],
      watch: ["Highest ban and money-wipe risk on this page.", "Anything that edits your save with a third-party tool is a bigger risk than the others."],
    },
  },
  {
    name: "BEFF (two-console method)", status: "working", platforms: ["PS", "Xbox"], players: "Solo", risk: 5, match: "\\bbeff\\b",
    payout: "Large lump sums (very high ceiling)",
    how: "Listed as requiring two consoles. A PS5 variant uses a custom DNS.",
    tutorial: {
      needs: ["Two consoles", "A PS5 DNS variant also exists"],
      stages: ["Follow the community guide. It's a long setup."],
      tips: [],
      watch: ["Heavy setup and a lot of reported wipes."],
    },
  },
  {
    name: "Bunker / Hangar Solo Dupe", status: "working", platforms: ["PS", "Xbox"], players: "Solo", risk: 4, match: "bunker\\/hangar solo dupe|solo bunker\\/moc",
    payout: "Sale value of duplicated vehicles",
    how: "A solo dupe through production-facility vehicle storage. There's also a Mobile Operations Center version.",
    tutorial: {
      needs: ["Bunker or Hangar", "PlayStation or Xbox"],
      stages: ["Follow the current community guide.", "Sell the extra vehicle."],
      tips: [],
      watch: ["Same wipe risks as any dupe."],
    },
  },
  {
    name: "Give Money To Friends (V2)", status: "working", platforms: ["PS", "Xbox"], players: "Non-Solo", risk: 3, match: "give money to friends",
    payout: "Pass cash to a friend",
    how: "A glitch for sending money to another player, useful for getting a friend started.",
    tutorial: {
      needs: ["A friend", "PlayStation or Xbox"],
      stages: ["Follow the community guide together."],
      tips: [],
      watch: ["Both accounts are exposed, so only do it with someone you trust."],
    },
  },
];

/* --------------------------------------------------------------------------
   RP / rank glitches.
   -------------------------------------------------------------------------- */
const RP_GLITCHES = [
  { name: "Arena RP Glitch", status: "working", platforms: ["PC", "PS", "Xbox"], players: "Solo", match: "arena rp",
    gain: "Fast RP (listed for all platforms)", how: "A solo RP method built on Arena War content.",
    tutorial: { needs: ["PC, PlayStation or Xbox", "Solo"], stages: ["Follow the current community guide."], tips: ["RP glitches are the lowest-risk glitches. They don't add cash."], watch: ["Methods change after patches."] } },
  { name: "Unlimited AFK Solo RP", status: "working", platforms: ["PC", "PS", "Xbox"], players: "Solo", match: "unlimited afk solo rp",
    gain: "RP while you're away", how: "Lets you earn RP while AFK. A newer version of the AFK exploits now exists since the Money Fronts update.",
    tutorial: { needs: ["PC, PlayStation or Xbox"], stages: ["Follow the guide for your platform.", "Check the latest AFK variants after the Money Fronts and Safehouse updates."], tips: ["Keep an eye on the clock. Leaving a session running overnight can disconnect you."], watch: ["AFK methods were reworked after Money Fronts and A Safehouse in the Hills."] } },
  { name: "AFK Exploits (after Safehouse in the Hills)", status: "working", platforms: ["PC", "PS", "Xbox"], players: "Solo", match: "afk exploits after a safehouse",
    gain: "Current AFK methods", how: "The latest set of AFK exploits that work after the December 2025 mansion update.",
    tutorial: { needs: ["PC, PlayStation or Xbox"], stages: ["Follow the current community guide."], tips: [], watch: ["Older AFK videos may no longer work."] } },
  { name: "5K RP Every 30 Secs", status: "working", platforms: ["PS"], players: "Non-Solo", match: "5k rp",
    gain: "5,000 RP every 30 seconds (as titled)", how: "An older PS4-era RP method that needs other players.",
    tutorial: { needs: ["PlayStation (PS4 listed)", "Other players (non-solo)"], stages: ["Follow the community guide."], tips: [], watch: ["Old method. Check the thread for whether it still works on your console."] } },
  { name: "Agency Replay Glitch", status: "working", platforms: ["PS", "Xbox"], players: "Non-Solo", match: "agency replay",
    gain: "Replays Agency content for RP and cash", how: "Replays Agency content, which also helps with Security Contract progress.",
    tutorial: { needs: ["PlayStation or Xbox", "An Agency", "Other players (non-solo)"], stages: ["Follow the community guide."], tips: [], watch: ["Patch-sensitive."] } },
];

/* --------------------------------------------------------------------------
   Fun glitches. `does` describes the effect (as titled on the community list).
   -------------------------------------------------------------------------- */
const FUN_GLITCHES = [
  { cat: "vehicle", name: "Invisible Oppressor Mk II", platforms: "PS · Xbox", players: "Semi-Solo", match: "invisible while on the mk2|fly with invisible mk2", does: "Makes you and your Oppressor Mk II invisible to other players while you fly." },
  { cat: "vehicle", name: "Infinite Toreador Boost", platforms: "PC · PS · Xbox", players: "Solo", match: "toreador boost", does: "Gives the Toreador unlimited boost." },
  { cat: "vehicle", name: "Director Mode Car Drop", platforms: "PC · PS · Xbox", players: "Non-Solo", match: "dmo car drop|director mode online car drop", does: "Brings Director Mode vehicles into Online sessions." },
  { cat: "vehicle", name: "Lazer in the Titan Job Finale", platforms: "PC · PS · Xbox", players: "Solo", match: "spawn lazer jet in titan", does: "Gets you a Lazer jet during the Titan Job finale." },
  { cat: "vehicle", name: "Unlimited Missiles (Mk II / Deluxo)", platforms: "PS · Xbox", players: "Solo", match: "unlimited missiles", does: "Removes the missile limit on the Oppressor Mk II, Deluxo and similar vehicles." },
  { cat: "vehicle", name: "Chameleon Pearlescent", platforms: "PS · Xbox", players: "Solo", match: "chameleon pearlescent", does: "Lets you stack a pearlescent color over chameleon paint on current-gen consoles." },
  { cat: "vehicle", name: "Matte Pearlescent Respray", platforms: "PC · PS · Xbox", players: "Solo", match: "matte pearlescent", does: "Combines matte paints with pearlescent finishes, which the game normally blocks." },
  { cat: "vehicle", name: "Drive Inside LS Customs", platforms: "PS · Xbox", players: "Solo", match: "drive inside lscm", does: "Lets you drive around inside the Los Santos Customs building." },
  { cat: "vehicle", name: "Thruster on Cayo Perico", platforms: "PS · Xbox", players: "Solo", match: "thruster on cayo", does: "Takes the Thruster jetpack onto Cayo Perico, where it's normally blocked." },
  { cat: "vehicle", name: "Spawn Kosatka Anywhere", platforms: "PC · PS · Xbox", players: "Solo", match: "spawn kosatka anywhere", does: "Spawns your submarine in places it normally can't go." },
  { cat: "vehicle", name: "Drive Destroyed Vehicles", platforms: "PS · Xbox", players: "Solo", match: "drive destroyed vehicles", does: "Lets you keep driving a vehicle that's been destroyed." },
  { cat: "player", name: "Guns in Passive Mode (V5)", platforms: "PS · Xbox", players: "Semi-Solo", match: "guns in passive mode v5", does: "Lets you use weapons while Passive Mode is on. The community list tracks versions V2 to V5." },
  { cat: "player", name: "Walk in the Sky", platforms: "PS · Xbox", players: "Semi-Solo", match: "walk in the sky", does: "Lets your character walk on thin air high above the map." },
  { cat: "player", name: "Out of Bounds", platforms: "PC · PS · Xbox", players: "Semi-Solo", match: "^out of bounds", does: "Gets you outside the normal map boundaries." },
  { cat: "player", name: "No Collision / Fly Through Buildings", platforms: "PS · Xbox", players: "Semi-Solo", match: "no collision and fly", does: "Lets you pass through buildings and go under the map." },
  { cat: "player", name: "Thermal Vision in Aircraft", platforms: "PC · PS · Xbox", players: "Solo", match: "thermals? in aircraft", does: "Gives you thermal vision in aircraft that don't normally have it." },
  { cat: "player", name: "Stay Drunk Forever", platforms: "PS · Xbox", players: "Solo", match: "stay drunk", does: "Keeps your character in the drunk state." },
  { cat: "player", name: "Radio on Foot", platforms: "PS · Xbox", players: "Solo", match: "radio on foot", does: "Lets you listen to the radio while walking." },
  { cat: "player", name: "Launch Glitches (Bush / BMX / Ramp Buggy)", platforms: "PC · PS · Xbox", players: "Solo", match: "bushole launch|bmx launch|ramp buggy launch|^launch glitch", does: "Physics launches that throw your character far into the air." },
  { cat: "player", name: "Drone Teleporting", platforms: "PC · PS · Xbox", players: "Solo", match: "drone teleport", does: "Uses a drone to move your character across the map." },
  { cat: "player", name: "No Ragdoll", platforms: "PC · PS · Xbox", players: "Solo", match: "no ragdoll glitch", does: "Stops your character from ragdolling when hit." },
  { cat: "outfit", name: "Invisible Arms", platforms: "PC · PS · Xbox", players: "Solo", match: "^invisible arms$", does: "Makes your character's arms invisible with any outfit." },
  { cat: "outfit", name: "Remove Logos From Tops", platforms: "PC · PS · Xbox", players: "Solo", match: "remove logos from clothing", does: "Strips brand logos off shirts and hoodies." },
  { cat: "outfit", name: "Mansion Mask Merge", platforms: "PC · PS · Xbox", players: "Solo", match: "mansion mask merge", does: "Uses the Mansion wardrobe to merge masks with glasses or helmets." },
  { cat: "outfit", name: "Mansion Duffle Bag Transfer", platforms: "PS · Xbox", players: "Solo", match: "mansion duffle bag transfer", does: "Lets you keep a duffel bag as an outfit item through the Mansion." },
  { cat: "outfit", name: "Colored / Jet Black Duffle Bags", platforms: "PS · Xbox", players: "Solo", match: "colored duffle bags|jet black duffle", does: "Unlocks duffel bag colors you can't normally get." },
  { cat: "outfit", name: "Save CEO Outfits", platforms: "PC · PS · Xbox", players: "Solo", match: "save ceo outfits", does: "Keeps CEO outfits after you leave the organization." },
  { cat: "world", name: "Bring Back Snow Online", platforms: "PC · PS · Xbox", players: "Solo", match: "bring back snow", does: "Brings winter snow weather back outside the holiday event." },
  { cat: "world", name: "Teleport Inside the UFO", platforms: "PS", players: "Solo", match: "teleport inside of ufo", does: "Gets your character inside a UFO model." },
  { cat: "world", name: "Old Casino / Story Map Online", platforms: "PS · Xbox", players: "Semi-Solo", match: "old casino", does: "Loads older Story Mode map states, like the pre-construction casino, into Online." },
  { cat: "world", name: "Tsunami Glitch", platforms: "PC · PS · Xbox", players: "Solo", match: "tsunami", does: "Manipulates the water so the ocean surges onto the shore." },
  { cat: "world", name: "Rockstar Editor Online", platforms: "PC · PS · Xbox", players: "Non-Solo", match: "rockstar editor online", does: "Uses Rockstar Editor features in an Online session." },
];

/* Lester's assassination missions (Story Mode). Cross-checked against GTABase's guide, Oct 2026. */
const STOCKS = [
  { mission: "Hotel Assassination", before: "Betta Pharmaceuticals (BET · BAWSAQ)", after: "Bilkington Research (BIL · LCN)", gain: "~80%, then ~80%" },
  { mission: "Multi-Target Assassination", before: "Debonaire (DEB · LCN)", after: "Redwood Cigarettes (RWC · LCN)", gain: "~80%, then ~320%" },
  { mission: "Vice Assassination", before: "Fruit (FRT · BAWSAQ)", after: "Facade (FAC · BAWSAQ)", gain: "~50%, then ~33%" },
  { mission: "Bus Assassination", before: "No stock before this one", after: "Vapid (VAP · BAWSAQ)", gain: "~100%" },
  { mission: "Construction Assassination", before: "GoldCoast (GCD · LCN)", after: "Nothing to buy after", gain: "~90%" },
];

/* Easter eggs & secrets. Kept deliberately conservative. */
const EASTER_EGGS = [
  { name: "Ghosts Exposed", where: "Online · event weeks", how: "A Halloween-season freemode event: photograph ghosts with your phone camera for cash. Event weeks often pay extra." },
  { name: "Jack O' Lanterns", where: "Online · Halloween event", how: "Smash pumpkins around the map for cash and RP. Event weeks often double the pay." },
  { name: "Mount Chiliad Mural", where: "Mount Chiliad cable car station", how: "The mural with a jetpack, a UFO and more that kicked off years of fan theories." },
  { name: "Peyote Plants", where: "Story Mode and Online (Halloween)", how: "Eat a peyote plant to turn into an animal for a short time." },
];

/* This week's event: fallback copy of what the updater last fetched (Oct 5, 2026).
   The live version in data/live.js replaces this automatically. */
const WEEKLY = {
  title: "Halloween in Los Santos",
  range: "October 1 – 7, 2026",
  ends: "2026-10-08T09:00:00.000Z",
  bonuses: [
    { mult: "3×", text: "GTA$ & RP on Slasher" },
    { mult: "3×", text: "GTA$ & RP on Halloween Survivals: Ludendorff Cemetery Survival, Cayo Perico Survival & Alien Survivals" },
    { mult: "3×", text: "GTA$ & RP on San Andreas Super Sport Series: Hotring Races, Random Transform Races" },
    { mult: "3×", text: "GTA$ & RP on Community Race Series" },
    { mult: "2×", text: "GTA$ & RP on Bail Office Bounties" },
    { mult: "2×", text: "GTA$ & RP on Dispatch Work" },
    { mult: "2×", text: "GTA$ & RP on UFO Business Battles" },
    { mult: "2×", text: "GTA$ & RP on Jack O' Lanterns" },
    { mult: "2×", text: "GTA$ on Ghosts Exposed" },
  ],
  rewards: [
    "Complete five Security Contracts through October 7 to receive $500,000 within 72 hours of completion",
    "Secure two Bail Office Bounties to get the Green Vintage Skull Mask and $100,000",
    "Complete all Weekly Challenges through November 4 to receive $2,000,000 within 72 hours of completion",
    "Get the Cheerleader Massacre 3 T-Shirt for free through October 7 (must be claimed from in-game clothing stores)",
    "Gun Van: free Baseball Bat, The Shocker",
  ],
  podium: "Cinquemila",
  prizeRide: "Dominator GTT",
  sales: [
    "40% off: Brigham, Fränken Stange, Lurcher, Tornado Rat Rod, Sanctus, all Agency locations",
    "30% off: Schlagen GT, Vigero ZX, Brioso 300, Komoda, Buzzard Attack Chopper, Ultralight, Ardent, Sparrow, Powersurge",
  ],
  extras: [
    { title: "Kortz Center Heist Primary Targets", items: ["Chat on Fruit", "Juiced", "The Downfall of Rome"] },
    { title: "Salvage Yard Robberies", items: ["The Cargo Ship Robbery: Buffalo EVX (Top Tier)", "The McTony Robbery: Everon (Standard Tier)", "The Duggan Robbery: Fränken Stange (Standard Tier)"] },
    { title: "Premium Race & Trials", items: ["Premium Race: Arms Race", "Time Trial: Maze Bank Arena", "HSW Time Trial: Ron Alternates to Elysian Island"] },
  ],
  methodEvents: {
    bail: { x: 2, label: "2× this week (ends Oct 7)" },
    dispatch: { x: 2, label: "2× this week (ends Oct 7)" },
  },
  methodBonuses: {
    security: { runs: 5, amount: 500000, label: "$500,000 bonus after 5 (ends Oct 7)" },
    bail: { runs: 2, amount: 100000, label: "$100,000 bonus after 2 (ends Oct 7)" },
  },
  sourceUrl: "https://www.gtabase.com/gta-online/weekly-update-bonuses-discounts",
};
