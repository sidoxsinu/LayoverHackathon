import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { stats, minsLeft } = await req.json();

    const prompt = `You are a survival game engine for an airport layover. 
The player has ${minsLeft} minutes left before they must return to their gate.
Their current stats are: Hunger: ${stats.hunger}/100, Sanity: ${stats.sanity}/100, Battery: ${stats.battery}/100.
Create a highly specific, fun, slightly edgy or absurd but achievable airport mission. 

Return a JSON object with this exact structure:
{
  "id": "a unique string id, max 8 chars",
  "icon": "One of: FOOD, MOVE, REST, PLUG, PREP",
  "type": "One word uppercase category, e.g., HUNT, ZEN, HYDRATE, EXPLORE",
  "text": "The mission instruction (max 15 words). E.g. 'Stare at the departure board until you find a city you cannot pronounce.'",
  "mins": estimated minutes to complete (number, between 5 and 30),
  "need": "hunger", "sanity", or "battery" (whichever stat it helps most),
  "boost": number between 10 and 50 (how much it replenishes the stat)
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
    const mission = JSON.parse(data.choices[0].message.content);

    // Validate structure quickly
    if (mission.id && mission.text && typeof mission.mins === 'number') {
      // Need a default 'when' so the local logic doesn't break if it expects it
      mission.when = [0, 9999];
      return NextResponse.json(mission);
    }
    
    throw new Error('Invalid JSON structure');
  } catch (err) {
    return NextResponse.json({ error: 'Failed to generate mission' }, { status: 500 });
  }
}
