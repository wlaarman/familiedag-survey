import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { getCustomLogos, getLogoSelection, createTables } from '@/lib/db';
import { BEDRIJVEN } from '@/lib/bedrijven';
import PrintButton from '../straat/PrintButton';
import LogoImage from './LogoImage';

export default async function LogoQuizPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const authenticated = await isAuthenticated();
  if (!authenticated) redirect('/admin/login');

  const params = await searchParams;
  const mode = params.mode === 'antwoorden' ? 'antwoorden' : 'quiz';

  await createTables();
  const [customLogos, selection] = await Promise.all([
    getCustomLogos(),
    getLogoSelection(),
  ]);

  const selectedBedrijven = BEDRIJVEN.filter(b => selection.includes(b.naam));

  return (
    <div className="min-h-screen bg-white">
      {/* Header - hidden when printing */}
      <div className="print:hidden sticky top-0 bg-white border-b border-slate-200 z-10">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <a
            href="/admin?tab=logoquiz"
            className="text-slate-600 hover:text-slate-800 font-medium"
          >
            &larr; Terug naar admin
          </a>
          <div className="flex items-center gap-3">
            <a
              href={`/admin/quiz/logos?mode=${mode === 'quiz' ? 'antwoorden' : 'quiz'}`}
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
            Logo Quiz - Rijssense Bedrijven
          </h1>
          <p className="text-slate-500 mt-2 print:text-sm">
            {mode === 'quiz'
              ? 'Ken je alle logo\'s? Schrijf de naam van het bedrijf onder elk logo.'
              : 'Antwoordblad - Logo Quiz'}
          </p>
          <p className="text-sm text-slate-400 mt-1 print:text-xs">
            Familiedag 2026 &bull; {selectedBedrijven.length} logo&apos;s
          </p>
        </div>

        {selectedBedrijven.length === 0 ? (
          <p className="text-center text-slate-500 py-12">
            Nog geen logo&apos;s geselecteerd. Ga naar de admin en selecteer logo&apos;s.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">
            {selectedBedrijven.map((bedrijf, idx) => (
              <div
                key={bedrijf.naam}
                className="text-center print:break-inside-avoid"
              >
                {/* Logo */}
                <div className="aspect-square bg-slate-50 rounded-xl overflow-hidden relative shadow-sm print:rounded-lg flex items-center justify-center">
                  <LogoImage bedrijf={bedrijf} customLogos={customLogos} />
                  <div className="absolute top-2 left-2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow print:w-6 print:h-6 print:text-xs">
                    {idx + 1}
                  </div>
                </div>

                {/* Answer area */}
                <div className="mt-3 print:mt-2">
                  {mode === 'quiz' ? (
                    <div className="border-b-2 border-dashed border-slate-300 h-7 mx-2 print:h-6" />
                  ) : (
                    <p className="font-semibold text-slate-800 text-sm print:text-xs">
                      {bedrijf.naam}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Score section */}
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

        {mode === 'quiz' && selectedBedrijven.length > 0 && (
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
