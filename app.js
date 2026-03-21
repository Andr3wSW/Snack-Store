import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { getFirestore, doc, setDoc, collection, getDocs, getDoc, addDoc } 
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

  const user = auth.currentUser;

  if (!user) {
    showModal("You must be logged in!");
    return;
  }

  // Get user name
  const userDoc = await getDoc(doc(db, "users", user.uid));
  const name = userDoc.exists() ? userDoc.data().fullName : user.email;

  await addDoc(collection(db, "orders"), {
    items: cart,
    userName: name,
    userEmail: user.email,
    createdAt: new Date()
  });

  localStorage.removeItem("cart");

  showModal("Order placed!");

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

    const admin = await isAdmin(user.uid);

userDiv.innerHTML = `
  Signed in as: ${name}
  <br>
  <button onclick="logout()">Logout</button>
  ${admin ? '<br><a href="admin.html">Admin Panel</a>' : ''}
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

async function isAdmin(uid) {

  const adminRef = doc(db, "admins", uid);
  const adminSnap = await getDoc(adminRef);

  return adminSnap.exists();

}

async function addSnack() {

  const name = document.getElementById("snackName").value;
  const price = Number(document.getElementById("snackPrice").value);
  const image = document.getElementById("snackImage").value;

  if (!name || !price || !image) {
    showModal("Fill everything!");
    return;
  }

  await addDoc(collection(db, "snacks"), {
    name,
    price,
    image
  });

  showModal("Snack added!");

}

window.addSnack = addSnack;

const OWNER_UID = "peB49N5QYjOLUzFQOEqF1Uq3gum2";

async function makeAdmin() {

  const user = auth.currentUser;

  if (!user || user.uid !== OWNER_UID) {
    showModal("You are not allowed to do this.");
    return;
  }

  const uid = document.getElementById("adminUID").value;

  if (!uid) {
    showModal("Enter UID");
    return;
  }

  await setDoc(doc(db, "admins", uid), {
    role: "admin"
  });

  showModal("User is now admin!");

}

window.makeAdmin = makeAdmin;

async function protectAdminPage() {

  const user = auth.currentUser;

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const admin = await isAdmin(user.uid);

  if (!admin && user.uid !== OWNER_UID) {
    showModal("Access denied.");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1200);
  }

}

window.protectAdminPage = protectAdminPage;

async function loadOrders() {

  const container = document.getElementById("orders");
  if (!container) return;

  const querySnapshot = await getDocs(collection(db, "orders"));

  container.innerHTML = "";

  querySnapshot.forEach((doc) => {

    const order = doc.data();

    let itemsList = order.items.map(i => i.name).join(", ");

    container.innerHTML += `
      <div class="order-card">
        <b>${order.userName}</b><br>
        ${itemsList}
      </div>
    `;
  });

}

window.loadOrders = loadOrders;
