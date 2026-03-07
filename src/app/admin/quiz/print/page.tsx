import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { getAllResponses, getFeitOfFabel, getStreetviewQuiz, getCustomLogos, getLogoSelection, getWieVanDe3Manual, getKenJeElkaar, createTables } from '@/lib/db';
import { generateQuestions } from '@/lib/quiz-questions';
import { generateWieVanDe3 } from '@/lib/quiz-wie-van-de-3';
import { BEDRIJVEN } from '@/lib/bedrijven';
import PrintButton from '../straat/PrintButton';
import LogoImage from '../logos/LogoImage';

export default async function PrintAllQuizPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const authenticated = await isAuthenticated();
  if (!authenticated) redirect('/admin/login');

  const params = await searchParams;
  const mode = params.mode === 'antwoorden' ? 'antwoorden' : 'quiz';

  await createTables();

  // Fetch all data in parallel
  const [responses, stellingen, streetviewItems, customLogos, logoSelection, manualQuestions, kenJeElkaarVragen] = await Promise.all([
    getAllResponses(),
    getFeitOfFabel(),
    getStreetviewQuiz(),
    getCustomLogos(),
    getLogoSelection(),
    getWieVanDe3Manual(),
    getKenJeElkaar(),
  ]);

  // Calculate total age for the cover page guessing question
  const now = new Date();
  let totalAge = 0;
  let personCount = 0;
  for (const r of responses) {
    for (const n of [1, 2] as const) {
      if (n === 2 && !r.heeft_partner) continue;
      const geb = r[`geboortedatum_${n}`];
      if (!geb) continue;
      const d = new Date(geb);
      if (isNaN(d.getTime())) continue;
      let age = now.getFullYear() - d.getFullYear();
      const m = now.getMonth() - d.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
      totalAge += age;
      personCount++;
    }
  }

  // Derive quiz data
  const photos = (() => {
    const p: { name: string; url: string; responseId: number }[] = [];
    for (const r of responses) {
      if (r.foto_1_url) p.push({ name: r.naam_1, url: r.foto_1_url, responseId: r.id });
      if (r.foto_2_url && r.naam_2) p.push({ name: r.naam_2, url: r.foto_2_url, responseId: r.id });
    }
    p.sort((a, b) => {
      const hashA = a.name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) * 31 + a.responseId;
      const hashB = b.name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) * 31 + b.responseId;
      return hashA - hashB;
    });
    return p;
  })();

  const cijferQuestions = generateQuestions(responses);
  const wieVanDe3Questions = generateWieVanDe3(responses, manualQuestions);
  const selectedBedrijven = BEDRIJVEN.filter(b => logoSelection.includes(b.naam));

  return (
    <div className="bg-white">
      {/* Header - hidden when printing */}
      <div className="print:hidden sticky top-0 bg-white border-b border-slate-200 z-10">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <a
            href="/admin/quiz"
            className="text-slate-600 hover:text-slate-800 font-medium"
          >
            &larr; Terug naar overzicht
          </a>
          <div className="flex items-center gap-3">
            <a
              href={`/admin/quiz/print?mode=${mode === 'quiz' ? 'antwoorden' : 'quiz'}`}
              className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium text-sm"
            >
              {mode === 'quiz' ? 'Bekijk antwoorden' : 'Bekijk formulieren'}
            </a>
            <PrintButton />
          </div>
        </div>
      </div>

      {/* ==================== VOORBLAD ==================== */}
      <div className="print-section">
        <div className="px-8 py-16 print:px-[2cm] print:py-[2cm] print:h-[297mm] print:flex print:flex-col print:justify-between">
          <div>
            <div className="text-center mb-16">
              <h1 className="text-5xl font-bold text-slate-800 print:text-4xl">Familiequiz</h1>
              <p className="text-xl text-slate-500 mt-3">Familiedag 2026</p>
            </div>

            <div className="max-w-sm mx-auto space-y-8">
              <div>
                <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Teamnaam</label>
                <div className="border-b-2 border-slate-300 h-10 mt-1" />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Deelnemers</label>
                <div className="space-y-3 mt-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{i}</span>
                      <div className="border-b-2 border-slate-300 h-8 flex-1" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Schattingsvraag */}
            <div className="max-w-sm mx-auto mt-12 p-6 bg-blue-50 border-2 border-blue-200 rounded-xl">
              <h3 className="font-bold text-blue-800 text-lg">Schattingsvraag</h3>
              <p className="text-blue-700 mt-2 text-sm">
                Wat is de totale leeftijd van alle {personCount} familieleden die de enquete hebben ingevuld bij elkaar opgeteld?
              </p>
              <div className="flex items-center gap-3 mt-4">
                <span className="text-blue-600 font-medium text-sm">Ons antwoord:</span>
                <div className="border-b-2 border-blue-300 h-8 w-28" />
                <span className="text-blue-500 text-sm">jaar</span>
              </div>
              {mode === 'antwoorden' && (
                <div className="mt-3 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <span className="font-bold text-emerald-700">{totalAge} jaar</span>
                  <span className="text-emerald-600 text-sm ml-2">({personCount} personen)</span>
                </div>
              )}
            </div>
          </div>

          <div className="text-center text-xs text-slate-400 mt-8">
            Veel plezier en succes!
          </div>
        </div>
      </div>

      {/* ==================== RONDE 1: Raad de kinderfoto ==================== */}
      <div className="print-section">
        <div className="max-w-5xl mx-auto px-4 py-4 print:p-[1cm] print:max-w-none">
          <RondeKop nummer={1} titel="Wie is Wie?" mode={mode} />

          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2 print:gap-1.5">
              {photos.map((photo, idx) => (
                <div key={`${photo.responseId}-${photo.name}`} className="text-center print:break-inside-avoid">
                  <div className="aspect-[3/4] bg-slate-100 rounded-lg overflow-hidden relative">
                    <img src={photo.url} alt={mode === 'antwoorden' ? photo.name : `Foto ${idx + 1}`} className="w-full h-full object-cover grayscale" />
                    <div className="absolute top-1 left-1 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-[10px] shadow">
                      {idx + 1}
                    </div>
                  </div>
                  <div className="mt-0.5">
                    {mode === 'quiz' ? (
                      <div className="border-b-2 border-dashed border-slate-300 h-5" />
                    ) : (
                      <p className="font-semibold text-slate-800 text-[11px] leading-tight">{photo.name}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <ScoreSectie count={photos.length} mode={mode} />
        </div>
      </div>

      {/* ==================== RONDE 2: Feit of fabel (answer form only) ==================== */}
      <div className="print-section">
        <div className="max-w-4xl mx-auto px-6 py-4 print:p-[1cm] print:max-w-none">
          <RondeKop nummer={2} titel="Feit of Fabel" mode={mode} />

          {stellingen.length > 0 && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-0">
              {stellingen.map((s, idx) => {
                const correctIsWaar = s.is_waar;
                return (
                  <div key={s.id} className="flex gap-1.5 items-center py-1.5 border-b border-slate-100">
                    <div className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-[10px]">
                      {idx + 1}
                    </div>
                    {mode === 'quiz' ? (
                      <div className="flex gap-1.5 flex-shrink-0 items-center">
                        {(['feit', 'fabel'] as const).map((optie) => (
                          <div
                            key={optie}
                            className="px-2.5 py-0.5 border-2 border-slate-300 rounded-full text-xs font-semibold text-slate-500"
                          >
                            {optie === 'feit' ? 'Feit' : 'Fabel'}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-slate-800 leading-snug flex-1 min-w-0">{s.stelling}</p>
                        <div className="flex gap-1.5 flex-shrink-0 items-center">
                          {(['feit', 'fabel'] as const).map((optie) => {
                            const isCorrect = optie === 'feit' ? correctIsWaar : !correctIsWaar;
                            return (
                              <div
                                key={optie}
                                className={`px-2 py-0.5 border-2 rounded-full text-[10px] font-semibold ${
                                  isCorrect
                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                    : 'border-slate-200 text-slate-300'
                                }`}
                              >
                                {optie === 'feit' ? 'Feit' : 'Fabel'}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <ScoreSectie count={stellingen.length} mode={mode} />
        </div>
      </div>

      {/* ==================== RONDE 3: Cijferronde (answer form only) ==================== */}
      <div className="print-section">
        <div className="max-w-4xl mx-auto px-6 py-4 print:p-[1cm] print:max-w-none">
          <RondeKop nummer={3} titel="Cijferronde" mode={mode} />

          {cijferQuestions.length > 0 && (
            mode === 'quiz' ? (
              <div className="space-y-3 print:space-y-2">
                {cijferQuestions.map((q) => (
                  <div key={q.number} className="print:break-inside-avoid flex gap-2 items-center py-1 border-b border-slate-100">
                    <div className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-[10px]">
                      {q.number}
                    </div>
                    {q.type === 'multiple_choice' && q.options ? (
                      <div className="flex gap-1.5">
                        {q.options.map((opt, i) => (
                          <div key={i} className="flex items-center gap-1 px-2 py-1 bg-slate-50 rounded border border-slate-200 text-xs">
                            <span className="w-4 h-4 border-2 border-slate-300 rounded-full flex items-center justify-center text-[9px] font-bold text-slate-400 flex-shrink-0">
                              {String.fromCharCode(65 + i)}
                            </span>
                            <span className="text-slate-600">{opt}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="border-b-2 border-dashed border-slate-300 w-40 h-5" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-5 print:space-y-3">
                {cijferQuestions.map((q) => (
                  <div key={q.number} className="print:break-inside-avoid">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs">
                        {q.number}
                      </div>
                      <div className="flex-1">
                        <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">{q.category}</span>
                        <p className="font-medium text-slate-800 mt-0.5 whitespace-pre-line print:text-sm">{q.question}</p>
                        <div className="mt-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg print:text-sm">
                          <span className="font-semibold text-emerald-700">{q.answer}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          <ScoreSectie count={cijferQuestions.length} mode={mode} />
        </div>
      </div>

      {/* ==================== RONDE 4: Hoe goed ken je elkaar (answer form only) ==================== */}
      <div className="print-section">
        <div className="max-w-4xl mx-auto px-6 py-4 print:p-[1cm] print:max-w-none">
          <RondeKop nummer={4} titel="Hoe goed ken je elkaar?" mode={mode} />

          {kenJeElkaarVragen.length > 0 && (
            mode === 'quiz' ? (
              <div className="space-y-2 print:space-y-1.5">
                {kenJeElkaarVragen.map((v, idx) => (
                  <div key={v.id} className="print:break-inside-avoid flex gap-2 items-center py-1 border-b border-slate-100">
                    <div className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-[10px]">
                      {idx + 1}
                    </div>
                    {v.threshold !== null ? (
                      <div className="flex gap-2">
                        {(['Meer', 'Minder'] as const).map((optie) => (
                          <div key={optie} className="px-3 py-1 border-2 border-slate-300 rounded-full text-xs font-semibold text-slate-500">
                            {optie}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="border-b-2 border-dashed border-slate-300 w-40 h-5" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4 print:space-y-3">
                {kenJeElkaarVragen.map((v, idx) => {
                  const realAnswer = parseInt(v.answer);
                  const isMeer = v.threshold !== null && !isNaN(realAnswer) && realAnswer > v.threshold;
                  return (
                    <div key={v.id} className="print:break-inside-avoid border border-slate-200 rounded-lg p-3">
                      <div className="flex gap-2 items-start">
                        <div className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-[10px]">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-800 text-sm">{v.question}</p>
                          {v.threshold !== null ? (
                            <div className="flex gap-2 mt-1.5">
                              {(['meer', 'minder'] as const).map((optie) => {
                                const isCorrect = optie === 'meer' ? isMeer : !isMeer;
                                return (
                                  <div key={optie} className={`px-3 py-1 border-2 rounded-full text-xs font-semibold ${isCorrect ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-300'}`}>
                                    {optie === 'meer' ? 'Meer' : 'Minder'}
                                  </div>
                                );
                              })}
                              <span className="text-sm font-semibold text-emerald-700 ml-2">{v.answer}</span>
                            </div>
                          ) : (
                            <div className="mt-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-sm">
                              <span className="font-semibold text-emerald-700">{v.answer}</span>
                            </div>
                          )}
                          {v.toelichting && (
                            <p className="text-[10px] text-slate-500 mt-1">{v.toelichting}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          <ScoreSectie count={kenJeElkaarVragen.length} mode={mode} />
        </div>
      </div>

      {/* ==================== RONDE 5: Raad de straat ==================== */}
      <div className="print-section">
        <div className="max-w-5xl mx-auto px-4 py-4 print:p-[1cm] print:max-w-none">
          <RondeKop nummer={5} titel="Raad de Straat!" mode={mode} />

          {streetviewItems.length > 0 && (
            <div className="grid grid-cols-2 gap-2 print:gap-1.5">
              {streetviewItems.map((item) => (
                <div key={item.id} className="border border-slate-200 rounded-lg overflow-hidden print:break-inside-avoid">
                  <div className="aspect-[16/10] bg-slate-100 relative">
                    <img src={item.blob_url_street || item.blob_url} alt={`Vraag ${item.question_number}`} className="w-full h-full object-cover" />
                    <div className="absolute top-1 left-1 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-[10px] shadow">
                      {item.question_number}
                    </div>
                  </div>
                  <div className="px-1.5 py-1">
                    {mode === 'quiz' ? (
                      <div className="border-b-2 border-dashed border-slate-300 h-5" />
                    ) : (
                      <div>
                        <p className="font-semibold text-slate-800 text-[11px] leading-tight">{item.names}</p>
                        <p className="text-[10px] text-slate-500">{item.address}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <ScoreSectie count={streetviewItems.length} mode={mode} />
        </div>
      </div>

      {/* ==================== RONDE 6: Logo ronde ==================== */}
      <div className="print-section">
        <div className="max-w-5xl mx-auto px-4 py-4 print:p-[0.8cm] print:max-w-none">
          <RondeKop nummer={6} titel="Logo Quiz" mode={mode} />

          {selectedBedrijven.length > 0 && (
            <div className="grid grid-cols-4 gap-2 print:gap-1.5">
              {selectedBedrijven.map((bedrijf, idx) => (
                <div key={bedrijf.naam} className="text-center print:break-inside-avoid">
                  <div className="aspect-square bg-white rounded overflow-hidden relative border border-slate-200 flex items-center justify-center">
                    <div className="w-16 h-16">
                      <LogoImage bedrijf={bedrijf} customLogos={customLogos} />
                    </div>
                    <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-[8px] shadow">
                      {idx + 1}
                    </div>
                  </div>
                  <div className="mt-1">
                    {mode === 'quiz' ? (
                      <div className="border-b-2 border-dashed border-slate-300 h-5" />
                    ) : (
                      <p className="font-semibold text-slate-800 text-[10px] leading-tight">{bedrijf.naam}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ==================== RONDE 7: Wie van de 3 (answer form only) ==================== */}
      <div>
        <div className="max-w-4xl mx-auto px-6 py-4 print:p-[1cm] print:max-w-none">
          <RondeKop nummer={7} titel="Wie van de 3?" mode={mode} />

          {wieVanDe3Questions.length > 0 && (
            mode === 'quiz' ? (
              <div className="space-y-2 print:space-y-1.5">
                {wieVanDe3Questions.map((q) => (
                  <div key={q.number} className="print:break-inside-avoid flex gap-2 items-center py-1 border-b border-slate-100">
                    <div className="flex-shrink-0 w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-[10px]">
                      {q.number}
                    </div>
                    <div className="flex gap-1.5">
                      {q.names.map((name, i) => (
                        <div key={i} className="flex items-center gap-1 px-2 py-1 border-2 border-slate-200 rounded-full text-xs">
                          <span className="font-bold text-slate-400">{String.fromCharCode(65 + i)}</span>
                          <span className="text-slate-600">{name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3 print:space-y-2">
                {wieVanDe3Questions.map((q) => (
                  <div key={q.number} className="print:break-inside-avoid flex gap-2 items-start py-1 border-b border-slate-100">
                    <div className="flex-shrink-0 w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-[10px] mt-0.5">
                      {q.number}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-800">{q.question}</p>
                      <div className="flex gap-1.5 mt-1">
                        {q.names.map((name, i) => {
                          const isAnswer = i === q.answerIndex;
                          return (
                            <div key={i} className={`flex items-center gap-1 px-2 py-1 border-2 rounded-full text-xs ${isAnswer ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'}`}>
                              <span className={`font-bold ${isAnswer ? 'text-emerald-600' : 'text-slate-400'}`}>{String.fromCharCode(65 + i)}</span>
                              <span className={isAnswer ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>{name}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          <ScoreSectie count={wieVanDe3Questions.length} mode={mode} />
        </div>
      </div>

      {/* Print styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                margin: 0;
                size: A4;
              }
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .print-section {
                break-after: page;
              }
            }
          `,
        }}
      />
    </div>
  );
}

function RondeKop({ nummer, titel, mode }: { nummer: number; titel: string; mode: string }) {
  return (
    <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
      <h2 className="text-base font-bold text-slate-800">
        <span className="text-blue-600">Ronde {nummer}:</span> {titel}
        {mode === 'antwoorden' && <span className="text-emerald-600 text-sm font-medium ml-2">(antwoorden)</span>}
      </h2>
      {mode === 'quiz' && (
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <span>Team:</span>
          <div className="border-b border-slate-300 w-24 h-4" />
        </div>
      )}
    </div>
  );
}

function ScoreSectie({ count, mode }: { count: number; mode: string }) {
  if (mode !== 'quiz' || count === 0) return null;
  return (
    <div className="mt-4 pt-2 border-t-2 border-dashed border-slate-300">
      <div className="flex items-center justify-between">
        <p className="font-medium text-slate-600 text-sm">Score:</p>
        <div className="flex items-center gap-1">
          <div className="border-b-2 border-dashed border-slate-300 w-8 h-5" />
          <span className="text-sm text-slate-400">/ {count}</span>
        </div>
      </div>
    </div>
  );
}
