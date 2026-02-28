// ============================================================
// HANDMATIGE VRAGEN voor Wie van de 3?
// ============================================================
// Deze vragen worden NA de auto-gegenereerde vragen getoond.
//
// Vul in:
//   question   - De vraagtekst
//   names      - Array van 3 namen (keuze-opties)
//   correctIndex - Index van het juiste antwoord (0, 1 of 2)
//
// Let op: bij dubbele voornamen, gebruik initiaal achternaam
// bijv. 'Gineke L.' vs 'Gineke B.'
//
// Voorbeeld:
//   {
//     question: 'Wie had als bijnaam "Dikkie"?',
//     names: ['Jan', 'Gerrit', 'Erik'],
//     correctIndex: 1,
//   },
// ============================================================

export interface ManualWieVanDe3 {
  question: string;
  names: string[];
  correctIndex: number;
}

export const MANUAL_WIE_VAN_DE_3: ManualWieVanDe3[] = [
  {
    question: 'Van wie is deze anekdote? "Ik logeerde met Marieke bij opa en oma in de gouden koets vanwege de goudkleurige sprei die daar op lag. We deden \'s avonds altijd een potje sjoelen."',
    names: ['Gineke L.', 'Nienke', 'Jarno'],
    correctIndex: 0,
  },
  {
    question: 'Wie had als bijnaam "Billy"?',
    names: ['Gerrit', 'Jan', 'Erik'],
    correctIndex: 2,
  },
  {
    question: 'Van wie is deze uitspraak? "Ik liet geen scheten\u2026.. 😜"',
    names: ['Gineke B.', 'Henrieke', 'Mirjam'],
    correctIndex: 0,
  },
];
