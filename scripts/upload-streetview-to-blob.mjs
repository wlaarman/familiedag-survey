import { sql } from '@vercel/postgres';
import { put } from '@vercel/blob';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const STREETVIEW_DIR = 'streetview-photos';
const HARD_DIR = join(STREETVIEW_DIR, 'hard');
const OVERZICHT_PATH = join(STREETVIEW_DIR, '_overzicht.json');

function normalizeAddress(addr) {
  return addr.toLowerCase().trim().replace(/[\s,]+/g, ' ');
}

function countNames(nameStr) {
  return nameStr.split('&').filter(s => s.trim().length > 0).length +
    nameStr.split('&').reduce((acc, part) => {
      return acc + part.trim().split(/\s+/).filter(w => w.length > 1).length;
    }, 0);
}

async function createTable() {
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
  console.log('✅ Tabel streetview_quiz aangemaakt/gecontroleerd');
}

async function uploadPhoto(filePath, prefix, filename) {
  const fileBuffer = readFileSync(filePath);
  const blobFilename = `streetview/${prefix}${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

  const blob = await put(blobFilename, fileBuffer, {
    access: 'public',
    contentType: 'image/jpeg',
  });

  return blob.url;
}

async function main() {
  const overzicht = JSON.parse(readFileSync(OVERZICHT_PATH, 'utf-8'));
  console.log(`📋 ${overzicht.length} entries geladen uit _overzicht.json`);

  // Deduplicate by address
  const addressGroups = new Map();
  for (const entry of overzicht) {
    const normalized = normalizeAddress(entry.address);
    if (!addressGroups.has(normalized)) {
      addressGroups.set(normalized, []);
    }
    addressGroups.get(normalized).push(entry);
  }

  console.log(`🏠 ${addressGroups.size} unieke adressen gevonden`);
  console.log('---');

  const deduplicated = [];
  for (const [addr, entries] of addressGroups) {
    if (entries.length > 1) {
      entries.sort((a, b) => countNames(b.name) - countNames(a.name));
      console.log(`  Duplicaat "${addr}": kies "${entries[0].name}" (van ${entries.length} entries)`);
    }
    deduplicated.push(entries[0]);
  }

  const hasHard = existsSync(HARD_DIR);
  console.log(`\n📸 ${deduplicated.length} foto's te uploaden ${hasHard ? '(normaal + moeilijk)' : '(alleen normaal)'}`);
  console.log('---');

  await createTable();

  await sql`DELETE FROM streetview_quiz`;
  console.log('🗑️  Bestaande quiz data gewist');

  let questionNumber = 1;
  for (const entry of deduplicated) {
    const filePath = join(STREETVIEW_DIR, entry.filename);
    const hardPath = join(HARD_DIR, entry.filename);
    console.log(`📤 #${questionNumber}: ${entry.name} (${entry.address})...`);

    try {
      const url = await uploadPhoto(filePath, '', entry.filename);
      console.log(`   ✅ Normaal: ${url}`);

      let hardUrl = null;
      if (hasHard && existsSync(hardPath)) {
        hardUrl = await uploadPhoto(hardPath, 'hard-', entry.filename);
        console.log(`   ✅ Moeilijk: ${hardUrl}`);
      }

      await sql`
        INSERT INTO streetview_quiz (question_number, response_id, blob_url, blob_url_hard, address, names)
        VALUES (${questionNumber}, ${entry.id}, ${url}, ${hardUrl}, ${entry.address.trim()}, ${entry.name.trim()})
      `;
      console.log(`   ✅ Database opgeslagen`);

      questionNumber++;
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
  }

  console.log('---');
  console.log(`✅ Klaar! ${questionNumber - 1} quiz items opgeslagen.`);
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
