import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const { item } = await req.json();

  const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
  if (!ANTHROPIC_API_KEY) return new Response(JSON.stringify({ error: "Clé API manquante" }), { status: 500, headers: corsHeaders });

  const itemDesc = `${item.name}${item.brand ? ` (${item.brand})` : ''} — ${item.category}, ${item.color}, style ${item.style}`;

  const prompt = `Tu es une styliste experte en upcycling, réparation et transformation de vêtements. Analyse cette pièce et propose des idées créatives.

Pièce : ${itemDesc}
Problème signalé : ${item.issue || 'usure générale'}

Réponds en JSON avec exactement ce format :
{
  "diagnostic": "Analyse courte de la pièce et de son potentiel (2 phrases max)",
  "repairs": [
    { "title": "Nom de la réparation", "description": "Comment faire en 2-3 phrases simples", "difficulty": "Facile" }
  ],
  "transformations": [
    { "title": "Nom de la transformation", "description": "Idée créative en 2-3 phrases", "difficulty": "Moyen" }
  ],
  "tip": "Un conseil pro pour prolonger la vie de ce type de vêtement"
}

Règles :
- 2 idées de réparation (couture, teinture, patch, etc.)
- 2 idées de transformation créative (crop top, sac, coussin, etc.)
- Difficulty: "Facile", "Moyen" ou "Créatif"
- Tout en français
- Concret et actionnable
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
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    return new Response(JSON.stringify({ error: `Anthropic error ${res.status}` }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const data = await res.json();
  const text = data.content?.[0]?.text || '{}';

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch {
    return new Response(JSON.stringify({ error: "Erreur parsing" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
