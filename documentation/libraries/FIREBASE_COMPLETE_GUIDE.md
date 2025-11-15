# Firebase Complete Developer Guide

Comprehensive guide to Google Firebase platform—a backend-as-a-service (BaaS) offering authentication, real-time databases, cloud storage, serverless functions, and analytics for modern web applications.

## Table of Contents

1. [Firebase Setup](#firebase-setup)
2. [Authentication](#authentication)
3. [Cloud Firestore](#cloud-firestore)
4. [Realtime Database](#realtime-database)
5. [Cloud Storage](#cloud-storage)
6. [Cloud Functions](#cloud-functions)
7. [Cloud Messaging](#cloud-messaging)
8. [Security Rules](#security-rules)
9. [Admin SDK](#admin-sdk)
10. [Local Development](#local-development)
11. [Best Practices](#best-practices)

## Firebase Setup

### Install Firebase SDK

```bash
npm install firebase
```

### Initialize Firebase

```tsx
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

### Environment Configuration

Create `.env.local`:

```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

## Authentication

### Email/Password Authentication

```tsx
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from './firebase';

// Sign up
async function signup(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Signup error:', error.message);
    throw error;
  }
}

// Sign in
async function login(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Login error:', error.message);
    throw error;
  }
}

// Sign out
async function logout() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout error:', error.message);
    throw error;
  }
}
```

### OAuth Authentication

```tsx
import { signInWithPopup, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';

// Google Sign-In
async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error('Google login error:', error.message);
    throw error;
  }
}

// GitHub Sign-In
async function loginWithGitHub() {
  const provider = new GithubAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error('GitHub login error:', error.message);
    throw error;
  }
}
```

### Monitor Auth State

```tsx
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';

function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { user, loading };
}

function App() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  return user ? <Dashboard /> : <LoginPage />;
}
```

### Custom Claims & Tokens

```tsx
// Backend (Admin SDK)
import admin from 'firebase-admin';

admin.auth().setCustomUserClaims(uid, {
  role: 'admin',
  permissions: ['read', 'write']
})
.then(() => {
  console.log('Custom claims set');
});

// Frontend (get token with claims)
const token = await auth.currentUser.getIdTokenResult();
console.log(token.claims);
```

## Cloud Firestore

### Basic Operations

```tsx
import { 
  collection, 
  addDoc, 
  setDoc, 
  getDoc, 
  getDocs,
  deleteDoc,
  updateDoc,
  doc
} from 'firebase/firestore';
import { db } from './firebase';

// Create document (auto ID)
async function createPost(data) {
  try {
    const docRef = await addDoc(collection(db, 'posts'), {
      ...data,
      createdAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating post:', error);
  }
}

// Set document (specified ID, overwrites)
async function setUserProfile(uid, data) {
  try {
    await setDoc(doc(db, 'users', uid), data, { merge: true });
  } catch (error) {
    console.error('Error setting profile:', error);
  }
}

// Get single document
async function getPost(postId) {
  try {
    const docSnap = await getDoc(doc(db, 'posts', postId));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      console.log('No such document');
    }
  } catch (error) {
    console.error('Error getting post:', error);
  }
}

// Get all documents
async function getAllPosts() {
  try {
    const querySnapshot = await getDocs(collection(db, 'posts'));
    const posts = [];
    querySnapshot.forEach((doc) => {
      posts.push({ id: doc.id, ...doc.data() });
    });
    return posts;
  } catch (error) {
    console.error('Error getting posts:', error);
  }
}

// Update document
async function updatePost(postId, updates) {
  try {
    await updateDoc(doc(db, 'posts', postId), updates);
  } catch (error) {
    console.error('Error updating post:', error);
  }
}

// Delete document
async function deletePost(postId) {
  try {
    await deleteDoc(doc(db, 'posts', postId));
  } catch (error) {
    console.error('Error deleting post:', error);
  }
}
```

### Querying Data

```tsx
import { query, where, orderBy, limit, startAfter } from 'firebase/firestore';

// Simple query
async function getPostsByAuthor(authorId) {
  const q = query(
    collection(db, 'posts'),
    where('authorId', '==', authorId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

// Multiple conditions
async function getRecentUserPosts(userId) {
  const q = query(
    collection(db, 'posts'),
    where('userId', '==', userId),
    where('published', '==', true),
    orderBy('createdAt', 'desc'),
    limit(10)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

// Pagination
async function getPostsPage(pageSize, lastVisible) {
  let q;
  
  if (lastVisible) {
    q = query(
      collection(db, 'posts'),
      orderBy('createdAt', 'desc'),
      startAfter(lastVisible),
      limit(pageSize)
    );
  } else {
    q = query(
      collection(db, 'posts'),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );
  }
  
  const querySnapshot = await getDocs(q);
  return {
    posts: querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })),
    lastVisible: querySnapshot.docs[querySnapshot.docs.length - 1]
  };
}
```

### Real-time Listeners

```tsx
import { onSnapshot } from 'firebase/firestore';

// Single document listener
function usePost(postId) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'posts', postId),
      (doc) => {
        if (doc.exists()) {
          setPost({ id: doc.id, ...doc.data() });
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to post:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [postId]);

  return { post, loading };
}

// Collection listener
function usePosts(userId) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'posts'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));
      setLoading(false);
    });

    return unsubscribe;
  }, [userId]);

  return { posts, loading };
}
```

### Transactions

```tsx
import { runTransaction } from 'firebase/firestore';

async function transferPoints(fromUserId, toUserId, points) {
  try {
    await runTransaction(db, async (transaction) => {
      const fromRef = doc(db, 'users', fromUserId);
      const toRef = doc(db, 'users', toUserId);

      const fromSnap = await transaction.get(fromRef);
      const toSnap = await transaction.get(toRef);

      const fromPoints = fromSnap.data().points;
      const toPoints = toSnap.data().points;

      if (fromPoints < points) {
        throw new Error('Insufficient points');
      }

      transaction.update(fromRef, {
        points: fromPoints - points
      });
      transaction.update(toRef, {
        points: toPoints + points
      });
    });
  } catch (error) {
    console.error('Transaction failed:', error);
  }
}
```

### Batch Writes

```tsx
import { writeBatch } from 'firebase/firestore';

async function addPostsInBatch(posts) {
  const batch = writeBatch(db);

  posts.forEach((post, index) => {
    const docRef = doc(collection(db, 'posts'), post.id);
    batch.set(docRef, post);
  });

  await batch.commit();
}
```

## Realtime Database

### Basic Operations

```tsx
import { getDatabase, ref, set, get, update, remove, push } from 'firebase/database';

const rtdb = getDatabase();

// Write data
async function createUser(uid, userData) {
  await set(ref(rtdb, `users/${uid}`), userData);
}

// Read data once
async function getUser(uid) {
  const snapshot = await get(ref(rtdb, `users/${uid}`));
  if (snapshot.exists()) {
    return snapshot.val();
  } else {
    console.log('No data available');
  }
}

// Push (auto-generated keys)
async function addMessage(text) {
  const newMessageRef = push(ref(rtdb, 'messages'));
  await set(newMessageRef, {
    text,
    timestamp: Date.now(),
    likes: 0
  });
}

// Update multiple locations
async function incrementLikes(messageId) {
  const updates = {};
  updates[`/messages/${messageId}/likes`] = increment(1);
  await update(ref(rtdb), updates);
}

// Delete
async function deleteMessage(messageId) {
  await remove(ref(rtdb, `messages/${messageId}`));
}
```

### Real-time Listeners

```tsx
import { onValue, off } from 'firebase/database';

// Real-time listener
onValue(ref(rtdb, 'messages'), (snapshot) => {
  const messages = [];
  snapshot.forEach((childSnapshot) => {
    messages.push({
      id: childSnapshot.key,
      ...childSnapshot.val()
    });
  });
  console.log(messages);
});

// React hook
function useMessages() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const messagesRef = ref(rtdb, 'messages');
    
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = [];
      snapshot.forEach((child) => {
        data.push({ id: child.key, ...child.val() });
      });
      setMessages(data);
    });

    return () => off(messagesRef);
  }, []);

  return messages;
}
```

## Cloud Storage

### Upload Files

```tsx
import { getStorage, ref, uploadBytes, uploadBytesResumable } from 'firebase/storage';

const storage = getStorage();

// Simple upload
async function uploadProfilePicture(uid, file) {
  try {
    const storageRef = ref(storage, `profile-pictures/${uid}`);
    const result = await uploadBytes(storageRef, file);
    return result.metadata.fullPath;
  } catch (error) {
    console.error('Upload error:', error);
  }
}

// Upload with progress
function uploadWithProgress(file, onProgress) {
  const storageRef = ref(storage, `uploads/${file.name}`);
  
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(progress);
      },
      (error) => {
        reject(error);
      },
      () => {
        resolve(uploadTask.snapshot.ref.fullPath);
      }
    );
  });
}
```

### Download Files

```tsx
import { getDownloadURL } from 'firebase/storage';

async function getDownloadLink(path) {
  try {
    const url = await getDownloadURL(ref(storage, path));
    return url;
  } catch (error) {
    console.error('Error getting download URL:', error);
  }
}
```

## Cloud Functions

### Deploy Functions

```bash
npm install -g firebase-tools
firebase init functions
```

### Create Functions

```typescript
// functions/src/index.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// HTTP function
export const sendWelcomeEmail = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const { email, name } = data;

    // Send email logic
    console.log(`Sending welcome email to ${email}`);

    return { message: 'Email sent successfully' };
  }
);

// Firestore trigger
export const createUserProfile = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snap, context) => {
    const userData = snap.data();
    console.log(`Creating profile for user ${context.params.userId}`);
  });

// Scheduled function
export const cleanupOldPosts = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    // Delete old posts
  });
```

### Call Cloud Functions

```tsx
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

async function sendWelcomeEmail(name, email) {
  const sendEmail = httpsCallable(functions, 'sendWelcomeEmail');
  
  try {
    const result = await sendEmail({ name, email });
    console.log('Result:', result.data);
  } catch (error) {
    console.error('Function error:', error);
  }
}
```

## Cloud Messaging

### Enable Notifications

```tsx
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const messaging = getMessaging();

async function requestNotificationPermission() {
  try {
    const token = await getToken(messaging, {
      vapidKey: process.env.REACT_APP_FCM_VAPID_KEY
    });
    
    console.log('FCM Token:', token);
    
    // Save token to Firestore
    await setDoc(
      doc(db, 'users', auth.currentUser.uid),
      { fcmToken: token },
      { merge: true }
    );

    return token;
  } catch (error) {
    console.error('Notification permission denied:', error);
  }
}

// Listen for foreground messages
onMessage(messaging, (payload) => {
  console.log('Message received:', payload);
  
  // Show notification
  new Notification(payload.notification.title, {
    body: payload.notification.body,
    icon: payload.notification.image
  });
});
```

## Security Rules

### Firestore Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public read-only access
    match /public/{document=**} {
      allow read;
      allow write: if false;
    }

    // User-specific data
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
      
      // Users can read other profiles
      allow read: if true;
    }

    // Posts
    match /posts/{postId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.userId;
    }

    // Comments
    match /posts/{postId}/comments/{commentId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.userId;
    }
  }
}
```

### Storage Rules

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // User's own files
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth.uid == userId;
    }

    // Public files
    match /public/{allPaths=**} {
      allow read;
      allow write: if false;
    }

    // Size and format validation
    match /uploads/{userId}/{fileName} {
      allow write: if request.auth.uid == userId
        && request.resource.size < 5 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
    }
  }
}
```

## Admin SDK

### Server-Side Operations

```typescript
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();

// Create user
async function createUser(email, password) {
  const user = await auth.createUser({
    email,
    password
  });
  return user;
}

// Get user
async function getUser(uid) {
  const user = await auth.getUser(uid);
  return user;
}

// Update user claims
async function setUserRole(uid, role) {
  await auth.setCustomUserClaims(uid, { role });
}

// Delete user
async function deleteUser(uid) {
  await auth.deleteUser(uid);
}

// Bulk operations
async function createMultipleUsers(users) {
  const result = await auth.createUsers(
    users.map(user => ({
      email: user.email,
      password: user.password
    }))
  );
  return result;
}
```

## Local Development

### Firebase Emulator Suite

```bash
firebase emulators:start
```

### Configure Emulator Connection

```tsx
import { connectAuthEmulator } from 'firebase/auth';
import { connectFirestoreEmulator } from 'firebase/firestore';
import { connectStorageEmulator } from 'firebase/storage';

if (process.env.NODE_ENV === 'development') {
  connectAuthEmulator(auth, 'http://localhost:9099', {
    disableWarnings: true
  });

  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
}
```

## Best Practices

### 1. Secure API Keys

```typescript
// Always use environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID
};
```

### 2. Use Security Rules

- Never rely solely on client-side validation
- Implement comprehensive security rules for Firestore and Storage
- Use custom claims for role-based access control

### 3. Optimize Queries

```tsx
// Bad: Gets entire collection
const allPosts = await getDocs(collection(db, 'posts'));

// Good: Filter at database level
const q = query(
  collection(db, 'posts'),
  where('status', '==', 'published'),
  orderBy('createdAt', 'desc'),
  limit(10)
);
const posts = await getDocs(q);
```

### 4. Handle Errors Properly

```tsx
async function safeDelete(documentId) {
  try {
    await deleteDoc(doc(db, 'posts', documentId));
  } catch (error) {
    if (error.code === 'permission-denied') {
      console.error('You lack permission to delete this document');
    } else if (error.code === 'not-found') {
      console.error('Document does not exist');
    } else {
      console.error('Error deleting document:', error);
    }
  }
}
```

### 5. Manage Listeners

```tsx
// Always unsubscribe to prevent memory leaks
useEffect(() => {
  const unsubscribe = onSnapshot(
    query(collection(db, 'posts')),
    (snapshot) => {
      // Handle data
    }
  );

  return () => unsubscribe();
}, []);
```

### 6. Index Large Collections

- Use composite indexes for complex queries
- Firebase suggests which indexes to create
- Monitor performance in Firebase Console

## Deployment

```bash
# Deploy functions
firebase deploy --only functions

# Deploy security rules
firebase deploy --only firestore:rules,storage:rules

# Deploy complete project
firebase deploy
```

## Conclusion

Firebase provides a comprehensive platform for building scalable applications with minimal backend infrastructure. Mastering authentication, Firestore queries, security rules, and Cloud Functions enables rapid development of production-ready applications with robust security and real-time capabilities.
