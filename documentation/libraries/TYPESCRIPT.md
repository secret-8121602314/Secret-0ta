# TypeScript Documentation

TypeScript is a superset of JavaScript that adds static types, enabling developers to build more robust and scalable applications.

## Version: 5.6.2

## Configuration

TypeScript is configured in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## Basic Types

### Primitives
```typescript
let name: string = "Alice";
let age: number = 30;
let active: boolean = true;
let nothing: null = null;
let unknown: undefined = undefined;
```

### Complex Types
```typescript
// Array
let numbers: number[] = [1, 2, 3];
let items: Array<string> = ["a", "b"];

// Union
let value: string | number = "hello";

// Any (avoid when possible)
let anything: any = "anything";

// Unknown (safer than any)
let unknownValue: unknown = "value";
if (typeof unknownValue === "string") {
  console.log(unknownValue.toUpperCase());
}
```

## Interfaces and Types

### Interfaces
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  age?: number; // Optional property
  readonly createdAt: Date; // Readonly
}

// Extending interfaces
interface Admin extends User {
  role: 'admin';
  permissions: string[];
}

// Function interface
interface GreetFunction {
  (name: string): string;
}

const greet: GreetFunction = (name) => `Hello, ${name}!`;
```

### Type Aliases
```typescript
type Status = 'active' | 'inactive' | 'pending';
type Age = number;
type Point = { x: number; y: number };

// Union types
type Result<T> = { success: true; data: T } | { success: false; error: string };
```

### Difference Between Interface and Type
- Interfaces can be merged; types cannot
- Interfaces are for objects; types can be anything
- Use interfaces for class contracts, types for data structures

## Functions

### Basic Function Typing
```typescript
// Parameter and return types
function add(a: number, b: number): number {
  return a + b;
}

// Arrow functions
const multiply = (a: number, b: number): number => a * b;

// Optional parameters
function greet(name: string, greeting?: string): string {
  return `${greeting || 'Hello'}, ${name}!`;
}

// Default parameters
function repeat(text: string, count: number = 1): string {
  return text.repeat(count);
}

// Rest parameters
function sum(...numbers: number[]): number {
  return numbers.reduce((a, b) => a + b, 0);
}
```

### Function Overloading
```typescript
function format(value: string): string;
function format(value: number): string;
function format(value: string | number): string {
  return String(value);
}
```

## Generics

### Generic Types
```typescript
// Generic interface
interface Box<T> {
  value: T;
  getValue(): T;
  setValue(value: T): void;
}

// Generic function
function getFirst<T>(arr: T[]): T | undefined {
  return arr[0];
}

// Generic constraints
function merge<T extends object>(obj1: T, obj2: T): T {
  return { ...obj1, ...obj2 };
}

// Usage
const stringBox: Box<string> = {
  value: "hello",
  getValue() { return this.value; },
  setValue(value) { this.value = value; }
};
```

## React with TypeScript

### Component Typing
```typescript
import React from 'react';

interface Props {
  name: string;
  age: number;
  onUpdate?: (age: number) => void;
}

interface State {
  count: number;
}

// Functional component
const Person: React.FC<Props> = ({ name, age, onUpdate }) => {
  return (
    <div>
      <p>Name: {name}</p>
      <p>Age: {age}</p>
      {onUpdate && <button onClick={() => onUpdate(age + 1)}>Grow</button>}
    </div>
  );
};

// Using hooks
import { useState, useEffect } from 'react';

function Counter() {
  const [count, setCount] = useState<number>(0);
  
  useEffect(() => {
    // Effect logic
  }, [count]);

  return <div>Count: {count}</div>;
}
```

### Event Typing
```typescript
function Form() {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Handle click
  };

  return (
    <form onSubmit={handleSubmit}>
      <input onChange={handleChange} />
      <button onClick={handleClick}>Submit</button>
    </form>
  );
}
```

## Enums

```typescript
// String enum
enum Status {
  Active = "active",
  Inactive = "inactive",
  Pending = "pending"
}

// Numeric enum
enum Direction {
  Up = 1,
  Down = 2,
  Left = 3,
  Right = 4
}

// Const enum (better performance)
const enum Color {
  Red = "red",
  Green = "green",
  Blue = "blue"
}

// Usage
let status: Status = Status.Active;
let direction: Direction = Direction.Up;
```

## Advanced Types

### Conditional Types
```typescript
type IsString<T> = T extends string ? true : false;

type A = IsString<"hello">; // true
type B = IsString<number>; // false
```

### Utility Types
```typescript
// Partial - all properties optional
type PartialUser = Partial<User>;

// Required - all properties required
type RequiredUser = Required<User>;

// Readonly - all properties readonly
type ReadonlyUser = Readonly<User>;

// Pick - select specific properties
type UserPreview = Pick<User, 'name' | 'email'>;

// Omit - exclude specific properties
type UserWithoutEmail = Omit<User, 'email'>;

// Record - map properties to type
type UserRoles = Record<'admin' | 'user' | 'guest', User>;

// Parameters - get function parameters
type GetParams = Parameters<(a: string, b: number) => void>; // [string, number]

// ReturnType - get function return type
type GetReturn = ReturnType<() => string>; // string
```

## Error Handling

```typescript
// Union with error type
type Result<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
};

async function fetchUser(id: string): Promise<Result<User>> {
  try {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) {
      return { success: false, error: 'Not found' };
    }
    const user = await response.json();
    return { success: true, data: user };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// Usage
const result = await fetchUser('123');
if (result.success) {
  console.log(result.data.name);
} else {
  console.error(result.error);
}
```

## Best Practices

1. **Always specify types** - Avoid implicit `any`
2. **Use strict mode** - Enable all strict compiler options
3. **Leverage inference** - TypeScript can infer many types
4. **Use interfaces for contracts** - For class and object structure
5. **Use types for data** - For unions and complex types
6. **Prefer `unknown` over `any`** - More type-safe
7. **Use const assertions** - For literal types: `as const`
8. **Document complex types** - Use JSDoc comments

## Common Issues

### "Cannot find module" error
- Verify import path
- Check tsconfig.json paths configuration
- Ensure file exists

### Implicit any
- Add explicit type annotation
- Enable `noImplicitAny` in tsconfig.json

### Type mismatch errors
- Check property names and types
- Use type guards for narrowing
- Implement proper generic constraints

## Type Checking

```bash
# Type check without building
npm run type-check

# Watch mode for continuous checking
npx tsc --watch --noEmit
```

## Debugging TypeScript

```typescript
// Hover type hint
const result = someFunction(); // Shows inferred type

// Explicit type checking
type IsAny = any extends 0 ? true : false; // Useful for debugging

// Debug utility type
type Debug<T> = T extends any[] ? 'array' : 'not array';
```

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TypeScript Playground](https://www.typescriptlang.org/play)
- [DefinitelyTyped](https://definitelytyped.org/) - Type definitions
- [tsconfig Reference](https://www.typescriptlang.org/tsconfig)

## Otagon-Specific Usage

The project uses TypeScript with:
- Strict mode enabled
- Path aliases via `@/`
- React with hooks and functional components
- Supabase and Firebase type definitions
- React Router for typed routing
