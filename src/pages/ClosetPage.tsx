import { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useCloset } from "@/hooks/useCloset";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ClothingItem, CATEGORIES, SEASONS, STYLES, COLORS, Category, Season, Style, Color } from "@/types/closet";
import { Plus, Trash2, Heart, Shirt, Search } from "lucide-react";
import { toast } from "sonner";

const CATEGORY_COLORS: Record<string, string> = {
  'Hauts': 'bg-blue-100 text-blue-700',
  'Bas': 'bg-indigo-100 text-indigo-700',
  'Robes & Combinaisons': 'bg-pink-100 text-pink-700',
  'Vestes & Manteaux': 'bg-gray-100 text-gray-700',
  'Chaussures': 'bg-amber-100 text-amber-700',
  'Accessoires': 'bg-purple-100 text-purple-700',
};

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
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');

  const filtered = useMemo(() => items.filter(i => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'all' || i.category === filterCat;
    return matchSearch && matchCat;
  }), [items, search, filterCat]);

  const handleSave = async () => {
    if (!form.name) return;
    await addItem(form);
    setForm(emptyForm());
    setOpen(false);
  };

  const stats = {
    total: items.length,
    favorites: items.filter(i => i.favorite).length,
    categories: CATEGORIES.filter(c => items.some(i => i.category === c)).length,
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Mon Dressing</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{stats.total} vêtement{stats.total > 1 ? 's' : ''} · {stats.favorites} favori{stats.favorites > 1 ? 's' : ''}</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-2" />Ajouter</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nouveau vêtement</DialogTitle></DialogHeader>
              <div className="grid gap-3 py-2">
                <div>
                  <Label>Nom</Label>
                  <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Jean slim bleu" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Catégorie</Label>
                    <Select value={form.category} onValueChange={v => setForm({ ...form, category: v as Category })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Couleur</Label>
                    <Select value={form.color} onValueChange={v => setForm({ ...form, color: v as Color })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{COLORS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Style</Label>
                    <Select value={form.style} onValueChange={v => setForm({ ...form, style: v as Style })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{STYLES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Saison</Label>
                    <Select value={form.season} onValueChange={v => setForm({ ...form, season: v as Season })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{SEASONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>URL photo (optionnel)</Label>
                  <Input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
                </div>
                <Button onClick={handleSave} className="w-full">Ajouter au dressing</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-t-4 border-t-purple-500">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-2xl font-bold mt-0.5">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="border-t-4 border-t-pink-500">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">Favoris</p>
              <p className="text-2xl font-bold mt-0.5">{stats.favorites}</p>
            </CardContent>
          </Card>
          <Card className="border-t-4 border-t-indigo-500">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">Catégories</p>
              <p className="text-2xl font-bold mt-0.5">{stats.categories}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <div className="flex gap-2 flex-wrap items-center">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={() => setFilterCat('all')} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filterCat === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
              Tous
            </button>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setFilterCat(c)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filterCat === c ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Grille vêtements */}
        {loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Shirt className="h-12 w-12 mx-auto mb-4 text-muted-foreground/25" />
              <p className="font-medium text-muted-foreground">Aucun vêtement</p>
              <p className="text-sm text-muted-foreground mt-1">Commencez par ajouter vos vêtements</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filtered.map(item => (
              <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
                {item.image_url ? (
                  <div className="aspect-square bg-muted">
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="aspect-square bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
                    <Shirt className="h-10 w-10 text-purple-300" />
                  </div>
                )}
                <CardContent className="p-3">
                  <p className="font-medium text-sm truncate">{item.name}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${CATEGORY_COLORS[item.category] || 'bg-gray-100 text-gray-700'}`}>
                      {item.category}
                    </span>
                    <div className="flex gap-1">
                      <button onClick={() => toggleFavorite(item)} className={`p-1 rounded-full transition-colors ${item.favorite ? 'text-pink-500' : 'text-muted-foreground hover:text-pink-400'}`}>
                        <Heart className={`h-3.5 w-3.5 ${item.favorite ? 'fill-current' : ''}`} />
                      </button>
                      <button onClick={() => deleteItem(item.id)} className="p-1 rounded-full text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{item.color} · {item.style}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
