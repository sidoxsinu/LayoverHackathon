const fs = require('fs');

let code = fs.readFileSync('src/app/page.tsx', 'utf8');

const newEffect = `
  // AI Mission Fetch
  useEffect(() => {
    if (state.screen === 'quest' && state.mission === null) {
      let active = true;
      const minsLeft = Math.max(0, Math.floor((state.returnByMs - Date.now()) / 60000));
      
      fetch('/api/mission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stats: state.stats, minsLeft })
      })
        .then((res) => {
          if (!res.ok) throw new Error('API failed');
          return res.json();
        })
        .then((data) => {
          if (!active) return;
          if (data && data.id && data.text) {
            dispatch({ type: 'SET_MISSION', payload: data });
          } else {
            throw new Error('Invalid response');
          }
        })
        .catch((err) => {
          if (!active) return;
          console.warn('AI mission failed, using local fallback:', err);
          const fallback = nextMission({ returnByMs: state.returnByMs, stats: state.stats, recent: state.recent }, Date.now());
          dispatch({ type: 'SET_MISSION', payload: fallback });
        });

      return () => { active = false; };
    }
  }, [state.screen, state.mission, state.stats, state.returnByMs, state.recent]);

  // Alarm latch
`;

code = code.replace(/\/\/ Alarm latch/, newEffect);

fs.writeFileSync('src/app/page.tsx', code);
