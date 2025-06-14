const socket = io();

const chatContainer = document.getElementById("chat-container");
const messageForm = document.getElementById("message-form");
const messageInput = document.getElementById("message-input");

let username = "";

// وظيفة لتسجيل المستخدم
function showLogin() {
  const loginHtml = `
    <div id="login">
      <h2>تسجيل الدخول</h2>
      <input type="text" id="email" placeholder="البريد الإلكتروني"><br>
      <input type="password" id="password" placeholder="كلمة السر"><br>
      <button onclick="login()">دخول</button>
    </div>
  `;
  chatContainer.innerHTML = loginHtml;
}

// عند نجاح تسجيل الدخول
function startChat(user) {
  username = user.name || "مستخدم";

  chatContainer.innerHTML = `
    <div id="chat">
      <h2>مرحبًا ${username}</h2>
      <div id="messages" style="height: 300px; overflow-y: scroll; border: 1px solid #ccc; padding: 10px;"></div>
      <form id="message-form">
        <input id="message-input" placeholder="اكتب رسالة..." autocomplete="off" />
        <button>إرسال</button>
      </form>
    </div>
  `;

  const messagesDiv = document.getElementById("messages");
  const form = document.getElementById("message-form");
  const input = document.getElementById("message-input");

  form.addEventListener("submit", e => {
    e.preventDefault();
    const text = input.value.trim();
    if (text !== "") {
      const msg = { name: username, text };
      appendMessage(msg); // عرض في واجهتي
      socket.emit("message", msg); // إرسال للآخرين
      input.value = "";
    }
  });

  socket.on("message", msg => {
    appendMessage(msg);
  });

  function appendMessage(msg) {
    const div = document.createElement("div");
    div.textContent = `${msg.name}: ${msg.text}`;
    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }
}

// تنفيذ login
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const res = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  if (data.success) {
    startChat(data.user);
  } else {
    alert("فشل تسجيل الدخول: " + data.message);
  }
}

showLogin();
