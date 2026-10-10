const fs = require('fs');

let code = fs.readFileSync('src/app/page.tsx', 'utf8');

// 1. Add SET_MISSION to Action type
code = code.replace(/\| \{ type: 'RESTORE'; payload: AppState \};/, "| { type: 'RESTORE'; payload: AppState }\n  | { type: 'SET_MISSION'; payload: any };");

// 2. Modify START to set mission: null
code = code.replace(/const m = nextMission\(\{ returnByMs: action\.payload\.returnByMs, stats: action\.payload\.stats, recent: \[\] \}, now\);\n      return \{\n        \.\.\.DEFAULT_STATE,\n        \.\.\.action\.payload,\n        screen: 'quest',\n        mission: m,\n        recent: \[m\.id\],/g, 
`return {
        ...DEFAULT_STATE,
        ...action.payload,
        screen: 'quest',
        mission: null,
        recent: [],`);

// 3. Modify START_DEMO to set mission: null
code = code.replace(/const m = nextMission\(\{ returnByMs: action\.payload\.returnByMs, stats: demoStats, recent: \[\] \}, now\);\n      return \{\n        \.\.\.DEFAULT_STATE,\n        \.\.\.action\.payload,\n        stats: demoStats,\n        screen: 'quest',\n        mission: m,\n        recent: \[m\.id\],/g,
`return {
        ...DEFAULT_STATE,
        ...action.payload,
        stats: demoStats,
        screen: 'quest',
        mission: null,
        recent: [],`);

// 4. Modify MISSION_COMPLETE to set mission: null
code = code.replace(/const nextM = nextMission\(\{ returnByMs: state\.returnByMs, stats: boostedStats, recent: newRecent \}, now\);\n      return \{\n        \.\.\.state,\n        stats: boostedStats,\n        xp: newXp,\n        log: newLog,\n        mission: nextM,\n        recent: \[nextM\.id, \.\.\.newRecent\]\.slice\(0, 3\),\n      \};/g,
`return {
        ...state,
        stats: boostedStats,
        xp: newXp,
        log: newLog,
        mission: null,
        recent: newRecent,
      };`);

// 5. Modify MISSION_SKIP to set mission: null
code = code.replace(/const nextM = nextMission\(\{ returnByMs: state\.returnByMs, stats: state\.stats, recent: newRecent \}, now\);\n      return \{\n        \.\.\.state,\n        log: newLog,\n        mission: nextM,\n        recent: \[nextM\.id, \.\.\.newRecent\]\.slice\(0, 3\),\n      \};/g,
`return {
        ...state,
        log: newLog,
        mission: null,
        recent: newRecent,
      };`);

// 6. Add SET_MISSION reducer
code = code.replace(/case 'SET_BATTERY':/, `case 'SET_MISSION':
      return {
        ...state,
        mission: action.payload,
        recent: action.payload ? [action.payload.id, ...state.recent].slice(0, 3) : state.recent,
      };

    case 'SET_BATTERY':`);

fs.writeFileSync('src/app/page.tsx', code);
