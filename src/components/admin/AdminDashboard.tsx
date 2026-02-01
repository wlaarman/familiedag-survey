'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SurveyResponse } from '@/types/survey';

type TabType = 'responses' | 'overview' | 'statistics' | 'photos' | 'anekdotes' | 'feitjes' | 'logoquiz';

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

interface FunFact {
  category: string;
  icon: string;
  title: string;
  description: string;
}

interface MarriedCouple {
  names: string;
  date: Date;
  dateStr: string;
}

interface Bedrijf {
  naam: string;
  website: string;
  categorie: string;
}

// Rijssense bedrijven voor logo quiz
const BEDRIJVEN: Bedrijf[] = [
  { naam: 'Ter Steege Groep', website: 'https://www.tersteegegroep.nl/', categorie: 'Bouw' },
  { naam: 'VolkerWessels', website: 'https://www.volkerwessels.com/', categorie: 'Bouw' },
  { naam: 'Nijhuis Bouw', website: 'https://www.nijhuis.nl/', categorie: 'Bouw' },
  { naam: 'Voortman Steel Group', website: 'https://www.voortmansteelgroup.com/nl/', categorie: 'Industrie' },
  { naam: 'Reginox', website: 'https://www.reginox.nl/', categorie: 'Industrie' },
  { naam: 'Nijhof-Wassink', website: 'https://www.nijhof-wassink.com/', categorie: 'Transport' },
  { naam: 'Harbers Trucks', website: 'https://www.harberstrucks.nl/', categorie: 'Transport' },
  { naam: 'Munsterhuis', website: 'https://www.munsterhuis.nl/', categorie: 'Auto' },
  { naam: 'Knobben Caravans', website: 'https://www.knobbencaravans.nl/', categorie: 'Auto' },
  { naam: 'Bakkerij Otten', website: 'https://www.bakkerij-otten.nl/', categorie: 'Bakker' },
  { naam: 'Meinders De Echte Bakker', website: 'https://bakkermeinders.nl/', categorie: 'Bakker' },
  { naam: 'Keurslager Beverdam', website: 'https://beverdam.keurslager.nl/', categorie: 'Slager' },
  { naam: 'Gildeslager Goossen', website: 'https://www.slagerijgoossen.nl/', categorie: 'Slager' },
  { naam: 'VIF Jeans', website: 'https://vifjeans.nl/', categorie: 'Mode' },
  { naam: 'Sans Mode', website: 'https://www.sans.nl/', categorie: 'Mode' },
  { naam: 'Unique Mode', website: 'https://www.uniquemode.nl/', categorie: 'Mode' },
  { naam: 'Brodshoes', website: 'https://www.brodshoes.nl/', categorie: 'Schoenen' },
  { naam: 'Restaurant De Kroon', website: 'https://www.dekroonrijssen.nl/', categorie: 'Horeca' },
  { naam: 'De Markies', website: 'https://www.demarkies.com/', categorie: 'Horeca' },
  { naam: 'Tuincentrum Veeneslagen', website: 'https://www.tuincentrumveeneslagen.nl/', categorie: 'Tuin' },
  { naam: 'Voortman Keukens', website: 'https://www.voortmankeukens.nl/', categorie: 'Wonen' },
  { naam: 'Reggeborgh', website: 'https://reggeborgh.nl/', categorie: 'Investering' },
  { naam: 'Gamma Rijssen', website: 'https://www.gamma.nl/', categorie: 'Bouwmarkt' },
  { naam: 'Juwelier Asbroek', website: 'https://www.juwelierasbroek.nl/', categorie: 'Juwelier' },
  { naam: 'Apotheek de Weijerd', website: 'https://www.apotheekdeweijerd.nl/', categorie: 'Apotheek' },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('responses');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedLogos, setSelectedLogos] = useState<Set<string>>(new Set());
  const [quizMode, setQuizMode] = useState<'select' | 'play' | 'print'>('select');
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);

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

  // Calculate fun facts
  const funFacts = useMemo<{ facts: FunFact[]; marriages: MarriedCouple[]; closestMarriages: { couple1: string; couple2: string; days: number } | null }>(() => {
    const facts: FunFact[] = [];
    const marriages: MarriedCouple[] = [];

    // Collect all persons with their data
    const persons: { name: string; schoenmaat?: number; angst?: string; prijs?: string; gerecht?: string; bijnaam?: string }[] = [];

    responses.forEach(r => {
      // Person 1
      const schoen1 = r.schoenmaat_1 ? parseInt(r.schoenmaat_1.replace(/[^0-9]/g, '')) : undefined;
      persons.push({
        name: r.naam_1.trim(),
        schoenmaat: schoen1 && !isNaN(schoen1) ? schoen1 : undefined,
        angst: r.angst_1?.trim(),
        prijs: r.prijs_medaille_1?.trim(),
        gerecht: r.gerecht_1?.trim(),
        bijnaam: r.bijnaam_1?.trim(),
      });

      // Person 2
      if (r.heeft_partner && r.naam_2) {
        const schoen2 = r.schoenmaat_2 ? parseInt(r.schoenmaat_2.replace(/[^0-9]/g, '')) : undefined;
        persons.push({
          name: r.naam_2.trim(),
          schoenmaat: schoen2 && !isNaN(schoen2) ? schoen2 : undefined,
          angst: r.angst_2?.trim(),
          prijs: r.prijs_medaille_2?.trim(),
          gerecht: r.gerecht_2?.trim(),
          bijnaam: r.bijnaam_2?.trim(),
        });
      }

      // Marriages
      if (r.is_getrouwd === 'Ja' && r.trouwdatum && r.naam_2) {
        const date = new Date(r.trouwdatum);
        if (date.getFullYear() > 1900 && date.getFullYear() < 2030) {
          marriages.push({
            names: `${r.naam_1.trim()} & ${r.naam_2.trim()}`,
            date,
            dateStr: date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
          });
        }
      }
    });

    // Sort marriages chronologically
    marriages.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Find closest marriages
    let closestMarriages: { couple1: string; couple2: string; days: number } | null = null;
    if (marriages.length >= 2) {
      let minDays = Infinity;
      for (let i = 0; i < marriages.length - 1; i++) {
        const days = Math.abs(marriages[i + 1].date.getTime() - marriages[i].date.getTime()) / (1000 * 60 * 60 * 24);
        if (days < minDays) {
          minDays = days;
          closestMarriages = {
            couple1: marriages[i].names,
            couple2: marriages[i + 1].names,
            days: Math.round(days)
          };
        }
      }
    }

    // Unanimous preferences
    const totalPersons = persons.length;
    if (stats.preferences.hond > 0 && stats.preferences.kat === 0) {
      facts.push({ category: 'Unaniem', icon: '🐕', title: '100% Team Hond', description: `Alle ${stats.preferences.hond} familieleden kiezen voor hond boven kat!` });
    }
    if (stats.preferences.zomer > 0 && stats.preferences.winter === 0) {
      facts.push({ category: 'Unaniem', icon: '☀️', title: '100% Team Zomer', description: `Niemand in de familie kiest voor winter!` });
    }
    if (stats.preferences.kat > 0 && stats.preferences.hond === 0) {
      facts.push({ category: 'Unaniem', icon: '🐱', title: '100% Team Kat', description: `Alle familieleden kiezen voor kat!` });
    }

    // Shoe sizes
    const validSchoenmaten = persons.filter(p => p.schoenmaat && p.schoenmaat >= 30 && p.schoenmaat <= 50);
    if (validSchoenmaten.length >= 2) {
      const biggest = validSchoenmaten.reduce((a, b) => (a.schoenmaat! > b.schoenmaat! ? a : b));
      const smallest = validSchoenmaten.reduce((a, b) => (a.schoenmaat! < b.schoenmaat! ? a : b));
      if (biggest.schoenmaat !== smallest.schoenmaat) {
        facts.push({
          category: 'Extremen',
          icon: '👟',
          title: 'Schoenmaten',
          description: `Grootste: ${biggest.name} (${biggest.schoenmaat}) • Kleinste: ${smallest.name} (${smallest.schoenmaat}) • Verschil: ${biggest.schoenmaat! - smallest.schoenmaat!} maten!`
        });
      }
    }

    // Notable achievements (kampioenen)
    persons.forEach(p => {
      if (p.prijs && p.prijs.toLowerCase().includes('kampioen')) {
        facts.push({ category: 'Kampioen', icon: '🏆', title: p.name, description: p.prijs });
      }
    });

    // Unusual fears
    const funnyFears = persons.filter(p =>
      p.angst &&
      !['nee', 'niet', 'geen', 'nergens', 'x', '-', 'n.v.t'].some(x => p.angst!.toLowerCase().includes(x)) &&
      p.angst.length > 3
    );
    funnyFears.forEach(p => {
      if (p.angst!.toLowerCase().includes('vrouw') || p.angst!.toLowerCase().includes('man')) {
        facts.push({ category: 'Grappig', icon: '😅', title: `${p.name}'s angst`, description: p.angst! });
      }
      if (p.angst!.toLowerCase().includes('kat') || p.angst!.toLowerCase().includes('muis') || p.angst!.toLowerCase().includes('veren')) {
        facts.push({ category: 'Angsten', icon: '😨', title: `${p.name}`, description: `Bang voor: ${p.angst}` });
      }
    });

    // Unusual foods
    const unusualFoods = ['brood', 'hazepeper', 'zuurkool'];
    persons.forEach(p => {
      if (p.gerecht && unusualFoods.some(f => p.gerecht!.toLowerCase().includes(f))) {
        facts.push({ category: 'Eten', icon: '🍽️', title: `${p.name}'s lievelingsgerecht`, description: p.gerecht });
      }
    });

    // Funny nicknames
    const funnyNicknames = persons.filter(p => p.bijnaam && p.bijnaam.length > 2 && !['geen', 'nee', '-'].includes(p.bijnaam.toLowerCase()));
    if (funnyNicknames.length > 0) {
      const nickList = funnyNicknames.map(p => `${p.name}: "${p.bijnaam}"`).slice(0, 5);
      facts.push({ category: 'Bijnamen', icon: '🏷️', title: 'Bijnamen in de familie', description: nickList.join(' • ') });
    }

    // Marriage facts
    if (closestMarriages) {
      const years = Math.floor(closestMarriages.days / 365);
      const months = Math.floor((closestMarriages.days % 365) / 30);
      const timeStr = years > 0 ? `${years} jaar en ${months} maanden` : `${months} maanden`;
      facts.push({
        category: 'Huwelijken',
        icon: '💒',
        title: 'Dichtst bij elkaar getrouwd',
        description: `${closestMarriages.couple1} en ${closestMarriages.couple2} trouwden met slechts ${timeStr} verschil!`
      });
    }

    if (marriages.length > 0) {
      facts.push({
        category: 'Huwelijken',
        icon: '💍',
        title: 'Langst getrouwd',
        description: `${marriages[0].names} - getrouwd op ${marriages[0].dateStr}`
      });
    }

    return { facts, marriages, closestMarriages };
  }, [responses, stats.preferences]);

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
          <div className="border-b border-slate-200 overflow-x-auto">
            <nav className="flex gap-1 px-2 min-w-max">
              {[
                { id: 'responses', label: 'Inzendingen', icon: '👥' },
                { id: 'overview', label: 'Overzicht', icon: '📋' },
                { id: 'statistics', label: 'Stats', icon: '📊' },
                { id: 'photos', label: `Foto's`, icon: '📷', count: stats.photos.length },
                { id: 'anekdotes', label: 'Anekdotes', icon: '💬', count: stats.anekdotes.length },
                { id: 'feitjes', label: 'Feitjes', icon: '✨', count: funFacts.facts.length },
                { id: 'logoquiz', label: 'Logo Quiz', icon: '🏢' },
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

            {/* Feitjes Tab */}
            {activeTab === 'feitjes' && (
              <div className="space-y-8">
                {/* Fun Facts Grid */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Interessante Feitjes</h3>
                  {funFacts.facts.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">Nog niet genoeg data voor feitjes</p>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {funFacts.facts.map((fact, idx) => (
                        <div key={idx} className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">{fact.icon}</span>
                            <div>
                              <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{fact.category}</span>
                              <h4 className="font-semibold text-slate-800">{fact.title}</h4>
                              <p className="text-sm text-slate-600 mt-1">{fact.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Marriage Timeline */}
                {funFacts.marriages.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Huwelijken Tijdlijn</h3>
                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-pink-200" />
                      <div className="space-y-4">
                        {funFacts.marriages.map((marriage, idx) => (
                          <div key={idx} className="flex items-center gap-4 relative">
                            <div className="w-8 h-8 rounded-full bg-pink-500 text-white flex items-center justify-center text-sm font-bold z-10">
                              {idx + 1}
                            </div>
                            <div className="flex-1 bg-white rounded-lg p-3 border border-slate-200 shadow-sm">
                              <p className="font-medium text-slate-800">{marriage.names}</p>
                              <p className="text-sm text-slate-500">{marriage.dateStr}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
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
                            onClick={() => {
                              const newSet = new Set(selectedLogos);
                              if (isSelected) newSet.delete(bedrijf.naam);
                              else newSet.add(bedrijf.naam);
                              setSelectedLogos(newSet);
                            }}
                            className={`bg-white rounded-xl p-3 border-2 cursor-pointer transition-all hover:shadow-lg ${
                              isSelected ? 'border-green-500 ring-2 ring-green-200' : 'border-slate-200'
                            }`}
                          >
                            <div className="aspect-square bg-slate-50 rounded-lg mb-2 flex items-center justify-center">
                              <img
                                src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`}
                                alt={bedrijf.naam}
                                className="w-12 h-12 object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                            <p className="text-xs text-center font-medium text-slate-700 truncate">{bedrijf.naam}</p>
                            <p className="text-xs text-center text-slate-400">{bedrijf.categorie}</p>
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
                          <div className="w-32 h-32 mx-auto bg-slate-100 rounded-xl flex items-center justify-center mb-6">
                            <img
                              src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`}
                              alt="Logo"
                              className="w-24 h-24 object-contain"
                            />
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
                              <div className="w-20 h-20 mx-auto bg-slate-100 rounded-lg flex items-center justify-center mb-3">
                                <img
                                  src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`}
                                  alt="Logo"
                                  className="w-16 h-16 object-contain"
                                />
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
