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

  const currentMonth = new Date().getMonth() + 1;
  const season = currentMonth >= 3 && currentMonth <= 5 ? 'Printemps 2026' :
                 currentMonth >= 6 && currentMonth <= 8 ? 'Été 2026' :
                 currentMonth >= 9 && currentMonth <= 11 ? 'Automne 2026' : 'Hiver 2025-2026';

  const prompt = `Tu es un styliste expert en mode. Tu dois proposer 3 tenues différentes et cohérentes à partir du dressing fourni, en tenant compte des tendances mode actuelles.

Contexte :
- Humeur : ${mood}
- Planning : ${planning}
- Météo : ${weather || 'non renseignée'}
- Saison actuelle : ${season}

Tendances mode ${season} à intégrer si possible :
- Couleurs tendance : tons terreux, beige, camel, vert olive, bleu cobalt, rouge vif
- Styles tendance : oversize chic, layering, minimalisme élégant, sport-luxe
- Pièces clés : blazer structuré, jean wide leg, sneakers premium, trench coat

Dressing disponible :
${wardrobeText}

Réponds en JSON avec exactement ce format :
{
  "outfits": [
    {
      "name": "Nom court et inspirant de la tenue",
      "itemIds": ["id1", "id2", "id3"],
      "reasoning": "Explication courte et enthousiaste en français (1-2 phrases)",
      "trendScore": 85
    },
    {
      "name": "Nom court et inspirant de la tenue",
      "itemIds": ["id1", "id2"],
      "reasoning": "Explication courte et enthousiaste en français (1-2 phrases)",
      "trendScore": 70
    },
    {
      "name": "Nom court et inspirant de la tenue",
      "itemIds": ["id1", "id2", "id3"],
      "reasoning": "Explication courte et enthousiaste en français (1-2 phrases)",
      "trendScore": 60
    }
  ],
  "trendTip": "Un conseil mode tendance du moment en 1 phrase"
}

Règles :
- Propose 3 tenues DIFFÉRENTES avec des pièces différentes
- Chaque tenue contient 2 à 4 vêtements qui se combinent bien
- trendScore = score de tendance de 0 à 100
- Adapte au style de la journée, à la météo et aux tendances
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
      model: "claude-3-haiku-20240307",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error("Anthropic API error:", res.status, errBody);
    return new Response(JSON.stringify({ error: `Anthropic error ${res.status}: ${errBody}` }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const data = await res.json();
  const text = data.content?.[0]?.text || '{}';

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch {
    console.error("Parse error, raw text:", text);
    return new Response(JSON.stringify({ error: "Erreur parsing IA", raw: text, outfits: [], trendTip: "" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
