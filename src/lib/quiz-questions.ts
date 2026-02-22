import { SurveyResponse } from '@/types/survey';

export interface QuizQuestion {
  number: number;
  category: string;
  question: string;
  type: 'multiple_choice' | 'number' | 'open';
  options?: string[];
  answer: string;
}

interface Person {
  name: string;
  birthday: Date | null;
  schoenmaat: number | null;
}

interface Couple {
  names: string;
  weddingDate: Date;
  weddingStr: string;
}

function parseDate(s?: string): Date | null {
  if (!s) return null;
  const d = new Date(s);
  if (isNaN(d.getTime()) || d.getFullYear() < 1900) return null;
  return d;
}

function parseSchoenmaat(s?: string): number | null {
  if (!s) return null;
  const n = parseInt(s.replace(/[^0-9]/g, ''));
  return n >= 28 && n <= 52 ? n : null;
}

const ACHTERNAMEN = ['Otten', 'Laarman', 'Beltman', 'Heringa', 'Rolleman', 'Maassen'];

function firstName(name: string): string {
  const parts = name.trim().split(/\s+/);
  // Remove known last names from the end
  while (parts.length > 1 && ACHTERNAMEN.some(a => parts[parts.length - 1].toLowerCase().startsWith(a.toLowerCase()))) {
    parts.pop();
  }
  return parts.join(' ');
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateShort(d: Date): string {
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' });
}

function shuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function ageBetween(birth: Date, ref: Date): number {
  let age = ref.getFullYear() - birth.getFullYear();
  const m = ref.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < birth.getDate())) age--;
  return age;
}

