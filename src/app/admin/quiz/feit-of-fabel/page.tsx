import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { getFeitOfFabel } from '@/lib/db';
import PrintButton from '../straat/PrintButton';

export default async function FeitOfFabelPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const authenticated = await isAuthenticated();
  if (!authenticated) redirect('/admin/login');

  const params = await searchParams;
  const mode = params.mode === 'antwoorden' ? 'antwoorden' : 'quiz';

  const stellingen = await getFeitOfFabel();

  return (
    <div className="min-h-screen bg-white">
      {/* Header - hidden when printing */}
      <div className="print:hidden sticky top-0 bg-white border-b border-slate-200 z-10">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <a
            href="/admin/quiz"
            className="text-slate-600 hover:text-slate-800 font-medium"
          >
            &larr; Terug
          </a>
          <div className="flex items-center gap-3">
            <a
              href={`/admin/quiz/feit-of-fabel?mode=${mode === 'quiz' ? 'antwoorden' : 'quiz'}`}
              className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium text-sm"
            >
              {mode === 'quiz' ? 'Bekijk antwoorden' : 'Bekijk quiz'}
            </a>
            <PrintButton />
          </div>
        </div>
      </div>

      {/* Quiz content */}
      <div className="max-w-3xl mx-auto px-6 py-8 print:px-4 print:py-4 print:max-w-none">
        {/* Title */}
        <div className="text-center mb-8 print:mb-6">
          <h1 className="text-3xl font-bold text-slate-800 print:text-2xl">
            Feit of Fabel
          </h1>
          <p className="text-slate-500 mt-2 print:text-sm">
            {mode === 'quiz'
              ? 'Is de stelling waar of niet waar? Omcirkel je antwoord.'
              : 'Antwoordblad — Feit of Fabel'}
          </p>
          <p className="text-sm text-slate-400 mt-1 print:text-xs">
            Familiedag 2026 &bull; {stellingen.length} stellingen
          </p>
        </div>

        {stellingen.length === 0 ? (
          <p className="text-center text-slate-500 py-12">
            Nog geen stellingen toegevoegd.
          </p>
        ) : (
          <div className="space-y-0">
            {stellingen.map((s, idx) => (
              <div
                key={s.id}
                className={`flex items-start gap-4 py-4 ${idx < stellingen.length - 1 ? 'border-b border-slate-200' : ''} print:py-3`}
              >
                {/* Number */}
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm print:w-6 print:h-6 print:text-xs">
                  {idx + 1}
                </div>

                {/* Stelling */}
                <div className="flex-1 pt-1">
                  <p className="text-base text-slate-800 font-medium print:text-sm">
                    {s.stelling}
                  </p>
                </div>

                {/* Waar / Onwaar */}
                <div className="flex-shrink-0 flex gap-3 pt-1">
                  {mode === 'quiz' ? (
                    <>
                      <span className="w-20 text-center py-1 border-2 border-slate-300 rounded-lg text-sm font-semibold text-slate-600 print:border-slate-400 print:py-0.5">
                        WAAR
                      </span>
                      <span className="w-20 text-center py-1 border-2 border-slate-300 rounded-lg text-sm font-semibold text-slate-600 print:border-slate-400 print:py-0.5">
                        NIET WAAR
                      </span>
                    </>
                  ) : (
                    <span className={`w-24 text-center py-1 rounded-lg text-sm font-bold ${
                      s.is_waar
                        ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300'
                        : 'bg-red-100 text-red-700 border-2 border-red-300'
                    }`}>
                      {s.is_waar ? 'WAAR' : 'NIET WAAR'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer for print */}
        {mode === 'quiz' && stellingen.length > 0 && (
          <div className="mt-8 text-center text-xs text-slate-400 print:mt-4">
            Succes! Lever je antwoordblad in bij de quizmaster.
          </div>
        )}
      </div>

      {/* Print styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                margin: 1cm;
                size: A4;
              }
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          `,
        }}
      />
    </div>
  );
}
