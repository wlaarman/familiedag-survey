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
      <div className="max-w-5xl mx-auto px-4 py-4 print:px-2 print:py-2 print:max-w-none">
        {/* Title */}
        <div className="text-center mb-3">
          <h1 className="text-lg font-bold text-slate-800">
            Raad de Straat!
            {variant !== 'normaal' && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                variant === 'moeilijk'
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-purple-100 text-purple-700'
              }`}>
                {variant === 'moeilijk' ? 'Moeilijk' : 'Straat'}
              </span>
            )}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {mode === 'quiz'
              ? 'Bij welk familielid hoort deze straat? Schrijf de naam op de stippellijn.'
              : 'Antwoordblad - Raad de Straat'}
          </p>
        </div>

        {items.length === 0 ? (
          <p className="text-center text-slate-500 py-12">
            Nog geen streetview foto&apos;s geupload. Draai eerst het upload script.
          </p>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {items.map((item) => {
              const photoUrl = variant === 'moeilijk' && item.blob_url_hard
                ? item.blob_url_hard
                : variant === 'straat' && item.blob_url_street
                ? item.blob_url_street
                : item.blob_url;

              return (
                <div
                  key={item.id}
                  className="border border-slate-200 rounded-lg overflow-hidden break-inside-avoid"
                >
                  {/* Photo */}
                  <div className="aspect-[16/10] bg-slate-100 relative">
                    <img
                      src={photoUrl}
                      alt={`Vraag ${item.question_number}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1 left-1 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-[10px] shadow">
                      {item.question_number}
                    </div>
                  </div>

                  {/* Answer area */}
                  <div className="px-1.5 py-1">
                    {mode === 'quiz' ? (
                      <div className="border-b-2 border-dashed border-slate-300 h-5" />
                    ) : (
                      <div>
                        <p className="font-semibold text-slate-800 text-[11px] leading-tight">
                          {item.names}
                        </p>
                        <p className="text-[10px] text-slate-500">
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
          <div className="mt-4 pt-2 border-t-2 border-dashed border-slate-300">
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
          <div className="mt-2 text-center text-xs text-slate-400">
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
