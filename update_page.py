import re

with open("gate-next/src/app/page.tsx", "r") as f:
    content = f.read()

# Add import
content = content.replace(
    "import SafeTravels from '@/components/SafeTravels';",
    "import SafeTravels from '@/components/SafeTravels';\nimport DebugOverlay from '@/components/DebugOverlay';"
)

# Add handleDebugAction before const survivedMs
handler = """
  const handleDebugAction = (action: string) => {
    switch (action) {
      case 'trigger_alarm':
        if (state.screen === 'quest') {
          arm();
          dispatch({ type: 'RESTORE', payload: { ...state, returnByMs: now + 10000 } });
        }
        break;
      case 'fast_forward':
        if (state.returnByMs) {
          dispatch({ type: 'RESTORE', payload: { ...state, returnByMs: state.returnByMs - 3600000, departureMs: state.departureMs - 3600000 } });
        }
        break;
      case 'fill_stats':
        ['hunger', 'energy', 'battery'].forEach(k => dispatch({ type: 'SET_STAT', key: k as any, value: 100 }));
        break;
      case 'drain_stats':
        ['hunger', 'energy', 'battery'].forEach(k => dispatch({ type: 'SET_STAT', key: k as any, value: 10 }));
        break;
      case 'reset':
        clear();
        window.location.reload();
        break;
    }
  };

  const survivedMs = """
content = content.replace("  const survivedMs = ", handler)

# Add overlay to alarm return
content = content.replace(
    "return (\n      <GateAlarm",
    "return (\n      <>\n      <GateAlarm"
)
content = content.replace(
    "onDismiss={() => dispatch({ type: 'DISMISS_ALARM' })}\n      />\n    );",
    "onDismiss={() => dispatch({ type: 'DISMISS_ALARM' })}\n      />\n      <DebugOverlay onAction={handleDebugAction} />\n      </>\n    );"
)

# Add overlay to safe return
content = content.replace(
    "return (\n      <SafeTravels",
    "return (\n      <>\n      <SafeTravels"
)
content = content.replace(
    "onNewLayover={() => dispatch({ type: 'NEW_LAYOVER' })}\n      />\n    );",
    "onNewLayover={() => dispatch({ type: 'NEW_LAYOVER' })}\n      />\n      <DebugOverlay onAction={handleDebugAction} />\n      </>\n    );"
)

# Add overlay to quest return
content = content.replace(
    "return (\n      <QuestScreen",
    "return (\n      <>\n      <QuestScreen"
)
content = content.replace(
    "onStatChange={(key, value) => dispatch({ type: 'SET_STAT', key, value })}\n      />\n    );",
    "onStatChange={(key, value) => dispatch({ type: 'SET_STAT', key, value })}\n      />\n      <DebugOverlay onAction={handleDebugAction} />\n      </>\n    );"
)

# Add overlay to setup return
content = content.replace(
    "return (\n    <SetupScreen",
    "return (\n    <>\n    <SetupScreen"
)
content = content.replace(
    "onWordmarkTap={handleWordmarkTap}\n    />\n  );",
    "onWordmarkTap={handleWordmarkTap}\n    />\n    <DebugOverlay onAction={handleDebugAction} />\n    </>\n  );"
)

with open("gate-next/src/app/page.tsx", "w") as f:
    f.write(content)

print("Done")
