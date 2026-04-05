export type Category = 'Hauts' | 'Bas' | 'Robes & Combinaisons' | 'Vestes & Manteaux' | 'Chaussures' | 'Accessoires';
export type Season = 'Printemps' | 'Été' | 'Automne' | 'Hiver' | 'Toutes saisons';
export type Style = 'Casual' | 'Professionnel' | 'Sport' | 'Soirée' | 'Décontracté';
export type Color = 'Blanc' | 'Noir' | 'Gris' | 'Bleu' | 'Rouge' | 'Vert' | 'Jaune' | 'Rose' | 'Orange' | 'Marron' | 'Beige' | 'Violet' | 'Autre';

export const CATEGORIES: Category[] = ['Hauts', 'Bas', 'Robes & Combinaisons', 'Vestes & Manteaux', 'Chaussures', 'Accessoires'];
export const SEASONS: Season[] = ['Printemps', 'Été', 'Automne', 'Hiver', 'Toutes saisons'];
export const STYLES: Style[] = ['Casual', 'Professionnel', 'Sport', 'Soirée', 'Décontracté'];
export const COLORS: Color[] = ['Blanc', 'Noir', 'Gris', 'Bleu', 'Rouge', 'Vert', 'Jaune', 'Rose', 'Orange', 'Marron', 'Beige', 'Violet', 'Autre'];

export const MOODS = [
  { value: 'joyeux', label: 'Joyeux' },
  { value: 'decontracte', label: 'Décontracté' },
  { value: 'fatigue', label: 'Fatigué' },
  { value: 'professionnel', label: 'Pro & motivé' },
  { value: 'festif', label: 'Festif' },
  { value: 'bad_trip', label: 'Bad trip' },
  { value: 'romantique', label: 'Romantique' },
  { value: 'sportif', label: 'Sportif' },
];

export const PLANNING_TYPES = [
  { value: 'reunion', label: 'Réunion / Travail' },
  { value: 'journee_off', label: 'Journée off' },
  { value: 'soiree', label: 'Soirée' },
  { value: 'sport', label: 'Sport' },
  { value: 'sortie', label: 'Sortie / Shopping' },
  { value: 'teletravail', label: 'Télétravail' },
  { value: 'rando', label: 'Rando / Nature' },
  { value: 'autre', label: 'Autre' },
];

export const CONDITIONS = ['Neuf', 'Très bon état', 'Bon état', 'État correct'] as const;
export type Condition = typeof CONDITIONS[number];

export interface ClothingItem {
  id: string;
  user_id: string;
  name: string;
  brand?: string;
  category: Category;
  color: Color;
  style: Style;
  season: Season;
  image_url?: string;
  favorite: boolean;
  worn_count: number;
  last_worn?: string;
  created_at: string;
  for_sale?: boolean;
  price?: number | null;
  condition?: Condition | null;
}

export interface OutfitSuggestion {
  items: ClothingItem[];
  reasoning: string;
  mood: string;
  planning: string;
  weather?: string;
}
