import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { lat, lon } = await req.json();

    if (!lat || !lon) {
      return NextResponse.json({ error: 'Missing lat/lon' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY missing, returning fallback');
      return NextResponse.json({
        airport: 'UNKNOWN AIRPORT',
        missions: []
      });
    }

    const prompt = `
You are an expert on global airports. The user is at location Latitude: ${lat}, Longitude: ${lon}.
Identify the nearest major international airport.
Provide the airport name and its 3-letter IATA code in the format "Name (CODE)".
Generate 5 absurd but legal and achievable layover missions specific to this airport or general airports. 
Examples of absurd tasks: 'Find a plug point near gate C and guard it with your life', 'Count how many people are wearing neck pillows', 'Take a selfie with the most expensive item in the duty-free shop'.
Make sure they are safe, legal, and require no purchase.
Output exactly and only a JSON object in this format:
{
  "airport": "Airport Name (CODE)",
  "missions": [
    { "id": "M-AI-1", "text": "...", "need": "sanity", "boost": 30 },
    ...
  ]
}
"need" must be one of: "hunger", "sanity", "battery".
    `.trim();

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
      airport: 'UNKNOWN AIRPORT',
      missions: []
    });
  }
}
