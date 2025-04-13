import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "Your_apiKey",
    authDomain: "Your_authDomain",
    projectId: "Your_projectId",
    storageBucket: "Your_storageBucket",
    messagingSenderId: "Your_messagingSenderId",
    appId: "Your_appId",
    measurementId: "Your_measurementId",
    databaseURL: "Your_databaseURL"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getDatabase(app);

export { auth, provider, db };
