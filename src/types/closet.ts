export type Category = 'Hauts' | 'Bas' | 'Robes & Combinaisons' | 'Vestes & Manteaux' | 'Chaussures' | 'Accessoires';
export type Season = 'Printemps' | 'Été' | 'Automne' | 'Hiver' | 'Toutes saisons';
export type Style = 'Casual' | 'Professionnel' | 'Sport' | 'Soirée' | 'Décontracté';
export type Color = 'Blanc' | 'Noir' | 'Gris' | 'Bleu' | 'Rouge' | 'Vert' | 'Jaune' | 'Rose' | 'Orange' | 'Marron' | 'Beige' | 'Violet' | 'Autre';

export const CATEGORIES: Category[] = ['Hauts', 'Bas', 'Robes & Combinaisons', 'Vestes & Manteaux', 'Chaussures', 'Accessoires'];
export const SEASONS: Season[] = ['Printemps', 'Été', 'Automne', 'Hiver', 'Toutes saisons'];
export const STYLES: Style[] = ['Casual', 'Professionnel', 'Sport', 'Soirée', 'Décontracté'];
export const COLORS: Color[] = ['Blanc', 'Noir', 'Gris', 'Bleu', 'Rouge', 'Vert', 'Jaune', 'Rose', 'Orange', 'Marron', 'Beige', 'Violet', 'Autre'];

export const MOODS = [
  { value: 'joyeux', label: 'Joyeux', emoji: '😄' },
  { value: 'decontracte', label: 'Décontracté', emoji: '😌' },
  { value: 'fatigue', label: 'Fatigué', emoji: '😴' },
  { value: 'professionnel', label: 'Pro & motivé', emoji: '💼' },
  { value: 'festif', label: 'Festif', emoji: '🎉' },
  { value: 'bad_trip', label: 'Bad trip', emoji: '😤' },
  { value: 'romantique', label: 'Romantique', emoji: '🥰' },
  { value: 'sportif', label: 'Sportif', emoji: '💪' },
];

export const PLANNING_TYPES = [
  { value: 'reunion', label: 'Réunion / Travail', emoji: '👔' },
  { value: 'journee_off', label: 'Journée off', emoji: '🏖️' },
  { value: 'soiree', label: 'Soirée', emoji: '🥂' },
  { value: 'sport', label: 'Sport', emoji: '🏃' },
  { value: 'sortie', label: 'Sortie / Shopping', emoji: '🛍️' },
  { value: 'teletravail', label: 'Télétravail', emoji: '💻' },
  { value: 'rando', label: 'Rando / Nature', emoji: '🌿' },
  { value: 'autre', label: 'Autre', emoji: '📅' },
];

export interface ClothingItem {
  id: string;
  user_id: string;
  name: string;
  category: Category;
  color: Color;
  style: Style;
  season: Season;
  image_url?: string;
  favorite: boolean;
  worn_count: number;
  last_worn?: string;
  created_at: string;
}

export interface OutfitSuggestion {
  items: ClothingItem[];
  reasoning: string;
  mood: string;
  planning: string;
  weather?: string;
}
