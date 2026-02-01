'use client';

import { useState } from 'react';

interface Bedrijf {
  naam: string;
  website: string;
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
  { naam: 'Pouw Rijssen', website: 'https://www.pouw.nl/', categorie: 'Bouw' },
  { naam: 'Ter Harmsel Woninginrichting', website: 'https://www.terharmselwoninginrichting.nl/', categorie: 'Bouw' },

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
  { naam: 'Baan Twente', website: 'https://www.baantwente.nl/', categorie: 'Transport' },
  { naam: 'Pultrum Transport', website: 'https://www.pultrum-rijssen.nl/', categorie: 'Transport' },
  { naam: 'Brinks Transport', website: 'https://www.brinks-transport.nl/', categorie: 'Transport' },
  { naam: 'Ten Brinke Transport', website: 'https://www.tenbrinke.nl/', categorie: 'Transport' },

  // Auto & Campers
  { naam: 'Munsterhuis', website: 'https://www.munsterhuis.nl/', categorie: 'Auto' },
  { naam: 'Autobedrijf Schippers', website: 'https://www.autoschippers.nl/', categorie: 'Auto' },
  { naam: 'Autobedrijf De Haar', website: 'https://www.dehaar.nl/', categorie: 'Auto' },
  { naam: 'Autobedrijf Beltman', website: 'https://www.beltman.nl/', categorie: 'Auto' },
  { naam: 'Knobben Caravans', website: 'https://www.knobbencaravans.nl/', categorie: 'Auto' },
  { naam: 'Averesch Campers', website: 'https://www.averesch.nl/', categorie: 'Auto' },

  // Bakkerijen
  { naam: 'Bakkerij Otten', website: 'https://www.bakkerij-otten.nl/', categorie: 'Bakker' },
  { naam: 'Meinders De Echte Bakker', website: 'https://bakkermeinders.nl/', categorie: 'Bakker' },
  { naam: 'Van Otten Patissier', website: 'https://www.vanotten.nl/', categorie: 'Bakker' },
  { naam: 'Bakkerij Nollen', website: 'https://www.bakkerijnollen.nl/', categorie: 'Bakker' },

  // Slagerijen
  { naam: 'Keurslager Beverdam', website: 'https://beverdam.keurslager.nl/', categorie: 'Slager' },
  { naam: 'Gildeslager Goossen', website: 'https://www.slagerijgoossen.nl/', categorie: 'Slager' },
  { naam: 'Slagerij Beimer', website: 'https://www.beimermeat.nl/', categorie: 'Slager' },
  { naam: 'Huiskes Slagerij', website: 'https://www.huiskesslagerij.nl/', categorie: 'Slager' },

  // Mode & Kleding
  { naam: 'VIF Jeans', website: 'https://vifjeans.nl/', categorie: 'Mode' },
  { naam: 'Sans Mode', website: 'https://www.sans.nl/', categorie: 'Mode' },
  { naam: 'Unique Mode', website: 'https://www.uniquemode.nl/', categorie: 'Mode' },
  { naam: 'Eshuis Mode', website: 'https://www.eshuismode.nl/', categorie: 'Mode' },
  { naam: 'Wessels Mode', website: 'https://www.wesselsmode.nl/', categorie: 'Mode' },
  { naam: 'Voortman Mode', website: 'https://www.voortmanmode.nl/', categorie: 'Mode' },
  { naam: 'Van Dal Mannenmode', website: 'https://www.vdal.nl/', categorie: 'Mode' },
  { naam: 'Koedijk Jan Heedt', website: 'https://www.koedijkjanheedt.nl/', categorie: 'Mode' },
  { naam: 'Koedijk Mode', website: 'https://www.koedijkmode.nl/', categorie: 'Mode' },
  { naam: 'Ten Hove Kindermode', website: 'https://www.tenhovekindermode.nl/', categorie: 'Mode' },
  { naam: 'Het Broekenhuis', website: 'https://www.hetbroekenhuis.nl/', categorie: 'Mode' },
  { naam: 'Magnifique Fashion', website: 'https://www.magnifiquefashion.nl/', categorie: 'Mode' },
  { naam: 'Moda Trends', website: 'https://www.modatrends.nl/', categorie: 'Mode' },
  { naam: 'Jolie Women', website: 'https://www.joliewomen.nl/', categorie: 'Mode' },
  { naam: 'Blush', website: 'https://www.blushrijssen.nl/', categorie: 'Mode' },

  // Schoenen
  { naam: 'Brodshoes', website: 'https://www.brodshoes.nl/', categorie: 'Schoenen' },
  { naam: 'Schuurman Schoenen', website: 'https://www.schuurmanschoenen.nl/', categorie: 'Schoenen' },
  { naam: 'Steenbergen Schoenen', website: 'https://www.steenbergenschoenen.nl/', categorie: 'Schoenen' },
  { naam: 'Ziengs Schoenen', website: 'https://www.ziengs.nl/', categorie: 'Schoenen' },

