import { sql } from '@vercel/postgres';

const gerben = await sql`SELECT * FROM survey_responses WHERE naam_1 ILIKE '%Gerben%' AND adres ILIKE '%Parkzicht%'`;
const ilona = await sql`SELECT * FROM survey_responses WHERE naam_1 ILIKE '%Ilona%Otten%'`;

if (gerben.rows.length === 0) { console.error('Gerben niet gevonden!'); process.exit(1); }
if (ilona.rows.length === 0) { console.error('Ilona Otten niet gevonden!'); process.exit(1); }

const p1 = gerben.rows[0];
const p2 = ilona.rows[0];

console.log(`Gerben record (id=${p1.id}): naam_1=${p1.naam_1}, foto_1=${p1.foto_1_url ? '✓' : '✗'}`);
console.log(`Ilona record (id=${p2.id}): naam_1=${p2.naam_1}, foto_1=${p2.foto_1_url ? '✓' : '✗'}`);

const isGetrouwd = p1.is_getrouwd || p2.is_getrouwd || 'Ja';
const trouwdatum = p1.trouwdatum || p2.trouwdatum || null;
const heeftHuisdieren = p1.heeft_huisdieren ?? p2.heeft_huisdieren ?? null;
const huisdierenInfo = p1.huisdieren_info || p2.huisdieren_info || null;
const anekdote = p1.anekdote && p2.anekdote
  ? p1.anekdote + '\n\n' + p2.anekdote
  : p1.anekdote || p2.anekdote || null;

console.log('\n--- MERGING ---');

await sql`
  UPDATE survey_responses SET
    heeft_partner = true,
    naam_2 = ${p2.naam_1},
    geboortedatum_2 = ${p2.geboortedatum_1},
    foto_2_url = ${p2.foto_1_url},
    foto_2_later = ${p2.foto_1_later || false},
    is_getrouwd = ${isGetrouwd},
    trouwdatum = ${trouwdatum},
    werk_2 = ${p2.werk_1},
    opleiding_2 = ${p2.opleiding_1},
    bijbaantjes_2 = ${p2.bijbaantjes_1},
    basisschool_2 = ${p2.basisschool_1},
    bijnaam_2 = ${p2.bijnaam_1},
    heeft_huisdieren = ${heeftHuisdieren},
    huisdieren_info = ${huisdierenInfo},
    sport_2 = ${p2.sport_1},
    muziek_2 = ${p2.muziek_1},
    vrijwilligerswerk_2 = ${p2.vrijwilligerswerk_1},
    auto_2 = ${p2.auto_1},
    vakantieland_2 = ${p2.vakantieland_1},
    gerecht_2 = ${p2.gerecht_1},
    drank_2 = ${p2.drank_1},
    koffie_thee_2 = ${p2.koffie_thee_1},
    aardappel_pasta_2 = ${p2.aardappel_pasta_1},
    vlees_vis_2 = ${p2.vlees_vis_1},
    zomer_winter_2 = ${p2.zomer_winter_1},
    hond_kat_2 = ${p2.hond_kat_1},
    zwembad_zee_2 = ${p2.zwembad_zee_1},
    auto_fiets_2 = ${p2.auto_fiets_1},
    schoenmaat_2 = ${p2.schoenmaat_1},
    dieet_2 = ${p2.dieet_1},
    angst_2 = ${p2.angst_1},
    prijs_medaille_2 = ${p2.prijs_medaille_1},
    anekdote = ${anekdote}
  WHERE id = ${p1.id}
`;

console.log(`✓ Record id=${p1.id} bijgewerkt (Gerben + Ilona samengevoegd)`);

await sql`DELETE FROM survey_responses WHERE id = ${p2.id}`;
console.log(`✓ Ilona's solo record (id=${p2.id}) verwijderd`);

const merged = await sql`SELECT id, naam_1, naam_2, heeft_partner, foto_1_url, foto_2_url FROM survey_responses WHERE id = ${p1.id}`;
const m = merged.rows[0];
console.log(`\nResultaat:`);
console.log(`  id: ${m.id}, naam_1: ${m.naam_1}, naam_2: ${m.naam_2}`);
console.log(`  foto_1: ${m.foto_1_url ? '✓' : '✗'}, foto_2: ${m.foto_2_url ? '✓' : '✗'}`);
console.log('\nDone!');
