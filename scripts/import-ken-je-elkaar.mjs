import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.POSTGRES_URL);
const responses = await sql`SELECT * FROM survey_responses ORDER BY id`;

const NAME_OVERRIDES = { 'Janneke Maassen van den Brink': 'Janneke B.' };
const ACHTERNAMEN = ['Otten', 'Laarman', 'Beltman', 'Heringa', 'Rolleman', 'Maassen van den Brink', 'Maassen'];
const fn = (name) => {
  if (NAME_OVERRIDES[name]) return NAME_OVERRIDES[name];
  const parts = name.trim().split(/\s+/);
  for (const achternaam of ACHTERNAMEN) {
    const suffix = achternaam.toLowerCase().split(/\s+/);
    if (parts.length > suffix.length) {
      const tail = parts.slice(-suffix.length).map(p => p.toLowerCase());
      if (suffix.every((s, i) => tail[i].startsWith(s.toLowerCase()))) {
        parts.splice(-suffix.length);
        break;
      }
    }
  }
  while (parts.length > 1 && ['van', 'den', 'de', 'het'].includes(parts[parts.length - 1].toLowerCase())) parts.pop();
  return parts.join(' ');
};

// Collect people
const people = [];
for (const r of responses) {
  if (r.naam_1) people.push({ name: fn(r.naam_1), r, suffix: '_1' });
  if (r.naam_2 && r.heeft_partner) people.push({ name: fn(r.naam_2), r, suffix: '_2' });
}
const get = (p, field) => p.r[field + p.suffix]?.trim() || '';
const skip = v => !v || ['-', 'geen', 'nee', 'nvt', 'n.v.t.', 'niet', 'x', 'neu', 'nergens voor', 'niemand', 'nog nooit', 'niet meer'].includes(v.toLowerCase());

// ============ HELPERS ============
const MERK_ALIASES = {
  vw: 'Volkswagen', volkswagen: 'Volkswagen',
  'lynk&co': 'Lynk & Co', lynk: 'Lynk & Co', linq: 'Lynk & Co',
  range: 'Range Rover', mercedes: 'Mercedes', kia: 'Kia', skoda: 'Skoda',
  audi: 'Audi', ford: 'Ford', fiat: 'Fiat', hyundai: 'Hyundai',
  peugeot: 'Peugeot', toyota: 'Toyota', bmw: 'BMW', opel: 'Opel',
};
const SKIP_MERKEN = ['geen', 'chinees', 'nee', 'nvt', '-', ''];
function normMerk(s) {
  if (!s) return null;
  const f = s.trim().split(/[\s,/]+/)[0].toLowerCase();
  if (SKIP_MERKEN.includes(f)) return null;
  return MERK_ALIASES[f] || f.charAt(0).toUpperCase() + f.slice(1);
}

function countPref(field, value) {
  return people.filter(p => get(p, field).toLowerCase() === value.toLowerCase());
}

// Generate a threshold that's exactly 1 off from the real answer
function makeThreshold(realAnswer) {
  const n = parseInt(realAnswer);
  if (isNaN(n)) return null;
  // Always exactly 1 higher or lower, random direction
  const direction = Math.random() > 0.5 ? 1 : -1;
  const threshold = n + direction;
  return Math.max(0, threshold);
}

// ============ GENERATE QUESTIONS ============
const autoQuestions = [];
const otherQuestions = [];

// --- Auto merken (top 3 alleen) ---
const autoGroups = {};
for (const p of people) {
  const m = normMerk(get(p, 'auto'));
  if (m) { if (!autoGroups[m]) autoGroups[m] = []; autoGroups[m].push(p.name); }
}
const topMerken = Object.entries(autoGroups).sort((a, b) => b[1].length - a[1].length).slice(0, 3);
for (const [merk, names] of topMerken) {
  const answer = String(names.length);
  autoQuestions.push({ question: `Hoeveel familieleden rijden in een ${merk}?`, answer, type: 'number', toelichting: names.join(', '), threshold: makeThreshold(answer) });
}

