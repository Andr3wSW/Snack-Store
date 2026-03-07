import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
const firebaseConfig = {
  apiKey: "AIzaSyApNczevOMrVuPSEL4oLYGgvVr7IYZHHRE",
  authDomain: "snackstore.firebaseapp.com",
  projectId: "snackstore",
  storageBucket: "snackstore.firebasestorage.app",
  messagingSenderId: "346760321779",
  appId: "1:346760321779:web:5b83a74329d90e78be3586"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);


onAuthStateChanged(auth, async (user) => {
  const userInfo = document.getElementById("userInfo");
  if (!userInfo) return;

  if (user) {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const data = userDoc.data();

    userInfo.innerHTML = `
      Logged in as: ${data.fullName}
      <button onclick="logout()">Logout</button>
    `;
  } else {
    userInfo.innerHTML = `
      <a href="login.html">Login</a> |
      <a href="signup.html">Signup</a>
    `;
  }
});

window.logout = async function() {
  await signOut(auth);
  location.reload();
}
function loadCart() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const cartDiv = document.getElementById("cartItems");

  if (!cartDiv) return;

  if (cart.length === 0) {
    cartDiv.innerHTML = "<p>Your cart is empty.</p>";
    return;
  }

  cartDiv.innerHTML = "";
  let total = 0;

  cart.forEach((item, index) => {
    total += item.price;
    cartDiv.innerHTML += `
      <div class="cart-card">
        ${item.name} - $${item.price}
        <button onclick="removeFromCart(${index})">Remove</button>
      </div>
    `;
  });

  cartDiv.innerHTML += `<h3>Total: $${total}</h3>`;
}

function removeFromCart(index) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  cart.splice(index, 1);
  localStorage.setItem("cart", JSON.stringify(cart));
  loadCart();
}

async function checkout() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];

  if (cart.length === 0) {
    showModal("Your cart is empty!");
    return;
  }

  const user = auth.currentUser;

  if (!user) {
    showModal("You must log in before checking out.");
    window.location.href = "login.html";
    return;
  }

  const meetingSpot = document.getElementById("meetingSpot").value;

  try {
    await addDoc(collection(db, "orders"), {
      userEmail: user.email,
      items: cart,
      meetingSpot: meetingSpot,
      status: "Pending",
      createdAt: new Date()
    });

    localStorage.removeItem("cart");

    showModal("Order placed! Bring cash to pickup.");
  

  } catch (error) {
    showModal("Error placing order: " + error.message);
  }
}

window.checkout = checkout;

window.loadCart = loadCart;
window.removeFromCart = removeFromCart;
window.checkout = checkout;

// Load cart automatically on cart page
loadCart();
// Function to add a snack to cart
function addToCart(name, price) {
  // Get cart from localStorage, or empty array if none
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  
  // Add new item
  cart.push({ name, price });
  
  // Save back to localStorage
  localStorage.setItem("cart", JSON.stringify(cart));
  
  showModal(`${name} added to cart!`);
}

// Make it globally available for inline buttons
window.addToCart = addToCart;


async function loadSnacks() {
  const querySnapshot = await getDocs(collection(db, "snacks"));
  const container = document.getElementById("snacks");
  if (!container) return;

  container.innerHTML = "";

  querySnapshot.forEach((doc) => {
    const snack = doc.data();
    const price = Number(snack.price); // ensure it's a number

      container.innerHTML += `
      <div class="snack-card">
        <div class="card-inner">
          
          <div class="card-front">
            <img src="${snack.image}" alt="${snack.name}" class="snack-img">
            <h3>${snack.name}</h3>
            <p>$${price}</p>
            <button onclick="addToCart('${snack.name}', ${price})">Add to Cart</button>
            <button class=info-btn onclick="flipCard(this)">?</button>
      
          </div>

          <div class="card-back">
            <h3>${snack.name}</h3>
            <p>${snack.description}</p>
            <pre>${snack.nutrition}</pre>
            <button onclick="flipCard(this)">Back</button>
          </div>

        </div>
      </div>
    `;
  });
}

window.loadSnacks = loadSnacks;

async function signup() {

  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (!firstName || !lastName || !email || !password) {
    showModal("Please fill in all fields.");
    return;
  }

  try {

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      firstName: firstName,
      lastName: lastName,
      fullName: firstName + " " + lastName,
      email: email,
      createdAt: new Date()
    });

    showModal("Account created!");

    setTimeout(() => {
      window.location.href = "login.html";
    }, 1200);

  } catch (error) {

    showModal(error.message);

  }

}



async function login() {

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (!email || !password) {
    showModal("Enter email and password.");
    return;
  }

  try {

    await signInWithEmailAndPassword(auth, email, password);

    showModal("Logged in!");

    setTimeout(() => {
      window.location.href = "index.html";
    }, 1000);

  } catch (error) {

    showModal("Login failed: " + error.message);

  }

}



window.signup = signup;
window.login = login;
// Run automatically
loadSnacks();

function showModal(message) {

  const modal = document.getElementById("modal");
  const modalText = document.getElementById("modalText");

  // If modal doesn't exist on this page, fallback to alert
  if (!modal || !modalText) {
    alert(message);
    return;
  }

  modalText.textContent = message;
  modal.style.display = "flex";
}

window.showModal = showModal;
function closeModal() {
  const modal = document.getElementById("customModal");
  modal.classList.remove("show");
}

window.closeModal = closeModal;

function flipCard(button) {
  const card = button.closest(".snack-card");
  card.classList.toggle("flipped");
}

window.flipCard = flipCard;









