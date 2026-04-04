import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const { outfit } = await req.json();

  const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
  if (!ANTHROPIC_API_KEY) return new Response(JSON.stringify({ error: "Clé API manquante" }), { status: 500, headers: corsHeaders });

  const currentMonth = new Date().getMonth() + 1;
  const season = currentMonth >= 3 && currentMonth <= 5 ? 'Printemps 2026' :
                 currentMonth >= 6 && currentMonth <= 8 ? 'Été 2026' :
                 currentMonth >= 9 && currentMonth <= 11 ? 'Automne 2026' : 'Hiver 2025-2026';

  const outfitText = outfit.map((i: any) =>
    `- ${i.name}${i.brand ? ` (${i.brand})` : ''} | ${i.category} | ${i.color} | ${i.style}`
  ).join('\n');

  const prompt = `Tu es un styliste expert en mode et tendances. Analyse cette tenue et donne un avis professionnel.

Saison actuelle : ${season}
Tendances actuelles : oversize chic, layering, minimalisme élégant, sport-luxe, tons terreux, beige, olive, cobalt.

Tenue à analyser :
${outfitText}

Réponds en JSON avec exactement ce format :
{
  "score": 75,
  "verdict": "Une phrase courte et percutante sur la tenue (max 15 mots)",
  "positives": ["Point positif 1", "Point positif 2"],
  "improvements": ["Conseil 1 pour améliorer", "Conseil 2"],
  "tip": "Un conseil mode tendance du moment en lien avec cette tenue"
}

Règles :
- score de 0 à 100 (tendance, cohérence couleurs, style)
- 2 à 3 points positifs
- 1 à 2 améliorations concrètes
- Sois enthousiaste mais honnête
- Tout en français
- Réponds UNIQUEMENT avec le JSON`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    return new Response(JSON.stringify({ error: `Anthropic error ${res.status}` }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const data = await res.json();
  const text = data.content?.[0]?.text || '{}';

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch {
    return new Response(JSON.stringify({ error: "Erreur parsing", score: 0, verdict: "", positives: [], improvements: [], tip: "" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
