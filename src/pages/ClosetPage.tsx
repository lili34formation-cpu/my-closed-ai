import { useState, useMemo, useRef } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useCloset, uploadClothingPhoto } from "@/hooks/useCloset";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CATEGORIES, SEASONS, STYLES, COLORS, Category, Season, Style, Color } from "@/types/closet";
import { Plus, Trash2, Heart, Shirt, Search, Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const emptyForm = () => ({
  name: '',
  brand: '',
  category: 'Hauts' as Category,
  color: 'Noir' as Color,
  style: 'Casual' as Style,
  season: 'Toutes saisons' as Season,
  image_url: '',
  favorite: false,
  last_worn: undefined,
});

export default function ClosetPage() {
  const { items, loading, addItem, deleteItem, toggleFavorite } = useCloset();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setPhotoPreview(URL.createObjectURL(file));
    setUploadingPhoto(true);
    const url = await uploadClothingPhoto(file, user.id);
    if (url) setForm(f => ({ ...f, image_url: url }));
    setUploadingPhoto(false);
  };

  const handleSave = async () => {
    if (!form.name) { toast.error('Nom requis'); return; }
    await addItem(form);
    setForm(emptyForm());
    setPhotoPreview(null);
    setOpen(false);
  };

  const filtered = useMemo(() => items.filter(i => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'all' || i.category === filterCat;
    return matchSearch && matchCat;
  }), [items, search, filterCat]);

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-8 pt-2">
        <h1 className="font-display text-5xl font-light text-foreground tracking-wide">Dressing</h1>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mt-2">
          {items.length} pièce{items.length !== 1 ? 's' : ''} · {items.filter(i => i.favorite).length} favori{items.filter(i => i.favorite).length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-8">
        {[
          { label: 'Total', value: items.length },
          { label: 'Favoris', value: items.filter(i => i.favorite).length },
          { label: 'Catég.', value: [...new Set(items.map(i => i.category))].length },
          { label: 'Portés', value: items.filter(i => i.worn_count > 0).length },
        ].map(stat => (
          <div key={stat.label} className="border border-border rounded-xl p-3 text-center">
            <p className="font-display text-2xl font-light text-foreground">{stat.value}</p>
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recherche + filtres */}
      <div className="mb-6 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground stroke-[1.5]" />
          <input
            placeholder="Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-transparent border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/30 transition-colors"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
          {['all', ...CATEGORIES].map(c => (
            <button key={c} onClick={() => setFilterCat(c)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] uppercase tracking-widest transition-all ${
                filterCat === c
                  ? 'bg-foreground text-background'
                  : 'border border-border text-muted-foreground hover:border-foreground/30'
              }`}>
              {c === 'all' ? 'Tous' : c}
            </button>
          ))}
        </div>
      </div>

      {/* Grille */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-6 w-6 border border-foreground border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Shirt className="h-10 w-10 text-muted-foreground/20 stroke-[1] mb-4" />
          <p className="text-sm text-muted-foreground font-light">Dressing vide</p>
          <p className="text-xs text-muted-foreground/50 mt-1">Ajoutez vos premières pièces</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map(item => (
            <div key={item.id} className="group relative bg-card border border-border rounded-2xl overflow-hidden">
              <div className="aspect-[3/4] relative">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Shirt className="h-10 w-10 text-muted-foreground/20 stroke-[1]" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => toggleFavorite(item)}
                    className="w-7 h-7 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center">
                    <Heart className={`h-3.5 w-3.5 ${item.favorite ? 'fill-foreground text-foreground' : 'text-foreground stroke-[1.5]'}`} />
                  </button>
                  <button onClick={() => deleteItem(item.id)}
                    className="w-7 h-7 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center">
                    <Trash2 className="h-3 w-3 text-destructive stroke-[1.5]" />
                  </button>
                </div>
                {item.worn_count > 0 && (
                  <div className="absolute bottom-2 left-2">
                    <span className="text-[9px] uppercase tracking-widest px-2 py-1 bg-background/70 backdrop-blur-sm text-foreground/70 rounded-full">{item.worn_count}×</span>
                  </div>
                )}
                {item.favorite && (
                  <div className="absolute top-2 left-2">
                    <Heart className="h-3 w-3 fill-foreground text-foreground" />
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                {item.brand && <p className="text-[10px] gold uppercase tracking-widest truncate mt-0.5">{item.brand}</p>}
                <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide">{item.color} · {item.category}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button className="fixed bottom-24 right-5 z-50 w-12 h-12 rounded-full bg-foreground text-background shadow-lg flex items-center justify-center hover:bg-foreground/90 transition-colors">
            <Plus className="h-5 w-5 stroke-[1.5]" />
          </button>
        </DialogTrigger>
        <DialogContent className="bg-card border-border text-foreground max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-light tracking-wide">Nouvelle pièce</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            {/* Photo */}
            <div>
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoChange} />
              {photoPreview ? (
                <div className="relative rounded-xl overflow-hidden">
                  <img src={photoPreview} alt="Aperçu" className="w-full h-52 object-cover" />
                  {uploadingPhoto && (
                    <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-foreground" />
                    </div>
                  )}
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-sm text-foreground text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full">
                    Changer
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="w-full h-40 rounded-xl border border-dashed border-border flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-foreground/20 transition-colors">
                  <Camera className="h-6 w-6 stroke-[1]" />
                  <span className="text-[10px] uppercase tracking-widest">Photo</span>
                </button>
              )}
            </div>

            {/* Nom + Marque */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">Nom *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Jean slim..."
                  className="w-full bg-transparent border-b border-border text-foreground text-sm placeholder:text-muted-foreground/40 py-2 focus:outline-none focus:border-foreground/40 transition-colors" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">Marque</label>
                <input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })}
                  placeholder="Zara, H&M..."
                  className="w-full bg-transparent border-b border-border text-foreground text-sm placeholder:text-muted-foreground/40 py-2 focus:outline-none focus:border-foreground/40 transition-colors" />
              </div>
            </div>

            {/* Selects */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Catégorie', key: 'category', options: CATEGORIES },
                { label: 'Couleur', key: 'color', options: COLORS },
                { label: 'Style', key: 'style', options: STYLES },
                { label: 'Saison', key: 'season', options: SEASONS },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">{field.label}</label>
                  <Select value={(form as any)[field.key]} onValueChange={v => setForm({ ...form, [field.key]: v })}>
                    <SelectTrigger className="bg-transparent border-b border-t-0 border-x-0 border-border rounded-none text-sm text-foreground h-9 px-0 focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {field.options.map(o => <SelectItem key={o} value={o} className="text-foreground text-sm">{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <button onClick={handleSave} disabled={uploadingPhoto}
              className="w-full h-12 bg-foreground text-background text-xs uppercase tracking-[0.2em] hover:bg-foreground/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 rounded-xl">
              {uploadingPhoto ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Ajouter au dressing
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
