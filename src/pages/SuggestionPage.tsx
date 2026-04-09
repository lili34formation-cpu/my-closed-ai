import { useState, useRef } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useCloset } from "@/hooks/useCloset";
import { MOODS, PLANNING_TYPES, ClothingItem } from "@/types/closet";
import { Sparkles, Loader2, Shirt, RefreshCw, Cloud, Sun, CloudRain, Thermometer, ThumbsDown, ThumbsUp, TrendingUp, X, CheckCircle, AlertCircle, User, Snowflake, Camera, Upload, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";
import { useWeather } from "@/hooks/useWeather";
import { useOutfitHistory } from "@/hooks/useOutfitHistory";

interface Weather { temp: number; description: string; icon: string; }
interface Outfit { name: string; itemIds: string[]; reasoning: string; trendScore: number; }
interface SuggestionResult { outfits: Outfit[]; trendTip: string; }
interface OutfitReview { score: number; verdict: string; positives: string[]; improvements: string[]; tip: string; }
interface StyleProfile { style_name: string; description: string; key_elements: string[]; color_palette: string[]; silhouettes: string[]; vibe: string; }
interface InspirationOutfit { name: string; itemIds: string[]; reasoning: string; missing?: string; }
interface InspirationResult { styleProfile: StyleProfile; outfits: InspirationOutfit[]; style_tip: string; }

const MORPHOTYPE_LABELS: Record<string, string> = {
  taille_marquee: 'taille marquée',
  silhouette_sportive: 'silhouette sportive',
  ligne_droite: 'ligne droite',
  hanches_marquees: 'hanches marquées',
  epaules_affirmees: 'épaules affirmées',
  ronde_harmonieuse: 'ronde et harmonieuse',
};

function LookbookView({ outfit, outfitItems }: { outfit: Outfit; outfitItems: ClothingItem[] }) {
  const count = outfitItems.length;
  if (count === 0) return null;

  // Layouts selon le nombre de pièces
  if (count === 1) {
    const item = outfitItems[0];
    return (
      <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-muted">
        {item.image_url
          ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><Shirt className="h-16 w-16 text-muted-foreground/20 stroke-[1]" /></div>
        }
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/80 to-transparent p-3">
          <p className="text-xs text-white/90 font-light">{item.name}</p>
          {item.brand && <p className="text-[10px] gold">{item.brand}</p>}
        </div>
      </div>
    );
  }

  if (count === 2) {
    return (
      <div className="grid grid-cols-2 gap-1.5">
        {outfitItems.map(item => (
          <div key={item.id} className="relative aspect-[3/4] rounded-xl overflow-hidden bg-muted">
            {item.image_url
              ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center"><Shirt className="h-10 w-10 text-muted-foreground/20 stroke-[1]" /></div>
            }
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/80 to-transparent p-2">
              <p className="text-[10px] text-white/90 truncate">{item.name}</p>
              {item.brand && <p className="text-[9px] gold truncate">{item.brand}</p>}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 3+ pièces : grande photo principale + grille secondaire
  const [main, ...rest] = outfitItems;
  return (
    <div className="space-y-1.5">
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted">
        {main.image_url
          ? <img src={main.image_url} alt={main.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><Shirt className="h-14 w-14 text-muted-foreground/20 stroke-[1]" /></div>
        }
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/80 to-transparent p-3">
          <p className="text-xs text-white/90 font-light">{main.name}</p>
          {main.brand && <p className="text-[10px] gold">{main.brand}</p>}
        </div>
      </div>
      <div className={`grid gap-1.5 ${rest.length === 1 ? 'grid-cols-1' : rest.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {rest.map(item => (
          <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden bg-muted">
            {item.image_url
              ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center"><Shirt className="h-8 w-8 text-muted-foreground/20 stroke-[1]" /></div>
            }
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/80 to-transparent p-1.5">
              <p className="text-[9px] text-white/90 truncate">{item.name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SuggestionPage() {
  const { items, incrementWorn } = useCloset();
  const { profile } = useProfile();
  const { days: weatherDays, loading: loadingWeatherDays, error: weatherError } = useWeather();
  const { history: outfitHistory, saveOutfit } = useOutfitHistory();
  const [tab, setTab] = useState<'ia' | 'moi' | 'inspire' | 'historique'>('ia');
  const inspireInputRef = useRef<HTMLInputElement>(null);
  const [inspirePreview, setInspirePreview] = useState<string | null>(null);
  const [inspireBase64, setInspireBase64] = useState<string | null>(null);
  const [inspireMediaType, setInspireMediaType] = useState<string>('image/jpeg');
  const [loadingInspire, setLoadingInspire] = useState(false);
  const [inspireResult, setInspireResult] = useState<InspirationResult | null>(null);

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
          weather: weatherDays[0] ? `${weatherDays[0].tempMax}°C max, ${weatherDays[0].description}` : weather ? `${weather.temp}°C, ${weather.description}` : null,
          morphotype: profile?.morphotype ?? null,
          wardrobe: items.map(i => ({ id: i.id, name: i.name, category: i.category, color: i.color, style: i.style, seasons: i.seasons, favorite: i.favorite, brand: i.brand })),
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

  const handleInspirePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setInspirePreview(URL.createObjectURL(file));
    setInspireResult(null);
    // Resize to max 800px before converting to base64
    const img = new Image();
    img.onload = () => {
      const MAX = 800;
      const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setInspireBase64(dataUrl.split(',')[1]);
      setInspireMediaType('image/jpeg');
    };
    img.src = URL.createObjectURL(file);
  };

  const getInspiration = async () => {
    if (!inspireBase64) { toast.error('Ajoutez une photo'); return; }
    if (items.length === 0) { toast.error('Ajoutez des vêtements à votre dressing'); return; }
    setLoadingInspire(true);
    setInspireResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('style-inspire', {
        body: {
          imageBase64: inspireBase64,
          mediaType: inspireMediaType,
          wardrobe: items.map(i => ({ id: i.id, name: i.name, category: i.category, color: i.color, style: i.style, seasons: i.seasons, brand: i.brand })),
        },
      });
      if (error) throw error;
      setInspireResult(data);
    } catch { toast.error('Erreur analyse du style'); }
    setLoadingInspire(false);
  };

  const toggleItem = (id: string) => { setMyOutfitIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]); setReview(null); };
  const rejectOutfit = (idx: number) => { setRejectedOutfits(prev => new Set([...prev, idx])); };
  const wearOutfit = async (idx: number, outfit: Outfit) => {
    setWornOutfit(idx);
    for (const id of outfit.itemIds) { const item = items.find(i => i.id === id); if (item) await incrementWorn(item); }
    await saveOutfit(outfit.name, outfit.itemIds);
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

        {/* Widget Météo */}
        {loadingWeatherDays ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />Récupération météo...
          </div>
        ) : weatherError ? null : weatherDays.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {weatherDays.map(day => {
              const Icon = day.icon === 'rain' ? CloudRain : day.icon === 'snow' ? Snowflake : day.icon === 'cloud' ? Cloud : Sun;
              return (
                <div key={day.label} className="border border-border rounded-xl p-3 flex items-center gap-3">
                  <Icon className={`h-6 w-6 shrink-0 stroke-[1.5] ${day.icon === 'sun' ? 'text-amber-400' : day.icon === 'rain' ? 'text-blue-400' : day.icon === 'snow' ? 'text-sky-300' : 'text-muted-foreground'}`} />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{day.label}</p>
                    <p className="text-sm font-medium text-foreground">{day.tempMin}° – {day.tempMax}°</p>
                    <p className="text-[10px] text-muted-foreground truncate">{day.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border border-border rounded-xl overflow-hidden">
          <button onClick={() => setTab('ia')}
            className={`flex-1 py-2.5 text-[10px] uppercase tracking-widest transition-all ${tab === 'ia' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}>
            <Sparkles className="h-3.5 w-3.5 inline mr-1.5" />Suggestion
          </button>
          <button onClick={() => setTab('inspire')}
            className={`flex-1 py-2.5 text-[10px] uppercase tracking-widest transition-all border-l border-border ${tab === 'inspire' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}>
            <Camera className="h-3.5 w-3.5 inline mr-1.5" />Inspirée
          </button>
          <button onClick={() => setTab('moi')}
            className={`flex-1 py-2.5 text-[10px] uppercase tracking-widest transition-all border-l border-border ${tab === 'moi' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}>
            <Shirt className="h-3.5 w-3.5 inline mr-1.5" />Ma tenue
          </button>
          <button onClick={() => setTab('historique')}
            className={`flex-1 py-2.5 text-[10px] uppercase tracking-widest transition-all border-l border-border ${tab === 'historique' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}>
            <History className="h-3.5 w-3.5 inline mr-1.5" />Historique
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
                            {mannequinVisible ? 'Masquer le lookbook' : 'Voir le lookbook'}
                          </button>
                        </div>

                        {mannequinVisible && (
                          <div className="px-4 pb-3">
                            <LookbookView outfit={outfit} outfitItems={outfitItems} />
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

        {/* ===== ONGLET INSPIRÉE ===== */}
        {tab === 'inspire' && (
          <div className="space-y-6">
            <div className="border border-border rounded-xl p-4">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Comment ça fonctionne</p>
              <p className="text-xs text-foreground/70 font-light leading-relaxed">Importez une photo d'une influenceuse ou d'une personne dont vous aimez le style. L'IA analyse son aesthetic et compose une tenue similaire avec vos vêtements.</p>
            </div>

            {/* Upload photo */}
            <input ref={inspireInputRef} type="file" accept="image/*" className="hidden" onChange={handleInspirePhoto} />
            {inspirePreview ? (
              <div className="relative rounded-xl overflow-hidden">
                <img src={inspirePreview} alt="Style de référence" className="w-full h-64 object-cover" />
                <button onClick={() => inspireInputRef.current?.click()}
                  className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-sm text-foreground text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full border border-border/50">
                  Changer
                </button>
                {inspireResult && (
                  <div className="absolute top-3 left-3 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <p className="text-[10px] uppercase tracking-widest text-foreground">{inspireResult.styleProfile.style_name}</p>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => inspireInputRef.current?.click()}
                className="w-full h-52 rounded-xl border border-dashed border-border flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-foreground/20 transition-colors">
                <Upload className="h-7 w-7 stroke-[1]" />
                <div className="text-center">
                  <p className="text-xs font-light">Photo d'inspiration</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">Influenceuse, magazine, réseaux sociaux...</p>
                </div>
              </button>
            )}

            {inspirePreview && (
              <button onClick={getInspiration} disabled={loadingInspire}
                className="w-full h-12 bg-foreground text-background text-[10px] uppercase tracking-[0.2em] hover:bg-foreground/90 disabled:opacity-40 transition-colors flex items-center justify-center gap-2 rounded-xl">
                {loadingInspire ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Analyse du style...</> : <><Sparkles className="h-3.5 w-3.5" />Interpréter ce style</>}
              </button>
            )}

            {/* Résultats */}
            {inspireResult && (
              <div className="space-y-5">
                {/* Style analysé */}
                <div className="border border-border rounded-xl p-4 space-y-3">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Style détecté</p>
                  <div>
                    <p className="font-display text-2xl font-light text-foreground">{inspireResult.styleProfile.style_name}</p>
                    <p className="text-xs text-foreground/70 font-light mt-1 italic">{inspireResult.styleProfile.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {inspireResult.styleProfile.key_elements?.map(el => (
                      <span key={el} className="text-[10px] uppercase tracking-widest px-2.5 py-1 border border-border rounded-full text-muted-foreground">{el}</span>
                    ))}
                  </div>
                  {inspireResult.styleProfile.color_palette?.length > 0 && (
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Palette</p>
                      <div className="flex gap-1.5">
                        {inspireResult.styleProfile.color_palette.map(c => (
                          <span key={c} className="text-[10px] text-foreground/70 border border-border px-2 py-0.5 rounded-full">{c}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Tenues proposées */}
                {inspireResult.outfits?.map((outfit, idx) => {
                  const outfitItems = outfit.itemIds.map(id => items.find(i => i.id === id)).filter(Boolean) as ClothingItem[];
                  return (
                    <div key={idx} className="border border-border rounded-2xl overflow-hidden">
                      <div className="p-4 space-y-2">
                        <h3 className="font-display text-xl font-light text-foreground">{outfit.name}</h3>
                        <p className="text-[10px] text-muted-foreground italic font-light leading-relaxed">{outfit.reasoning}</p>
                        {outfit.missing && (
                          <div className="flex items-start gap-2 pt-1">
                            <AlertCircle className="h-3 w-3 text-muted-foreground/60 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-muted-foreground/60 font-light">{outfit.missing}</p>
                          </div>
                        )}
                      </div>
                      {outfitItems.length > 0 && (
                        <div className="px-4 pb-4">
                          <LookbookView outfit={{ ...outfit, trendScore: 0 }} outfitItems={outfitItems} />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Conseil styliste */}
                {inspireResult.style_tip && (
                  <div className="flex items-start gap-3 p-4 border border-border rounded-xl">
                    <TrendingUp className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0 stroke-[1.5]" />
                    <p className="text-xs text-foreground/80 font-light italic">{inspireResult.style_tip}</p>
                  </div>
                )}

                <button onClick={() => { setInspirePreview(null); setInspireBase64(null); setInspireResult(null); }}
                  className="w-full py-3 border border-border text-muted-foreground text-[10px] uppercase tracking-widest hover:border-foreground/20 hover:text-foreground transition-colors rounded-xl">
                  Nouvelle inspiration
                </button>
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

        {/* ===== ONGLET HISTORIQUE ===== */}
        {tab === 'historique' && (
          <div className="space-y-4">
            {outfitHistory.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm font-light">
                Aucune tenue enregistrée pour l'instant
              </div>
            ) : (
              outfitHistory.map(entry => {
                const entryItems = entry.item_ids.map(id => items.find(i => i.id === id)).filter(Boolean) as ClothingItem[];
                const date = new Date(entry.worn_at);
                const label = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
                return (
                  <div key={entry.id} className="border border-border rounded-2xl overflow-hidden">
                    <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-foreground">{entry.name}</p>
                        <p className="text-[10px] text-muted-foreground capitalize">{label}</p>
                      </div>
                      <p className="text-[9px] uppercase tracking-widest text-muted-foreground">{entry.item_ids.length} pièce{entry.item_ids.length > 1 ? 's' : ''}</p>
                    </div>
                    <div className="px-4 pb-4">
                      {entryItems.length > 0 ? (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {entryItems.map(item => (
                            <div key={item.id} className="shrink-0 w-16">
                              <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted">
                                {item.image_url
                                  ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                  : <div className="w-full h-full flex items-center justify-center"><Shirt className="h-6 w-6 text-muted-foreground/20 stroke-[1]" /></div>
                                }
                              </div>
                              <p className="text-[9px] text-muted-foreground truncate mt-1 text-center">{item.name}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-muted-foreground italic">Pièces supprimées du dressing</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
