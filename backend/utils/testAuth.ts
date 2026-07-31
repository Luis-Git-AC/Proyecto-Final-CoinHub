import 'dotenv/config';

const API = process.env['API_URL'] || 'http://localhost:5000/api';

function niceLog(title: string, obj: unknown): void {
  console.log('--- ' + title + ' ---');
  try {
    console.log(JSON.stringify(obj, null, 2));
  } catch {
    console.log(obj);
  }
}

interface LoginResponse {
  token?: string;
}

async function run(): Promise<void> {
  try {
    const randomSuffix = Math.floor(Math.random() * 100000);
    const username = `testuser_${randomSuffix}`;
    const email = `test_${randomSuffix}@example.com`;
    const password = 'Test1234!';

    const regRes = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    const regJson: unknown = await regRes.json().catch(() => null);
    niceLog('REGISTER response', { status: regRes.status, body: regJson });

    const loginRes = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const loginJson: LoginResponse | null = await loginRes.json().catch(() => null);
    niceLog('LOGIN response', { status: loginRes.status, body: loginJson });

    if (!loginJson?.token) {
      console.error('No token received, aborting.');
      process.exitCode = 2;
      return;
    }
    const token = loginJson.token;

    const meRes = await fetch(`${API}/auth/me`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    const meJson: unknown = await meRes.json().catch(() => null);
    niceLog('ME response', { status: meRes.status, body: meJson });

    console.log('\nTest finished. If registration succeeded, remember to delete the test user later if desired.');
  } catch (error) {
    console.error('Test failed:', error);
    process.exitCode = 1;
  }
}

run();
