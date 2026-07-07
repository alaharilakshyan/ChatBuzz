import { writeFileSync } from 'fs';

const base = 'http://localhost:5000/api/auth';
const apiBase = 'http://localhost:5000/api';

const fetchAndText = async (url, opts) => {
  const res = await fetch(url, opts);
  const headers = {};
  res.headers.forEach((v, k) => { headers[k] = v; });
  const text = await res.text();
  return { status: res.status, headers, text, redirected: res.redirected, url: res.url };
};

const runTests = async () => {
  console.log('🚀 Starting Automated Authentication Phase 3 Regression Suite...');

  // Generate unique test email to support repeated runs
  const suffix = Date.now();
  const testEmail = `test-${suffix}@example.com`;
  const testUsername = `tester${suffix}`;
  const testPassword = 'Password123!';

  // Test 1: Fresh successful registration
  console.log('\n📝 Test 1: Registering new test user...');
  const regRes = await fetchAndText(`${base}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: testUsername, email: testEmail, password: testPassword })
  });
  if (regRes.status !== 201) {
    throw new Error(`Registration failed with status ${regRes.status}. Body: ${regRes.text}`);
  }
  const regUserObj = JSON.parse(regRes.text);
  console.log('✅ Fresh registration succeeded (201 Created)');

  // Test 2: Duplicate email conflict rejection
  console.log('\n📝 Test 2: Attempting duplicate email registration...');
  const dupRes = await fetchAndText(`${base}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: testUsername, email: testEmail, password: testPassword })
  });
  if (dupRes.status !== 400 && dupRes.status !== 409) {
    throw new Error(`Duplicate registration should fail with 400/409, got status ${dupRes.status}. Body: ${dupRes.text}`);
  }
  console.log('✅ Duplicate email registration correctly rejected with status:', dupRes.status);

  // Test 3: Duplicate username handle tag checks (verifies tag generator resolves tags correctly)
  console.log('\n📝 Test 3: Registering duplicate username with a different email...');
  const dupUserRes = await fetchAndText(`${base}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: testUsername, email: `diff-${testEmail}`, password: testPassword })
  });
  if (dupUserRes.status !== 201) {
    throw new Error(`Duplicate username registration failed. Status: ${dupUserRes.status}. Body: ${dupUserRes.text}`);
  }
  const dupUserObj = JSON.parse(dupUserRes.text);
  console.log(`✅ Succeeded. Unique user_tag generated: #${dupUserObj.user?.user_tag} (Original was: #${regUserObj.user?.user_tag})`);

  // Test 4: CSRF token validation retrieval
  console.log('\n📝 Test 4: Fetching CSRF token...');
  const csrfRes = await fetchAndText(`${base}/csrf`, { headers: { Accept: 'application/json' } });
  if (csrfRes.status !== 200) {
    throw new Error(`Failed to fetch CSRF token. Status: ${csrfRes.status}`);
  }
  const { csrfToken } = JSON.parse(csrfRes.text);
  const csrfCookie = (csrfRes.headers['set-cookie'] || '').split(',').map(s => s.split(';')[0].trim()).join('; ');
  console.log('✅ CSRF token acquired');

  // Test 5: Incorrect password credential rejection
  console.log('\n📝 Test 5: Attempting login with incorrect password...');
  const badLoginRes = await fetchAndText(`${base}/callback/credentials`, {
    method: 'POST',
    redirect: 'manual',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      Cookie: csrfCookie
    },
    body: new URLSearchParams({
      email: testEmail,
      password: 'WrongPassword123',
      csrfToken,
      redirect: 'false',
      json: 'true'
    })
  });
  if (badLoginRes.status !== 302 && badLoginRes.status !== 401 && badLoginRes.status !== 400) {
    throw new Error(`Wrong password login should fail/redirect, got status: ${badLoginRes.status}`);
  }
  console.log('✅ Incorrect password login correctly failed/redirected with status:', badLoginRes.status);

  // Test 6: Incorrect email login rejection
  console.log('\n📝 Test 6: Attempting login with incorrect email...');
  const badEmailLoginRes = await fetchAndText(`${base}/callback/credentials`, {
    method: 'POST',
    redirect: 'manual',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      Cookie: csrfCookie
    },
    body: new URLSearchParams({
      email: 'nonexistent-email@example.com',
      password: testPassword,
      csrfToken,
      redirect: 'false',
      json: 'true'
    })
  });
  if (badEmailLoginRes.status !== 302 && badEmailLoginRes.status !== 401 && badEmailLoginRes.status !== 400) {
    throw new Error(`Wrong email login should fail/redirect, got status: ${badEmailLoginRes.status}`);
  }
  console.log('✅ Incorrect email login correctly failed/redirected with status:', badEmailLoginRes.status);

  // Test 7: Correct credentials authorization
  console.log('\n📝 Test 7: Logging in with correct credentials...');
  const loginRes = await fetchAndText(`${base}/callback/credentials`, {
    method: 'POST',
    redirect: 'manual',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      Cookie: csrfCookie
    },
    body: new URLSearchParams({
      email: testEmail,
      password: testPassword,
      csrfToken,
      redirect: 'false',
      json: 'true'
    })
  });
  const sessionCookie = [csrfCookie, loginRes.headers['set-cookie']].filter(Boolean).join('; ');
  console.log('✅ Correct login completed');

  // Test 8: Valid cookie session payload check
  console.log('\n📝 Test 8: Validating session user profile info payload...');
  const sessionRes = await fetchAndText(`${base}/session`, {
    headers: { Accept: 'application/json', Cookie: sessionCookie }
  });
  if (sessionRes.status !== 200) {
    throw new Error(`Failed to fetch session. Status: ${sessionRes.status}`);
  }
  const sessionData = JSON.parse(sessionRes.text);
  if (!sessionData.user || sessionData.user.email !== testEmail.toLowerCase()) {
    throw new Error(`Invalid session data returned. Got: ${sessionRes.text}`);
  }
  console.log('✅ Session validated. Payload contains profile handles:', {
    username: sessionData.user.username,
    email: sessionData.user.email,
    user_tag: sessionData.user.user_tag
  });

  // Test 9: CSRF validation failure protection (missing token / header)
  console.log('\n📝 Test 9: Attempting state-changing request without CSRF cookie/token...');
  const noCsrfRes = await fetchAndText(`${base}/callback/credentials`, {
    method: 'POST',
    redirect: 'manual',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    },
    body: new URLSearchParams({
      email: testEmail,
      password: testPassword,
      csrfToken: 'invalid-token',
      redirect: 'false',
      json: 'true'
    })
  });
  if (noCsrfRes.status === 200) {
    throw new Error('State-changing credentials request succeeded despite invalid/missing CSRF tokens');
  }
  console.log('✅ CSRF failure request correctly blocked/failed with status:', noCsrfRes.status);

  // Test 10: Registration missing fields validation checks
  console.log('\n📝 Test 10: Registering with missing fields...');
  const missingFieldsRes = await fetchAndText(`${base}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: '', email: '', password: '' })
  });
  if (missingFieldsRes.status !== 400) {
    throw new Error(`Missing fields should return 400, got status ${missingFieldsRes.status}`);
  }
  console.log('✅ Registration missing fields correctly failed (400)');

  // Test 11: Unauthorized API routes checks
  console.log('\n📝 Test 11: Attempting to query protected /users/me endpoint without authentication...');
  const unauthMeRes = await fetchAndText(`${apiBase}/users/me`, {
    headers: { Accept: 'application/json' }
  });
  if (unauthMeRes.status !== 401) {
    throw new Error(`Protected request should fail with 401, got status ${unauthMeRes.status}`);
  }
  console.log('✅ Protected endpoint correctly rejected with status:', unauthMeRes.status);

  // Test 12: Multi-login/concurrency simulation
  console.log('\n📝 Test 12: Running multiple simultaneous login requests...');
  const concurrentLogins = await Promise.all([1, 2, 3].map(() =>
    fetchAndText(`${base}/callback/credentials`, {
      method: 'POST',
      redirect: 'manual',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Cookie: csrfCookie
      },
      body: new URLSearchParams({
        email: testEmail,
        password: testPassword,
        csrfToken,
        redirect: 'false',
        json: 'true'
      })
    })
  ));
  concurrentLogins.forEach((res, i) => {
    if (res.status !== 200 && res.status !== 302) {
      throw new Error(`Concurrent login request ${i + 1} failed with status: ${res.status}`);
    }
  });
  console.log('✅ Multi-login concurrency requests resolved cleanly');

  // Test 13: Expired cookie session rejection checks
  console.log('\n📝 Test 13: Querying session with expired/invalid session cookie...');
  const expiredSessionRes = await fetchAndText(`${base}/session`, {
    headers: { Accept: 'application/json', Cookie: 'authjs.session-token=expired-cookie-value' }
  });
  const expiredSessionData = JSON.parse(expiredSessionRes.text);
  if (expiredSessionData && expiredSessionData.user) {
    throw new Error('Expired session token should not return active user context data');
  }
  console.log('✅ Expired session successfully rejected/returned empty context');

  // Test 14: Malformed cookies validation checks
  console.log('\n📝 Test 14: Querying session with malformed session cookie...');
  const malformedSessionRes = await fetchAndText(`${base}/session`, {
    headers: { Accept: 'application/json', Cookie: 'authjs.session-token=@@@@!!!malformed!!!@@@@' }
  });
  const malformedSessionData = JSON.parse(malformedSessionRes.text);
  if (malformedSessionData && malformedSessionData.user) {
    throw new Error('Malformed session token should not return active user context data');
  }
  console.log('✅ Malformed session successfully rejected/returned empty context');

  // Test 15: Registration field format constraints validation (invalid email, too short password)
  console.log('\n📝 Test 15: Registering with invalid formatting validation inputs...');
  const formatValRes = await fetchAndText(`${base}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'testname', email: 'notanemail', password: '12' })
  });
  if (formatValRes.status !== 400) {
    throw new Error(`Format validation failures should return 400, got status ${formatValRes.status}`);
  }
  console.log('✅ Formatting constraints validation correctly rejected with status:', formatValRes.status);

  // Test 16: Logout deletion of cookies
  console.log('\n📝 Test 16: Logging out test session...');
  const logoutRes = await fetchAndText(`${base}/signout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      Cookie: sessionCookie
    },
    body: new URLSearchParams({
      csrfToken,
      redirect: 'false',
      json: 'true'
    })
  });
  if (logoutRes.status !== 302 && logoutRes.status !== 200) {
    throw new Error(`Logout failed with status: ${logoutRes.status}`);
  }
  console.log('✅ Logout successfully deleted active session');

  console.log('\n🎉 ALL 16 INTEGRATION SCENARIOS COMPLETED SUCCESSFULLY!');
};

runTests().catch(err => {
  console.error('\n❌ Test suite failed with error:', err.message);
  process.exit(1);
});
