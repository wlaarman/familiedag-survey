import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import Link from 'next/link';

interface QuizRonde {
  nummer: number;
  titel: string;
  beschrijving: string;
  icon: string;
  links?: { label: string; href: string; variant?: 'primary' | 'secondary' | 'answer' }[];
}

const RONDES: QuizRonde[] = [
  {
    nummer: 1,
    titel: 'Raad de kinderfoto',
    beschrijving: 'Portretfoto\'s van familieleden — wie is wie?',
    icon: '📷',
    links: [
      { label: 'Quiz (kleur)', href: '/admin/quiz/fotos?mode=quiz&variant=normaal', variant: 'primary' },
      { label: 'Quiz (zwart-wit)', href: '/admin/quiz/fotos?mode=quiz&variant=moeilijk', variant: 'secondary' },
      { label: 'Antwoorden', href: '/admin/quiz/fotos?mode=antwoorden', variant: 'answer' },
    ],
  },
  {
    nummer: 2,
    titel: 'Feit of fabel',
    beschrijving: 'Stellingen over de familie — klopt het of niet?',
    icon: '✅',
    links: [
      { label: 'Quiz', href: '/admin/quiz/feit-of-fabel?mode=quiz', variant: 'primary' },
      { label: 'Antwoorden', href: '/admin/quiz/feit-of-fabel?mode=antwoorden', variant: 'answer' },
    ],
  },
  {
    nummer: 3,
    titel: 'Cijferronde',
    beschrijving: 'Getallen raden: leeftijden, schoenmaten, trouwdata en meer.',
    icon: '🔢',
    links: [
      { label: 'Quiz', href: '/admin/quiz/cijfers?mode=quiz', variant: 'primary' },
      { label: 'Antwoorden', href: '/admin/quiz/cijfers?mode=antwoorden', variant: 'answer' },
    ],
  },
  {
    nummer: 4,
    titel: 'Hoe goed ken je elkaar',
    beschrijving: 'Vragen over familieleden — hoe goed ken je ze echt?',
    icon: '💬',
  },
  {
    nummer: 5,
    titel: 'Raad de straat',
    beschrijving: 'Streetview foto\'s van adressen — raad wie er woont.',
    icon: '🏠',
    links: [
      { label: 'Quiz', href: '/admin/quiz/straat?mode=quiz', variant: 'primary' },
      { label: 'Quiz (moeilijk)', href: '/admin/quiz/straat?mode=quiz&variant=moeilijk', variant: 'secondary' },
      { label: 'Quiz (straat)', href: '/admin/quiz/straat?mode=quiz&variant=straat', variant: 'secondary' },
      { label: 'Antwoorden', href: '/admin/quiz/straat?mode=antwoorden', variant: 'answer' },
    ],
  },
  {
    nummer: 6,
    titel: 'Logo ronde',
    beschrijving: 'Rijssense bedrijfslogo\'s herkennen.',
    icon: '🏢',
    links: [
      { label: 'Quiz', href: '/admin/quiz/logos?mode=quiz', variant: 'primary' },
      { label: 'Antwoorden', href: '/admin/quiz/logos?mode=antwoorden', variant: 'answer' },
    ],
  },
  {
    nummer: 7,
    titel: 'Wie van de 3',
    beschrijving: '3 namen, 1 juist antwoord — gebaseerd op unieke feiten.',
    icon: '🤔',
    links: [
      { label: 'Quiz', href: '/admin/quiz/wie-van-de-3?mode=quiz', variant: 'primary' },
      { label: 'Antwoorden', href: '/admin/quiz/wie-van-de-3?mode=antwoorden', variant: 'answer' },
    ],
  },
];

const linkStyles = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
  secondary: 'bg-slate-600 text-white hover:bg-slate-700',
  answer: 'bg-emerald-600 text-white hover:bg-emerald-700',
};

export default async function QuizOverzichtPage() {
  const authenticated = await isAuthenticated();
  if (!authenticated) redirect('/admin/login');

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <Link
            href="/admin"
            className="text-slate-500 hover:text-slate-700 text-sm font-medium"
          >
            &larr; Terug naar admin
          </Link>
          <h1 className="text-3xl font-bold text-slate-800 mt-3">Quizrondes</h1>
          <p className="text-slate-500 mt-1">Familiedag 2026 — overzicht van alle rondes</p>
        </div>

        {/* Familieportret */}
        <div className="mb-8 rounded-2xl overflow-hidden shadow-sm border border-slate-200">
          <img
            src="/familieportret.png"
            alt="Familieportret"
            className="w-full object-cover"
          />
        </div>

        <div className="space-y-4">
          {RONDES.map((ronde) => (
            <div
              key={ronde.nummer}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex gap-5 items-start"
            >
              <div className="flex-shrink-0 w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-2xl">
                {ronde.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Ronde {ronde.nummer}</span>
                </div>
                <h2 className="text-lg font-semibold text-slate-800">{ronde.titel}</h2>
                <p className="text-sm text-slate-500 mt-0.5">{ronde.beschrijving}</p>
                {ronde.links ? (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {ronde.links.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        target="_blank"
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${linkStyles[link.variant || 'primary']}`}
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-amber-600 mt-2 font-medium">Nog niet beschikbaar</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
