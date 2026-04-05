import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useCloset } from "@/hooks/useCloset";
import { ClothingItem } from "@/types/closet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shirt, Loader2, Recycle, ChevronRight, X } from "lucide-react";

interface UpcycleIdea { title: string; description: string; difficulty: string; }
interface UpcycleResult { diagnostic: string; repairs: UpcycleIdea[]; transformations: UpcycleIdea[]; tip: string; }

const ISSUES = [
  'Trou ou accroc',
  'Bouton manquant',
  'Tache incrustée',
  'Décoloration / usure',
  'Couture décousue',
  'Trop grand / trop large',
  'Passé de mode',
  'Usure générale',
];

const difficultyColor: Record<string, string> = {
  'Facile': 'text-foreground/60',
  'Moyen': 'text-foreground/80',
  'Créatif': 'gold',
};

export default function UpcyclingPage() {
  const { items, loading } = useCloset();
  const [selected, setSelected] = useState<ClothingItem | null>(null);
  const [issue, setIssue] = useState('');
  const [loadingResult, setLoadingResult] = useState(false);
  const [result, setResult] = useState<UpcycleResult | null>(null);

  const getIdeas = async () => {
    if (!selected) return;
    setLoadingResult(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('upcycle-suggest', {
        body: {
          item: {
            name: selected.name,
            brand: selected.brand,
            category: selected.category,
            color: selected.color,
            style: selected.style,
            issue: issue || 'usure générale',
          },
        },
      });
      if (error) throw error;
      setResult(data);
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de la suggestion");
    }
    setLoadingResult(false);
  };

  const reset = () => { setSelected(null); setIssue(''); setResult(null); };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="pt-2">
          <h1 className="font-display text-5xl font-light text-foreground tracking-wide">Upcycling</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mt-2">Réparer · Transformer · Redonner vie</p>
        </div>

        {!selected ? (
          <>
            <div className="p-4 border border-border rounded-xl">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Comment ça fonctionne</p>
              <p className="text-xs text-foreground/70 font-light leading-relaxed">Sélectionnez une pièce abîmée ou passée de mode. L'IA vous propose des idées de réparation et de transformation créative.</p>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-6 w-6 border border-foreground border-t-transparent" />
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground text-sm font-light">Ajoutez des vêtements à votre dressing</div>
            ) : (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Choisissez une pièce</p>
                <div className="space-y-2">
                  {items.map(item => (
                    <button key={item.id} onClick={() => setSelected(item)}
                      className="w-full flex items-center gap-3 p-3 border border-border rounded-xl hover:border-foreground/20 transition-colors text-left">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-12 h-12 object-cover rounded-lg shrink-0" />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center shrink-0">
                          <Shirt className="h-5 w-5 text-muted-foreground/30 stroke-[1]" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">{item.color} · {item.category}</p>
                        {item.brand && <p className="text-[10px] gold truncate">{item.brand}</p>}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-5">
            {/* Pièce sélectionnée */}
            <div className="flex items-center gap-3 p-3 border border-foreground/20 rounded-xl bg-accent">
              {selected.image_url ? (
                <img src={selected.image_url} alt={selected.name} className="w-14 h-14 object-cover rounded-lg shrink-0" />
              ) : (
                <div className="w-14 h-14 bg-muted rounded-lg flex items-center justify-center shrink-0">
                  <Shirt className="h-6 w-6 text-muted-foreground/30 stroke-[1]" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{selected.name}</p>
                {selected.brand && <p className="text-[10px] gold">{selected.brand}</p>}
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">{selected.category} · {selected.color}</p>
              </div>
              <button onClick={reset} className="text-muted-foreground hover:text-foreground shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Problème */}
            {!result && (
              <>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Quel est le problème ?</p>
                  <div className="grid grid-cols-2 gap-2">
                    {ISSUES.map(i => (
                      <button key={i} onClick={() => setIssue(i)}
                        className={`p-3 border rounded-xl text-xs text-left transition-all ${issue === i ? 'border-foreground/40 bg-accent text-foreground' : 'border-border text-muted-foreground hover:border-foreground/20'}`}>
                        {i}
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={getIdeas} disabled={loadingResult}
                  className="w-full h-12 bg-foreground text-background text-[10px] uppercase tracking-[0.2em] hover:bg-foreground/90 disabled:opacity-40 transition-colors flex items-center justify-center gap-2 rounded-xl">
                  {loadingResult ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Analyse en cours...</> : <><Recycle className="h-3.5 w-3.5" />Obtenir des idées</>}
                </button>
              </>
            )}

            {/* Résultats */}
            {result && (
              <div className="space-y-5">
                <div className="p-4 border border-border rounded-xl">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Diagnostic</p>
                  <p className="text-sm text-foreground font-light leading-relaxed">{result.diagnostic}</p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Idées de réparation</p>
                  <div className="space-y-2">
                    {result.repairs?.map((r, i) => (
                      <div key={i} className="p-4 border border-border rounded-xl">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-sm font-medium text-foreground">{r.title}</p>
                          <span className={`text-[9px] uppercase tracking-widest ${difficultyColor[r.difficulty] || 'text-muted-foreground'}`}>{r.difficulty}</span>
                        </div>
                        <p className="text-xs text-foreground/70 font-light leading-relaxed">{r.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Idées de transformation</p>
                  <div className="space-y-2">
                    {result.transformations?.map((t, i) => (
                      <div key={i} className="p-4 border border-border rounded-xl">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-sm font-medium text-foreground">{t.title}</p>
                          <span className={`text-[9px] uppercase tracking-widest ${difficultyColor[t.difficulty] || 'text-muted-foreground'}`}>{t.difficulty}</span>
                        </div>
                        <p className="text-xs text-foreground/70 font-light leading-relaxed">{t.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {result.tip && (
                  <div className="p-4 border border-border rounded-xl flex gap-3">
                    <Recycle className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0 stroke-[1.5]" />
                    <p className="text-xs text-foreground/80 font-light italic">{result.tip}</p>
                  </div>
                )}

                <button onClick={() => { setResult(null); setIssue(''); }}
                  className="w-full py-3 border border-border text-muted-foreground text-[10px] uppercase tracking-widest hover:border-foreground/20 hover:text-foreground transition-colors rounded-xl">
                  Autre problème
                </button>
                <button onClick={reset}
                  className="w-full py-3 border border-border text-muted-foreground text-[10px] uppercase tracking-widest hover:border-foreground/20 hover:text-foreground transition-colors rounded-xl">
                  Choisir une autre pièce
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
