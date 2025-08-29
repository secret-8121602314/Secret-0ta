interface BatchedRequest<T> {
  id: string;
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  timestamp: number;
}

interface BatchConfig {
  maxBatchSize: number;
  maxWaitTime: number;
  retryAttempts: number;
  retryDelay: number;
}

class RequestBatchingService {
  private static instance: RequestBatchingService;
  private batches: Map<string, BatchedRequest<any>[]> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private defaultConfig: BatchConfig = {
    maxBatchSize: 10,
    maxWaitTime: 100, // 100ms
    retryAttempts: 3,
    retryDelay: 1000 // 1 second
  };

  static getInstance(): RequestBatchingService {
    if (!RequestBatchingService.instance) {
      RequestBatchingService.instance = new RequestBatchingService();
    }
    return RequestBatchingService.instance;
  }

  /**
   * Batch multiple requests together for better performance
   */
  async batchRequests<T>(
    requests: Promise<T>[],
    config?: Partial<BatchConfig>
  ): Promise<T[]> {
    const batchConfig = { ...this.defaultConfig, ...config };
    
    if (requests.length === 0) {
      return [];
    }

    if (requests.length === 1) {
      return [await requests[0]];
    }

    // Create a batch ID
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Execute requests in parallel with batching
      const results = await this.executeBatch(requests, batchId, batchConfig);
      return results;
    } catch (error) {
      console.error('Batch request failed:', error);
      
      // Fallback to individual requests
      return this.executeIndividualRequests(requests, batchConfig);
    }
  }

  /**
   * Execute a batch of requests with smart batching
   */
  private async executeBatch<T>(
    requests: Promise<T>[],
    batchId: string,
    config: BatchConfig
  ): Promise<T[]> {
    const results: T[] = [];
    const chunks = this.chunkArray(requests, config.maxBatchSize);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkId = `${batchId}_chunk_${i}`;
      
      try {
        // Execute chunk with timeout
        const chunkResults = await Promise.race([
          Promise.all(chunk),
          this.createTimeout(config.maxWaitTime * 2, `Chunk ${i} timeout`)
        ]);
        
        results.push(...chunkResults);
        
        // Add small delay between chunks to prevent overwhelming
        if (i < chunks.length - 1) {
          await this.delay(10);
        }
      } catch (error) {
        console.warn(`Chunk ${i} failed, retrying individually:`, error);
        
        // Retry chunk individually
        const individualResults = await this.executeIndividualRequests(chunk, config);
        results.push(...individualResults);
      }
    }

    return results;
  }

  /**
   * Execute requests individually as fallback
   */
  private async executeIndividualRequests<T>(
    requests: Promise<T>[],
    config: BatchConfig
  ): Promise<T[]> {
    const results: T[] = [];
    
    for (let i = 0; i < requests.length; i++) {
      let attempt = 0;
      let success = false;
      
      while (attempt < config.retryAttempts && !success) {
        try {
          const result = await requests[i];
          results.push(result);
          success = true;
        } catch (error) {
          attempt++;
          
          if (attempt >= config.retryAttempts) {
            console.error(`Request ${i} failed after ${config.retryAttempts} attempts:`, error);
            throw error;
          }
          
          // Wait before retry
          await this.delay(config.retryDelay * attempt);
        }
      }
    }
    
    return results;
  }

  /**
   * Create a timeout promise
   */
  private createTimeout(ms: number, message: string): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`${message} after ${ms}ms`));
      }, ms);
    });
  }

  /**
   * Split array into chunks
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Batch database operations for better performance
   */
  async batchDatabaseOperations<T>(
    operations: (() => Promise<T>)[],
    config?: Partial<BatchConfig>
  ): Promise<T[]> {
    const batchConfig = { ...this.defaultConfig, ...config };
    
    if (operations.length === 0) {
      return [];
    }

    if (operations.length === 1) {
      return [await operations[0]()];
    }

    // Group operations by type for better batching
    const groupedOperations = this.groupOperationsByType(operations);
    const results: T[] = [];

    for (const [operationType, ops] of groupedOperations) {
      try {
        const batchResults = await this.executeBatch(
          ops.map(op => op()),
          `db_${operationType}_${Date.now()}`,
          batchConfig
        );
        results.push(...batchResults);
      } catch (error) {
        console.error(`Database batch operation failed for type ${operationType}:`, error);
        
        // Fallback to individual execution
        const individualResults = await this.executeIndividualRequests(
          ops.map(op => op()),
          batchConfig
        );
        results.push(...individualResults);
      }
    }

    return results;
  }

  /**
   * Group operations by type for optimal batching
   */
  private groupOperationsByType<T>(
    operations: (() => Promise<T>)[]
  ): Map<string, (() => Promise<T>)[]> {
    const groups = new Map<string, (() => Promise<T>)[]>();
    
    // For now, group by operation count (simple batching)
    // In the future, this could be enhanced to group by actual operation type
    const batchSize = 5;
    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);
      const batchId = `batch_${Math.floor(i / batchSize)}`;
      groups.set(batchId, batch);
    }
    
    return groups;
  }

  /**
   * Batch Supabase operations specifically
   */
  async batchSupabaseOperations<T>(
    operations: (() => Promise<T>)[],
    config?: Partial<BatchConfig>
  ): Promise<T[]> {
    const batchConfig = { 
      ...this.defaultConfig, 
      maxBatchSize: 5, // Supabase works better with smaller batches
      maxWaitTime: 200, // Allow more time for database operations
      ...config 
    };
    
    return this.batchDatabaseOperations(operations, batchConfig);
  }

  /**
   * Get batch statistics
   */
  getBatchStats(): {
    totalBatches: number;
    activeBatches: number;
    averageBatchSize: number;
  } {
    const totalBatches = this.batches.size;
    const activeBatches = Array.from(this.batches.values()).filter(batch => batch.length > 0).length;
    
    let totalRequests = 0;
    this.batches.forEach(batch => {
      totalRequests += batch.length;
    });
    
    const averageBatchSize = totalBatches > 0 ? totalRequests / totalBatches : 0;
    
    return {
      totalBatches,
      activeBatches,
      averageBatchSize: Math.round(averageBatchSize * 100) / 100
    };
  }

  /**
   * Clear all batches
   */
  clearBatches(): void {
    this.batches.clear();
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    console.log('🧹 All batches cleared');
  }
}

// Export singleton instance
export const requestBatchingService = RequestBatchingService.getInstance();

// Export individual methods for convenience
export const {
  batchRequests,
  batchDatabaseOperations,
  batchSupabaseOperations,
  getBatchStats,
  clearBatches
} = requestBatchingService;

// Add to window for debugging
declare global {
  interface Window {
    requestBatchingService?: typeof requestBatchingService;
  }
}

if (typeof window !== 'undefined') {
  window.requestBatchingService = requestBatchingService;
}
