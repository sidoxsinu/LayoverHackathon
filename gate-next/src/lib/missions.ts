export interface Mission {
  id: string;
  icon: string;
  type: string;
  text: string;
  mins: number;
  need: 'hunger' | 'energy' | 'battery';
  boost: number;
  when: [number, number]; // [min_time_remaining, max_time_remaining]
  proof?: 'photo' | 'none';
  proofHint?: string;
}

export const MISSIONS: Mission[] = [
  { id: "terminal_feast", icon: "FOOD", type: "FEAST", text: "Find a proper sit-down restaurant and order something you have never tried before. Your taste buds deserve a vacation too.", mins: 45, need: "hunger", boost: 75, when: [180, 9999], proof: "photo", proofHint: "PHOTO OF YOUR MEAL OR RESTAURANT" },
  { id: "coffee_quest", icon: "FOOD", type: "CAFFEINE", text: "Track down a coffee shop and order your preferred caffeine potion. Sip like someone who definitely has their life together.", mins: 15, need: "hunger", boost: 25, when: [45, 9999], proof: "photo", proofHint: "PHOTO OF YOUR COFFEE OR CAFE MENU" },
  { id: "snack_heist", icon: "FOOD", type: "SNACK", text: "Acquire a snack from an airport shop. Pretend the price tag is a currency conversion error.", mins: 10, need: "hunger", boost: 20, when: [10, 9999], proof: "photo", proofHint: "PHOTO OF YOUR SNACK OR RECEIPT" },
  { id: "local_flavor", icon: "FOOD", type: "TASTE", text: "Find a snack or drink associated with your destination or departure city. Eat like a local without leaving the terminal.", mins: 25, need: "hunger", boost: 40, when: [60, 9999], proof: "photo", proofHint: "PHOTO OF THE LOCAL SNACK OR DRINK" },
  { id: "hydration_station", icon: "FOOD", type: "HYDRATE", text: "Find a drinking water station and refill your bottle if permitted. Congratulations, you have defeated the overpriced water economy.", mins: 5, need: "hunger", boost: 15, when: [5, 9999], proof: "photo", proofHint: "PHOTO OF THE WATER STATION OR BOTTLE" },
  { id: "dessert_detour", icon: "FOOD", type: "DESSERT", text: "Find a small dessert or sweet treat. This is not emotional spending if you call it a side quest.", mins: 15, need: "hunger", boost: 30, when: [30, 9999], proof: "photo", proofHint: "PHOTO OF YOUR SWEET TREAT OR DESSERT" },
  { id: "breakfast_champion", icon: "FOOD", type: "BRUNCH", text: "Build a balanced mini-meal from available airport food options. Assemble a plate that says, 'I make excellent decisions occasionally.'", mins: 25, need: "hunger", boost: 45, when: [60, 9999], proof: "photo", proofHint: "PHOTO OF YOUR ASSEMBLED BREAKFAST PLATE" },
  { id: "mystery_munch", icon: "FOOD", type: "MYSTERY", text: "Choose an affordable packaged snack with a flavor you have never tried. Read the ingredients like you are investigating a crime.", mins: 10, need: "hunger", boost: 20, when: [15, 9999], proof: "photo", proofHint: "PHOTO OF THE MYSTERY SNACK PACKAGING" },
  
  { id: "quiet_corner", icon: "REST", type: "RECOVER", text: "Find a quiet seat away from the busiest foot traffic. Sit down, relax your shoulders, and stop speedrunning your existence.", mins: 15, need: "energy", boost: 30, when: [20, 9999], proof: "none", proofHint: "" },
  { id: "power_nap", icon: "REST", type: "NAP", text: "Set an alarm and take a short nap in a safe, permitted seating area near your gate. Your boarding call is not a lullaby.", mins: 25, need: "energy", boost: 45, when: [45, 240], proof: "none", proofHint: "" },
  { id: "window_watching", icon: "REST", type: "OBSERVE", text: "Find a window with a view of the runway and watch the aircraft for a while. Imagine your flight is the celebrity you came to see.", mins: 15, need: "energy", boost: 20, when: [15, 9999], proof: "photo", proofHint: "PHOTO OF THE RUNWAY OR AIRCRAFT OUTSIDE" },
  { id: "eyes_closed", icon: "REST", type: "RESET", text: "Sit comfortably, close your eyes, and take ten slow breaths. Do not accidentally turn mindfulness into a three-hour nap.", mins: 10, need: "energy", boost: 20, when: [10, 9999], proof: "none", proofHint: "" },
  { id: "lounge_lizard", icon: "REST", type: "LOUNGE", text: "Find a comfortable public seating area and relax without blocking walkways. Look so peaceful that even your unread emails give up.", mins: 20, need: "energy", boost: 35, when: [30, 9999], proof: "none", proofHint: "" },
  { id: "stretch_session", icon: "REST", type: "STRETCH", text: "Perform gentle seated shoulder rolls, ankle circles, and neck movements without invading anyone else's space. Your spine has filed a formal complaint.", mins: 8, need: "energy", boost: 20, when: [10, 9999], proof: "none", proofHint: "" },
  
  { id: "gate_marathon", icon: "MOVE", type: "EXPLORE", text: "Walk toward a distant public area of the terminal and return at a comfortable pace. Do not cross security boundaries or wander away from your departure area.", mins: 30, need: "energy", boost: -35, when: [120, 9999], proof: "photo", proofHint: "PHOTO OF THE CONCOURSE WALKING PATH" },
  { id: "terminal_tour", icon: "MOVE", type: "EXPLORE", text: "Explore a different public section of the terminal, then retrace your route. You are now a tourist with excellent luggage management.", mins: 25, need: "energy", boost: -25, when: [75, 9999], proof: "photo", proofHint: "PHOTO OF A DISTANT TERMINAL SECTION" },
  { id: "step_counter", icon: "MOVE", type: "FITNESS", text: "Walk around your nearby gate area for a few minutes and check your step counter. Every step counts, including the ones taken while looking confused.", mins: 10, need: "energy", boost: -15, when: [15, 9999], proof: "photo", proofHint: "PHOTO OF YOUR STEP COUNTER OR SURROUNDINGS" },
  { id: "shop_window", icon: "MOVE", type: "BROWSE", text: "Browse two airport shop windows without buying anything. Test your willpower against a miniature perfume bottle that costs more than lunch.", mins: 15, need: "energy", boost: -15, when: [30, 9999], proof: "photo", proofHint: "PHOTO OF THE STORE WINDOW DISPLAY" },
  { id: "art_detective", icon: "MOVE", type: "DISCOVER", text: "Find a piece of public art, an interesting display, or unusual terminal architecture. Inspect it like an art critic who has misplaced their glasses.", mins: 20, need: "energy", boost: -20, when: [45, 9999], proof: "photo", proofHint: "PHOTO OF THE ARTWORK OR ARCHITECTURE" },
  { id: "sign_safari", icon: "MOVE", type: "SCAVENGE", text: "Follow the public directional signs to identify a restroom, water station, and information desk. Congratulations, you have unlocked the airport survival map.", mins: 15, need: "energy", boost: -15, when: [30, 9999], proof: "photo", proofHint: "PHOTO OF AN AIRPORT DIRECTIONAL SIGN" },
  { id: "gate_neighbor", icon: "MOVE", type: "RELOCATE", text: "Take a short walk to another nearby seating area and compare the views. Return to your assigned gate area before boarding becomes urgent.", mins: 10, need: "energy", boost: -12, when: [15, 90], proof: "photo", proofHint: "PHOTO OF THE NEIGHBORING GATE AREA" },
  
  { id: "charging_hunt", icon: "PLUG", type: "RECHARGE", text: "Find a designated charging outlet or charging station and connect your device with your own compatible cable. Guard your battery percentage like a national treasure.", mins: 20, need: "battery", boost: 40, when: [30, 9999], proof: "photo", proofHint: "PHOTO OF THE CHARGING OUTLET IN USE" },
  { id: "battery_saver", icon: "PLUG", type: "CONSERVE", text: "Enable battery saver, reduce screen brightness, and close unnecessary apps. Your phone has officially entered its budget era.", mins: 5, need: "battery", boost: 20, when: [5, 9999], proof: "photo", proofHint: "PHOTO OF YOUR DEVICE SCREEN IN SAVER MODE" },
  { id: "outlet_claim", icon: "PLUG", type: "CAMP", text: "Locate a designated public charging point and settle nearby while your phone charges. Keep cables tidy and leave room for other travelers.", mins: 15, need: "battery", boost: 30, when: [20, 9999], proof: "photo", proofHint: "PHOTO OF THE OUTLET WITH YOUR PHONE PLUGGED IN" },
  { id: "cable_audit", icon: "PLUG", type: "ORGANIZE", text: "Check that your charging cable, adapter, and power bank are packed and accessible. Untangle the cable before it becomes modern art.", mins: 5, need: "battery", boost: 10, when: [5, 9999], proof: "photo", proofHint: "PHOTO OF YOUR CABLES OR CHARGER PACK" },
  { id: "power_bank", icon: "PLUG", type: "BACKUP", text: "If you carry a charged power bank, connect it and check your charging status. If you do not own one, admire the travelers who planned ahead.", mins: 10, need: "battery", boost: 25, when: [10, 9999], proof: "photo", proofHint: "PHOTO OF YOUR POWER BANK CONNECTED" },
  { id: "offline_ready", icon: "PLUG", type: "OFFLINE", text: "Save your boarding pass for offline access and download any permitted entertainment over Wi-Fi. Future you will appreciate this when the signal disappears.", mins: 10, need: "battery", boost: 15, when: [15, 9999], proof: "photo", proofHint: "PHOTO OF YOUR OFFLINE TICKET OR DOWNLOADS" },
  
  { id: "bag_tetris", icon: "PREP", type: "ORGANIZE", text: "Reorganize your personal bag so your passport, boarding pass, and essentials are easy to reach. Achieve luggage Tetris without removing every object you own.", mins: 10, need: "energy", boost: 10, when: [15, 9999], proof: "none", proofHint: "" },
  { id: "freshen_up", icon: "PREP", type: "REFRESH", text: "Visit a restroom and freshen up before boarding. Wash your hands, fix your hair, and transform from airport goblin to presentable passenger.", mins: 10, need: "energy", boost: 20, when: [15, 9999], proof: "none", proofHint: "" },
  { id: "boarding_audit", icon: "PREP", type: "CHECKLIST", text: "Verify your gate, boarding time, seat, and travel documents using official airport or airline information. Trust the display, not the stranger who looks confident.", mins: 5, need: "energy", boost: 15, when: [5, 9999], proof: "photo", proofHint: "PHOTO OF THE FLIGHT INFORMATION DISPLAY" },
  { id: "departure_ready", icon: "PREP", type: "FINALIZE", text: "Secure your loose belongings, put your essentials somewhere accessible, and get ready to board when instructed. Your mission is complete when nothing important is left behind.", mins: 8, need: "energy", boost: 15, when: [10, 60], proof: "none", proofHint: "" },

  // FINAL (Fallback)
  { id: 'go', icon: 'MOVE', type: 'FINAL', text: 'Your safe time is almost up. Start walking toward your gate now.', mins: 5, need: 'energy', boost: -10, when: [0, 20], proof: 'photo', proofHint: 'PHOTO OF YOUR GATE SIGN' },
];