// --- Hoeveel verschillende automerken telt de familie? ---
const merkCount = Object.keys(autoGroups).length;
autoQuestions.push({ question: 'Hoeveel verschillende automerken telt de familie?', answer: String(merkCount), type: 'number', toelichting: Object.keys(autoGroups).join(', '), threshold: makeThreshold(String(merkCount)) });

// --- Sporten ---
const sportCount = {};
for (const p of people) {
  const s = get(p, 'sport');
  if (skip(s) || s.toLowerCase() === 'niks') continue;
  const words = s.toLowerCase();
  if (words.includes('tafeltennis')) { sportCount['Tafeltennis'] = sportCount['Tafeltennis'] || []; sportCount['Tafeltennis'].push(p.name); }
  if (words.includes('fitness') || words.includes('sportschool') || words.includes('cardio')) { sportCount['Fitness'] = sportCount['Fitness'] || []; sportCount['Fitness'].push(p.name); }
  if (words.includes('hardlopen') || words.includes('wandelen')) { sportCount['Hardlopen/wandelen'] = sportCount['Hardlopen/wandelen'] || []; sportCount['Hardlopen/wandelen'].push(p.name); }
  if (words.includes('fietsen') || words.includes('wielrennen') || words.includes('mountainbike')) { sportCount['Fietsen'] = sportCount['Fietsen'] || []; sportCount['Fietsen'].push(p.name); }
  if (words.includes('tennis') && !words.includes('tafeltennis')) { sportCount['Tennis'] = sportCount['Tennis'] || []; sportCount['Tennis'].push(p.name); }
}

// --- Hoeveel familieleden spelen tafeltennis? ---
if (sportCount['Tafeltennis']) {
  const answer = String(sportCount['Tafeltennis'].length);
  otherQuestions.push({
    question: 'Hoeveel familieleden spelen tafeltennis?',
    answer, type: 'number',
    toelichting: sportCount['Tafeltennis'].join(', '),
    threshold: makeThreshold(answer),
  });
}

// --- Huisdieren: hoeveel honden heeft de familie? ---
const honden = [];
for (const r of responses) {
  if (!r.heeft_huisdieren || !r.huisdieren_info) continue;
  const info = r.huisdieren_info.toLowerCase();
  if (info.includes('hond')) {
    const naam1 = fn(r.naam_1);
    const naam2 = r.heeft_partner && r.naam_2 ? fn(r.naam_2) : null;
    const match = r.huisdieren_info.match(/hond[,]?\s+(\w+)/i);
    const hondenNaam = match ? match[1] : '?';
    honden.push({ gezin: naam1 + (naam2 ? ' & ' + naam2 : ''), hondNaam: hondenNaam });
  }
}
if (honden.length > 0) {
  const answer = String(honden.length);
  otherQuestions.push({
    question: 'Hoeveel honden heeft de familie in totaal?',
    answer, type: 'number',
    toelichting: honden.map(h => `${h.hondNaam} (${h.gezin})`).join(', '),
    threshold: makeThreshold(answer),
  });
}

// --- Favoriete gerecht ---
const gerechtGroups = {};
for (const p of people) {
  const g = get(p, 'gerecht');
  if (skip(g)) continue;
  const lower = g.toLowerCase();
  if (lower.includes('lasagne')) { gerechtGroups['Lasagne'] = gerechtGroups['Lasagne'] || []; gerechtGroups['Lasagne'].push(p.name); }
  if (lower.includes('stamppot')) { gerechtGroups['Stamppot'] = gerechtGroups['Stamppot'] || []; gerechtGroups['Stamppot'].push(p.name); }
  if (lower.includes('erwtensoep')) { gerechtGroups['Erwtensoep'] = gerechtGroups['Erwtensoep'] || []; gerechtGroups['Erwtensoep'].push(p.name); }
  if (lower.includes('patat') || lower.includes('frikandel') || lower.includes('friet')) { gerechtGroups['Patat/friet'] = gerechtGroups['Patat/friet'] || []; gerechtGroups['Patat/friet'].push(p.name); }
}
const topGerecht = Object.entries(gerechtGroups).sort((a, b) => b[1].length - a[1].length);
if (topGerecht.length > 0 && topGerecht[0][1].length >= 2) {
  const answer = String(topGerecht[0][1].length);
  otherQuestions.push({
    question: `Hoeveel familieleden noemen ${topGerecht[0][0].toLowerCase()} als favoriet gerecht?`,
    answer, type: 'number',
    toelichting: topGerecht[0][1].join(', '),
    threshold: makeThreshold(answer),
  });
}

