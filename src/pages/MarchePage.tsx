import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useCloset } from "@/hooks/useCloset";
import { ClothingItem, CONDITIONS } from "@/types/closet";
import { toast } from "sonner";
import { Shirt, Plus, X, Tag, ShoppingBag, Share2, Copy } from "lucide-react";

function buildListingText(item: ClothingItem): string {
  return [
    `${item.name}${item.brand ? ` — ${item.brand}` : ''}`,
    `Prix : ${item.price}€`,
    `État : ${item.condition}`,
    ``,
    `Catégorie : ${item.category}`,
    `Couleur : ${item.color}`,
    `Style : ${item.style}`,
    ``,
    `Paiement sécurisé, envoi possible. N'hésitez pas à me contacter.`,
  ].join('\n');
}

async function shareItem(item: ClothingItem) {
  const text = buildListingText(item);
  const title = `${item.name}${item.price ? ` — ${item.price}€` : ''}`;

  if (item.image_url && navigator.canShare) {
    try {
      const res = await fetch(item.image_url);
      const blob = await res.blob();
      const file = new File([blob], 'photo.jpg', { type: blob.type });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title, text });
        return;
      }
    } catch {}
  }

  if (navigator.share) {
    await navigator.share({ title, text });
  } else {
    await navigator.clipboard.writeText(text);
    toast.success('Texte copié dans le presse-papier');
  }
}

function SellModal({ item, onClose, onConfirm }: { item: ClothingItem; onClose: () => void; onConfirm: (price: number, condition: string) => void }) {
  const [price, setPrice] = useState(item.price ? String(item.price) : '');
  const [condition, setCondition] = useState(item.condition ?? CONDITIONS[1]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-card border border-border rounded-t-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-light text-foreground">Mettre en vente</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex items-center gap-3 p-3 border border-border rounded-xl">
          {item.image_url ? (
            <img src={item.image_url} alt={item.name} className="w-12 h-12 object-cover rounded-lg shrink-0" />
          ) : (
            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center shrink-0">
              <Shirt className="h-5 w-5 text-muted-foreground/30 stroke-[1]" />
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-foreground">{item.name}</p>
            {item.brand && <p className="text-[10px] gold">{item.brand}</p>}
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-2">Prix de vente (€)</label>
          <input
            type="number"
            value={price}
            onChange={e => setPrice(e.target.value)}
            placeholder="Ex: 25"
            min="1"
            className="w-full bg-transparent border-b border-border text-foreground text-sm placeholder:text-muted-foreground/40 py-2 focus:outline-none focus:border-foreground/40 transition-colors"
          />
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-3">État</label>
          <div className="grid grid-cols-2 gap-2">
            {CONDITIONS.map(c => (
              <button key={c} onClick={() => setCondition(c)}
                className={`p-3 border rounded-xl text-xs transition-all ${condition === c ? 'border-foreground/40 bg-accent text-foreground' : 'border-border text-muted-foreground hover:border-foreground/20'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => { if (!price || parseFloat(price) <= 0) { toast.error('Prix requis'); return; } onConfirm(parseFloat(price), condition); }}
          className="w-full h-12 bg-foreground text-background text-[10px] uppercase tracking-[0.2em] hover:bg-foreground/90 transition-colors flex items-center justify-center gap-2 rounded-xl">
          <Tag className="h-3.5 w-3.5" />Publier l'annonce
        </button>
      </div>
    </div>
  );
}

export default function MarchePage() {
  const { items, loading, listForSale, unlistFromSale } = useCloset();
  const [tab, setTab] = useState<'vente' | 'dressing'>('vente');
  const [modalItem, setModalItem] = useState<ClothingItem | null>(null);

  const forSaleItems = items.filter(i => i.for_sale);
  const notForSaleItems = items.filter(i => !i.for_sale);

  const handleConfirm = async (price: number, condition: string) => {
    if (!modalItem) return;
    await listForSale(modalItem, price, condition);
    toast.success(`"${modalItem.name}" mis en vente`);
    setModalItem(null);
  };

  const handleUnlist = async (item: ClothingItem) => {
    await unlistFromSale(item);
    toast.success(`"${item.name}" retiré de la vente`);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="pt-2">
          <h1 className="font-display text-5xl font-light text-foreground tracking-wide">Marché</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mt-2">
            {forSaleItems.length} annonce{forSaleItems.length !== 1 ? 's' : ''} en ligne
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border border-border rounded-xl overflow-hidden">
          <button onClick={() => setTab('vente')}
            className={`flex-1 py-2.5 text-[10px] uppercase tracking-widest transition-all ${tab === 'vente' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}>
            <ShoppingBag className="h-3.5 w-3.5 inline mr-1.5" />Mes annonces
          </button>
          <button onClick={() => setTab('dressing')}
            className={`flex-1 py-2.5 text-[10px] uppercase tracking-widest transition-all border-l border-border ${tab === 'dressing' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}>
            <Plus className="h-3.5 w-3.5 inline mr-1.5" />Ajouter une pièce
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-6 w-6 border border-foreground border-t-transparent" />
          </div>
        ) : tab === 'vente' ? (
          forSaleItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <ShoppingBag className="h-10 w-10 text-muted-foreground/20 stroke-[1] mb-4" />
              <p className="text-sm text-muted-foreground font-light">Aucune annonce</p>
              <p className="text-xs text-muted-foreground/50 mt-1">Ajoutez des pièces depuis votre dressing</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {forSaleItems.map(item => (
                <div key={item.id} className="relative bg-card border border-border rounded-2xl overflow-hidden">
                  <div className="aspect-[3/4] relative">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Shirt className="h-10 w-10 text-muted-foreground/20 stroke-[1]" />
                      </div>
                    )}
                    <button onClick={() => handleUnlist(item)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center">
                      <X className="h-3 w-3 text-destructive" />
                    </button>
                    <div className="absolute bottom-2 left-2">
                      <span className="text-xs font-medium px-2 py-1 bg-foreground text-background rounded-full">{item.price}€</span>
                    </div>
                  </div>
                  <div className="p-3 space-y-2">
                    <div>
                      <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                      {item.brand && <p className="text-[10px] gold uppercase tracking-widest truncate mt-0.5">{item.brand}</p>}
                      <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide">{item.condition}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={async () => { try { await shareItem(item); } catch {} }}
                        className="flex-1 flex items-center justify-center gap-1 py-2 border border-border rounded-lg text-[10px] uppercase tracking-widest text-muted-foreground hover:border-foreground/20 hover:text-foreground transition-colors">
                        <Share2 className="h-3 w-3" />Partager
                      </button>
                      <button
                        onClick={async () => { await navigator.clipboard.writeText(buildListingText(item)); toast.success('Annonce copiée'); }}
                        className="flex-1 flex items-center justify-center gap-1 py-2 border border-border rounded-lg text-[10px] uppercase tracking-widest text-muted-foreground hover:border-foreground/20 hover:text-foreground transition-colors">
                        <Copy className="h-3 w-3" />Copier
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          notForSaleItems.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground text-sm font-light">Toutes vos pièces sont déjà en vente</div>
          ) : (
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Sélectionnez une pièce à vendre</p>
              {notForSaleItems.map(item => (
                <button key={item.id} onClick={() => setModalItem(item)}
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
                  <Tag className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                </button>
              ))}
            </div>
          )
        )}
      </div>

      {modalItem && (
        <SellModal item={modalItem} onClose={() => setModalItem(null)} onConfirm={handleConfirm} />
      )}
    </AppLayout>
  );
}
