# Firebase Documentation

Firebase is a comprehensive app development platform by Google providing authentication, real-time database (Firestore), storage, cloud functions, analytics, and more.

## Version: Latest (Firebase SDK 9+)

## Setup

### Installation
```bash
npm install firebase
```

### Initialize Firebase
```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

## Authentication

### Create User with Email/Password
```typescript
import { createUserWithEmailAndPassword } from 'firebase/auth';

const { user } = await createUserWithEmailAndPassword(
  auth,
  'user@example.com',
  'password123'
);
```

### Sign In with Email/Password
```typescript
import { signInWithEmailAndPassword } from 'firebase/auth';

const { user } = await signInWithEmailAndPassword(
  auth,
  'user@example.com',
  'password123'
);
```

### Sign In with Google
```typescript
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

const provider = new GoogleAuthProvider();
const { user } = await signInWithPopup(auth, provider);
```

### Sign Out
```typescript
import { signOut } from 'firebase/auth';

await signOut(auth);
```

### Get Current User
```typescript
import { onAuthStateChanged } from 'firebase/auth';

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('User logged in:', user.uid);
  } else {
    console.log('User logged out');
  }
});
```

### Update User Profile
```typescript
import { updateProfile } from 'firebase/auth';

await updateProfile(auth.currentUser, {
  displayName: 'John Doe',
  photoURL: 'https://example.com/avatar.jpg',
});
```

## Firestore Database

### Add Document
```typescript
import { collection, addDoc } from 'firebase/firestore';

const { id } = await addDoc(collection(db, 'messages'), {
  text: 'Hello, world!',
  userId: currentUser.uid,
  timestamp: new Date(),
});
```

### Set Document (Create or Overwrite)
```typescript
import { doc, setDoc } from 'firebase/firestore';

await setDoc(doc(db, 'users', userId), {
  displayName: 'John',
  email: 'john@example.com',
  createdAt: new Date(),
});
```

### Get Document
```typescript
import { doc, getDoc } from 'firebase/firestore';

const docSnap = await getDoc(doc(db, 'users', userId));

if (docSnap.exists()) {
  console.log('Document data:', docSnap.data());
} else {
  console.log('No such document!');
}
```

### Query Documents
```typescript
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';

const q = query(
  collection(db, 'messages'),
  where('userId', '==', currentUser.uid),
  orderBy('timestamp', 'desc')
);

const querySnapshot = await getDocs(q);
querySnapshot.forEach((doc) => {
  console.log(doc.id, ':', doc.data());
});
```

### Update Document
```typescript
import { doc, updateDoc } from 'firebase/firestore';

await updateDoc(doc(db, 'users', userId), {
  lastSeen: new Date(),
});
```

### Delete Document
```typescript
import { doc, deleteDoc } from 'firebase/firestore';

await deleteDoc(doc(db, 'messages', messageId));
```

### Real-time Listener
```typescript
import { collection, query, onSnapshot } from 'firebase/firestore';

const q = query(collection(db, 'messages'));

const unsubscribe = onSnapshot(q, (querySnapshot) => {
  const messages = [];
  querySnapshot.forEach((doc) => {
    messages.push({ id: doc.id, ...doc.data() });
  });
  console.log('Messages updated:', messages);
});

// Unsubscribe when component unmounts
return () => unsubscribe();
```

## Cloud Storage

### Upload File
```typescript
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const file = e.target.files[0];
const storageRef = ref(storage, `uploads/${currentUser.uid}/${file.name}`);

const snapshot = await uploadBytes(storageRef, file);
const downloadURL = await getDownloadURL(snapshot.ref);
console.log('File available at:', downloadURL);
```

### Download File
```typescript
import { ref, getBytes } from 'firebase/storage';

const fileRef = ref(storage, 'path/to/file.pdf');
const bytes = await getBytes(fileRef);
```

### Get Download URL
```typescript
import { ref, getDownloadURL } from 'firebase/storage';

const fileRef = ref(storage, 'path/to/file.jpg');
const url = await getDownloadURL(fileRef);
```

### Delete File
```typescript
import { ref, deleteObject } from 'firebase/storage';

const fileRef = ref(storage, 'path/to/file.jpg');
await deleteObject(fileRef);
```

## Cloud Functions

### Call Cloud Function
```typescript
import { httpsCallable } from 'firebase/functions';
import { getFunctions } from 'firebase/functions';

const functions = getFunctions();
const sendEmail = httpsCallable(functions, 'sendEmail');

const result = await sendEmail({
  to: 'user@example.com',
  subject: 'Welcome!',
  body: 'Thanks for signing up!',
});
```

### Example Cloud Function (Node.js)
```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const sendEmail = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const { to, subject, body } = data;

  // Send email logic
  // await sendEmailService(to, subject, body);

  return { success: true };
});
```

## Realtime Database

### Write Data
```typescript
import { ref as dbRef, set } from 'firebase/database';
import { getDatabase } from 'firebase/database';

const db = getDatabase();
const usersRef = dbRef(db, 'users/' + userId);

await set(usersRef, {
  displayName: 'John',
  email: 'john@example.com',
});
```

### Read Data
```typescript
import { ref as dbRef, onValue } from 'firebase/database';

const usersRef = dbRef(db, 'users/' + userId);

onValue(usersRef, (snapshot) => {
  const data = snapshot.val();
  console.log('User data:', data);
});
```

## Otagon Project Integration

```typescript
// Example: Save chat message to Firestore
async function sendChatMessage(conversationId: string, message: string) {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const docRef = await addDoc(
      collection(db, 'conversations', conversationId, 'messages'),
      {
        text: message,
        userId: user.uid,
        displayName: user.displayName,
        timestamp: new Date(),
        readBy: [user.uid],
      }
    );

    return docRef.id;
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

// Example: Subscribe to conversation messages
function useConversationMessages(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(newMessages);
    });

    return () => unsubscribe();
  }, [conversationId]);

  return messages;
}

// Example: Upload user avatar
async function uploadUserAvatar(file: File) {
  const user = auth.currentUser;
  if (!user) return;

  const fileRef = ref(storage, `avatars/${user.uid}/profile`);
  const snapshot = await uploadBytes(fileRef, file);
  const photoURL = await getDownloadURL(snapshot.ref);

  await updateProfile(user, { photoURL });
  return photoURL;
}
```

## Security Rules

### Firestore Rules Example
```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Allow users to read/write messages in their conversations
    match /conversations/{conversationId}/messages/{messageId} {
      allow read: if request.auth.uid in resource.data.readBy;
      allow create: if request.auth.uid == request.resource.data.userId;
    }

    // Public read access
    match /public/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Best Practices

1. **Use authentication** - Always verify users before accessing data
2. **Security rules first** - Define rules before storing sensitive data
3. **Denormalize data** - Firebase works best with denormalized data structures
4. **Use real-time listeners** - But unsubscribe when components unmount
5. **Batch operations** - Use batch writes for multiple document updates
6. **Index queries** - Firebase auto-indexes, but verify performance
7. **Limit query results** - Use limit() to avoid large data transfers

## Resources

- [Firebase Docs](https://firebase.google.com/docs)
- [Firestore Reference](https://firebase.google.com/docs/firestore)

## Related Documentation

- [Supabase](./SUPABASE.md) - Alternative backend service
- [React](./REACT.md) - Integration patterns
