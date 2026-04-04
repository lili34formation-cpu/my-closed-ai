import { AppLayout } from "@/components/AppLayout";
import { useCloset } from "@/hooks/useCloset";
import { TrendingUp, Shirt, CheckCircle, XCircle } from "lucide-react";

const CURRENT_SEASON = (() => {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5) return 'Printemps 2026';
  if (m >= 6 && m <= 8) return 'Été 2026';
  if (m >= 9 && m <= 11) return 'Automne 2026';
  return 'Hiver 2025-2026';
})();

const TRENDS = {
  colors: [
    { name: 'Beige', hex: '#C4A882', hot: true },
    { name: 'Olive', hex: '#6B7645', hot: true },
    { name: 'Cobalt', hex: '#2342A0', hot: true },
    { name: 'Rouge', hex: '#CC2200', hot: true },
    { name: 'Crème', hex: '#F5F0E8', hot: false },
    { name: 'Chocolat', hex: '#4A2C17', hot: false },
  ],
  styles: [
    { name: 'Oversize chic', emoji: '🧥', description: 'Blazers larges + pièces ajustées' },
    { name: 'Layering', emoji: '👕', description: 'Chemise sous pull, t-shirt sous blazer' },
    { name: 'Minimalisme', emoji: '✨', description: 'Tons neutres, coupes propres' },
    { name: 'Sport-luxe', emoji: '👟', description: 'Sneakers premium + pièces habillées' },
  ],
  pieces: [
    { name: 'Blazer structuré', emoji: '👔' },
    { name: 'Jean wide leg', emoji: '👖' },
    { name: 'Sneakers premium', emoji: '👟' },
    { name: 'Trench coat', emoji: '🧥' },
    { name: 'Robe midi', emoji: '👗' },
    { name: 'Sac structuré', emoji: '👜' },
  ],
};

export default function TrendsPage() {
  const { items } = useCloset();

  const trendyColors = TRENDS.colors.filter(c => c.hot).map(c => c.name.toLowerCase());
  const myTrendyItems = items.filter(item =>
    trendyColors.some(tc => item.color.toLowerCase().includes(tc.split(' ')[0]))
  );
  const trendScore = items.length > 0 ? Math.min(100, Math.round((myTrendyItems.length / items.length) * 100) + 20) : 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Tendances</h1>
          <p className="text-muted-foreground text-sm mt-1">{CURRENT_SEASON}</p>
        </div>

        {/* Score tendance */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-900/60 to-pink-900/30 border border-purple-800/30 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-300">Score tendance</p>
              <p className="text-5xl font-display font-bold gradient-text mt-1">{trendScore}%</p>
              <p className="text-xs text-muted-foreground mt-2">{myTrendyItems.length} pièce{myTrendyItems.length !== 1 ? 's' : ''} tendance sur {items.length}</p>
            </div>
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-2 border-purple-500/30 flex items-center justify-center">
                <TrendingUp className="h-9 w-9 text-purple-400" />
              </div>
              <div className="absolute inset-0 rounded-full bg-purple-500/10 blur-xl" />
            </div>
          </div>
        </div>

        {/* Palette couleurs */}
        <div>
          <p className="text-sm font-semibold text-foreground mb-3">🎨 Palette de la saison</p>
          <div className="grid grid-cols-6 gap-2">
            {TRENDS.colors.map(color => (
              <div key={color.name} className="text-center">
                <div
                  className={`w-full aspect-square rounded-xl border-2 mb-1.5 shadow-lg ${color.hot ? 'border-primary/60' : 'border-transparent'}`}
                  style={{ backgroundColor: color.hex }}
                />
                <p className="text-[10px] text-muted-foreground font-medium leading-tight">{color.name}</p>
                {color.hot && <span className="text-[9px] text-primary">🔥</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Styles du moment */}
        <div>
          <p className="text-sm font-semibold text-foreground mb-3">✨ Styles du moment</p>
          <div className="space-y-2">
            {TRENDS.styles.map(style => (
              <div key={style.name} className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border">
                <span className="text-2xl">{style.emoji}</span>
                <div>
                  <p className="font-semibold text-sm text-foreground">{style.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{style.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pièces clés */}
        <div>
          <p className="text-sm font-semibold text-foreground mb-3">⭐ Pièces clés</p>
          <div className="space-y-2">
            {TRENDS.pieces.map(piece => {
              const hasIt = items.some(i => i.name.toLowerCase().includes(piece.name.toLowerCase().split(' ')[0]));
              return (
                <div key={piece.name} className="flex items-center justify-between p-3.5 rounded-2xl bg-card border border-border">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{piece.emoji}</span>
                    <p className="text-sm font-medium text-foreground">{piece.name}</p>
                  </div>
                  {hasIt ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-900/30 px-2.5 py-1 rounded-full border border-emerald-800/30">
                      <CheckCircle className="h-3 w-3" />Tu l'as !
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground bg-card px-2.5 py-1 rounded-full border border-border">
                      <XCircle className="h-3 w-3" />À avoir
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Mes pièces tendance */}
        {myTrendyItems.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">💜 Tes pièces tendance</p>
            <div className="grid grid-cols-2 gap-3">
              {myTrendyItems.slice(0, 4).map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-br from-purple-900/30 to-pink-900/10 border border-purple-800/20">
                  <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-purple-900/50 flex items-center justify-center">
                        <Shirt className="h-5 w-5 text-purple-400" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground">{item.color}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
