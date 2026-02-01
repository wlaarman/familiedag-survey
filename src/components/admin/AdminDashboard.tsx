'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SurveyResponse } from '@/types/survey';

type TabType = 'responses' | 'overview' | 'statistics' | 'photos' | 'anekdotes';

interface Statistics {
  total: number;
  withPartner: number;
  married: number;
  withPets: number;
  preferences: {
    koffie: number;
    thee: number;
    vlees: number;
    vis: number;
    hond: number;
    kat: number;
    zomer: number;
    winter: number;
    aardappels: number;
    pasta: number;
    zwembad: number;
    zee: number;
    auto: number;
    fiets: number;
  };
  schools: string[];
  vacationCountries: string[];
  anekdotes: { name: string; text: string }[];
  photos: { name: string; url: string }[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('responses');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    fetchResponses();
  }, []);

  const fetchResponses = async () => {
    try {
      const response = await fetch('/api/responses');
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/admin/login');
          return;
        }
        throw new Error('Laden mislukt');
      }
      const data = await response.json();
      setResponses(data.responses);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is iets misgegaan');
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo<Statistics>(() => {
    const prefs = {
      koffie: 0, thee: 0, vlees: 0, vis: 0, hond: 0, kat: 0,
      zomer: 0, winter: 0, aardappels: 0, pasta: 0, zwembad: 0, zee: 0, auto: 0, fiets: 0
    };
    const schools = new Set<string>();
    const countries = new Set<string>();
    const anekdotes: { name: string; text: string }[] = [];
    const photos: { name: string; url: string }[] = [];

    let withPartner = 0;
    let married = 0;
    let withPets = 0;

    responses.forEach(r => {
      // Count partners and married
      if (r.heeft_partner) withPartner++;
      if (r.is_getrouwd === 'Ja') married++;
      if (r.heeft_huisdieren) withPets++;

      // Count preferences (both persons)
      [1, 2].forEach(n => {
        const suffix = `_${n}` as '_1' | '_2';
        if (n === 2 && !r.heeft_partner) return;

        const koffieTh = r[`koffie_thee${suffix}`];
        if (koffieTh === 'Koffie') prefs.koffie++;
        if (koffieTh === 'Thee') prefs.thee++;

        const vleesVis = r[`vlees_vis${suffix}`];
        if (vleesVis === 'Vlees') prefs.vlees++;
        if (vleesVis === 'Vis') prefs.vis++;

        const hondKat = r[`hond_kat${suffix}`];
        if (hondKat === 'Hond') prefs.hond++;
        if (hondKat === 'Kat') prefs.kat++;

        const zomerWinter = r[`zomer_winter${suffix}`];
        if (zomerWinter === 'Zomer') prefs.zomer++;
        if (zomerWinter === 'Winter') prefs.winter++;

        const aardPasta = r[`aardappel_pasta${suffix}`];
        if (aardPasta === 'Aardappels') prefs.aardappels++;
        if (aardPasta === 'Pasta') prefs.pasta++;

        const zwembadZee = r[`zwembad_zee${suffix}`];
        if (zwembadZee === 'Zwembad') prefs.zwembad++;
        if (zwembadZee === 'Zee') prefs.zee++;

        const autoFiets = r[`auto_fiets${suffix}`];
        if (autoFiets === 'Auto') prefs.auto++;
        if (autoFiets === 'Fiets') prefs.fiets++;

        // Schools
        const school = r[`basisschool${suffix}`];
        if (school) schools.add(school);

        // Vacation countries
        const country = r[`vakantieland${suffix}`];
        if (country) countries.add(country);
      });

      // Anekdotes
      if (r.anekdote && r.anekdote.length > 10) {
        anekdotes.push({
          name: r.naam_2 ? `${r.naam_1} & ${r.naam_2}` : r.naam_1,
          text: r.anekdote
        });
      }

      // Photos
      if (r.foto_1_url) {
        photos.push({ name: r.naam_1, url: r.foto_1_url });
      }
      if (r.foto_2_url && r.naam_2) {
        photos.push({ name: r.naam_2, url: r.foto_2_url });
      }
    });

    return {
      total: responses.length,
      withPartner,
      married,
      withPets,
      preferences: prefs,
      schools: Array.from(schools).sort(),
      vacationCountries: Array.from(countries).sort(),
      anekdotes,
      photos
    };
  }, [responses]);

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/admin/login');
    router.refresh();
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Weet je zeker dat je deze reactie wilt verwijderen?')) return;

    try {
      const response = await fetch('/api/responses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) throw new Error('Verwijderen mislukt');
      setResponses((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Er is iets misgegaan');
    }
  };

  const exportToCSV = () => {
    if (responses.length === 0) return;

    const headers = Object.keys(responses[0]);
    const csvContent = [
      headers.join(','),
      ...responses.map((r) =>
        headers
          .map((h) => {
            const val = r[h as keyof SurveyResponse];
            if (val === null || val === undefined) return '';
            if (Array.isArray(val)) return `"${val.join('; ')}"`;
            if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
              return `"${val.replace(/"/g, '""')}"`;
            }
            return val;
          })
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `familiequiz-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const downloadAllPhotos = async () => {
    // Download photos one by one since we can't create a ZIP in the browser easily
    for (const photo of stats.photos) {
      const link = document.createElement('a');
      link.href = photo.url;
      link.download = `${photo.name.replace(/\s+/g, '_')}.jpg`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // Small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const PreferenceBar = ({ label1, val1, label2, val2 }: { label1: string; val1: number; label2: string; val2: number }) => {
    const total = val1 + val2;
    const pct1 = total > 0 ? Math.round((val1 / total) * 100) : 50;
    return (
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium">{label1} ({val1})</span>
          <span className="font-medium">{label2} ({val2})</span>
        </div>
        <div className="h-6 rounded-full overflow-hidden flex bg-slate-200">
          <div className="bg-blue-500 transition-all" style={{ width: `${pct1}%` }} />
          <div className="bg-amber-500 transition-all" style={{ width: `${100 - pct1}%` }} />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Familiequiz Admin</h1>
            <p className="text-sm text-slate-500 mt-1">Beheer alle ingevulde enquetes</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportToCSV}
              disabled={responses.length === 0}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors shadow-sm flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              CSV
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 font-medium transition-colors shadow-sm"
            >
              Uitloggen
            </button>
          </div>
        </div>
      </header>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-blue-500">
            <p className="text-sm text-slate-500">Totaal Inzendingen</p>
            <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-pink-500">
            <p className="text-sm text-slate-500">Getrouwde Stellen</p>
            <p className="text-3xl font-bold text-slate-800">{stats.married}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-amber-500">
            <p className="text-sm text-slate-500">Met Huisdieren</p>
            <p className="text-3xl font-bold text-slate-800">{stats.withPets}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-green-500">
            <p className="text-sm text-slate-500">Foto's Geupload</p>
            <p className="text-3xl font-bold text-slate-800">{stats.photos.length}</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="border-b border-slate-200 px-2">
            <nav className="flex gap-1">
              {[
                { id: 'responses', label: 'Alle Inzendingen', icon: '👥' },
                { id: 'overview', label: 'Overzicht', icon: '📋' },
                { id: 'statistics', label: 'Statistieken', icon: '📊' },
                { id: 'photos', label: `Foto's (${stats.photos.length})`, icon: '📷' },
                { id: 'anekdotes', label: `Anekdotes (${stats.anekdotes.length})`, icon: '💬' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Responses Tab */}
            {activeTab === 'responses' && (
              <div className="overflow-x-auto">
                {responses.length === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-slate-600 font-medium">Nog geen reacties ontvangen</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Datum</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Naam</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Partner</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Foto's</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Adres</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Acties</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {responses.map((response) => (
                        <tr key={response.id} className="hover:bg-blue-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <Link href={`/admin/response/${response.id}`} target="_blank" className="text-sm text-slate-600">
                              {formatDate(response.created_at)}
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            <Link href={`/admin/response/${response.id}`} target="_blank" className="font-medium text-slate-900 hover:text-blue-600">
                              {response.naam_1}
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            {response.naam_2 ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-pink-50 text-pink-700 rounded-full text-sm font-medium">
                                {response.naam_2}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              {response.foto_1_url ? (
                                <span className="w-6 h-6 rounded bg-green-100 flex items-center justify-center text-green-600">✓</span>
                              ) : (
                                <span className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-400">-</span>
                              )}
                              {response.heeft_partner && (
                                response.foto_2_url ? (
                                  <span className="w-6 h-6 rounded bg-green-100 flex items-center justify-center text-green-600">✓</span>
                                ) : (
                                  <span className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-400">-</span>
                                )
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-slate-600 max-w-[200px] truncate block">{response.adres}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link href={`/admin/response/${response.id}`} target="_blank" className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg">
                                Bekijken
                              </Link>
                              <button onClick={(e) => handleDelete(response.id, e)} className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg">
                                Verwijderen
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {responses.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">Nog geen inzendingen</p>
                ) : (
                  responses.map((r) => (
                    <div key={r.id} className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                      {/* Header with names and photos */}
                      <div className={`grid gap-6 mb-6 ${r.heeft_partner ? 'md:grid-cols-2' : 'grid-cols-1 max-w-md'}`}>
                        {/* Person 1 */}
                        <div className="flex items-center gap-4">
                          {r.foto_1_url ? (
                            <img src={r.foto_1_url} alt={r.naam_1} className="w-20 h-20 rounded-full object-cover border-2 border-white shadow" />
                          ) : (
                            <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center text-2xl text-slate-400">?</div>
                          )}
                          <div>
                            <h3 className="text-xl font-bold text-slate-800">{r.naam_1}</h3>
                            {r.geboortedatum_1 && <p className="text-sm text-slate-500">{new Date(r.geboortedatum_1).toLocaleDateString('nl-NL')}</p>}
                          </div>
                        </div>
                        {/* Person 2 */}
                        {r.heeft_partner && r.naam_2 && (
                          <div className="flex items-center gap-4">
                            {r.foto_2_url ? (
                              <img src={r.foto_2_url} alt={r.naam_2} className="w-20 h-20 rounded-full object-cover border-2 border-white shadow" />
                            ) : (
                              <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center text-2xl text-slate-400">?</div>
                            )}
                            <div>
                              <h3 className="text-xl font-bold text-slate-800">{r.naam_2}</h3>
                              {r.geboortedatum_2 && <p className="text-sm text-slate-500">{new Date(r.geboortedatum_2).toLocaleDateString('nl-NL')}</p>}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Info grid */}
                      <div className="grid md:grid-cols-2 gap-x-8 gap-y-1 text-sm">
                        {/* Adres */}
                        <div className="col-span-full mb-2">
                          <span className="text-slate-500">Adres:</span> <span className="text-slate-700">{r.adres || '-'}</span>
                        </div>

                        {/* Getrouwd */}
                        {r.heeft_partner && (
                          <div className="col-span-full mb-2">
                            <span className="text-slate-500">Getrouwd:</span> <span className="text-slate-700">{r.is_getrouwd || '-'}</span>
                            {r.trouwdatum && <span className="text-slate-500 ml-2">({new Date(r.trouwdatum).toLocaleDateString('nl-NL')})</span>}
                          </div>
                        )}

                        {/* Section: Werk & Opleiding */}
                        <div className="col-span-full mt-3 mb-1 font-semibold text-slate-600 border-b border-slate-200 pb-1">Werk & Opleiding</div>
                        <div><span className="text-slate-500">Werk:</span> <span className="text-slate-700">{r.werk_1 || '-'}</span></div>
                        {r.heeft_partner && <div><span className="text-slate-500">Werk:</span> <span className="text-slate-700">{r.werk_2 || '-'}</span></div>}
                        <div><span className="text-slate-500">Opleiding:</span> <span className="text-slate-700">{r.opleiding_1 || '-'}</span></div>
                        {r.heeft_partner && <div><span className="text-slate-500">Opleiding:</span> <span className="text-slate-700">{r.opleiding_2 || '-'}</span></div>}

                        {/* Section: Jeugd */}
                        <div className="col-span-full mt-3 mb-1 font-semibold text-slate-600 border-b border-slate-200 pb-1">Jeugd</div>
                        <div><span className="text-slate-500">Basisschool:</span> <span className="text-slate-700">{r.basisschool_1 || '-'}</span></div>
                        {r.heeft_partner && <div><span className="text-slate-500">Basisschool:</span> <span className="text-slate-700">{r.basisschool_2 || '-'}</span></div>}
                        <div><span className="text-slate-500">Bijnaam:</span> <span className="text-slate-700">{r.bijnaam_1 || '-'}</span></div>
                        {r.heeft_partner && <div><span className="text-slate-500">Bijnaam:</span> <span className="text-slate-700">{r.bijnaam_2 || '-'}</span></div>}
                        <div><span className="text-slate-500">Bijbaantjes:</span> <span className="text-slate-700">{r.bijbaantjes_1 || '-'}</span></div>
                        {r.heeft_partner && <div><span className="text-slate-500">Bijbaantjes:</span> <span className="text-slate-700">{r.bijbaantjes_2 || '-'}</span></div>}

                        {/* Section: Hobby's */}
                        <div className="col-span-full mt-3 mb-1 font-semibold text-slate-600 border-b border-slate-200 pb-1">Hobby's & Vrije tijd</div>
                        <div><span className="text-slate-500">Sport:</span> <span className="text-slate-700">{r.sport_1 || '-'}</span></div>
                        {r.heeft_partner && <div><span className="text-slate-500">Sport:</span> <span className="text-slate-700">{r.sport_2 || '-'}</span></div>}
                        <div><span className="text-slate-500">Muziek:</span> <span className="text-slate-700">{r.muziek_1 || '-'}</span></div>
                        {r.heeft_partner && <div><span className="text-slate-500">Muziek:</span> <span className="text-slate-700">{r.muziek_2 || '-'}</span></div>}
                        <div><span className="text-slate-500">Vrijwilligerswerk:</span> <span className="text-slate-700">{r.vrijwilligerswerk_1 || '-'}</span></div>
                        {r.heeft_partner && <div><span className="text-slate-500">Vrijwilligerswerk:</span> <span className="text-slate-700">{r.vrijwilligerswerk_2 || '-'}</span></div>}

                        {/* Huisdieren */}
                        <div className="col-span-full mt-3 mb-1 font-semibold text-slate-600 border-b border-slate-200 pb-1">Huisdieren</div>
                        <div className="col-span-full"><span className="text-slate-500">Huisdieren:</span> <span className="text-slate-700">{r.heeft_huisdieren ? (r.huisdieren_info || 'Ja') : 'Nee'}</span></div>

                        {/* Section: Favorieten */}
                        <div className="col-span-full mt-3 mb-1 font-semibold text-slate-600 border-b border-slate-200 pb-1">Favorieten</div>
                        <div><span className="text-slate-500">Auto:</span> <span className="text-slate-700">{r.auto_1 || '-'}</span></div>
                        {r.heeft_partner && <div><span className="text-slate-500">Auto:</span> <span className="text-slate-700">{r.auto_2 || '-'}</span></div>}
                        <div><span className="text-slate-500">Vakantieland:</span> <span className="text-slate-700">{r.vakantieland_1 || '-'}</span></div>
                        {r.heeft_partner && <div><span className="text-slate-500">Vakantieland:</span> <span className="text-slate-700">{r.vakantieland_2 || '-'}</span></div>}
                        <div><span className="text-slate-500">Lievelingsgerecht:</span> <span className="text-slate-700">{r.gerecht_1 || '-'}</span></div>
                        {r.heeft_partner && <div><span className="text-slate-500">Lievelingsgerecht:</span> <span className="text-slate-700">{r.gerecht_2 || '-'}</span></div>}
                        <div><span className="text-slate-500">Drank:</span> <span className="text-slate-700">{r.drank_1 || '-'}</span></div>
                        {r.heeft_partner && <div><span className="text-slate-500">Drank:</span> <span className="text-slate-700">{r.drank_2 || '-'}</span></div>}

                        {/* Section: Dit of Dat */}
                        <div className="col-span-full mt-3 mb-1 font-semibold text-slate-600 border-b border-slate-200 pb-1">Dit of Dat</div>
                        <div className="flex flex-wrap gap-2">
                          {r.koffie_thee_1 && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{r.koffie_thee_1}</span>}
                          {r.aardappel_pasta_1 && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{r.aardappel_pasta_1}</span>}
                          {r.vlees_vis_1 && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{r.vlees_vis_1}</span>}
                          {r.zomer_winter_1 && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{r.zomer_winter_1}</span>}
                          {r.hond_kat_1 && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{r.hond_kat_1}</span>}
                          {r.zwembad_zee_1 && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{r.zwembad_zee_1}</span>}
                          {r.auto_fiets_1 && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{r.auto_fiets_1}</span>}
                        </div>
                        {r.heeft_partner && (
                          <div className="flex flex-wrap gap-2">
                            {r.koffie_thee_2 && <span className="px-2 py-0.5 bg-pink-100 text-pink-700 rounded text-xs">{r.koffie_thee_2}</span>}
                            {r.aardappel_pasta_2 && <span className="px-2 py-0.5 bg-pink-100 text-pink-700 rounded text-xs">{r.aardappel_pasta_2}</span>}
                            {r.vlees_vis_2 && <span className="px-2 py-0.5 bg-pink-100 text-pink-700 rounded text-xs">{r.vlees_vis_2}</span>}
                            {r.zomer_winter_2 && <span className="px-2 py-0.5 bg-pink-100 text-pink-700 rounded text-xs">{r.zomer_winter_2}</span>}
                            {r.hond_kat_2 && <span className="px-2 py-0.5 bg-pink-100 text-pink-700 rounded text-xs">{r.hond_kat_2}</span>}
                            {r.zwembad_zee_2 && <span className="px-2 py-0.5 bg-pink-100 text-pink-700 rounded text-xs">{r.zwembad_zee_2}</span>}
                            {r.auto_fiets_2 && <span className="px-2 py-0.5 bg-pink-100 text-pink-700 rounded text-xs">{r.auto_fiets_2}</span>}
                          </div>
                        )}

                        {/* Section: Weetjes */}
                        <div className="col-span-full mt-3 mb-1 font-semibold text-slate-600 border-b border-slate-200 pb-1">Weetjes</div>
                        <div><span className="text-slate-500">Schoenmaat:</span> <span className="text-slate-700">{r.schoenmaat_1 || '-'}</span></div>
                        {r.heeft_partner && <div><span className="text-slate-500">Schoenmaat:</span> <span className="text-slate-700">{r.schoenmaat_2 || '-'}</span></div>}
                        <div><span className="text-slate-500">Angst:</span> <span className="text-slate-700">{r.angst_1 || '-'}</span></div>
                        {r.heeft_partner && <div><span className="text-slate-500">Angst:</span> <span className="text-slate-700">{r.angst_2 || '-'}</span></div>}
                        <div><span className="text-slate-500">Prijs/medaille:</span> <span className="text-slate-700">{r.prijs_medaille_1 || '-'}</span></div>
                        {r.heeft_partner && <div><span className="text-slate-500">Prijs/medaille:</span> <span className="text-slate-700">{r.prijs_medaille_2 || '-'}</span></div>}
                        <div><span className="text-slate-500">Dieet:</span> <span className="text-slate-700">{r.dieet_1 || '-'}</span></div>
                        {r.heeft_partner && <div><span className="text-slate-500">Dieet:</span> <span className="text-slate-700">{r.dieet_2 || '-'}</span></div>}

                        {/* Anekdote */}
                        {r.anekdote && (
                          <>
                            <div className="col-span-full mt-3 mb-1 font-semibold text-slate-600 border-b border-slate-200 pb-1">Anekdote</div>
                            <div className="col-span-full text-slate-700 italic">"{r.anekdote}"</div>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Statistics Tab */}
            {activeTab === 'statistics' && (
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Dit of Dat?</h3>
                  <PreferenceBar label1="Koffie" val1={stats.preferences.koffie} label2="Thee" val2={stats.preferences.thee} />
                  <PreferenceBar label1="Vlees" val1={stats.preferences.vlees} label2="Vis" val2={stats.preferences.vis} />
                  <PreferenceBar label1="Hond" val1={stats.preferences.hond} label2="Kat" val2={stats.preferences.kat} />
                  <PreferenceBar label1="Zomer" val1={stats.preferences.zomer} label2="Winter" val2={stats.preferences.winter} />
                  <PreferenceBar label1="Aardappels" val1={stats.preferences.aardappels} label2="Pasta" val2={stats.preferences.pasta} />
                  <PreferenceBar label1="Zwembad" val1={stats.preferences.zwembad} label2="Zee" val2={stats.preferences.zee} />
                  <PreferenceBar label1="Auto" val1={stats.preferences.auto} label2="Fiets" val2={stats.preferences.fiets} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Basisscholen ({stats.schools.length})</h3>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {stats.schools.map(school => (
                      <span key={school} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">{school}</span>
                    ))}
                  </div>

                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Vakantielanden ({stats.vacationCountries.length})</h3>
                  <div className="flex flex-wrap gap-2">
                    {stats.vacationCountries.map(country => (
                      <span key={country} className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm">{country}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Photos Tab */}
            {activeTab === 'photos' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-slate-800">{stats.photos.length} Foto's</h3>
                  {stats.photos.length > 0 && (
                    <button
                      onClick={downloadAllPhotos}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download Alle Foto's
                    </button>
                  )}
                </div>
                {stats.photos.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">Nog geen foto's geupload</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {stats.photos.map((photo, idx) => (
                      <div
                        key={idx}
                        className="cursor-pointer group"
                        onClick={() => setSelectedPhoto(photo.url)}
                      >
                        <div className="aspect-square rounded-lg overflow-hidden bg-slate-100">
                          <img
                            src={photo.url}
                            alt={photo.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <p className="text-sm text-slate-600 mt-1 truncate">{photo.name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Anekdotes Tab */}
            {activeTab === 'anekdotes' && (
              <div className="space-y-4">
                {stats.anekdotes.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">Nog geen anekdotes ingevuld</p>
                ) : (
                  stats.anekdotes.map((anekdote, idx) => (
                    <div key={idx} className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
                      <p className="text-slate-700 mb-2">"{anekdote.text}"</p>
                      <p className="text-sm text-slate-500">— {anekdote.name}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={selectedPhoto}
              alt="Foto"
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
            <a
              href={selectedPhoto}
              download
              target="_blank"
              className="absolute bottom-4 right-4 px-4 py-2 bg-white text-slate-800 rounded-lg font-medium hover:bg-slate-100"
              onClick={(e) => e.stopPropagation()}
            >
              Download
            </a>
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-800 hover:bg-slate-100"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
