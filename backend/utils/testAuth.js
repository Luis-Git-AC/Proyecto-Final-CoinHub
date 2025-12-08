const API = process.env.API_URL || 'http://localhost:5000/api'
const fetch = global.fetch || require('node-fetch')

function niceLog(title, obj) {
  console.log('--- ' + title + ' ---')
  try { console.log(JSON.stringify(obj, null, 2)) } catch { console.log(obj) }
}

async function run() {
  try {
    const randomSuffix = Math.floor(Math.random() * 100000)
    const username = `testuser_${randomSuffix}`
    const email = `test_${randomSuffix}@example.com`
    const password = 'Test1234!'

    const regRes = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    })
    const regJson = await regRes.json().catch(() => null)
    niceLog('REGISTER response', { status: regRes.status, body: regJson })

    const loginRes = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const loginJson = await loginRes.json().catch(() => null)
    niceLog('LOGIN response', { status: loginRes.status, body: loginJson })

    if (!loginJson || !loginJson.token) {
      console.error('No token received, aborting.')
      process.exitCode = 2
      return
    }
    const token = loginJson.token

    const meRes = await fetch(`${API}/auth/me`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const meJson = await meRes.json().catch(() => null)
    niceLog('ME response', { status: meRes.status, body: meJson })

    console.log('\nTest finished. If registration succeeded, remember to delete the test user later if desired.')
  } catch (error) {
    console.error('Test failed:', error)
    process.exitCode = 1
  }
}

run()
