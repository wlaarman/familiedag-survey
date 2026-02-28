import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { getAllResponses, getFeitOfFabel, getStreetviewQuiz, getCustomLogos, getLogoSelection, getWieVanDe3Manual, getKenJeElkaar, createTables } from '@/lib/db';
import { generateQuestions } from '@/lib/quiz-questions';
import { generateWieVanDe3 } from '@/lib/quiz-wie-van-de-3';
import { BEDRIJVEN } from '@/lib/bedrijven';
import LogoImage from '../logos/LogoImage';
import PrintButton from '../straat/PrintButton';

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
            href="/admin?tab=quiz"
            className="text-slate-600 hover:text-slate-800 font-medium"
          >
            &larr; Terug naar admin
          </a>
          <div className="flex items-center gap-3">
            <a
              href={`/admin/quiz/print?mode=${mode === 'quiz' ? 'antwoorden' : 'quiz'}`}
              className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium text-sm"
            >
              {mode === 'quiz' ? 'Bekijk antwoorden' : 'Bekijk quiz'}
            </a>
            <PrintButton />
          </div>
        </div>
      </div>

      {/* ==================== RONDE 1: Raad de kinderfoto ==================== */}
      <div className="print-section">
        <div className="max-w-5xl mx-auto px-6 py-8 print:px-0 print:py-4 print:max-w-none">
          <div className="text-center mb-8 print:mb-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Ronde 1</p>
            <h1 className="text-3xl font-bold text-slate-800 print:text-2xl">Wie is Wie?</h1>
            <p className="text-slate-500 mt-2 print:text-sm">
              {mode === 'quiz'
                ? 'Ken je alle familieleden? Schrijf de naam onder elke foto.'
                : 'Antwoordblad — Wie is Wie?'}
            </p>
            <p className="text-sm text-slate-400 mt-1 print:text-xs">
              Familiedag 2026 &bull; {photos.length} foto&apos;s
            </p>
          </div>

          {photos.length > 0 && (
            <div className="grid grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">
              {photos.map((photo, idx) => (
                <div key={`${photo.responseId}-${photo.name}`} className="text-center print:break-inside-avoid">
                  <div className="aspect-[3/4] bg-slate-100 rounded-xl overflow-hidden relative shadow-sm print:rounded-lg">
                    <img src={photo.url} alt={mode === 'antwoorden' ? photo.name : `Foto ${idx + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow print:w-6 print:h-6 print:text-xs">
                      {idx + 1}
                    </div>
                  </div>
                  <div className="mt-3 print:mt-2">
                    {mode === 'quiz' ? (
                      <div className="border-b-2 border-dashed border-slate-300 h-7 mx-2 print:h-6" />
                    ) : (
                      <p className="font-semibold text-slate-800 text-sm print:text-xs">{photo.name}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {mode === 'quiz' && photos.length > 0 && (
            <div className="mt-10 pt-6 border-t-2 border-dashed border-slate-300 print:mt-6 print:pt-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-slate-600">Totaal score:</p>
                <div className="flex items-center gap-2">
                  <div className="border-b-2 border-dashed border-slate-300 w-12 h-7" />
                  <span className="text-slate-500">/ {photos.length}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==================== RONDE 2: Feit of fabel ==================== */}
      <div className="print-section">
        <div className="max-w-4xl mx-auto px-6 py-8 print:px-4 print:py-4 print:max-w-none">
          <div className="text-center mb-10 print:mb-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Ronde 2</p>
            <h1 className="text-3xl font-bold text-slate-800 print:text-2xl">Feit of Fabel</h1>
            <p className="text-slate-500 mt-2 print:text-sm">
              {mode === 'quiz'
                ? 'Is de stelling waar of niet waar? Omcirkel je antwoord.'
                : 'Antwoordblad — Feit of Fabel'}
            </p>
            <p className="text-sm text-slate-400 mt-1 print:text-xs">
              Familiedag 2026 &bull; {stellingen.length} stellingen
            </p>
          </div>

          {stellingen.length > 0 && (
            <div className="space-y-6 print:space-y-4">
              {stellingen.map((s, idx) => (
                <div key={s.id} className="print:break-inside-avoid border border-slate-200 rounded-xl p-5 print:p-3 print:rounded-lg">
                  <div className="flex gap-3 items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm print:w-6 print:h-6 print:text-xs">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-800 print:text-sm">{s.stelling}</p>
                      <div className="flex gap-3 mt-3 print:mt-2">
                        {(['feit', 'fabel'] as const).map((optie) => {
                          const isCorrect = optie === 'feit' ? s.is_waar : !s.is_waar;
                          return (
                            <div key={optie} className={`flex-1 text-center px-3 py-3 rounded-lg border-2 print:py-2 ${mode === 'antwoorden' && isCorrect ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
                              <span className={`text-xs font-bold block mb-0.5 ${mode === 'antwoorden' && isCorrect ? 'text-emerald-600' : 'text-slate-400'}`}>
                                {optie === 'feit' ? 'A' : 'B'}
                              </span>
                              <span className={`font-semibold text-sm print:text-xs uppercase tracking-wide ${mode === 'antwoorden' && isCorrect ? 'text-emerald-700' : 'text-slate-700'}`}>
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
                        <p className="text-xs text-slate-500 mt-2 italic print:mt-1">{s.toelichting}</p>
                      )}
                      {mode === 'quiz' && (
                        <div className="flex items-center gap-2 mt-3 print:mt-2">
                          <span className="text-xs text-slate-400">Mijn antwoord:</span>
                          <div className="flex gap-2">
                            {['A', 'B'].map((letter) => (
                              <div key={letter} className="w-7 h-7 border-2 border-slate-300 rounded-full flex items-center justify-center text-xs font-bold text-slate-400 print:w-6 print:h-6">
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
        </div>
      </div>

      {/* ==================== RONDE 3: Cijferronde ==================== */}
      <div className="print-section">
        <div className="max-w-4xl mx-auto px-6 py-8 print:px-4 print:py-4 print:max-w-none">
          <div className="text-center mb-10 print:mb-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Ronde 3</p>
            <h1 className="text-3xl font-bold text-slate-800 print:text-2xl">Cijferronde</h1>
            <p className="text-slate-500 mt-2 print:text-sm">
              {mode === 'quiz'
                ? 'Hoe goed ken je de familie? Test je kennis met deze vragen!'
                : 'Antwoordblad — Cijferronde'}
            </p>
            <p className="text-sm text-slate-400 mt-1 print:text-xs">
              Familiedag 2026 &bull; {cijferQuestions.length} vragen
            </p>
          </div>

          {cijferQuestions.length > 0 && (
            <div className="space-y-8 print:space-y-5">
              {cijferQuestions.map((q) => (
                <div key={q.number} className="print:break-inside-avoid">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm print:w-6 print:h-6 print:text-xs">
                      {q.number}
                    </div>
                    <div className="flex-1">
                      <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">{q.category}</span>
                      <p className="font-medium text-slate-800 mt-0.5 whitespace-pre-line print:text-sm">{q.question}</p>
                      {mode === 'quiz' ? (
                        <div className="mt-3">
                          {q.type === 'multiple_choice' && q.options ? (
                            <div className="grid grid-cols-2 gap-2 print:gap-1">
                              {q.options.map((opt, i) => (
                                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 print:py-1.5 print:text-sm">
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

          {mode === 'quiz' && cijferQuestions.length > 0 && (
            <div className="mt-10 pt-6 border-t-2 border-dashed border-slate-300 print:mt-6 print:pt-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-slate-600">Totaal score:</p>
                <div className="flex items-center gap-2">
                  <div className="border-b-2 border-dashed border-slate-300 w-12 h-7" />
                  <span className="text-slate-500">/ {cijferQuestions.length}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==================== RONDE 4: Hoe goed ken je elkaar ==================== */}
      <div className="print-section">
        <div className="max-w-4xl mx-auto px-6 py-8 print:px-4 print:py-4 print:max-w-none">
          <div className="text-center mb-10 print:mb-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Ronde 4</p>
            <h1 className="text-3xl font-bold text-slate-800 print:text-2xl">Hoe goed ken je elkaar?</h1>
            <p className="text-slate-500 mt-2 print:text-sm">
              {mode === 'quiz'
                ? 'Beantwoord de vragen zo goed mogelijk!'
                : 'Antwoordblad — Hoe goed ken je elkaar?'}
            </p>
            <p className="text-sm text-slate-400 mt-1 print:text-xs">
              Familiedag 2026 &bull; {kenJeElkaarVragen.length} vragen
            </p>
          </div>

          {kenJeElkaarVragen.length > 0 && (
            <div className="space-y-8 print:space-y-5">
              {kenJeElkaarVragen.map((v, idx) => (
                <div key={v.id} className="print:break-inside-avoid">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm print:w-6 print:h-6 print:text-xs">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-800 mt-0.5 print:text-sm">{v.question}</p>
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

          {mode === 'quiz' && kenJeElkaarVragen.length > 0 && (
            <div className="mt-10 pt-6 border-t-2 border-dashed border-slate-300 print:mt-6 print:pt-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-slate-600">Totaal score:</p>
                <div className="flex items-center gap-2">
                  <div className="border-b-2 border-dashed border-slate-300 w-12 h-7" />
                  <span className="text-slate-500">/ {kenJeElkaarVragen.length}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==================== RONDE 5: Raad de straat ==================== */}
      <div className="print-section">
        <div className="max-w-5xl mx-auto px-6 py-8 print:px-0 print:py-4 print:max-w-none">
          <div className="text-center mb-8 print:mb-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Ronde 5</p>
            <h1 className="text-3xl font-bold text-slate-800 print:text-2xl">Raad de Straat!</h1>
            <p className="text-slate-500 mt-2 print:text-sm">
              {mode === 'quiz'
                ? 'Bij welk familielid hoort deze straat? Schrijf de naam op de stippellijn.'
                : 'Antwoordblad — Raad de Straat'}
            </p>
            <p className="text-sm text-slate-400 mt-1 print:text-xs">
              Familiedag 2026 &bull; {streetviewItems.length} vragen
            </p>
          </div>

          {streetviewItems.length > 0 && (
            <div className="grid grid-cols-2 gap-6 print:gap-4 print:grid-cols-2">
              {streetviewItems.map((item) => (
                <div key={item.id} className="border border-slate-200 rounded-xl overflow-hidden print:rounded-lg print:break-inside-avoid">
                  <div className="aspect-[16/10] bg-slate-100 relative">
                    <img src={item.blob_url} alt={`Vraag ${item.question_number}`} className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg print:w-6 print:h-6 print:text-xs">
                      {item.question_number}
                    </div>
                  </div>
                  <div className="p-4 print:p-3">
                    {mode === 'quiz' ? (
                      <div>
                        <p className="text-xs text-slate-400 mb-2 print:mb-1">Wie woont hier?</p>
                        <div className="border-b-2 border-dashed border-slate-300 h-8 print:h-6" />
                      </div>
                    ) : (
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{item.names}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{item.address}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {mode === 'quiz' && streetviewItems.length > 0 && (
            <div className="mt-10 pt-6 border-t-2 border-dashed border-slate-300 print:mt-6 print:pt-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-slate-600">Totaal score:</p>
                <div className="flex items-center gap-2">
                  <div className="border-b-2 border-dashed border-slate-300 w-12 h-7" />
                  <span className="text-slate-500">/ {streetviewItems.length}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==================== RONDE 6: Logo ronde ==================== */}
      <div className="print-section">
        <div className="max-w-5xl mx-auto px-6 py-8 print:px-0 print:py-4 print:max-w-none">
          <div className="text-center mb-8 print:mb-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Ronde 6</p>
            <h1 className="text-3xl font-bold text-slate-800 print:text-2xl">Logo Quiz — Rijssense Bedrijven</h1>
            <p className="text-slate-500 mt-2 print:text-sm">
              {mode === 'quiz'
                ? 'Ken je alle logo\'s? Schrijf de naam van het bedrijf onder elk logo.'
                : 'Antwoordblad — Logo Quiz'}
            </p>
            <p className="text-sm text-slate-400 mt-1 print:text-xs">
              Familiedag 2026 &bull; {selectedBedrijven.length} logo&apos;s
            </p>
          </div>

          {selectedBedrijven.length > 0 && (
            <div className="grid grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">
              {selectedBedrijven.map((bedrijf, idx) => (
                <div key={bedrijf.naam} className="text-center print:break-inside-avoid">
                  <div className="aspect-square bg-slate-50 rounded-xl overflow-hidden relative shadow-sm print:rounded-lg flex items-center justify-center">
                    <LogoImage bedrijf={bedrijf} customLogos={customLogos} />
                    <div className="absolute top-2 left-2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow print:w-6 print:h-6 print:text-xs">
                      {idx + 1}
                    </div>
                  </div>
                  <div className="mt-3 print:mt-2">
                    {mode === 'quiz' ? (
                      <div className="border-b-2 border-dashed border-slate-300 h-7 mx-2 print:h-6" />
                    ) : (
                      <p className="font-semibold text-slate-800 text-sm print:text-xs">{bedrijf.naam}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {mode === 'quiz' && selectedBedrijven.length > 0 && (
            <div className="mt-10 pt-6 border-t-2 border-dashed border-slate-300 print:mt-6 print:pt-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-slate-600">Totaal score:</p>
                <div className="flex items-center gap-2">
                  <div className="border-b-2 border-dashed border-slate-300 w-12 h-7" />
                  <span className="text-slate-500">/ {selectedBedrijven.length}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==================== RONDE 7: Wie van de 3 ==================== */}
      <div className="print-section">
        <div className="max-w-4xl mx-auto px-6 py-8 print:px-4 print:py-4 print:max-w-none">
          <div className="text-center mb-10 print:mb-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Ronde 7</p>
            <h1 className="text-3xl font-bold text-slate-800 print:text-2xl">Wie van de 3?</h1>
            <p className="text-slate-500 mt-2 print:text-sm">
              {mode === 'quiz'
                ? 'Bij elke vraag horen 3 namen. Slechts 1 is het juiste antwoord!'
                : 'Antwoordblad — Wie van de 3?'}
            </p>
            <p className="text-sm text-slate-400 mt-1 print:text-xs">
              Familiedag 2026 &bull; {wieVanDe3Questions.length} vragen
            </p>
          </div>

          {wieVanDe3Questions.length > 0 && (
            <div className="space-y-6 print:space-y-4">
              {wieVanDe3Questions.map((q) => (
                <div key={q.number} className="print:break-inside-avoid border border-slate-200 rounded-xl p-5 print:p-3 print:rounded-lg">
                  <div className="flex gap-3 items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm print:w-6 print:h-6 print:text-xs">
                      {q.number}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-800 print:text-sm">{q.question}</p>
                      <div className="flex gap-3 mt-3 print:mt-2">
                        {q.names.map((name, i) => {
                          const isAnswer = i === q.answerIndex;
                          const letter = String.fromCharCode(65 + i);
                          return (
                            <div key={i} className={`flex-1 text-center px-3 py-3 rounded-lg border-2 print:py-2 ${mode === 'antwoorden' && isAnswer ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
                              <span className={`text-xs font-bold block mb-0.5 ${mode === 'antwoorden' && isAnswer ? 'text-emerald-600' : 'text-slate-400'}`}>
                                {letter}
                              </span>
                              <span className={`font-semibold text-sm print:text-xs ${mode === 'antwoorden' && isAnswer ? 'text-emerald-700' : 'text-slate-700'}`}>
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
                              <div key={letter} className="w-7 h-7 border-2 border-slate-300 rounded-full flex items-center justify-center text-xs font-bold text-slate-400 print:w-6 print:h-6">
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

          {mode === 'quiz' && wieVanDe3Questions.length > 0 && (
            <div className="mt-10 pt-6 border-t-2 border-dashed border-slate-300 print:mt-6 print:pt-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-slate-600">Totaal score:</p>
                <div className="flex items-center gap-2">
                  <div className="border-b-2 border-dashed border-slate-300 w-12 h-7" />
                  <span className="text-slate-500">/ {wieVanDe3Questions.length}</span>
                </div>
              </div>
            </div>
          )}
        </div>
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
              .print-section {
                break-after: page;
              }
              .print-section:last-child {
                break-after: auto;
              }
            }
          `,
        }}
      />
    </div>
  );
}
