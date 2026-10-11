// Hidden acceptance tests for large-spec.md. Never shown to the agent under test.
// Usage: node large-acceptance.mjs <project-dir>  -> prints JSON {passed,total,results}
import { spawn, execSync } from 'node:child_process';
import { mkdtempSync, existsSync, readFileSync } from 'node:fs';
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
  try { execSync(cmd, { cwd: dir, stdio: 'pipe', timeout: 900_000, shell: true }); return true; }
  catch (e) { return String(e.stderr || e.message).slice(-300); }
}
let srv;
async function start() {
  srv = spawn('npm start', { cwd: dir, env: { ...process.env, PORT: String(PORT), DB_PATH: dbPath }, shell: true, stdio: 'ignore' });
  for (let i = 0; i < 60; i++) {
    try { await fetch(base + '/api/me'); return true; } catch { await new Promise(r => setTimeout(r, 500)); }
  }
  return false;
}
function stop() {
  if (!srv) return;
  try { process.platform === 'win32' ? execSync(`taskkill /pid ${srv.pid} /T /F`, { stdio: 'ignore' }) : srv.kill('SIGTERM'); } catch {}
  srv = null;
}
async function api(method, path, body, token, extra = {}) {
  const headers = { ...(extra.headers || {}) };
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (token) headers.authorization = 'Bearer ' + token;
  const r = await fetch(base + path, { method, headers, body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body)), redirect: 'manual' });
  const text = await r.text(); let json = null; try { json = JSON.parse(text); } catch {}
  return { s: r.status, b: json, text, h: r.headers };
}
const hasErr = r => typeof r.b?.error === 'string';
const today = new Date().toISOString().slice(0, 10);

