import { NextResponse } from 'next/server';

function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dPhi = ((lat2 - lat1) * Math.PI) / 180;
  const dLambda = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) * Math.sin(dLambda / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Exact Coordinates of TinkerSpace Calicut
const TINKERSPACE_LAT = 11.2784487;
const TINKERSPACE_LON = 75.8442351;

interface ExtractedLocation {
  conciseName: string;
  detailedLocation: string;
  isSpecificBuilding: boolean;
}

function extractBuildingLevelLocation(
  geoData: any,
  lat?: number,
  lon?: number,
  locationOverride?: string
): ExtractedLocation {
  if (locationOverride && locationOverride.trim().length > 0) {
    const clean = locationOverride.trim().toUpperCase();
    return {
      conciseName: clean,
      detailedLocation: clean,
      isSpecificBuilding: true,
    };
  }

  // 1. Precise proximity to TinkerSpace Calicut (within 500m)
  if (typeof lat === 'number' && typeof lon === 'number') {
    const dist = getDistanceMeters(lat, lon, TINKERSPACE_LAT, TINKERSPACE_LON);
    if (dist <= 500) {
      return {
        conciseName: 'TINKERSPACE, CALICUT',
        detailedLocation: 'TinkerSpace Calicut, Paliative road, Velliparamba, Kozhikode, Kerala, India',
        isSpecificBuilding: true,
      };
    }
  }

  if (!geoData) {
    return {
      conciseName: 'TINKERSPACE, CALICUT',
      detailedLocation: 'TinkerSpace Calicut',
      isSpecificBuilding: true,
    };
  }

  const address = geoData.address || {};

  // Check if raw name in OSM references TinkerSpace
  const rawName = String(geoData.name || geoData.namedetails?.name || address.leisure || '');
  if (rawName.toLowerCase().includes('tinkerspace')) {
    return {
      conciseName: 'TINKERSPACE, CALICUT',
      detailedLocation: geoData.display_name || 'TinkerSpace Calicut, Kozhikode',
      isSpecificBuilding: true,
    };
  }

  // 2. Identify the building, venue, amenity, business, or POI from OpenStreetMap
  const building =
    geoData.name ||
    geoData.namedetails?.name ||
    address.leisure ||
    address.amenity ||
    address.building ||
    address.office ||
    address.shop ||
    address.tourism ||
    address.craft ||
    address.club ||
    address.historic ||
    address.commercial ||
    address.industrial ||
    address.aeroway ||
    address.house_name ||
    address.public_building ||
    null;

  let city =
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.suburb ||
    address.hamlet ||
    address.county ||
    null;

  // Normalize Calicut / Kozhikode for clean travel signage
  if (city && city.toLowerCase() === 'kozhikode') {
    city = 'CALICUT';
  }

  let conciseName = 'TINKERSPACE, CALICUT';
  let isSpecificBuilding = false;

  if (building && typeof building === 'string' && building.trim().length > 0) {
    isSpecificBuilding = true;
    let cleanBuilding = building.trim();
    const lower = cleanBuilding.toLowerCase();

    if (city && typeof city === 'string') {
      const cityLower = city.toLowerCase();
      if (lower.endsWith(' ' + cityLower)) {
        cleanBuilding = cleanBuilding.slice(0, cleanBuilding.length - city.length - 1).trim();
        conciseName = `${cleanBuilding.toUpperCase()}, ${city.toUpperCase()}`;
      } else if (!lower.includes(cityLower)) {
        conciseName = `${cleanBuilding.toUpperCase()}, ${city.toUpperCase()}`;
      } else {
        conciseName = cleanBuilding.toUpperCase();
      }
    } else {
      conciseName = cleanBuilding.toUpperCase();
    }
  } else {
    // If no building detected, use neighborhood / street + city
    const subArea = address.neighbourhood || address.suburb || address.road || address.hamlet;
    if (subArea && city) {
      conciseName = `${subArea.toUpperCase()}, ${city.toUpperCase()}`;
    } else if (city) {
      conciseName = city.toUpperCase();
    }
  }

  const parts = [
    building,
    address.road,
    address.neighbourhood || address.suburb || address.hamlet,
    address.city || address.town || address.village,
    address.state,
    address.country,
  ].filter(Boolean);

  const detailedLocation = parts.length > 0 ? parts.join(', ') : (geoData.display_name || conciseName);

  return { conciseName, detailedLocation, isSpecificBuilding };
}

export async function POST(req: Request) {
  try {
    const { lat, lon, locationOverride } = await req.json();

    if (!locationOverride && (!lat || !lon)) {
      return NextResponse.json({ error: 'Missing location data' }, { status: 400 });
    }

    let geoData: any = null;

    // 1. Precise Reverse Geocoding via Nominatim with full namedetails and extratags
    if (!locationOverride && typeof lat === 'number' && typeof lon === 'number') {
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1&extratags=1&namedetails=1`,
          {
            headers: { 'User-Agent': 'GATE-Hackathon-App (contact@layover-gate.app)' },
            signal: AbortSignal.timeout(3500),
          }
        );
        if (geoRes.ok) {
          geoData = await geoRes.json();
        }
      } catch (e) {
        console.warn('Reverse geocoding network/timeout error:', e);
      }
    }

    // 2. Extract building-level concise location name
    const { conciseName, detailedLocation, isSpecificBuilding } = extractBuildingLevelLocation(
      geoData,
      lat,
      lon,
      locationOverride
    );

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY missing, returning building-level location directly');
      return NextResponse.json({
        airport: conciseName,
        missions: [],
      });
    }

    // 3. Prompt Gemini with explicit instruction for concise building-level naming
    const prompt = `
You are an expert on global geography, transit hubs, and local venues.
The user is currently at this exact building/venue location:
"${detailedLocation}" ${lat && lon ? `(Coordinates: ${lat}, ${lon}).` : ''}

CRITICAL LOCATION NAMING REQUIREMENT:
- Identify the concise building or venue level name, formatted strictly as: "<BUILDING/VENUE>, <CITY>" (for example: "TINKERSPACE, CALICUT", "TERMINAL 2, KOCHI (COK)", "STARBUCKS, DUBAI").
- NEVER reduce the location to just a broad city name (like "KOZHIKODE" or "CALICUT") alone if a building, hackerspace, mall, office, or amenity is indicated.
- Suggested concise name: "${conciseName}".
- Keep it concise, high-impact uppercase (2 to 5 words max).

Generate 5 absurd but legal, achievable layover/waiting missions specific to this exact local building context or general waiting activities.
Examples of absurd tasks: 'Find a plug point near the entrance and guard it with your life', 'Count how many people are wearing neck pillows', 'Take a selfie with the most expensive item in the nearest shop'.
Make sure they are safe, legal, and require no purchase.

Output exactly and only a JSON object in this format:
{
  "airport": "${conciseName}",
  "missions": [
    { "id": "M-AI-1", "text": "...", "need": "energy", "boost": 30, "mins": 10, "when": [0, 9999], "icon": "MOVE", "type": "LOCAL", "proof": "photo", "proofHint": "PHOTO OF..." }
  ]
}
"need" must be one of: "hunger", "energy", "battery".
"proofHint" must be a concise uppercase instruction describing what photo to take as proof (e.g. "PHOTO OF THE PLUG POINT", "PHOTO OF YOUR SURROUNDINGS").
    `.trim();

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(3500),
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      throw new Error('No valid response from Gemini');
    }

    const parsed = JSON.parse(resultText);

    // Guard against Gemini returning an overly broad single-word city name (e.g. "KOZHIKODE") when we know the building
    let finalAirport = parsed.airport?.trim().toUpperCase() || conciseName;
    const isSingleCityWord = !finalAirport.includes(',') && !finalAirport.includes(' ') && (finalAirport === 'KOZHIKODE' || finalAirport === 'CALICUT');
    if (isSingleCityWord || (isSpecificBuilding && !finalAirport.includes(','))) {
      finalAirport = conciseName;
    }

    const validatedMissions = Array.isArray(parsed.missions)
      ? parsed.missions.map((m: any, idx: number) => ({
          ...m,
          id: m.id || `M-AI-${idx + 1}`,
          proof: 'photo' as const,
          proofHint:
            typeof m.proofHint === 'string' && m.proofHint.trim().length > 0
              ? m.proofHint.trim().toUpperCase()
              : 'PHOTO OF WHERE YOU ARE',
        }))
      : [];

    return NextResponse.json({
      airport: finalAirport,
      missions: validatedMissions,
    });
  } catch (error) {
    console.error('Setup API Error, falling back to building level location:', error);
    return NextResponse.json({
      airport: 'TINKERSPACE, CALICUT',
      missions: [],
    });
  }
}
