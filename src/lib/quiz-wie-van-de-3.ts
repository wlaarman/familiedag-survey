import { SurveyResponse } from '@/types/survey';

export interface WieVanDe3Question {
  number: number;
  question: string;
  names: string[];
  answerIndex: number;
  answerName: string;
}

interface PersonFact {
  name: string;
  responseId: number;
  value: string;
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0];
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

function pickDecoys(allPersons: PersonFact[], correct: PersonFact, usedNames: Set<string>, seed: number): PersonFact[] {
  // Pick 2 decoys that don't have the same value and haven't been used too much
  const candidates = allPersons.filter(p =>
    p.name !== correct.name &&
    p.value.toLowerCase() !== correct.value.toLowerCase()
  );
  const shuffled = shuffle(candidates, seed);
  const picked: PersonFact[] = [];
  for (const c of shuffled) {
    if (picked.length >= 2) break;
    // Prefer names not yet used as correct answers
    picked.push(c);
  }
  return picked;
}

function collectFacts(
  responses: SurveyResponse[],
  field1: keyof SurveyResponse,
  field2: keyof SurveyResponse,
  filter?: (val: string) => boolean
): PersonFact[] {
  const facts: PersonFact[] = [];
  for (const r of responses) {
    const v1 = r[field1] as string | null | undefined;
    if (v1 && v1.trim().length > 1 && (!filter || filter(v1.trim()))) {
      facts.push({ name: r.naam_1, responseId: r.id, value: v1.trim() });
    }
    if (r.heeft_partner && r.naam_2) {
      const v2 = r[field2] as string | null | undefined;
      if (v2 && v2.trim().length > 1 && (!filter || filter(v2.trim()))) {
        facts.push({ name: r.naam_2, responseId: r.id, value: v2.trim() });
      }
    }
  }
  return facts;
}

// Check if a value is unique (only 1 person has it) among all facts
function isUnique(fact: PersonFact, allFacts: PersonFact[]): boolean {
  return allFacts.filter(f => f.value.toLowerCase() === fact.value.toLowerCase()).length === 1;
}

// Filter out boring/common non-answers
const SKIP_VALUES = ['nee', 'geen', 'niet', 'n.v.t', 'nvt', 'x', '-', 'nee.', 'geen.', 'n.v.t.', 'anders'];

function isInteresting(val: string): boolean {
  return !SKIP_VALUES.includes(val.toLowerCase().trim().replace(/\.$/, ''));
}

