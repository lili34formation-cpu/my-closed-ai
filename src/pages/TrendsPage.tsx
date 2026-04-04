import { AppLayout } from "@/components/AppLayout";
import { useCloset } from "@/hooks/useCloset";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Shirt, Palette, Star, CheckCircle, XCircle } from "lucide-react";

const CURRENT_SEASON = (() => {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5) return 'Printemps 2026';
  if (m >= 6 && m <= 8) return 'Été 2026';
  if (m >= 9 && m <= 11) return 'Automne 2026';
  return 'Hiver 2025-2026';
})();

const TRENDS = {
  colors: [
    { name: 'Beige / Camel', hex: '#C4A882', hot: true },
    { name: 'Vert olive', hex: '#6B7645', hot: true },
    { name: 'Bleu cobalt', hex: '#2342A0', hot: true },
    { name: 'Rouge vif', hex: '#CC2200', hot: true },
    { name: 'Blanc cassé', hex: '#F5F0E8', hot: false },
    { name: 'Marron chocolat', hex: '#4A2C17', hot: false },
  ],
  styles: [
    { name: 'Oversize chic', emoji: '🧥', description: 'Blazers et manteaux larges portés avec des pièces ajustées en dessous' },
    { name: 'Layering', emoji: '👕', description: 'Superposition de couches — chemise sous pull, t-shirt sous blazer' },
    { name: 'Minimalisme élégant', emoji: '✨', description: 'Moins de pièces, plus de qualité. Tons neutres et coupes propres' },
    { name: 'Sport-luxe', emoji: '👟', description: 'Mix sneakers premium avec des pièces habillées pour un look décalé' },
  ],
  pieces: [
    { name: 'Blazer structuré', emoji: '👔', trendy: true },
    { name: 'Jean wide leg', emoji: '👖', trendy: true },
    { name: 'Sneakers premium', emoji: '👟', trendy: true },
    { name: 'Trench coat', emoji: '🧥', trendy: true },
    { name: 'Robe midi', emoji: '👗', trendy: true },
    { name: 'Sac structuré', emoji: '👜', trendy: false },
  ],
};

export default function TrendsPage() {
  const { items } = useCloset();

  // Analyser quels items du dressing sont tendance
  const trendyColors = TRENDS.colors.filter(c => c.hot).map(c => c.name.toLowerCase());
  const myTrendyItems = items.filter(item => {
    const colorMatch = trendyColors.some(tc => item.color.toLowerCase().includes(tc.split(' ')[0]));
    return colorMatch || item.style === 'Professionnel' || item.style === 'Soirée';
  });

  const trendScore = items.length > 0 ? Math.min(100, Math.round((myTrendyItems.length / items.length) * 100) + 20) : 0;

  return (
    <AppLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tendances Mode</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Ce qui est en vogue — {CURRENT_SEASON}</p>
        </div>

        {/* Score tendance du dressing */}
        <Card className="border-t-4 border-t-purple-500 bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Score tendance de ton dressing</p>
                <p className="text-4xl font-bold text-purple-600 mt-1">{trendScore}%</p>
                <p className="text-xs text-muted-foreground mt-1">{myTrendyItems.length} pièce{myTrendyItems.length > 1 ? 's' : ''} tendance sur {items.length}</p>
              </div>
              <div className="h-20 w-20 rounded-full border-4 border-purple-200 flex items-center justify-center bg-white">
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Couleurs tendance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="h-4 w-4 text-pink-500" />
              Couleurs tendance — {CURRENT_SEASON}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {TRENDS.colors.map(color => (
                <div key={color.name} className="text-center">
                  <div className="w-full aspect-square rounded-xl border-2 border-white shadow-sm mx-auto mb-1.5" style={{ backgroundColor: color.hex }} />
                  <p className="text-xs font-medium leading-tight">{color.name}</p>
                  {color.hot && <span className="text-[10px] text-purple-600 font-semibold">🔥 Hot</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Styles tendance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shirt className="h-4 w-4 text-indigo-500" />
              Styles du moment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {TRENDS.styles.map(style => (
              <div key={style.name} className="flex items-start gap-3 p-3 rounded-xl bg-muted/40">
                <span className="text-2xl shrink-0">{style.emoji}</span>
                <div>
                  <p className="font-semibold text-sm">{style.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{style.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Pièces clés */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              Pièces clés de la saison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {TRENDS.pieces.map(piece => {
                const hasIt = items.some(i => i.name.toLowerCase().includes(piece.name.toLowerCase().split(' ')[0]));
                return (
                  <div key={piece.name} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{piece.emoji}</span>
                      <p className="text-sm font-medium">{piece.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasIt ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                          <CheckCircle className="h-3 w-3" />Tu l'as !
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
                          <XCircle className="h-3 w-3" />À acquérir
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Pièces tendance dans mon dressing */}
        {myTrendyItems.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                Tes pièces tendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {myTrendyItems.slice(0, 6).map(item => (
                  <div key={item.id} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-purple-50 border border-purple-100">
                    <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                      <Shirt className="h-5 w-5 text-purple-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground">{item.color}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
