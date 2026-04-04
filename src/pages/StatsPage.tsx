import { AppLayout } from "@/components/AppLayout";
import { useCloset } from "@/hooks/useCloset";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CATEGORIES, STYLES, COLORS } from "@/types/closet";
import { BarChart2, Heart, Shirt, Star } from "lucide-react";

export default function StatsPage() {
  const { items } = useCloset();

  const byCategory = CATEGORIES.map(c => ({ label: c, count: items.filter(i => i.category === c).length })).filter(x => x.count > 0).sort((a, b) => b.count - a.count);
  const byStyle = STYLES.map(s => ({ label: s, count: items.filter(i => i.style === s).length })).filter(x => x.count > 0).sort((a, b) => b.count - a.count);
  const mostWorn = [...items].sort((a, b) => b.worn_count - a.worn_count).slice(0, 5);
  const neverWorn = items.filter(i => i.worn_count === 0);

  return (
    <AppLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Statistiques</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Tes habitudes vestimentaires</p>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="border-t-4 border-t-purple-500">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">Total vêtements</p>
              <p className="text-2xl font-bold mt-0.5">{items.length}</p>
            </CardContent>
          </Card>
          <Card className="border-t-4 border-t-pink-500">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">Favoris</p>
              <p className="text-2xl font-bold mt-0.5">{items.filter(i => i.favorite).length}</p>
            </CardContent>
          </Card>
          <Card className="border-t-4 border-t-amber-500">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">Jamais portés</p>
              <p className="text-2xl font-bold mt-0.5">{neverWorn.length}</p>
            </CardContent>
          </Card>
          <Card className="border-t-4 border-t-indigo-500">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">Catégories</p>
              <p className="text-2xl font-bold mt-0.5">{byCategory.length}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Par catégorie */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Shirt className="h-4 w-4 text-purple-500" />Par catégorie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {byCategory.map(c => (
                <div key={c.label} className="flex items-center gap-3">
                  <span className="text-sm w-36 truncate">{c.label}</span>
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${(c.count / items.length) * 100}%` }} />
                  </div>
                  <span className="text-sm font-medium w-6 text-right">{c.count}</span>
                </div>
              ))}
              {byCategory.length === 0 && <p className="text-sm text-muted-foreground">Aucun vêtement</p>}
            </CardContent>
          </Card>

          {/* Par style */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><BarChart2 className="h-4 w-4 text-indigo-500" />Par style</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {byStyle.map(s => (
                <div key={s.label} className="flex items-center gap-3">
                  <span className="text-sm w-36 truncate">{s.label}</span>
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${(s.count / items.length) * 100}%` }} />
                  </div>
                  <span className="text-sm font-medium w-6 text-right">{s.count}</span>
                </div>
              ))}
              {byStyle.length === 0 && <p className="text-sm text-muted-foreground">Aucun vêtement</p>}
            </CardContent>
          </Card>

          {/* Les plus portés */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Star className="h-4 w-4 text-amber-500" />Les plus portés</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {mostWorn.filter(i => i.worn_count > 0).map((item, idx) => (
                <div key={item.id} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-4">#{idx + 1}</span>
                  <span className="text-sm flex-1 truncate">{item.name}</span>
                  <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">{item.worn_count}x</span>
                </div>
              ))}
              {mostWorn.filter(i => i.worn_count > 0).length === 0 && <p className="text-sm text-muted-foreground">Pas encore de données de port</p>}
            </CardContent>
          </Card>

          {/* Jamais portés */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Heart className="h-4 w-4 text-pink-500" />Jamais portés</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {neverWorn.slice(0, 5).map(item => (
                <div key={item.id} className="flex items-center gap-3">
                  <span className="text-sm flex-1 truncate">{item.name}</span>
                  <span className="text-xs text-muted-foreground">{item.category}</span>
                </div>
              ))}
              {neverWorn.length === 0 && <p className="text-sm text-muted-foreground">Tu portes tout ! 🎉</p>}
              {neverWorn.length > 5 && <p className="text-xs text-muted-foreground">+ {neverWorn.length - 5} autres</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
