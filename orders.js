import { db } from "./app.js";
import { collection, getDocs, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const container = document.getElementById("ordersContainer");

async function loadOrders() {
  container.innerHTML = "";

  const snapshot = await getDocs(collection(db, "orders"));

  snapshot.forEach((docSnap) => {
    const order = docSnap.data();

    container.innerHTML += `
      <div class="order-card">
        <p><b>Email:</b> ${order.email}</p>
        <p><b>Total:</b> $${order.total}</p>
        <p><b>Status:</b> ${order.status}</p>

        <button onclick="updateStatus('${docSnap.id}', 'completed')">Complete</button>
        <button onclick="updateStatus('${docSnap.id}', 'cancelled')">Cancel</button>
      </div>
    `;
  });
}

async function updateStatus(id, status) {
  await updateDoc(doc(db, "orders", id), {
    status: status
  });

  // trigger email if cancelled
  if (status === "cancelled") {
    await fetch("https://YOUR_BACKEND_URL/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: id })
    });
  }

  loadOrders();
}

window.updateStatus = updateStatus;

loadOrders();
