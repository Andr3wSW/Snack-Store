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

let allSnacks = [];

// ===== MODAL SYSTEM =====
function showModal(message) {
  const modal = document.getElementById("customModal");
  const modalMessage = document.getElementById("modalMessage");
  if (!modal || !modalMessage) return;

  modalMessage.textContent = message;

  // First make it visible, but keep modal-content scaled down + transparent
  modal.style.display = "flex";

  // Force a reflow so transition works
  void modal.offsetWidth;

  // Add show class to animate scale + opacity
  modal.classList.add("show");
}

function closeModal() {
  const modal = document.getElementById("customModal");
  if (!modal) return;

  // remove the show class to start transition back
  modal.classList.remove("show");

  // wait for transition to finish before hiding completely
  setTimeout(() => {
    modal.style.display = "none";
  }, 300); // same as CSS transition duration
}

window.showModal = showModal;
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

const container = document.getElementById("snacks");

async function loadSnacks() {
  container.innerHTML = "";

  const querySnapshot = await getDocs(collection(db, "snacks"));

  allSnacks = [];

  querySnapshot.forEach((docSnap) => {
    const snack = docSnap.data();
    snack.id = docSnap.id;
    allSnacks.push(snack);
  });

  displaySnacks(allSnacks);
}

loadSnacks();

function addToCart(name, price) {

  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  cart.push({ name, price });

  localStorage.setItem("cart", JSON.stringify(cart));

  showModal(name + " added to cart!");

}

window.addToCart = addToCart;

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


userDiv.innerHTML = `
  Signed in as: ${name}
  <br>
  <button onclick="logout()">Logout</button>
`;

  } else {

    userDiv.innerHTML = `
      <button onclick="window.location.href='login.html'">Login</button>
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

function displaySnacks(snacks) {
  container.innerHTML = "";

  snacks.forEach((snack) => {
    const price = Number(snack.price);

    const outOfStock = snack.inStock === false;

    container.innerHTML += `
      <div class="snack-card ${outOfStock ? 'out' : ''}">
        ${outOfStock ? '<div class="badge">Out of Stock</div>' : ''}

        <img src="${snack.image}" style="width:100%;height:120px;object-fit:cover;">
        
        <h3>${snack.name}</h3>
        <p>$${price}</p>

        <button 
          onclick="addToCart('${snack.name}', ${price})"
          ${outOfStock ? "disabled" : ""}
        >
          Add to Cart
        </button>
      </div>
    `;
  });
}

function filterSnacks() {
  const search = document.getElementById("searchInput").value.toLowerCase();
  const stock = document.getElementById("stockFilter").value;

  const filtered = allSnacks.filter(snack => {
    const matchesSearch = snack.name.toLowerCase().includes(search);

    const inStock = snack.inStock !== false;

    let matchesStock = true;
    if (stock === "in") matchesStock = inStock;
    if (stock === "out") matchesStock = !inStock;

    return matchesSearch && matchesStock;
  });

  displaySnacks(filtered);
}

window.filterSnacks = filterSnacks;


