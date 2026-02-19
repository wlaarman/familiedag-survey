import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { getAllResponses } from '@/lib/db';
import { generateQuestions } from '@/lib/quiz-questions';
import PrintButton from '../straat/PrintButton';

export default async function CijferQuizPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const authenticated = await isAuthenticated();
  if (!authenticated) redirect('/admin/login');

  const params = await searchParams;
  const mode = params.mode === 'antwoorden' ? 'antwoorden' : 'quiz';
  const responses = await getAllResponses();
  const questions = generateQuestions(responses);

  return (
    <div className="min-h-screen bg-white">
      {/* Header - hidden when printing */}
      <div className="print:hidden sticky top-0 bg-white border-b border-slate-200 z-10">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <a
            href="/admin?tab=cijferquiz"
            className="text-slate-600 hover:text-slate-800 font-medium"
          >
            &larr; Terug naar admin
          </a>
          <div className="flex items-center gap-3">
            <a
              href={`/admin/quiz/cijfers?mode=${mode === 'quiz' ? 'antwoorden' : 'quiz'}`}
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
            Cijferronde
          </h1>
          <p className="text-slate-500 mt-2 print:text-sm">
            {mode === 'quiz'
              ? 'Hoe goed ken je de familie? Test je kennis met deze vragen!'
              : 'Antwoordblad - Cijferronde'}
          </p>
          <p className="text-sm text-slate-400 mt-1 print:text-xs">
            Familiedag 2026 &bull; {questions.length} vragen
          </p>
        </div>

        {questions.length === 0 ? (
          <p className="text-center text-slate-500 py-12">
            Niet genoeg data om vragen te genereren. Wacht tot er meer inzendingen zijn.
          </p>
        ) : (
          <div className="space-y-8 print:space-y-5">
            {questions.map((q) => (
              <div
                key={q.number}
                className="print:break-inside-avoid"
              >
                {/* Question */}
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm print:w-6 print:h-6 print:text-xs">
                    {q.number}
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">{q.category}</span>
                    <p className="font-medium text-slate-800 mt-0.5 whitespace-pre-line print:text-sm">
                      {q.question}
                    </p>

                    {/* Options or answer space */}
                    {mode === 'quiz' ? (
                      <div className="mt-3">
                        {q.type === 'multiple_choice' && q.options ? (
                          <div className="grid grid-cols-2 gap-2 print:gap-1">
                            {q.options.map((opt, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 print:py-1.5 print:text-sm"
                              >
                                <span className="w-6 h-6 bg-white border-2 border-slate-300 rounded-full flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0 print:w-5 print:h-5">
                                  {String.fromCharCode(65 + i)}
                                </span>
                                <span className="text-slate-700">{opt}</span>
                              </div>
                            ))}
                          </div>
                        ) : q.type === 'number' ? (
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
                        <span className="font-semibold text-emerald-700">{q.answer}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Score section for quiz mode */}
        {mode === 'quiz' && questions.length > 0 && (
          <div className="mt-10 pt-6 border-t-2 border-dashed border-slate-300 print:mt-6 print:pt-4">
            <div className="flex items-center justify-between">
              <p className="font-medium text-slate-600">Totaal score:</p>
              <div className="flex items-center gap-2">
                <div className="border-b-2 border-dashed border-slate-300 w-12 h-7" />
                <span className="text-slate-500">/ {questions.length}</span>
              </div>
            </div>
          </div>
        )}

        {mode === 'quiz' && (
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
              @page {
                margin: 1.5cm;
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
