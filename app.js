import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { getFirestore, doc, setDoc } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// YOUR CONFIG (same as before)
const firebaseConfig = {
  apiKey: "AIzaSyApNczevOMrVuPSEL4oLYGgvVr7IYZHHRE",
  authDomain: "snackstore.firebaseapp.com",
  projectId: "snackstore",
  storageBucket: "snackstore.firebasestorage.app",
  messagingSenderId: "346760321779",
  appId: "1:346760321779:web:5b83a74329d90e78be3586"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===== MODAL SYSTEM =====
function showModal(message) {
  const modal = document.getElementById("modal");
  const text = document.getElementById("modalText");

  if (!modal || !text) return alert(message);

  text.textContent = message;
  modal.style.display = "flex";
}

function closeModal() {
  const modal = document.getElementById("modal");
  if (modal) modal.style.display = "none";
}

window.closeModal = closeModal;

// ===== SIGNUP =====
async function signup() {
  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (!firstName || !lastName) {
    showModal("Enter full name");
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      fullName: firstName + " " + lastName,
      email: email
    });

    showModal("Account created!");

    setTimeout(() => {
      window.location.href = "index.html";
    }, 1200);

  } catch (error) {
    showModal(error.message);
  }
}

// ===== LOGIN =====
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);

    showModal("Logged in!");

    setTimeout(() => {
      window.location.href = "index.html";
    }, 1000);

  } catch (error) {
    showModal(error.message);
  }
}

window.signup = signup;
window.login = login;
