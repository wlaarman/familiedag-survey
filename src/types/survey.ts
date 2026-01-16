export interface SurveyData {
  // Person 1
  naam_1: string;
  geboortedatum_1: string;
  adres: string;
  foto_1_url?: string;
  foto_1_later?: boolean;

  // Partner flag
  heeft_partner: boolean;

  // Person 2 (optional)
  naam_2?: string;
  geboortedatum_2?: string;
  foto_2_url?: string;
  foto_2_later?: boolean;

  // Relationship
  is_getrouwd?: 'Ja' | 'Nee' | 'N.v.t.';
  trouwdatum?: string;

  // Work & Education
  werk_1?: string;
  werk_2?: string;
  opleiding_1?: string;
  opleiding_2?: string;
  bijbaantjes_1?: string;
  bijbaantjes_2?: string;

  // Childhood
  basisschool_1?: string;
  basisschool_2?: string;
  bijnaam_1?: string;
  bijnaam_2?: string;

  // Pets
  heeft_huisdieren?: boolean;
  huisdieren_info?: string;

  // Hobbies
  sport_1?: string;
  sport_2?: string;
  muziek_1?: string;
  muziek_2?: string;
  vrijwilligerswerk_1?: string;
  vrijwilligerswerk_2?: string;

  // Vehicles
  auto_1?: string;
  auto_2?: string;

  // Favorites
  vakantieland_1?: string;
  vakantieland_2?: string;
  gerecht_1?: string;
  gerecht_2?: string;
  drank_1?: string;
  drank_2?: string;

  // Preferences
  koffie_thee_1?: 'Koffie' | 'Thee';
  koffie_thee_2?: 'Koffie' | 'Thee';
  aardappel_pasta_1?: 'Aardappels' | 'Pasta';
  aardappel_pasta_2?: 'Aardappels' | 'Pasta';
  vlees_vis_1?: 'Vlees' | 'Vis';
  vlees_vis_2?: 'Vlees' | 'Vis';
  zomer_winter_1?: 'Zomer' | 'Winter';
  zomer_winter_2?: 'Zomer' | 'Winter';
  hond_kat_1?: 'Hond' | 'Kat';
  hond_kat_2?: 'Hond' | 'Kat';
  zwembad_zee_1?: 'Zwembad' | 'Zee';
  zwembad_zee_2?: 'Zwembad' | 'Zee';
  auto_fiets_1?: 'Auto' | 'Fiets';
  auto_fiets_2?: 'Auto' | 'Fiets';

  // Fun facts
  schoenmaat_1?: string;
  schoenmaat_2?: string;
  anekdote?: string;
  angst_1?: string;
  angst_2?: string;
  prijs_medaille_1?: string;
  prijs_medaille_2?: string;

  // Dietary preferences
  dieet_1?: string;
  dieet_2?: string;
}

export interface SurveyResponse extends SurveyData {
  id: number;
  created_at: string;
}

export const OPLEIDING_OPTIONS = [
  'Basisschool',
  'VMBO/MAVO',
  'HAVO/VWO',
  'MBO',
  'HBO',
  'WO',
  'Anders',
] as const;

export type OpleidingType = (typeof OPLEIDING_OPTIONS)[number];
