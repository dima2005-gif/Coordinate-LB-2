// chart.js — Plotly polar chart + Canvas sweep line

const C = 300000;
const MAX_TARGETS = 500;

let allTargets = [];
const chartEl = document.getElementById("chart");

//Canvas для стрілки
const canvas = document.createElement("canvas");
canvas.style.cssText = `
position: absolute;
top: 0; left: 0;
width: 100%; height: 100%;
pointer-events: none;
z-index: 10;
`;
document.querySelector(".radar-screen").appendChild(canvas);
const ctx = canvas.getContext("2d");

// Підганяємо розмір canvas під реальні пікселі
function resizeCanvas() {
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

//Plotly
const chartLayout = {
  paper_bgcolor: "rgba(0,0,0,0)",
  plot_bgcolor: "rgba(2,13,6,0.95)",
  polar: {
    bgcolor: "rgba(2,13,6,0.95)",
    radialaxis: {
      visible: true,
      range: [0, 200],
      tickfont: {
        color: "rgba(0,255,136,0.5)",
        size: 9,
        family: "Share Tech Mono",
      },
      gridcolor: "rgba(0,255,136,0.1)",
      linecolor: "rgba(0,255,136,0.2)",
      ticksuffix: " km",
      tickmode: "linear",
      tick0: 0,
      dtick: 50,
    },
    angularaxis: {
      tickfont: {
        color: "rgba(0,255,136,0.6)",
        size: 10,
        family: "Share Tech Mono",
      },
      gridcolor: "rgba(0,255,136,0.08)",
      linecolor: "rgba(0,255,136,0.15)",
      direction: "clockwise",
      rotation: 90,
    },
  },
  margin: { t: 10, b: 10, l: 10, r: 10 },
  showlegend: false,
  font: { family: "Share Tech Mono" },
};

function makeTrace(color) {
  return {
    type: "scatterpolar",
    mode: "markers",
    r: [],
    theta: [],
    marker: { color, size: 7, opacity: 0.9, line: { width: 0 } },
    hovertemplate: "<b>%{r:.1f} km</b><br>%{theta}°<extra></extra>",
  };
}

// Тільки 3 трейси для точок — стрілки тут більше нема
Plotly.newPlot(
  chartEl,
  [makeTrace("#00ff88"), makeTrace("#ffaa00"), makeTrace("#ff3355")],
  chartLayout,
  { responsive: true, displayModeBar: false },
);

//Утиліти
function calcDistance(time) {
  return (C * time) / 2;
}

function powerToTraceIdx(power) {
  if (power >= 0.7) return 2;
  if (power >= 0.3) return 1;
  return 0;
}

//Canvas анімація стрілки
let currentAngle = 0; // поточний кут на екрані (плавний)
let targetAngle = 0; // кут від WebSocket (накопичений)
let rawTarget = 0; // останній кут від радару (0-360)
const LERP = 0.12;

// Завжди крутимось вперед — без відскоку через 360
function updateTargetAngle(newAngle) {
  let diff = newAngle - rawTarget;
  // Якщо перейшли через 0 (наприклад 350->10), додаємо 360
  if (diff < -180) diff += 360;
  // Якщо стрибок назад більше 10° — ігноруємо (шум)
  if (diff < -10) diff = 0;
  rawTarget = newAngle;
  targetAngle += diff;
}

function lerpAngle(a, b, t) {
  return a + (b - a) * t;
}

// Знаходимо центр і радіус полярного графіку
function getPolarGeometry() {
  const rect = chartEl.getBoundingClientRect();
  const parentRect = canvas.parentElement.getBoundingClientRect();

  // Plotly малює polar plot всередині своїх margins
  const margin = 10;
  const size = Math.min(rect.width, rect.height) - margin * 2;
  const radius = (size / 2) * 1.0;

  const cx = rect.left - parentRect.left + rect.width / 2;
  const cy = rect.top - parentRect.top + rect.height / 2;

  return { cx, cy, radius };
}

function drawSweep() {
  const { cx, cy, radius } = getPolarGeometry();

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Кут: Plotly clockwise від 12 годин → конвертуємо в радіани canvas
  const rad = (((currentAngle % 360) - 90) * Math.PI) / 180;
  const ex = cx + Math.cos(rad) * radius;
  const ey = cy + Math.sin(rad) * radius;

  // Glow ефект — кілька шарів
  ctx.save();

  // Широкий розмитий слід
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(ex, ey);
  ctx.strokeStyle = "rgba(0,255,136,0.08)";
  ctx.lineWidth = 12;
  ctx.filter = "blur(6px)";
  ctx.stroke();

  // Основна лінія
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(ex, ey);
  ctx.strokeStyle = "rgba(0,255,136,0.85)";
  ctx.lineWidth = 1.5;
  ctx.filter = "none";
  ctx.shadowColor = "#00ff88";
  ctx.shadowBlur = 8;
  ctx.stroke();

  // Точка на кінці
  ctx.beginPath();
  ctx.arc(ex, ey, 3, 0, Math.PI * 2);
  ctx.fillStyle = "#00ff88";
  ctx.shadowBlur = 12;
  ctx.fill();

  ctx.restore();
}

// Анімаційний цикл тільки для canvas — легкий, 60fps
function sweepLoop() {
  requestAnimationFrame(sweepLoop);
  currentAngle = lerpAngle(currentAngle, targetAngle, LERP);
  drawSweep();
}
sweepLoop();

//Оновлення точок (рідше — тільки коли є нові дані)
let pointsDirty = false;
let rafPending = false;

function schedulePointsUpdate() {
  if (!rafPending) {
    rafPending = true;
    requestAnimationFrame(() => {
      rafPending = false;
      if (!pointsDirty) return;
      pointsDirty = false;

      const buckets = [
        { r: [], theta: [] },
        { r: [], theta: [] },
        { r: [], theta: [] },
      ];
      for (const t of allTargets) {
        const idx = powerToTraceIdx(t.power);
        buckets[idx].r.push(t.r);
        buckets[idx].theta.push(t.theta);
      }
      Plotly.restyle(
        chartEl,
        {
          r: buckets.map((b) => b.r),
          theta: buckets.map((b) => b.theta),
        },
        [0, 1, 2],
      );
    });
  }
}

//Публічні функції
function addTargetsToChart(angle, echoResponses) {
  updateTargetAngle(angle);

  if (!echoResponses.length) return [];

  const newPoints = echoResponses.map((echo) => ({
    r: calcDistance(echo.time),
    theta: angle,
    power: echo.power,
  }));

  allTargets.push(...newPoints);
  if (allTargets.length > MAX_TARGETS) {
    allTargets = allTargets.slice(allTargets.length - MAX_TARGETS);
  }

  pointsDirty = true;
  schedulePointsUpdate();
  return newPoints;
}

function clearChart() {
  allTargets = [];
  pointsDirty = true;
  schedulePointsUpdate();
}

function getMaxDistance() {
  if (!allTargets.length) return null;
  return Math.max(...allTargets.map((t) => t.r));
}
