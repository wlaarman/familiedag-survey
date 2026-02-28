// ============================================================
// HANDMATIGE VRAGEN voor de Cijferronde
// ============================================================
// Deze vragen worden als EERSTE getoond, daarna de auto-gegenereerde.
//
// Type opties:
//   'multiple_choice' - meerkeuze (vul options[] in)
//   'open'            - open vraag (geen opties)
//   'number'          - getal raden (geen opties)
//
// Voorbeeld meerkeuze:
//   {
//     category: 'Weetjes',
//     question: 'Hoeveel kleinkinderen hebben opa en oma?',
//     type: 'multiple_choice',
//     options: ['8', '10', '12', '14'],
//     answer: '12 kleinkinderen',
//   },
//
// Voorbeeld open vraag:
//   {
//     category: 'Huwelijken',
//     question: 'Zet deze stellen in volgorde:\nA) Paar 1\nB) Paar 2',
//     type: 'open',
//     answer: 'Paar 2 → Paar 1',
//   },
// ============================================================

export interface ManualQuestion {
  category: string;
  question: string;
  type: 'multiple_choice' | 'number' | 'open';
  options?: string[];
  answer: string;
}

export const MANUAL_QUESTIONS: ManualQuestion[] = [
  {
    category: 'Verjaardagen',
    question: 'Hoeveel familieleden zijn in 1981 geboren?',
    type: 'multiple_choice',
    options: ['2', '3', '4', '5'],
    answer: '3 (Gerbrand, Willem en Ilona)',
  },
  {
    category: 'Huwelijken',
    question: 'Zet deze stellen in volgorde van trouwdatum (oudst → nieuwst):\nA) Henrieke & Jarno\nB) Willem & Mirjam\nC) Rick & Nienke\nD) Marieke & Gerbrand',
    type: 'open',
    answer: 'Marieke & Gerbrand → Henrieke & Jarno → Rick & Nienke → Willem & Mirjam\n(31 augustus 2006, 12 oktober 2007, 4 maart 2011, 13 mei 2011)',
  },
  {
    category: 'Weetjes',
    question: 'Hoeveel kleinkinderen hadden opa & oma toen Niels werd geboren?',
    type: 'number',
    answer: '??? (VUL ZELF IN)',
  },
];
