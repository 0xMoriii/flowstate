import { NextResponse } from "next/server";

const GEMINI_TTS_MODEL = "gemini-2.5-flash-preview-tts";

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing Gemini API key" },
      { status: 500 }
    );
  }

  let body: { text?: string; voiceName?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = body?.text;
  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "Missing or invalid 'text' in body" }, { status: 400 });
  }

  const voiceName = typeof body.voiceName === "string" && body.voiceName ? body.voiceName : "Charon";

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TTS_MODEL}:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ parts: [{ text: `Say strictly: ${text}` }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      const message = data?.error?.message ?? `HTTP ${response.status}`;
      return NextResponse.json({ error: message }, { status: response.status });
    }

    const inlineData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (!inlineData?.data) {
      return NextResponse.json({ error: "No audio in response" }, { status: 502 });
    }

    const rateMatch = inlineData.mimeType?.match(/rate=(\d+)/);
    const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;

    return NextResponse.json({
      data: inlineData.data,
      sampleRate,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
