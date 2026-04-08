import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
  if (!ANTHROPIC_API_KEY) return new Response(JSON.stringify({ error: "Clé API manquante" }), { status: 500, headers: corsHeaders });

  const { imageBase64, mediaType, wardrobe } = await req.json();

  // Step 1: analyze the style from the photo
  const analysisPrompt = `Tu es un styliste expert. Analyse le style vestimentaire de cette personne sur la photo et décris-le de façon précise et actionnable.

Réponds UNIQUEMENT en JSON :
{
  "style_name": "Nom du style en 2-3 mots (ex: Minimal chic, Boho romantique, Street casual...)",
  "description": "Description du style en 1-2 phrases",
  "key_elements": ["élément 1", "élément 2", "élément 3", "élément 4"],
  "color_palette": ["couleur 1", "couleur 2", "couleur 3"],
  "silhouettes": ["silhouette 1", "silhouette 2"],
  "vibe": "ambiance générale en quelques mots"
}`;

  const analysisRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
          { type: "text", text: analysisPrompt },
        ],
      }],
    }),
  });

  if (!analysisRes.ok) {
    return new Response(JSON.stringify({ error: "Erreur analyse photo" }), { status: 500, headers: corsHeaders });
  }

  const analysisData = await analysisRes.json();
  const analysisText = analysisData.content?.[0]?.text || '{}';
  let styleProfile: any = {};
  try {
    const match = analysisText.match(/\{[\s\S]*\}/);
    styleProfile = JSON.parse(match ? match[0] : analysisText);
  } catch {
    return new Response(JSON.stringify({ error: "Erreur parsing style" }), { status: 500, headers: corsHeaders });
  }

  // Step 2: compose outfit from wardrobe in that style
  const outfitPrompt = `Tu es un styliste expert. Voici le profil de style analysé :
- Style : ${styleProfile.style_name}
- Description : ${styleProfile.description}
- Éléments clés : ${styleProfile.key_elements?.join(', ')}
- Palette de couleurs : ${styleProfile.color_palette?.join(', ')}
- Silhouettes : ${styleProfile.silhouettes?.join(', ')}
- Ambiance : ${styleProfile.vibe}

Voici le dressing disponible :
${JSON.stringify(wardrobe)}

Compose 1 à 2 tenues qui s'inspirent le plus fidèlement possible de ce style, en utilisant UNIQUEMENT les pièces du dressing.
Si certaines pièces manquent pour reproduire le style, mentionne-le dans les conseils.

Réponds UNIQUEMENT en JSON :
{
  "outfits": [
    {
      "name": "Nom du look",
      "itemIds": ["id1", "id2", "id3"],
      "reasoning": "Pourquoi ces pièces correspondent au style analysé",
      "missing": "Ce qui manque dans le dressing pour coller parfaitement au style (ou vide si rien)"
    }
  ],
  "style_tip": "Conseil styliste pour adopter ce style avec ce dressing"
}`;

  const outfitRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: outfitPrompt }],
    }),
  });

  const outfitData = await outfitRes.json();
  const outfitText = outfitData.content?.[0]?.text || '{}';
  let outfitResult: any = {};
  try {
    const match = outfitText.match(/\{[\s\S]*\}/);
    outfitResult = JSON.parse(match ? match[0] : outfitText);
  } catch {
    return new Response(JSON.stringify({ error: "Erreur parsing tenues" }), { status: 500, headers: corsHeaders });
  }

  return new Response(
    JSON.stringify({ styleProfile, ...outfitResult }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
