import { useState, useEffect } from 'react';

export interface DayWeather {
  label: string; // 'Aujourd\'hui' | 'Demain'
  date: string;
  tempMin: number;
  tempMax: number;
  description: string;
  icon: 'sun' | 'cloud' | 'rain' | 'snow';
}

function weatherCodeToInfo(code: number): { description: string; icon: DayWeather['icon'] } {
  if (code >= 71) return { description: 'Neige', icon: 'snow' };
  if (code >= 61) return { description: 'Pluie', icon: 'rain' };
  if (code >= 51) return { description: 'Bruine', icon: 'rain' };
  if (code >= 45) return { description: 'Brouillard', icon: 'cloud' };
  if (code >= 3)  return { description: 'Nuageux', icon: 'cloud' };
  if (code >= 1)  return { description: 'Partiellement nuageux', icon: 'cloud' };
  return { description: 'Dégagé', icon: 'sun' };
}

export function useWeather() {
  const [days, setDays] = useState<DayWeather[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
            `&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&forecast_days=2`
          );
          const data = await res.json();
          const result: DayWeather[] = data.daily.time.slice(0, 2).map((date: string, i: number) => {
            const code = data.daily.weathercode[i];
            const { description, icon } = weatherCodeToInfo(code);
            return {
              label: i === 0 ? "Aujourd'hui" : 'Demain',
              date,
              tempMin: Math.round(data.daily.temperature_2m_min[i]),
              tempMax: Math.round(data.daily.temperature_2m_max[i]),
              description,
              icon,
            };
          });
          setDays(result);
        } catch {
          setError('Météo indisponible');
        }
        setLoading(false);
      },
      () => { setError('Géolocalisation refusée'); setLoading(false); }
    );
  };

  useEffect(() => { load(); }, []);

  return { days, loading, error, reload: load };
}
