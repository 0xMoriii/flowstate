import { NextResponse } from "next/server";

// Prefer 2.5 Flash (2.0-flash is no longer available for new users); fallback to 1.5-flash for free tier
const MODELS_TO_TRY = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-flash-latest"];

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Missing Gemini API key. Set GEMINI_API_KEY or NEXT_PUBLIC_GEMINI_API_KEY in .env.local (dev) or in your hosting provider's environment variables (production). Check https://aistudio.google.com/apikey",
      },
      { status: 500 }
    );
  }

  let body: { prompt?: string; systemInstruction?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { prompt, systemInstruction } = body;
  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "Missing or invalid 'prompt' in body" }, { status: 400 });
  }

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    ...(systemInstruction && typeof systemInstruction === "string" && {
      systemInstruction: { parts: [{ text: systemInstruction }] },
    }),
    generationConfig: {
      maxOutputTokens: 2048,
      temperature: 0.9,
    },
  };

  let lastError = "";
  for (const model of MODELS_TO_TRY) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        return NextResponse.json({ text });
      }

      const message = data?.error?.message ?? data?.error ?? `HTTP ${response.status}`;
      lastError = typeof message === "string" ? message : JSON.stringify(message);
      // 404 = model not found, 403 = permission denied, 429 = quota exceeded → try next model
      if (response.status === 404 || response.status === 403 || response.status === 429) continue;
      // 400, 500 etc. → return so user sees the error
      return NextResponse.json({ error: lastError }, { status: response.status });
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Request failed";
      // Network error → try next model
      continue;
    }
  }

  return NextResponse.json(
    { error: lastError || "No model responded. Check your API key at https://aistudio.google.com/apikey and ensure the Gemini API is enabled." },
    { status: 503 }
  );
}
