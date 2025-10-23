import { serve } from "https://deno.land/std@0.181.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const prompt = await req.json();

    const bodyRequest = {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 64,
        topP: 0.95,
        maxOutputTokens: 10240,
        responseMimeType: "text/plain",
      },
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyRequest),
      }
    );

    const data = await response.json();
    console.log("Parsed Gemini response JSON:", data);

    const contentObj = data?.candidates?.[0]?.content;
    const body =
      contentObj?.parts?.[0]?.text ||
      contentObj?.text ||
      contentObj?.thoughts?.[0]?.text ||
      "";

    return new Response(JSON.stringify({ body }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error caught:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate suggestion" }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