export function generateQuestions(responses: SurveyResponse[]): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  let num = 1;

  // Collect persons and couples
  const persons: Person[] = [];
  const couples: Couple[] = [];
  const now = new Date();

  for (const r of responses) {
    persons.push({
      name: r.naam_1,
      birthday: parseDate(r.geboortedatum_1),
      schoenmaat: parseSchoenmaat(r.schoenmaat_1),
    });
    if (r.heeft_partner && r.naam_2) {
      persons.push({
        name: r.naam_2,
        birthday: parseDate(r.geboortedatum_2),
        schoenmaat: parseSchoenmaat(r.schoenmaat_2),
      });
    }
    // Only include specific couples for wedding questions
    const TROUW_STELLEN = ['Marieke', 'Henrieke', 'Rick', 'Willem'];
    if (r.is_getrouwd === 'Ja' && r.trouwdatum && r.naam_2 && TROUW_STELLEN.some(n => r.naam_1.trim().startsWith(n))) {
      const d = parseDate(r.trouwdatum);
      if (d) {
        couples.push({
          names: `${firstName(r.naam_1)} & ${firstName(r.naam_2)}`,
          weddingDate: d,
          weddingStr: formatDate(d),
        });
      }
    }
  }

  const personsWithAge = persons
    .filter(p => p.birthday)
    .map(p => ({ ...p, age: ageBetween(p.birthday!, now) }));

  // ===== 1. TOTAL NUMBER OF FAMILY MEMBERS =====
  questions.push({
    number: num++,
    category: 'Algemeen',
    question: 'Hoeveel familieleden hebben de enquête ingevuld? (individuen, niet huishoudens)',
    type: 'number',
    answer: `${persons.length} personen (${responses.length} inzendingen)`,
  });

  // ===== 2. COMBINED AGE =====
  if (personsWithAge.length >= 2) {
    const totalAge = personsWithAge.reduce((sum, p) => sum + p.age, 0);
    const avgAge = Math.round(totalAge / personsWithAge.length);
    questions.push({
      number: num++,
      category: 'Leeftijd',
      question: `Wat is de gemiddelde leeftijd van alle ${personsWithAge.length} familieleden?`,
      type: 'multiple_choice',
      options: shuffle([
        `${avgAge} jaar`,
        `${avgAge - 5} jaar`,
        `${avgAge + 4} jaar`,
        `${avgAge + 8} jaar`,
      ], avgAge),
      answer: `${avgAge} jaar (totaal: ${totalAge} jaar)`,
    });
  }

  // ===== 3. OLDEST FAMILY MEMBER =====
  if (personsWithAge.length >= 2) {
    const sorted = [...personsWithAge].sort((a, b) => b.age - a.age);
    const oldest = sorted[0];
    const decoys = sorted.slice(1).filter(p => p.age !== oldest.age).slice(0, 3);
    if (decoys.length >= 2) {
      const options = shuffle(
        [oldest, ...decoys.slice(0, 3)].map(p => `${firstName(p.name)} (${p.age})`),
        oldest.age
      );
      questions.push({
        number: num++,
        category: 'Leeftijd',
        question: 'Wie is het oudste familielid?',
        type: 'multiple_choice',
        options,
        answer: `${firstName(oldest.name)} (${oldest.age} jaar)`,
      });
    }
  }

  // ===== 4. YOUNGEST FAMILY MEMBER =====
  if (personsWithAge.length >= 2) {
    const sorted = [...personsWithAge].sort((a, b) => a.age - b.age);
    const youngest = sorted[0];
    const decoys = sorted.slice(1).filter(p => p.age !== youngest.age).slice(0, 3);
    if (decoys.length >= 2) {
      const options = shuffle(
        [youngest, ...decoys.slice(0, 3)].map(p => `${firstName(p.name)} (${p.age})`),
        youngest.age
      );
      questions.push({
        number: num++,
        category: 'Leeftijd',
        question: 'Wie is het jongste familielid?',
        type: 'multiple_choice',
        options,
        answer: `${firstName(youngest.name)} (${youngest.age} jaar)`,
      });
    }
  }

  // ===== 5. SHARED BIRTHDAYS =====
  const birthdaysByDay = new Map<string, Person[]>();
  for (const p of persons) {
    if (!p.birthday) continue;
    const key = `${p.birthday.getMonth() + 1}-${p.birthday.getDate()}`;
    if (!birthdaysByDay.has(key)) birthdaysByDay.set(key, []);
    birthdaysByDay.get(key)!.push(p);
  }
  const sharedBirthdays = [...birthdaysByDay.entries()]
    .filter(([, ps]) => ps.length >= 2)
    .map(([, ps]) => ps);

  if (sharedBirthdays.length > 0) {
    const group = sharedBirthdays[0];
    const names = group.map(p => firstName(p.name)).join(' en ');
    const dateStr = formatDateShort(group[0].birthday!);
    questions.push({
      number: num++,
      category: 'Verjaardagen',
      question: `Welke familieleden zijn op dezelfde dag jarig?`,
      type: 'open',
      answer: `${names} (${dateStr})`,
    });
  }

  // Birthday month with most birthdays
  const birthdaysByMonth = new Map<number, Person[]>();
  for (const p of persons) {
    if (!p.birthday) continue;
    const m = p.birthday.getMonth();
    if (!birthdaysByMonth.has(m)) birthdaysByMonth.set(m, []);
    birthdaysByMonth.get(m)!.push(p);
  }
  const monthNames = ['januari', 'februari', 'maart', 'april', 'mei', 'juni',
    'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
  const sortedMonths = [...birthdaysByMonth.entries()].sort((a, b) => b[1].length - a[1].length);
  if (sortedMonths.length >= 3) {
    const topMonth = sortedMonths[0];
    const otherMonths = sortedMonths.slice(1, 4).map(([m]) => monthNames[m]);
    const options = shuffle([monthNames[topMonth[0]], ...otherMonths], topMonth[1].length);
    questions.push({
      number: num++,
      category: 'Verjaardagen',
      question: `In welke maand zijn de meeste familieleden jarig? (${topMonth[1].length} personen)`,
      type: 'multiple_choice',
      options: options.map(m => m.charAt(0).toUpperCase() + m.slice(1)),
      answer: `${monthNames[topMonth[0]].charAt(0).toUpperCase() + monthNames[topMonth[0]].slice(1)} (${topMonth[1].map(p => firstName(p.name)).join(', ')})`,
    });
  }

  // ===== 6. MARRIAGE ORDERING =====
  if (couples.length >= 3) {
    const sorted = [...couples].sort((a, b) => a.weddingDate.getTime() - b.weddingDate.getTime());
    // Pick 4 couples spread across the timeline
    const pick = sorted.length <= 4 ? sorted : [
      sorted[0],
      sorted[Math.floor(sorted.length / 3)],
      sorted[Math.floor(2 * sorted.length / 3)],
      sorted[sorted.length - 1],
    ];
    const shuffled = shuffle(pick, pick.length * 7);
    const correctOrder = [...shuffled]
      .sort((a, b) => a.weddingDate.getTime() - b.weddingDate.getTime())
      .map(c => c.names)
      .join(' → ');

    questions.push({
      number: num++,
      category: 'Huwelijken',
      question: `Zet deze stellen in volgorde van trouwdatum (oudst → nieuwst):\n${shuffled.map((c, i) => `${String.fromCharCode(65 + i)}) ${c.names}`).join('\n')}`,
      type: 'open',
      answer: `${correctOrder}\n(${pick.sort((a, b) => a.weddingDate.getTime() - b.weddingDate.getTime()).map(c => `${c.names}: ${c.weddingStr}`).join(', ')})`,
    });
  }

  // ===== 7. LONGEST MARRIED =====
  if (couples.length >= 2) {
    const sorted = [...couples].sort((a, b) => a.weddingDate.getTime() - b.weddingDate.getTime());
    const longest = sorted[0];
    const years = now.getFullYear() - longest.weddingDate.getFullYear();
    const decoys = sorted.slice(1, 4);
    if (decoys.length >= 2) {
      const options = shuffle(
        [longest, ...decoys].map(c => c.names),
        years
      );
      questions.push({
        number: num++,
        category: 'Huwelijken',
        question: 'Welk stel is het langst getrouwd?',
        type: 'multiple_choice',
        options,
        answer: `${longest.names} (${longest.weddingStr}, ${years} jaar)`,
      });
    }
  }

  // ===== 8. CLOSEST WEDDINGS =====
  if (couples.length >= 3) {
    const sorted = [...couples].sort((a, b) => a.weddingDate.getTime() - b.weddingDate.getTime());
    let minDays = Infinity;
    let closestPair: [Couple, Couple] | null = null;
    for (let i = 0; i < sorted.length - 1; i++) {
      const days = Math.abs(sorted[i + 1].weddingDate.getTime() - sorted[i].weddingDate.getTime()) / (1000 * 60 * 60 * 24);
      if (days < minDays && days > 0) {
        minDays = days;
        closestPair = [sorted[i], sorted[i + 1]];
      }
    }
    if (closestPair) {
      const months = Math.round(minDays / 30);
      const timeStr = minDays < 60 ? `${Math.round(minDays)} dagen` : months < 12 ? `${months} maanden` : `${Math.floor(minDays / 365)} jaar en ${Math.round((minDays % 365) / 30)} maanden`;

      // Pick other pairs as decoys
      const otherPairs: string[] = [];
      for (let i = 0; i < sorted.length - 1 && otherPairs.length < 3; i++) {
        const pair = `${sorted[i].names} en ${sorted[i + 1].names}`;
        const correctPair = `${closestPair[0].names} en ${closestPair[1].names}`;
        if (pair !== correctPair) otherPairs.push(pair);
      }

      if (otherPairs.length >= 2) {
        const correctAnswer = `${closestPair[0].names} en ${closestPair[1].names}`;
        const options = shuffle([correctAnswer, ...otherPairs.slice(0, 3)], Math.round(minDays));
        questions.push({
          number: num++,
          category: 'Huwelijken',
          question: 'Welke twee stellen zijn het dichtst bij elkaar getrouwd?',
          type: 'multiple_choice',
          options,
          answer: `${correctAnswer} (${timeStr} verschil)`,
        });
      }
    }
  }

  // ===== 9. SHOE SIZES =====
  const withShoeSize = persons.filter(p => p.schoenmaat !== null);
  if (withShoeSize.length >= 4) {
    const sorted = [...withShoeSize].sort((a, b) => b.schoenmaat! - a.schoenmaat!);
    const biggest = sorted[0];
    const smallest = sorted[sorted.length - 1];
    const diff = biggest.schoenmaat! - smallest.schoenmaat!;

    questions.push({
      number: num++,
      category: 'Weetjes',
      question: `Wat is het verschil tussen de grootste en kleinste schoenmaat in de familie?`,
      type: 'multiple_choice',
      options: shuffle([
        `${diff} maten`,
        `${diff + 3} maten`,
        `${diff - 2 > 0 ? diff - 2 : diff + 1} maten`,
        `${diff + 6} maten`,
      ], diff),
      answer: `${diff} maten (${firstName(biggest.name)}: ${biggest.schoenmaat}, ${firstName(smallest.name)}: ${smallest.schoenmaat})`,
    });
  }

  // ===== 10. PREFERENCES =====
  const prefs = { koffie: 0, thee: 0, hond: 0, kat: 0, zomer: 0, winter: 0, auto: 0, fiets: 0 };
  for (const r of responses) {
    for (const n of [1, 2] as const) {
      if (n === 2 && !r.heeft_partner) continue;
      const kt = r[`koffie_thee_${n}`];
      if (kt === 'Koffie') prefs.koffie++;
      if (kt === 'Thee') prefs.thee++;
      const hk = r[`hond_kat_${n}`];
      if (hk === 'Hond') prefs.hond++;
      if (hk === 'Kat') prefs.kat++;
      const zw = r[`zomer_winter_${n}`];
      if (zw === 'Zomer') prefs.zomer++;
      if (zw === 'Winter') prefs.winter++;
      const af = r[`auto_fiets_${n}`];
      if (af === 'Auto') prefs.auto++;
      if (af === 'Fiets') prefs.fiets++;
    }
  }

  const koffieTotal = prefs.koffie + prefs.thee;
  if (koffieTotal > 0) {
    const koffiePct = Math.round((prefs.koffie / koffieTotal) * 100);
    questions.push({
      number: num++,
      category: 'Voorkeuren',
      question: 'Hoeveel procent van de familie kiest koffie boven thee?',
      type: 'multiple_choice',
      options: shuffle([
        `${koffiePct}%`,
        `${Math.min(100, koffiePct + 15)}%`,
        `${Math.max(0, koffiePct - 20)}%`,
        `${Math.min(100, koffiePct + 30)}%`,
      ], koffiePct),
      answer: `${koffiePct}% (${prefs.koffie} koffie, ${prefs.thee} thee)`,
    });
  }

  const hondTotal = prefs.hond + prefs.kat;
  if (hondTotal > 0) {
    questions.push({
      number: num++,
      category: 'Voorkeuren',
      question: `Hoeveel familieleden kiezen voor hond (vs. kat)?`,
      type: 'multiple_choice',
      options: shuffle([
        `${prefs.hond} van de ${hondTotal}`,
        `${Math.max(0, prefs.hond - 3)} van de ${hondTotal}`,
        `${Math.min(hondTotal, prefs.hond + 2)} van de ${hondTotal}`,
        `${Math.min(hondTotal, prefs.hond + 5)} van de ${hondTotal}`,
      ], prefs.hond),
      answer: `${prefs.hond} van de ${hondTotal} (${Math.round(prefs.hond / hondTotal * 100)}%)`,
    });
  }

  // ===== 11. PETS =====
  const withPets = responses.filter(r => r.heeft_huisdieren).length;
  if (responses.length >= 4) {
    questions.push({
      number: num++,
      category: 'Huisdieren',
      question: `Hoeveel huishoudens hebben huisdieren?`,
      type: 'multiple_choice',
      options: shuffle([
        `${withPets} van de ${responses.length}`,
        `${Math.max(0, withPets - 2)} van de ${responses.length}`,
        `${Math.min(responses.length, withPets + 3)} van de ${responses.length}`,
        `${Math.min(responses.length, withPets + 1)} van de ${responses.length}`,
      ], withPets),
      answer: `${withPets} van de ${responses.length} huishoudens`,
    });
  }

  // ===== 12. TOTAL YEARS MARRIED =====
  if (couples.length >= 3) {
    const totalYears = couples.reduce((sum, c) => sum + (now.getFullYear() - c.weddingDate.getFullYear()), 0);
    questions.push({
      number: num++,
      category: 'Huwelijken',
      question: `Hoeveel jaar zijn alle ${couples.length} stellen bij elkaar opgeteld getrouwd?`,
      type: 'multiple_choice',
      options: shuffle([
        `${totalYears} jaar`,
        `${totalYears + 25} jaar`,
        `${totalYears - 30 > 0 ? totalYears - 30 : totalYears + 50} jaar`,
        `${totalYears + 60} jaar`,
      ], totalYears),
      answer: `${totalYears} jaar`,
    });
  }

  // ===== 13. AGE DIFFERENCE =====
  if (personsWithAge.length >= 4) {
    const sorted = [...personsWithAge].sort((a, b) => b.age - a.age);
    const diff = sorted[0].age - sorted[sorted.length - 1].age;
    questions.push({
      number: num++,
      category: 'Leeftijd',
      question: `Hoeveel jaar zit er tussen het oudste en jongste familielid?`,
      type: 'multiple_choice',
      options: shuffle([
        `${diff} jaar`,
        `${diff + 7} jaar`,
        `${diff - 5 > 0 ? diff - 5 : diff + 12} jaar`,
        `${diff + 15} jaar`,
      ], diff),
      answer: `${diff} jaar (${firstName(sorted[0].name)}: ${sorted[0].age} - ${firstName(sorted[sorted.length - 1].name)}: ${sorted[sorted.length - 1].age})`,
    });
  }

  // ===== 14. MOST POPULAR VACATION COUNTRY =====
  const countries = new Map<string, number>();
  for (const r of responses) {
    for (const n of [1, 2] as const) {
      if (n === 2 && !r.heeft_partner) continue;
      const c = r[`vakantieland_${n}`]?.trim();
      if (c) countries.set(c.toLowerCase(), (countries.get(c.toLowerCase()) || 0) + 1);
    }
  }
  const sortedCountries = [...countries.entries()].sort((a, b) => b[1] - a[1]);
  if (sortedCountries.length >= 4) {
    const top = sortedCountries[0];
    const topName = top[0].charAt(0).toUpperCase() + top[0].slice(1);
    const others = sortedCountries.slice(1, 4).map(([c]) => c.charAt(0).toUpperCase() + c.slice(1));
    questions.push({
      number: num++,
      category: 'Favorieten',
      question: 'Wat is het populairste vakantieland in de familie?',
      type: 'multiple_choice',
      options: shuffle([topName, ...others], top[1]),
      answer: `${topName} (${top[1]}x genoemd)`,
    });
  }

  return questions;
}
