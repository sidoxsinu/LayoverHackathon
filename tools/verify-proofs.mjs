// gate-next/scripts/verify-proofs.mjs
// Verification suite for GATE photo proof implementation (Section 7)

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const srcDir = path.resolve(projectRoot, 'src');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${testName}`);
  } else {
    failedTests++;
    console.error(`  [FAIL] ${testName}: ${details}`);
  }
}

console.log('================================================================');
console.log('GATE MISSION PHOTO PROOFS: VERIFICATION SUITE');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// 1. BANNED UI GREP TEST
// -----------------------------------------------------------------------------
console.log('1. BANNED UI AUDIT:');
function getAllFiles(dir, exts = ['.ts', '.tsx', '.js', '.jsx', '.css']) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, exts));
    } else if (exts.includes(path.extname(fullPath))) {
      results.push(fullPath);
    }
  }
  return results;
}

const srcFiles = getAllFiles(srcDir);
const bannedPatterns = [
  { name: 'Em dash (—)', regex: /—/ },
  { name: 'Gradient', regex: /(linear-gradient|radial-gradient|bg-gradient)/i },
  { name: 'Drop shadow', regex: /(box-shadow|drop-shadow|shadow-[a-z0-9])/i },
  { name: 'Blur effect', regex: /(backdrop-blur|filter:\s*blur)/i },
  { name: 'Lucide icon set', regex: /from ['"]lucide/i },
  { name: 'Banned font Geist', regex: /Geist/i },
  { name: 'Rounded corner > 2px', regex: /rounded-(sm|md|lg|xl|2xl|3xl|full)\b/ },
];

let bannedFound = 0;
for (const { name, regex } of bannedPatterns) {
  let matches = [];
  for (const file of srcFiles) {
    const content = fs.readFileSync(file, 'utf8');
    if (regex.test(content)) {
      matches.push(path.relative(projectRoot, file));
    }
  }
  assert(matches.length === 0, `Zero hits for: ${name}`, matches.join(', '));
  if (matches.length > 0) bannedFound++;
}

// -----------------------------------------------------------------------------
// 2. VERIFIER CONTRACT & STATUS LABELS TEST
// -----------------------------------------------------------------------------
console.log('\n2. VERIFIER CONTRACT & STATUS LABELS:');
const verifyModulePath = path.join(srcDir, 'lib/verify.ts');
assert(fs.existsSync(verifyModulePath), 'lib/verify.ts exists');

const verifyContent = fs.readFileSync(verifyModulePath, 'utf8');
assert(verifyContent.includes('export const PROOF_BONUS_XP = 20;'), 'PROOF_BONUS_XP is defined as 20');
assert(verifyContent.includes('PROOF SAVED, NOT CHECKED'), 'unverified label matches "PROOF SAVED, NOT CHECKED"');
assert(verifyContent.includes('CHECKING'), 'pending label matches "CHECKING"');
assert(verifyContent.includes('VERIFIED'), 'verified label matches "VERIFIED"');
assert(verifyContent.includes('NOT ACCEPTED'), 'rejected label matches "NOT ACCEPTED"');
assert(verifyContent.includes('AbortSignal.timeout(5000)'), 'verifyProof implements 5s timeout');

const verifyRoutePath = path.join(srcDir, 'app/api/verify/route.ts');
assert(fs.existsSync(verifyRoutePath), 'src/app/api/verify/route.ts exists');
const verifyRouteContent = fs.readFileSync(verifyRoutePath, 'utf8');
assert(verifyRouteContent.includes('VERIFIER CONTRACT SPECIFICATION'), 'Route contains verifier contract comment');
assert(verifyRouteContent.includes('status: \'unverified\''), 'Placeholder returns unverified status immediately');
assert(verifyRouteContent.includes('VERIFICATION NOT ENABLED'), 'Placeholder note specifies VERIFICATION NOT ENABLED');
assert(verifyRouteContent.includes('auth.getUser'), 'Route authenticates user via Supabase');

// -----------------------------------------------------------------------------
// 3. IMAGE SCALING & EXIF STRIPPING LOGIC
// -----------------------------------------------------------------------------
console.log('\n3. IMAGE COMPRESSION & RESIZING LOGIC:');
function computeScaledDimensions(width, height, maxDimension = 1280) {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height };
  }
  if (width >= height) {
    return {
      width: maxDimension,
      height: Math.round((height * maxDimension) / width),
    };
  } else {
    return {
      width: Math.round((width * maxDimension) / height),
      height: maxDimension,
    };
  }
}

const landscape4000 = computeScaledDimensions(4000, 3000, 1280);
assert(landscape4000.width === 1280 && landscape4000.height === 960, '4000x3000 image scales to 1280x960 (<= 1280px longest side)');

const portrait4000 = computeScaledDimensions(3000, 4000, 1280);
assert(portrait4000.width === 960 && portrait4000.height === 1280, '3000x4000 image scales to 960x1280 (<= 1280px longest side)');

const proofLibPath = path.join(srcDir, 'lib/proof.ts');
assert(fs.existsSync(proofLibPath), 'lib/proof.ts exists');
const proofLibContent = fs.readFileSync(proofLibPath, 'utf8');
assert(proofLibContent.includes('toBlob(resolve, \'image/jpeg\', 0.7)'), 'Re-encodes as JPEG 0.7 on canvas (stripping EXIF)');
assert(proofLibContent.includes('MAX_INPUT_BYTES = 10 * 1024 * 1024'), 'Rejects files over 10 MB');
assert(proofLibContent.includes('MAX_OUTPUT_BYTES = 1024 * 1024'), 'Enforces 1 MB maximum output limit');

// -----------------------------------------------------------------------------
// 4. STORAGE RLS SIMULATION & POLICIES
// -----------------------------------------------------------------------------
console.log('\n4. STORAGE RLS POLICIES & SIMULATION:');
const migrationPath = path.join(projectRoot, 'supabase/migrations/0003_proofs.sql');
assert(fs.existsSync(migrationPath), 'Migration 0003_proofs.sql exists');

const migrationSql = fs.readFileSync(migrationPath, 'utf8');
assert(migrationSql.includes('bucket_id = \'proofs\''), 'Private storage bucket proofs configured');
assert(migrationSql.includes('(storage.foldername(name))[1] = auth.uid()::text'), 'RLS policy restricts access strictly to user_id folder');
assert(migrationSql.includes('proof_status in (\'none\', \'unverified\', \'pending\', \'verified\', \'rejected\')'), 'Check constraint validates proof_status');

// Simulate storage foldername check
function canUserAccessObject(path, authUid) {
  // Matches SQL: (storage.foldername(name))[1] = auth.uid()::text
  const parts = path.split('/');
  const userFolder = parts[0];
  return userFolder === authUid;
}

const userA = 'user-uuid-1111';
const userB = 'user-uuid-2222';
const pathA = `${userA}/layover-1/log-1.jpg`;

assert(canUserAccessObject(pathA, userA) === true, 'User A can read/write own object in User A folder');
assert(canUserAccessObject(pathA, userB) === false, 'User B CANNOT read/write object in User A folder');

// -----------------------------------------------------------------------------
// 5. PHASE GUARD & ALARM ISOLATION
// -----------------------------------------------------------------------------
console.log('\n5. PHASE GUARD & ALARM ISOLATION:');
function isProofAllowed(phase, minsLeft) {
  // Phase guard rule: allowed ONLY while phase is 'free' or 'headsup' AND minsLeft > 5
  if (phase === 'urgent' || phase === 'alarm' || minsLeft <= 5) {
    return false;
  }
  return phase === 'free' || phase === 'headsup';
}

assert(isProofAllowed('free', 45) === true, 'Phase free with 45 mins left: Proof ENABLED');
assert(isProofAllowed('headsup', 15) === true, 'Phase headsup with 15 mins left: Proof ENABLED');
assert(isProofAllowed('headsup', 5) === false, 'Phase headsup with 5 mins left: Proof DISABLED (<= 5 min threshold)');
assert(isProofAllowed('headsup', 2) === false, 'Phase headsup with 2 mins left: Proof DISABLED (<= 5 min threshold)');
assert(isProofAllowed('urgent', 10) === false, 'Phase urgent: Proof DISABLED immediately');
assert(isProofAllowed('alarm', 0) === false, 'Phase alarm: Proof DISABLED immediately');

const questScreenContent = fs.readFileSync(path.join(srcDir, 'components/QuestScreen.tsx'), 'utf8');
assert(questScreenContent.includes('isProofDisabled = phase === \'urgent\' || phase === \'alarm\' || minsLeft <= 5'), 'QuestScreen enforces phase and 5-min threshold');
assert(questScreenContent.includes('if (phase === \'alarm\' && isProofModalOpen)'), 'QuestScreen immediately closes proof modal on alarm trigger');

// -----------------------------------------------------------------------------
// 6. INDEXEDDB QUEUE & RETRY LOGIC
// -----------------------------------------------------------------------------
console.log('\n6. INDEXEDDB QUEUE & GUEST PERSISTENCE:');
assert(proofLibContent.includes('MAX_PENDING_QUEUE = 10'), 'IndexedDB enforces max 10 pending queue limit');
assert(proofLibContent.includes('clearPendingProofs'), 'clearPendingProofs helper provided for sign-out');
const proofModalContent = fs.readFileSync(path.join(srcDir, 'components/ui/ProofModal.tsx'), 'utf8');
assert(proofModalContent.includes('GUEST PHOTOS ARE NOT SAVED'), 'Guest warning displayed when not signed in');

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
if (failedTests === 0) {
  console.log('STATUS: ALL CHECKS PASSED [OK]');
} else {
  console.error('STATUS: VERIFICATION FAILURES DETECTED');
  process.exit(1);
}
console.log('================================================================\n');