export interface Stats {
  hunger: number;
  energy: number;
  battery: number;
}

export function pickMission({
  minsLeft,
  stats,
  recent = [],
  customPool = [],
}: {
  minsLeft: number;
  stats: Stats;
  recent?: string[];
  customPool?: Mission[];
}): Mission | null {
  // 1. Find all missions that fit the time window
  const allMissions = [
    ...customPool.map((m) => ({
      ...m,
      mins: m.mins || 10,
      when: m.when || [0, 9999],
      icon: m.icon || 'MOVE',
      type: m.type || 'LOCAL',
      proof: m.proof || 'photo',
      proofHint: m.proofHint || 'PHOTO OF WHERE YOU ARE',
    })),
    ...MISSIONS,
  ];
  const fits = allMissions.filter(
    (m) =>
      minsLeft >= m.when[0] &&
      minsLeft <= m.when[1] &&
      m.mins <= minsLeft - 3
  );
  
  // 2. Try to exclude recent ones if we have enough options
  const notRecent = fits.filter((m) => !recent.includes(m.id));
  let pool = notRecent.length > 0 ? notRecent : fits;
  
  // 3. Fallback to 'go' if literally nothing fits and 'go' hasn't already been done
  if (pool.length === 0) {
    if (recent.includes('go')) {
      return null;
    }
    pool = MISSIONS.filter((m) => m.id === 'go');
  }

  // 4. Determine lowest stat and highest stat
  const sortedStats = (Object.entries(stats) as [keyof Stats, number][]).sort((a, b) => a[1] - b[1]);
  const lowest = sortedStats[0];
  const highest = sortedStats[2];

  let targeted: Mission[] = [];

  // If energy is high, we can give a task that burns energy
  if (highest[0] === 'energy' && highest[1] > 60 && Math.random() > 0.5) {
    targeted = pool.filter((m) => m.need === 'energy' && m.boost < 0);
  }

  // Otherwise target the lowest stat with a positive boost
  if (targeted.length === 0) {
    targeted = pool.filter((m) => m.need === lowest[0] && m.boost > 0);
  }
  
  // 5. Select from targeted if possible, otherwise any in pool
  const from = targeted.length > 0 ? targeted : pool;
  return from[Math.floor(Math.random() * from.length)] || null;
}

export function startStats(vibe: string): Stats {
  return {
    hunger: vibe === 'hungry' ? 30 : 70,
    energy: vibe === 'wired' ? 40 : vibe === 'tired' ? 50 : 70,
    battery: 70,
  };
}

export const DRAIN_30S = { hunger: 0.15, energy: 0.2, battery: 0.075 };
