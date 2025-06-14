
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const PORT = process.env.PORT || 3000;

let waitingUser = null;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

let users = [];
try {
  users = JSON.parse(fs.readFileSync('./users.json', 'utf8'));
} catch {
  users = [];
}

// تسجيل الدخول
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (user) {
    res.json({ success: true, user });
  } else {
    res.json({ success: false, message: "البريد أو كلمة السر غير صحيحة" });
  }
});

// إنشاء حساب
app.post("/register", (req, res) => {
  const { name, surname, email, password } = req.body;
  if (users.find(u => u.email === email)) {
    return res.json({ success: false, message: "البريد مستعمل" });
  }
  const newUser = { name, surname, email, password };
  users.push(newUser);
  fs.writeFileSync('./users.json', JSON.stringify(users, null, 2));
  res.json({ success: true, user: newUser });
});

// سحب صفحة HTML
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// WebSocket
io.on('connection', socket => {
  socket.on('join', () => {
    if (waitingUser) {
      const otherSocket = waitingUser;
      waitingUser = null;
      socket.partner = otherSocket;
      otherSocket.partner = socket;
      socket.emit("partner-found");
      otherSocket.emit("partner-found");
    } else {
      waitingUser = socket;
    }
  });

  socket.on("message", msg => {
    if (socket.partner) socket.partner.emit("message", msg);
  });

  socket.on("gift", gift => {
    if (socket.partner) socket.partner.emit("gift", gift);
  });

  socket.on("next", () => {
    if (socket.partner) {
      socket.partner.partner = null;
      socket.partner.emit("disconnected");
    }
    socket.partner = null;
    socket.emit("next-user");
    if (waitingUser) {
      const otherSocket = waitingUser;
      waitingUser = null;
      socket.partner = otherSocket;
      otherSocket.partner = socket;
      socket.emit("partner-found");
      otherSocket.emit("partner-found");
    } else {
      waitingUser = socket;
    }
  });

  socket.on("disconnect", () => {
    if (waitingUser === socket) waitingUser = null;
    if (socket.partner) socket.partner.emit("disconnected");
  });
});

http.listen(PORT, () => console.log("Server running on port", PORT));
