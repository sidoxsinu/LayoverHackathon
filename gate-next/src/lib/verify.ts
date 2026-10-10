// lib/verify.ts
// Mission photo proof verification interface and placeholder implementation

export type ProofStatus = 'none' | 'unverified' | 'pending' | 'verified' | 'rejected';

export interface VerifyInput {
  missionId: string;
  missionTitle: string;
  proofHint: string;
  imagePath: string;
  location?: string;
}

export interface VerifyResult {
  status: ProofStatus;
  confidence?: number;
  note?: string;
}

/**
 * Bonus XP granted for providing photo proof.
 * Note: Under current placeholder behavior, attaching a photo grants this bonus (+20 XP).
 * Once real AI vision verification exists, this bonus will only be awarded when status is 'verified'.
 */
export const PROOF_BONUS_XP = 20;

/**
 * Format human-readable status labels.
 * Strict rule: The UI must never display 'VERIFIED' unless status is strictly 'verified'.
 */
export function getProofStatusLabel(status: ProofStatus): string {
  switch (status) {
    case 'none':
      return '';
    case 'unverified':
      return 'PROOF SAVED, NOT CHECKED';
    case 'pending':
      return 'CHECKING';
    case 'verified':
      return 'VERIFIED';
    case 'rejected':
      return 'NOT ACCEPTED';
    default:
      return '';
  }
}

/**
 * Placeholder verification runner.
 * Runs non-blocking with a 5-second timeout.
 * If the request fails, times out, or verification is disabled, gracefully falls back to 'unverified'.
 */
export async function verifyProof(input: VerifyInput): Promise<VerifyResult> {
  try {
    const res = await fetch('/api/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return { status: 'unverified', note: 'VERIFICATION ENDPOINT ERROR' };
    }

    const data = await res.json();
    const validStatuses: ProofStatus[] = ['none', 'unverified', 'pending', 'verified', 'rejected'];
    const status: ProofStatus = validStatuses.includes(data.status) ? data.status : 'unverified';

    return {
      status,
      confidence: typeof data.confidence === 'number' ? data.confidence : undefined,
      note: typeof data.note === 'string' ? data.note : undefined,
    };
  } catch {
    // Timeout or network error leaves status as unverified, never throwing or blocking
    return {
      status: 'unverified',
      note: 'VERIFICATION TIMEOUT OR OFFLINE',
    };
  }
}
