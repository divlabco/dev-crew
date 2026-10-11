// Hidden acceptance tests for spec.md. Never shown to the agent under test.
// Usage: node acceptance.mjs <project-dir>  -> prints JSON {passed,total,results}
import { spawn, execSync } from 'node:child_process';
import { mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import net from 'node:net';

const dir = process.argv[2];
const PORT = await new Promise(res => { const s = net.createServer().listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });
const base = `http://127.0.0.1:${PORT}`;
const dbPath = join(mkdtempSync(join(tmpdir(), 'lbx-')), 'acc.db');
const results = [];
const check = (name, ok, note = '') => results.push({ name, ok: !!ok, note: ok ? '' : String(note).slice(0, 200) });

function sh(cmd) {
  try { execSync(cmd, { cwd: dir, stdio: 'pipe', timeout: 600_000, shell: true }); return true; }
  catch (e) { return String(e.stderr || e.message).slice(-300); }
}

let srv;
async function start() {
  srv = spawn('npm', ['start'], { cwd: dir, env: { ...process.env, PORT: String(PORT), DB_PATH: dbPath }, shell: true, stdio: 'ignore' });
  for (let i = 0; i < 60; i++) {
    try { await fetch(base + '/api/links'); return true; } catch { await new Promise(r => setTimeout(r, 500)); }
  }
  return false;
}
function stop() {
  if (!srv) return;
  try { process.platform === 'win32' ? execSync(`taskkill /pid ${srv.pid} /T /F`, { stdio: 'ignore' }) : srv.kill('SIGTERM'); } catch {}
  srv = null;
}
const post = (body, raw) => fetch(base + '/api/links', { method: 'POST', headers: { 'content-type': 'application/json' }, body: raw ?? JSON.stringify(body) });
const j = async r => { try { return await r.json(); } catch { return null; } };

async function run() {
  const inst = sh('npm install'); check('npm install', inst === true, inst);
  const build = sh('npm run build'); check('npm run build', build === true, build);
  const t = sh('npm test'); check('npm test (own tests) passes', t === true, t);
  check('README.md exists', existsSync(join(dir, 'README.md')));
  if (!(await start())) { check('server starts', false, 'no response in 30s'); return; }
  check('server starts', true);

  let r = await post({ url: 'https://example.com/a' }); let b = await j(r);
  check('create auto slug 201', r.status === 201, r.status);
  check('auto slug is 7 alnum', /^[A-Za-z0-9]{7}$/.test(b?.slug), b?.slug);
  check('create body shape', b && b.url === 'https://example.com/a' && b.clicks === 0 && !isNaN(Date.parse(b.createdAt)), JSON.stringify(b));
  check('shortUrl uses Host', b?.shortUrl === `http://127.0.0.1:${PORT}/${b?.slug}`, b?.shortUrl);
  const auto = b?.slug;

  r = await post({ url: 'http://example.org/x?q=1', slug: 'My-Link_1' }); b = await j(r);
  check('custom slug 201', r.status === 201 && b?.slug === 'My-Link_1', r.status);
  r = await post({ url: 'https://e.com', slug: 'My-Link_1' }); b = await j(r);
  check('duplicate slug 409 + error', r.status === 409 && typeof b?.error === 'string', r.status);
  r = await post({ url: 'https://e.com', slug: 'my-link_1' });
  check('slugs case-sensitive', r.status === 201, r.status);

  for (const [name, body] of [
    ['ftp url 400', { url: 'ftp://e.com' }], ['relative url 400', { url: '/foo' }], ['missing url 400', {}],
    ['too-long url 400', { url: 'https://e.com/' + 'a'.repeat(2040) }], ['short slug 400', { url: 'https://e.com', slug: 'ab' }],
    ['bad slug chars 400', { url: 'https://e.com', slug: 'a b/c' }], ['reserved slug api 400', { url: 'https://e.com', slug: 'api' }],
  ]) { r = await post(body); b = await j(r); check(name, r.status === 400 && typeof b?.error === 'string', r.status); }
  r = await post(null, '{not json'); check('invalid json 400', r.status === 400, r.status);

  r = await fetch(`${base}/My-Link_1`, { redirect: 'manual' });
  check('redirect 302 + Location', r.status === 302 && r.headers.get('location') === 'http://example.org/x?q=1', `${r.status} ${r.headers.get('location')}`);
  await fetch(`${base}/My-Link_1`, { redirect: 'manual' });
  r = await fetch(`${base}/api/links/My-Link_1`); b = await j(r);
  check('clicks counted', r.status === 200 && b?.clicks === 2, b?.clicks);
  r = await fetch(`${base}/nope-nope`, { redirect: 'manual' }); check('unknown slug 404', r.status === 404, r.status);
  r = await fetch(`${base}/api/links/nope-nope`); check('get unknown link 404', r.status === 404, r.status);

  r = await fetch(`${base}/api/links`); b = await j(r);
  check('list newest first', Array.isArray(b) && b.length === 3 && b[0].slug === 'my-link_1' && b[2].slug === auto, JSON.stringify(b?.map?.(x => x.slug)));

  r = await fetch(`${base}/api/links/my-link_1`, { method: 'DELETE' }); check('delete 204', r.status === 204, r.status);
  r = await fetch(`${base}/api/links/my-link_1`, { method: 'DELETE' }); check('delete again 404', r.status === 404, r.status);

  const many = await Promise.all(Array.from({ length: 50 }, (_, i) => post({ url: `https://c.com/${i}` }).then(async x => [x.status, (await j(x))?.slug])));
  check('50 concurrent creates distinct', many.every(([s]) => s === 201) && new Set(many.map(m => m[1])).size === 50, many.filter(([s]) => s !== 201).length + ' failed');

  r = await fetch(base + '/'); const html = await r.text();
  check('GET / serves html', r.status === 200 && /<html|<!doctype/i.test(html), r.status);

  stop(); await new Promise(r => setTimeout(r, 1000));
  if (!(await start())) { check('restart', false); return; }
  r = await fetch(`${base}/api/links/My-Link_1`); b = await j(r);
  check('persists across restart', r.status === 200 && b?.clicks === 2, r.status);
}

try { await run(); } catch (e) { check('harness error', false, e.message); }
finally { stop(); }
console.log(JSON.stringify({ passed: results.filter(r => r.ok).length, total: results.length, results }, null, 1));
process.exit(0);
