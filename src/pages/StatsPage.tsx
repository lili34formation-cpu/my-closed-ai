import { AppLayout } from "@/components/AppLayout";
import { useCloset } from "@/hooks/useCloset";
import { CATEGORIES, STYLES } from "@/types/closet";
import { Shirt } from "lucide-react";

export default function StatsPage() {
  const { items } = useCloset();

  const byCategory = CATEGORIES.map(c => ({ label: c, count: items.filter(i => i.category === c).length })).filter(x => x.count > 0).sort((a, b) => b.count - a.count);
  const byStyle = STYLES.map(s => ({ label: s, count: items.filter(i => i.style === s).length })).filter(x => x.count > 0).sort((a, b) => b.count - a.count);
  const mostWorn = [...items].sort((a, b) => b.worn_count - a.worn_count).slice(0, 5).filter(i => i.worn_count > 0);
  const neverWorn = items.filter(i => i.worn_count === 0);
  const maxCat = byCategory[0]?.count || 1;
  const maxStyle = byStyle[0]?.count || 1;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Statistiques</h1>
          <p className="text-muted-foreground text-sm mt-1">Tes habitudes vestimentaires</p>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Vêtements', value: items.length, from: 'from-purple-600', to: 'to-violet-600', sub: 'dans le dressing' },
            { label: 'Favoris', value: items.filter(i => i.favorite).length, from: 'from-pink-600', to: 'to-rose-600', sub: `sur ${items.length}` },
            { label: 'Portés', value: items.filter(i => i.worn_count > 0).length, from: 'from-emerald-600', to: 'to-teal-600', sub: 'au moins 1 fois' },
            { label: 'Jamais portés', value: neverWorn.length, from: 'from-amber-600', to: 'to-orange-600', sub: 'à sortir du placard' },
          ].map(kpi => (
            <div key={kpi.label} className={`bg-gradient-to-br ${kpi.from} ${kpi.to} rounded-2xl p-4`}>
              <p className="text-3xl font-bold text-white">{kpi.value}</p>
              <p className="text-sm font-semibold text-white mt-0.5">{kpi.label}</p>
              <p className="text-[11px] text-white/60 mt-0.5">{kpi.sub}</p>
            </div>
          ))}
        </div>

        {/* Par catégorie */}
        {byCategory.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">👗 Par catégorie</p>
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              {byCategory.map(c => (
                <div key={c.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-foreground font-medium">{c.label}</span>
                    <span className="text-muted-foreground">{c.count}</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-500 transition-all duration-700"
                      style={{ width: `${(c.count / maxCat) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Par style */}
        {byStyle.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">✨ Par style</p>
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              {byStyle.map(s => (
                <div key={s.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-foreground font-medium">{s.label}</span>
                    <span className="text-muted-foreground">{s.count}</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-700"
                      style={{ width: `${(s.count / maxStyle) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Plus portés */}
        {mostWorn.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">🏆 Les plus portés</p>
            <div className="space-y-2">
              {mostWorn.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-2xl">
                  <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-secondary flex items-center justify-center">
                        <Shirt className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                    <p className="text-[11px] text-muted-foreground">{item.category}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">#{idx + 1}</span>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-900/30 text-amber-400 border border-amber-800/30">{item.worn_count}x</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Jamais portés */}
        {neverWorn.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">😴 Jamais portés</p>
            <div className="space-y-2">
              {neverWorn.slice(0, 5).map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-2xl">
                  <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-secondary flex items-center justify-center">
                        <Shirt className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                    <p className="text-[11px] text-muted-foreground">{item.category} · {item.color}</p>
                  </div>
                </div>
              ))}
              {neverWorn.length > 5 && (
                <p className="text-xs text-muted-foreground text-center">+ {neverWorn.length - 5} autres</p>
              )}
            </div>
          </div>
        )}

        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-card border border-border flex items-center justify-center mb-4">
              <Shirt className="h-9 w-9 text-muted-foreground" />
            </div>
            <p className="font-semibold text-foreground">Pas encore de données</p>
            <p className="text-sm text-muted-foreground mt-1">Ajoute des vêtements et porte-les !</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
