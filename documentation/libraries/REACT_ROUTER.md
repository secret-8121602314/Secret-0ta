# React Router Documentation

React Router is a multi-strategy router for React applications enabling client-side navigation with nested routes, data fetching, and server rendering support.

## Version: 6.23.1

## Basic Setup

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home, About, Contact } from './pages';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </BrowserRouter>
  );
}
```

## Nested Routes

```tsx
<Routes>
  <Route path="/" element={<Layout />}>
    <Route index element={<Home />} />
    <Route path="dashboard" element={<Dashboard />} />
    <Route path="profile" element={<Profile />} />
    <Route path="settings" element={<Settings />} />
  </Route>
</Routes>

// Layout component uses <Outlet> for nested content
function Layout() {
  return (
    <div>
      <Header />
      <Outlet />
      <Footer />
    </div>
  );
}
```

## Dynamic Routes

```tsx
<Route path="/users/:userId" element={<UserDetail />} />

// Access params in component
import { useParams } from 'react-router-dom';

function UserDetail() {
  const { userId } = useParams<{ userId: string }>();
  return <div>User: {userId}</div>;
}
```

## Navigation

### Link Component
```tsx
import { Link } from 'react-router-dom';

<Link to="/about">About</Link>
<Link to={`/users/${userId}`}>View User</Link>
```

### NavLink Component
```tsx
import { NavLink } from 'react-router-dom';

<NavLink to="/about" className={({ isActive }) => isActive ? 'active' : ''}>
  About
</NavLink>
```

### Programmatic Navigation
```tsx
import { useNavigate } from 'react-router-dom';

function LoginForm() {
  const navigate = useNavigate();

  const handleSubmit = async (credentials) => {
    const success = await login(credentials);
    if (success) {
      navigate('/dashboard');
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

## Query Parameters

```tsx
import { useSearchParams } from 'react-router-dom';

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q');

  return (
    <div>
      <input 
        value={query || ''}
        onChange={(e) => setSearchParams({ q: e.target.value })}
      />
      <p>Search results for: {query}</p>
    </div>
  );
}
```

## Location and History

```tsx
import { useLocation } from 'react-router-dom';

function Component() {
  const location = useLocation();
  
  console.log(location.pathname); // /page
  console.log(location.search); // ?query=value
  console.log(location.hash); // #section
}
```

## Error Handling

```tsx
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/about" element={<About />} />
  <Route path="*" element={<NotFound />} />
</Routes>

function NotFound() {
  return (
    <div>
      <h1>404 - Page Not Found</h1>
      <Link to="/">Go Home</Link>
    </div>
  );
}
```

## Lazy Loading

```tsx
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));

<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/dashboard" element={
    <Suspense fallback={<div>Loading...</div>}>
      <Dashboard />
    </Suspense>
  } />
</Routes>
```

## Protected Routes

```tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/dashboard" element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  } />
</Routes>
```

## Route Layouts

```tsx
<Routes>
  <Route path="/" element={<MainLayout />}>
    <Route path="" element={<Home />} />
    <Route path="about" element={<About />} />
  </Route>
  
  <Route path="/admin" element={<AdminLayout />}>
    <Route path="" element={<AdminDashboard />} />
    <Route path="users" element={<UserManagement />} />
  </Route>
</Routes>
```

## Otagon Project Routes

The Otagon project implements routing with:
- Nested route structure
- Authentication guards
- Dynamic user profile routes
- Modal/dialog routing
- Query parameter handling for filters and search

```tsx
// Example from Otagon
<Routes>
  <Route path="/" element={<MainLayout />}>
    <Route index element={<Home />} />
    <Route path="auth" element={<AuthLayout />}>
      <Route path="login" element={<Login />} />
      <Route path="signup" element={<SignUp />} />
    </Route>
    
    <Route path="dashboard" element={
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    } />
    
    <Route path="profile/:userId" element={<UserProfile />} />
    <Route path="chat/:conversationId" element={<ChatScreen />} />
  </Route>
</Routes>
```

## Best Practices

1. **Keep routes organized** - Group related routes
2. **Use index routes** - For default child routes
3. **Lazy load heavy components** - Improve initial load
4. **Protect sensitive routes** - Use route guards
5. **Handle loading states** - Show feedback to users
6. **Preserve scroll position** - Manage scroll restoration
7. **Deep link support** - Ensure routes are bookmarkable

## Common Patterns

### Breadcrumb Navigation
```tsx
function Breadcrumb() {
  const location = useLocation();
  const paths = location.pathname.split('/').filter(Boolean);

  return (
    <nav>
      <Link to="/">Home</Link>
      {paths.map((path, index) => (
        <span key={index}>
          / <Link to={`/${paths.slice(0, index + 1).join('/')}`}>{path}</Link>
        </span>
      ))}
    </nav>
  );
}
```

### Active Link Indicator
```tsx
function Navigation() {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav>
      <Link to="/home" className={isActive('/home') ? 'active' : ''}>Home</Link>
      <Link to="/about" className={isActive('/about') ? 'active' : ''}>About</Link>
    </nav>
  );
}
```

## Resources

- [React Router Docs](https://reactrouter.com)
- [React Router API Reference](https://reactrouter.com/en/main)

## Related Documentation

- [React](./REACT.md) - Component framework
- [TypeScript](./TYPESCRIPT.md) - Type safety
