import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { getAllResponses, getWieVanDe3Manual, createTables } from '@/lib/db';
import { generateWieVanDe3 } from '@/lib/quiz-wie-van-de-3';
import PrintButton from '../straat/PrintButton';

export default async function WieVanDe3Page({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const authenticated = await isAuthenticated();
  if (!authenticated) redirect('/admin/login');

  const params = await searchParams;
  const mode = params.mode === 'antwoorden' ? 'antwoorden' : 'quiz';
  await createTables();
  const [responses, manualQuestions] = await Promise.all([getAllResponses(), getWieVanDe3Manual()]);
  const questions = generateWieVanDe3(responses, manualQuestions);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="print:hidden sticky top-0 bg-white border-b border-slate-200 z-10">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <a
            href="/admin?tab=wievande3"
            className="text-slate-600 hover:text-slate-800 font-medium"
          >
            &larr; Terug naar admin
          </a>
          <div className="flex items-center gap-3">
            <a
              href={`/admin/quiz/wie-van-de-3?mode=${mode === 'quiz' ? 'antwoorden' : 'quiz'}`}
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
        <div className="text-center mb-10 print:mb-6">
          <h1 className="text-3xl font-bold text-slate-800 print:text-2xl">
            Wie van de 3?
          </h1>
          <p className="text-slate-500 mt-2 print:text-sm">
            {mode === 'quiz'
              ? 'Bij elke vraag horen 3 namen. Slechts 1 is het juiste antwoord!'
              : 'Antwoordblad - Wie van de 3?'}
          </p>
        </div>

        {questions.length === 0 ? (
          <p className="text-center text-slate-500 py-12">
            Niet genoeg data om vragen te genereren. Wacht tot er meer inzendingen zijn.
          </p>
        ) : (
          <div className="space-y-6 print:space-y-4">
            {questions.map((q) => (
              <div
                key={q.number}
                className="print:break-inside-avoid border border-slate-200 rounded-xl p-5 print:p-3 print:rounded-lg"
              >
                <div className="flex gap-3 items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm print:w-6 print:h-6 print:text-xs">
                    {q.number}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-800 print:text-sm">
                      {q.question}
                    </p>

                    <div className="flex gap-3 mt-3 print:mt-2">
                      {q.names.map((name, i) => {
                        const isAnswer = i === q.answerIndex;
                        const letter = String.fromCharCode(65 + i);

                        return (
                          <div
                            key={i}
                            className={`flex-1 text-center px-3 py-3 rounded-lg border-2 print:py-2 ${
                              mode === 'antwoorden' && isAnswer
                                ? 'border-emerald-500 bg-emerald-50'
                                : 'border-slate-200 bg-slate-50'
                            }`}
                          >
                            <span className={`text-xs font-bold block mb-0.5 ${
                              mode === 'antwoorden' && isAnswer ? 'text-emerald-600' : 'text-slate-400'
                            }`}>
                              {letter}
                            </span>
                            <span className={`font-semibold text-sm print:text-xs ${
                              mode === 'antwoorden' && isAnswer ? 'text-emerald-700' : 'text-slate-700'
                            }`}>
                              {name}
                            </span>
                            {mode === 'antwoorden' && isAnswer && (
                              <span className="block text-emerald-600 text-xs mt-0.5">&#10003;</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {mode === 'quiz' && (
                      <div className="flex items-center gap-2 mt-3 print:mt-2">
                        <span className="text-xs text-slate-400">Mijn antwoord:</span>
                        <div className="flex gap-2">
                          {['A', 'B', 'C'].map((letter) => (
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
