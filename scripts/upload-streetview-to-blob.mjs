import { sql } from '@vercel/postgres';
import { put } from '@vercel/blob';
import { readFileSync } from 'fs';
import { join } from 'path';

const STREETVIEW_DIR = 'streetview-photos';
const OVERZICHT_PATH = join(STREETVIEW_DIR, '_overzicht.json');

function normalizeAddress(addr) {
  return addr.toLowerCase().trim().replace(/[\s,]+/g, ' ');
}

function countNames(nameStr) {
  // Count the number of individual names (split by & and count non-empty parts)
  return nameStr.split('&').filter(s => s.trim().length > 0).length +
    nameStr.split('&').reduce((acc, part) => {
      // Count words in each part (first + last name = more specific)
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
      address TEXT NOT NULL,
      names TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log('✅ Tabel streetview_quiz aangemaakt/gecontroleerd');
}

async function uploadPhoto(filePath, filename) {
  const fileBuffer = readFileSync(filePath);
  const blobFilename = `streetview/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

  const blob = await put(blobFilename, fileBuffer, {
    access: 'public',
    contentType: 'image/jpeg',
  });

  return blob.url;
}

async function main() {
  // Read overzicht
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

  // Pick best entry per address (most names = most complete)
  const deduplicated = [];
  for (const [addr, entries] of addressGroups) {
    if (entries.length > 1) {
      entries.sort((a, b) => countNames(b.name) - countNames(a.name));
      console.log(`  Duplicaat "${addr}": kies "${entries[0].name}" (van ${entries.length} entries)`);
    }
    deduplicated.push(entries[0]);
  }

  console.log(`\n📸 ${deduplicated.length} foto's te uploaden`);
  console.log('---');

  // Create table
  await createTable();

  // Clear existing quiz data
  await sql`DELETE FROM streetview_quiz`;
  console.log('🗑️  Bestaande quiz data gewist');

  // Upload and insert
  let questionNumber = 1;
  for (const entry of deduplicated) {
    const filePath = join(STREETVIEW_DIR, entry.filename);
    console.log(`📤 #${questionNumber}: ${entry.name} (${entry.address})...`);

    try {
      const url = await uploadPhoto(filePath, entry.filename);
      console.log(`   ✅ Uploaded: ${url}`);

      await sql`
        INSERT INTO streetview_quiz (question_number, response_id, blob_url, address, names)
        VALUES (${questionNumber}, ${entry.id}, ${url}, ${entry.address.trim()}, ${entry.name.trim()})
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
