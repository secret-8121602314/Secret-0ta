# React Documentation

React is a JavaScript library for building user interfaces with reusable components, hooks for state and side effects, and a virtual DOM for efficient rendering.

## Version: 18.3.1

## Core Concepts

### Components
React applications are built from components - reusable pieces of UI that return JSX.

```jsx
// Functional component
export default function App() {
  return (
    <div>
      <h1>Hello React</h1>
      <Counter />
    </div>
  );
}

// Component with props
function Greeting({ name, age }) {
  return <p>Hello, {name}! You are {age} years old.</p>;
}
```

### Hooks

#### useState - Manage Component State
```jsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

#### useEffect - Side Effects
```jsx
import { useEffect } from 'react';

function DataFetcher() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      });
  }, []); // Empty dependency array runs once on mount

  if (loading) return <p>Loading...</p>;
  return <div>{JSON.stringify(data)}</div>;
}
```

#### useContext - Global State
```jsx
import { createContext, useContext } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
```

#### useReducer - Complex State Logic
```jsx
import { useReducer } from 'react';

function reducer(state, action) {
  switch (action.type) {
    case 'INCREMENT':
      return { count: state.count + 1 };
    case 'DECREMENT':
      return { count: state.count - 1 };
    case 'RESET':
      return { count: 0 };
    default:
      return state;
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, { count: 0 });

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => dispatch({ type: 'INCREMENT' })}>+</button>
      <button onClick={() => dispatch({ type: 'DECREMENT' })}>-</button>
      <button onClick={() => dispatch({ type: 'RESET' })}>Reset</button>
    </div>
  );
}
```

#### useCallback - Memoize Functions
```jsx
import { useCallback } from 'react';

function Parent() {
  const [count, setCount] = useState(0);

  // This function is only recreated when dependencies change
  const handleClick = useCallback(() => {
    setCount(c => c + 1);
  }, []);

  return <Child onClick={handleClick} />;
}
```

#### useMemo - Memoize Values
```jsx
import { useMemo } from 'react';

function DataProcessor({ data, filter }) {
  // Expensive computation is memoized
  const processed = useMemo(() => {
    return data.filter(item => item.includes(filter));
  }, [data, filter]);

  return <div>{processed.length} items</div>;
}
```

### Event Handling
```jsx
function Form() {
  const [name, setName] = useState('');

  const handleChange = (e) => {
    setName(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitted:', name);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={name} onChange={handleChange} />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Conditional Rendering
```jsx
function Status({ status }) {
  if (status === 'loading') return <p>Loading...</p>;
  if (status === 'error') return <p>Error occurred</p>;
  return <p>Success!</p>;
}

// Using ternary
<div>{isLoggedIn ? <Dashboard /> : <Login />}</div>

// Using && operator
<div>{showDetails && <Details />}</div>
```

### Lists and Keys
```jsx
function ItemList({ items }) {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

## Best Practices

### Component Structure
- Keep components focused and single-responsibility
- Extract reusable components
- Use composition over inheritance
- Prop drill minimization with Context when needed

### Performance
- Use React.memo for expensive components
- Implement code splitting with React.lazy
- Avoid unnecessary renders with useMemo/useCallback
- Use DevTools Profiler to identify bottlenecks

### State Management
- Use useState for local component state
- Use Context for cross-component state
- Consider external libraries for complex global state
- Keep state as close as possible to where it's needed

### Error Handling
```jsx
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.error('Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong</h1>;
    }
    return this.props.children;
  }
}
```

## Debugging

### React DevTools
- Install React DevTools browser extension
- Inspect component props and state
- Track component renders
- Profile performance

### Console Methods
```jsx
console.log('Render', { props, state });
console.assert(value > 0, 'Value must be positive');
console.time('operation');
// ... code to measure
console.timeEnd('operation');
```

## Resources

- [Official React.dev](https://react.dev)
- [React API Reference](https://react.dev/reference/react)
- [React Router Guide](./REACT_ROUTER.md) - For navigation
- [TypeScript with React](./TYPESCRIPT.md) - Type safety

## Common Patterns in Otagon

### API Integration
```jsx
import { useEffect, useState } from 'react';

function DataFetcher() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/endpoint');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  return <div>{JSON.stringify(data)}</div>;
}
```

### Form Handling with Validation
```jsx
import { useState } from 'react';

function SignupForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.includes('@')) {
      newErrors.email = 'Invalid email';
    }
    if (formData.password.length < 8) {
      newErrors.password = 'Password too short';
    }
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length === 0) {
      // Submit form
      console.log('Submitting:', formData);
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      />
      {errors.email && <span>{errors.email}</span>}
      <input
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
      />
      {errors.password && <span>{errors.password}</span>}
      <button type="submit">Sign Up</button>
    </form>
  );
}
```

## Key Files in Otagon Project

- `src/components/` - Reusable components
- `src/pages/` - Page components
- `src/hooks/` - Custom hooks
- `src/services/` - API integration
- `src/contexts/` - Context providers

See [ARCHITECTURE.md](../ARCHITECTURE.md) for project structure details.
