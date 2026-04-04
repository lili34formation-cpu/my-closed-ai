import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useCloset } from "@/hooks/useCloset";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MOODS, PLANNING_TYPES, ClothingItem } from "@/types/closet";
import { Sparkles, Loader2, Shirt, RefreshCw, Cloud, Sun, CloudRain, Thermometer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Weather {
  temp: number;
  description: string;
  icon: string;
}

interface Suggestion {
  items: ClothingItem[];
  reasoning: string;
}

export default function SuggestionPage() {
  const { items } = useCloset();
  const [mood, setMood] = useState('');
  const [planning, setPlanning] = useState('');
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);

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
    setSuggestion(null);

    try {
      const { data, error } = await supabase.functions.invoke('suggest-outfit', {
        body: {
          mood,
          planning,
          weather: weather ? `${weather.temp}°C, ${weather.description}` : null,
          wardrobe: items.map(i => ({ id: i.id, name: i.name, category: i.category, color: i.color, style: i.style, season: i.season, favorite: i.favorite })),
        },
      });

      if (error) throw error;

      // Map item ids back to full items
      const suggestedItems = (data.itemIds || []).map((id: string) => items.find(i => i.id === id)).filter(Boolean) as ClothingItem[];
      setSuggestion({ items: suggestedItems, reasoning: data.reasoning });
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors de la suggestion IA');
    }
    setLoadingSuggestion(false);
  };

  const WeatherIcon = weather?.icon === 'rain' ? CloudRain : weather?.icon === 'cloud' ? Cloud : Sun;

  return (
    <AppLayout>
      <div className="space-y-4 max-w-2xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Que porter aujourd'hui ?</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Dis-moi comment tu te sens et l'IA choisit ta tenue</p>
        </div>

        {/* Météo */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-blue-500" />
              Météo du jour
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
                <button
                  key={m.value}
                  onClick={() => setMood(m.value)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${mood === m.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
                >
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
                <button
                  key={p.value}
                  onClick={() => setPlanning(p.value)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${planning === p.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
                >
                  <span className="text-2xl">{p.emoji}</span>
                  <span className="text-xs font-medium text-center leading-tight">{p.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bouton suggérer */}
        <Button
          size="lg"
          className="w-full h-14 text-base font-bold rounded-xl"
          onClick={getSuggestion}
          disabled={loadingSuggestion || !mood || !planning}
        >
          {loadingSuggestion ? (
            <><Loader2 className="h-5 w-5 animate-spin mr-2" />L'IA choisit ta tenue...</>
          ) : (
            <><Sparkles className="h-5 w-5 mr-2" />Suggère ma tenue !</>
          )}
        </Button>

        {/* Résultat */}
        {suggestion && (
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Ta tenue du jour
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground italic">"{suggestion.reasoning}"</p>
              {suggestion.items.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {suggestion.items.map(item => (
                    <div key={item.id} className="text-center">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full aspect-square object-cover rounded-xl mb-2" />
                      ) : (
                        <div className="w-full aspect-square bg-white rounded-xl flex items-center justify-center mb-2 border">
                          <Shirt className="h-10 w-10 text-purple-300" />
                        </div>
                      )}
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.color} · {item.category}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center">Ajoute plus de vêtements pour des suggestions complètes !</p>
              )}
              <Button variant="outline" className="w-full" onClick={getSuggestion}>
                <RefreshCw className="h-4 w-4 mr-2" />Autre suggestion
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
