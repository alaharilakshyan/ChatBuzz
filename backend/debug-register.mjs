const url = 'http://localhost:8080/api/auth/register';
const body = JSON.stringify({ username: 'debuguser2', email: 'debug-register-20260706@example.com', password: 'Password123!' });

async function run() {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body
  });
  console.log('status', res.status);
  console.log('headers', Object.fromEntries(res.headers.entries()));
  const text = await res.text();
  console.log('body', text);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
