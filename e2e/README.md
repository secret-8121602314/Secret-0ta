# Otagon E2E Testing with Playwright

This directory contains end-to-end tests for the Otagon application using Playwright.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Playwright browsers** installed:
   ```bash
   npx playwright install chromium
   ```
3. **Test credentials** - Create a `.env.test` file (copy from `.env.test.example`)

## Setup

1. Copy the example environment file:
   ```bash
   cp .env.test.example .env.test
   ```

2. Fill in your test credentials:
   ```env
   E2E_TEST_EMAIL=your-test-user@example.com
   E2E_TEST_PASSWORD=your-test-password
   E2E_BASE_URL=http://localhost:5173
   ```

3. Ensure you have a test user account created in your Supabase project.

## Running Tests

### All Tests
```bash
npm run test:e2e
```

### Interactive UI Mode
```bash
npm run test:e2e:ui
```

### Headed Mode (see the browser)
```bash
npm run test:e2e:headed
```

### Debug Mode
```bash
npm run test:e2e:debug
```

### View Last Report
```bash
npm run test:e2e:report
```

### Run Specific Test File
```bash
npx playwright test e2e/landing.spec.ts
```

### Run Tests by Tag
```bash
npx playwright test --grep @smoke
```

## Test Structure

```
e2e/
├── auth.setup.ts         # Authentication setup (runs first)
├── utils/
│   └── helpers.ts        # Common utilities and selectors
├── landing.spec.ts       # Landing and early access page tests
├── game-hub.spec.ts      # Game Hub functionality tests
├── game-tabs.spec.ts     # Game tab CRUD operations
├── chat.spec.ts          # Chat interface and AI interactions
├── settings.spec.ts      # Settings and profile tests
├── connection.spec.ts    # PC connection tests
├── igdb-game-info.spec.ts # IGDB Game Info Modal tests
├── subtabs.spec.ts       # SubTab functionality tests
└── mobile.spec.ts        # Mobile responsiveness tests
```

## Test Specs Overview

### `landing.spec.ts`
- Landing page loads correctly
- Navigation works
- Early access signup flow
- Waitlist functionality

### `game-hub.spec.ts`
- Game Hub displays correctly
- Game search works
- Game selection and tab creation
- Popular games carousel

### `game-tabs.spec.ts`
- Create new game tabs
- Switch between tabs
- Rename and delete tabs
- Tab persistence

### `chat.spec.ts`
- Send messages
- Receive AI responses
- Message history
- Conversation management
- Screenshot functionality

### `settings.spec.ts`
- Profile settings
- Theme toggle
- Subscription info
- Logout functionality

### `connection.spec.ts`
- PC connection flow
- Connection code display
- WebSocket status

### `igdb-game-info.spec.ts`
- Game Info button visibility
- Modal tabs (Overview, Media, Similar Games)
- Similar game navigation within modal
- Modal close behavior

### `subtabs.spec.ts`
- SubTab creation with type selection
- Type-based color styling (7 types)
- Expand/collapse functionality
- SubTab persistence

### `mobile.spec.ts`
- Mobile viewport tests
- Touch-friendly buttons
- Responsive layout
- Tablet viewport tests

## Authentication

Tests use a shared authentication state stored in `.playwright/.auth/user.json`. 
The `auth.setup.ts` file handles login and saves the session for reuse across tests.

To re-authenticate:
```bash
npx playwright test --project=setup
```

## Adding New Tests

1. Create a new `.spec.ts` file in the `e2e/` directory
2. Import helpers and selectors from `./utils/helpers`
3. Use `storageState` to skip login:
   ```typescript
   test.use({ storageState: '.playwright/.auth/user.json' });
   ```
4. Use `waitForAppReady()` to wait for the app to fully load

## Best Practices

1. **Use meaningful selectors** - Prefer `data-testid` attributes
2. **Wait for app state** - Use `waitForAppReady()` helper
3. **Don't hard-code waits** - Use `waitForSelector`, `waitForLoadState`, etc.
4. **Clean up test data** - Delete test-created items in afterEach/afterAll
5. **Keep tests independent** - Each test should work in isolation

## CI/CD Integration

Add to your CI pipeline:

```yaml
- name: Install Playwright
  run: npx playwright install --with-deps chromium

- name: Run E2E Tests
  run: npm run test:e2e
  env:
    E2E_TEST_EMAIL: ${{ secrets.E2E_TEST_EMAIL }}
    E2E_TEST_PASSWORD: ${{ secrets.E2E_TEST_PASSWORD }}
```

## Troubleshooting

### Tests timing out
- Increase timeout in `playwright.config.ts`
- Check if dev server is running
- Verify network connectivity

### Authentication failing
- Check `.env.test` credentials
- Verify test user exists in Supabase
- Delete `.playwright/.auth/` and re-run

### Element not found
- Add `data-testid` attributes to components
- Use more specific selectors
- Wait for element visibility before interaction

## Reports

HTML reports are generated after each test run:
```bash
npm run test:e2e:report
```

Failed tests include:
- Screenshots
- Video recordings (on retry)
- Trace files for debugging
