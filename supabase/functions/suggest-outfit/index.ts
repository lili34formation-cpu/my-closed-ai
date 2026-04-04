import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const { mood, planning, weather, wardrobe } = await req.json();

  const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
  if (!ANTHROPIC_API_KEY) return new Response(JSON.stringify({ error: "Clé API manquante" }), { headers: corsHeaders });

  const wardrobeText = wardrobe.map((i: any) =>
    `- ID:${i.id} | ${i.name} | ${i.category} | ${i.color} | ${i.style} | ${i.season}${i.favorite ? ' ⭐' : ''}`
  ).join('\n');

  const prompt = `Tu es un assistant mode expert. Tu dois proposer une tenue cohérente à partir du dressing suivant.

Contexte :
- Humeur : ${mood}
- Planning : ${planning}
- Météo : ${weather || 'non renseignée'}

Dressing disponible :
${wardrobeText}

Réponds en JSON avec exactement ce format :
{
  "itemIds": ["id1", "id2", "id3"],
  "reasoning": "Explication courte et sympathique en français (max 2 phrases)"
}

Règles :
- Choisis 2 à 4 vêtements qui se combinent bien
- Adapte au style de la journée et à la météo
- Préfère les favoris si possible
- Assure la cohérence des couleurs
- Réponds UNIQUEMENT avec le JSON, sans texte avant ou après`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await res.json();
  const text = data.content?.[0]?.text || '{}';

  try {
    const parsed = JSON.parse(text);
    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch {
    return new Response(JSON.stringify({ error: "Erreur parsing IA", itemIds: [], reasoning: "Je n'ai pas pu générer une suggestion. Réessaye !" }), { headers: corsHeaders });
  }
});
