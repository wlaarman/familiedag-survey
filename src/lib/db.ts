import { sql } from '@vercel/postgres';
import { SurveyData, SurveyResponse } from '@/types/survey';

export async function createTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS survey_responses (
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMP DEFAULT NOW(),
      naam_1 VARCHAR(255) NOT NULL,
      geboortedatum_1 DATE NOT NULL,
      adres TEXT NOT NULL,
      foto_1_url TEXT,
      foto_1_later BOOLEAN DEFAULT FALSE,
      heeft_partner BOOLEAN DEFAULT FALSE,
      naam_2 VARCHAR(255),
      geboortedatum_2 DATE,
      foto_2_url TEXT,
      foto_2_later BOOLEAN DEFAULT FALSE,
      is_getrouwd VARCHAR(10),
      trouwdatum DATE,
      werk_1 TEXT,
      werk_2 TEXT,
      opleiding_1 VARCHAR(50),
      opleiding_2 VARCHAR(50),
      bijbaantjes_1 TEXT,
      bijbaantjes_2 TEXT,
      basisschool_1 VARCHAR(255),
      basisschool_2 VARCHAR(255),
      bijnaam_1 VARCHAR(100),
      bijnaam_2 VARCHAR(100),
      heeft_huisdieren BOOLEAN,
      huisdieren_info TEXT,
      sport_1 TEXT,
      sport_2 TEXT,
      muziek_1 TEXT,
      muziek_2 TEXT,
      vrijwilligerswerk_1 TEXT,
      vrijwilligerswerk_2 TEXT,
      auto_1 VARCHAR(255),
      auto_2 VARCHAR(255),
      vakantieland_1 VARCHAR(255),
      vakantieland_2 VARCHAR(255),
      gerecht_1 VARCHAR(255),
      gerecht_2 VARCHAR(255),
      drank_1 VARCHAR(255),
      drank_2 VARCHAR(255),
      koffie_thee_1 VARCHAR(10),
      koffie_thee_2 VARCHAR(10),
      aardappel_pasta_1 VARCHAR(15),
      aardappel_pasta_2 VARCHAR(15),
      vlees_vis_1 VARCHAR(10),
      vlees_vis_2 VARCHAR(10),
      zomer_winter_1 VARCHAR(10),
      zomer_winter_2 VARCHAR(10),
      hond_kat_1 VARCHAR(10),
      hond_kat_2 VARCHAR(10),
      zwembad_zee_1 VARCHAR(10),
      zwembad_zee_2 VARCHAR(10),
      auto_fiets_1 VARCHAR(10),
      auto_fiets_2 VARCHAR(10),
      schoenmaat_1 VARCHAR(10),
      schoenmaat_2 VARCHAR(10),
      dieet_1 TEXT,
      dieet_2 TEXT,
      anekdote TEXT,
      angst_1 TEXT,
      angst_2 TEXT,
      prijs_medaille_1 TEXT,
      prijs_medaille_2 TEXT
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS admin_sessions (
      id SERIAL PRIMARY KEY,
      session_token VARCHAR(255) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      expires_at TIMESTAMP NOT NULL
    )
  `;

  // Add new columns to existing tables (safe to run multiple times)
  await sql`ALTER TABLE survey_responses ADD COLUMN IF NOT EXISTS dieet_1 TEXT`;
  await sql`ALTER TABLE survey_responses ADD COLUMN IF NOT EXISTS dieet_2 TEXT`;

  // Custom logos table for logo quiz
  await sql`
    CREATE TABLE IF NOT EXISTS custom_logos (
      id SERIAL PRIMARY KEY,
      bedrijf_naam VARCHAR(255) UNIQUE NOT NULL,
      logo_url TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Streetview quiz table
  await sql`
    CREATE TABLE IF NOT EXISTS streetview_quiz (
      id SERIAL PRIMARY KEY,
      question_number INTEGER NOT NULL,
      response_id INTEGER,
      blob_url TEXT NOT NULL,
      blob_url_hard TEXT,
      address TEXT NOT NULL,
      names TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`ALTER TABLE streetview_quiz ADD COLUMN IF NOT EXISTS blob_url_hard TEXT`;

  // Logo selection table
  await sql`
    CREATE TABLE IF NOT EXISTS logo_selection (
      id SERIAL PRIMARY KEY,
      bedrijf_naam VARCHAR(255) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Feit of fabel table
  await sql`
    CREATE TABLE IF NOT EXISTS feit_of_fabel (
      id SERIAL PRIMARY KEY,
      stelling TEXT NOT NULL,
      is_waar BOOLEAN NOT NULL,
      toelichting TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  // Add toelichting column if not exists (migration)
  await sql`ALTER TABLE feit_of_fabel ADD COLUMN IF NOT EXISTS toelichting TEXT`;

  // Participants table for groepsindeling
  await sql`
    CREATE TABLE IF NOT EXISTS participants (
      id SERIAL PRIMARY KEY,
      naam VARCHAR(255) NOT NULL,
      familie VARCHAR(100) NOT NULL,
      gezin VARCHAR(100),
      generatie INTEGER NOT NULL,
      geslacht VARCHAR(1) NOT NULL,
      groep INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
}

export async function insertSurveyResponse(data: SurveyData): Promise<number> {
  const result = await sql`
    INSERT INTO survey_responses (
      naam_1, geboortedatum_1, adres, foto_1_url, foto_1_later,
      heeft_partner, naam_2, geboortedatum_2, foto_2_url, foto_2_later,
      is_getrouwd, trouwdatum,
      werk_1, werk_2, opleiding_1, opleiding_2,
      bijbaantjes_1, bijbaantjes_2,
      basisschool_1, basisschool_2, bijnaam_1, bijnaam_2,
      heeft_huisdieren, huisdieren_info,
      sport_1, sport_2, muziek_1, muziek_2,
      vrijwilligerswerk_1, vrijwilligerswerk_2,
      auto_1, auto_2,
      vakantieland_1, vakantieland_2,
      gerecht_1, gerecht_2, drank_1, drank_2,
      koffie_thee_1, koffie_thee_2,
      aardappel_pasta_1, aardappel_pasta_2,
      vlees_vis_1, vlees_vis_2,
      zomer_winter_1, zomer_winter_2,
      hond_kat_1, hond_kat_2,
      zwembad_zee_1, zwembad_zee_2,
      auto_fiets_1, auto_fiets_2,
      schoenmaat_1, schoenmaat_2,
      dieet_1, dieet_2,
      anekdote, angst_1, angst_2,
      prijs_medaille_1, prijs_medaille_2
    ) VALUES (
      ${data.naam_1}, ${data.geboortedatum_1}, ${data.adres}, ${data.foto_1_url || null}, ${data.foto_1_later || false},
      ${data.heeft_partner}, ${data.naam_2 || null}, ${data.geboortedatum_2 || null}, ${data.foto_2_url || null}, ${data.foto_2_later || false},
      ${data.is_getrouwd || null}, ${data.trouwdatum || null},
      ${data.werk_1 || null}, ${data.werk_2 || null}, ${data.opleiding_1 || null}, ${data.opleiding_2 || null},
      ${data.bijbaantjes_1 || null}, ${data.bijbaantjes_2 || null},
      ${data.basisschool_1 || null}, ${data.basisschool_2 || null}, ${data.bijnaam_1 || null}, ${data.bijnaam_2 || null},
      ${data.heeft_huisdieren || null}, ${data.huisdieren_info || null},
      ${data.sport_1 || null}, ${data.sport_2 || null}, ${data.muziek_1 || null}, ${data.muziek_2 || null},
      ${data.vrijwilligerswerk_1 || null}, ${data.vrijwilligerswerk_2 || null},
      ${data.auto_1 || null}, ${data.auto_2 || null},
      ${data.vakantieland_1 || null}, ${data.vakantieland_2 || null},
      ${data.gerecht_1 || null}, ${data.gerecht_2 || null}, ${data.drank_1 || null}, ${data.drank_2 || null},
      ${data.koffie_thee_1 || null}, ${data.koffie_thee_2 || null},
      ${data.aardappel_pasta_1 || null}, ${data.aardappel_pasta_2 || null},
      ${data.vlees_vis_1 || null}, ${data.vlees_vis_2 || null},
      ${data.zomer_winter_1 || null}, ${data.zomer_winter_2 || null},
      ${data.hond_kat_1 || null}, ${data.hond_kat_2 || null},
      ${data.zwembad_zee_1 || null}, ${data.zwembad_zee_2 || null},
      ${data.auto_fiets_1 || null}, ${data.auto_fiets_2 || null},
      ${data.schoenmaat_1 || null}, ${data.schoenmaat_2 || null},
      ${data.dieet_1 || null}, ${data.dieet_2 || null},
      ${data.anekdote || null}, ${data.angst_1 || null}, ${data.angst_2 || null},
      ${data.prijs_medaille_1 || null}, ${data.prijs_medaille_2 || null}
    )
    RETURNING id
  `;
  return result.rows[0].id;
}

export async function getAllResponses(): Promise<SurveyResponse[]> {
  const result = await sql`
    SELECT * FROM survey_responses ORDER BY created_at DESC
  `;
  return result.rows as SurveyResponse[];
}

export async function deleteResponse(id: number): Promise<void> {
  await sql`DELETE FROM survey_responses WHERE id = ${id}`;
}

export async function updateResponsePhoto(id: number, field: 'foto_1_url' | 'foto_2_url', url: string | null): Promise<void> {
  if (field === 'foto_1_url') {
    await sql`UPDATE survey_responses SET foto_1_url = ${url}, foto_1_later = false WHERE id = ${id}`;
  } else {
    await sql`UPDATE survey_responses SET foto_2_url = ${url}, foto_2_later = false WHERE id = ${id}`;
  }
}

// Custom logos functions
export async function getCustomLogos(): Promise<Record<string, string>> {
  const result = await sql`SELECT bedrijf_naam, logo_url FROM custom_logos`;
  const logos: Record<string, string> = {};
  for (const row of result.rows) {
    logos[row.bedrijf_naam] = row.logo_url;
  }
  return logos;
}

export async function setCustomLogo(bedrijfNaam: string, logoUrl: string): Promise<void> {
  await sql`
    INSERT INTO custom_logos (bedrijf_naam, logo_url)
    VALUES (${bedrijfNaam}, ${logoUrl})
    ON CONFLICT (bedrijf_naam)
    DO UPDATE SET logo_url = ${logoUrl}
  `;
}

export async function deleteCustomLogo(bedrijfNaam: string): Promise<void> {
  await sql`DELETE FROM custom_logos WHERE bedrijf_naam = ${bedrijfNaam}`;
}

// Streetview quiz functions
export interface StreetviewQuizItem {
  id: number;
  question_number: number;
  response_id: number | null;
  blob_url: string;
  blob_url_hard: string | null;
  blob_url_street: string | null;
  address: string;
  names: string;
}

export async function getStreetviewQuiz(): Promise<StreetviewQuizItem[]> {
  const result = await sql`SELECT * FROM streetview_quiz ORDER BY question_number ASC`;
  return result.rows as StreetviewQuizItem[];
}

// Feit of fabel functions
export interface FeitOfFabel {
  id: number;
  stelling: string;
  is_waar: boolean;
  toelichting: string | null;
  sort_order: number;
}

export async function getFeitOfFabel(): Promise<FeitOfFabel[]> {
  const result = await sql`SELECT id, stelling, is_waar, toelichting, sort_order FROM feit_of_fabel ORDER BY sort_order, id`;
  return result.rows as FeitOfFabel[];
}

export async function addFeitOfFabel(stelling: string, isWaar: boolean, toelichting?: string): Promise<number> {
  const maxOrder = await sql`SELECT COALESCE(MAX(sort_order), 0) + 1 as next FROM feit_of_fabel`;
  const nextOrder = maxOrder.rows[0].next;
  const result = await sql`
    INSERT INTO feit_of_fabel (stelling, is_waar, toelichting, sort_order)
    VALUES (${stelling}, ${isWaar}, ${toelichting || null}, ${nextOrder})
    RETURNING id
  `;
  return result.rows[0].id;
}

export async function updateFeitOfFabel(id: number, stelling: string, isWaar: boolean, toelichting?: string): Promise<void> {
  await sql`UPDATE feit_of_fabel SET stelling = ${stelling}, is_waar = ${isWaar}, toelichting = ${toelichting || null} WHERE id = ${id}`;
}

export async function deleteFeitOfFabel(id: number): Promise<void> {
  await sql`DELETE FROM feit_of_fabel WHERE id = ${id}`;
}

// Logo selection functions
export async function getLogoSelection(): Promise<string[]> {
  const result = await sql`SELECT bedrijf_naam FROM logo_selection ORDER BY bedrijf_naam`;
  return result.rows.map(r => r.bedrijf_naam);
}

export async function saveLogoSelection(namen: string[]): Promise<void> {
  await sql`DELETE FROM logo_selection`;
  for (const naam of namen) {
    await sql`INSERT INTO logo_selection (bedrijf_naam) VALUES (${naam})`;
  }
}

// Participants / groepsindeling
export interface Participant {
  id: number;
  naam: string;
  familie: string;
  gezin: string | null;
  generatie: number; // 1=jong, 2=oud
  geslacht: string;  // M/V
  groep: number | null;
  created_at: string;
}

export async function getParticipants(): Promise<Participant[]> {
  const result = await sql`SELECT * FROM participants ORDER BY familie, naam`;
  return result.rows as Participant[];
}

export async function updateParticipant(
  id: number,
  fields: Partial<Pick<Participant, 'naam' | 'familie' | 'gezin' | 'generatie' | 'geslacht'>>
): Promise<void> {
  if (fields.naam !== undefined) await sql`UPDATE participants SET naam = ${fields.naam} WHERE id = ${id}`;
  if (fields.familie !== undefined) await sql`UPDATE participants SET familie = ${fields.familie} WHERE id = ${id}`;
  if (fields.gezin !== undefined) await sql`UPDATE participants SET gezin = ${fields.gezin} WHERE id = ${id}`;
  if (fields.generatie !== undefined) await sql`UPDATE participants SET generatie = ${fields.generatie} WHERE id = ${id}`;
  if (fields.geslacht !== undefined) await sql`UPDATE participants SET geslacht = ${fields.geslacht} WHERE id = ${id}`;
}

export async function updateParticipantGroup(id: number, groep: number | null): Promise<void> {
  await sql`UPDATE participants SET groep = ${groep} WHERE id = ${id}`;
}

export async function updateAllParticipantGroups(assignments: { id: number; groep: number }[]): Promise<void> {
  // Reset all groups first
  await sql`UPDATE participants SET groep = NULL`;
  // Then assign
  for (const a of assignments) {
    await sql`UPDATE participants SET groep = ${a.groep} WHERE id = ${a.id}`;
  }
}