  // Juweliers
  { naam: 'Juwelier Asbroek', website: 'https://www.juwelierasbroek.nl/', categorie: 'Juwelier' },
  { naam: 'Saffier Juwelier', website: 'https://www.saffierjuwelier.nl/', categorie: 'Juwelier' },

  // Horeca
  { naam: 'Restaurant De Kroon', website: 'https://www.dekroonrijssen.nl/', categorie: 'Horeca' },
  { naam: 'De Markies', website: 'https://www.demarkies.com/', categorie: 'Horeca' },
  { naam: 'Brasserie de Passage', website: 'https://www.brasseriedepassage.nl/', categorie: 'Horeca' },
  { naam: 'Brasserie UIT', website: 'https://www.stadshotelrijssen.nl/', categorie: 'Horeca' },
  { naam: 'Buena Vista', website: 'https://www.buenavistarijssen.nl/', categorie: 'Horeca' },
  { naam: 't Spoorhuys', website: 'https://www.spoorhuys.nl/', categorie: 'Horeca' },

  // Bloemen & Tuin
  { naam: 'Tuincentrum Veeneslagen', website: 'https://www.tuincentrumveeneslagen.nl/', categorie: 'Tuin' },
  { naam: 'Lohuis Bloemen', website: 'https://www.lohuisbloemen.nl/', categorie: 'Bloemen' },
  { naam: 'Ricks Flowers', website: 'https://www.ricksflowers.nl/', categorie: 'Bloemen' },
  { naam: 'Klein Boonschate', website: 'https://www.kleinboonschate.nl/', categorie: 'Hoveniers' },
  { naam: 'Troost Hoveniers', website: 'https://troosthoveniers.nl/', categorie: 'Hoveniers' },

  // Wonen & Inrichting
  { naam: 'Voortman Keukens', website: 'https://www.voortmankeukens.nl/', categorie: 'Wonen' },
  { naam: 'GSM Wonen & Slapen', website: 'https://www.gsmwonen.nl/', categorie: 'Wonen' },
  { naam: 'Ligtenberg Linnen', website: 'https://www.ligtenberglinnen.nl/', categorie: 'Wonen' },
  { naam: 'EVI Verlichting', website: 'https://www.eviverlichting.nl/', categorie: 'Wonen' },
  { naam: 'Van Bekkum Sfeer en Warmte', website: 'https://www.vanbekkum.nl/', categorie: 'Wonen' },
  { naam: 'Hubo Jan Aolbert', website: 'https://www.hubo.nl/', categorie: 'Wonen' },

  // Fietsen & Sport
  { naam: 'Bike Totaal Bloemendal', website: 'https://www.biketotaalbloemendal.nl/', categorie: 'Fietsen' },
  { naam: 'Discus Rosman', website: 'https://www.discusrosman.nl/', categorie: 'Sport' },

  // Kappers
  { naam: 'Veenstra & Veenstra', website: 'https://www.veenstraveenstra.com/', categorie: 'Kapper' },
  { naam: 'Kapsalon Brand', website: 'https://www.kapsalonbrand.nl/', categorie: 'Kapper' },
  { naam: 'Kapsalon Gerda', website: 'https://www.kapsalongerda.nl/', categorie: 'Kapper' },
  { naam: 'Salon Kimm', website: 'https://www.salonkimm.nl/', categorie: 'Kapper' },

  // Speciaalzaken
  { naam: 'Kaaspakhuis Rijssen', website: 'https://www.kaaspakhuis.nl/', categorie: 'Food' },
  { naam: 'Zuivelhoeve Rijssen', website: 'https://www.zuivelhoeve.nl/', categorie: 'Food' },
  { naam: 'Drankenspeciaalzaak HorstHuis', website: 'https://www.horsthuis.nl/', categorie: 'Food' },
  { naam: 'Otter IJs en Chocolade', website: 'https://www.otterijs.nl/', categorie: 'Food' },
  { naam: 'Zoete Droom', website: 'https://www.zoetedroom.nl/', categorie: 'Food' },

  // Drogist & Apotheek
  { naam: 'DA Frans van Garrat', website: 'https://www.dagarrat.nl/', categorie: 'Drogist' },
  { naam: 'Apotheek de Weijerd', website: 'https://www.apotheekdeweijerd.nl/', categorie: 'Apotheek' },
  { naam: 'Rijssense Apotheek', website: 'https://www.rijssenseapotheek.nl/', categorie: 'Apotheek' },

  // Opticiens
  { naam: 'Pearle Opticiens', website: 'https://www.pearle.nl/', categorie: 'Opticien' },
  { naam: 'Bomedo Kuper', website: 'https://www.bomedokuper.nl/', categorie: 'Opticien' },
  { naam: 'Stegeman Hoortechniek', website: 'https://www.stegemanhoortechniek.nl/', categorie: 'Opticien' },

