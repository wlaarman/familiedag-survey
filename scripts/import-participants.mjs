import { sql } from '@vercel/postgres';

const DEELNEMERS = [
  // Familie Laarman
  { naam: 'Mirjam', familie: 'Laarman', gezin: 'Willem & Mirjam', generatie: 1, geslacht: 'V' },
  { naam: 'Willem', familie: 'Laarman', gezin: 'Willem & Mirjam', generatie: 1, geslacht: 'M' },
  { naam: 'Geert', familie: 'Laarman', gezin: 'Geert & Janneke', generatie: 1, geslacht: 'M' },
  { naam: 'Janneke L.', familie: 'Laarman', gezin: 'Geert & Janneke', generatie: 1, geslacht: 'V' },
  { naam: 'Gineke L.', familie: 'Laarman', gezin: 'Gineke', generatie: 1, geslacht: 'V' },
  { naam: 'Rick R.', familie: 'Laarman', gezin: 'Rick & Nienke', generatie: 1, geslacht: 'M' },
  { naam: 'Nienke', familie: 'Laarman', gezin: 'Rick & Nienke', generatie: 1, geslacht: 'V' },
  { naam: 'Gea', familie: 'Laarman', gezin: 'Gea', generatie: 2, geslacht: 'V' },

  // Familie Otten
  { naam: 'Gerben', familie: 'Otten', gezin: 'Gerben & Ilona', generatie: 1, geslacht: 'M' },
  { naam: 'Ilona', familie: 'Otten', gezin: 'Gerben & Ilona', generatie: 1, geslacht: 'V' },
  { naam: 'Jandirk', familie: 'Otten', gezin: 'Jandirk & Linda', generatie: 1, geslacht: 'M' },
  { naam: 'Linda', familie: 'Otten', gezin: 'Jandirk & Linda', generatie: 1, geslacht: 'V' },
  { naam: 'Niels', familie: 'Otten', gezin: 'Niels & Linsey', generatie: 1, geslacht: 'M' },
  { naam: 'Linsey', familie: 'Otten', gezin: 'Niels & Linsey', generatie: 1, geslacht: 'V' },
  { naam: 'Marieke', familie: 'Otten', gezin: 'Marieke & Gerbrand', generatie: 1, geslacht: 'V' },
  { naam: 'Gerbrand', familie: 'Otten', gezin: 'Marieke & Gerbrand', generatie: 1, geslacht: 'M' },
  { naam: 'Rita', familie: 'Otten', gezin: 'Freek & Rita', generatie: 2, geslacht: 'V' },
  { naam: 'Freek', familie: 'Otten', gezin: 'Freek & Rita', generatie: 2, geslacht: 'M' },

  // Familie Jan Beltman
  { naam: 'Jan', familie: 'Jan Beltman', gezin: 'Jan & Karin', generatie: 2, geslacht: 'M' },
  { naam: 'Karin', familie: 'Jan Beltman', gezin: 'Jan & Karin', generatie: 2, geslacht: 'V' },

  // Familie Gerrit Beltman
  { naam: 'Jarno', familie: 'Gerrit Beltman', gezin: 'Jarno & Henrieke', generatie: 1, geslacht: 'M' },
  { naam: 'Henrieke', familie: 'Gerrit Beltman', gezin: 'Jarno & Henrieke', generatie: 1, geslacht: 'V' },
  { naam: 'Gert-Jan', familie: 'Gerrit Beltman', gezin: 'Gert-Jan & Gineke', generatie: 1, geslacht: 'M' },
  { naam: 'Gineke B.', familie: 'Gerrit Beltman', gezin: 'Gert-Jan & Gineke', generatie: 1, geslacht: 'V' },
  { naam: 'Gerrit', familie: 'Gerrit Beltman', gezin: 'Gerrit & Aleida', generatie: 2, geslacht: 'M' },
  { naam: 'Aleida', familie: 'Gerrit Beltman', gezin: 'Gerrit & Aleida', generatie: 2, geslacht: 'V' },

  // Familie Erik Beltman
  { naam: 'Erik', familie: 'Erik Beltman', gezin: 'Erik & Janneke', generatie: 2, geslacht: 'M' },
  { naam: 'Janneke B.', familie: 'Erik Beltman', gezin: 'Erik & Janneke', generatie: 2, geslacht: 'V' },
  { naam: 'Kim', familie: 'Erik Beltman', gezin: 'Kim & Rick', generatie: 1, geslacht: 'V' },
  { naam: 'Rick H.', familie: 'Erik Beltman', gezin: 'Kim & Rick', generatie: 1, geslacht: 'M' },
];

async function main() {
  console.log('Creating participants table...');
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

  // Check if already populated
  const existing = await sql`SELECT COUNT(*) as count FROM participants`;
  const count = parseInt(existing.rows[0].count);

  if (count > 0) {
    console.log(`Table already has ${count} participants. Clearing and re-importing...`);
    await sql`DELETE FROM participants`;
  }

  console.log(`Importing ${DEELNEMERS.length} deelnemers...`);
  for (const d of DEELNEMERS) {
    await sql`
      INSERT INTO participants (naam, familie, gezin, generatie, geslacht)
      VALUES (${d.naam}, ${d.familie}, ${d.gezin}, ${d.generatie}, ${d.geslacht})
    `;
  }

  console.log(`Done! ${DEELNEMERS.length} deelnemers imported.`);

  // Print summary
  const families = await sql`SELECT familie, COUNT(*) as c FROM participants GROUP BY familie ORDER BY familie`;
  console.log('\nPer familie:');
  for (const row of families.rows) {
    console.log(`  ${row.familie}: ${row.c}`);
  }

  const gen = await sql`SELECT generatie, COUNT(*) as c FROM participants GROUP BY generatie ORDER BY generatie`;
  console.log('\nPer generatie:');
  for (const row of gen.rows) {
    console.log(`  ${row.generatie === 1 ? 'Jong' : 'Oud'}: ${row.c}`);
  }

  const gesl = await sql`SELECT geslacht, COUNT(*) as c FROM participants GROUP BY geslacht ORDER BY geslacht`;
  console.log('\nPer geslacht:');
  for (const row of gesl.rows) {
    console.log(`  ${row.geslacht}: ${row.c}`);
  }
}

main().catch(console.error).finally(() => process.exit());
