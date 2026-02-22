import { sql } from '@vercel/postgres';

const freek = await sql`SELECT * FROM survey_responses WHERE naam_1 ILIKE '%Freek%Otten%'`;
const rita = await sql`SELECT * FROM survey_responses WHERE naam_1 ILIKE '%Rita%' AND adres ILIKE '%Lentfersweg%'`;

if (freek.rows.length === 0) { console.error('Freek Otten niet gevonden!'); process.exit(1); }
if (rita.rows.length === 0) { console.error('Rita niet gevonden!'); process.exit(1); }

const f = freek.rows[0];
const r = rita.rows[0];

console.log(`Freek record (id=${f.id}): naam_1=${f.naam_1}, heeft_partner=${f.heeft_partner}, foto_1=${f.foto_1_url ? '✓' : '✗'}, foto_2=${f.foto_2_url ? '✓' : '✗'}`);
console.log(`Rita record (id=${r.id}): naam_1=${r.naam_1}, heeft_partner=${r.heeft_partner}, foto_1=${r.foto_1_url ? '✓' : '✗'}, foto_2=${r.foto_2_url ? '✓' : '✗'}`);

// Compute merged values in JS
const isGetrouwd = f.is_getrouwd || r.is_getrouwd || 'Ja';
const trouwdatum = f.trouwdatum || r.trouwdatum || null;
const heeftHuisdieren = f.heeft_huisdieren ?? r.heeft_huisdieren ?? null;
const huisdierenInfo = f.huisdieren_info || r.huisdieren_info || null;
const anekdote = f.anekdote && r.anekdote
  ? f.anekdote + '\n\n' + r.anekdote
  : f.anekdote || r.anekdote || null;

console.log('\n--- MERGING ---');

await sql`
  UPDATE survey_responses SET
    heeft_partner = true,
    naam_2 = ${r.naam_1},
    geboortedatum_2 = ${r.geboortedatum_1},
    foto_2_url = ${r.foto_1_url},
    foto_2_later = ${r.foto_1_later || false},
    is_getrouwd = ${isGetrouwd},
    trouwdatum = ${trouwdatum},
    werk_2 = ${r.werk_1},
    opleiding_2 = ${r.opleiding_1},
    bijbaantjes_2 = ${r.bijbaantjes_1},
    basisschool_2 = ${r.basisschool_1},
    bijnaam_2 = ${r.bijnaam_1},
    heeft_huisdieren = ${heeftHuisdieren},
    huisdieren_info = ${huisdierenInfo},
    sport_2 = ${r.sport_1},
    muziek_2 = ${r.muziek_1},
    vrijwilligerswerk_2 = ${r.vrijwilligerswerk_1},
    auto_2 = ${r.auto_1},
    vakantieland_2 = ${r.vakantieland_1},
    gerecht_2 = ${r.gerecht_1},
    drank_2 = ${r.drank_1},
    koffie_thee_2 = ${r.koffie_thee_1},
    aardappel_pasta_2 = ${r.aardappel_pasta_1},
    vlees_vis_2 = ${r.vlees_vis_1},
    zomer_winter_2 = ${r.zomer_winter_1},
    hond_kat_2 = ${r.hond_kat_1},
    zwembad_zee_2 = ${r.zwembad_zee_1},
    auto_fiets_2 = ${r.auto_fiets_1},
    schoenmaat_2 = ${r.schoenmaat_1},
    dieet_2 = ${r.dieet_1},
    angst_2 = ${r.angst_1},
    prijs_medaille_2 = ${r.prijs_medaille_1},
    anekdote = ${anekdote}
  WHERE id = ${f.id}
`;

console.log(`✓ Record id=${f.id} bijgewerkt (Freek + Rita samengevoegd)`);

await sql`DELETE FROM survey_responses WHERE id = ${r.id}`;
console.log(`✓ Rita's solo record (id=${r.id}) verwijderd`);

const merged = await sql`SELECT id, naam_1, naam_2, heeft_partner, foto_1_url, foto_2_url FROM survey_responses WHERE id = ${f.id}`;
const m = merged.rows[0];
console.log(`\nResultaat:`);
console.log(`  id: ${m.id}`);
console.log(`  naam_1: ${m.naam_1}`);
console.log(`  naam_2: ${m.naam_2}`);
console.log(`  heeft_partner: ${m.heeft_partner}`);
console.log(`  foto_1_url: ${m.foto_1_url ? '✓ aanwezig' : '✗ geen'}`);
console.log(`  foto_2_url: ${m.foto_2_url ? '✓ aanwezig' : '✗ geen'}`);
console.log('\nDone!');