// --- Dranken: bier ---
const drankGroups = {};
for (const p of people) {
  const d = get(p, 'drank');
  if (skip(d)) continue;
  const lower = d.toLowerCase();
  if (lower.includes('bier') || lower.includes('grolsch') || lower.includes('birra')) { drankGroups['Bier'] = drankGroups['Bier'] || []; drankGroups['Bier'].push(p.name); }
  if (lower.includes('wijn') && !lower.includes('witte wijn')) { drankGroups['Wijn'] = drankGroups['Wijn'] || []; drankGroups['Wijn'].push(p.name); }
  if (lower.includes('koffie')) { drankGroups['Koffie'] = drankGroups['Koffie'] || []; drankGroups['Koffie'].push(p.name); }
  if (lower.includes('cognac')) { drankGroups['Cognac'] = drankGroups['Cognac'] || []; drankGroups['Cognac'].push(p.name); }
}
if (drankGroups['Bier'] && drankGroups['Bier'].length >= 2) {
  const answer = String(drankGroups['Bier'].length);
  otherQuestions.push({
    question: 'Hoeveel familieleden noemen bier als favoriete drank?',
    answer, type: 'number',
    toelichting: drankGroups['Bier'].join(', '),
    threshold: makeThreshold(answer),
  });
}

// --- Angsten: spinnen en muizen ---
const angstGroups = {};
for (const p of people) {
  const a = get(p, 'angst');
  if (skip(a)) continue;
  const lower = a.toLowerCase();
  if (lower.includes('spin')) { angstGroups['Spinnen'] = angstGroups['Spinnen'] || []; angstGroups['Spinnen'].push(p.name); }
  if (lower.includes('muis') || lower.includes('muizen')) { angstGroups['Muizen'] = angstGroups['Muizen'] || []; angstGroups['Muizen'].push(p.name); }
  if (lower.includes('slang')) { angstGroups['Slangen'] = angstGroups['Slangen'] || []; angstGroups['Slangen'].push(p.name); }
}
if (angstGroups['Spinnen'] && angstGroups['Spinnen'].length >= 2) {
  const answer = String(angstGroups['Spinnen'].length);
  otherQuestions.push({
    question: 'Hoeveel familieleden zijn bang voor spinnen?',
    answer, type: 'number',
    toelichting: angstGroups['Spinnen'].join(', '),
    threshold: makeThreshold(answer),
  });
}
if (angstGroups['Muizen'] && angstGroups['Muizen'].length >= 2) {
  const answer = String(angstGroups['Muizen'].length);
  otherQuestions.push({
    question: 'Hoeveel familieleden zijn bang voor muizen?',
    answer, type: 'number',
    toelichting: angstGroups['Muizen'].join(', '),
    threshold: makeThreshold(answer),
  });
}

// --- Voorkeuren ---
const prefKoffie = countPref('koffie_thee', 'Koffie');
const prefThee = countPref('koffie_thee', 'Thee');
if (prefThee.length > 0 && prefKoffie.length > 0) {
  const answer = String(prefThee.length);
  otherQuestions.push({
    question: 'Hoeveel familieleden drinken liever thee dan koffie?',
    answer, type: 'number',
    toelichting: prefThee.map(p => p.name).join(', '),
    threshold: makeThreshold(answer),
  });
}

const prefPasta = countPref('aardappel_pasta', 'Pasta');
const prefAardappel = countPref('aardappel_pasta', 'Aardappels');
if (prefPasta.length > 0 && prefAardappel.length > 0) {
  const answer = String(prefPasta.length);
  otherQuestions.push({
    question: 'Hoeveel familieleden kiezen voor pasta boven aardappels?',
    answer, type: 'number',
    toelichting: prefPasta.map(p => p.name).join(', '),
    threshold: makeThreshold(answer),
  });
}

