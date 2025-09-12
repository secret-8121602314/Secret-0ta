import { vi } from 'vitest';

// Add missing test globals
declare global {
  var describe: any;
  var it: any;
  var expect: any;
  var beforeEach: any;
  var afterAll: any;
}

// Mock global objects that might be used in tests
global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

global.sessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
};

// Mock fetch if needed
global.fetch = vi.fn();

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock crypto for any crypto operations
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'mock-uuid-123'),
    getRandomValues: vi.fn((arr) => arr),
  },
});

// Mock performance API
Object.defineProperty(global, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByType: vi.fn(() => []),
    getEntriesByName: vi.fn(() => []),
  },
});

// Mock URL constructor
global.URL = vi.fn().mockImplementation((url, base) => ({
  href: url,
  origin: 'https://example.com',
  protocol: 'https:',
  host: 'example.com',
  hostname: 'example.com',
  port: '',
  pathname: '/',
  search: '',
  hash: '',
  username: '',
  password: '',
  searchParams: new URLSearchParams(),
  toString: () => url,
  canParse: vi.fn(() => true),
  createObjectURL: vi.fn(() => 'blob:mock-url'),
  parse: vi.fn(() => new URL(url)),
  revokeObjectURL: vi.fn(),
})) as any as typeof URL;

// Mock URLSearchParams
global.URLSearchParams = vi.fn().mockImplementation((init) => {
  const params = new Map();
  if (init) {
    if (typeof init === 'string') {
      init.split('&').forEach(pair => {
        const [key, value] = pair.split('=');
        if (key) params.set(key, value || '');
      });
    } else if (Array.isArray(init)) {
      init.forEach(([key, value]) => params.set(key, value));
    } else if (init && typeof init === 'object') {
      Object.entries(init).forEach(([key, value]) => params.set(key, value));
    }
  }
  return {
    get: vi.fn((key) => params.get(key)),
    set: vi.fn((key, value) => params.set(key, value)),
    has: vi.fn((key) => params.has(key)),
    delete: vi.fn((key) => params.delete(key)),
    toString: vi.fn(() => Array.from(params.entries()).map(([k, v]) => `${k}=${v}`).join('&')),
  };
});

// Setup test environment
beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();
  
  // Reset localStorage mock
  vi.mocked(localStorage.getItem).mockReturnValue(null);
  vi.mocked(localStorage.setItem).mockImplementation(() => {});
  vi.mocked(localStorage.removeItem).mockImplementation(() => {});
  vi.mocked(localStorage.clear).mockImplementation(() => {});
  
  // Reset sessionStorage mock
  vi.mocked(sessionStorage.getItem).mockReturnValue(null);
  vi.mocked(sessionStorage.setItem).mockImplementation(() => {});
  vi.mocked(sessionStorage.removeItem).mockImplementation(() => {});
  vi.mocked(sessionStorage.clear).mockImplementation(() => {});
  
  // Reset console mocks
  vi.mocked(console.log).mockImplementation(() => {});
  vi.mocked(console.warn).mockImplementation(() => {});
  vi.mocked(console.error).mockImplementation(() => {});
  vi.mocked(console.info).mockImplementation(() => {});
  vi.mocked(console.debug).mockImplementation(() => {});
});

// Cleanup after all tests
afterAll(() => {
  vi.restoreAllMocks();
});
