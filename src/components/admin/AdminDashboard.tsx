'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { SurveyResponse } from '@/types/survey';
import { BEDRIJVEN } from '@/lib/bedrijven';
import { generateQuestions, QuizQuestion } from '@/lib/quiz-questions';
import { generateWieVanDe3, WieVanDe3Question } from '@/lib/quiz-wie-van-de-3';

type TabType = 'responses' | 'overview' | 'photos' | 'logoquiz' | 'straatquiz' | 'cijferquiz' | 'wievande3' | 'feitoffabel' | 'groepen';

interface Statistics {
  total: number;
  withPartner: number;
  married: number;
  withPets: number;
  photos: { name: string; url: string }[];
}


interface StreetviewQuizItem {
  id: number;
  question_number: number;
  blob_url: string;
  blob_url_hard: string | null;
  blob_url_street: string | null;
  address: string;
  names: string;
}

interface ParticipantData {
  id: number;
  naam: string;
  familie: string;
  gezin: string | null;
  generatie: number;
  geslacht: string;
  groep: number | null;
}

const FAMILIE_KLEUREN: Record<string, string> = {
  'Laarman': 'bg-blue-100 text-blue-800 border-blue-300',
  'Otten': 'bg-green-100 text-green-800 border-green-300',
  'Jan Beltman': 'bg-purple-100 text-purple-800 border-purple-300',
  'Gerrit Beltman': 'bg-orange-100 text-orange-800 border-orange-300',
  'Erik Beltman': 'bg-pink-100 text-pink-800 border-pink-300',
};

const ORGANISATIE_NAMEN = ['Jandirk', 'Linda', 'Willem', 'Mirjam'];

const VALID_TABS: TabType[] = ['responses', 'overview', 'photos', 'logoquiz', 'straatquiz', 'cijferquiz', 'wievande3', 'feitoffabel', 'groepen'];

