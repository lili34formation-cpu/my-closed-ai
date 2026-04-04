import { useState, useMemo, useRef } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useCloset, uploadClothingPhoto } from "@/hooks/useCloset";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CATEGORIES, SEASONS, STYLES, COLORS, Category, Season, Style, Color } from "@/types/closet";
import { Plus, Trash2, Heart, Shirt, Search, Camera, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const emptyForm = () => ({
  name: '',
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
    if (!form.name) { toast.error('Donne un nom au vêtement'); return; }
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
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-foreground">Mon Dressing</h1>
        <p className="text-muted-foreground text-sm mt-1">
          <span className="text-primary font-semibold">{items.length}</span> pièces ·{" "}
          <span className="text-pink-400 font-semibold">{items.filter(i => i.favorite).length}</span> favoris
        </p>
      </div>

      {/* Stats bar */}
      <div className="flex gap-3 mb-6 overflow-x-auto pb-1 scrollbar-none">
        {[
          { label: 'Total', value: items.length, color: 'from-purple-600 to-violet-600' },
          { label: 'Favoris', value: items.filter(i => i.favorite).length, color: 'from-pink-600 to-rose-600' },
          { label: 'Catégories', value: [...new Set(items.map(i => i.category))].length, color: 'from-indigo-600 to-blue-600' },
          { label: 'Portés', value: items.filter(i => i.worn_count > 0).length, color: 'from-emerald-600 to-teal-600' },
        ].map(stat => (
          <div key={stat.label} className={`shrink-0 bg-gradient-to-br ${stat.color} rounded-2xl px-4 py-3 min-w-[80px] text-center`}>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-[11px] text-white/70 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recherche & filtres */}
      <div className="mb-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un vêtement..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-card border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setFilterCat('all')}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterCat === 'all' ? 'bg-primary text-white' : 'bg-card text-muted-foreground border border-border'}`}
          >
            Tous
          </button>
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setFilterCat(c)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterCat === c ? 'bg-primary text-white' : 'bg-card text-muted-foreground border border-border'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Grille */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-card border border-border flex items-center justify-center mb-4">
            <Shirt className="h-9 w-9 text-muted-foreground" />
          </div>
          <p className="font-semibold text-foreground">Dressing vide</p>
          <p className="text-sm text-muted-foreground mt-1">Ajoute tes premiers vêtements</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map(item => (
            <div key={item.id} className="group relative bg-card rounded-2xl overflow-hidden border border-border">
              {/* Photo */}
              <div className="aspect-[3/4] relative">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-900/40 to-pink-900/20 flex items-center justify-center">
                    <Shirt className="h-12 w-12 text-purple-400/40" />
                  </div>
                )}
                {/* Overlay actions */}
                <div className="absolute top-2 right-2 flex flex-col gap-1.5">
                  <button
                    onClick={() => toggleFavorite(item)}
                    className="w-8 h-8 rounded-full glass flex items-center justify-center"
                  >
                    <Heart className={`h-4 w-4 ${item.favorite ? 'fill-pink-500 text-pink-500' : 'text-white'}`} />
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="w-8 h-8 rounded-full glass flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-400" />
                  </button>
                </div>
                {item.worn_count > 0 && (
                  <div className="absolute bottom-2 left-2">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full glass text-white">{item.worn_count}x porté</span>
                  </div>
                )}
              </div>
              {/* Infos */}
              <div className="p-3">
                <p className="font-semibold text-sm truncate text-foreground">{item.name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{item.color} · {item.category}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAB Ajouter */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button className="fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg shadow-purple-900/50 flex items-center justify-center hover:scale-105 transition-transform">
            <Plus className="h-6 w-6 text-white" />
          </button>
        </DialogTrigger>
        <DialogContent className="bg-card border-border text-foreground max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Nouveau vêtement
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Photo */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoChange}
              />
              {photoPreview ? (
                <div className="relative rounded-2xl overflow-hidden">
                  <img src={photoPreview} alt="Aperçu" className="w-full h-52 object-cover" />
                  {uploadingPhoto && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-3 right-3 glass text-white text-xs font-medium px-3 py-1.5 rounded-full"
                  >
                    Changer
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-44 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
                    <Camera className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Prendre une photo</p>
                    <p className="text-xs mt-0.5">ou choisir dans la galerie</p>
                  </div>
                </button>
              )}
            </div>

            {/* Nom */}
            <div>
              <Label className="text-foreground">Nom du vêtement</Label>
              <Input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Jean slim noir"
                className="mt-1 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-foreground">Catégorie</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v as Category })}>
                  <SelectTrigger className="mt-1 bg-secondary border-border text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border">{CATEGORIES.map(c => <SelectItem key={c} value={c} className="text-foreground">{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-foreground">Couleur</Label>
                <Select value={form.color} onValueChange={v => setForm({ ...form, color: v as Color })}>
                  <SelectTrigger className="mt-1 bg-secondary border-border text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border">{COLORS.map(c => <SelectItem key={c} value={c} className="text-foreground">{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-foreground">Style</Label>
                <Select value={form.style} onValueChange={v => setForm({ ...form, style: v as Style })}>
                  <SelectTrigger className="mt-1 bg-secondary border-border text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border">{STYLES.map(s => <SelectItem key={s} value={s} className="text-foreground">{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-foreground">Saison</Label>
                <Select value={form.season} onValueChange={v => setForm({ ...form, season: v as Season })}>
                  <SelectTrigger className="mt-1 bg-secondary border-border text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border">{SEASONS.map(s => <SelectItem key={s} value={s} className="text-foreground">{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={uploadingPhoto}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl h-12"
            >
              {uploadingPhoto ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Ajouter au dressing
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
