// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { 
    getAuth, 
    GoogleAuthProvider, 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    addDoc, 
    query, 
    where, 
    orderBy, 
    getDocs, 
    deleteDoc, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { 
    getStorage, 
    ref, 
    uploadBytes, 
    getDownloadURL, 
    deleteObject 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js";
import { 
    getFunctions,
    httpsCallable
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-functions.js";

// Your Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAPi764UXdaw3tfWpUGekoflOW-LK-xVtU",
    authDomain: "vault-2d534.firebaseapp.com",
    databaseURL: "https://vault-2d534-default-rtdb.firebaseio.com",
    projectId: "vault-2d534",
    storageBucket: "vault-2d534.firebasestorage.app",
    messagingSenderId: "934380066941",
    appId: "1:934380066941:web:e3439bb584338da9de3914"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);
const googleProvider = new GoogleAuthProvider();

// Export everything
export { 
    // App
    app,
    
    // Authentication
    auth,
    googleProvider,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    
    // Firestore
    db,
    collection,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    addDoc,
    query,
    where,
    orderBy,
    getDocs,
    deleteDoc,
    serverTimestamp,
    
    // Storage
    storage,
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject,
    
    // Functions
    functions,
    httpsCallable
};
