// src/app/api/venue-missions/route.ts
import { NextResponse } from 'next/server';
import { buildVenuePrompt } from '@/lib/venuePrompt';
import { normalizeWaitType } from '@/lib/labels';

// In-memory per-IP rate limiter: 5 requests per 10 minutes (600,000 ms)
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const ipRateLimits = new Map<string, RateLimitEntry>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipRateLimits.get(ip);

  if (!entry || now > entry.resetAt) {
    ipRateLimits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  entry.count += 1;
  return false;
}

// Clean old entries periodically to prevent memory leak
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of ipRateLimits.entries()) {
      if (now > entry.resetAt) {
        ipRateLimits.delete(ip);
      }
    }
  }, 5 * 60 * 1000);
}

function sanitizeInputString(val: unknown, maxLen: number = 60): string {
  if (typeof val !== 'string') return '';
  return val
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/["'\\]/g, '')
    .replace(/—/g, '-')
    .replace(/[^\w\s.,;:()\-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

export async function POST(req: Request) {
  try {
    // 1. IP Rate Limiting Check
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests. Please wait.' },
        { status: 429 }
      );
    }

    // 2. Parse & Validate Input
    const body = await req.json().catch(() => ({}));
    const rawVenue = body.venue;
    const cleanVenue = sanitizeInputString(rawVenue, 60);

    if (!cleanVenue || cleanVenue.length < 2) {
      return NextResponse.json(
        { error: 'INVALID_VENUE', message: 'Venue is required (max 60 characters).' },
        { status: 400 }
      );
    }

    const waitType = normalizeWaitType(body.waitType);
    const osmCategory = sanitizeInputString(body.osmCategory || 'transit hub', 60);
    const city = sanitizeInputString(body.city || 'local area', 60);
    const vibe = sanitizeInputString(body.vibe || 'tired', 20);

    const rawSafe = typeof body.safeMinutes === 'number' ? body.safeMinutes : parseInt(String(body.safeMinutes), 10);
    const safeMinutes = isNaN(rawSafe) ? 60 : Math.max(5, Math.min(720, Math.round(rawSafe)));

    const rawHour = typeof body.localHour === 'number' ? body.localHour : parseInt(String(body.localHour), 10);
    const localHour = isNaN(rawHour) ? new Date().getHours() : Math.max(0, Math.min(23, Math.round(rawHour)));

    // 3. API Key & Model Configuration
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'gsk_your_groq_api_key_here') {
      return NextResponse.json({
        success: false,
        error: 'GROQ_API_KEY_NOT_CONFIGURED',
        venueKnown: false,
        venueSummary: '',
        missions: [],
      });
    }

    const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

    // 4. Build Prompt
    const { system, user } = buildVenuePrompt({
      venue: cleanVenue,
      osmCategory,
      city,
      waitType,
      safeMinutes,
      vibe,
      localHour,
    });

    // 5. Outbound Groq Call with 12s Server Timeout
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(12000),
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 1200,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text().catch(() => '');
      console.warn(`Groq API returned error status ${groqRes.status}:`, errText);
      return NextResponse.json({
        success: false,
        error: `GROQ_API_ERROR_${groqRes.status}`,
        venueKnown: false,
        venueSummary: '',
        missions: [],
      });
    }

    const groqData = await groqRes.json();
    const rawContent = groqData.choices?.[0]?.message?.content;

    if (!rawContent) {
      return NextResponse.json({
        success: false,
        error: 'EMPTY_LLM_RESPONSE',
        venueKnown: false,
        venueSummary: '',
        missions: [],
      });
    }

    let parsed: any;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      return NextResponse.json({
        success: false,
        error: 'MALFORMED_JSON_RESPONSE',
        venueKnown: false,
        venueSummary: '',
        missions: [],
      });
    }

    const venueKnown = Boolean(parsed.venueKnown);
    const venueSummary = typeof parsed.venueSummary === 'string' ? parsed.venueSummary.slice(0, 80) : '';
    const missions = Array.isArray(parsed.missions) ? parsed.missions : [];

    return NextResponse.json({
      success: true,
      venueKnown,
      venueSummary,
      missions,
    });
  } catch (error: any) {
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
      return NextResponse.json({
        success: false,
        error: 'TIMEOUT',
        venueKnown: false,
        venueSummary: '',
        missions: [],
      });
    }

    console.warn('Venue missions route error:', error);
    return NextResponse.json({
      success: false,
      error: 'SERVER_ERROR',
      venueKnown: false,
      venueSummary: '',
      missions: [],
    });
  }
}
