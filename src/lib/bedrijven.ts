export interface Bedrijf {
  naam: string;
  website: string;
  categorie: string;
  logo?: string;
}

// Rijssense bedrijven voor logo quiz
export const BEDRIJVEN: Bedrijf[] = [
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
