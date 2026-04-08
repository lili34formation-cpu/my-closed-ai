import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const { imageUrl } = await req.json();

  const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
  if (!ANTHROPIC_API_KEY) return new Response(JSON.stringify({ error: "Clé API manquante" }), { status: 500, headers: corsHeaders });

  // Fetch image and convert to base64
  const imageRes = await fetch(imageUrl);
  const imageBlob = await imageRes.blob();
  const imageBuffer = await imageBlob.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
  const mediaType = (imageBlob.type || 'image/jpeg') as "image/jpeg" | "image/png" | "image/webp";

  const prompt = `Analyse ce vêtement sur la photo et réponds UNIQUEMENT en JSON avec ce format exact :
{
  "name": "Nom descriptif court du vêtement (ex: Jean slim, Robe fleurie, Blazer croisé)",
  "category": "une valeur parmi : Hauts, Bas, Robes & Combinaisons, Vestes & Manteaux, Chaussures, Accessoires",
  "color": "une valeur parmi : Blanc, Noir, Gris, Bleu, Rouge, Vert, Jaune, Rose, Orange, Marron, Beige, Violet, Autre",
  "style": "une valeur parmi : Casual, Professionnel, Sport, Soirée, Décontracté",
  "seasons": ["liste des saisons adaptées parmi : Printemps, Été, Automne, Hiver — mettre plusieurs si polyvalent"],
  "brand": "marque visible sur le vêtement ou vide si non visible"
}

Règles :
- Utilise EXACTEMENT les valeurs listées pour category, color, style et seasons
- Pour color, choisis la couleur dominante
- Pour seasons, mets TOUTES les saisons où ce vêtement convient (ex: un jean basique → ["Printemps","Été","Automne","Hiver"], un maillot de bain → ["Été"], un manteau chaud → ["Automne","Hiver"])
- name doit être court et précis (2-4 mots)
- Réponds UNIQUEMENT avec le JSON, rien d'autre`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: base64 },
          },
          { type: "text", text: prompt },
        ],
      }],
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
    return new Response(JSON.stringify({ error: "Erreur parsing" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
