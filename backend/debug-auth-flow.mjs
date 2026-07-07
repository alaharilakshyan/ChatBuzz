import { writeFileSync } from 'fs';

const base = 'http://localhost:8081/api/auth';

const fetchAndText = async (url, opts) => {
  const res = await fetch(url, opts);
  const headers = {};
  res.headers.forEach((v, k) => { headers[k] = v; });
  const text = await res.text();
  return { status: res.status, headers, text, redirected: res.redirected, url: res.url };
};

const main = async () => {
  console.log('--- GET /csrf via 8081 proxy ---');
  const csrfRes = await fetchAndText(`${base}/csrf`, { headers: { Accept: 'application/json' } });
  console.log('status', csrfRes.status);
  console.log('headers', csrfRes.headers);
  console.log('body', csrfRes.text);
  const cookie = (csrfRes.headers['set-cookie'] || '').split(',').map(s => s.split(';')[0].trim()).join('; ');
  console.log('cookie', cookie);

  const token = JSON.parse(csrfRes.text).csrfToken;
  const form = new URLSearchParams({ email: 'debug-login@example.com', password: 'Password123!', csrfToken: token, redirect: 'false', json: 'true' });

  console.log('--- POST /callback/credentials via 8081 proxy ---');
  const loginRes = await fetchAndText(`${base}/callback/credentials`, {
    method: 'POST',
    redirect: 'manual',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      Cookie: cookie
    },
    body: form
  });
  console.log('status', loginRes.status);
  console.log('headers', loginRes.headers);
  console.log('body', loginRes.text.slice(0,400));
  console.log('redirected', loginRes.redirected, 'url', loginRes.url);

  const loginCookie = [cookie, loginRes.headers['set-cookie']].filter(Boolean).join('; ');
  console.log('loginCookie combined', loginCookie);

  console.log('--- GET /auth/session via 8081 proxy ---');
  const sessionRes = await fetchAndText(`${base}/session`, {
    headers: {
      Accept: 'application/json',
      Cookie: loginCookie
    }
  });
  console.log('status', sessionRes.status);
  console.log('headers', sessionRes.headers);
  console.log('body', sessionRes.text);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
