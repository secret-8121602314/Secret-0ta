/**
 * Load Testing Script for Otagon App
 * Tests concurrent users, database queries, and WebSocket connections
 */

const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');

// Configuration
const SUPABASE_URL = 'https://qajcxgkqloumogioomiz.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here'; // Replace with actual key
const WEBSOCKET_URL = 'wss://otakon-relay.onrender.com';

// Test scenarios
const TEST_SCENARIOS = {
  light: { users: 10, duration: 60 },      // 10 users for 1 minute
  medium: { users: 50, duration: 120 },    // 50 users for 2 minutes  
  heavy: { users: 100, duration: 300 },    // 100 users for 5 minutes
  extreme: { users: 500, duration: 600 }   // 500 users for 10 minutes
};

class LoadTester {
  constructor() {
    this.results = {
      totalUsers: 0,
      successfulLogins: 0,
      failedLogins: 0,
      averageResponseTime: 0,
      errors: [],
      databaseQueries: 0,
      websocketConnections: 0,
      memoryUsage: []
    };
  }

  async runTest(scenario = 'medium') {
    const config = TEST_SCENARIOS[scenario];
    console.log(`🚀 Starting ${scenario} load test: ${config.users} users for ${config.duration}s`);
    
    this.results.totalUsers = config.users;
    const startTime = Date.now();
    
    // Create user sessions
    const userPromises = [];
    for (let i = 0; i < config.users; i++) {
      userPromises.push(this.simulateUser(i));
    }
    
    // Run all users concurrently
    await Promise.all(userPromises);
    
    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000;
    
    this.printResults(totalTime);
  }

  async simulateUser(userId) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const startTime = Date.now();
    
    try {
      // Simulate user login
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: `testuser${userId}@example.com`,
        password: 'testpassword123'
      });
      
      if (authError) {
        this.results.failedLogins++;
        this.results.errors.push(`User ${userId}: ${authError.message}`);
        return;
      }
      
      this.results.successfulLogins++;
      
      // Simulate database queries
      await this.simulateDatabaseQueries(supabase, userId);
      
      // Simulate WebSocket connection
      await this.simulateWebSocketConnection(userId);
      
      // Simulate cache operations
      await this.simulateCacheOperations(supabase, userId);
      
      const responseTime = Date.now() - startTime;
      this.results.averageResponseTime += responseTime;
      
    } catch (error) {
      this.results.failedLogins++;
      this.results.errors.push(`User ${userId}: ${error.message}`);
    }
  }

  async simulateDatabaseQueries(supabase, userId) {
    // Test conversation queries
    const { data: conversations } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .limit(10);
    
    this.results.databaseQueries++;
    
    // Test user queries
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    this.results.databaseQueries++;
  }

  async simulateWebSocketConnection(userId) {
    return new Promise((resolve) => {
      const ws = new WebSocket(WEBSOCKET_URL);
      
      ws.on('open', () => {
        this.results.websocketConnections++;
        
        // Send test message
        ws.send(JSON.stringify({
          type: 'test_message',
          userId: userId,
          timestamp: Date.now()
        }));
        
        // Close after 5 seconds
        setTimeout(() => {
          ws.close();
          resolve();
        }, 5000);
      });
      
      ws.on('error', (error) => {
        this.results.errors.push(`WebSocket error for user ${userId}: ${error.message}`);
        resolve();
      });
    });
  }

  async simulateCacheOperations(supabase, userId) {
    // Test cache read/write operations
    const testData = {
      userId: userId,
      timestamp: Date.now(),
      data: `test_data_${userId}`
    };
    
    // Simulate cache write
    const { error: writeError } = await supabase
      .from('app_cache')
      .upsert({
        key: `test_cache_${userId}`,
        value: testData,
        expires_at: new Date(Date.now() + 300000).toISOString(),
        cache_type: 'test',
        user_id: userId
      });
    
    if (!writeError) {
      this.results.databaseQueries++;
    }
    
    // Simulate cache read
    const { data: cacheData } = await supabase
      .from('app_cache')
      .select('*')
      .eq('key', `test_cache_${userId}`)
      .single();
    
    if (cacheData) {
      this.results.databaseQueries++;
    }
  }

  printResults(totalTime) {
    console.log('\n📊 LOAD TEST RESULTS');
    console.log('==================');
    console.log(`Total Users: ${this.results.totalUsers}`);
    console.log(`Successful Logins: ${this.results.successfulLogins}`);
    console.log(`Failed Logins: ${this.results.failedLogins}`);
    console.log(`Success Rate: ${((this.results.successfulLogins / this.results.totalUsers) * 100).toFixed(2)}%`);
    console.log(`Average Response Time: ${(this.results.averageResponseTime / this.results.totalUsers).toFixed(2)}ms`);
    console.log(`Total Database Queries: ${this.results.databaseQueries}`);
    console.log(`WebSocket Connections: ${this.results.websocketConnections}`);
    console.log(`Total Test Time: ${totalTime.toFixed(2)}s`);
    
    if (this.results.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.results.errors.slice(0, 10).forEach(error => console.log(`  - ${error}`));
      if (this.results.errors.length > 10) {
        console.log(`  ... and ${this.results.errors.length - 10} more errors`);
      }
    }
    
    // Performance recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    if (this.results.failedLogins > this.results.totalUsers * 0.1) {
      console.log('  - High login failure rate - check authentication service');
    }
    if (this.results.averageResponseTime > 2000) {
      console.log('  - Slow response times - consider database optimization');
    }
    if (this.results.databaseQueries > this.results.totalUsers * 20) {
      console.log('  - High database query count - check for N+1 queries');
    }
  }
}

// Run the test
const tester = new LoadTester();
const scenario = process.argv[2] || 'medium';
tester.runTest(scenario).catch(console.error);
