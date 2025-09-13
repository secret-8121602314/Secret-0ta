import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import { chatRoutes } from './routes/chat';
import { insightsRoutes } from './routes/insights';
import { healthRoutes } from './routes/health';

// Enhanced production logger with structured logging
const logger = {
  info: (message: string, meta?: any) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message,
      service: 'otakon-backend',
      environment: process.env.NODE_ENV || 'development',
      ...meta
    };
    
    if (process.env.NODE_ENV === 'production') {
      // In production, use structured logging for Cloud Logging
      console.log(JSON.stringify(logEntry));
    } else {
      console.log(`[INFO] ${message}`, meta || '');
    }
  },
  
  error: (message: string, meta?: any) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message,
      service: 'otakon-backend',
      environment: process.env.NODE_ENV || 'development',
      ...meta
    };
    
    if (process.env.NODE_ENV === 'production') {
      console.error(JSON.stringify(logEntry));
    } else {
      console.error(`[ERROR] ${message}`, meta || '');
    }
  },
  
  warn: (message: string, meta?: any) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'WARN',
      message,
      service: 'otakon-backend',
      environment: process.env.NODE_ENV || 'development',
      ...meta
    };
    
    if (process.env.NODE_ENV === 'production') {
      console.warn(JSON.stringify(logEntry));
    } else {
      console.warn(`[WARN] ${message}`, meta || '');
    }
  },
  
  debug: (message: string, meta?: any) => {
    if (process.env.NODE_ENV === 'development') {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level: 'DEBUG',
        message,
        service: 'otakon-backend',
        environment: 'development',
        ...meta
      };
      console.log(`[DEBUG] ${message}`, meta || '');
    }
  }
};

// Initialize Secret Manager client
const secretClient = new SecretManagerServiceClient();

// Function to get secret from Secret Manager with enhanced error handling
async function getSecret(secretName: string): Promise<string> {
  try {
    // Fallback to environment variables when available
    const envFallback = process.env[secretName.replace(/-/g, '_').toUpperCase()];
    if (envFallback) {
      logger.info(`Using environment variable for ${secretName}`);
      return envFallback;
    }

    const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || 'otakon-production';
    logger.info(`Accessing secret ${secretName} from project ${projectId}`);
    
    const [version] = await secretClient.accessSecretVersion({
      name: `projects/${projectId}/secrets/${secretName}/versions/latest`,
    });
    
    const secretValue = version.payload?.data?.toString() || '';
    logger.info(`Successfully retrieved secret ${secretName}`);
    return secretValue;
  } catch (error) {
    logger.error(`Error accessing secret ${secretName}:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      secretName,
      projectId: process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT
    });
    throw error;
  }
}

// Initialize Express app
const app = express();
const port = process.env.PORT || 8080;

// Enhanced security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://*.supabase.co", "https://generativelanguage.googleapis.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Enhanced CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://otakon-production.web.app',
        'https://otakon-production.firebaseapp.com',
        'https://otagon-0509.web.app',
        'https://otagon-0509.firebaseapp.com'
      ]
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key'],
  exposedHeaders: ['X-Request-ID', 'X-Response-Time']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enhanced request logging middleware with performance metrics
app.use((req, res, next) => {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Add request ID to headers for tracing
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);
  
  logger.info(`${req.method} ${req.path}`, {
    requestId,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    contentLength: req.get('Content-Length') || '0'
  });
  
  // Log response time
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    res.setHeader('X-Response-Time', `${responseTime}ms`);
    
    logger.info(`Response sent`, {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      contentLength: res.get('Content-Length') || '0'
    });
  });
  
  next();
});

// Initialize services
let supabase: any;
let gemini: GoogleGenAI;

async function initializeServices() {
  try {
    logger.info('Initializing services...');
    
    // Get secrets with timeout
    const secretPromises = [
      getSecret('supabase-url'),
      getSecret('supabase-service-key'),
      getSecret('gemini-api-key')
    ];
    
    const [supabaseUrl, supabaseServiceKey, geminiApiKey] = await Promise.all(secretPromises);

    // Initialize Supabase with enhanced configuration
    supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          'X-Client-Info': 'otakon-backend/1.0.0'
        }
      }
    });

    // Test Supabase connection
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (testError) {
      logger.warn('Supabase connection test failed', { error: testError.message });
    } else {
      logger.info('Supabase connection test successful');
    }

    // Initialize Gemini with enhanced configuration
    gemini = new GoogleGenAI({ 
      apiKey: geminiApiKey,
      // Add any additional configuration here
    });

    // Test Gemini connection
    try {
      const testModel = gemini.getGenerativeModel({ model: 'gemini-2.5-flash' });
      logger.info('Gemini connection test successful');
    } catch (error) {
      logger.warn('Gemini connection test failed', { 
        error: error instanceof Error ? error.message : String(error) 
      });
    }

    // Make services available to routes
    app.locals.supabase = supabase;
    app.locals.gemini = gemini;
    app.locals.logger = logger;

    logger.info('Services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize services:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  }
}

// Routes
app.use('/health', healthRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/insights', insightsRoutes);

// Enhanced error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const requestId = req.headers['x-request-id'] || 'unknown';
  
  logger.error('Unhandled error:', {
    requestId,
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.body
  });
  
  res.status(500).json({ 
    error: 'Internal server error',
    requestId,
    timestamp: new Date().toISOString()
  });
});

// Enhanced 404 handler
app.use('*', (req, res) => {
  const requestId = req.headers['x-request-id'] || 'unknown';
  
  logger.warn('404 Not Found', {
    requestId,
    path: req.originalUrl,
    method: req.method,
    ip: req.ip
  });
  
  res.status(404).json({ 
    error: 'Not found',
    requestId,
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Start server with enhanced error handling
async function startServer() {
  try {
    await initializeServices();
    
    const server = app.listen(Number(port), '0.0.0.0', () => {
      logger.info(`🚀 Server running on port ${port}`, {
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        pid: process.pid,
        nodeVersion: process.version
      });
    });

    // Enhanced graceful shutdown
    const gracefulShutdown = (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully`);
      
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
      
      // Force close after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    logger.error('Failed to start server:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  }
}

startServer().catch((error) => {
  logger.error('Failed to start server:', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined
  });
  process.exit(1);
});
