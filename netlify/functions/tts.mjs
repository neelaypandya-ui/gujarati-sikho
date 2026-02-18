// netlify/functions/tts.mjs
// Serverless proxy for Google Cloud Text-to-Speech API
// Your API key stays in Netlify environment variables — never exposed to the client

export default async (req) => {
  // Only allow POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "TTS API key not configured. Set GOOGLE_TTS_API_KEY in Netlify environment variables." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();

    // Validate input — only allow gu-IN language code and approved voices
    const allowedVoices = [
      "gu-IN-Standard-A",
      "gu-IN-Standard-B",
      "gu-IN-Wavenet-A",
      "gu-IN-Wavenet-B",
    ];

    const voiceName = body.voice?.name;
    if (voiceName && !allowedVoices.includes(voiceName)) {
      return new Response(
        JSON.stringify({ error: `Voice "${voiceName}" not allowed. Use Standard or WaveNet voices.` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Limit text length to prevent abuse (200 chars is plenty for learning words/sentences)
    const text = body.input?.text || "";
    if (text.length > 200) {
      return new Response(
        JSON.stringify({ error: "Text too long. Maximum 200 characters." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Force language to gu-IN
    const ttsBody = {
      input: { text },
      voice: {
        languageCode: "gu-IN",
        name: voiceName || "gu-IN-Standard-A",
      },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate: Math.max(0.5, Math.min(1.2, body.audioConfig?.speakingRate || 0.8)),
      },
    };

    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ttsBody),
      }
    );

    if (!response.ok) {
      const err = await response.json();
      return new Response(
        JSON.stringify({ error: err.error?.message || "Google TTS API error" }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();

    return new Response(JSON.stringify({ audioContent: data.audioContent }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=86400", // Cache audio for 24h to save API calls
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Server error: " + err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const config = {
  path: "/api/tts",
};
