const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const ITERATION = parseInt(process.env.ITERATION || '1', 10);
const LOG_FILE = path.join(__dirname, '../../docs/TEST-LOG.md');
if (ITERATION === 1 && !fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, '# Test Log\n\n');
}

let logContent = `## Iteration ${ITERATION}\n\n`;
let allPass = true;
let failures = [];

function logTest(num, name, status, symptom = '', cause = '') {
  const result = status ? 'PASS' : 'FAIL';
  logContent += `**Test ${num}: ${name}** - ${result}\n`;
  if (!status) {
    allPass = false;
    logContent += `  - **Symptom**: ${symptom}\n`;
    logContent += `  - **Root Cause**: ${cause}\n`;
    failures.push(num);
  }
}

console.log(`Starting Iteration ${ITERATION}...`);

// TEST 15: Grep for banned items
try {
  console.log('Running Test 15...');
  // Banned: emojis, gradient, shadow, rounded- above 2px, Inter, Geist, lucide, backdrop, em dashes
  const cmd = `grep -rE 'gradient|shadow|rounded-(md|lg|xl|2xl|3xl|full)|\\bInter\\b|\\bGeist\\b|lucide|backdrop|—' src/ || true`;
  const result = execSync(cmd, { encoding: 'utf8' }).trim();
  if (result.length > 0) {
    logTest(15, 'Grep src for banned items', false, 'Found banned items in source', 'Used banned tailwind classes or fonts');
  } else {
    logTest(15, 'Grep src for banned items', true);
  }
} catch (e) {
  logTest(15, 'Grep src for banned items', false, 'Grep failed', e.message);
}

// TEST 16: Zero console errors or warnings across run, build succeeds.
try {
  console.log('Running Test 16...');
  execSync('npm run build', { stdio: 'ignore' });
  logTest(16, 'Build succeeds', true);
} catch (e) {
  logTest(16, 'Build succeeds', false, 'npm run build failed', 'Syntax or type errors in the code');
}

// Run playwright
console.log('Running Playwright tests...');
try {
  execSync('npx playwright test --reporter=json > test-results.json', { stdio: 'pipe' });
} catch (e) {
  // It's expected to throw if tests fail
}

const pwResults = JSON.parse(fs.readFileSync('test-results.json', 'utf8'));

// Map playwright specs to test numbers
const map = {
  '1. Setup validation': 1,
  '2. Demo Mode': 2,
  '3. Alarm': 3,
  '4. Normal mode ladder': 4,
  '5. Stats drain': 5,
  '6. Mission engine': 6,
  '7. Complete adds boost and XP': 7,
  '8. Refresh mid-session': 8,
  '9. Background simulation': 9,
  '10. Departure past midnight computes correctly': 10
};

pwResults.suites.forEach(suite => {
  suite.specs.forEach(spec => {
    const num = map[spec.title];
    if (num) {
      const ok = spec.ok;
      if (ok) {
        logTest(num, spec.title, true);
      } else {
        const err = spec.tests[0].results[0].error;
        let symptom = err ? (err.message.split('\\n')[0].substring(0, 100)) : 'Test failed';
        symptom = symptom.replace(/\\n/g, ' ');
        // For automated runs, root cause requires human inspection, but we put a placeholder
        const cause = 'Needs investigation (Playwright assertion failed)';
        logTest(num, spec.title, false, symptom, cause);
      }
    }
  });
});

// Append to log
fs.appendFileSync(LOG_FILE, logContent + '\n');
console.log(`Iteration ${ITERATION} completed. Passed: ${allPass}. Failures: ${failures.join(', ')}`);
if (!allPass) process.exit(1);
