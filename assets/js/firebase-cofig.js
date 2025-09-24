// Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries


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
  const analytics = getAnalytics(app);
