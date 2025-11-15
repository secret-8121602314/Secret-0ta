# Supabase Documentation

Supabase is an open-source Firebase alternative providing PostgreSQL database, authentication, real-time subscriptions, edge functions, and vector storage.

## Version: 2.58.0

## Setup

### Installation
```bash
npm install @supabase/supabase-js
```

### Initialize Client
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

## Authentication

### Email/Password Sign-up
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
  options: {
    data: {
      display_name: 'John Doe',
    },
  },
});

if (error) console.error('Sign up error:', error);
if (data.user) console.log('User created:', data.user);
```

### Email/Password Sign-in
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
});

if (error) console.error('Sign in error:', error);
if (data.session) console.log('Logged in successfully');
```

### OAuth Sign-in (Google)
```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
  },
});
```

### Sign Out
```typescript
const { error } = await supabase.auth.signOut();
```

### Get Current Session
```typescript
const { data: { session }, error } = await supabase.auth.getSession();
```

### Auth State Listener
```typescript
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  (event, session) => {
    console.log('Auth event:', event);
    console.log('Current session:', session);
  }
);

// Remember to unsubscribe
return () => subscription?.unsubscribe();
```

## Database Operations

### Select Data
```typescript
// Fetch all records
const { data, error } = await supabase
  .from('users')
  .select('*');

// Fetch with filter
const { data, error } = await supabase
  .from('messages')
  .select('*')
  .eq('room_id', roomId)
  .order('created_at', { ascending: false })
  .limit(50);

// Fetch specific columns
const { data, error } = await supabase
  .from('users')
  .select('id, email, display_name');
```

### Insert Data
```typescript
const { data, error } = await supabase
  .from('messages')
  .insert([
    {
      room_id: roomId,
      user_id: userId,
      content: 'Hello, world!',
      created_at: new Date(),
    },
  ]);
```

### Update Data
```typescript
const { data, error } = await supabase
  .from('users')
  .update({ display_name: 'New Name' })
  .eq('id', userId);
```

### Delete Data
```typescript
const { error } = await supabase
  .from('messages')
  .delete()
  .eq('id', messageId);
```

### Upsert (Insert or Update)
```typescript
const { data, error } = await supabase
  .from('user_preferences')
  .upsert({
    user_id: userId,
    theme: 'dark',
    language: 'en',
  }, {
    onConflict: 'user_id',
  });
```

## Real-time Subscriptions

### Subscribe to Changes
```typescript
const channel = supabase
  .channel(`messages:${roomId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `room_id=eq.${roomId}`,
    },
    (payload) => {
      console.log('New message:', payload.new);
      setMessages(prev => [...prev, payload.new]);
    }
  )
  .subscribe();

// Unsubscribe
channel.unsubscribe();
```

### Real-time Events
```typescript
supabase
  .channel(`room:${roomId}`)
  .on(
    'postgres_changes',
    {
      event: '*', // All events: INSERT, UPDATE, DELETE
      schema: 'public',
      table: 'messages',
    },
    (payload) => {
      if (payload.eventType === 'INSERT') {
        // New message added
      } else if (payload.eventType === 'UPDATE') {
        // Message updated
      } else if (payload.eventType === 'DELETE') {
        // Message deleted
      }
    }
  )
  .subscribe();
```

### Presence (User Activity)
```typescript
const channel = supabase.channel(`room:${roomId}:presence`);

channel.on('presence', { event: 'sync' }, () => {
  const state = channel.presenceState();
  console.log('Users in room:', state);
});

channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
  console.log('User joined:', newPresences);
});

channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
  console.log('User left:', leftPresences);
});

await channel.subscribe();

// Broadcast presence
await channel.track({
  user_id: userId,
  name: displayName,
  status: 'online',
});
```

## Storage (File Upload)

### Upload File
```typescript
const file = e.target.files[0];
const fileName = `${Date.now()}_${file.name}`;

const { data, error } = await supabase.storage
  .from('avatars')
  .upload(fileName, file);

if (error) console.error('Upload error:', error);
if (data) console.log('File uploaded:', data.path);
```

### Download File
```typescript
const { data, error } = await supabase.storage
  .from('avatars')
  .download(filePath);

if (data) {
  const url = URL.createObjectURL(data);
  // Use url for download
}
```

### Get Public URL
```typescript
const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl(filePath);

console.log('Public URL:', data.publicUrl);
```

### Delete File
```typescript
const { error } = await supabase.storage
  .from('avatars')
  .remove([filePath]);
```

## Edge Functions

### Create Edge Function
```typescript
// supabase/functions/hello/index.ts
Deno.serve(async (req) => {
  const { name } = await req.json();
  
  return new Response(
    JSON.stringify({ message: `Hello, ${name}!` }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
```

### Call Edge Function
```typescript
const { data, error } = await supabase.functions.invoke('hello', {
  body: { name: 'World' },
});

console.log(data); // { message: 'Hello, World!' }
```

## Vector Embeddings

### Store Vectors
```typescript
const { data, error } = await supabase
  .from('documents')
  .insert({
    title: 'Document Title',
    content: 'Document content...',
    embedding: [0.1, 0.2, 0.3], // Generated from AI model
  });
```

### Similarity Search
```typescript
const { data, error } = await supabase.rpc('match_documents', {
  query_embedding: [0.1, 0.2, 0.3],
  match_threshold: 0.78,
  match_count: 10,
});
```

## RLS (Row Level Security)

### Enable RLS on Table
```sql
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own messages
CREATE POLICY "Users can read their own messages"
ON messages FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can only insert their own messages
CREATE POLICY "Users can insert their own messages"
ON messages FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### Verify Current User
```typescript
const { data: { user }, error } = await supabase.auth.getUser();
```

## Otagon Project Integration

```typescript
// Example: Chat message persistence
async function sendMessage(roomId: string, content: string) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return;

  const { data, error } = await supabase
    .from('messages')
    .insert({
      room_id: roomId,
      user_id: user.id,
      content,
      created_at: new Date(),
    });

  if (error) {
    console.error('Failed to send message:', error);
    return;
  }

  return data[0];
}

// Example: Subscribe to messages
function useMessagesSubscription(roomId: string) {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    // Initial fetch
    supabase
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .then(({ data }) => setMessages(data || []));

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => channel.unsubscribe();
  }, [roomId]);

  return messages;
}
```

## Best Practices

1. **Enable RLS** - Always secure your tables with Row Level Security
2. **Use transactions** - Group related operations together
3. **Index frequently queried columns** - Improve query performance
4. **Avoid N+1 queries** - Use select with relationships
5. **Handle errors gracefully** - Always check error responses
6. **Validate input** - Sanitize user input before database operations
7. **Use type safety** - Generate types from your schema

## Resources

- [Supabase Docs](https://supabase.com/docs)
- [Supabase API Reference](https://supabase.com/docs/reference)

## Related Documentation

- [Firebase](./FIREBASE.md) - Alternative backend service
- [TypeScript](./TYPESCRIPT.md) - Type safety
