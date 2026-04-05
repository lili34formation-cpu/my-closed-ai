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
    value: 'taille_marquee',
    label: 'Taille marquée',
    description: 'Silhouette équilibrée, taille naturellement cintrée',
    tips: 'Valorisez votre taille avec des pièces ajustées et des ceintures structurées',
  },
  {
    value: 'silhouette_sportive',
    label: 'Silhouette sportive',
    description: 'Carrure affirmée, ligne droite et athlétique',
    tips: 'Jouez sur les volumes asymétriques et les matières fluides pour créer de la féminité',
  },
  {
    value: 'ligne_droite',
    label: 'Ligne droite',
    description: 'Proportions harmonieuses sans courbes marquées',
    tips: 'Créez du relief avec des superpositions, des textures et des ceintures',
  },
  {
    value: 'hanches_marquees',
    label: 'Hanches marquées',
    description: 'Bas du corps plus affirmé, épaules plus fines',
    tips: 'Structurez le haut avec des épaulettes douces et des cols travaillés',
  },
  {
    value: 'epaules_affirmees',
    label: 'Épaules affirmées',
    description: 'Haut du corps plus large, bassin fin',
    tips: 'Équilibrez avec des coupes évasées en bas et des matières légères en haut',
  },
  {
    value: 'ronde_harmonieuse',
    label: 'Ronde & harmonieuse',
    description: 'Courbes généreuses et proportionnées',
    tips: 'Misez sur les lignes verticales, les coupes empire et les matières drapées',
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
          <h1 className="font-display text-5xl font-light text-foreground tracking-wide">Profil</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mt-2">{user?.email}</p>
        </div>

        {/* Infos de base */}
        <div className="border border-border rounded-xl p-4 space-y-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Informations</p>
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
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Ma silhouette</p>
          <p className="text-xs text-muted-foreground/60 font-light mb-4">L'IA adapte ses suggestions à votre morphologie</p>
          <div className="space-y-2">
            {MORPHOTYPES.map(m => (
              <button
                key={m.value}
                onClick={() => setMorphotype(m.value)}
                className={`w-full flex items-start justify-between gap-4 p-4 border transition-all text-left rounded-xl ${
                  morphotype === m.value
                    ? 'border-foreground/40 bg-accent'
                    : 'border-border hover:border-foreground/20'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium tracking-wide ${morphotype === m.value ? 'text-foreground' : 'text-foreground/80'}`}>
                    {m.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 font-light">{m.description}</p>
                  {morphotype === m.value && (
                    <p className="text-xs gold font-light mt-2 italic">{m.tips}</p>
                  )}
                </div>
                <div className={`w-4 h-4 rounded-full border shrink-0 mt-0.5 flex items-center justify-center ${
                  morphotype === m.value ? 'border-foreground bg-foreground' : 'border-border'
                }`}>
                  {morphotype === m.value && <div className="w-1.5 h-1.5 rounded-full bg-background" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Conseil morphotype sélectionné */}
        {selectedMorphotype && (
          <div className="p-4 border border-border rounded-xl">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Conseil styliste</p>
            <p className="text-sm text-foreground font-light italic">{selectedMorphotype.tips}</p>
          </div>
        )}

        {/* Sauvegarder */}
        <button onClick={handleSave}
          className="w-full h-12 bg-foreground text-background text-xs uppercase tracking-[0.2em] hover:bg-foreground/90 transition-colors flex items-center justify-center gap-2 rounded-xl">
          <Save className="h-3.5 w-3.5" />Sauvegarder
        </button>

        <button onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors text-[10px] uppercase tracking-widest rounded-xl">
          <LogOut className="h-3.5 w-3.5" />Déconnexion
        </button>
      </div>
    </AppLayout>
  );
}