async function run() {
  const inst = sh('npm install'); check('npm install', inst === true, inst);
  const build = sh('npm run build'); check('npm run build', build === true, build);
  const t = sh('npm test'); check('npm test (own tests) passes', t === true, t);
  check('README.md exists', existsSync(join(dir, 'README.md')));
  if (!(await start())) { check('server starts', false, 'no response in 30s'); return; }
  check('server starts', true);

  // --- auth
  let r = await api('POST', '/api/auth/register', { email: 'Alice@Example.com', password: 'password1' });
  check('register 201', r.s === 201 && r.b?.token && r.b?.user?.email === 'alice@example.com', `${r.s} ${r.text}`);
  const alice = r.b?.token; const aliceId = r.b?.user?.id;
  r = await api('POST', '/api/auth/register', { email: 'alice@example.com', password: 'password1' });
  check('register duplicate 409', r.s === 409 && hasErr(r), r.s);
  r = await api('POST', '/api/auth/register', { email: 'x@y.z', password: 'short' });
  check('register short password 400', r.s === 400 && hasErr(r), r.s);
  r = await api('POST', '/api/auth/register', { email: 'nope', password: 'password1' });
  check('register bad email 400', r.s === 400, r.s);
  r = await api('POST', '/api/auth/register', '{bad');
  check('invalid json 400', r.s === 400, r.s);
  r = await api('POST', '/api/auth/login', { email: 'ALICE@example.com', password: 'password1' });
  check('login case-insensitive 200', r.s === 200 && r.b?.token, r.s);
  r = await api('POST', '/api/auth/login', { email: 'alice@example.com', password: 'wrongpass' });
  check('login wrong password 401', r.s === 401 && hasErr(r), r.s);
  r = await api('GET', '/api/me', undefined, alice);
  check('me 200', r.s === 200 && r.b?.email === 'alice@example.com', r.s);
  r = await api('GET', '/api/me');
  check('me no token 401', r.s === 401 && hasErr(r), r.s);
  r = await api('GET', '/api/me', undefined, 'garbage');
  check('me bad token 401', r.s === 401, r.s);
  const bob = (await api('POST', '/api/auth/register', { email: 'bob@example.com', password: 'password2' })).b?.token;
  const bobId = (await api('GET', '/api/me', undefined, bob)).b?.id;
  const carol = (await api('POST', '/api/auth/register', { email: 'carol@example.com', password: 'password3' })).b?.token;
  const carolId = (await api('GET', '/api/me', undefined, carol)).b?.id;

  // passwords hashed
  try {
    const { DatabaseSync } = await import('node:sqlite');
    const db = new DatabaseSync(dbPath, { readOnly: true });
    const dump = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()
      .map(t => JSON.stringify(db.prepare(`SELECT * FROM "${t.name}"`).all())).join('');
    db.close();
    check('passwords not stored in plain text', !dump.includes('password1') && !dump.includes('password2'));
  } catch (e) { check('passwords not stored in plain text', false, e.message); }

  // --- teams
  r = await api('POST', '/api/teams', { name: 'Growth' }, alice);
  check('create team 201 owner', r.s === 201 && r.b?.role === 'owner' && Number.isInteger(r.b?.id), r.text);
  const team = r.b?.id;
  r = await api('POST', '/api/teams', { name: '' }, alice); check('team empty name 400', r.s === 400, r.s);
  r = await api('POST', '/api/teams', { name: 'x' }); check('team no auth 401', r.s === 401, r.s);
  r = await api('GET', '/api/teams', undefined, alice);
  check('list my teams', r.s === 200 && Array.isArray(r.b) && r.b.length === 1 && r.b[0].name === 'Growth', r.text);
  r = await api('GET', `/api/teams/${team}/members`, undefined, bob); check('members non-member 403', r.s === 403, r.s);
  r = await api('POST', `/api/teams/${team}/members`, { email: 'bob@example.com', role: 'member' }, alice);
  check('add member 201', r.s === 201 && r.b?.role === 'member' && r.b?.userId === bobId, r.text);
  r = await api('POST', `/api/teams/${team}/members`, { email: 'bob@example.com', role: 'member' }, alice);
  check('add member twice 409', r.s === 409, r.s);
  r = await api('POST', `/api/teams/${team}/members`, { email: 'ghost@example.com', role: 'member' }, alice);
  check('add unknown email 404', r.s === 404, r.s);
  r = await api('POST', `/api/teams/${team}/members`, { email: 'carol@example.com', role: 'god' }, alice);
  check('add bad role 400', r.s === 400, r.s);
  r = await api('POST', `/api/teams/${team}/members`, { email: 'carol@example.com', role: 'member' }, bob);
  check('member cannot add 403', r.s === 403, r.s);
  r = await api('GET', `/api/teams/${team}/members`, undefined, bob);
  check('members list', r.s === 200 && r.b?.length === 2 && r.b.some(m => m.role === 'owner' && m.email === 'alice@example.com'), r.text);
  r = await api('DELETE', `/api/teams/${team}/members/${aliceId}`, undefined, alice);
  check('owner cannot be removed 400', r.s === 400, r.s);

  // --- links
  const L = (body, tok = alice, tm = team) => api('POST', `/api/teams/${tm}/links`, body, tok);
  r = await L({ url: 'https://example.com/a', tags: ['b', 'a', 'b'] });
  check('create link 201', r.s === 201, r.text);
  check('auto slug 7 alnum', /^[A-Za-z0-9]{7}$/.test(r.b?.slug), r.b?.slug);
  check('link shape', r.b && r.b.teamId === team && r.b.createdBy === aliceId && r.b.clicks === 0 && r.b.expiresAt === null && !isNaN(Date.parse(r.b.createdAt)), r.text);
  check('tags dedup sorted', JSON.stringify(r.b?.tags) === '["a","b"]', JSON.stringify(r.b?.tags));
  check('shortUrl uses Host', r.b?.shortUrl === `http://127.0.0.1:${PORT}/${r.b?.slug}`, r.b?.shortUrl);
  r = await L({ url: 'https://news.example.org/x?q=1', slug: 'Promo_1', tags: ['promo'] }, bob);
  check('member creates custom slug', r.s === 201 && r.b?.slug === 'Promo_1', r.s);
  r = await L({ url: 'https://e.com', slug: 'Promo_1' }); check('dup slug 409', r.s === 409 && hasErr(r), r.s);
  r = await L({ url: 'https://e.com', slug: 'promo_1' }); check('slug case-sensitive', r.s === 201, r.s);
  for (const [name, body] of [
    ['ftp url 400', { url: 'ftp://e.com' }], ['long url 400', { url: 'https://e.com/' + 'a'.repeat(2040) }],
    ['bad slug 400', { url: 'https://e.com', slug: 'a b' }], ['reserved slug 400', { url: 'https://e.com', slug: 'assets' }],
    ['bad tag 400', { url: 'https://e.com', tags: ['Bad Tag'] }], ['too many tags 400', { url: 'https://e.com', tags: Array.from({ length: 11 }, (_, i) => 't' + i) }],
    ['past expiry 400', { url: 'https://e.com', expiresAt: '2001-01-01T00:00:00Z' }],
  ]) { r = await L(body); check(name, r.s === 400 && hasErr(r), r.s); }
  r = await L({ url: 'https://e.com' }, carol); check('non-member create 403', r.s === 403, r.s);

  // list / search / paging
  for (let i = 0; i < 4; i++) await L({ url: `https://docs.example.net/page${i}`, tags: ['docs'] });
  r = await api('GET', `/api/teams/${team}/links`, undefined, alice);
  check('list items+total', r.s === 200 && r.b?.total === 7 && r.b?.items?.length === 7, r.text?.slice(0, 120));
  check('list newest first', r.b?.items?.[0]?.url === 'https://docs.example.net/page3', r.b?.items?.[0]?.url);
  r = await api('GET', `/api/teams/${team}/links?q=DOCS.example`, undefined, alice);
  check('q case-insensitive substring', r.b?.total === 4, r.b?.total);
  r = await api('GET', `/api/teams/${team}/links?q=promo`, undefined, alice);
  check('q matches slug', r.b?.total === 2, r.b?.total);
  r = await api('GET', `/api/teams/${team}/links?tag=promo`, undefined, alice);
  check('tag filter', r.b?.total === 1 && r.b.items[0].slug === 'Promo_1', r.b?.total);
  r = await api('GET', `/api/teams/${team}/links?limit=2&offset=1`, undefined, alice);
  check('paging', r.b?.items?.length === 2 && r.b.total === 7 && r.b.items[0].url === 'https://docs.example.net/page2', JSON.stringify(r.b?.items?.map(i => i.url)));
  r = await api('GET', `/api/teams/${team}/links?limit=1000`, undefined, alice);
  check('limit capped at 100 (no error)', r.s === 200 && r.b?.items?.length === 7, r.s);
  r = await api('GET', `/api/teams/${team}/links`, undefined, carol); check('list non-member 403', r.s === 403, r.s);

  // get / patch / delete
  r = await api('GET', '/api/links/Promo_1', undefined, alice); check('get link 200', r.s === 200 && r.b?.slug === 'Promo_1', r.s);
  r = await api('GET', '/api/links/Promo_1', undefined, carol); check('get link non-member 403', r.s === 403, r.s);
  r = await api('GET', '/api/links/zzzzzz', undefined, alice); check('get unknown link 404', r.s === 404, r.s);
  const future = new Date(Date.now() + 86400e3).toISOString();
  r = await api('PATCH', '/api/links/Promo_1', { tags: ['promo', 'q3'], expiresAt: future }, alice);
  check('patch 200', r.s === 200 && JSON.stringify(r.b?.tags) === '["promo","q3"]' && Date.parse(r.b?.expiresAt) === Date.parse(future), r.text);
  r = await api('PATCH', '/api/links/Promo_1', { expiresAt: null }, alice); check('patch clears expiry', r.s === 200 && r.b?.expiresAt === null, r.text);
  r = await api('PATCH', '/api/links/Promo_1', { url: 'javascript:alert(1)' }, alice); check('patch bad url 400', r.s === 400, r.s);
  r = await api('PATCH', '/api/links/Promo_1', { url: 'https://x.com' }, carol); check('patch non-member 403', r.s === 403, r.s);
  r = await api('DELETE', '/api/links/promo_1', undefined, bob); check('member cannot delete others 403', r.s === 403, r.s);
  r = await api('DELETE', '/api/links/Promo_1', undefined, bob); check('creator deletes own 204', r.s === 204, r.s);
  r = await api('DELETE', '/api/links/promo_1', undefined, alice); check('owner deletes 204', r.s === 204, r.s);
  r = await api('DELETE', '/api/links/promo_1', undefined, alice); check('delete again 404', r.s === 404, r.s);

  // redirects + stats
  const s1 = (await L({ url: 'https://target.example/land', slug: 'track' })).b?.slug;
  r = await api('GET', '/track'); check('redirect 302', r.s === 302 && r.h.get('location') === 'https://target.example/land', `${r.s} ${r.h.get('location')}`);
  await api('GET', '/track', undefined, undefined, { headers: { referer: 'https://twitter.com/post/1' } });
  await api('GET', '/track', undefined, undefined, { headers: { referer: 'https://twitter.com/post/2' } });
  await api('GET', '/track', undefined, undefined, { headers: { referer: 'https://news.ycombinator.com/item' } });
  r = await api('GET', '/nope-nope'); check('redirect unknown 404', r.s === 404, r.s);
  r = await api('GET', `/api/links/${s1}/stats`, undefined, bob);
  check('stats total', r.s === 200 && r.b?.total === 4, r.text);
  check('stats byDay 7 zero-filled ending today', Array.isArray(r.b?.byDay) && r.b.byDay.length === 7 && r.b.byDay[6].date === today && r.b.byDay[6].count === 4 && r.b.byDay[0].count === 0, JSON.stringify(r.b?.byDay));
  check('stats topReferrers', JSON.stringify(r.b?.topReferrers) === JSON.stringify([{ referrer: 'twitter.com', count: 2 }, { referrer: 'direct', count: 1 }, { referrer: 'news.ycombinator.com', count: 1 }])
    || JSON.stringify(r.b?.topReferrers) === JSON.stringify([{ referrer: 'twitter.com', count: 2 }, { referrer: 'news.ycombinator.com', count: 1 }, { referrer: 'direct', count: 1 }]), JSON.stringify(r.b?.topReferrers));
  r = await api('GET', `/api/links/${s1}`, undefined, alice); check('clicks counted on link', r.b?.clicks === 4, r.b?.clicks);
  r = await api('GET', `/api/links/${s1}/stats`, undefined, carol); check('stats non-member 403', r.s === 403, r.s);
  // expiry: set to 2s ahead, wait
  await api('PATCH', `/api/links/${s1}`, { expiresAt: new Date(Date.now() + 1500).toISOString() }, alice);
  await new Promise(res => setTimeout(res, 2200));
  r = await api('GET', '/track'); check('expired 410', r.s === 410, r.s);
  r = await api('GET', `/api/links/${s1}/stats`, undefined, alice); check('expired click not recorded', r.b?.total === 4, r.b?.total);

  // csv
  await L({ url: 'https://e.com/a,b"c', slug: 'csvq' });
  r = await fetch(`${base}/api/teams/${team}/links.csv`, { headers: { authorization: 'Bearer ' + alice } });
  const csv = await r.text();
  check('csv content-type', r.status === 200 && /text\/csv/.test(r.headers.get('content-type') || ''), r.headers.get('content-type'));
  check('csv header + quoting', csv.split(/\r?\n/)[0] === 'slug,url,clicks,createdAt' && csv.includes('csvq,"https://e.com/a,b""c",0,'), csv.slice(0, 160));

  // members: removal rules
  r = await api('DELETE', `/api/teams/${team}/members/${bobId}`, undefined, bob); check('member removes self 204', r.s === 204, r.s);
  r = await api('GET', `/api/teams/${team}/links`, undefined, bob); check('removed member loses access 403', r.s === 403, r.s);

  // rate limit (carol in her own team)
  const cteam = (await api('POST', '/api/teams', { name: 'Carol' }, carol)).b?.id;
  const rl = [];
  for (let i = 0; i < 31; i++) rl.push((await L({ url: `https://rl.example/${i}` }, carol, cteam)));
  const last = rl[30];
  check('30 creates allowed', rl.slice(0, 30).every(x => x.s === 201), rl.slice(0, 30).filter(x => x.s !== 201).length + ' rejected');
  check('31st is 429 + Retry-After', last.s === 429 && Number(last.h.get('retry-after')) >= 1 && hasErr(last), `${last.s} ${last.h.get('retry-after')}`);

  // concurrency: 50 different users
  const toks = await Promise.all(Array.from({ length: 50 }, (_, i) => api('POST', '/api/auth/register', { email: `u${i}@load.test`, password: 'password9' }).then(x => x.b?.token)));
  const teams = await Promise.all(toks.map((tk, i) => api('POST', '/api/teams', { name: 'T' + i }, tk).then(x => x.b?.id)));
  const many = await Promise.all(toks.map((tk, i) => L({ url: `https://c.com/${i}` }, tk, teams[i])));
  check('50 concurrent creates distinct', many.every(x => x.s === 201) && new Set(many.map(x => x.b?.slug)).size === 50, many.filter(x => x.s !== 201).length + ' failed');

  r = await fetch(base + '/'); const html = await r.text();
  check('GET / serves html', r.status === 200 && /<html|<!doctype/i.test(html), r.status);

  // restart persistence
  stop(); await new Promise(res => setTimeout(res, 1000));
  if (!(await start())) { check('restart', false); return; }
  r = await api('GET', '/api/me', undefined, alice); check('token valid after restart', r.s === 200, r.s);
  r = await api('GET', `/api/teams/${team}/links`, undefined, alice); check('links persist after restart', r.s === 200 && r.b?.total >= 6, r.b?.total);
}

try { await run(); } catch (e) { check('harness error', false, e.stack); }
finally { stop(); }
console.log(JSON.stringify({ passed: results.filter(r => r.ok).length, total: results.length, results }, null, 1));
process.exit(0);
