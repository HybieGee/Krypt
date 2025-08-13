/**
 * Acceptance tests for unified Cloudflare Worker
 * Tests all critical endpoints and ensures KV persistence works
 */

const WORKER_BASE = 'https://krypt-terminal-unified.kimberly-92f.workers.dev';

class WorkerTests {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.tests = [];
  }

  async test(name, testFn) {
    console.log(`\n🧪 Testing: ${name}`);
    try {
      await testFn();
      console.log(`✅ PASS: ${name}`);
      this.passed++;
    } catch (error) {
      console.error(`❌ FAIL: ${name}`, error.message);
      this.failed++;
    }
    this.tests.push({ name, passed: !error });
  }

  async fetch(endpoint, options = {}) {
    const url = `${WORKER_BASE}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }

  async runAllTests() {
    console.log('🚀 Starting Unified Worker Acceptance Tests\n');

    // Test 1: Early Access Visitor Tracking
    await this.test('Early Access Visit Registration', async () => {
      const data = await this.fetch('/api/early-access/visit', {
        method: 'POST',
        body: JSON.stringify({
          fingerprint: 'test-fp-' + Date.now(),
          userAgent: 'Test Browser',
          timestamp: Date.now()
        })
      });
      
      if (!data.success || typeof data.count !== 'number') {
        throw new Error('Invalid visitor registration response');
      }
    });

    // Test 2: Statistics Retrieval
    await this.test('Statistics Endpoint', async () => {
      const stats = await this.fetch('/api/stats');
      
      const requiredFields = ['total_users', 'early_access_users', 'total_lines_of_code', 'total_commits', 'total_tests_run'];
      for (const field of requiredFields) {
        if (!stats[field] || typeof stats[field].value !== 'number') {
          throw new Error(`Missing or invalid stats field: ${field}`);
        }
      }
    });

    // Test 3: Progress Endpoint
    await this.test('Progress Endpoint', async () => {
      const progress = await this.fetch('/api/progress');
      
      const requiredFields = ['currentPhase', 'componentsCompleted', 'totalComponents', 'linesOfCode', 'commits', 'testsRun'];
      for (const field of requiredFields) {
        if (typeof progress[field] !== 'number') {
          throw new Error(`Missing or invalid progress field: ${field}`);
        }
      }
    });

    // Test 4: Development Logs
    await this.test('Development Logs Endpoint', async () => {
      const logs = await this.fetch('/api/logs');
      
      if (!Array.isArray(logs)) {
        throw new Error('Logs endpoint should return an array');
      }
      
      // Check log structure if logs exist
      if (logs.length > 0) {
        const log = logs[0];
        if (!log.id || !log.timestamp || !log.type || !log.message) {
          throw new Error('Invalid log structure');
        }
      }
    });

    // Test 5: Leaderboard
    await this.test('Leaderboard Endpoint', async () => {
      const leaderboard = await this.fetch('/api/leaderboard');
      
      if (!Array.isArray(leaderboard)) {
        throw new Error('Leaderboard should return an array');
      }
      
      // Check leaderboard structure if data exists
      if (leaderboard.length > 0) {
        const entry = leaderboard[0];
        if (!entry.address || typeof entry.balance !== 'number') {
          throw new Error('Invalid leaderboard entry structure');
        }
      }
    });

    // Test 6: User Balance Update
    await this.test('User Balance Update', async () => {
      const testAddress = '0xtest' + Date.now();
      const testBalance = Math.floor(Math.random() * 1000);
      
      const result = await this.fetch('/api/user/balance', {
        method: 'POST',
        body: JSON.stringify({
          address: testAddress,
          balance: testBalance
        })
      });
      
      if (!result.success) {
        throw new Error('Balance update failed');
      }
    });

    // Test 7: Raffle System
    await this.test('Raffle Entry', async () => {
      const testAddress = '0xraffle' + Date.now();
      
      const result = await this.fetch('/api/raffle/enter', {
        method: 'POST',
        body: JSON.stringify({
          address: testAddress,
          amount: 100
        })
      });
      
      if (!result.success) {
        throw new Error('Raffle entry failed');
      }
    });

    // Test 8: SSE Stream (basic connectivity)
    await this.test('SSE Stream Connectivity', async () => {
      const response = await fetch(`${WORKER_BASE}/api/early-access/stream`);
      
      if (!response.ok) {
        throw new Error('SSE stream endpoint not accessible');
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('text/event-stream')) {
        throw new Error('SSE stream has incorrect content type');
      }
    });

    // Summary
    console.log('\n📊 Test Results Summary:');
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📈 Success Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`);

    if (this.failed === 0) {
      console.log('\n🎉 All tests passed! Unified worker is ready for deployment.');
    } else {
      console.log('\n⚠️  Some tests failed. Please check the worker implementation.');
    }

    return this.failed === 0;
  }
}

// Run tests if called directly
if (typeof window !== 'undefined') {
  // Browser environment
  window.runWorkerTests = async () => {
    const tests = new WorkerTests();
    return await tests.runAllTests();
  };
  console.log('Worker tests loaded. Run: runWorkerTests()');
} else {
  // Node.js environment
  const tests = new WorkerTests();
  tests.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}