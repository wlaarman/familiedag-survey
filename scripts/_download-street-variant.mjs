import https from 'https';
import fs from 'fs';
import path from 'path';

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
if (!API_KEY) { console.error('GOOGLE_MAPS_API_KEY missing'); process.exit(1); }

const overzicht = JSON.parse(fs.readFileSync('streetview-photos/_overzicht.json', 'utf-8'));

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
    }).on('error', reject);
  });
}

function download(url, fp) {
  return new Promise((resolve, reject) => {
    const doIt = (u) => {
      https.get(u, (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) { doIt(res.headers.location); return; }
        const stream = fs.createWriteStream(fp);
        res.pipe(stream);
        stream.on('finish', () => { stream.close(); resolve(); });
      }).on('error', reject);
    };
    doIt(url);
  });
}

// Calculate bearing from point A to point B (in degrees)
function bearing(lat1, lon1, lat2, lon2) {
  const toRad = d => d * Math.PI / 180;
  const toDeg = r => r * 180 / Math.PI;
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
            Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

async function main() {
  const streetDir = 'streetview-photos/street';
  if (!fs.existsSync(streetDir)) fs.mkdirSync(streetDir, { recursive: true });

  console.log(`Downloading ${overzicht.length} STREET variant photos (kijkrichting straat)...\n`);

  for (const entry of overzicht) {
    const fp = path.join(streetDir, entry.filename);
    const addr = entry.address;

    // 1. Get panorama location
    const meta = await fetchJson(
      `https://maps.googleapis.com/maps/api/streetview/metadata?location=${encodeURIComponent(addr)}&key=${API_KEY}`
    );
    if (meta.status !== 'OK') {
      console.log(`  ❌ ${entry.name} - geen streetview`);
      continue;
    }
    const panoLat = meta.location.lat;
    const panoLng = meta.location.lng;

    // 2. Geocode the address to get house coordinates
    const geo = await fetchJson(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addr)}&key=${API_KEY}`
    );
    if (geo.status !== 'OK' || !geo.results.length) {
      console.log(`  ❌ ${entry.name} - geocoding mislukt`);
      continue;
    }
    const houseLat = geo.results[0].geometry.location.lat;
    const houseLng = geo.results[0].geometry.location.lng;

    // 3. Calculate heading: pano→house, then rotate 90° to look along the street
    const toHouse = bearing(panoLat, panoLng, houseLat, houseLng);
    const streetHeading = (toHouse + 90) % 360;

    console.log(`  "${addr}" → heading ${Math.round(toHouse)}° naar huis, ${Math.round(streetHeading)}° langs straat`);

    // 4. Download with computed heading
    const imageUrl = `https://maps.googleapis.com/maps/api/streetview?size=800x500&location=${encodeURIComponent(addr)}&heading=${streetHeading}&fov=90&key=${API_KEY}`;
    await download(imageUrl, fp);
    console.log(`  📸 ${entry.name}`);
  }

  console.log('\n✅ Klaar!');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
