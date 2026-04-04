import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useCloset } from "@/hooks/useCloset";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MOODS, PLANNING_TYPES, ClothingItem } from "@/types/closet";
import { Sparkles, Loader2, Shirt, RefreshCw, Cloud, Sun, CloudRain, Thermometer, ThumbsDown, ThumbsUp, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Weather {
  temp: number;
  description: string;
  icon: string;
}

interface Outfit {
  name: string;
  itemIds: string[];
  reasoning: string;
  trendScore: number;
}

interface SuggestionResult {
  outfits: Outfit[];
  trendTip: string;
}

export default function SuggestionPage() {
  const { items, incrementWorn } = useCloset();
  const [mood, setMood] = useState('');
  const [planning, setPlanning] = useState('');
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [result, setResult] = useState<SuggestionResult | null>(null);
  const [rejectedOutfits, setRejectedOutfits] = useState<Set<number>>(new Set());
  const [wornOutfit, setWornOutfit] = useState<number | null>(null);

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
      } catch {
        toast.error('Impossible de récupérer la météo');
      }
      setLoadingWeather(false);
    }, () => {
      toast.error('Géolocalisation refusée');
      setLoadingWeather(false);
    });
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
          wardrobe: items.map(i => ({ id: i.id, name: i.name, category: i.category, color: i.color, style: i.style, season: i.season, favorite: i.favorite })),
        },
      });
      if (error) throw error;
      setResult(data);
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors de la suggestion IA');
    }
    setLoadingSuggestion(false);
  };

  const rejectOutfit = (idx: number) => {
    setRejectedOutfits(prev => new Set([...prev, idx]));
    const remaining = result!.outfits.filter((_, i) => i !== idx && !rejectedOutfits.has(i));
    if (remaining.length === 0) toast.info('Tu as refusé toutes les tenues ! Relance une suggestion.');
  };

  const wearOutfit = async (idx: number, outfit: Outfit) => {
    setWornOutfit(idx);
    for (const id of outfit.itemIds) {
      const item = items.find(i => i.id === id);
      if (item) await incrementWorn(item);
    }
    toast.success(`Super choix ! "${outfit.name}" enregistrée comme portée 👗`);
  };

  const getOutfitItems = (outfit: Outfit): ClothingItem[] =>
    outfit.itemIds.map(id => items.find(i => i.id === id)).filter(Boolean) as ClothingItem[];

  const visibleOutfits = result?.outfits.filter((_, i) => !rejectedOutfits.has(i)) ?? [];

  const WeatherIcon = weather?.icon === 'rain' ? CloudRain : weather?.icon === 'cloud' ? Cloud : Sun;

  return (
    <AppLayout>
      <div className="space-y-4 max-w-2xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Que porter aujourd'hui ?</h1>
          <p className="text-sm text-muted-foreground mt-0.5">L'IA te propose 3 tenues adaptées à ta journée</p>
        </div>

        {/* Météo */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-blue-500" />Météo du jour
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weather ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50">
                  <WeatherIcon className="h-6 w-6 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold text-blue-700">{weather.temp}°C</p>
                    <p className="text-xs text-blue-500">{weather.description}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={getWeather}>
                  <RefreshCw className="h-3 w-3 mr-1" />Actualiser
                </Button>
              </div>
            ) : (
              <Button variant="outline" onClick={getWeather} disabled={loadingWeather}>
                {loadingWeather ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Cloud className="h-4 w-4 mr-2" />}
                Récupérer ma météo
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Humeur */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Comment tu te sens ? ✨</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {MOODS.map(m => (
                <button key={m.value} onClick={() => setMood(m.value)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${mood === m.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                  <span className="text-2xl">{m.emoji}</span>
                  <span className="text-xs font-medium text-center leading-tight">{m.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Planning */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Ton planning du jour 📅</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PLANNING_TYPES.map(p => (
                <button key={p.value} onClick={() => setPlanning(p.value)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${planning === p.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                  <span className="text-2xl">{p.emoji}</span>
                  <span className="text-xs font-medium text-center leading-tight">{p.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bouton */}
        <Button size="lg" className="w-full h-14 text-base font-bold rounded-xl" onClick={getSuggestion} disabled={loadingSuggestion || !mood || !planning}>
          {loadingSuggestion ? (
            <><Loader2 className="h-5 w-5 animate-spin mr-2" />L'IA choisit tes tenues...</>
          ) : (
            <><Sparkles className="h-5 w-5 mr-2" />Suggère mes tenues !</>
          )}
        </Button>

        {/* Résultats */}
        {result && (
          <div className="space-y-4">
            {/* Conseil tendance */}
            {result.trendTip && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-purple-50 border border-purple-200">
                <TrendingUp className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
                <p className="text-sm text-purple-700 font-medium">{result.trendTip}</p>
              </div>
            )}

            {visibleOutfits.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center">
                  <p className="text-muted-foreground mb-3">Tu as refusé toutes les tenues !</p>
                  <Button onClick={getSuggestion} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />Nouvelles suggestions
                  </Button>
                </CardContent>
              </Card>
            ) : (
              result.outfits.map((outfit, idx) => {
                if (rejectedOutfits.has(idx)) return null;
                const outfitItems = getOutfitItems(outfit);
                const isWorn = wornOutfit === idx;

                return (
                  <Card key={idx} className={`border-2 transition-all ${isWorn ? 'border-green-400 bg-green-50' : 'border-primary/20'}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          {outfit.name}
                        </CardTitle>
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="h-3.5 w-3.5 text-purple-500" />
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${outfit.trendScore >= 80 ? 'bg-purple-100 text-purple-700' : outfit.trendScore >= 60 ? 'bg-blue-100 text-blue-700' : 'bg-muted text-muted-foreground'}`}>
                            Tendance {outfit.trendScore}%
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground italic mt-1">"{outfit.reasoning}"</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {outfitItems.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                          {outfitItems.map(item => (
                            <div key={item.id} className="text-center">
                              {item.image_url ? (
                                <img src={item.image_url} alt={item.name} className="w-full aspect-square object-cover rounded-xl mb-1.5 border" />
                              ) : (
                                <div className="w-full aspect-square bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl flex items-center justify-center mb-1.5 border">
                                  <Shirt className="h-8 w-8 text-purple-300" />
                                </div>
                              )}
                              <p className="text-xs font-medium truncate">{item.name}</p>
                              <p className="text-[10px] text-muted-foreground">{item.color}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center">Ajoute plus de vêtements !</p>
                      )}

                      {/* Actions */}
                      {!isWorn ? (
                        <div className="flex gap-2">
                          <Button variant="outline" className="flex-1 text-destructive hover:text-destructive hover:bg-red-50 border-red-200" onClick={() => rejectOutfit(idx)}>
                            <ThumbsDown className="h-4 w-4 mr-2" />Pas celle-là
                          </Button>
                          <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => wearOutfit(idx, outfit)}>
                            <ThumbsUp className="h-4 w-4 mr-2" />Je la porte !
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center py-2">
                          <p className="text-green-600 font-semibold text-sm">✅ Tenue sélectionnée — bon look !</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}

            {visibleOutfits.length > 0 && wornOutfit === null && (
              <Button variant="outline" className="w-full" onClick={getSuggestion}>
                <RefreshCw className="h-4 w-4 mr-2" />Toutes nouvelles suggestions
              </Button>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
