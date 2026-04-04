import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useCloset } from "@/hooks/useCloset";
import { Button } from "@/components/ui/button";
import { MOODS, PLANNING_TYPES, ClothingItem } from "@/types/closet";
import { Sparkles, Loader2, Shirt, RefreshCw, Cloud, Sun, CloudRain, Thermometer, ThumbsDown, ThumbsUp, TrendingUp, Plus, X, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Weather { temp: number; description: string; icon: string; }
interface Outfit { name: string; itemIds: string[]; reasoning: string; trendScore: number; }
interface SuggestionResult { outfits: Outfit[]; trendTip: string; }
interface OutfitReview { score: number; verdict: string; positives: string[]; improvements: string[]; tip: string; }

export default function SuggestionPage() {
  const { items, incrementWorn } = useCloset();
  const [tab, setTab] = useState<'ia' | 'moi'>('ia');

  // Onglet IA
  const [mood, setMood] = useState('');
  const [planning, setPlanning] = useState('');
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [result, setResult] = useState<SuggestionResult | null>(null);
  const [rejectedOutfits, setRejectedOutfits] = useState<Set<number>>(new Set());
  const [wornOutfit, setWornOutfit] = useState<number | null>(null);

  // Onglet Ma tenue
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
    if (!mood || !planning) { toast.error('Choisis ton humeur et ton planning'); return; }
    if (items.length === 0) { toast.error('Ajoute des vêtements à ton dressing d\'abord'); return; }
    setLoadingSuggestion(true);
    setResult(null);
    setRejectedOutfits(new Set());
    setWornOutfit(null);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-outfit', {
        body: {
          mood, planning,
          weather: weather ? `${weather.temp}°C, ${weather.description}` : null,
          wardrobe: items.map(i => ({ id: i.id, name: i.name, category: i.category, color: i.color, style: i.style, season: i.season, favorite: i.favorite, brand: i.brand })),
        },
      });
      if (error) throw error;
      setResult(data);
    } catch (e) { console.error(e); toast.error('Erreur lors de la suggestion IA'); }
    setLoadingSuggestion(false);
  };

  const reviewMyOutfit = async () => {
    if (myOutfitIds.length < 2) { toast.error('Sélectionne au moins 2 pièces'); return; }
    setLoadingReview(true);
    setReview(null);
    const selectedItems = myOutfitIds.map(id => items.find(i => i.id === id)).filter(Boolean) as ClothingItem[];
    try {
      const { data, error } = await supabase.functions.invoke('review-outfit', {
        body: {
          outfit: selectedItems.map(i => ({ name: i.name, brand: i.brand, category: i.category, color: i.color, style: i.style })),
        },
      });
      if (error) throw error;
      setReview(data);
    } catch (e) { console.error(e); toast.error('Erreur lors de la validation IA'); }
    setLoadingReview(false);
  };

  const toggleItem = (id: string) => {
    setMyOutfitIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    setReview(null);
  };

  const rejectOutfit = (idx: number) => {
    setRejectedOutfits(prev => new Set([...prev, idx]));
    const remaining = result!.outfits.filter((_, i) => i !== idx && !rejectedOutfits.has(i));
    if (remaining.length === 0) toast.info('Toutes les tenues refusées ! Relance une suggestion.');
  };

  const wearOutfit = async (idx: number, outfit: Outfit) => {
    setWornOutfit(idx);
    for (const id of outfit.itemIds) {
      const item = items.find(i => i.id === id);
      if (item) await incrementWorn(item);
    }
    toast.success(`"${outfit.name}" enregistrée 👗`);
  };

  const getOutfitItems = (outfit: Outfit): ClothingItem[] =>
    outfit.itemIds.map(id => items.find(i => i.id === id)).filter(Boolean) as ClothingItem[];

  const visibleOutfits = result?.outfits.filter((_, i) => !rejectedOutfits.has(i)) ?? [];
  const WeatherIcon = weather?.icon === 'rain' ? CloudRain : weather?.icon === 'cloud' ? Cloud : Sun;
  const mySelectedItems = myOutfitIds.map(id => items.find(i => i.id === id)).filter(Boolean) as ClothingItem[];

  return (
    <AppLayout>
      <div className="space-y-5">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Tenues</h1>
          <p className="text-muted-foreground text-sm mt-1">Suggestion IA ou valide ta propre tenue</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-card border border-border rounded-2xl">
          <button
            onClick={() => setTab('ia')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === 'ia' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow' : 'text-muted-foreground'}`}
          >
            <Sparkles className="h-4 w-4 inline mr-1.5" />Suggestion IA
          </button>
          <button
            onClick={() => setTab('moi')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === 'moi' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow' : 'text-muted-foreground'}`}
          >
            <Shirt className="h-4 w-4 inline mr-1.5" />Ma tenue
          </button>
        </div>

        {/* ===== ONGLET IA ===== */}
        {tab === 'ia' && (
          <div className="space-y-5">
            {/* Météo */}
            <div className="bg-gradient-to-br from-blue-900/40 to-indigo-900/20 rounded-2xl p-4 border border-blue-800/30">
              <div className="flex items-center gap-2 mb-3">
                <Thermometer className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-semibold text-blue-300">Météo du jour</span>
              </div>
              {weather ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <WeatherIcon className="h-8 w-8 text-blue-300" />
                    <div>
                      <p className="text-3xl font-bold text-white">{weather.temp}°C</p>
                      <p className="text-xs text-blue-300">{weather.description}</p>
                    </div>
                  </div>
                  <button onClick={getWeather} className="ml-auto glass text-xs text-muted-foreground px-3 py-1.5 rounded-full flex items-center gap-1.5">
                    <RefreshCw className="h-3 w-3" />Actualiser
                  </button>
                </div>
              ) : (
                <button onClick={getWeather} disabled={loadingWeather} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-blue-800/40 text-blue-300 text-sm hover:bg-blue-900/20 transition-colors">
                  {loadingWeather ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cloud className="h-4 w-4" />}
                  Récupérer ma météo
                </button>
              )}
            </div>

            {/* Humeur */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-3">Comment tu te sens ? ✨</p>
              <div className="grid grid-cols-2 gap-2">
                {MOODS.map(m => (
                  <button key={m.value} onClick={() => setMood(m.value)}
                    className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left ${mood === m.value ? 'border-primary bg-accent text-foreground' : 'border-border bg-card text-muted-foreground hover:border-primary/40'}`}>
                    <span className="text-2xl">{m.emoji}</span>
                    <span className="text-sm font-medium">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Planning */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-3">Ta journée 📅</p>
              <div className="grid grid-cols-2 gap-2">
                {PLANNING_TYPES.map(p => (
                  <button key={p.value} onClick={() => setPlanning(p.value)}
                    className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left ${planning === p.value ? 'border-primary bg-accent text-foreground' : 'border-border bg-card text-muted-foreground hover:border-primary/40'}`}>
                    <span className="text-2xl">{p.emoji}</span>
                    <span className="text-sm font-medium">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Bouton IA */}
            <button onClick={getSuggestion} disabled={loadingSuggestion || !mood || !planning}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-purple-900/40 transition-all">
              {loadingSuggestion ? <><Loader2 className="h-5 w-5 animate-spin" />L'IA choisit tes tenues...</> : <><Sparkles className="h-5 w-5" />Suggère mes tenues !</>}
            </button>

            {/* Résultats */}
            {result && (
              <div className="space-y-4">
                {result.trendTip && (
                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-br from-purple-900/40 to-pink-900/20 border border-purple-800/30">
                    <TrendingUp className="h-4 w-4 text-purple-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-purple-200 font-medium">{result.trendTip}</p>
                  </div>
                )}
                {visibleOutfits.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-muted-foreground mb-4">Tu as refusé toutes les tenues !</p>
                    <button onClick={getSuggestion} className="glass text-foreground px-6 py-3 rounded-xl text-sm font-medium">
                      <RefreshCw className="h-4 w-4 inline mr-2" />Nouvelles suggestions
                    </button>
                  </div>
                ) : (
                  result.outfits.map((outfit, idx) => {
                    if (rejectedOutfits.has(idx)) return null;
                    const outfitItems = getOutfitItems(outfit);
                    const isWorn = wornOutfit === idx;
                    return (
                      <div key={idx} className={`rounded-2xl border overflow-hidden transition-all ${isWorn ? 'border-emerald-500/50 bg-emerald-900/10' : 'border-border bg-card'}`}>
                        <div className="p-4 border-b border-border/50">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-primary" />{outfit.name}
                              </h3>
                              <p className="text-xs text-muted-foreground italic mt-1">"{outfit.reasoning}"</p>
                            </div>
                            <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${outfit.trendScore >= 80 ? 'bg-purple-900/60 text-purple-300' : outfit.trendScore >= 60 ? 'bg-blue-900/60 text-blue-300' : 'bg-card text-muted-foreground'}`}>
                              🔥 {outfit.trendScore}%
                            </span>
                          </div>
                        </div>
                        {outfitItems.length > 0 && (
                          <div className="p-4">
                            <div className={`grid gap-2 ${outfitItems.length === 1 ? 'grid-cols-1' : outfitItems.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                              {outfitItems.map(item => (
                                <div key={item.id} className="relative rounded-xl overflow-hidden">
                                  {item.image_url ? (
                                    <img src={item.image_url} alt={item.name} className="w-full aspect-square object-cover" />
                                  ) : (
                                    <div className="w-full aspect-square bg-gradient-to-br from-purple-900/40 to-pink-900/20 flex items-center justify-center">
                                      <Shirt className="h-10 w-10 text-purple-400/40" />
                                    </div>
                                  )}
                                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                                    <p className="text-[11px] text-white font-medium truncate">{item.name}</p>
                                    {item.brand && <p className="text-[10px] text-white/60">{item.brand}</p>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="px-4 pb-4">
                          {!isWorn ? (
                            <div className="flex gap-2">
                              <button onClick={() => rejectOutfit(idx)} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-red-800/40 text-red-400 text-sm font-semibold hover:bg-red-900/20 transition-colors">
                                <ThumbsDown className="h-4 w-4" />Pas celle-là
                              </button>
                              <button onClick={() => wearOutfit(idx, outfit)} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors">
                                <ThumbsUp className="h-4 w-4" />Je la porte !
                              </button>
                            </div>
                          ) : (
                            <div className="text-center py-2">
                              <p className="text-emerald-400 font-semibold text-sm">✅ Tenue du jour — bon look !</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                {visibleOutfits.length > 0 && wornOutfit === null && (
                  <button onClick={getSuggestion} className="w-full glass text-muted-foreground py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2">
                    <RefreshCw className="h-4 w-4" />Nouvelles suggestions
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===== ONGLET MA TENUE ===== */}
        {tab === 'moi' && (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-900/30 to-pink-900/10 border border-purple-800/20">
              <p className="text-sm font-semibold text-foreground">Comment ça marche ?</p>
              <p className="text-xs text-muted-foreground mt-1">Sélectionne les pièces que tu veux porter, puis l'IA analyse si ta tenue est tendance et te donne des conseils.</p>
            </div>

            {/* Sélection pièces */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-3">
                Sélectionne tes pièces{myOutfitIds.length > 0 && <span className="text-primary ml-2">({myOutfitIds.length} choisie{myOutfitIds.length > 1 ? 's' : ''})</span>}
              </p>
              {items.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  Ajoute des vêtements à ton dressing d'abord
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {items.map(item => {
                    const selected = myOutfitIds.includes(item.id);
                    return (
                      <button key={item.id} onClick={() => toggleItem(item.id)}
                        className={`relative rounded-2xl overflow-hidden border-2 transition-all ${selected ? 'border-primary' : 'border-transparent'}`}>
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-full aspect-square object-cover" />
                        ) : (
                          <div className="w-full aspect-square bg-card flex items-center justify-center">
                            <Shirt className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        {selected && (
                          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <CheckCircle className="h-3.5 w-3.5 text-white" />
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
                          <p className="text-[10px] text-white font-medium truncate">{item.name}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Aperçu tenue sélectionnée */}
            {mySelectedItems.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-4">
                <p className="text-sm font-semibold text-foreground mb-3">Ta tenue</p>
                <div className="flex gap-2 flex-wrap">
                  {mySelectedItems.map(item => (
                    <div key={item.id} className="flex items-center gap-1.5 bg-secondary px-2.5 py-1.5 rounded-full">
                      <span className="text-xs font-medium text-foreground truncate max-w-[80px]">{item.name}</span>
                      <button onClick={() => toggleItem(item.id)} className="text-muted-foreground hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bouton validation */}
            <button onClick={reviewMyOutfit} disabled={loadingReview || myOutfitIds.length < 2}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-purple-900/40 transition-all">
              {loadingReview ? <><Loader2 className="h-5 w-5 animate-spin" />L'IA analyse ta tenue...</> : <><Sparkles className="h-5 w-5" />Valider avec l'IA</>}
            </button>

            {/* Résultat validation */}
            {review && (
              <div className="space-y-3">
                {/* Score */}
                <div className={`rounded-2xl p-5 border ${review.score >= 70 ? 'bg-emerald-900/20 border-emerald-800/30' : review.score >= 50 ? 'bg-amber-900/20 border-amber-800/30' : 'bg-red-900/20 border-red-800/30'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Score tendance</p>
                      <p className={`text-5xl font-display font-bold mt-1 ${review.score >= 70 ? 'text-emerald-400' : review.score >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                        {review.score}%
                      </p>
                    </div>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${review.score >= 70 ? 'bg-emerald-900/40' : review.score >= 50 ? 'bg-amber-900/40' : 'bg-red-900/40'}`}>
                      {review.score >= 70 ? <CheckCircle className="h-8 w-8 text-emerald-400" /> : <AlertCircle className="h-8 w-8 text-amber-400" />}
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-foreground italic">"{review.verdict}"</p>
                </div>

                {/* Points positifs */}
                {review.positives?.length > 0 && (
                  <div className="bg-card border border-border rounded-2xl p-4">
                    <p className="text-sm font-semibold text-emerald-400 mb-2">✅ Ce qui fonctionne</p>
                    <ul className="space-y-1.5">
                      {review.positives.map((p, i) => (
                        <li key={i} className="text-sm text-foreground flex items-start gap-2">
                          <span className="text-emerald-500 mt-0.5">•</span>{p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Améliorations */}
                {review.improvements?.length > 0 && (
                  <div className="bg-card border border-border rounded-2xl p-4">
                    <p className="text-sm font-semibold text-amber-400 mb-2">💡 À améliorer</p>
                    <ul className="space-y-1.5">
                      {review.improvements.map((imp, i) => (
                        <li key={i} className="text-sm text-foreground flex items-start gap-2">
                          <span className="text-amber-500 mt-0.5">•</span>{imp}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Conseil mode */}
                {review.tip && (
                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-br from-purple-900/40 to-pink-900/20 border border-purple-800/30">
                    <TrendingUp className="h-4 w-4 text-purple-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-purple-200 font-medium">{review.tip}</p>
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