export default function AdminDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedLogos, setSelectedLogos] = useState<Set<string>>(new Set());
  const [quizMode, setQuizMode] = useState<'select' | 'play' | 'print'>('select');
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [customLogos, setCustomLogos] = useState<Record<string, string>>({});
  const [uploadingLogo, setUploadingLogo] = useState<string | null>(null);
  const [streetviewItems, setStreetviewItems] = useState<StreetviewQuizItem[]>([]);
  const [streetviewLoading, setStreetviewLoading] = useState(false);
  const [feitOfFabelItems, setFeitOfFabelItems] = useState<{ id: number; stelling: string; is_waar: boolean; toelichting: string | null }[]>([]);
  const [feitOfFabelLoading, setFeitOfFabelLoading] = useState(false);
  const [nieuweStellingText, setNieuweStellingText] = useState('');
  const [nieuweStellingWaar, setNieuweStellingWaar] = useState(true);
  const [nieuweStellingToelichting, setNieuweStellingToelichting] = useState('');
  const [editingStelling, setEditingStelling] = useState<number | null>(null);
  const [editStellingText, setEditStellingText] = useState('');
  const [editStellingWaar, setEditStellingWaar] = useState(true);
  const [editStellingToelichting, setEditStellingToelichting] = useState('');
  const [participants, setParticipants] = useState<ParticipantData[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [maxPerGroep, setMaxPerGroep] = useState(6);
  const [editingParticipant, setEditingParticipant] = useState<number | null>(null);
  const [metOrganisatie, setMetOrganisatie] = useState(true);
  const [cijferMode, setCijferMode] = useState<'quiz' | 'antwoorden'>('antwoorden');
  const [wieVanDe3Mode, setWieVanDe3Mode] = useState<'quiz' | 'antwoorden'>('antwoorden');
  const [straatVariant, setStraatVariant] = useState<'normaal' | 'moeilijk' | 'straat' | 'antwoorden'>('antwoorden');
  const [fotoMode, setFotoMode] = useState<'overzicht' | 'kleur' | 'zwartwit' | 'antwoorden'>('overzicht');

  // Get active tab from URL or default to 'responses'
  const tabParam = searchParams.get('tab');
  const activeTab: TabType = tabParam && VALID_TABS.includes(tabParam as TabType)
    ? (tabParam as TabType)
    : 'responses';

  const setActiveTab = (tab: TabType) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`/admin?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    fetchResponses();
    fetchCustomLogos();
  }, []);

  // Auto-load data when tab is activated
  useEffect(() => {
    if (activeTab === 'feitoffabel' && feitOfFabelItems.length === 0 && !feitOfFabelLoading) {
      fetchFeitOfFabel();
    }
    if (activeTab === 'straatquiz' && streetviewItems.length === 0 && !streetviewLoading) {
      fetchStreetviewQuiz();
    }
  }, [activeTab]);

  // Generate quiz data from responses
  const cijferQuestions = useMemo(() => responses.length > 0 ? generateQuestions(responses) : [], [responses]);
  const wieVanDe3Questions = useMemo(() => responses.length > 0 ? generateWieVanDe3(responses) : [], [responses]);
  const quizPhotos = useMemo(() => {
    const photos: { name: string; url: string; responseId: number }[] = [];
    for (const r of responses) {
      if (r.foto_1_url) photos.push({ name: r.naam_1, url: r.foto_1_url, responseId: r.id });
      if (r.foto_2_url && r.naam_2) photos.push({ name: r.naam_2, url: r.foto_2_url, responseId: r.id });
    }
    photos.sort((a, b) => {
      const hashA = a.name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) * 31 + a.responseId;
      const hashB = b.name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) * 31 + b.responseId;
      return hashA - hashB;
    });
    return photos;
  }, [responses]);

  const fetchCustomLogos = async () => {
    try {
      const response = await fetch('/api/logos');
      if (response.ok) {
        const { logos, selection } = await response.json();
        setCustomLogos(logos || {});
        if (selection && selection.length > 0) {
          setSelectedLogos(new Set(selection));
        }
      }
    } catch (err) {
      console.error('Failed to fetch custom logos:', err);
    }
  };

  const saveLogoSelection = async (newSelection: Set<string>) => {
    setSelectedLogos(newSelection);
    try {
      await fetch('/api/logos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selection: Array.from(newSelection) }),
      });
    } catch (err) {
      console.error('Failed to save logo selection:', err);
    }
  };

  const fetchFeitOfFabel = async () => {
    setFeitOfFabelLoading(true);
    try {
      const response = await fetch('/api/feit-of-fabel');
      if (response.ok) {
        const data = await response.json();
        setFeitOfFabelItems(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch feit of fabel:', err);
    } finally {
      setFeitOfFabelLoading(false);
    }
  };

  const addStelling = async () => {
    if (!nieuweStellingText.trim()) return;
    try {
      const response = await fetch('/api/feit-of-fabel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stelling: nieuweStellingText.trim(), is_waar: nieuweStellingWaar, toelichting: nieuweStellingToelichting.trim() || undefined }),
      });
      if (response.ok) {
        setNieuweStellingText('');
        setNieuweStellingWaar(true);
        setNieuweStellingToelichting('');
        fetchFeitOfFabel();
      }
    } catch (err) {
      console.error('Failed to add stelling:', err);
    }
  };

  const updateStelling = async (id: number) => {
    try {
      await fetch('/api/feit-of-fabel', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, stelling: editStellingText, is_waar: editStellingWaar, toelichting: editStellingToelichting.trim() || undefined }),
      });
      setEditingStelling(null);
      fetchFeitOfFabel();
    } catch (err) {
      console.error('Failed to update stelling:', err);
    }
  };

  const deleteStelling = async (id: number) => {
    try {
      await fetch('/api/feit-of-fabel', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      fetchFeitOfFabel();
    } catch (err) {
      console.error('Failed to delete stelling:', err);
    }
  };

  const moveStelling = async (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= feitOfFabelItems.length) return;
    try {
      await fetch('/api/feit-of-fabel', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id1: feitOfFabelItems[idx].id, id2: feitOfFabelItems[targetIdx].id }),
      });
      fetchFeitOfFabel();
    } catch (err) {
      console.error('Failed to move stelling:', err);
    }
  };

  const fetchStreetviewQuiz = async () => {
    setStreetviewLoading(true);
    try {
      const response = await fetch('/api/quiz/streetview');
      if (response.ok) {
        const { items } = await response.json();
        setStreetviewItems(items || []);
      }
    } catch (err) {
      console.error('Failed to fetch streetview quiz:', err);
    } finally {
      setStreetviewLoading(false);
    }
  };

  const fetchParticipants = async () => {
    setParticipantsLoading(true);
    try {
      const response = await fetch('/api/participants');
      if (response.ok) {
        const data = await response.json();
        setParticipants(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch participants:', err);
    } finally {
      setParticipantsLoading(false);
    }
  };

  const handleVerdeel = async () => {
    try {
      const excludeIds = !metOrganisatie
        ? participants.filter(p => ORGANISATIE_NAMEN.includes(p.naam)).map(p => p.id)
        : [];
      const response = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxPerGroep, excludeIds }),
      });
      if (response.ok) {
        const data = await response.json();
        setParticipants(data);
      }
    } catch (err) {
      console.error('Failed to distribute groups:', err);
    }
  };

  const handleGroupChange = async (id: number, groep: number | null) => {
    try {
      await fetch('/api/participants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, groep }),
      });
      setParticipants(prev => prev.map(p => p.id === id ? { ...p, groep } : p));
    } catch (err) {
      console.error('Failed to update group:', err);
    }
  };

  const handleParticipantUpdate = async (id: number, fields: Partial<ParticipantData>) => {
    try {
      await fetch('/api/participants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...fields }),
      });
      setParticipants(prev => prev.map(p => p.id === id ? { ...p, ...fields } : p));
      setEditingParticipant(null);
    } catch (err) {
      console.error('Failed to update participant:', err);
    }
  };

  const handleLogoUpload = async (bedrijfNaam: string, file: File) => {
    setUploadingLogo(bedrijfNaam);
    try {
      // Upload file to Vercel Blob
      const formData = new FormData();
      formData.append('file', file);
      formData.append('filename', `logo-${bedrijfNaam.replace(/[^a-zA-Z0-9]/g, '_')}`);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) throw new Error('Upload failed');

      const { url } = await uploadResponse.json();

      // Save to database
      const saveResponse = await fetch('/api/logos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bedrijfNaam, logoUrl: url }),
      });

      if (!saveResponse.ok) throw new Error('Save to database failed');

      setCustomLogos(prev => ({ ...prev, [bedrijfNaam]: url }));
    } catch (err) {
      alert('Logo upload mislukt: ' + (err instanceof Error ? err.message : 'Onbekende fout'));
    } finally {
      setUploadingLogo(null);
    }
  };

  const removeCustomLogo = async (bedrijfNaam: string) => {
    try {
      const response = await fetch('/api/logos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bedrijfNaam }),
      });

      if (!response.ok) throw new Error('Delete failed');

      setCustomLogos(prev => {
        const newLogos = { ...prev };
        delete newLogos[bedrijfNaam];
        return newLogos;
      });
    } catch (err) {
      alert('Verwijderen mislukt: ' + (err instanceof Error ? err.message : 'Onbekende fout'));
    }
  };

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
    const photos: { name: string; url: string }[] = [];

    let withPartner = 0;
    let married = 0;
    let withPets = 0;

    responses.forEach(r => {
      if (r.heeft_partner) withPartner++;
      if (r.is_getrouwd === 'Ja') married++;
      if (r.heeft_huisdieren) withPets++;

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
      <header className="bg-white shadow-sm border-b border-slate-200 print:hidden">
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 print:hidden">
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
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border-0 print:rounded-none">
          <div className="border-b border-slate-200 overflow-x-auto print:hidden">
            <nav className="flex gap-1 px-2 min-w-max">
              {[
                { id: 'responses', label: 'Inzendingen', icon: '👥' },
                { id: 'overview', label: 'Overzicht', icon: '📋' },
                { id: 'photos', label: `Foto's`, icon: '📷', count: stats.photos.length },
                { id: 'logoquiz', label: 'Logo Quiz', icon: '🏢' },
                { id: 'straatquiz', label: 'Raad de Straat', icon: '🏠' },
                { id: 'cijferquiz', label: 'Cijferronde', icon: '🔢' },
                { id: 'wievande3', label: 'Wie van de 3', icon: '🤔' },
                { id: 'feitoffabel', label: 'Feit/Fabel', icon: '✅' },
                { id: 'groepen', label: 'Groepen', icon: '👥' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`px-3 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <span className="mr-1">{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                  {'count' in tab && <span className="sm:hidden">{tab.count}</span>}
                </button>
              ))}
              <Link
                href="/admin/quiz"
                target="_blank"
                className="px-3 py-3 text-sm font-medium border-b-2 border-transparent text-indigo-600 hover:text-indigo-800 whitespace-nowrap"
              >
                <span className="mr-1">🎯</span>
                <span className="hidden sm:inline">Quiz overzicht</span>
              </Link>
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

            {/* Photos Tab */}
            {activeTab === 'photos' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <h3 className="text-lg font-semibold text-slate-800">Wie is Wie? &mdash; {quizPhotos.length} foto&apos;s</h3>
                  <div className="flex flex-wrap gap-2">
                    {(['overzicht', 'kleur', 'zwartwit', 'antwoorden'] as const).map((m) => {
                      const labels = { overzicht: 'Overzicht', kleur: 'Quiz (kleur)', zwartwit: 'Quiz (zwart-wit)', antwoorden: 'Antwoorden' };
                      const colors = { overzicht: 'bg-slate-600 hover:bg-slate-700', kleur: 'bg-purple-600 hover:bg-purple-700', zwartwit: 'bg-slate-700 hover:bg-slate-800', antwoorden: 'bg-emerald-600 hover:bg-emerald-700' };
                      const isActive = fotoMode === m;
                      return (
                        <button
                          key={m}
                          onClick={() => setFotoMode(m)}
                          className={`px-3 py-2 rounded-lg font-medium text-sm ${isActive ? `${colors[m]} text-white` : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                          {labels[m]}
                        </button>
                      );
                    })}
                    <a
                      href={`/admin/quiz/fotos?mode=${fotoMode === 'antwoorden' ? 'antwoorden' : 'quiz'}&variant=${fotoMode === 'zwartwit' ? 'moeilijk' : 'normaal'}`}
                      target="_blank"
                      className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 font-medium text-sm"
                    >
                      Printversie
                    </a>
                    {quizPhotos.length > 0 && (
                      <button
                        onClick={downloadAllPhotos}
                        className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2 text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                      </button>
                    )}
                  </div>
                </div>
                {fotoMode === 'overzicht' ? (
                  stats.photos.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">Nog geen foto&apos;s geupload</p>
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
                  )
                ) : quizPhotos.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">Nog geen foto&apos;s geupload</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {quizPhotos.map((photo, idx) => {
                      const showName = fotoMode === 'antwoorden';
                      const isGrayscale = fotoMode === 'zwartwit';
                      return (
                        <div key={`${photo.responseId}-${photo.name}`} className="text-center">
                          <div className="aspect-[3/4] bg-slate-100 rounded-xl overflow-hidden relative shadow-sm">
                            <img
                              src={photo.url}
                              alt={showName ? photo.name : `Foto ${idx + 1}`}
                              className={`w-full h-full object-cover ${isGrayscale ? 'grayscale sepia-[0.15]' : ''}`}
                            />
                            <div className="absolute top-2 left-2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow">
                              {idx + 1}
                            </div>
                          </div>
                          <div className="mt-2">
                            {showName ? (
                              <p className="font-semibold text-emerald-700 text-sm">{photo.name}</p>
                            ) : (
                              <div className="border-b-2 border-dashed border-slate-300 h-6 mx-2" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Logo Quiz Tab */}
            {activeTab === 'logoquiz' && (
              <div>
                {quizMode === 'select' && (
                  <div>
                    <div className="mb-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-800">Selecteer Logo's voor de Quiz</h3>
                          <p className="text-sm text-slate-500">{selectedLogos.size} geselecteerd {selectedLogos.size < 2 && '(min. 2)'}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => { setQuizMode('play'); setCurrentQuizIndex(0); setScore(0); setShowAnswer(false); }}
                            disabled={selectedLogos.size < 2}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                          >
                            ▶ Start Quiz
                          </button>
                          <button
                            onClick={() => setQuizMode('print')}
                            disabled={selectedLogos.size < 2}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                          >
                            🖨 Print
                          </button>
                          <a
                            href="/admin/quiz/logos?mode=quiz"
                            target="_blank"
                            className={`px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-center ${selectedLogos.size < 2 ? 'pointer-events-none opacity-50' : ''}`}
                          >
                            Antwoordformulier
                          </a>
                          <a
                            href="/admin/quiz/logos?mode=antwoorden"
                            target="_blank"
                            className={`px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium text-center ${selectedLogos.size < 2 ? 'pointer-events-none opacity-50' : ''}`}
                          >
                            Antwoorden
                          </a>
                          <a
                            href="/bedrijven"
                            target="_blank"
                            className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 font-medium text-center"
                          >
                            Meer →
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                      {BEDRIJVEN.map((bedrijf) => {
                        const domain = new URL(bedrijf.website).hostname;
                        const isSelected = selectedLogos.has(bedrijf.naam);
                        return (
                          <div
                            key={bedrijf.naam}
                            className={`bg-white rounded-xl p-3 border-2 transition-all hover:shadow-lg ${
                              isSelected ? 'border-green-500 ring-2 ring-green-200' : 'border-slate-200'
                            }`}
                          >
                            <div
                              className="aspect-square bg-slate-50 rounded-lg mb-2 flex items-center justify-center overflow-hidden relative cursor-pointer group"
                              onClick={() => {
                                const newSet = new Set(selectedLogos);
                                if (isSelected) newSet.delete(bedrijf.naam);
                                else newSet.add(bedrijf.naam);
                                saveLogoSelection(newSet);
                              }}
                            >
                              {(customLogos[bedrijf.naam] || bedrijf.logo) ? (
                                /* Custom or predefined logo */
                                <img
                                  src={customLogos[bedrijf.naam] || bedrijf.logo}
                                  alt={bedrijf.naam}
                                  className="max-w-full max-h-full object-contain p-2"
                                />
                              ) : (
                                <>
                                  {/* Clearbit logo (higher quality) */}
                                  <img
                                    src={`https://logo.clearbit.com/${domain}`}
                                    alt={bedrijf.naam}
                                    className="max-w-full max-h-full object-contain p-2 absolute inset-0 m-auto"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                  {/* Google favicon fallback */}
                                  <img
                                    src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`}
                                    alt={bedrijf.naam}
                                    className="w-12 h-12 object-contain"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                </>
                              )}
                              {uploadingLogo === bedrijf.naam && (
                                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-center font-medium text-slate-700 truncate">{bedrijf.naam}</p>
                            <p className="text-xs text-center text-slate-400 mb-1">{bedrijf.categorie}</p>
                            <div className="flex justify-center gap-1">
                              <label className="text-[10px] text-blue-600 hover:text-blue-800 cursor-pointer">
                                📷
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleLogoUpload(bedrijf.naam, file);
                                    e.target.value = '';
                                  }}
                                />
                              </label>
                              {customLogos[bedrijf.naam] && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeCustomLogo(bedrijf.naam);
                                  }}
                                  className="text-[10px] text-red-500 hover:text-red-700"
                                  title="Verwijder custom logo"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {quizMode === 'play' && (
                  <div className="max-w-2xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                      <button
                        onClick={() => setQuizMode('select')}
                        className="text-slate-600 hover:text-slate-800"
                      >
                        ← Terug
                      </button>
                      <div className="text-sm text-slate-600">
                        Vraag {currentQuizIndex + 1} / {selectedLogos.size} • Score: {score}
                      </div>
                    </div>

                    {(() => {
                      const selectedArray = Array.from(selectedLogos);
                      const currentBedrijf = BEDRIJVEN.find(b => b.naam === selectedArray[currentQuizIndex]);
                      if (!currentBedrijf) return null;
                      const domain = new URL(currentBedrijf.website).hostname;

                      return (
                        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
                          <h3 className="text-xl font-semibold text-slate-800 mb-6">Van welk bedrijf is dit logo?</h3>
                          <div className="w-32 h-32 mx-auto bg-slate-100 rounded-xl flex items-center justify-center mb-6 overflow-hidden relative">
                            {(customLogos[currentBedrijf.naam] || currentBedrijf.logo) ? (
                              /* Custom logo */
                              <img
                                src={customLogos[currentBedrijf.naam] || currentBedrijf.logo}
                                alt="Logo"
                                className="max-w-full max-h-full object-contain p-2"
                              />
                            ) : (
                              <>
                                {/* Clearbit logo (higher quality) */}
                                <img
                                  src={`https://logo.clearbit.com/${domain}`}
                                  alt="Logo"
                                  className="max-w-full max-h-full object-contain p-2 absolute inset-0 m-auto"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                                {/* Google favicon fallback */}
                                <img
                                  src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`}
                                  alt="Logo"
                                  className="w-24 h-24 object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              </>
                            )}
                          </div>

                          {showAnswer ? (
                            <div>
                              <p className="text-2xl font-bold text-green-600 mb-4">{currentBedrijf.naam}</p>
                              <p className="text-slate-500 mb-6">{currentBedrijf.categorie}</p>
                              {currentQuizIndex < selectedArray.length - 1 ? (
                                <button
                                  onClick={() => { setCurrentQuizIndex(i => i + 1); setShowAnswer(false); }}
                                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                                >
                                  Volgende →
                                </button>
                              ) : (
                                <div>
                                  <p className="text-lg font-semibold text-slate-800 mb-4">Quiz voltooid! Score: {score}/{selectedArray.length}</p>
                                  <button
                                    onClick={() => setQuizMode('select')}
                                    className="px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 font-medium"
                                  >
                                    Opnieuw
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex gap-3 justify-center">
                              <button
                                onClick={() => { setShowAnswer(true); setScore(s => s + 1); }}
                                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                              >
                                ✓ Wist ik!
                              </button>
                              <button
                                onClick={() => setShowAnswer(true)}
                                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                              >
                                ✗ Toon antwoord
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {quizMode === 'print' && (
                  <div>
                    <div className="flex items-center justify-between mb-6 print:hidden">
                      <button
                        onClick={() => setQuizMode('select')}
                        className="text-slate-600 hover:text-slate-800"
                      >
                        ← Terug
                      </button>
                      <button
                        onClick={() => window.print()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                      >
                        🖨 Printen
                      </button>
                    </div>

                    <div className="bg-white rounded-xl p-6 border border-slate-200">
                      <h2 className="text-2xl font-bold text-center mb-8">Logo Quiz - Rijssense Bedrijven</h2>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        {Array.from(selectedLogos).map((naam, idx) => {
                          const bedrijf = BEDRIJVEN.find(b => b.naam === naam);
                          if (!bedrijf) return null;
                          const domain = new URL(bedrijf.website).hostname;
                          return (
                            <div key={naam} className="text-center p-4 border border-slate-200 rounded-lg">
                              <div className="text-sm text-slate-400 mb-2">#{idx + 1}</div>
                              <div className="w-20 h-20 mx-auto bg-slate-100 rounded-lg flex items-center justify-center mb-3 overflow-hidden relative">
                                {(customLogos[bedrijf.naam] || bedrijf.logo) ? (
                                  /* Custom logo */
                                  <img
                                    src={customLogos[bedrijf.naam] || bedrijf.logo}
                                    alt="Logo"
                                    className="max-w-full max-h-full object-contain p-1"
                                  />
                                ) : (
                                  <>
                                    {/* Clearbit logo (higher quality) */}
                                    <img
                                      src={`https://logo.clearbit.com/${domain}`}
                                      alt="Logo"
                                      className="max-w-full max-h-full object-contain p-1 absolute inset-0 m-auto"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                    {/* Google favicon fallback */}
                                    <img
                                      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`}
                                      alt="Logo"
                                      className="w-16 h-16 object-contain"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                  </>
                                )}
                              </div>
                              <div className="h-8 border-b border-dashed border-slate-300"></div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-12 pt-8 border-t border-slate-200">
                        <h3 className="font-semibold mb-4">Antwoorden:</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                          {Array.from(selectedLogos).map((naam, idx) => (
                            <div key={naam}>#{idx + 1}: {naam}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Straat Quiz Tab */}
            {activeTab === 'straatquiz' && (
              <div>
                {streetviewItems.length === 0 && !streetviewLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                  </div>
                ) : streetviewLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                  </div>
                ) : (
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800">Raad de Straat!</h3>
                        <p className="text-sm text-slate-500">{streetviewItems.length} street view foto&apos;s</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(['normaal', 'moeilijk', 'straat', 'antwoorden'] as const).map((v) => {
                          const colors = { normaal: 'bg-blue-600 hover:bg-blue-700', moeilijk: 'bg-orange-600 hover:bg-orange-700', straat: 'bg-purple-600 hover:bg-purple-700', antwoorden: 'bg-emerald-600 hover:bg-emerald-700' };
                          const labels = { normaal: 'Normaal', moeilijk: 'Moeilijk', straat: 'Straat', antwoorden: 'Antwoorden' };
                          const isActive = straatVariant === v;
                          return (
                            <button
                              key={v}
                              onClick={() => setStraatVariant(v)}
                              className={`px-3 py-2 rounded-lg font-medium text-sm ${isActive ? `${colors[v]} text-white` : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                              {labels[v]}
                            </button>
                          );
                        })}
                        <a
                          href={`/admin/quiz/straat?mode=${straatVariant === 'antwoorden' ? 'antwoorden' : 'quiz'}&variant=${straatVariant}`}
                          target="_blank"
                          className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 font-medium text-sm"
                        >
                          Printversie
                        </a>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {streetviewItems.map((item) => {
                        const imgUrl = straatVariant === 'moeilijk' ? (item.blob_url_hard || item.blob_url)
                          : straatVariant === 'straat' ? (item.blob_url_street || item.blob_url)
                          : item.blob_url;
                        const showAnswer = straatVariant === 'antwoorden';
                        return (
                          <div key={item.id} className="border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                            <div className="aspect-[16/10] bg-slate-100 relative">
                              <img
                                src={imgUrl}
                                alt={`Vraag ${item.question_number}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute top-2 left-2 w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs shadow">
                                {item.question_number}
                              </div>
                            </div>
                            {showAnswer ? (
                              <div className="p-3 bg-emerald-50">
                                <p className="font-medium text-emerald-800 text-sm truncate">{item.names}</p>
                                <p className="text-xs text-emerald-600 truncate">{item.address}</p>
                              </div>
                            ) : (
                              <div className="p-3">
                                <p className="font-medium text-slate-400 text-sm">Wie woont hier?</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cijfer Quiz Tab */}
            {activeTab === 'cijferquiz' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">Cijferronde</h3>
                    <p className="text-sm text-slate-500">{cijferQuestions.length} vragen uit {responses.length} inzendingen</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setCijferMode(cijferMode === 'quiz' ? 'antwoorden' : 'quiz')}
                      className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium text-sm"
                    >
                      {cijferMode === 'quiz' ? 'Toon antwoorden' : 'Toon quiz'}
                    </button>
                    <a
                      href={`/admin/quiz/cijfers?mode=${cijferMode}`}
                      target="_blank"
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
                    >
                      Open printversie
                    </a>
                  </div>
                </div>
                {cijferQuestions.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">Niet genoeg data om vragen te genereren.</p>
                ) : (
                  <div className="space-y-6">
                    {cijferQuestions.map((q) => (
                      <div key={q.number}>
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                            {q.number}
                          </div>
                          <div className="flex-1">
                            <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">{q.category}</span>
                            <p className="font-medium text-slate-800 mt-0.5 whitespace-pre-line">{q.question}</p>
                            {cijferMode === 'quiz' ? (
                              <div className="mt-3">
                                {q.type === 'multiple_choice' && q.options ? (
                                  <div className="grid grid-cols-2 gap-2">
                                    {q.options.map((opt, i) => (
                                      <div key={i} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
                                        <span className="w-6 h-6 bg-white border-2 border-slate-300 rounded-full flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0">{String.fromCharCode(65 + i)}</span>
                                        <span className="text-slate-700">{opt}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="border-b-2 border-dashed border-slate-300 h-7 mt-2" />
                                )}
                              </div>
                            ) : (
                              <div className="mt-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                                <span className="font-semibold text-emerald-700 whitespace-pre-line">{q.answer}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Wie van de 3 Tab */}
            {activeTab === 'wievande3' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">Wie van de 3?</h3>
                    <p className="text-sm text-slate-500">{wieVanDe3Questions.length} vragen - automatisch gegenereerd</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setWieVanDe3Mode(wieVanDe3Mode === 'quiz' ? 'antwoorden' : 'quiz')}
                      className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium text-sm"
                    >
                      {wieVanDe3Mode === 'quiz' ? 'Toon antwoorden' : 'Toon quiz'}
                    </button>
                    <a
                      href={`/admin/quiz/wie-van-de-3?mode=${wieVanDe3Mode}`}
                      target="_blank"
                      className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm"
                    >
                      Open printversie
                    </a>
                  </div>
                </div>
                {wieVanDe3Questions.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">Niet genoeg data om vragen te genereren.</p>
                ) : (
                  <div className="space-y-6">
                    {wieVanDe3Questions.map((q) => (
                      <div key={q.number} className="border border-slate-200 rounded-xl p-5">
                        <div className="flex gap-3 items-start">
                          <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                            {q.number}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-slate-800">{q.question}</p>
                            <div className="flex gap-3 mt-3">
                              {q.names.map((name, i) => {
                                const isAnswer = i === q.answerIndex;
                                return (
                                  <div key={i} className={`flex-1 text-center px-3 py-3 rounded-lg border-2 ${wieVanDe3Mode === 'antwoorden' && isAnswer ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
                                    <span className={`text-xs font-bold block mb-0.5 ${wieVanDe3Mode === 'antwoorden' && isAnswer ? 'text-emerald-600' : 'text-slate-400'}`}>{String.fromCharCode(65 + i)}</span>
                                    <span className={`font-semibold text-sm ${wieVanDe3Mode === 'antwoorden' && isAnswer ? 'text-emerald-700' : 'text-slate-700'}`}>{name}</span>
                                    {wieVanDe3Mode === 'antwoorden' && isAnswer && <span className="block text-emerald-600 text-xs mt-0.5">&#10003;</span>}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Feit of Fabel Tab */}
            {activeTab === 'feitoffabel' && (
              <div>
                {(feitOfFabelItems.length > 0 || feitOfFabelLoading) && (
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800">Feit of Fabel</h3>
                        <p className="text-sm text-slate-500">{feitOfFabelItems.length} stellingen</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <a
                          href="/admin/quiz/feit-of-fabel?mode=quiz"
                          target="_blank"
                          className={`px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm ${feitOfFabelItems.length === 0 ? 'pointer-events-none opacity-50' : ''}`}
                        >
                          Open quiz
                        </a>
                        <a
                          href="/admin/quiz/feit-of-fabel?mode=antwoorden"
                          target="_blank"
                          className={`px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium text-sm ${feitOfFabelItems.length === 0 ? 'pointer-events-none opacity-50' : ''}`}
                        >
                          Antwoorden
                        </a>
                        <button
                          onClick={fetchFeitOfFabel}
                          className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 text-sm"
                        >
                          Herlaad
                        </button>
                      </div>
                    </div>

                    {/* Add new stelling */}
                    <div className="bg-slate-50 rounded-lg p-4 mb-6 border border-slate-200">
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col sm:flex-row gap-3">
                          <input
                            type="text"
                            value={nieuweStellingText}
                            onChange={e => setNieuweStellingText(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addStelling()}
                            placeholder="Nieuwe stelling..."
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                          />
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                              <input
                                type="radio"
                                checked={nieuweStellingWaar}
                                onChange={() => setNieuweStellingWaar(true)}
                                className="text-emerald-600"
                              />
                              <span className="text-emerald-700 font-medium">Waar</span>
                            </label>
                            <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                              <input
                                type="radio"
                                checked={!nieuweStellingWaar}
                                onChange={() => setNieuweStellingWaar(false)}
                                className="text-red-600"
                              />
                              <span className="text-red-700 font-medium">Niet waar</span>
                            </label>
                            <button
                              onClick={addStelling}
                              disabled={!nieuweStellingText.trim()}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                              Toevoegen
                            </button>
                          </div>
                        </div>
                        <input
                          type="text"
                          value={nieuweStellingToelichting}
                          onChange={e => setNieuweStellingToelichting(e.target.value)}
                          placeholder="Toelichting (optioneel, verschijnt op antwoordblad)..."
                          className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        />
                      </div>
                    </div>

                    {/* Stellingen list */}
                    {feitOfFabelLoading ? (
                      <p className="text-center text-slate-500 py-4">Laden...</p>
                    ) : (
                      <div className="space-y-0 border border-slate-200 rounded-lg overflow-hidden">
                        {feitOfFabelItems.map((item, idx) => (
                          <div
                            key={item.id}
                            className={`flex items-center gap-3 px-4 py-3 bg-white ${idx < feitOfFabelItems.length - 1 ? 'border-b border-slate-100' : ''} hover:bg-slate-50`}
                          >
                            <div className="flex-shrink-0 flex flex-col items-center gap-0.5">
                              <button
                                onClick={() => moveStelling(idx, 'up')}
                                disabled={idx === 0}
                                className="text-slate-300 hover:text-slate-600 disabled:opacity-0 text-xs leading-none"
                              >
                                ▲
                              </button>
                              <span className="w-7 h-7 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center text-xs font-bold">
                                {idx + 1}
                              </span>
                              <button
                                onClick={() => moveStelling(idx, 'down')}
                                disabled={idx === feitOfFabelItems.length - 1}
                                className="text-slate-300 hover:text-slate-600 disabled:opacity-0 text-xs leading-none"
                              >
                                ▼
                              </button>
                            </div>

                            {editingStelling === item.id ? (
                              <div className="flex-1 flex flex-col gap-2">
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <input
                                    type="text"
                                    value={editStellingText}
                                    onChange={e => setEditStellingText(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && updateStelling(item.id)}
                                    className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm"
                                    autoFocus
                                  />
                                  <div className="flex items-center gap-2">
                                    <label className="flex items-center gap-1 text-xs cursor-pointer">
                                      <input type="radio" checked={editStellingWaar} onChange={() => setEditStellingWaar(true)} />
                                      <span className="text-emerald-700">Waar</span>
                                    </label>
                                    <label className="flex items-center gap-1 text-xs cursor-pointer">
                                      <input type="radio" checked={!editStellingWaar} onChange={() => setEditStellingWaar(false)} />
                                      <span className="text-red-700">Niet waar</span>
                                    </label>
                                    <button onClick={() => updateStelling(item.id)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Opslaan</button>
                                    <button onClick={() => setEditingStelling(null)} className="text-xs text-slate-400 hover:text-slate-600">Annuleer</button>
                                  </div>
                                </div>
                                <input
                                  type="text"
                                  value={editStellingToelichting}
                                  onChange={e => setEditStellingToelichting(e.target.value)}
                                  placeholder="Toelichting (optioneel)..."
                                  className="px-2 py-1 border border-slate-300 rounded text-sm"
                                />
                              </div>
                            ) : (
                              <>
                                <div className="flex-1">
                                  <span className="text-sm text-slate-800">{item.stelling}</span>
                                  {item.toelichting && (
                                    <p className="text-xs text-slate-400 mt-0.5">{item.toelichting}</p>
                                  )}
                                </div>
                                <span className={`flex-shrink-0 px-2 py-0.5 rounded text-xs font-semibold ${
                                  item.is_waar ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                }`}>
                                  {item.is_waar ? 'WAAR' : 'FABEL'}
                                </span>
                                <button
                                  onClick={() => { setEditingStelling(item.id); setEditStellingText(item.stelling); setEditStellingWaar(item.is_waar); setEditStellingToelichting(item.toelichting || ''); }}
                                  className="text-xs text-slate-400 hover:text-blue-600"
                                >
                                  Bewerk
                                </button>
                                <button
                                  onClick={() => deleteStelling(item.id)}
                                  className="text-xs text-slate-400 hover:text-red-600"
                                >
                                  Verwijder
                                </button>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Groepen Tab */}
            {activeTab === 'groepen' && (
              <div>
                {participants.length === 0 && !participantsLoading ? (
                  <div className="text-center py-8">
                    <p className="text-slate-500 mb-4">Nog geen deelnemers geladen.</p>
                    <button
                      onClick={fetchParticipants}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                      Deelnemers laden
                    </button>
                  </div>
                ) : participantsLoading ? (
                  <div className="text-center py-8">
                    <p className="text-slate-500">Laden...</p>
                  </div>
                ) : (
                  <div>
                    {/* Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 print:hidden">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800">Groepsindeling</h3>
                        <p className="text-sm text-slate-500">{participants.length} deelnemers uit {new Set(participants.map(p => p.familie)).size} families</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 sm:ml-auto">
                        <label className="text-sm font-medium text-slate-600">Max per groep:</label>
                        <input
                          type="number"
                          min={2}
                          max={15}
                          value={maxPerGroep}
                          onChange={e => setMaxPerGroep(parseInt(e.target.value) || 2)}
                          className="w-16 px-2 py-1.5 border border-slate-300 rounded-lg text-center text-sm"
                        />
                        <label className="flex items-center gap-1.5 text-sm text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={metOrganisatie}
                            onChange={e => setMetOrganisatie(e.target.checked)}
                            className="rounded border-slate-300"
                          />
                          Met organisatie
                        </label>
                        <button
                          onClick={handleVerdeel}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm"
                        >
                          Verdeel
                        </button>
                        <button
                          onClick={fetchParticipants}
                          className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 text-sm print:hidden"
                        >
                          Herlaad
                        </button>
                        {participants.some(p => p.groep) && (
                          <button
                            onClick={() => window.print()}
                            className="px-3 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 text-sm print:hidden"
                          >
                            Print
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Group stats (hidden on print) */}
                    {participants.some(p => p.groep) && (() => {
                      const maxGroep = Math.max(...participants.filter(p => p.groep).map(p => p.groep!));
                      const groepen = Array.from({ length: maxGroep }, (_, i) => {
                        const members = participants.filter(p => p.groep === i + 1);
                        const families = new Set(members.map(m => m.familie));
                        const jong = members.filter(m => m.generatie === 1).length;
                        const man = members.filter(m => m.geslacht === 'M').length;
                        return { nr: i + 1, members, families: families.size, jong, oud: members.length - jong, man, vrouw: members.length - man };
                      });
                      return (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6 print:hidden">
                          {groepen.map(g => (
                            <div key={g.nr} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                              <div className="font-semibold text-slate-800 mb-1">Groep {g.nr} <span className="text-slate-400 font-normal">({g.members.length})</span></div>
                              <div className="text-xs text-slate-500 space-y-0.5">
                                <div>{g.jong} jong / {g.oud} oud</div>
                                <div>{g.man} M / {g.vrouw} V</div>
                                <div>{g.families} families</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}

                    {/* Group columns view */}
                    {participants.some(p => p.groep) && (() => {
                      const maxGroep = Math.max(...participants.filter(p => p.groep).map(p => p.groep!));
                      return (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-8">
                          {Array.from({ length: maxGroep }, (_, i) => {
                            const members = participants.filter(p => p.groep === i + 1);
                            return (
                              <div key={i + 1} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                                <div className="bg-slate-800 text-white px-3 py-2 font-semibold text-sm">Groep {i + 1}</div>
                                <div className="p-2 space-y-1">
                                  {members.map(m => (
                                    <div
                                      key={m.id}
                                      className={`px-2 py-1 rounded text-xs border ${FAMILIE_KLEUREN[m.familie] || 'bg-gray-100 text-gray-800 border-gray-300'}`}
                                    >
                                      <span className="font-medium">{m.naam}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}

                    {/* Niet-ingedeeld */}
                    {participants.some(p => !p.groep) && (
                      <div className="mb-6 print:hidden">
                        <h4 className="text-sm font-semibold text-slate-500 uppercase mb-2">Niet ingedeeld ({participants.filter(p => !p.groep).length})</h4>
                        <div className="flex flex-wrap gap-2">
                          {participants.filter(p => !p.groep).map(m => (
                            <span key={m.id} className={`px-2 py-1 rounded text-xs border ${FAMILIE_KLEUREN[m.familie] || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
                              {m.naam}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Deelnemers tabel */}
                    <h4 className="text-sm font-semibold text-slate-500 uppercase mb-2 mt-8 print:hidden">Alle deelnemers</h4>
                    <div className="overflow-x-auto print:hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Naam</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Familie</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Gezin</th>
                            <th className="px-3 py-2 text-center text-xs font-semibold text-slate-500">Gen.</th>
                            <th className="px-3 py-2 text-center text-xs font-semibold text-slate-500">M/V</th>
                            <th className="px-3 py-2 text-center text-xs font-semibold text-slate-500">Groep</th>
                          </tr>
                        </thead>
                        <tbody>
                          {participants.map(p => (
                            <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="px-3 py-2">
                                <span className={`inline-block px-2 py-0.5 rounded text-xs border ${FAMILIE_KLEUREN[p.familie] || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
                                  {p.naam}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-slate-600">{p.familie}</td>
                              <td className="px-3 py-2 text-slate-500">{p.gezin || '-'}</td>
                              <td className="px-3 py-2 text-center">
                                {editingParticipant === p.id ? (
                                  <select
                                    defaultValue={p.generatie}
                                    onChange={e => handleParticipantUpdate(p.id, { generatie: parseInt(e.target.value) })}
                                    className="text-xs border rounded px-1 py-0.5"
                                  >
                                    <option value={1}>Jong</option>
                                    <option value={2}>Oud</option>
                                  </select>
                                ) : (
                                  <span
                                    className={`cursor-pointer text-xs px-1.5 py-0.5 rounded ${p.generatie === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
                                    onClick={() => setEditingParticipant(p.id)}
                                  >
                                    {p.generatie === 1 ? 'Jong' : 'Oud'}
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-center">
                                {editingParticipant === p.id ? (
                                  <select
                                    defaultValue={p.geslacht}
                                    onChange={e => handleParticipantUpdate(p.id, { geslacht: e.target.value })}
                                    className="text-xs border rounded px-1 py-0.5"
                                  >
                                    <option value="M">M</option>
                                    <option value="V">V</option>
                                  </select>
                                ) : (
                                  <span
                                    className="cursor-pointer text-xs"
                                    onClick={() => setEditingParticipant(p.id)}
                                  >
                                    {p.geslacht}
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-center">
                                <select
                                  value={p.groep || ''}
                                  onChange={e => handleGroupChange(p.id, e.target.value ? parseInt(e.target.value) : null)}
                                  className="text-xs border border-slate-300 rounded px-1.5 py-0.5"
                                >
                                  <option value="">-</option>
                                  {Array.from({ length: 10 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>Groep {i + 1}</option>
                                  ))}
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
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
