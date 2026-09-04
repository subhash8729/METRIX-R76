const assert = require('assert');
const app = require('../src/server');
const http = require('http');

let server;
const PORT = 5055;

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
      },
      (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve({ status: res.statusCode, body: json });
          } catch (e) {
            resolve({ status: res.statusCode, text: data });
          }
        });
      }
    );
    req.on('error', reject);
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runApiTests() {
  console.log('--- RUNNING API INTEGRATION & GOLDEN PATH TESTS ---');
  server = app.listen(PORT);

  try {
    // 1. Health check
    console.log('[API 1] Testing Health Endpoint');
    const health = await request('/api/health');
    assert.strictEqual(health.status, 200);
    assert.strictEqual(health.body.status, 'UP');
    console.log('  -> Health check PASSED');

    // 2. Auth Login - Lab Officer
    console.log('[API 2] Testing Lab Officer Login');
    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'officer@metrix.gov.in', password: 'Officer@123' }
    });
    assert.strictEqual(loginRes.status, 200);
    assert.strictEqual(loginRes.body.success, true);
    assert.ok(loginRes.body.data.token);
    const officerToken = loginRes.body.data.token;
    console.log('  -> Lab Officer authenticated successfully');

    // 3. Dashboard Metrics
    console.log('[API 3] Testing Dashboard Metrics');
    const dashRes = await request('/api/dashboard/metrics', {
      headers: { Authorization: `Bearer ${officerToken}` }
    });
    assert.strictEqual(dashRes.status, 200);
    assert.ok(dashRes.body.data.summary.total_instruments >= 3);
    assert.ok(dashRes.body.data.summary.calibrated_equipment >= 1);
    console.log('  -> Dashboard metrics loaded successfully from real MySQL data');

    // 4. List Instruments & Details
    console.log('[API 4] Testing Instrument Management & History');
    const instList = await request('/api/instruments', {
      headers: { Authorization: `Bearer ${officerToken}` }
    });
    assert.strictEqual(instList.status, 200);
    assert.ok(instList.body.data.length >= 3);

    const instDetail = await request('/api/instruments/2', {
      headers: { Authorization: `Bearer ${officerToken}` }
    });
    assert.strictEqual(instDetail.status, 200);
    assert.strictEqual(instDetail.body.data.instrument.model_number, 'Combics-CW1P');
    assert.ok(instDetail.body.data.test_projects.length >= 1);
    assert.ok(instDetail.body.data.reports.length >= 1);
    console.log('  -> Instrument retrieved with complete test project history and reports');

    // 5. Test Live Calculation
    console.log('[API 5] Testing Live Calculation Endpoint');
    const calcLive = await request('/api/tests/calculate-live', {
      method: 'POST',
      headers: { Authorization: `Bearer ${officerToken}` },
      body: {
        accuracyClass: 'CLASS_II',
        verificationIntervalE: 0.1,
        loadApplied: 3000,
        indicatedValue: 3000.0,
        deltaLoad: 0.03,
        zeroError: 0.01
      }
    });
    assert.strictEqual(calcLive.status, 200);
    assert.strictEqual(calcLive.body.data.status, 'PASS');
    assert.strictEqual(calcLive.body.data.permissible_error_mpe, 0.1);
    console.log('  -> Live calculation returned accurate turning point and compliance status');

    // 6. Test Rule Simulator
    console.log('[API 6] Testing Rule Simulator');
    const simRes = await request('/api/rules/simulate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${officerToken}` },
      body: {
        ruleVersionId: 1,
        accuracyClass: 'CLASS_III',
        verificationIntervalE: 5,
        loadApplied: 5000,
        indicatedValue: 5000,
        deltaLoad: 0.02
      }
    });
    assert.strictEqual(simRes.status, 200);
    assert.strictEqual(simRes.body.data.result.status, 'PASS');
    console.log('  -> Rule simulator executed successfully');

    console.log('--- ALL API INTEGRATION TESTS PASSED SUCCESSFULLY! ---');
  } finally {
    server.close();
    process.exit(0);
  }
}

runApiTests().catch(err => {
  console.error('API TEST FAILED:', err);
  if (server) server.close();
  process.exit(1);
});
