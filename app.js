import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { getFirestore, doc, setDoc, collection, getDocs, getDoc } 
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

async function loadSnacks() {

  const container = document.getElementById("snacks");
  if (!container) return;

  container.innerHTML = "";

  const querySnapshot = await getDocs(collection(db, "snacks"));

  querySnapshot.forEach((doc) => {

    const snack = doc.data();
    const price = Number(snack.price);

    container.innerHTML += `
      <div class="snack-card">
        <img src="${snack.image}" class="snack-img">
        <h3>${snack.name}</h3>
        <p>$${price}</p>
        <button onclick="addToCart('${snack.name}', ${price})">Add to Cart</button>
      </div>
    `;
  });

}

window.loadSnacks = loadSnacks;

function addToCart(name, price) {

  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  cart.push({ name, price });

  localStorage.setItem("cart", JSON.stringify(cart));

  showModal(name + " added to cart!");

}

window.addToCart = addToCart;

loadSnacks();

function loadCart() {

  const container = document.getElementById("cartItems");
  const totalText = document.getElementById("total");

  if (!container) return;

  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  if (cart.length === 0) {
    container.innerHTML = "<p>Your cart is empty.</p>";
    totalText.textContent = "";
    return;
  }

  container.innerHTML = "";

  let total = 0;

  cart.forEach((item, index) => {

    total += item.price;

    container.innerHTML += `
      <div class="cart-item">
        ${item.name} - $${item.price}
        <button onclick="removeFromCart(${index})">X</button>
      </div>
    `;
  });

  totalText.textContent = "Total: $" + total;

}

function removeFromCart(index) {

  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  cart.splice(index, 1);

  localStorage.setItem("cart", JSON.stringify(cart));

  loadCart();

}

window.removeFromCart = removeFromCart;
window.loadCart = loadCart;

async function checkout() {

  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  if (cart.length === 0) {
    showModal("Cart is empty!");
    return;
  }

  showModal("Order placed! Bring cash.");

  localStorage.removeItem("cart");

  setTimeout(() => {
    window.location.href = "index.html";
  }, 1200);

}

window.checkout = checkout;

loadCart();

onAuthStateChanged(auth, async (user) => {

  const userDiv = document.getElementById("userInfo");
  if (!userDiv) return;

  if (user) {

    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);

    let name = user.email;

    if (docSnap.exists()) {
      name = docSnap.data().fullName;
    }

    userDiv.innerHTML = `
      Signed in as: ${name}
      <br>
      <button onclick="logout()">Logout</button>
    `;

  } else {

    userDiv.innerHTML = `
      <a href="login.html">Login</a>
    `;

  }

});

import { signOut } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

function logout() {
  signOut(auth);
  location.reload();
}

window.logout = logout;

