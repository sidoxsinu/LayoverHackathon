const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

// In RESTORE
code = code.replace(/gate: saved\.gate,/, "airportName: saved.airportName || 'TBA',\n      gate: saved.gate,\n      customMissions: saved.customMissions || [],");

// In useEffect toSave
code = code.replace(/gate: state\.gate,/, "airportName: state.airportName,\n      gate: state.gate,\n      customMissions: state.customMissions,");

// Update nextMission calls missing the customMissions inside the useEffect
code = code.replace(/const m = nextMission\(\{ returnByMs: action\.payload\.returnByMs, stats: demoStats, recent: \[\], customMissions: \[\] \}\);/g, 
"const m = nextMission({ returnByMs: action.payload.returnByMs, stats: demoStats, recent: [], customMissions: [] }, now);");

code = code.replace(/mission: nextMission\(\{ returnByMs: action\.payload\.returnByMs, stats: action\.payload\.stats, recent: \[\], customMissions: action\.payload\.customMissions \}\)/g,
"mission: nextMission({ returnByMs: action.payload.returnByMs, stats: action.payload.stats, recent: [], customMissions: action.payload.customMissions }, now)");

fs.writeFileSync('src/app/page.tsx', code);
