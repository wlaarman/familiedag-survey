// Update streetview photos for a single entry and re-upload to Blob + DB
// Usage: node --env-file=.env.local scripts/update-single-streetview.mjs <id>
// Example: node --env-file=.env.local scripts/update-single-streetview.mjs 9

import { sql } from '@vercel/postgres';
import { put } from '@vercel/blob';
import https from 'https';
import fs from 'fs';
import path from 'path';

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
if (!API_KEY) { console.error('GOOGLE_MAPS_API_KEY missing'); process.exit(1); }

const targetId = parseInt(process.argv[2]);
if (!targetId) { console.error('Usage: node update-single-streetview.mjs <id>'); process.exit(1); }

const overzicht = JSON.parse(fs.readFileSync('streetview-photos/_overzicht.json', 'utf-8'));
const entry = overzicht.find(e => e.id === targetId);
if (!entry) { console.error(`Entry id=${targetId} niet gevonden in _overzicht.json`); process.exit(1); }

console.log(`\nUpdating streetview for: ${entry.name} (${entry.address})\n`);

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

function bearing(lat1, lon1, lat2, lon2) {
  const toRad = d => d * Math.PI / 180;
  const toDeg = r => r * 180 / Math.PI;
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
            Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function stripHouseNumber(address) {
  const parts = address.split(',');
  const street = parts[0].replace(/\s+\d+\w*\s*$/, '').trim();
  return [street, ...parts.slice(1)].join(',');
}

async function uploadPhoto(filePath, prefix, filename) {
  const fileBuffer = fs.readFileSync(filePath);
  const blobFilename = `streetview/${prefix}${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const blob = await put(blobFilename, fileBuffer, { access: 'public', contentType: 'image/jpeg' });
  return blob.url;
}

const addr = entry.address;
const filename = entry.filename;

// 1. Download normal variant
console.log('📸 Downloading normal variant...');
const normalPath = path.join('streetview-photos', filename);
const normalUrl = `https://maps.googleapis.com/maps/api/streetview?size=800x500&location=${encodeURIComponent(addr)}&key=${API_KEY}`;
await download(normalUrl, normalPath);
console.log(`   ✅ ${normalPath}`);

// 2. Download hard variant (no house number, fov=100)
console.log('📸 Downloading hard variant...');
const hardDir = 'streetview-photos/hard';
if (!fs.existsSync(hardDir)) fs.mkdirSync(hardDir, { recursive: true });
const hardPath = path.join(hardDir, filename);
const addrStreet = stripHouseNumber(addr);
const hardUrl = `https://maps.googleapis.com/maps/api/streetview?size=800x500&location=${encodeURIComponent(addrStreet)}&fov=100&key=${API_KEY}`;
await download(hardUrl, hardPath);
console.log(`   ✅ ${hardPath}`);

// 3. Download street variant (90° rotated from house)
console.log('📸 Downloading street variant...');
const streetDir = 'streetview-photos/street';
if (!fs.existsSync(streetDir)) fs.mkdirSync(streetDir, { recursive: true });
const streetPath = path.join(streetDir, filename);

const meta = await fetchJson(`https://maps.googleapis.com/maps/api/streetview/metadata?location=${encodeURIComponent(addr)}&key=${API_KEY}`);
const geo = await fetchJson(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addr)}&key=${API_KEY}`);
const panoLat = meta.location.lat, panoLng = meta.location.lng;
const houseLat = geo.results[0].geometry.location.lat, houseLng = geo.results[0].geometry.location.lng;
const toHouse = bearing(panoLat, panoLng, houseLat, houseLng);
const streetHeading = (toHouse + 90) % 360;

const streetUrl = `https://maps.googleapis.com/maps/api/streetview?size=800x500&location=${encodeURIComponent(addr)}&heading=${streetHeading}&fov=90&key=${API_KEY}`;
await download(streetUrl, streetPath);
console.log(`   ✅ ${streetPath} (heading ${Math.round(streetHeading)}°)`);

// 4. Upload to Blob
console.log('\n📤 Uploading to Vercel Blob...');
const blobNormal = await uploadPhoto(normalPath, '', filename);
const blobHard = await uploadPhoto(hardPath, 'hard-', filename);
const blobStreet = await uploadPhoto(streetPath, 'street-', filename);
console.log(`   ✅ Normal: ${blobNormal}`);
console.log(`   ✅ Hard: ${blobHard}`);
console.log(`   ✅ Street: ${blobStreet}`);

// 5. Update DB
console.log('\n💾 Updating database...');
const existing = await sql`SELECT id FROM streetview_quiz WHERE response_id = ${targetId}`;
if (existing.rows.length > 0) {
  await sql`UPDATE streetview_quiz SET blob_url = ${blobNormal}, blob_url_hard = ${blobHard}, blob_url_street = ${blobStreet} WHERE response_id = ${targetId}`;
  console.log(`   ✅ Record bijgewerkt (response_id=${targetId})`);
} else {
  // Try matching by names
  const byName = await sql`SELECT id FROM streetview_quiz WHERE names ILIKE ${`%${entry.name.split('&')[0].trim().split(' ')[0]}%`}`;
  if (byName.rows.length > 0) {
    await sql`UPDATE streetview_quiz SET blob_url = ${blobNormal}, blob_url_hard = ${blobHard}, blob_url_street = ${blobStreet} WHERE id = ${byName.rows[0].id}`;
    console.log(`   ✅ Record bijgewerkt (id=${byName.rows[0].id}, matched by name)`);
  } else {
    console.log('   ⚠️  Geen bestaand DB record gevonden - run upload-streetview-to-blob.mjs om alles te uploaden');
  }
}

console.log('\n✅ Klaar!');
process.exit(0);
