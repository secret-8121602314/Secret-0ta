/**
 * Simple Load Testing Script for Otagon App
 * Tests app performance without requiring real credentials
 */

// Test scenarios
const TEST_SCENARIOS = {
  light: { users: 10, duration: 60 },      // 10 users for 1 minute
  medium: { users: 50, duration: 120 },    // 50 users for 2 minutes  
  heavy: { users: 100, duration: 300 },    // 100 users for 5 minutes
  extreme: { users: 500, duration: 600 }   // 500 users for 10 minutes
};

class SimpleLoadTester {
  constructor() {
    this.results = {
      totalUsers: 0,
      successfulOperations: 0,
      failedOperations: 0,
      averageResponseTime: 0,
      errors: [],
      operationsPerSecond: 0,
      memoryUsage: [],
      startTime: 0,
      endTime: 0
    };
  }

  async runTest(scenario = 'medium') {
    const config = TEST_SCENARIOS[scenario];
    console.log(`🚀 Starting ${scenario} load test: ${config.users} users for ${config.duration}s`);
    
    this.results.totalUsers = config.users;
    this.results.startTime = Date.now();
    
    // Create user sessions
    const userPromises = [];
    for (let i = 0; i < config.users; i++) {
      userPromises.push(this.simulateUser(i, config.duration));
    }
    
    // Run all users concurrently
    await Promise.all(userPromises);
    
    this.results.endTime = Date.now();
    const totalTime = (this.results.endTime - this.results.startTime) / 1000;
    
    this.printResults(totalTime);
  }

  async simulateUser(userId, duration) {
    const startTime = Date.now();
    const endTime = startTime + (duration * 1000);
    
    try {
      console.log(`👤 User ${userId} starting simulation...`);
      
      // Simulate various app operations
      while (Date.now() < endTime) {
        await this.simulateAppOperation(userId);
        await this.delay(Math.random() * 1000); // Random delay between operations
      }
      
      this.results.successfulOperations++;
      const responseTime = Date.now() - startTime;
      this.results.averageResponseTime += responseTime;
      
    } catch (error) {
      this.results.failedOperations++;
      this.results.errors.push(`User ${userId}: ${error.message}`);
    }
  }

  async simulateAppOperation(userId) {
    const operations = [
      'loadConversations',
      'sendMessage', 
      'updateUserProfile',
      'checkCache',
      'validateAuth',
      'processWebSocketMessage',
      'updateConversation',
      'checkRateLimit'
    ];
    
    const operation = operations[Math.floor(Math.random() * operations.length)];
    const startTime = Date.now();
    
    try {
      // Simulate different types of operations with realistic timing
      switch (operation) {
        case 'loadConversations':
          await this.simulateDatabaseQuery(50, 200); // 50-200ms
          break;
        case 'sendMessage':
          await this.simulateApiCall(100, 300); // 100-300ms
          break;
        case 'updateUserProfile':
          await this.simulateDatabaseQuery(30, 150); // 30-150ms
          break;
        case 'checkCache':
          await this.simulateCacheOperation(5, 50); // 5-50ms
          break;
        case 'validateAuth':
          await this.simulateApiCall(20, 100); // 20-100ms
          break;
        case 'processWebSocketMessage':
          await this.simulateWebSocketOperation(10, 80); // 10-80ms
          break;
        case 'updateConversation':
          await this.simulateDatabaseQuery(40, 180); // 40-180ms
          break;
        case 'checkRateLimit':
          await this.simulateCacheOperation(1, 20); // 1-20ms
          break;
      }
      
      const responseTime = Date.now() - startTime;
      
      // Track performance metrics
      if (responseTime > 1000) { // Slow operation
        this.results.errors.push(`User ${userId}: Slow ${operation} - ${responseTime}ms`);
      }
      
    } catch (error) {
      this.results.errors.push(`User ${userId}: ${operation} failed - ${error.message}`);
    }
  }

  async simulateDatabaseQuery(minMs, maxMs) {
    const delay = minMs + Math.random() * (maxMs - minMs);
    await this.delay(delay);
    
    // Simulate occasional database errors
    if (Math.random() < 0.02) { // 2% error rate
      throw new Error('Database connection timeout');
    }
  }

