// app.js — головний файл, ініціалізація і зв'язок між модулями

let packetCount = 0;

// Годинник
setInterval(() => {
  const n = new Date();
  document.getElementById("clock").textContent = n.toTimeString().slice(0, 8);
}, 500);

//Обробка повідомлень від радару
//Викликається з websocket.js при кожному новому повідомленні
function onRadarMessage(msg) {
  const angle = msg.scanAngle ?? 0;
  const echoes = msg.echoResponses ?? [];

  packetCount++;

  // Передаємо дані на графік
  const newPoints = addTargetsToChart(angle, echoes);

  // Оновлюємо статистику
  updateStats(angle, newPoints);

  // Оновлюємо список останніх цілей
  if (newPoints && newPoints.length) {
    updateTargetsList(newPoints, angle);
  }
}

//Статистика
function updateStats(angle, newPoints) {
  document.getElementById("statAngle").textContent = Math.round(angle);

  document.getElementById("statPackets").textContent =
    packetCount > 9999 ? "9999+" : packetCount;

  document.getElementById("statTargets").textContent = newPoints
    ? newPoints.length
    : 0;

  const maxDist = getMaxDistance();
  document.getElementById("statMaxDist").textContent = maxDist
    ? Math.round(maxDist)
    : "---";
}

//Список цілей
function updateTargetsList(points, angle) {
  const list = document.getElementById("targetsList");

  const html = points
    .map(
      (p) => `
    <div class="target-entry">
      <span class="target-angle">${angle.toFixed(1)}°</span>
      <span class="target-dist">${p.r.toFixed(1)} km</span>
      <span class="target-power">P=${p.power.toFixed(3)}</span>
    </div>
  `,
    )
    .join("");

  list.innerHTML =
    html ||
    '<div style="color:var(--green-dim);font-size:10px">No targets...</div>';
}

//Очистка дисплею
function clearDisplay() {
  packetCount = 0;
  clearChart();

  document.getElementById("statTargets").textContent = "0";
  document.getElementById("statPackets").textContent = "0";
  document.getElementById("statMaxDist").textContent = "---";
  document.getElementById("statAngle").textContent = "---";
  document.getElementById("targetsList").innerHTML =
    '<div style="color:var(--green-dim);font-size:10px">Cleared.</div>';
}
