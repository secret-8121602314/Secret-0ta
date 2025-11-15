# React Router v7 Complete Developer Guide

A comprehensive guide to React Router v7, featuring data-centric routing with loaders, actions, and sophisticated navigation patterns for building modern React applications.

## Table of Contents

1. [Installation & Setup](#installation--setup)
2. [Core Concepts](#core-concepts)
3. [Data Router Pattern](#data-router-pattern)
4. [Navigation & Links](#navigation--links)
5. [Loaders & Data Fetching](#loaders--data-fetching)
6. [Actions & Form Handling](#actions--form-handling)
7. [Error Handling](#error-handling)
8. [Advanced Patterns](#advanced-patterns)
9. [Hooks Reference](#hooks-reference)
10. [Best Practices](#best-practices)

## Installation & Setup

### Basic Installation

```bash
npm install react-router-dom
```

### Create Your First Router

```tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Root from './routes/Root';
import Home from './routes/Home';
import About from './routes/About';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    children: [
      { index: true, element: <Home /> },
      { path: 'about', element: <About /> }
    ]
  }
]);

export default function App() {
  return <RouterProvider router={router} />;
}
```

## Core Concepts

### Route Configuration

Routes are defined as configuration objects rather than JSX components:

```tsx
const routes = [
  {
    path: '/',
    element: <Root />,
    errorElement: <RootError />,
    loader: rootLoader,
    children: [
      {
        path: 'posts',
        element: <Posts />,
        loader: postsLoader,
        action: createPostAction,
        children: [
          {
            path: ':postId',
            element: <PostDetail />,
            loader: postDetailLoader,
            errorElement: <PostError />
          }
        ]
      }
    ]
  }
];
```

### Essential Components

- **RouterProvider**: Wraps your app and provides routing context
- **Outlet**: Renders nested route components
- **Link**: Navigation without page reload
- **Form**: Handles form submissions to actions
- **NavLink**: Enhanced Link with active state styling

## Data Router Pattern

### Understanding Loaders

Loaders fetch data before rendering components:

```tsx
async function postsLoader() {
  const response = await fetch('/api/posts');
  if (!response.ok) throw new Response('Not Found', { status: 404 });
  return response.json();
}

function Posts() {
  const posts = useLoaderData();
  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

### Route Parameters

```tsx
async function postDetailLoader({ params }) {
  const { postId } = params;
  const response = await fetch(`/api/posts/${postId}`);
  if (!response.ok) throw new Response('Not Found', { status: 404 });
  return response.json();
}

function PostDetail() {
  const post = useLoaderData();
  return <h1>{post.title}</h1>;
}
```

### Parallel Data Loading

```tsx
async function layoutLoader() {
  const [user, settings] = await Promise.all([
    fetch('/api/user').then(r => r.json()),
    fetch('/api/settings').then(r => r.json())
  ]);
  return { user, settings };
}
```

## Navigation & Links

### Basic Navigation

```tsx
import { Link, useNavigate } from 'react-router-dom';

function Navigation() {
  const navigate = useNavigate();

  return (
    <nav>
      <Link to="/">Home</Link>
      <Link to="/about">About</Link>
      
      <button onClick={() => navigate('/posts')}>
        View Posts
      </button>
      
      <button onClick={() => navigate(-1)}>
        Go Back
      </button>
    </nav>
  );
}
```

### NavLink with Active Styling

```tsx
import { NavLink } from 'react-router-dom';

function Navigation() {
  return (
    <nav>
      <NavLink
        to="/"
        className={({ isActive }) => isActive ? 'active' : ''}
      >
        Home
      </NavLink>
      
      <NavLink
        to="/posts"
        style={({ isActive }) => ({
          color: isActive ? 'blue' : 'gray'
        })}
      >
        Posts
      </NavLink>
    </nav>
  );
}
```

### Relative Navigation

```tsx
function Sidebar() {
  return (
    <nav>
      <Link to="settings">Settings</Link>
      <Link to="..">Parent Route</Link>
      <Link to="../sibling">Sibling Route</Link>
    </nav>
  );
}
```

## Loaders & Data Fetching

### Loader with Error Handling

```tsx
async function userLoader({ params }) {
  try {
    const response = await fetch(`/api/users/${params.userId}`);
    
    if (response.status === 404) {
      throw new Response('User Not Found', { status: 404 });
    }
    
    if (!response.ok) {
      throw new Response('Server Error', { status: 500 });
    }
    
    return response.json();
  } catch (error) {
    throw new Response('Failed to load user', { status: 500 });
  }
}
```

### Accessing Loader Data

```tsx
import { useLoaderData, useParams } from 'react-router-dom';

function UserProfile() {
  const user = useLoaderData();
  const { userId } = useParams();

  return (
    <div>
      <h1>{user.name}</h1>
      <p>ID: {userId}</p>
      <p>Email: {user.email}</p>
    </div>
  );
}
```

### Parent Route Data

```tsx
function ChildComponent() {
  const parentData = useRouteLoaderData('parentRouteName');
  const currentData = useLoaderData();

  return (
    <div>
      <p>Parent data: {parentData.title}</p>
      <p>Current data: {currentData.details}</p>
    </div>
  );
}

// In route config, add id to parent route:
const route = {
  id: 'parentRouteName',
  path: '/parent',
  element: <ParentComponent />,
  loader: parentLoader,
  children: [{
    path: 'child',
    element: <ChildComponent />
  }]
};
```

## Actions & Form Handling

### Basic Action

```tsx
import { Form, useActionData } from 'react-router-dom';

async function createPostAction({ request }) {
  const formData = await request.formData();
  const title = formData.get('title');
  const content = formData.get('content');

  const response = await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content })
  });

  if (!response.ok) {
    return { error: 'Failed to create post' };
  }

  const newPost = await response.json();
  return redirect(`/posts/${newPost.id}`);
}

function CreatePost() {
  const actionData = useActionData();

  return (
    <Form method="post">
      <input name="title" required />
      <textarea name="content" required />
      <button type="submit">Create Post</button>

      {actionData?.error && (
        <p className="error">{actionData.error}</p>
      )}
    </Form>
  );
}
```

### Form with Loader Data

```tsx
async function updatePostAction({ request, params }) {
  const formData = await request.formData();
  
  const response = await fetch(`/api/posts/${params.postId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: formData.get('title'),
      content: formData.get('content')
    })
  });

  return redirect(`/posts/${params.postId}`);
}

function EditPost() {
  const post = useLoaderData();
  const actionData = useActionData();

  return (
    <Form method="post">
      <input name="title" defaultValue={post.title} />
      <textarea name="content" defaultValue={post.content} />
      <button type="submit">Save</button>
    </Form>
  );
}
```

### Optimistic UI

```tsx
function FavoriteButton({ postId, isFavorited }) {
  const fetcher = useFetcher();
  
  // Use optimistic state during submission
  const optimisticFavorited = fetcher.formData
    ? fetcher.formData.get('isFavorited') === 'false'
    : isFavorited;

  return (
    <fetcher.Form method="post" action="/api/favorite">
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="isFavorited" value={isFavorited} />
      
      <button type="submit">
        {optimisticFavorited ? '★ Favorited' : '☆ Favorite'}
      </button>
    </fetcher.Form>
  );
}
```

## Error Handling

### Error Boundaries

```tsx
function errorBoundary({ error }) {
  return (
    <div>
      <h1>Oops!</h1>
      <p>{error.statusText || error.message}</p>
    </div>
  );
}

const routes = [
  {
    path: '/',
    element: <Root />,
    errorElement: <RootError />,
    children: [
      {
        path: 'posts/:postId',
        element: <PostDetail />,
        loader: postDetailLoader,
        errorElement: <PostError />
      }
    ]
  }
];
```

### Handling Different Error Types

```tsx
import { isRouteErrorResponse, useRouteError } from 'react-router-dom';

function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <h1>{error.status}</h1>
        <p>{error.statusText}</p>
        {error.data?.message && <p>{error.data.message}</p>}
      </div>
    );
  }

  if (error instanceof Error) {
    return (
      <div>
        <h1>Error</h1>
        <p>{error.message}</p>
      </div>
    );
  }

  return <h1>Unknown Error</h1>;
}
```

### Throwing Errors in Loaders

```tsx
async function postLoader({ params }) {
  const response = await fetch(`/api/posts/${params.postId}`);
  
  if (response.status === 404) {
    throw new Response('Post not found', { status: 404 });
  }
  
  if (!response.ok) {
    throw new Error('Failed to load post');
  }
  
  return response.json();
}
```

## Advanced Patterns

### Deferred Data with Suspense

```tsx
import { defer, Await } from 'react-router-dom';
import { Suspense } from 'react';

async function dashboardLoader() {
  const user = await fetch('/api/user').then(r => r.json());
  
  const statsPromise = fetch('/api/stats').then(r => r.json());
  const recentPromise = fetch('/api/recent').then(r => r.json());

  return defer({
    user,
    stats: statsPromise,
    recent: recentPromise
  });
}

function Dashboard() {
  const { user, stats, recent } = useLoaderData();

  return (
    <div>
      <h1>Welcome {user.name}</h1>

      <Suspense fallback={<div>Loading stats...</div>}>
        <Await resolve={stats}>
          {resolvedStats => (
            <div>
              <h2>Statistics</h2>
              <p>Total: {resolvedStats.total}</p>
            </div>
          )}
        </Await>
      </Suspense>

      <Suspense fallback={<div>Loading recent...</div>}>
        <Await resolve={recent}>
          {resolvedRecent => (
            <ul>
              {resolvedRecent.map(item => (
                <li key={item.id}>{item.title}</li>
              ))}
            </ul>
          )}
        </Await>
      </Suspense>
    </div>
  );
}
```

### Multiple Outlets

```tsx
function Layout() {
  return (
    <div>
      <header><Outlet /></header>
      <main><Outlet /></main>
      <footer><Outlet /></footer>
    </div>
  );
}

// Route config with named outlets
const routes = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      {
        path: 'nested',
        element: <NestedLayout />,
        children: [/* ... */]
      }
    ]
  }
];
```

### Fetcher for Background Mutations

```tsx
function Newsletter() {
  const fetcher = useFetcher();
  const [email, setEmail] = React.useState('');

  return (
    <fetcher.Form method="post" action="/api/subscribe">
      <input
        name="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <button type="submit">Subscribe</button>

      {fetcher.state === 'loading' && <p>Subscribing...</p>}
      {fetcher.data?.success && <p>Subscribed!</p>}
    </fetcher.Form>
  );
}
```

## Hooks Reference

### useLoaderData()

Access data from parent route loaders:

```tsx
const data = useLoaderData();
```

### useActionData()

Access data returned from form actions:

```tsx
const actionData = useActionData();
```

### useParams()

Extract URL parameters:

```tsx
const { postId } = useParams();
```

### useSearchParams()

Manage query string parameters:

```tsx
const [searchParams, setSearchParams] = useSearchParams();

const query = searchParams.get('q');
setSearchParams({ q: 'new value' });
```

### useNavigation()

Track navigation state:

```tsx
const navigation = useNavigation();

if (navigation.state === 'loading') {
  return <div>Loading...</div>;
}
```

### useFetcher()

Non-navigational mutations:

```tsx
const fetcher = useFetcher();

return (
  <fetcher.Form method="post" action="/api/update">
    {/* form fields */}
  </fetcher.Form>
);
```

### useNavigate()

Programmatic navigation:

```tsx
const navigate = useNavigate();

navigate('/posts');
navigate(-1); // Go back
```

### useRevalidator()

Manually revalidate loader data:

```tsx
const revalidator = useRevalidator();

const handleRefresh = () => {
  revalidator.revalidate();
};
```

### useRouteError()

Access errors in error boundaries:

```tsx
const error = useRouteError();
```

### useBlocker()

Prevent navigation with confirmation:

```tsx
const blocker = useBlocker(({currentLocation, nextLocation}) =>
  isDirty && currentLocation.pathname !== nextLocation.pathname
);

if (blocker.state === 'blocked') {
  return (
    <div>
      <p>Leave page?</p>
      <button onClick={() => blocker.proceed()}>Yes</button>
      <button onClick={() => blocker.reset()}>No</button>
    </div>
  );
}
```

## Best Practices

### 1. Organize Routes Logically

```tsx
// routes/index.ts
export const routes = [
  {
    path: '/',
    element: <Root />,
    children: [
      { index: true, element: <Home /> },
      {
        path: 'posts',
        element: <PostsLayout />,
        children: postRoutes
      },
      {
        path: 'admin',
        element: <AdminLayout />,
        children: adminRoutes,
        loader: requireAdmin
      }
    ]
  }
];
```

### 2. Share Loaders Across Routes

```tsx
// loaders/posts.ts
export async function postsLoader() {
  return fetch('/api/posts').then(r => r.json());
}

export async function postDetailLoader({ params }) {
  return fetch(`/api/posts/${params.postId}`).then(r => r.json());
}
```

### 3. Centralize Error Handling

```tsx
// components/ErrorBoundary.tsx
export function ErrorBoundary() {
  const error = useRouteError();

  const status = isRouteErrorResponse(error) ? error.status : 500;
  const message = isRouteErrorResponse(error)
    ? error.statusText
    : 'Unexpected error';

  return (
    <div className="error-page">
      <h1>{status}</h1>
      <p>{message}</p>
      <Link to="/">Go Home</Link>
    </div>
  );
}
```

### 4. Use Relative Links

```tsx
// Good
<Link to="settings">Go to settings</Link>

// Avoid
<Link to="/user/123/settings">Go to settings</Link>
```

### 5. Lazy Load Routes

```tsx
const routes = [
  {
    path: '/',
    element: <Root />,
    children: [
      { index: true, element: <Home /> },
      {
        path: 'admin',
        lazy: async () => {
          const { AdminLayout } = await import('./routes/admin');
          return { Component: AdminLayout };
        }
      }
    ]
  }
];
```

### 6. Revalidate After Actions

```tsx
async function createPostAction({ request }) {
  await fetch('/api/posts', {
    method: 'POST',
    body: await request.formData()
  });

  // Data will automatically revalidate
  return redirect('/posts');
}
```

## Conclusion

React Router v7 provides a modern approach to routing with emphasis on data handling, type safety, and developer experience. The loader/action pattern eliminates waterfalls, the Fetcher API enables optimistic UI, and error boundaries provide robust error handling. Following these patterns ensures scalable, maintainable routing implementations.
