'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SurveyResponse } from '@/types/survey';

export default function AdminDashboard() {
  const router = useRouter();
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedResponse, setSelectedResponse] = useState<SurveyResponse | null>(null);

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

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/admin/login');
    router.refresh();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Weet je zeker dat je deze reactie wilt verwijderen?')) return;

    try {
      const response = await fetch('/api/responses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) throw new Error('Verwijderen mislukt');

      setResponses((prev) => prev.filter((r) => r.id !== id));
      if (selectedResponse?.id === id) setSelectedResponse(null);
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
            if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
              return `"${val.replace(/"/g, '""')}"`;
            }
            return val;
          })
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `familiequiz-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
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

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            Familiequiz Admin
          </h1>
          <div className="flex gap-4">
            <button
              onClick={exportToCSV}
              disabled={responses.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Exporteer CSV
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Uitloggen
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b">
            <p className="text-gray-600">
              {responses.length} {responses.length === 1 ? 'reactie' : 'reacties'} ontvangen
            </p>
          </div>

          {responses.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Nog geen reacties ontvangen
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                      Datum
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                      Naam
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                      Partner
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                      Adres
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                      Acties
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {responses.map((response) => (
                    <tr
                      key={response.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedResponse(response)}
                    >
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(response.created_at)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {response.naam_1}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {response.naam_2 || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {response.adres}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(response.id);
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          Verwijderen
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedResponse && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedResponse(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">
                {selectedResponse.naam_1}
                {selectedResponse.naam_2 && ` & ${selectedResponse.naam_2}`}
              </h2>
              <button
                onClick={() => setSelectedResponse(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Photos */}
              {(selectedResponse.foto_1_url || selectedResponse.foto_2_url) && (
                <div className="flex gap-4">
                  {selectedResponse.foto_1_url && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Foto Persoon 1</p>
                      <img
                        src={selectedResponse.foto_1_url}
                        alt="Foto 1"
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  {selectedResponse.foto_2_url && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Foto Persoon 2</p>
                      <img
                        src={selectedResponse.foto_2_url}
                        alt="Foto 2"
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Personal Info */}
              <section>
                <h3 className="font-semibold text-lg mb-2 border-b pb-1">Persoonlijke info</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Geboortedatum 1</p>
                    <p>{selectedResponse.geboortedatum_1}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Adres</p>
                    <p>{selectedResponse.adres}</p>
                  </div>
                  {selectedResponse.geboortedatum_2 && (
                    <div>
                      <p className="text-sm text-gray-500">Geboortedatum 2</p>
                      <p>{selectedResponse.geboortedatum_2}</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Relationship */}
              {selectedResponse.is_getrouwd && (
                <section>
                  <h3 className="font-semibold text-lg mb-2 border-b pb-1">Relatie</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Getrouwd</p>
                      <p>{selectedResponse.is_getrouwd}</p>
                    </div>
                    {selectedResponse.trouwdatum && (
                      <div>
                        <p className="text-sm text-gray-500">Trouwdatum</p>
                        <p>{selectedResponse.trouwdatum}</p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Work & Education */}
              <section>
                <h3 className="font-semibold text-lg mb-2 border-b pb-1">Werk & Opleiding</h3>
                <div className="grid grid-cols-2 gap-4">
                  {selectedResponse.werk_1 && (
                    <div>
                      <p className="text-sm text-gray-500">Werk 1</p>
                      <p>{selectedResponse.werk_1}</p>
                    </div>
                  )}
                  {selectedResponse.werk_2 && (
                    <div>
                      <p className="text-sm text-gray-500">Werk 2</p>
                      <p>{selectedResponse.werk_2}</p>
                    </div>
                  )}
                  {selectedResponse.opleiding_1 && (
                    <div>
                      <p className="text-sm text-gray-500">Opleiding 1</p>
                      <p>{selectedResponse.opleiding_1}</p>
                    </div>
                  )}
                  {selectedResponse.opleiding_2 && (
                    <div>
                      <p className="text-sm text-gray-500">Opleiding 2</p>
                      <p>{selectedResponse.opleiding_2}</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Favorites & Preferences */}
              <section>
                <h3 className="font-semibold text-lg mb-2 border-b pb-1">Favorieten & Voorkeuren</h3>
                <div className="grid grid-cols-2 gap-4">
                  {selectedResponse.vakantieland_1 && (
                    <div>
                      <p className="text-sm text-gray-500">Vakantieland 1</p>
                      <p>{selectedResponse.vakantieland_1}</p>
                    </div>
                  )}
                  {selectedResponse.vakantieland_2 && (
                    <div>
                      <p className="text-sm text-gray-500">Vakantieland 2</p>
                      <p>{selectedResponse.vakantieland_2}</p>
                    </div>
                  )}
                  {selectedResponse.gerecht_1 && (
                    <div>
                      <p className="text-sm text-gray-500">Gerecht 1</p>
                      <p>{selectedResponse.gerecht_1}</p>
                    </div>
                  )}
                  {selectedResponse.gerecht_2 && (
                    <div>
                      <p className="text-sm text-gray-500">Gerecht 2</p>
                      <p>{selectedResponse.gerecht_2}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">Schoenmaat 1</p>
                    <p>{selectedResponse.schoenmaat_1}</p>
                  </div>
                  {selectedResponse.schoenmaat_2 && (
                    <div>
                      <p className="text-sm text-gray-500">Schoenmaat 2</p>
                      <p>{selectedResponse.schoenmaat_2}</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Anecdote */}
              {selectedResponse.anekdote && (
                <section>
                  <h3 className="font-semibold text-lg mb-2 border-b pb-1">Anekdote</h3>
                  <p className="whitespace-pre-wrap">{selectedResponse.anekdote}</p>
                </section>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
