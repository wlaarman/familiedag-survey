import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { getAllResponses } from '@/lib/db';
import PrintButton from '../straat/PrintButton';

interface PhotoEntry {
  name: string;
  url: string;
  responseId: number;
}

export default async function FotoQuizPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; variant?: string }>;
}) {
  const authenticated = await isAuthenticated();
  if (!authenticated) redirect('/admin/login');

  const params = await searchParams;
  const mode = params.mode === 'antwoorden' ? 'antwoorden' : 'quiz';
  const variant = params.variant === 'moeilijk' ? 'moeilijk' : 'normaal';

  const responses = await getAllResponses();

  // Collect all photos
  const photos: PhotoEntry[] = [];
  for (const r of responses) {
    if (r.foto_1_url) {
      photos.push({ name: r.naam_1, url: r.foto_1_url, responseId: r.id });
    }
    if (r.foto_2_url && r.naam_2) {
      photos.push({ name: r.naam_2, url: r.foto_2_url, responseId: r.id });
    }
  }

  // Shuffle deterministically based on response IDs (consistent order)
  photos.sort((a, b) => {
    const hashA = a.name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) * 31 + a.responseId;
    const hashB = b.name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) * 31 + b.responseId;
    return hashA - hashB;
  });

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
            <a
              href={`/admin/quiz/fotos?mode=${mode}&variant=${variant === 'normaal' ? 'moeilijk' : 'normaal'}`}
              className={`px-3 py-2 rounded-lg font-medium text-sm ${
                variant === 'moeilijk'
                  ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {variant === 'normaal' ? 'Zwart-wit variant' : 'Kleurenvariant'}
            </a>
            <a
              href={`/admin/quiz/fotos?mode=${mode === 'quiz' ? 'antwoorden' : 'quiz'}&variant=${variant}`}
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
            Wie is Wie?
          </h1>
          {variant === 'moeilijk' && (
            <span className="inline-block mt-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium print:bg-orange-50">
              Zwart-wit editie
            </span>
          )}
          <p className="text-slate-500 mt-2 print:text-sm">
            {mode === 'quiz'
              ? 'Ken je alle familieleden? Schrijf de naam onder elke foto.'
              : 'Antwoordblad - Wie is Wie?'}
          </p>
          <p className="text-sm text-slate-400 mt-1 print:text-xs">
            Familiedag 2026 &bull; {photos.length} foto&apos;s
          </p>
        </div>

        {photos.length === 0 ? (
          <p className="text-center text-slate-500 py-12">
            Nog geen foto&apos;s geupload.
          </p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-5 print:grid-cols-4 print:gap-3">
            {photos.map((photo, idx) => (
              <div
                key={`${photo.responseId}-${photo.name}`}
                className="text-center print:break-inside-avoid"
              >
                {/* Photo */}
                <div className="aspect-[3/4] bg-slate-100 rounded-xl overflow-hidden relative shadow-sm print:rounded-lg">
                  <img
                    src={photo.url}
                    alt={mode === 'antwoorden' ? photo.name : `Foto ${idx + 1}`}
                    className={`w-full h-full object-cover ${
                      variant === 'moeilijk' ? 'grayscale sepia-[0.15]' : ''
                    }`}
                  />
                  <div className="absolute top-1.5 left-1.5 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs shadow print:w-5 print:h-5 print:text-[10px]">
                    {idx + 1}
                  </div>
                </div>

                {/* Answer area */}
                <div className="mt-2 print:mt-1">
                  {mode === 'quiz' ? (
                    <div className="border-b-2 border-dashed border-slate-300 h-6 mx-2 print:h-5" />
                  ) : (
                    <p className="font-medium text-slate-800 text-xs print:text-[10px]">
                      {photo.name}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer for print */}
        {mode === 'quiz' && photos.length > 0 && (
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
              .grayscale {
                filter: grayscale(1) sepia(0.15) !important;
              }
            }
          `,
        }}
      />
    </div>
  );
}
