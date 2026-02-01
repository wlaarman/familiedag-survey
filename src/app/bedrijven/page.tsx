'use client';

import { useState } from 'react';

interface Bedrijf {
  naam: string;
  website: string;
  logo?: string;
  categorie: string;
}

// Traditionele Rijssense familiebedrijven
const bedrijven: Bedrijf[] = [
  // Bouw & Constructie
  { naam: 'Ter Steege Groep', website: 'https://www.tersteegegroep.nl/', categorie: 'Bouw' },
  { naam: 'VolkerWessels', website: 'https://www.volkerwessels.com/', categorie: 'Bouw' },
  { naam: 'Nijhuis Bouw', website: 'https://www.nijhuis.nl/', categorie: 'Bouw' },
  { naam: 'Vastbouw', website: 'https://www.vastbouw.nl/', categorie: 'Bouw' },
  { naam: 'Akor', website: 'https://www.akor.nl/', categorie: 'Bouw' },
  { naam: 'Webo Timmerfabriek', website: 'https://www.webo.nl/', categorie: 'Bouw' },
  { naam: 'Bouwbedrijf Lichtenberg', website: 'https://www.bouwbedrijf-lichtenberg.nl/', categorie: 'Bouw' },
  { naam: 'Hemink Groep', website: 'https://heminkgroep.nl/', categorie: 'Bouw' },

  // Industrie & Productie
  { naam: 'Voortman Steel Group', website: 'https://www.voortmansteelgroup.com/nl/', categorie: 'Industrie' },
  { naam: 'Reginox', website: 'https://www.reginox.nl/', categorie: 'Industrie' },
  { naam: 'Stempher Verpakkingen', website: 'https://www.stempher.nl/', categorie: 'Industrie' },
  { naam: 'Geran', website: 'https://www.geran.nl/', categorie: 'Industrie' },
  { naam: 'Polybouw Aluminium', website: 'https://www.polybouw.nl/', categorie: 'Industrie' },
  { naam: 'HTB Constructie', website: 'https://www.htbconstructie.nl/', categorie: 'Industrie' },

  // Transport & Logistiek
  { naam: 'Nijhof-Wassink', website: 'https://www.nijhof-wassink.com/', categorie: 'Transport' },
  { naam: 'Harbers Trucks', website: 'https://www.harberstrucks.nl/', categorie: 'Transport' },
  { naam: 'Baan Transport', website: 'https://www.baantransport.nl/', categorie: 'Transport' },
  { naam: 'Pultrum Transport', website: 'https://www.pultrum-rijssen.nl/', categorie: 'Transport' },
  { naam: 'Brinks Transport', website: 'https://www.brinks-transport.nl/', categorie: 'Transport' },
  { naam: 'Ten Brinke Transport', website: 'https://www.tenbrinke.nl/', categorie: 'Transport' },

  // Retail & Diensten
  { naam: 'Voortman Keukens', website: 'https://www.voortmankeukens.nl/', categorie: 'Retail' },
  { naam: 'Knobben Caravans', website: 'https://www.knobbencaravans.nl/', categorie: 'Retail' },
  { naam: 'Munsterhuis', website: 'https://www.munsterhuis.nl/', categorie: 'Auto' },
  { naam: 'Schippers', website: 'https://www.autoschippers.nl/', categorie: 'Auto' },
  { naam: 'Autobedrijf De Haar', website: 'https://www.dehaar.nl/', categorie: 'Auto' },
  { naam: 'Brodshoes', website: 'https://www.brodshoes.nl/', categorie: 'Retail' },
  { naam: 'Pongers', website: 'https://www.pongers.nl/', categorie: 'Retail' },

  // Overig
  { naam: 'Teunis Groep', website: 'https://www.teunis.nl/', categorie: 'Diensten' },
  { naam: 'Reggeborgh', website: 'https://reggeborgh.nl/', categorie: 'Investering' },
  { naam: 'Klein Boonschate', website: 'https://www.kleinboonschate.nl/', categorie: 'Hoveniers' },
  { naam: 'Troost Hoveniers', website: 'https://troosthoveniers.nl/', categorie: 'Hoveniers' },
  { naam: 'Van Losser', website: 'https://www.vanlosser.nl/', categorie: 'Installatie' },
  { naam: 'Pouw Rijssen', website: 'https://www.pouw.nl/', categorie: 'Bouw' },
];

export default function BedrijvenPage() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<string>('Alle');

  const categories = ['Alle', ...Array.from(new Set(bedrijven.map(b => b.categorie)))];
  const filtered = filter === 'Alle' ? bedrijven : bedrijven.filter(b => b.categorie === filter);

  const toggleSelect = (naam: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(naam)) {
      newSelected.delete(naam);
    } else {
      newSelected.add(naam);
    }
    setSelected(newSelected);
  };

  const getLogoUrl = (website: string) => {
    // Try to get favicon/logo from website
    const domain = new URL(website).hostname;
    return `https://logo.clearbit.com/${domain}`;
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Rijssense Bedrijven</h1>
          <p className="text-slate-600">Selecteer bedrijven voor de quiz ({selected.size} geselecteerd)</p>
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Company grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((bedrijf) => (
            <div
              key={bedrijf.naam}
              onClick={() => toggleSelect(bedrijf.naam)}
              className={`bg-white rounded-xl p-4 border-2 cursor-pointer transition-all hover:shadow-lg ${
                selected.has(bedrijf.naam)
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="aspect-video bg-slate-50 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                <img
                  src={getLogoUrl(bedrijf.website)}
                  alt={bedrijf.naam}
                  className="max-w-full max-h-full object-contain p-2"
                  onError={(e) => {
                    // Fallback to first letter if logo fails
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = `<span class="text-4xl font-bold text-slate-300">${bedrijf.naam.charAt(0)}</span>`;
                  }}
                />
              </div>
              <h3 className="font-semibold text-slate-800 text-center text-sm">{bedrijf.naam}</h3>
              <p className="text-xs text-slate-400 text-center mt-1">{bedrijf.categorie}</p>
              {selected.has(bedrijf.naam) && (
                <div className="mt-2 text-center">
                  <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                    Geselecteerd
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Selected summary */}
        {selected.size > 0 && (
          <div className="mt-8 bg-white rounded-xl p-6 border border-slate-200">
            <h2 className="font-semibold text-slate-800 mb-3">Geselecteerde bedrijven ({selected.size})</h2>
            <div className="flex flex-wrap gap-2">
              {Array.from(selected).map(naam => (
                <span
                  key={naam}
                  onClick={() => toggleSelect(naam)}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm cursor-pointer hover:bg-blue-100"
                >
                  {naam}
                  <span className="text-blue-400">x</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <p className="font-medium mb-2">Instructies:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Klik op bedrijven om ze te selecteren voor de quiz</li>
            <li>Logo's worden automatisch opgehaald via Clearbit</li>
            <li>Sommige logo's laden mogelijk niet - die kun je overslaan</li>
            <li>Kies de minst herkenbare bedrijven voor een uitdagende quiz!</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
