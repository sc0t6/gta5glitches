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
  { id: "nightclub",name: "Nightclub",             cost: 1080000 },
  { id: "arcade",   name: "Arcade",                cost: 1235000 },
  { id: "facility", name: "Facility (Doomsday)",   cost: 1250000 },
  { id: "vehiclewh",name: "Vehicle Warehouse",     cost: 1500000 },
  { id: "cocaine",  name: "Cocaine Lockup (MC)",   cost: 2300000 },
  { id: "meth",     name: "Meth Lab (MC)",         cost: 2100000 },
  { id: "counterfeit", name: "Counterfeit Cash (MC)", cost: 1500000 },
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
    tips: ["Payout is net after the 10% cut.", "The Union Depository contract is the best of them: about $270K, roughly $400K/hr."],
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
    tips: ["Specialist-level contracts pay about $60K to $70K, roughly $180K/hr.", "Check 'This Week' for any bonus tied to Security Contracts."],
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
    id: "payphone", name: "Payphone Hits", type: "contract", requires: "agency",
    payout: 45000, minutes: 8, cooldown: 10, solo: true, estimate: true,
    payoutLabel: "$15K base + up to $30K bonus",
    blurb: "Franklin's assassination contracts, tied to the Celebrity Solutions Agency. Fast and solo-friendly: complete the hit the way the contract asks for the bonus. One source reports up to $85K with the bonus, GTABase lists $15K + $30K, so the planner uses $45K.",
    tips: ["Unlocks after your third Security Contract.", "You have 15 minutes per target.", "Event weeks sometimes pay a big bonus for five hits. Check 'This Week'."],
    tutorial: {
      needs: ["An Agency (Celebrity Solutions Agency)", "Three Security Contracts completed"],
      steps: [
        "Finish three Security Contracts to unlock Payphone Hits.",
        "Answer a payphone (or call Franklin) to start a hit. You have 15 minutes to eliminate the target.",
        "Read the contract: it asks for a specific method (sniping, a vehicle crash, explosives and so on). Doing it that way earns the bonus on top of the $15K base.",
        "After a short cooldown, line up the next hit. Solo or up to 4 players.",
      ],
      tips: ["Stack five in a row during event weeks that reward it."],
      watch: ["Sources disagree on the bonus size ($30K vs $70K). Your own payout screen is the truth."],
    },
  },
  {
    id: "vipwork", name: "VIP Work (Headhunter / Sightseer)", type: "contract", requires: null,
    payout: 25000, minutes: 9, cooldown: 0, solo: true, estimate: true,
    payoutLabel: "$20K–$30K per job",
    blurb: "A free solo filler. Headhunter pays up to $30K and Sightseer up to $25K. You need $50,000 banked (or an office) to register as VIP.",
    tips: ["Alternate between job types so you aren't waiting on a cooldown."],
    tutorial: {
      needs: ["$50,000 in your bank, or an office"],
      steps: [
        "Register as a VIP/CEO from the interaction menu (this needs the $50K bank balance).",
        "Start a Headhunter or Sightseer job.",
        "Complete it for $20K to $30K.",
        "Alternate job types to keep going without waiting.",
      ],
      tips: ["Good bridge between heists once you have a little cash."],
      watch: ["Run time is an estimate. Pay is modest, so it's filler rather than a main grind."],
    },
  },
  {
    id: "vehiclecargo", name: "Vehicle Cargo", type: "contract", requires: "vehiclewh",
    payout: 90000, minutes: 35, cooldown: 0, solo: true, estimate: true,
    payoutLabel: "$80K–$100K per car",
    blurb: "Steal and sell cars from a Vehicle Warehouse. Cars can't be raided in transit, which makes solo selling safer than most cargo. Figures come from a single ranking (about $160K/hr), so treat them as an estimate.",
    tips: ["Source standard and mid-range cars first so the higher-value ones spawn."],
    tutorial: {
      needs: ["A Vehicle Warehouse (about $1.5M)"],
      steps: [
        "Buy a Vehicle Warehouse and register as CEO.",
        "Source a vehicle from the list for the tier you want.",
        "Deliver it to the warehouse, then sell it.",
        "Collect $80K to $100K per car.",
      ],
      tips: [],
      watch: ["Single-source numbers. Selling in a public session still carries some risk."],
    },
  },
  {
    id: "casino", name: "Diamond Casino Heist", type: "heist", requires: "arcade", crew: 2,
    payout: 775000, firstWeekly: 1400000, minutes: 90, cooldown: 0, solo: false, estimate: true,
    payoutLabel: "~$775K each (2 players) · ~$1.4M each first of the week",
    blurb: "The best crew heist. The finale needs 2 to 4 players (every prep can be solo). A clean 2-player Hard Gold run nets about $700K to $850K each after Lester's and the crew's cuts, and the first finale each week pays roughly 1.86× (about $3.7M gross on Hard Gold).",
    tips: ["Hard adds a flat 10% but needs a prior Normal completion.", "All three approaches pay the same vault value. Pick the one you can run cleanly.", "Diamonds are only on offer during event weeks."],
    tutorial: {
      needs: ["An Arcade owned by the host (cheapest $1.235M, Videogeddon $1.875M saves prep time)", "A second player for the finale (2 to 4 total)", "$25,000 setup fee to Lester per run"],
      steps: [
        "Buy an Arcade and plan the heist from its board. Preps can all be done solo.",
        "Pick an approach: Silent & Sneaky, The Big Con or Aggressive. Vault payouts are identical.",
        "Choose the vault target. Gold is the usual pick; Diamonds only appear during event weeks.",
        "Pick your crew. Lester takes 5%, gunman and driver 5% each, hackers 5–10%, and every player gets at least a 15% cut.",
        "Run the finale with your partner and get out with as little damage as possible.",
        "Your first finale of the week pays the boosted rate (about 1.86×). Repeats pay the lower standard rate.",
      ],
      tips: ["The Big Con with Gruppe Sechs disguises is the usual pick for a two-player crew.", "Run it once a week for the bonus."],
      watch: ["Taking damage while carrying loot costs about $2,000 per bullet hit.", "Per-player figures assume a 2-player crew. More players means smaller shares."],
    },
  },
  {
    id: "doomsday", name: "Doomsday Heist (Act III)", type: "heist", requires: "facility", crew: 2,
    payout: 1010000, firstWeekly: 1240000, minutes: 210, cooldown: 0, solo: false, estimate: true,
    payoutLabel: "~$1M each (2 players, estimate)",
    blurb: "Needs 2 to 4 players. Act III pays $2,025,000 gross on Hard for repeats (Rockstar corrected the three finales on July 16, 2026), shared between the crew. Sources call the full Doomsday Heist dated: worth one weekly circuit if you enjoy it, not the cleanest farm.",
    tips: ["Act I Hard is $1,096,875 and Act II Hard is $1,603,125 for repeats.", "The first completion each week pays a boost (about 1.22× on Act II)."],
    tutorial: {
      needs: ["A Facility (about $1.25M)", "At least one other player"],
      steps: [
        "Buy a Facility and start the Doomsday Heist from its planning screen.",
        "Play the setup missions for the act with your crew.",
        "Run the finale on Hard.",
        "Collect your share of the gross payout and repeat for the next act.",
      ],
      tips: ["Doing all three acts in one circuit can be better than repeating one."],
      watch: ["Per-player pay is our estimate (an even 2-way split of the gross).", "Run time covers an act's setups plus the finale (about 3.5 hours). One ranking puts the whole heist near $270K/hr."],
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
  { id: "carwash", name: "Money Fronts safe", perHour: 5625, contested: true, requires: "carwash",
    contestedNote: "Sources disagree: Timesaver says all three Money Fronts together pay only about $4.5K per in-game day, GTABase's guide says the Car Wash alone pays about $30K. The planner uses the low figure and hides this by default.",
    note: "Reported at anywhere from ~$4.5K to ~$30K per in-game day (48 real minutes). Sources disagree.",
    tutorial: { needs: ["Hands On Car Wash plus the other two Money Fronts businesses"], steps: ["Own all three Money Fronts businesses.", "Keep Heat low by not spamming laundering missions.", "Collect the safe (up to $100K)."], tips: [], watch: ["Max Heat stops the safe from earning."] } },
  { id: "nightclubsafe", name: "Nightclub safe", perHour: 62500, requires: "nightclub", estimate: true, note: "Up to $50K per in-game day (48 real minutes) while popularity stays at 95–100%. Holds up to $250K.",
    tutorial: { needs: ["Nightclub (from about $1.08M)", "Staff upgrade ($475K) to reach the maximum rate"], steps: ["Buy a Nightclub and keep its popularity high (95–100%).", "Collect the safe every so often. It holds up to $250,000.", "Pair it with the warehouse for the best true passive income."], tips: ["Popularity decays, so it needs occasional attention."], watch: ["The rate assumes maximum popularity. It's an estimate of the best case."] } },
  { id: "salvagesafe", name: "Salvage Yard safe", perHour: 30000, requires: "salvage", estimate: true, note: "About $24K per in-game day, even offline, once the yard has four towed vehicles. Holds $100K ($250K with the Wall Safe upgrade).",
    tutorial: { needs: ["Salvage Yard ($1.62M)", "Four towed vehicles in the yard"], steps: ["Buy the Salvage Yard and tow four vehicles to it.", "Let the safe fill. It progresses while you're offline.", "Upgrade to the Wall Safe ($750K) to raise the cap to $250K."], tips: ["The yard also unlocks the weekly robberies."], watch: [] } },
  { id: "agencysafe", name: "Agency safe", perHour: 25000, requires: "agency", estimate: true, note: "About $20K per in-game day, holds up to $250K. One source says the top rate needs 201 Security Contracts completed.",
    tutorial: { needs: ["Agency ($2.01M)"], steps: ["Buy an Agency.", "Keep completing Security Contracts. The safe fills as you play.", "Collect it when you're nearby."], tips: [], watch: ["The rate is a best-case estimate that depends on how many contracts you've done."] } },
  { id: "cocaine", name: "Cocaine Lockup (MC)", perHour: 67500, requires: "cocaine", note: "$525K for a full far-sale batch (5 hours to fill). Solo sells fit one vehicle of up to 3 units. GTA Boss's best semi-passive business.",
    tutorial: { needs: ["A Cocaine Lockup (about $2.3M with the clubhouse)"], steps: ["Buy the lockup and keep it supplied.", "Let it fill (about 5 hours).", "Sell in batches of up to 3 units in one vehicle when solo."], tips: ["Selling to the Nightclub warehouse is another option."], watch: ["Un-upgraded businesses on bought supplies barely break even. Buy the equipment and staff upgrades."] } },
  { id: "meth", name: "Meth Lab (MC)", perHour: 43125, requires: "meth", note: "$446K for a full far-sale batch (about 6 hours). Solo sells fit one vehicle of up to 5 bins.",
    tutorial: { needs: ["A Meth Lab (about $2.1M with the clubhouse)"], steps: ["Buy the lab and keep it supplied.", "Let it fill.", "Sell up to 5 bins per vehicle when solo."], tips: ["Pairs well with the Cocaine Lockup for chained sales."], watch: ["Needs upgrades to be worth it."] } },
  { id: "counterfeit", name: "Counterfeit Cash (MC)", perHour: 40781, requires: "counterfeit", note: "$367.5K for a full batch. Solo sells fit one vehicle of up to 10 units. The Car Wash boosts it by 35%.",
    tutorial: { needs: ["A Counterfeit Cash Factory (about $1.5M with the clubhouse)"], steps: ["Buy the factory and keep it supplied.", "Let it fill.", "Sell up to 10 units per vehicle when solo."], tips: ["The cheapest MC business to start."], watch: ["Needs upgrades to be worth it."] } },
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
  { name: "Passive Safe Stack", how: "Nightclub, Salvage Yard, Agency, Arcade, Money Fronts and Garment Factory safes together accrue roughly $105K per 48 minutes (about $132K per real hour). It costs about $12.6M fully set up, and it pays while you do other things." },
  { name: "Daily Wheel Spin", how: "The Lucky Wheel at the Diamond Casino gives a free spin every day after a $500 membership. Take it, but skip the tables: they lose money over time." },
  { name: "Junk Energy Skydives", how: "Ten skydive challenges a day pay $5K each, plus $50K for finishing all ten. No property needed." },
  { name: "Stash House Starter", how: "If you finish a Stash House before owning any business, you get $30,000. A quick first payday for new accounts." },
];

/* Popular but not worth your time. Reasons come from the cited ranking guides. */
const SKIP = [
  { name: "Podium vehicle sale", why: "The podium vehicle sells for $0. Keep it for yourself." },
  { name: "Casino gambling", why: "Negative expectation. Take the free daily wheel spin and stop." },
  { name: "Special Cargo", why: "About $130K/hr in one ranking, after a $2.9M warehouse and slow sourcing." },
  { name: "Air Freight (Hangar) cargo", why: "Sources disagree wildly ($80K to $600K/hr). Treat it as unproven." },
  { name: "Original Heists (after the first)", why: "Crew-only (Fleeca needs 2, the rest need 4). Worth it mainly for the first weekly bonus." },
  { name: "Business Battles & freemode events", why: "Need three unaffiliated players, so they rarely appear for solo players." },
  { name: "Un-upgraded MC businesses on bought supplies", why: "Document Forgery runs at a loss and the others barely break even without upgrades." },
  { name: "Gun Van & LS Tags", why: "The Gun Van only saves money. LS Tags give RP, not cash." },
  { name: "Public-lobby sell missions", why: "The +50% bonus is real, but other players can destroy your cargo." },
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

/* This week's event: fallback copy of what the updater last fetched (2026-10-09).
   The live version in data/live.js replaces this automatically. */
const WEEKLY = {
  title: "Second Week of Halloween Event",
  range: "October 8 – 14, 2026",
  ends: "2026-10-15T09:00:00.000Z",
  bonuses: [
    {
      mult: "3×",
      text: "GTA$ & RP on Hotring Circuit / San Andreas Super Sport Series"
    },
    {
      mult: "3×",
      text: "GTA$ & RP on Halloween Survivals: Ludendorff Cemetery Survival, Cayo Perico Survival & Alien Survivals"
    },
    {
      mult: "3×",
      text: "GTA$ & RP on San Andreas Super Sport Series: Hotring Races, Random Transform Races"
    },
    {
      mult: "3×",
      text: "GTA$ & RP on Community Race Series"
    },
    {
      mult: "2×",
      text: "GTA$ & RP on The Black Box File"
    },
    {
      mult: "2×",
      text: "GTA$ & RP on Bail Office Bounties"
    },
    {
      mult: "2×",
      text: "GTA$ & RP on Dispatch Work"
    },
    {
      mult: "2×",
      text: "GTA$ & RP on UFO Business Battles"
    },
    {
      mult: "2×",
      text: "GTA$ & RP on Jack O' Lanterns"
    },
    {
      mult: "2×",
      text: "GTA$ on Ghosts Exposed"
    }
  ],
  rewards: [
    "Win 2 Adversary Modes to receive the Pink Skull Emissive Mask and $100,000",
    "Gun Van: free Baseball Bat, The Shocker"
  ],
  podium: "Savestra",
  prizeRide: "Walton L35 (Lifted)",
  sales: [
    "40% off: Brigham, Fränken Stange, Lurcher, Tornado Rat Rod, Sanctus, all Agency locations",
    "30% off: Remus, Terrorbyte, Club, Greenwood, Jester RR, ETR1, Itali GTO, Hotring Everon, Tempesta, SC1"
  ],
  extras: [
    {
      title: "Kortz Center Heist Primary Targets",
      items: [
        "Pumpkin",
        "A Winding Road Home",
        "Winter, Nowhere in Particular"
      ]
    },
    {
      title: "Salvage Yard Robberies",
      items: [
        "The McTony Robbery: Growler (Top Tier)",
        "The Gangbanger Robbery: Fränken Stange (Standard Tier)",
        "The Podium Robbery: Eudora (Low Tier)"
      ]
    },
    {
      title: "Premium Race & Trials",
      items: [
        "Premium Race: The Commute",
        "Time Trial: Terminal to Chiliad Mountain State Wilderness",
        "HSW Time Trial: Tongva Valley"
      ]
    }
  ],
  methodEvents: {
    bail: {
      x: 2,
      label: "2× this week (ends Oct 14)"
    },
    dispatch: {
      x: 2,
      label: "2× this week (ends Oct 14)"
    }
  },
  methodBonuses: {},
  sourceUrl: "https://www.gtabase.com/gta-online/weekly-update-bonuses-discounts"
};
