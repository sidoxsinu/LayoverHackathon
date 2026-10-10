import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { lat, lon, locationOverride } = await req.json();

    if (!locationOverride && (!lat || !lon)) {
      return NextResponse.json({ error: 'Missing location data' }, { status: 400 });
    }

    // 1. Precise Reverse Geocoding via Nominatim (if no override)
    let preciseLocation = locationOverride || (lat && lon ? `LAT ${lat.toFixed(4)}, LON ${lon.toFixed(4)}` : 'UNKNOWN LOCATION');
    let shortName = locationOverride || 'UNKNOWN LOCATION';
    
    if (!locationOverride && lat && lon) {
      try {
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`, {
          headers: { 'User-Agent': 'GATE-Hackathon-App (contact@layover-gate.app)' },
          signal: AbortSignal.timeout(3000)
        });
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData.address) {
            const { amenity, aeroway, road, neighbourhood, suburb, city, town, village, state, country } = geoData.address;
            const parts = [amenity || aeroway, road, neighbourhood || suburb, city || town || village, state, country].filter(Boolean);
            if (parts.length > 0) {
              preciseLocation = parts.join(', ');
            } else if (geoData.display_name) {
              preciseLocation = geoData.display_name;
            }
            
            const primaryLoc = amenity || aeroway || neighbourhood || suburb || city || town || village;
            if (primaryLoc) {
              shortName = primaryLoc.toUpperCase();
            }
          }
        }
      } catch (e) {
        console.error('Reverse geocoding failed', e);
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY missing, returning fallback');
      return NextResponse.json({
        airport: shortName !== 'UNKNOWN LOCATION' ? shortName : 'TINKERSPACE CALICUT',
        missions: []
      });
    }

    const prompt = `
You are an expert on global geography and local environments. The user is currently at this precise location: 
"${preciseLocation}" ${lat && lon ? `(Coordinates: ${lat}, ${lon}).` : ''}

If this is an airport or transit hub, identify it by its official name and IATA code (e.g. "Kochi (COK)", "Dubai (DXB)"). 
If it is a local area, neighborhood, or specific business, identify it precisely using the reverse-geocode data provided above (e.g. "Tinkerspace, Kochi", "Civic Center, San Francisco").

Provide the location name in short uppercase/title format.
Generate 5 absurd but legal and achievable layover or waiting missions specific to this exact local context or general waiting activities. 
Examples of absurd tasks: 'Find a plug point near the entrance and guard it with your life', 'Count how many people are wearing neck pillows', 'Take a selfie with the most expensive item in the nearest shop'.
Make sure they are safe, legal, and require no purchase.
Output exactly and only a JSON object in this format:
{
  "airport": "Location Name (CODE or CITY)",
  "missions": [
    { "id": "M-AI-1", "text": "...", "need": "energy", "boost": 30, "mins": 10, "when": [0, 9999], "icon": "MOVE", "type": "LOCAL" },
    ...
  ]
}
"need" must be one of: "hunger", "energy", "battery".
    `.trim();

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(3000),
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!resultText) {
      throw new Error('No valid response from Gemini');
    }

    const parsed = JSON.parse(resultText);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Setup API Error:', error);
    return NextResponse.json({
      airport: 'TINKERSPACE CALICUT',
      missions: []
    });
  }
}
