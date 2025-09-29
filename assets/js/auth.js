// Import functions from the Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, updateProfile, signOut } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAnzlZaTUH7DrZMzbqG8qoytMu_a0relsY",
  authDomain: "tourism-71740.firebaseapp.com",
  projectId: "tourism-71740",
  storageBucket: "tourism-71740.firebasestorage.app",
  messagingSenderId: "313768878312",
  appId: "1:313768878312:web:0454cca10b895ef7b5295d",
  measurementId: "G-DV74FBY2V1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Registration ---
const registerForm = document.querySelector('#registration-form');
if (registerForm) {
  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const fullName = registerForm.fullname.value;
    const email = registerForm.email.value;
    const password = registerForm.password.value;

    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed up, now update profile and create user document
        const user = userCredential.user;
        // 1. Update Auth profile
        const profilePromise = updateProfile(user, { displayName: fullName });
        // 2. Create user document in Firestore
        const userDocRef = doc(db, "users", user.uid);
        const docPromise = setDoc(userDocRef, {
          uid: user.uid,
          email: email,
          displayName: fullName,
          createdAt: serverTimestamp()
        });
        return Promise.all([profilePromise, docPromise]);
      })
      .then(() => {
        window.location.href = 'index.html'; // Redirect after all setup is complete
      })
      .catch((error) => {
        alert(error.message);
      });
  });
}

// --- Login ---
const loginForm = document.querySelector('#login-form');
if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = loginForm.email.value;
    const password = loginForm.password.value;

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed in, redirect to home
        console.log('User logged in:', userCredential.user);
        window.location.href = 'index.html';
      })
      .catch((error) => {
        alert(error.message);
      });
  });
}

// --- Sign Out ---
function setupSignOut() {
    const signOutButtons = document.querySelectorAll('.sign-out-button');
    signOutButtons.forEach(button => {
        button.addEventListener('click', () => {
            signOut(auth).then(() => {
                // Sign-out successful.
                window.location.href = 'login.html';
            }).catch((error) => {
                alert(error.message);
            });
        });
    });
}
// --- Auth State Observer ---
onAuthStateChanged(auth, (user) => {
  const userProfile = document.getElementById('user-profile');
  const guestMenu = document.getElementById('guest-menu');

  if (user) {
    // User is signed in
    if (userProfile && guestMenu) {
      guestMenu.style.display = 'none';
      userProfile.style.display = 'flex';
      const userNameEl = document.getElementById('user-name');
      if (userNameEl) {
        userNameEl.textContent = user.displayName;
      }
      const userAvatar = document.getElementById('user-avatar');
      if (userAvatar) {
        userAvatar.innerHTML = ''; // Clear previous content
        const initial = user.displayName ? user.displayName.charAt(0).toUpperCase() : '<span class="material-symbols-outlined">person</span>';
        userAvatar.innerHTML = user.displayName ? initial : '<span class="material-symbols-outlined text-xl">person</span>';
        userAvatar.classList.add('flex', 'items-center', 'justify-center', 'size-9', 'rounded-full', 'bg-primary/20', 'text-primary', 'font-bold');
        if (user.displayName) {
          userAvatar.parentElement.title = user.displayName;
        }
      }
      setupSignOut(); // Set up sign out buttons for the logged-in user
    }
  } else {
    // User is signed out
    if (userProfile && guestMenu) {
      guestMenu.style.display = 'flex';
      userProfile.style.display = 'none';
    }
  }
});