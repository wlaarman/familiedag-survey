import { sql } from '@vercel/postgres';

// Find both records
const gineke = await sql`SELECT * FROM survey_responses WHERE naam_1 ILIKE '%Gineke%Beltman%'`;
const gertjan = await sql`SELECT * FROM survey_responses WHERE naam_1 ILIKE '%Gert%Jan%Beltman%'`;

if (gineke.rows.length === 0) {
  console.error('Gineke Beltman niet gevonden!');
  process.exit(1);
}
if (gertjan.rows.length === 0) {
  console.error('Gert-Jan Beltman niet gevonden!');
  process.exit(1);
}

const g = gineke.rows[0];
const gj = gertjan.rows[0];

console.log(`\nGineke record (id=${g.id}):`);
console.log(`  naam_1: ${g.naam_1}, adres: ${g.adres}`);
console.log(`  heeft_partner: ${g.heeft_partner}`);
console.log(`  foto_1_url: ${g.foto_1_url ? '✓ aanwezig' : '✗ geen'}`);
console.log(`  foto_2_url: ${g.foto_2_url ? '✓ aanwezig' : '✗ geen'}`);

console.log(`\nGert-Jan record (id=${gj.id}):`);
console.log(`  naam_1: ${gj.naam_1}, adres: ${gj.adres}`);
console.log(`  heeft_partner: ${gj.heeft_partner}`);
console.log(`  foto_1_url: ${gj.foto_1_url ? '✓ aanwezig' : '✗ geen'}`);
console.log(`  foto_2_url: ${gj.foto_2_url ? '✓ aanwezig' : '✗ geen'}`);

// Strategy: Keep Gert-Jan's record as _1, copy Gineke's _1 fields to _2
// This makes Gert-Jan person 1 and Gineke person 2
const dryRun = process.argv.includes('--dry-run');

if (dryRun) {
  console.log('\n--- DRY RUN - geen wijzigingen ---');
  console.log(`\nPlan:`);
  console.log(`  1. Update record id=${gj.id}: Gert-Jan = persoon 1, Gineke = persoon 2`);
  console.log(`  2. Kopieer Gineke's _1 velden naar _2 velden`);
  console.log(`  3. Bewaar foto's van beide records`);
  console.log(`  4. Zet heeft_partner = true, is_getrouwd = Ja`);
  console.log(`  5. Verwijder Gineke's solo record (id=${g.id})`);
  console.log(`\nFoto's:`);
  console.log(`  foto_1_url (Gert-Jan): ${gj.foto_1_url || 'geen'}`);
  console.log(`  foto_2_url (Gineke):   ${g.foto_1_url || 'geen'}`);
  console.log(`\nRun zonder --dry-run om uit te voeren.`);
  process.exit(0);
}

console.log('\n--- MERGING ---');

// Compute merged values in JS to avoid SQL type cast issues
const isGetrouwd = gj.is_getrouwd || g.is_getrouwd || 'Ja';
const trouwdatum = gj.trouwdatum || g.trouwdatum || null;
const heeftHuisdieren = gj.heeft_huisdieren ?? g.heeft_huisdieren ?? null;
const huisdierenInfo = gj.huisdieren_info || g.huisdieren_info || null;
const anekdote = gj.anekdote && g.anekdote
  ? gj.anekdote + '\n\n' + g.anekdote
  : gj.anekdote || g.anekdote || null;

// Update Gert-Jan's record: copy Gineke's _1 fields to _2
await sql`
  UPDATE survey_responses SET
    heeft_partner = true,
    naam_2 = ${g.naam_1},
    geboortedatum_2 = ${g.geboortedatum_1},
    foto_2_url = ${g.foto_1_url},
    foto_2_later = ${g.foto_1_later || false},
    is_getrouwd = ${isGetrouwd},
    trouwdatum = ${trouwdatum},
    werk_2 = ${g.werk_1},
    opleiding_2 = ${g.opleiding_1},
    bijbaantjes_2 = ${g.bijbaantjes_1},
    basisschool_2 = ${g.basisschool_1},
    bijnaam_2 = ${g.bijnaam_1},
    heeft_huisdieren = ${heeftHuisdieren},
    huisdieren_info = ${huisdierenInfo},
    sport_2 = ${g.sport_1},
    muziek_2 = ${g.muziek_1},
    vrijwilligerswerk_2 = ${g.vrijwilligerswerk_1},
    auto_2 = ${g.auto_1},
    vakantieland_2 = ${g.vakantieland_1},
    gerecht_2 = ${g.gerecht_1},
    drank_2 = ${g.drank_1},
    koffie_thee_2 = ${g.koffie_thee_1},
    aardappel_pasta_2 = ${g.aardappel_pasta_1},
    vlees_vis_2 = ${g.vlees_vis_1},
    zomer_winter_2 = ${g.zomer_winter_1},
    hond_kat_2 = ${g.hond_kat_1},
    zwembad_zee_2 = ${g.zwembad_zee_1},
    auto_fiets_2 = ${g.auto_fiets_1},
    schoenmaat_2 = ${g.schoenmaat_1},
    dieet_2 = ${g.dieet_1},
    angst_2 = ${g.angst_1},
    prijs_medaille_2 = ${g.prijs_medaille_1},
    anekdote = ${anekdote}
  WHERE id = ${gj.id}
`;

console.log(`✓ Record id=${gj.id} bijgewerkt (Gert-Jan + Gineke samengevoegd)`);

// Also use Gineke's adres if Gert-Jan doesn't have one (they should be the same)
if (!gj.adres && g.adres) {
  await sql`UPDATE survey_responses SET adres = ${g.adres} WHERE id = ${gj.id}`;
  console.log(`✓ Adres overgenomen van Gineke`);
}

// Delete Gineke's solo record
await sql`DELETE FROM survey_responses WHERE id = ${g.id}`;
console.log(`✓ Gineke's solo record (id=${g.id}) verwijderd`);

// Verify
const merged = await sql`SELECT id, naam_1, naam_2, heeft_partner, foto_1_url, foto_2_url FROM survey_responses WHERE id = ${gj.id}`;
const m = merged.rows[0];
console.log(`\nResultaat:`);
console.log(`  id: ${m.id}`);
console.log(`  naam_1: ${m.naam_1}`);
console.log(`  naam_2: ${m.naam_2}`);
console.log(`  heeft_partner: ${m.heeft_partner}`);
console.log(`  foto_1_url: ${m.foto_1_url ? '✓ aanwezig' : '✗ geen'}`);
console.log(`  foto_2_url: ${m.foto_2_url ? '✓ aanwezig' : '✗ geen'}`);
console.log('\nDone!');
