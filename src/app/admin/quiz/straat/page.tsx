import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { getStreetviewQuiz } from '@/lib/db';
import PrintButton from './PrintButton';

export default async function StreetviewQuizPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; variant?: string }>;
}) {
  const authenticated = await isAuthenticated();
  if (!authenticated) redirect('/admin/login');

  const params = await searchParams;
  const mode = params.mode === 'antwoorden' ? 'antwoorden' : 'quiz';
  const variant = params.variant === 'moeilijk' ? 'moeilijk' : params.variant === 'straat' ? 'straat' : 'normaal';
  const items = await getStreetviewQuiz();

  const hasHardVariant = items.some(i => i.blob_url_hard);
  const hasStreetVariant = items.some(i => i.blob_url_street);

  return (
    <div className="min-h-screen bg-white">
      {/* Header - hidden when printing */}
      <div className="print:hidden sticky top-0 bg-white border-b border-slate-200 z-10">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <a
            href="/admin?tab=straatquiz"
            className="text-slate-600 hover:text-slate-800 font-medium"
          >
            &larr; Terug naar admin
          </a>
          <div className="flex items-center gap-3">
            {(hasHardVariant || hasStreetVariant) && (
              <div className="flex items-center gap-1.5">
                {(['normaal', 'moeilijk', 'straat'] as const).filter(v =>
                  v === 'normaal' || (v === 'moeilijk' && hasHardVariant) || (v === 'straat' && hasStreetVariant)
                ).map(v => (
                  <a
                    key={v}
                    href={`/admin/quiz/straat?mode=${mode}&variant=${v}`}
                    className={`px-3 py-2 rounded-lg font-medium text-sm ${
                      variant === v
                        ? v === 'moeilijk' ? 'bg-orange-100 text-orange-700'
                          : v === 'straat' ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {v === 'normaal' ? 'Normaal' : v === 'moeilijk' ? 'Moeilijk' : 'Straat'}
                  </a>
                ))}
              </div>
            )}
            <a
              href={`/admin/quiz/straat?mode=${mode === 'quiz' ? 'antwoorden' : 'quiz'}&variant=${variant}`}
              className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium text-sm"
            >
              {mode === 'quiz' ? 'Bekijk antwoorden' : 'Bekijk quiz'}
            </a>
            <PrintButton />
          </div>
        </div>
      </div>

      {/* Quiz content */}
      <div className="max-w-5xl mx-auto px-6 py-8 print:px-0 print:py-4 print:max-w-none">
        {/* Title */}
        <div className="text-center mb-8 print:mb-6">
          <h1 className="text-3xl font-bold text-slate-800 print:text-2xl">
            Raad de Straat!
          </h1>
          {variant !== 'normaal' && (
            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${
              variant === 'moeilijk'
                ? 'bg-orange-100 text-orange-700 print:bg-orange-50'
                : 'bg-purple-100 text-purple-700 print:bg-purple-50'
            }`}>
              {variant === 'moeilijk' ? 'Moeilijke variant' : 'Straat-variant'}
            </span>
          )}
          <p className="text-slate-500 mt-2 print:text-sm">
            {mode === 'quiz'
              ? 'Bij welk familielid hoort deze straat? Schrijf de naam op de stippellijn.'
              : 'Antwoordblad - Raad de Straat'}
          </p>
          <p className="text-sm text-slate-400 mt-1 print:text-xs">
            Familiedag 2026 &bull; {items.length} vragen
          </p>
        </div>

        {items.length === 0 ? (
          <p className="text-center text-slate-500 py-12">
            Nog geen streetview foto&apos;s geupload. Draai eerst het upload script.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-6 print:gap-4 print:grid-cols-2">
            {items.map((item) => {
              const photoUrl = variant === 'moeilijk' && item.blob_url_hard
                ? item.blob_url_hard
                : variant === 'straat' && item.blob_url_street
                ? item.blob_url_street
                : item.blob_url;

              return (
                <div
                  key={item.id}
                  className="border border-slate-200 rounded-xl overflow-hidden print:rounded-lg print:break-inside-avoid"
                >
                  {/* Photo */}
                  <div className="aspect-[16/10] bg-slate-100 relative">
                    <img
                      src={photoUrl}
                      alt={`Vraag ${item.question_number}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg print:w-6 print:h-6 print:text-xs">
                      {item.question_number}
                    </div>
                  </div>

                  {/* Answer area */}
                  <div className="p-4 print:p-3">
                    {mode === 'quiz' ? (
                      <div>
                        <p className="text-xs text-slate-400 mb-2 print:mb-1">
                          Wie woont hier?
                        </p>
                        <div className="border-b-2 border-dashed border-slate-300 h-8 print:h-6" />
                      </div>
                    ) : (
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">
                          {item.names}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {item.address}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Score section */}
        {mode === 'quiz' && items.length > 0 && (
          <div className="mt-10 pt-6 border-t-2 border-dashed border-slate-300 print:mt-6 print:pt-4">
            <div className="flex items-center justify-between">
              <p className="font-medium text-slate-600">Totaal score:</p>
              <div className="flex items-center gap-2">
                <div className="border-b-2 border-dashed border-slate-300 w-12 h-7" />
                <span className="text-slate-500">/ {items.length}</span>
              </div>
            </div>
          </div>
        )}

        {mode === 'quiz' && items.length > 0 && (
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