export function generateWieVanDe3(responses: SurveyResponse[]): WieVanDe3Question[] {
  const questions: WieVanDe3Question[] = [];
  const usedNames = new Set<string>();
  const usedQuestionKeys = new Set<string>();

  // All persons for decoy picking
  const allPersons: PersonFact[] = [];
  for (const r of responses) {
    allPersons.push({ name: r.naam_1, responseId: r.id, value: '' });
    if (r.heeft_partner && r.naam_2) {
      allPersons.push({ name: r.naam_2, responseId: r.id, value: '' });
    }
  }

  if (allPersons.length < 5) return questions; // Need enough people

  // Define question templates: [field1, field2, questionTemplate, filter?]
  type Template = {
    field1: keyof SurveyResponse;
    field2: keyof SurveyResponse;
    template: (val: string) => string;
    filter?: (val: string) => boolean;
  };

  const templates: Template[] = [
    {
      field1: 'vakantieland_1', field2: 'vakantieland_2',
      template: (v) => `Wiens favoriete vakantieland is ${v}?`,
    },
    {
      field1: 'angst_1', field2: 'angst_2',
      template: (v) => `Wie is er bang voor ${v.toLowerCase()}?`,
      filter: (v) => isInteresting(v) && v.length > 3 && v.length < 80,
    },
    {
      field1: 'gerecht_1', field2: 'gerecht_2',
      template: (v) => `Wiens lievelingsgerecht is ${v.toLowerCase()}?`,
      filter: (v) => isInteresting(v),
    },
    {
      field1: 'drank_1', field2: 'drank_2',
      template: (v) => `Wiens favoriete drankje is ${v.toLowerCase()}?`,
      filter: (v) => isInteresting(v),
    },
    {
      field1: 'sport_1', field2: 'sport_2',
      template: (v) => `Wie doet aan ${v.toLowerCase()}?`,
      filter: (v) => isInteresting(v) && v.length < 60,
    },
    {
      field1: 'bijnaam_1', field2: 'bijnaam_2',
      template: (v) => `Wie had vroeger de bijnaam "${v}"?`,
      filter: (v) => isInteresting(v) && v.length >= 2 && v.length < 30,
    },
    {
      field1: 'auto_1', field2: 'auto_2',
      template: (v) => `Wie rijdt in een ${v}?`,
      filter: (v) => isInteresting(v),
    },
    {
      field1: 'muziek_1', field2: 'muziek_2',
      template: (v) => `Wie luistert het liefst naar ${v.toLowerCase()}?`,
      filter: (v) => isInteresting(v) && v.length < 60,
    },
    {
      field1: 'werk_1', field2: 'werk_2',
      template: (v) => `Wie werkt als ${v.toLowerCase()}?`,
      filter: (v) => isInteresting(v) && v.length > 3 && v.length < 60,
    },
    {
      field1: 'bijbaantjes_1', field2: 'bijbaantjes_2',
      template: (v) => `Wie had als bijbaantje: ${v.toLowerCase()}?`,
      filter: (v) => isInteresting(v) && v.length > 3 && v.length < 80,
    },
    {
      field1: 'basisschool_1', field2: 'basisschool_2',
      template: (v) => `Wie zat op basisschool ${v}?`,
      filter: (v) => isInteresting(v),
    },
    {
      field1: 'prijs_medaille_1', field2: 'prijs_medaille_2',
      template: (v) => `Wie heeft deze prijs/medaille: ${v.toLowerCase()}?`,
      filter: (v) => isInteresting(v) && v.length > 5 && v.length < 80,
    },
    {
      field1: 'vrijwilligerswerk_1', field2: 'vrijwilligerswerk_2',
      template: (v) => `Wie doet vrijwilligerswerk bij ${v}?`,
      filter: (v) => isInteresting(v) && v.length > 3,
    },
  ];

  // Generate candidate questions from all templates
  interface Candidate {
    question: string;
    correct: PersonFact;
    allFacts: PersonFact[];
    key: string;
    seed: number;
  }

  const candidates: Candidate[] = [];

  for (const tmpl of templates) {
    const facts = collectFacts(responses, tmpl.field1, tmpl.field2, tmpl.filter);
    // Only use unique facts (exactly 1 person has this value)
    const uniqueFacts = facts.filter(f => isUnique(f, facts));

    for (const fact of uniqueFacts) {
      const key = `${tmpl.field1}-${fact.value.toLowerCase()}`;
      candidates.push({
        question: tmpl.template(fact.value),
        correct: fact,
        allFacts: facts,
        key,
        seed: fact.name.length * 31 + fact.responseId * 17 + fact.value.length * 7,
      });
    }
  }

  // Shuffle candidates for variety
  const shuffledCandidates = shuffle(candidates, responses.length * 42);

  // Pick questions, avoiding same person as answer too often
  const answerCount = new Map<string, number>();
  const MAX_SAME_ANSWER = 2;
  const TARGET_QUESTIONS = 15;

  for (const cand of shuffledCandidates) {
    if (questions.length >= TARGET_QUESTIONS) break;
    if (usedQuestionKeys.has(cand.key)) continue;

    const currentCount = answerCount.get(cand.correct.name) || 0;
    if (currentCount >= MAX_SAME_ANSWER) continue;

    // Find decoys - people who DON'T have the same value
    const decoys = pickDecoys(allPersons, cand.correct, usedNames, cand.seed);
    if (decoys.length < 2) continue;

    // Build the 3 names and shuffle them
    const threeNames = [
      firstName(cand.correct.name),
      firstName(decoys[0].name),
      firstName(decoys[1].name),
    ];

    // Make sure all 3 names are different
    if (new Set(threeNames).size < 3) continue;

    const shuffledNames = shuffle(threeNames, cand.seed + questions.length);
    const answerIndex = shuffledNames.indexOf(firstName(cand.correct.name));

    questions.push({
      number: questions.length + 1,
      question: cand.question,
      names: shuffledNames,
      answerIndex,
      answerName: firstName(cand.correct.name),
    });

    usedQuestionKeys.add(cand.key);
    answerCount.set(cand.correct.name, currentCount + 1);
    usedNames.add(cand.correct.name);
  }

  return questions;
}
