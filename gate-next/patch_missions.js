const fs = require('fs');
let code = fs.readFileSync('src/lib/missions.ts', 'utf8');

code = code.replace(/export function pickMission\(minsLeft: number, stats: Stats, recent: string\[\] = \[\]\): Mission \{/, 
`export function pickMission(minsLeft: number, stats: Stats, recent: string[] = [], customMissions: Mission[] = []): Mission {`);

code = code.replace(/export function nextMission\(\n  ctx: \{ returnByMs: number; stats: Stats; recent: string\[\] \},\n  now: number\n\): Mission \{/,
`export function nextMission(
  ctx: { returnByMs: number; stats: Stats; recent: string[]; customMissions?: Mission[] },
  now: number
): Mission {`);

code = code.replace(/const minsLeft = Math\.floor\(\(ctx\.returnByMs - now\) \/ 60_000\);/g,
`const minsLeft = Math.floor((ctx.returnByMs - now) / 60_000);
  const customMissions = ctx.customMissions || [];`);

code = code.replace(/return pickMission\(minsLeft, ctx\.stats, ctx\.recent\);/g,
`return pickMission(minsLeft, ctx.stats, ctx.recent, customMissions);`);

code = code.replace(/const pool = MISSIONS\.filter\(\(m\) => \{/g,
`const allMissions = [...customMissions, ...MISSIONS];
  
  const pool = allMissions.filter((m) => {`);

fs.writeFileSync('src/lib/missions.ts', code);
