import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, LogOut, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MORPHOTYPES = [
  {
    value: 'sablier',
    label: 'Sablier',
    emoji: '⌛',
    description: 'Épaules et hanches équilibrées, taille marquée',
    tips: 'Mets en valeur ta taille avec des ceintures et des pièces ajustées',
  },
  {
    value: 'poire',
    label: 'Poire',
    emoji: '🍐',
    description: 'Hanches plus larges que les épaules',
    tips: 'Élargis visuellement le haut avec des cols larges et des hauts structurés',
  },
  {
    value: 'rectangle',
    label: 'Rectangle',
    emoji: '▭',
    description: 'Épaules, taille et hanches similaires',
    tips: 'Crée des courbes avec des pièces froncées et des ceintures marquées',
  },
  {
    value: 'pomme',
    label: 'Pomme',
    emoji: '🍎',
    description: 'Ventre plus large, épaules et hanches étroites',
    tips: 'Mise sur des coupes fluides et des lignes verticales allongeantes',
  },
  {
    value: 'triangle_inverse',
    label: 'Triangle inversé',
    emoji: '🔺',
    description: 'Épaules plus larges que les hanches',
    tips: 'Équilibre avec des bas à volume et des hauts simples',
  },
];

export default function ProfilePage() {
  const { user } = useAuth();
  const { profile, saveProfile } = useProfile();
  const [firstName, setFirstName] = useState('');
  const [height, setHeight] = useState('');
  const [morphotype, setMorphotype] = useState('');

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name ?? '');
      setHeight(profile.height ? String(profile.height) : '');
      setMorphotype(profile.morphotype ?? '');
    }
  }, [profile]);

  const handleSave = async () => {
    await saveProfile({
      first_name: firstName || null,
      height: height ? parseInt(height) : null,
      morphotype: morphotype || null,
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Déconnecté');
  };

  const selectedMorphotype = MORPHOTYPES.find(m => m.value === morphotype);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Mon Profil</h1>
          <p className="text-muted-foreground text-sm mt-1">{user?.email}</p>
        </div>

        {/* Infos de base */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
          <p className="text-sm font-semibold text-foreground">Informations</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-foreground text-xs">Prénom</Label>
              <Input
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="Ex: Marie"
                className="mt-1 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <Label className="text-foreground text-xs">Taille (cm)</Label>
              <Input
                type="number"
                value={height}
                onChange={e => setHeight(e.target.value)}
                placeholder="Ex: 165"
                className="mt-1 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </div>

        {/* Morphotype */}
        <div>
          <p className="text-sm font-semibold text-foreground mb-1">Mon morphotype</p>
          <p className="text-xs text-muted-foreground mb-3">L'IA adapte ses suggestions à ta silhouette</p>
          <div className="space-y-2">
            {MORPHOTYPES.map(m => (
              <button
                key={m.value}
                onClick={() => setMorphotype(m.value)}
                className={`w-full flex items-start gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                  morphotype === m.value
                    ? 'border-primary bg-accent'
                    : 'border-border bg-card hover:border-primary/40'
                }`}
              >
                <span className="text-3xl shrink-0">{m.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground">{m.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>
                  {morphotype === m.value && (
                    <p className="text-xs text-primary font-medium mt-1.5">💡 {m.tips}</p>
                  )}
                </div>
                {morphotype === m.value && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Conseil morphotype sélectionné */}
        {selectedMorphotype && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-900/40 to-pink-900/20 border border-purple-800/30">
            <p className="text-xs font-semibold text-purple-300 mb-1">✨ Conseil pour ton morphotype {selectedMorphotype.label}</p>
            <p className="text-sm text-foreground">{selectedMorphotype.tips}</p>
          </div>
        )}

        {/* Sauvegarder */}
        <Button
          onClick={handleSave}
          className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl flex items-center gap-2"
        >
          <Save className="h-4 w-4" />Sauvegarder mon profil
        </Button>

        {/* Déconnexion */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors text-sm"
        >
          <LogOut className="h-4 w-4" />Déconnexion
        </button>
      </div>
    </AppLayout>
  );
}