  // Installatie & Techniek
  { naam: 'Van Losser', website: 'https://www.vanlosser.nl/', categorie: 'Installatie' },
  { naam: 'Van Dam Installatiebedrijf', website: 'https://www.vandaminstallatie.nl/', categorie: 'Installatie' },

  // Overige Diensten
  { naam: 'Teunis Groep', website: 'https://www.teunis.nl/', categorie: 'Diensten' },
  { naam: 'Reggeborgh', website: 'https://reggeborgh.nl/', categorie: 'Investering' },
  { naam: 'Otten & Flim', website: 'https://www.otten-flim.nl/', categorie: 'Diensten' },
  { naam: 'Pongers', website: 'https://www.pongers.nl/', categorie: 'Diensten' },
  { naam: 'Notaris Hölscher', website: 'https://www.notarisholscher.nl/', categorie: 'Diensten' },
  { naam: 'Thoma Assurantiën', website: 'https://www.thomagroep.nl/', categorie: 'Diensten' },
  { naam: 'Bandwerk', website: 'https://www.bandwerk.nl/', categorie: 'Diensten' },
  { naam: 'Lucky Feel Good Provider', website: 'https://www.lucky.nl/', categorie: 'Diensten' },

  // Bouwmarkten
  { naam: 'Gamma Rijssen', website: 'https://www.gamma.nl/', categorie: 'Bouwmarkt' },
  { naam: 'Karwei Rijssen', website: 'https://www.karwei.nl/', categorie: 'Bouwmarkt' },
  { naam: 'Welkoop Rijssen', website: 'https://www.welkoop.nl/', categorie: 'Bouwmarkt' },
];

export default function BedrijvenPage() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<string>('Alle');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = ['Alle', ...Array.from(new Set(bedrijven.map(b => b.categorie))).sort()];

  const filtered = bedrijven
    .filter(b => filter === 'Alle' || b.categorie === filter)
    .filter(b => searchTerm === '' || b.naam.toLowerCase().includes(searchTerm.toLowerCase()));

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
    try {
      const domain = new URL(website).hostname;
      // Use Google's favicon service as primary (works for most sites)
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    } catch {
      return null;
    }
  };

  const getClearbitLogo = (website: string) => {
    try {
      const domain = new URL(website).hostname;
      return `https://logo.clearbit.com/${domain}`;
    } catch {
      return null;
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Rijssense Bedrijven</h1>
          <p className="text-slate-600 mb-4">
            {bedrijven.length} bedrijven • {selected.size} geselecteerd
          </p>

          {/* Search */}
          <input
            type="text"
            placeholder="Zoek bedrijf..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 rounded-full border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none w-full max-w-md"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat} {cat !== 'Alle' && `(${bedrijven.filter(b => b.categorie === cat).length})`}
            </button>
          ))}
        </div>

        {/* Company grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map((bedrijf) => (
            <div
              key={bedrijf.naam}
              onClick={() => toggleSelect(bedrijf.naam)}
              className={`bg-white rounded-xl p-3 border-2 cursor-pointer transition-all hover:shadow-lg ${
                selected.has(bedrijf.naam)
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="aspect-square bg-slate-50 rounded-lg mb-2 flex items-center justify-center overflow-hidden relative">
                {/* Try Clearbit logo first (higher quality) */}
                <img
                  src={getClearbitLogo(bedrijf.website) || ''}
                  alt={bedrijf.naam}
                  className="max-w-full max-h-full object-contain p-2 absolute inset-0 m-auto"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                {/* Google favicon as fallback (always works) */}
                <img
                  src={getLogoUrl(bedrijf.website) || ''}
                  alt={bedrijf.naam}
                  className="w-16 h-16 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML += `<span class="text-3xl font-bold text-slate-300">${bedrijf.naam.charAt(0)}</span>`;
                  }}
                />
              </div>
              <h3 className="font-medium text-slate-800 text-center text-xs leading-tight">{bedrijf.naam}</h3>
              <p className="text-xs text-slate-400 text-center mt-0.5">{bedrijf.categorie}</p>
              {selected.has(bedrijf.naam) && (
                <div className="mt-1 text-center">
                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full" />
                </div>
              )}
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-slate-500 py-8">Geen bedrijven gevonden</p>
        )}

        {/* Selected summary */}
        {selected.size > 0 && (
          <div className="mt-8 bg-white rounded-xl p-6 border border-slate-200 sticky bottom-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-slate-800">Geselecteerd ({selected.size})</h2>
              <button
                onClick={() => setSelected(new Set())}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Alles wissen
              </button>
            </div>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {Array.from(selected).map(naam => (
                <span
                  key={naam}
                  onClick={() => toggleSelect(naam)}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs cursor-pointer hover:bg-blue-100"
                >
                  {naam}
                  <span className="text-blue-400">×</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