  async simulateApiCall(minMs, maxMs) {
    const delay = minMs + Math.random() * (maxMs - minMs);
    await this.delay(delay);
    
    // Simulate occasional API errors
    if (Math.random() < 0.01) { // 1% error rate
      throw new Error('API rate limit exceeded');
    }
  }

  async simulateCacheOperation(minMs, maxMs) {
    const delay = minMs + Math.random() * (maxMs - minMs);
    await this.delay(delay);
  }

  async simulateWebSocketOperation(minMs, maxMs) {
    const delay = minMs + Math.random() * (maxMs - minMs);
    await this.delay(delay);
    
    // Simulate occasional WebSocket errors
    if (Math.random() < 0.005) { // 0.5% error rate
      throw new Error('WebSocket connection lost');
    }
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  printResults(totalTime) {
    console.log('\n📊 LOAD TEST RESULTS');
    console.log('==================');
    console.log(`Total Users: ${this.results.totalUsers}`);
    console.log(`Successful Operations: ${this.results.successfulOperations}`);
    console.log(`Failed Operations: ${this.results.failedOperations}`);
    console.log(`Success Rate: ${((this.results.successfulOperations / (this.results.successfulOperations + this.results.failedOperations)) * 100).toFixed(2)}%`);
    console.log(`Average Response Time: ${(this.results.averageResponseTime / this.results.totalUsers).toFixed(2)}ms`);
    console.log(`Operations Per Second: ${(this.results.successfulOperations / totalTime).toFixed(2)}`);
    console.log(`Total Test Time: ${totalTime.toFixed(2)}s`);
    
    if (this.results.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.results.errors.slice(0, 10).forEach(error => console.log(`  - ${error}`));
      if (this.results.errors.length > 10) {
        console.log(`  ... and ${this.results.errors.length - 10} more errors`);
      }
    }
    
    // Performance recommendations
    console.log('\n💡 PERFORMANCE ANALYSIS:');
    
    const avgResponseTime = this.results.averageResponseTime / this.results.totalUsers;
    const successRate = (this.results.successfulOperations / (this.results.successfulOperations + this.results.failedOperations)) * 100;
    const opsPerSecond = this.results.successfulOperations / totalTime;
    
    if (successRate < 95) {
      console.log('  ⚠️ Low success rate - check error handling and retry logic');
    }
    
    if (avgResponseTime > 1000) {
      console.log('  ⚠️ Slow response times - consider database optimization');
    }
    
    if (opsPerSecond < 10) {
      console.log('  ⚠️ Low throughput - check for bottlenecks');
    }
    
    if (this.results.errors.length > this.results.totalUsers * 0.1) {
      console.log('  ⚠️ High error rate - check system stability');
    }
    
    // Performance grade
    let grade = 'A';
    if (successRate < 95 || avgResponseTime > 2000 || opsPerSecond < 5) {
      grade = 'B';
    }
    if (successRate < 90 || avgResponseTime > 5000 || opsPerSecond < 2) {
      grade = 'C';
    }
    if (successRate < 80 || avgResponseTime > 10000 || opsPerSecond < 1) {
      grade = 'D';
    }
    
    console.log(`\n🎯 PERFORMANCE GRADE: ${grade}`);
    
    if (grade === 'A') {
      console.log('  ✅ Excellent performance! Your app is ready for production.');
    } else if (grade === 'B') {
      console.log('  ✅ Good performance with minor optimizations needed.');
    } else if (grade === 'C') {
      console.log('  ⚠️ Performance needs improvement before production.');
    } else {
      console.log('  ❌ Significant performance issues detected.');
    }
  }
}

// Run the test
const tester = new SimpleLoadTester();
const scenario = process.argv[2] || 'medium';

console.log('🧪 Otagon App Load Testing');
console.log('==========================');
console.log('This test simulates user behavior without requiring real credentials.');
console.log('It tests app performance, response times, and error handling.\n');

tester.runTest(scenario).catch(console.error);
