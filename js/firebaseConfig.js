// js/firebaseConfig.js

// Používame plné URL adresy pre prehliadač (import z CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get, set, child, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Vložte sem údaje z Firebase konzoly (Project Settings -> General -> Your apps)
const firebaseConfig = {
  apiKey: "VASE_API_KEY",
  authDomain: "okr-os.firebaseapp.com",
  databaseURL: "https://okr-os-caa74-default-rtdb.europe-west1.firebasedatabase.app", // Skontrolujte, či máte správnu URL
  projectId: "okr-os",
  storageBucket: "okr-os.appspot.com",
  messagingSenderId: "VAS_SENDER_ID",
  appId: "VASE_APP_ID"
};

// Inicializácia
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

// Export funkcií pre použitie v iných súboroch
export { ref, get, set, child, onValue };