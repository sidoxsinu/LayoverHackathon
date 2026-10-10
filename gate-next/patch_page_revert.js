const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

// 1. Remove the AI Mission Fetch useEffect
code = code.replace(/\/\/ AI Mission Fetch\n  useEffect\(\(\) => \{[\s\S]*?return \(\) => \{ active = false; \};\n    \}\n  \}, \[state\.screen, state\.mission, state\.stats, state\.returnByMs, state\.recent\]\);\n\n  \/\/ Alarm latch/, '// Alarm latch');

// 2. Add properties to AppState
code = code.replace(/gate: string;/, `airportName: string;\n  gate: string;\n  customMissions: Mission[];`);

// 3. Update DEFAULT_STATE
code = code.replace(/gate: '',/g, `airportName: 'TBA',\n  gate: '',\n  customMissions: [],`);

// 4. Update the SET_MISSION reducer block (remove it completely, and restore synchronous setting)
// Actually, I can just replace the SET_MISSION with the proper synchronous START and MISSION_COMPLETE handling.
code = code.replace(/mission: null,\n        recent: \[\],/g, 
`mission: nextMission({ returnByMs: action.payload.returnByMs, stats: action.payload.stats, recent: [], customMissions: action.payload.customMissions }),
        recent: [],`);
        
// Fix START_DEMO which doesn't have customMissions in action.payload natively, so use []
code = code.replace(/mission: nextMission\(\{ returnByMs: action\.payload\.returnByMs, stats: demoStats, recent: \[\], customMissions: action\.payload\.customMissions \}\),/g, 
`mission: nextMission({ returnByMs: action.payload.returnByMs, stats: demoStats, recent: [], customMissions: [] }),`);

// MISSION_COMPLETE 
code = code.replace(/mission: null,\n        recent: newRecent,/g,
`mission: nextMission({ returnByMs: state.returnByMs, stats: boostedStats, recent: newRecent, customMissions: state.customMissions }, now),\n        recent: newRecent,`);

// MISSION_SKIP
code = code.replace(/mission: null,\n        recent: newRecent,/g,
`mission: nextMission({ returnByMs: state.returnByMs, stats: state.stats, recent: newRecent, customMissions: state.customMissions }, now),\n        recent: newRecent,`);

// Remove SET_MISSION
code = code.replace(/case 'SET_MISSION':\n      return \{\n        \.\.\.state,\n        mission: action\.payload,\n        recent: action\.payload \? \[action\.payload\.id, \.\.\.state\.recent\]\.slice\(0, 3\) : state\.recent,\n      \};\n\n    case 'SET_BATTERY':/g, "case 'SET_BATTERY':");

fs.writeFileSync('src/app/page.tsx', code);
