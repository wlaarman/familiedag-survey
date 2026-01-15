import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { sql } from '@vercel/postgres';
import { SurveyResponse } from '@/types/survey';
import Link from 'next/link';

async function getResponse(id: string): Promise<SurveyResponse | null> {
  try {
    const result = await sql`
      SELECT * FROM survey_responses WHERE id = ${parseInt(id)}
    `;
    return result.rows[0] as SurveyResponse || null;
  } catch {
    return null;
  }
}

export default async function ResponseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    redirect('/admin/login');
  }

  const { id } = await params;
  const response = await getResponse(id);

  if (!response) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-4xl mx-auto text-center py-20">
          <h1 className="text-2xl font-bold text-gray-800">Reactie niet gevonden</h1>
          <Link href="/admin" className="text-blue-600 hover:underline mt-4 inline-block">
            ← Terug naar overzicht
          </Link>
        </div>
      </main>
    );
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const Section = ({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <span>{icon}</span> {title}
        </h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );

  const Field = ({ label, value, isLarge = false }: { label: string; value: string | null | undefined | boolean; isLarge?: boolean }) => {
    const displayValue = value === true ? 'Ja' : value === false ? 'Nee' : value || '-';
    return (
      <div className={isLarge ? 'col-span-2' : ''}>
        <dt className="text-sm font-medium text-slate-500 mb-1">{label}</dt>
        <dd className={`text-slate-900 ${isLarge ? 'whitespace-pre-wrap' : ''}`}>{displayValue}</dd>
      </div>
    );
  };

  const PersonColumn = ({ person, data, color }: { person: string; data: Record<string, unknown>; color: 'blue' | 'pink' }) => {
    const bgColor = color === 'blue' ? 'bg-blue-50 border-blue-100' : 'bg-pink-50 border-pink-100';
    const headerBg = color === 'blue' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800';

    return (
      <div className={`rounded-xl border ${bgColor} overflow-hidden`}>
        <div className={`px-4 py-2 ${headerBg} font-semibold text-sm`}>{person}</div>
        <dl className="p-4 grid gap-4">
          {Object.entries(data).map(([key, value]) => (
            <Field key={key} label={key} value={value as string} />
          ))}
        </dl>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="text-slate-500 hover:text-slate-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-800">
                {response.naam_1}
                {response.naam_2 && <span className="text-slate-400"> & </span>}
                {response.naam_2}
              </h1>
              <p className="text-sm text-slate-500">
                Ingevuld op {formatDate(response.created_at)}
              </p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            response.heeft_partner
              ? 'bg-pink-100 text-pink-700'
              : 'bg-blue-100 text-blue-700'
          }`}>
            {response.heeft_partner ? 'Met partner' : 'Individueel'}
          </span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Photos */}
        {(response.foto_1_url || response.foto_2_url || response.foto_1_later || response.foto_2_later) && (
          <Section title="Foto's" icon="📸">
            <div className="flex gap-6 flex-wrap">
              <div className="text-center">
                <p className="text-sm text-slate-500 mb-2">Persoon 1</p>
                {response.foto_1_url ? (
                  <a href={response.foto_1_url} target="_blank" rel="noopener noreferrer" className="block group">
                    <img src={response.foto_1_url} alt="Foto 1" className="w-40 h-40 object-cover rounded-xl shadow-md group-hover:ring-2 group-hover:ring-blue-400 transition-all" />
                    <span className="text-xs text-blue-600 mt-1 block group-hover:underline">Bekijk volledig</span>
                  </a>
                ) : response.foto_1_later ? (
                  <div className="w-40 h-40 bg-amber-50 border-2 border-dashed border-amber-200 rounded-xl flex items-center justify-center text-amber-600 text-sm">
                    Stuurt later via app
                  </div>
                ) : (
                  <div className="w-40 h-40 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                    Geen foto
                  </div>
                )}
              </div>
              {response.heeft_partner && (
                <div className="text-center">
                  <p className="text-sm text-slate-500 mb-2">Persoon 2</p>
                  {response.foto_2_url ? (
                    <a href={response.foto_2_url} target="_blank" rel="noopener noreferrer" className="block group">
                      <img src={response.foto_2_url} alt="Foto 2" className="w-40 h-40 object-cover rounded-xl shadow-md group-hover:ring-2 group-hover:ring-pink-400 transition-all" />
                      <span className="text-xs text-pink-600 mt-1 block group-hover:underline">Bekijk volledig</span>
                    </a>
                  ) : response.foto_2_later ? (
                    <div className="w-40 h-40 bg-amber-50 border-2 border-dashed border-amber-200 rounded-xl flex items-center justify-center text-amber-600 text-sm">
                      Stuurt later via app
                    </div>
                  ) : (
                    <div className="w-40 h-40 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                      Geen foto
                    </div>
                  )}
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Personal Info */}
        <Section title="Persoonlijke gegevens" icon="👤">
          <div className={`grid gap-6 ${response.heeft_partner ? 'md:grid-cols-2' : ''}`}>
            <PersonColumn
              person="Persoon 1"
              color="blue"
              data={{
                'Naam': response.naam_1,
                'Geboortedatum': formatDate(response.geboortedatum_1),
                'Adres': response.adres,
              }}
            />
            {response.heeft_partner && (
              <PersonColumn
                person="Persoon 2"
                color="pink"
                data={{
                  'Naam': response.naam_2,
                  'Geboortedatum': formatDate(response.geboortedatum_2),
                }}
              />
            )}
          </div>
          {response.heeft_partner && response.is_getrouwd && (
            <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
              <dl className="grid grid-cols-2 gap-4">
                <Field label="Getrouwd" value={response.is_getrouwd} />
                {response.trouwdatum && <Field label="Trouwdatum" value={formatDate(response.trouwdatum)} />}
              </dl>
            </div>
          )}
        </Section>

        {/* Work & Education */}
        <Section title="Werk & Opleiding" icon="💼">
          <div className={`grid gap-6 ${response.heeft_partner ? 'md:grid-cols-2' : ''}`}>
            <PersonColumn
              person="Persoon 1"
              color="blue"
              data={{
                'Werk': response.werk_1,
                'Opleiding': response.opleiding_1,
              }}
            />
            {response.heeft_partner && (
              <PersonColumn
                person="Persoon 2"
                color="pink"
                data={{
                  'Werk': response.werk_2,
                  'Opleiding': response.opleiding_2,
                }}
              />
            )}
          </div>
        </Section>

        {/* Youth */}
        <Section title="Jeugd" icon="💒">
          <div className={`grid gap-6 ${response.heeft_partner ? 'md:grid-cols-2' : ''}`}>
            <PersonColumn
              person="Persoon 1"
              color="blue"
              data={{
                'Basisschool': response.basisschool_1,
                'Bijnaam': response.bijnaam_1,
                'Bijbaantjes': response.bijbaantjes_1,
              }}
            />
            {response.heeft_partner && (
              <PersonColumn
                person="Persoon 2"
                color="pink"
                data={{
                  'Basisschool': response.basisschool_2,
                  'Bijnaam': response.bijnaam_2,
                  'Bijbaantjes': response.bijbaantjes_2,
                }}
              />
            )}
          </div>
        </Section>

        {/* Pets & Hobbies */}
        <Section title="Huisdieren & Hobby's" icon="🐾">
          {response.heeft_huisdieren && (
            <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
              <Field label="Huisdieren" value={response.huisdieren_info} />
            </div>
          )}
          <div className={`grid gap-6 ${response.heeft_partner ? 'md:grid-cols-2' : ''}`}>
            <PersonColumn
              person="Persoon 1"
              color="blue"
              data={{
                'Sport': response.sport_1,
                'Muziekinstrument': response.muziek_1,
                'Vrijwilligerswerk': response.vrijwilligerswerk_1,
                'Auto': response.auto_1,
              }}
            />
            {response.heeft_partner && (
              <PersonColumn
                person="Persoon 2"
                color="pink"
                data={{
                  'Sport': response.sport_2,
                  'Muziekinstrument': response.muziek_2,
                  'Vrijwilligerswerk': response.vrijwilligerswerk_2,
                  'Auto': response.auto_2,
                }}
              />
            )}
          </div>
        </Section>

        {/* Favorites */}
        <Section title="Favorieten & Weetjes" icon="⭐">
          <div className={`grid gap-6 ${response.heeft_partner ? 'md:grid-cols-2' : ''}`}>
            <PersonColumn
              person="Persoon 1"
              color="blue"
              data={{
                'Vakantieland': response.vakantieland_1,
                'Favoriete gerecht': response.gerecht_1,
                'Favoriete drank': response.drank_1,
                'Schoenmaat': response.schoenmaat_1,
                'Bang voor': response.angst_1,
                'Prijs/medaille': response.prijs_medaille_1,
              }}
            />
            {response.heeft_partner && (
              <PersonColumn
                person="Persoon 2"
                color="pink"
                data={{
                  'Vakantieland': response.vakantieland_2,
                  'Favoriete gerecht': response.gerecht_2,
                  'Favoriete drank': response.drank_2,
                  'Schoenmaat': response.schoenmaat_2,
                  'Bang voor': response.angst_2,
                  'Prijs/medaille': response.prijs_medaille_2,
                }}
              />
            )}
          </div>
        </Section>

        {/* Preferences */}
        <Section title="Dit of dat?" icon="🎯">
          <div className={`grid gap-6 ${response.heeft_partner ? 'md:grid-cols-2' : ''}`}>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              {response.heeft_partner && <p className="font-semibold text-blue-800 text-sm mb-3">Persoon 1</p>}
              <div className={`grid gap-3 ${response.heeft_partner ? 'grid-cols-2' : 'grid-cols-4 md:grid-cols-7'}`}>
                {[
                  { label: 'Koffie/Thee', value: response.koffie_thee_1 },
                  { label: 'Aardappels/Pasta', value: response.aardappel_pasta_1 },
                  { label: 'Vlees/Vis', value: response.vlees_vis_1 },
                  { label: 'Zomer/Winter', value: response.zomer_winter_1 },
                  { label: 'Hond/Kat', value: response.hond_kat_1 },
                  { label: 'Zwembad/Zee', value: response.zwembad_zee_1 },
                  { label: 'Auto/Fiets', value: response.auto_fiets_1 },
                ].map((item) => (
                  <div key={item.label} className="bg-white rounded-lg px-3 py-2 text-center">
                    <span className="text-xs text-slate-500 block">{item.label}</span>
                    <span className="font-medium text-slate-800">{item.value || '-'}</span>
                  </div>
                ))}
              </div>
            </div>
            {response.heeft_partner && (
              <div className="bg-pink-50 border border-pink-100 rounded-xl p-4">
                <p className="font-semibold text-pink-800 text-sm mb-3">Persoon 2</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Koffie/Thee', value: response.koffie_thee_2 },
                    { label: 'Aardappels/Pasta', value: response.aardappel_pasta_2 },
                    { label: 'Vlees/Vis', value: response.vlees_vis_2 },
                    { label: 'Zomer/Winter', value: response.zomer_winter_2 },
                    { label: 'Hond/Kat', value: response.hond_kat_2 },
                    { label: 'Zwembad/Zee', value: response.zwembad_zee_2 },
                    { label: 'Auto/Fiets', value: response.auto_fiets_2 },
                  ].map((item) => (
                    <div key={item.label} className="bg-white rounded-lg px-3 py-2 text-center">
                      <span className="text-xs text-slate-500 block">{item.label}</span>
                      <span className="font-medium text-slate-800">{item.value || '-'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* Anecdote */}
        {response.anekdote && (
          <Section title="Familie-anekdote" icon="📖">
            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{response.anekdote}</p>
          </Section>
        )}
      </div>
    </main>
  );
}
