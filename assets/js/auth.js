// Import functions from the Firebase SDKs
import { app } from './firebase-init.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, updateProfile, signOut } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { getFirestore, doc, setDoc, serverTimestamp, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

// --- EmailJS Integration ---
const emailjsReady = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
    script.onload = () => {
        console.log("EmailJS SDK loaded.");
        emailjs.init({ publicKey: '8s3mic2mF1Ajw0Var' });
        resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
});

// Initialize Firebase
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
      userProfile.style.display = 'block'; // Use block for the relative container
      const initial = user.displayName ? user.displayName.charAt(0).toUpperCase() : 'P';

      userProfile.innerHTML = `
        <a href="profile.html" class="group flex items-center gap-2 cursor-pointer" title="${user.displayName || 'View Profile'}">
            <div id="user-avatar" class="flex items-center justify-center size-9 rounded-full bg-primary/20 text-primary font-bold">${initial}</div>
        </a>
        <div id="user-menu-dropdown" class="absolute right-0 mt-2 w-48 bg-surface-light dark:bg-surface-dark rounded-md shadow-lg py-1 z-50 hidden group-hover:block">
            <div class="px-4 py-2 text-sm text-text-light dark:text-text-dark">
                <p class="font-semibold">${user.displayName}</p>
                <p class="text-xs text-text-muted-light dark:text-text-muted-dark truncate">${user.email}</p>
            </div>
            <div class="border-t border-border-light dark:border-border-dark"></div>
            <a href="profile.html" class="block px-4 py-2 text-sm text-text-light dark:text-text-dark hover:bg-background-light dark:hover:bg-background-dark">My Trips</a>
            <a href="#" class="sign-out-button block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-background-light dark:hover:bg-background-dark">Sign Out</a>
        </div>
      `;

      setupSignOut();
      // Add a small delay to ensure everything is rendered before checking notifications
      setTimeout(() => {
        checkTripNotifications(user);
      }, 1000);
    }
  } else {
    // User is signed out
    if (userProfile && guestMenu) {
      guestMenu.style.display = 'flex';
      userProfile.style.display = 'none';
    }
  }
});

export async function checkTripNotifications(user) {
    const userId = user.uid;
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    const tripsRef = collection(db, 'users', userId, 'trips');
    const q = query(tripsRef, where("tripDate", ">=", startOfToday), where("tripDate", "<=", endOfToday), where("status", "==", "planned"));

    getDocs(q).then(querySnapshot => {
        if (!querySnapshot.empty) {
            const tripData = querySnapshot.docs[0].data(); // Get the first trip for today
            const trip = {
                ...tripData,
                tripDate: tripData.tripDate.toDate() // Ensure it's a JS Date object
            };
            // Always show the on-site notification
            showNotification(`Your trip to ${trip.beachName} is today! Have a great time and stay safe.`);

            // Only send the email once per day
            const emailSentKey = `tripEmailSent_${userId}_${today.toISOString().split('T')[0]}`;
            if (!localStorage.getItem(emailSentKey)) {
                sendTripEmail(user, trip);
                // Mark that email has been sent for this user for today
                localStorage.setItem(emailSentKey, 'true');
            }
        }
    }).catch(error => {
        console.error("Error fetching trip notifications:", error);
    });
}

async function sendTripEmail(user, trip) {
    await emailjsReady; // Wait for the SDK to be ready

    const templateParams = {
        beach_name: trip.beachName,
        to_name: user.displayName,
        trip_date: trip.tripDate.toLocaleDateString(),
        to_email: user.email,
        reply_to: user.email,
    };

    emailjs.send('service_zwiz3hi', 'template_a6r9rmk', templateParams)
        .then((response) => console.log('Trip notification email sent!', response.status, response.text))
        .catch((error) => console.error('Failed to send trip notification email.', error));
}

export async function sendImmediateTripNotification(user, tripData) {
    // This function sends a notification without checking localStorage,
    // so it can be triggered immediately after a trip is created.
    const trip = {
        beachName: tripData.beachName,
        tripDate: tripData.tripDate.toDate() // Ensure it's a JS Date object
    };

    showNotification(`Your trip to ${trip.beachName} is today! Have a great time and stay safe.`);
    sendTripEmail(user, trip);

    // Also, mark the daily notification as sent to prevent a duplicate on next login/refresh
    const today = new Date();
    const emailSentKey = `tripEmailSent_${user.uid}_${today.toISOString().split('T')[0]}`;
    localStorage.setItem(emailSentKey, 'true');
}

function showNotification(message) {
    // Check if a notification bar already exists
    if (document.getElementById('trip-notification-bar')) {
        return;
    }

    const notificationBar = document.createElement('div');
    notificationBar.id = 'trip-notification-bar';
    notificationBar.className = 'fixed top-20 left-1/2 -translate-x-1/2 bg-primary text-white px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-4';
    notificationBar.innerHTML = `
        <span class="material-symbols-outlined">celebration</span>
        <p>${message}</p>
        <button id="close-notification" class="p-1 rounded-full hover:bg-white/20">
            <span class="material-symbols-outlined">close</span>
        </button>
    `;

    document.body.appendChild(notificationBar);

    const closeButton = document.getElementById('close-notification');
    closeButton.addEventListener('click', () => {
        notificationBar.remove();
    });

    setTimeout(() => {
        notificationBar.remove();
    }, 10000); // Auto-dismiss after 10 seconds
}