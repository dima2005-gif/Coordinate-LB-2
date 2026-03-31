// websocket.js — WebSocket підключення до радару

const WS_URL = "ws://localhost:4000";

let ws = null;

//Оновлює UI стан підключення

function setConnState(state) {
  const wsDot = document.getElementById("wsDot");
  const panelDot = document.getElementById("panelDot");
  const wsLabel = document.getElementById("wsLabel");
  const connText = document.getElementById("connText");
  const btn = document.getElementById("connectBtn");

  if (state === "connected") {
    wsDot.className = "dot active";
    panelDot.className = "dot active";
    wsLabel.textContent = "ONLINE";
    connText.textContent = "Connected";
    btn.textContent = "DISCONNECT";
    btn.className = "btn danger";
  } else if (state === "connecting") {
    wsDot.className = "dot";
    panelDot.className = "dot";
    wsDot.style.background = "#ffaa00";
    wsLabel.textContent = "CONNECTING";
    connText.textContent = "Connecting...";
  } else {
    wsDot.className = "dot error";
    panelDot.className = "dot error";
    wsLabel.textContent = "OFFLINE";
    connText.textContent = "Disconnected";
    btn.textContent = "CONNECT";
    btn.className = "btn";
  }
}

//Відкриває WebSocket підключення
function connect() {
  setConnState("connecting");

  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    setConnState("connected");
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      onRadarMessage(msg);
    } catch (e) {
      console.error("Failed to parse message:", e);
    }
  };

  ws.onclose = () => {
    setConnState("disconnected");
  };

  ws.onerror = () => {
    setConnState("disconnected");
  };
}

//Закриває підключення
function disconnect() {
  if (ws) ws.close();
}

//Перемикає підключення (connect / disconnect)

function toggleConnection() {
  if (ws && ws.readyState === WebSocket.OPEN) {
    disconnect();
  } else {
    connect();
  }
}
