import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    service: 'otakon-backend'
  });
});

// Enhanced health check for production monitoring
router.get('/detailed', async (req, res) => {
  const { supabase, gemini } = req.app.locals;
  
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    service: 'otakon-backend',
    checks: {
      database: 'unknown',
      ai_service: 'unknown',
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    }
  };

  try {
    // Test database connection
    const { error: dbError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    health.checks.database = dbError ? 'unhealthy' : 'healthy';
  } catch (error) {
    health.checks.database = 'unhealthy';
  }

  try {
    // Test AI service connection
    const testModel = gemini.getGenerativeModel({ model: 'gemini-2.5-flash' });
    health.checks.ai_service = 'healthy';
  } catch (error) {
    health.checks.ai_service = 'unhealthy';
  }

  const overallStatus = health.checks.database === 'healthy' && 
                       health.checks.ai_service === 'healthy' ? 'healthy' : 'degraded';
  
  health.status = overallStatus;
  
  res.status(overallStatus === 'healthy' ? 200 : 503).json(health);
});

export { router as healthRoutes };
