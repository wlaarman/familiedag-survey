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
