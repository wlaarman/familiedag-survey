import { sql } from '@vercel/postgres';
import { put } from '@vercel/blob';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const PHOTO_DIR = 'C:\\Users\\WillemLaarman\\iCloudDrive\\Verbouwing\\Familiedag\\foto';

// Mapping: filename pattern -> { id, field }
// field is 'foto_1_url' for person 1, 'foto_2_url' for person 2
const MAPPINGS = [
  { pattern: /^gineke laarman\.jpeg$/i, id: 22, field: 'foto_1_url', name: 'Gineke' },
  { pattern: /^marieke \(1\)\.jpeg$/i, id: 17, field: 'foto_1_url', name: 'Marieke' },
  { pattern: /^oom gerrit \(1\)\.jpeg$/i, id: 16, field: 'foto_1_url', name: 'Gerrit' },
  { pattern: /^aleida\.jpeg$/i, id: 16, field: 'foto_2_url', name: 'Aleida' },
];

async function uploadPhoto(filePath, filename) {
  const fileBuffer = readFileSync(filePath);
  const blobFilename = `photos/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

  const blob = await put(blobFilename, fileBuffer, {
    access: 'public',
    contentType: 'image/jpeg',
  });

  return blob.url;
}

async function updateDatabase(id, field, url) {
  if (field === 'foto_1_url') {
    await sql`UPDATE survey_responses SET foto_1_url = ${url} WHERE id = ${id}`;
  } else {
    await sql`UPDATE survey_responses SET foto_2_url = ${url} WHERE id = ${id}`;
  }
}

async function checkExisting(id, field) {
  const result = await sql`SELECT foto_1_url, foto_2_url FROM survey_responses WHERE id = ${id}`;
  if (result.rows.length === 0) return null;
  return result.rows[0][field];
}

async function main() {
  const files = readdirSync(PHOTO_DIR);
  console.log('Gevonden bestanden:', files);
  console.log('---');

  for (const mapping of MAPPINGS) {
    const matchingFile = files.find(f => mapping.pattern.test(f));

    if (matchingFile) {
      // Check if already has photo
      const existing = await checkExisting(mapping.id, mapping.field);
      if (existing) {
        console.log(`⏭️  ${mapping.name} (id ${mapping.id}) heeft al een foto, overslaan`);
        continue;
      }

      const filePath = join(PHOTO_DIR, matchingFile);
      console.log(`📤 Uploading ${matchingFile} voor ${mapping.name} (id ${mapping.id})...`);

      try {
        const url = await uploadPhoto(filePath, matchingFile);
        console.log(`   ✅ Uploaded: ${url}`);

        await updateDatabase(mapping.id, mapping.field, url);
        console.log(`   ✅ Database updated (${mapping.field})`);
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
      }
    } else {
      console.log(`⚠️  Geen bestand gevonden voor: ${mapping.name}`);
    }
  }

  console.log('---');
  console.log('✅ Klaar!');
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
