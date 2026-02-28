import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { getKenJeElkaar, createTables } from '@/lib/db';
import PrintButton from '../straat/PrintButton';

export default async function KenJeElkaarPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const authenticated = await isAuthenticated();
  if (!authenticated) redirect('/admin/login');

  const params = await searchParams;
  const mode = params.mode === 'antwoorden' ? 'antwoorden' : 'quiz';

  await createTables();
  const vragen = await getKenJeElkaar();

  return (
    <div className="min-h-screen bg-white">
      {/* Header - hidden when printing */}
      <div className="print:hidden sticky top-0 bg-white border-b border-slate-200 z-10">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <a
            href="/admin?tab=kenjeeelkaar"
            className="text-slate-600 hover:text-slate-800 font-medium"
          >
            &larr; Terug naar admin
          </a>
          <div className="flex items-center gap-3">
            <a
              href={`/admin/quiz/ken-je-elkaar?mode=${mode === 'quiz' ? 'antwoorden' : 'quiz'}`}
              className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium text-sm"
            >
              {mode === 'quiz' ? 'Bekijk antwoorden' : 'Bekijk quiz'}
            </a>
            <PrintButton />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8 print:px-4 print:py-4 print:max-w-none">
        {/* Title */}
        <div className="text-center mb-10 print:mb-6">
          <h1 className="text-3xl font-bold text-slate-800 print:text-2xl">
            Hoe goed ken je elkaar?
          </h1>
          <p className="text-slate-500 mt-2 print:text-sm">
            {mode === 'quiz'
              ? 'Beantwoord de vragen zo goed mogelijk!'
              : 'Antwoordblad — Hoe goed ken je elkaar?'}
          </p>
          <p className="text-sm text-slate-400 mt-1 print:text-xs">
            Familiedag 2026 &bull; {vragen.length} vragen
          </p>
        </div>

        {vragen.length === 0 ? (
          <p className="text-center text-slate-500 py-12">
            Nog geen vragen toegevoegd.
          </p>
        ) : (
          <div className="space-y-8 print:space-y-5">
            {vragen.map((v, idx) => (
              <div
                key={v.id}
                className="print:break-inside-avoid"
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm print:w-6 print:h-6 print:text-xs">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-800 mt-0.5 print:text-sm">
                      {v.question}
                    </p>

                    {mode === 'quiz' ? (
                      <div className="mt-3">
                        {v.type === 'number' ? (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-slate-500 text-sm">Antwoord:</span>
                            <div className="border-b-2 border-dashed border-slate-300 w-32 h-7 print:h-6" />
                          </div>
                        ) : (
                          <div className="border-b-2 border-dashed border-slate-300 h-7 mt-2 print:h-6" />
                        )}
                      </div>
                    ) : (
                      <div className="mt-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg print:text-sm">
                        <span className="font-semibold text-emerald-700">{v.answer}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Score section for quiz mode */}
        {mode === 'quiz' && vragen.length > 0 && (
          <div className="mt-10 pt-6 border-t-2 border-dashed border-slate-300 print:mt-6 print:pt-4">
            <div className="flex items-center justify-between">
              <p className="font-medium text-slate-600">Totaal score:</p>
              <div className="flex items-center gap-2">
                <div className="border-b-2 border-dashed border-slate-300 w-12 h-7" />
                <span className="text-slate-500">/ {vragen.length}</span>
              </div>
            </div>
          </div>
        )}

        {mode === 'quiz' && vragen.length > 0 && (
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
              @page { margin: 1.5cm; size: A4; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          `,
        }}
      />
    </div>
  );
}