// --- Vakantieland (als meer/minder: hoeveel noemden Italië?) ---
const italieLovers = people.filter(p => /itali[eë]/i.test(get(p, 'vakantieland')));
if (italieLovers.length > 0) {
  const answer = String(italieLovers.length);
  otherQuestions.push({
    question: 'Hoeveel familieleden noemen Italië als favoriete vakantieland?',
    answer, type: 'number',
    toelichting: italieLovers.map(p => p.name).join(', '),
    threshold: makeThreshold(answer),
  });
}

// --- Vrijwilligerswerk ---
const vrijwilligers = [];
for (const p of people) {
  const v = get(p, 'vrijwilligerswerk');
  if (!skip(v) && v.toLowerCase() !== 'ja') vrijwilligers.push({ name: p.name, wat: v });
  else if (v.toLowerCase() === 'ja') vrijwilligers.push({ name: p.name, wat: 'ja' });
}
if (vrijwilligers.length >= 2) {
  const answer = String(vrijwilligers.length);
  otherQuestions.push({
    question: 'Hoeveel familieleden doen vrijwilligerswerk?',
    answer, type: 'number',
    toelichting: vrijwilligers.map(v => v.wat !== 'ja' ? `${v.name} (${v.wat})` : v.name).join(', '),
    threshold: makeThreshold(answer),
  });
}

// --- Interleave auto questions among other questions ---
const questions = [];
if (autoQuestions.length > 0 && otherQuestions.length > 0) {
  // Distribute auto questions evenly among other questions
  const step = Math.floor(otherQuestions.length / (autoQuestions.length + 1));
  let autoIdx = 0;
  for (let i = 0; i < otherQuestions.length; i++) {
    questions.push(otherQuestions[i]);
    if (autoIdx < autoQuestions.length && (i + 1) % Math.max(step, 2) === 0) {
      questions.push(autoQuestions[autoIdx++]);
    }
  }
  // Add remaining auto questions at the end
  while (autoIdx < autoQuestions.length) questions.push(autoQuestions[autoIdx++]);
} else {
  questions.push(...autoQuestions, ...otherQuestions);
}

// --- Print ---
console.log(`--- ${questions.length} vragen gegenereerd ---\n`);
for (const q of questions) {
  const meerMinder = q.threshold != null ? (parseInt(q.answer) > q.threshold ? 'MEER' : 'MINDER') : '-';
  console.log(`[${q.type}] ${q.question}`);
  console.log(`  -> Antwoord: ${q.answer} | Drempel: ${q.threshold ?? '-'} | Correct: ${meerMinder}`);
  if (q.toelichting) console.log(`     (${q.toelichting})`);
  console.log();
}

// Confirm
const readline = await import('readline');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const answer = await new Promise(resolve => rl.question('Importeren naar database? (ja/nee) ', resolve));
rl.close();

if (answer.toLowerCase() !== 'ja') {
  console.log('Geannuleerd.');
  process.exit(0);
}

await sql`DELETE FROM ken_je_elkaar`;
console.log('Bestaande vragen verwijderd.');
await sql`ALTER TABLE ken_je_elkaar ADD COLUMN IF NOT EXISTS toelichting TEXT`;
await sql`ALTER TABLE ken_je_elkaar ADD COLUMN IF NOT EXISTS threshold INTEGER`;

for (let i = 0; i < questions.length; i++) {
  const q = questions[i];
  const thr = q.threshold ?? null;
  await sql`INSERT INTO ken_je_elkaar (question, answer, type, toelichting, threshold, sort_order) VALUES (${q.question}, ${q.answer}, ${q.type}, ${q.toelichting || null}, ${thr}, ${i + 1})`;
  console.log(`✓ ${i + 1}. ${q.question} (drempel: ${thr})`);
}
console.log(`\nKlaar! ${questions.length} vragen geïmporteerd.`);
