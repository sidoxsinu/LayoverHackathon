import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { city, region, country } = await req.json();

    const prompt = `You are an airport layover engine. The user is located near ${city}, ${region}, ${country}.
1. Determine the nearest major commercial airport to this location.
2. Generate EXACTLY 5 highly specific, fun, slightly edgy or absurd but achievable layover missions specific to this airport.
IMPORTANT: The missions must be legally safe to perform in an airport (no security breaches, no trespassing).
Return a JSON object with this EXACT structure:
{
  "airportName": "Name of the airport (e.g., Heathrow Airport (LHR))",
  "missions": [
    {
      "id": "A unique short id (e.g. LHR01)",
      "icon": "One of: FOOD, MOVE, REST, PLUG, PREP",
      "type": "One word uppercase category",
      "text": "Mission text (max 15 words) mentioning something specific about this airport.",
      "mins": 15,
      "need": "hunger",
      "boost": 30
    }
  ]
}`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer GROQ_API_KEY_PLACEHOLDER`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: [{ role: "system", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.8
      })
    });

    if (!res.ok) {
      throw new Error('Groq API error');
    }

    const data = await res.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    if (result.missions && Array.isArray(result.missions)) {
      result.missions = result.missions.map((m: any) => ({
        ...m,
        when: [0, 9999]
      }));
    }

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to init airport info' }, { status: 500 });
  }
}
