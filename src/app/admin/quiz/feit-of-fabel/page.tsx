import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { getFeitOfFabel, createTables } from '@/lib/db';
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

  await createTables();
  const stellingen = await getFeitOfFabel();

  return (
    <div className="min-h-screen bg-white">
      {/* Header - hidden when printing */}
      <div className="print:hidden sticky top-0 bg-white border-b border-slate-200 z-10">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
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
            <a
              href="/api/quiz/feit-of-fabel-pptx"
              className="px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium text-sm"
            >
              PowerPoint
            </a>
            <PrintButton />
          </div>
        </div>
      </div>

      {/* Quiz content */}
      <div className="max-w-4xl mx-auto px-6 py-8 print:p-[1cm] print:max-w-none">
        {/* Title */}
        <div className="text-center mb-10 print:mb-6">
          <h1 className="text-3xl font-bold text-slate-800 print:text-2xl">
            Feit of Fabel
          </h1>
          <p className="text-slate-500 mt-2 print:text-sm">
            {mode === 'quiz'
              ? 'Is de stelling waar of niet waar? Omcirkel je antwoord.'
              : 'Antwoordblad — Feit of Fabel'}
          </p>
        </div>

        {stellingen.length === 0 ? (
          <p className="text-center text-slate-500 py-12">
            Nog geen stellingen toegevoegd.
          </p>
        ) : (
          <div className="space-y-6 print:space-y-4">
            {stellingen.map((s, idx) => (
              <div
                key={s.id}
                className="print:break-inside-avoid border border-slate-200 rounded-xl p-5 print:p-3 print:rounded-lg"
              >
                <div className="flex gap-3 items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm print:w-6 print:h-6 print:text-xs">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-800 print:text-sm">
                      {s.stelling}
                    </p>

                    <div className="flex gap-3 mt-3 print:mt-2">
                      {(['feit', 'fabel'] as const).map((optie) => {
                        const isCorrect = optie === 'feit' ? s.is_waar : !s.is_waar;

                        return (
                          <div
                            key={optie}
                            className={`flex-1 text-center px-3 py-3 rounded-lg border-2 print:py-2 ${
                              mode === 'antwoorden' && isCorrect
                                ? 'border-emerald-500 bg-emerald-50'
                                : 'border-slate-200 bg-slate-50'
                            }`}
                          >
                            <span className={`text-xs font-bold block mb-0.5 ${
                              mode === 'antwoorden' && isCorrect ? 'text-emerald-600' : 'text-slate-400'
                            }`}>
                              {optie === 'feit' ? 'A' : 'B'}
                            </span>
                            <span className={`font-semibold text-sm print:text-xs uppercase tracking-wide ${
                              mode === 'antwoorden' && isCorrect ? 'text-emerald-700' : 'text-slate-700'
                            }`}>
                              {optie === 'feit' ? 'Feit' : 'Fabel'}
                            </span>
                            {mode === 'antwoorden' && isCorrect && (
                              <span className="block text-emerald-600 text-xs mt-0.5">&#10003;</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {mode === 'antwoorden' && s.toelichting && (
                      <p className="text-xs text-slate-500 mt-2 italic print:mt-1">
                        {s.toelichting}
                      </p>
                    )}

                    {mode === 'quiz' && (
                      <div className="flex items-center gap-2 mt-3 print:mt-2">
                        <span className="text-xs text-slate-400">Mijn antwoord:</span>
                        <div className="flex gap-2">
                          {['A', 'B'].map((letter) => (
                            <div
                              key={letter}
                              className="w-7 h-7 border-2 border-slate-300 rounded-full flex items-center justify-center text-xs font-bold text-slate-400 print:w-6 print:h-6"
                            >
                              {letter}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Score section */}
        {mode === 'quiz' && stellingen.length > 0 && (
          <div className="mt-10 pt-6 border-t-2 border-dashed border-slate-300 print:mt-6 print:pt-4">
            <div className="flex items-center justify-between">
              <p className="font-medium text-slate-600">Totaal score:</p>
              <div className="flex items-center gap-2">
                <div className="border-b-2 border-dashed border-slate-300 w-12 h-7" />
                <span className="text-slate-500">/ {stellingen.length}</span>
              </div>
            </div>
          </div>
        )}

        {mode === 'quiz' && stellingen.length > 0 && (
          <div className="mt-6 text-center text-xs text-slate-400 print:mt-4">
            Succes! Lever je antwoordblad in bij de quizmaster.
          </div>
        )}
      </div>

      {/* Print styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page { margin: 0; size: A4; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          `,
        }}
      />
    </div>
  );
}
