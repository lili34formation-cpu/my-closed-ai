import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useCloset } from "@/hooks/useCloset";
import { MOODS, PLANNING_TYPES, ClothingItem } from "@/types/closet";
import { Sparkles, Loader2, Shirt, RefreshCw, Cloud, Sun, CloudRain, Thermometer, ThumbsDown, ThumbsUp, TrendingUp, X, CheckCircle, AlertCircle, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";

interface Weather { temp: number; description: string; icon: string; }
interface Outfit { name: string; itemIds: string[]; reasoning: string; trendScore: number; }
interface SuggestionResult { outfits: Outfit[]; trendTip: string; }
interface OutfitReview { score: number; verdict: string; positives: string[]; improvements: string[]; tip: string; }

const MORPHOTYPE_LABELS: Record<string, string> = {
  taille_marquee: 'taille marquée',
  silhouette_sportive: 'silhouette sportive',
  ligne_droite: 'ligne droite',
  hanches_marquees: 'hanches marquées',
  epaules_affirmees: 'épaules affirmées',
  ronde_harmonieuse: 'ronde et harmonieuse',
};

function buildMannequinPrompt(outfit: Outfit, outfitItems: ClothingItem[], morphotype?: string | null): string {
  const pieces = outfitItems.map(i => `${i.color} ${i.name}${i.brand ? ` ${i.brand}` : ''}`).join(', ');
  const body = morphotype ? MORPHOTYPE_LABELS[morphotype] || morphotype : 'slim';
  return `fashion editorial photo, full body female mannequin with ${body} body type, wearing ${pieces}, clean white studio background, high fashion photography, professional lighting, elegant pose, photorealistic, 4k`;
}

function MannequinImage({ outfit, outfitItems, morphotype }: { outfit: Outfit; outfitItems: ClothingItem[]; morphotype?: string | null }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const prompt = buildMannequinPrompt(outfit, outfitItems, morphotype);
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=768&nologo=true`;

  if (error) return null;

  return (
    <div className="relative w-full aspect-[2/3] bg-muted rounded-xl overflow-hidden">
      {!loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border border-foreground border-t-transparent" />
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Génération du look...</p>
        </div>
      )}
      <img
        src={url}
        alt={`Look ${outfit.name}`}
        className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
      {loaded && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/80 to-transparent p-3">
          <p className="text-[9px] uppercase tracking-widest text-foreground/60">Visualisation IA</p>
        </div>
      )}
    </div>
  );
}

export default function SuggestionPage() {
  const { items, incrementWorn } = useCloset();
  const { profile } = useProfile();
  const [tab, setTab] = useState<'ia' | 'moi'>('ia');

  const [mood, setMood] = useState('');
  const [planning, setPlanning] = useState('');
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [result, setResult] = useState<SuggestionResult | null>(null);
  const [rejectedOutfits, setRejectedOutfits] = useState<Set<number>>(new Set());
  const [wornOutfit, setWornOutfit] = useState<number | null>(null);
  const [showMannequin, setShowMannequin] = useState<Set<number>>(new Set());

  const [myOutfitIds, setMyOutfitIds] = useState<string[]>([]);
  const [loadingReview, setLoadingReview] = useState(false);
  const [review, setReview] = useState<OutfitReview | null>(null);

  const getWeather = () => {
    setLoadingWeather(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude, longitude } = pos.coords;
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weathercode&timezone=auto`);
        const data = await res.json();
        const temp = Math.round(data.current.temperature_2m);
        const code = data.current.weathercode;
        let description = 'Dégagé';
        if (code >= 61) description = 'Pluvieux';
        else if (code >= 45) description = 'Nuageux';
        else if (code >= 1) description = 'Partiellement nuageux';
        setWeather({ temp, description, icon: code >= 61 ? 'rain' : code >= 1 ? 'cloud' : 'sun' });
      } catch { toast.error('Impossible de récupérer la météo'); }
      setLoadingWeather(false);
    }, () => { toast.error('Géolocalisation refusée'); setLoadingWeather(false); });
  };

  const getSuggestion = async () => {
    if (!mood || !planning) { toast.error('Sélectionnez humeur et planning'); return; }
    if (items.length === 0) { toast.error('Ajoutez des vêtements à votre dressing'); return; }
    setLoadingSuggestion(true);
    setResult(null);
    setRejectedOutfits(new Set());
    setWornOutfit(null);
    setShowMannequin(new Set());
    try {
      const { data, error } = await supabase.functions.invoke('suggest-outfit', {
        body: {
          mood, planning,
          weather: weather ? `${weather.temp}°C, ${weather.description}` : null,
          morphotype: profile?.morphotype ?? null,
          wardrobe: items.map(i => ({ id: i.id, name: i.name, category: i.category, color: i.color, style: i.style, season: i.season, favorite: i.favorite, brand: i.brand })),
        },
      });
      if (error) throw error;
      setResult(data);
    } catch (e) { console.error(e); toast.error('Erreur lors de la suggestion IA'); }
    setLoadingSuggestion(false);
  };

  const reviewMyOutfit = async () => {
    if (myOutfitIds.length < 2) { toast.error('Sélectionnez au moins 2 pièces'); return; }
    setLoadingReview(true);
    setReview(null);
    const selectedItems = myOutfitIds.map(id => items.find(i => i.id === id)).filter(Boolean) as ClothingItem[];
    try {
      const { data, error } = await supabase.functions.invoke('review-outfit', {
        body: { outfit: selectedItems.map(i => ({ name: i.name, brand: i.brand, category: i.category, color: i.color, style: i.style })) },
      });
      if (error) throw error;
      setReview(data);
    } catch (e) { console.error(e); toast.error('Erreur lors de la validation IA'); }
    setLoadingReview(false);
  };

  const toggleItem = (id: string) => { setMyOutfitIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]); setReview(null); };
  const rejectOutfit = (idx: number) => { setRejectedOutfits(prev => new Set([...prev, idx])); };
  const wearOutfit = async (idx: number, outfit: Outfit) => {
    setWornOutfit(idx);
    for (const id of outfit.itemIds) { const item = items.find(i => i.id === id); if (item) await incrementWorn(item); }
    toast.success(`Look "${outfit.name}" enregistré`);
  };
  const toggleMannequin = (idx: number) => setShowMannequin(prev => { const s = new Set(prev); s.has(idx) ? s.delete(idx) : s.add(idx); return s; });

  const getOutfitItems = (outfit: Outfit): ClothingItem[] =>
    outfit.itemIds.map(id => items.find(i => i.id === id)).filter(Boolean) as ClothingItem[];

  const visibleOutfits = result?.outfits.filter((_, i) => !rejectedOutfits.has(i)) ?? [];
  const WeatherIcon = weather?.icon === 'rain' ? CloudRain : weather?.icon === 'cloud' ? Cloud : Sun;
  const mySelectedItems = myOutfitIds.map(id => items.find(i => i.id === id)).filter(Boolean) as ClothingItem[];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="pt-2">
          <h1 className="font-display text-5xl font-light text-foreground tracking-wide">Tenues</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mt-2">Suggestion IA · Mannequin virtuel</p>
        </div>

        {/* Tabs */}
        <div className="flex border border-border rounded-xl overflow-hidden">
          <button onClick={() => setTab('ia')}
            className={`flex-1 py-2.5 text-[10px] uppercase tracking-widest transition-all ${tab === 'ia' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}>
            <Sparkles className="h-3.5 w-3.5 inline mr-1.5" />Suggestion IA
          </button>
          <button onClick={() => setTab('moi')}
            className={`flex-1 py-2.5 text-[10px] uppercase tracking-widest transition-all border-l border-border ${tab === 'moi' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}>
            <Shirt className="h-3.5 w-3.5 inline mr-1.5" />Ma tenue
          </button>
        </div>

        {/* ===== ONGLET IA ===== */}
        {tab === 'ia' && (
          <div className="space-y-6">
            {!profile?.morphotype && (
              <a href="/profil" className="flex items-center gap-3 p-3 border border-border rounded-xl text-xs text-muted-foreground hover:border-foreground/20 transition-colors">
                <User className="h-3.5 w-3.5 shrink-0" />
                <span className="font-light">Renseignez votre silhouette dans votre profil pour des suggestions personnalisées →</span>
              </a>
            )}

            {/* Météo */}
            <div className="border border-border rounded-xl p-4">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Météo</p>
              {weather ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <WeatherIcon className="h-6 w-6 text-foreground/60 stroke-[1]" />
                    <div>
                      <p className="font-display text-3xl font-light text-foreground">{weather.temp}°</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{weather.description}</p>
                    </div>
                  </div>
                  <button onClick={getWeather} className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground flex items-center gap-1.5">
                    <RefreshCw className="h-3 w-3" />Actualiser
                  </button>
                </div>
              ) : (
                <button onClick={getWeather} disabled={loadingWeather}
                  className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-border rounded-lg text-muted-foreground text-[10px] uppercase tracking-widest hover:border-foreground/20 transition-colors">
                  {loadingWeather ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Cloud className="h-3.5 w-3.5 stroke-[1]" />}
                  Localiser ma météo
                </button>
              )}
            </div>

            {/* Humeur */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Humeur</p>
              <div className="grid grid-cols-2 gap-2">
                {MOODS.map(m => (
                  <button key={m.value} onClick={() => setMood(m.value)}
                    className={`flex items-center p-3 border rounded-xl transition-all text-left ${mood === m.value ? 'border-foreground/40 bg-accent' : 'border-border hover:border-foreground/20'}`}>
                    <span className="text-xs font-light text-foreground">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Planning */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Planning</p>
              <div className="grid grid-cols-2 gap-2">
                {PLANNING_TYPES.map(p => (
                  <button key={p.value} onClick={() => setPlanning(p.value)}
                    className={`flex items-center p-3 border rounded-xl transition-all text-left ${planning === p.value ? 'border-foreground/40 bg-accent' : 'border-border hover:border-foreground/20'}`}>
                    <span className="text-xs font-light text-foreground">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* CTA */}
            <button onClick={getSuggestion} disabled={loadingSuggestion || !mood || !planning}
              className="w-full h-12 bg-foreground text-background text-[10px] uppercase tracking-[0.2em] hover:bg-foreground/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 rounded-xl">
              {loadingSuggestion ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Analyse en cours...</> : <><Sparkles className="h-3.5 w-3.5" />Générer mes looks</>}
            </button>

            {/* Résultats */}
            {result && (
              <div className="space-y-6">
                {result.trendTip && (
                  <div className="flex items-start gap-3 p-4 border border-border rounded-xl">
                    <TrendingUp className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0 stroke-[1.5]" />
                    <p className="text-xs text-foreground/80 font-light italic">{result.trendTip}</p>
                  </div>
                )}

                {visibleOutfits.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-sm text-muted-foreground font-light">Tous les looks ont été refusés</p>
                    <button onClick={getSuggestion} className="mt-4 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground border border-border px-4 py-2 rounded-xl transition-colors">
                      Nouvelles suggestions
                    </button>
                  </div>
                ) : (
                  result.outfits.map((outfit, idx) => {
                    if (rejectedOutfits.has(idx)) return null;
                    const outfitItems = getOutfitItems(outfit);
                    const isWorn = wornOutfit === idx;
                    const mannequinVisible = showMannequin.has(idx);

                    return (
                      <div key={idx} className={`border rounded-2xl overflow-hidden transition-all ${isWorn ? 'border-foreground/30' : 'border-border'}`}>
                        {/* Header */}
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <h3 className="font-display text-xl font-light text-foreground">{outfit.name}</h3>
                              <p className="text-[10px] text-muted-foreground italic mt-1 font-light leading-relaxed">{outfit.reasoning}</p>
                            </div>
                            <span className={`shrink-0 text-[10px] uppercase tracking-widest px-2.5 py-1 border rounded-full ${
                              outfit.trendScore >= 80 ? 'border-foreground/30 text-foreground' :
                              outfit.trendScore >= 60 ? 'border-border text-muted-foreground' : 'border-border text-muted-foreground/60'
                            }`}>
                              {outfit.trendScore}%
                            </span>
                          </div>
                        </div>

                        {/* Mannequin virtuel */}
                        <div className="px-4 pb-2">
                          <button onClick={() => toggleMannequin(idx)}
                            className={`w-full flex items-center justify-center gap-2 py-2.5 border rounded-xl text-[10px] uppercase tracking-widest transition-all ${
                              mannequinVisible ? 'border-foreground/30 text-foreground bg-accent' : 'border-border text-muted-foreground hover:border-foreground/20'
                            }`}>
                            <User className="h-3.5 w-3.5 stroke-[1.5]" />
                            {mannequinVisible ? 'Masquer le mannequin' : 'Voir sur mannequin'}
                          </button>
                        </div>

                        {mannequinVisible && (
                          <div className="px-4 pb-3">
                            <MannequinImage outfit={outfit} outfitItems={outfitItems} morphotype={profile?.morphotype} />
                          </div>
                        )}

                        {/* Photos vêtements */}
                        {outfitItems.length > 0 && (
                          <div className="px-4 pb-3">
                            <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-2">Pièces</p>
                            <div className={`grid gap-2 ${outfitItems.length === 1 ? 'grid-cols-1' : outfitItems.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                              {outfitItems.map(item => (
                                <div key={item.id} className="relative rounded-xl overflow-hidden aspect-square">
                                  {item.image_url ? (
                                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full bg-muted flex items-center justify-center">
                                      <Shirt className="h-8 w-8 text-muted-foreground/20 stroke-[1]" />
                                    </div>
                                  )}
                                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/80 to-transparent p-2">
                                    <p className="text-[10px] text-white/80 truncate">{item.name}</p>
                                    {item.brand && <p className="text-[9px] gold truncate">{item.brand}</p>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="px-4 pb-4">
                          {!isWorn ? (
                            <div className="flex gap-2">
                              <button onClick={() => rejectOutfit(idx)}
                                className="flex-1 flex items-center justify-center gap-1.5 py-3 border border-border text-muted-foreground text-[10px] uppercase tracking-widest hover:border-destructive/40 hover:text-destructive transition-colors rounded-xl">
                                <ThumbsDown className="h-3.5 w-3.5 stroke-[1.5]" />Passer
                              </button>
                              <button onClick={() => wearOutfit(idx, outfit)}
                                className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-foreground text-background text-[10px] uppercase tracking-widest hover:bg-foreground/90 transition-colors rounded-xl">
                                <ThumbsUp className="h-3.5 w-3.5 stroke-[1.5]" />Je le porte
                              </button>
                            </div>
                          ) : (
                            <p className="text-center text-[10px] uppercase tracking-widest text-foreground/60 py-2">✓ Look du jour sélectionné</p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                {visibleOutfits.length > 0 && wornOutfit === null && (
                  <button onClick={getSuggestion} className="w-full py-3 border border-border text-muted-foreground text-[10px] uppercase tracking-widest hover:border-foreground/20 hover:text-foreground transition-colors rounded-xl flex items-center justify-center gap-2">
                    <RefreshCw className="h-3.5 w-3.5 stroke-[1.5]" />Nouvelles suggestions
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===== ONGLET MA TENUE ===== */}
        {tab === 'moi' && (
          <div className="space-y-6">
            <div className="border border-border rounded-xl p-4">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Comment ça fonctionne</p>
              <p className="text-xs text-foreground/70 font-light leading-relaxed">Sélectionnez vos pièces, l'IA analyse la cohérence de votre tenue et vous donne un score tendance avec des conseils styliste.</p>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm font-light">Ajoutez des vêtements à votre dressing</div>
            ) : (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
                  Vos pièces {myOutfitIds.length > 0 && <span className="text-foreground">· {myOutfitIds.length} sélectionnée{myOutfitIds.length > 1 ? 's' : ''}</span>}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {items.map(item => {
                    const selected = myOutfitIds.includes(item.id);
                    return (
                      <button key={item.id} onClick={() => toggleItem(item.id)}
                        className={`relative rounded-xl overflow-hidden border-2 transition-all ${selected ? 'border-foreground' : 'border-transparent'}`}>
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-full aspect-square object-cover" />
                        ) : (
                          <div className="w-full aspect-square bg-muted flex items-center justify-center">
                            <Shirt className="h-7 w-7 text-muted-foreground/20 stroke-[1]" />
                          </div>
                        )}
                        {selected && (
                          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-foreground flex items-center justify-center">
                            <CheckCircle className="h-3.5 w-3.5 text-background" />
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/80 to-transparent p-1.5">
                          <p className="text-[10px] text-white/80 truncate">{item.name}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {mySelectedItems.length > 0 && (
              <div className="border border-border rounded-xl p-3">
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-2">Ma sélection</p>
                <div className="flex gap-2 flex-wrap">
                  {mySelectedItems.map(item => (
                    <div key={item.id} className="flex items-center gap-1.5 border border-border px-2.5 py-1 rounded-full">
                      <span className="text-[10px] text-foreground">{item.name}</span>
                      <button onClick={() => toggleItem(item.id)} className="text-muted-foreground hover:text-foreground">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={reviewMyOutfit} disabled={loadingReview || myOutfitIds.length < 2}
              className="w-full h-12 bg-foreground text-background text-[10px] uppercase tracking-[0.2em] hover:bg-foreground/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 rounded-xl">
              {loadingReview ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Analyse...</> : <><Sparkles className="h-3.5 w-3.5" />Analyser mon look</>}
            </button>

            {review && (
              <div className="space-y-4">
                <div className={`border rounded-2xl p-5 ${review.score >= 70 ? 'border-foreground/30' : 'border-border'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Score tendance</p>
                      <p className="font-display text-5xl font-light text-foreground mt-1">{review.score}<span className="text-2xl text-muted-foreground">%</span></p>
                    </div>
                    <div className={`w-12 h-12 rounded-full border flex items-center justify-center ${review.score >= 70 ? 'border-foreground/30' : 'border-border'}`}>
                      {review.score >= 70 ? <CheckCircle className="h-5 w-5 text-foreground stroke-[1.5]" /> : <AlertCircle className="h-5 w-5 text-muted-foreground stroke-[1.5]" />}
                    </div>
                  </div>
                  <p className="text-sm text-foreground font-light italic">"{review.verdict}"</p>
                </div>

                {review.positives?.length > 0 && (
                  <div className="border border-border rounded-xl p-4">
                    <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-2">Points forts</p>
                    <ul className="space-y-1.5">
                      {review.positives.map((p, i) => <li key={i} className="text-xs text-foreground font-light flex gap-2"><span className="text-foreground/40">—</span>{p}</li>)}
                    </ul>
                  </div>
                )}

                {review.improvements?.length > 0 && (
                  <div className="border border-border rounded-xl p-4">
                    <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-2">À améliorer</p>
                    <ul className="space-y-1.5">
                      {review.improvements.map((imp, i) => <li key={i} className="text-xs text-foreground font-light flex gap-2"><span className="text-foreground/40">—</span>{imp}</li>)}
                    </ul>
                  </div>
                )}

                {review.tip && (
                  <div className="border border-border rounded-xl p-4 flex gap-3">
                    <TrendingUp className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0 stroke-[1.5]" />
                    <p className="text-xs text-foreground/80 font-light italic">{review.tip}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
