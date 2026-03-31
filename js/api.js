// api.js — API запити до радару

const API_URL = "http://localhost:4000/config";

//Відправляє нові параметри радару через PUT /config
async function applyConfig() {
  const body = {
    measurementsPerRotation: parseInt(document.getElementById("mpr").value),
    rotationSpeed: parseInt(document.getElementById("rs").value),
    targetSpeed: parseInt(document.getElementById("ts").value),
  };

  const fb = document.getElementById("configFeedback");

  try {
    const res = await fetch(API_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      showFeedback("✓ CONFIG APPLIED", "ok");
    } else {
      showFeedback(`✗ ERROR ${res.status}`, "err");
    }
  } catch (e) {
    showFeedback("✗ REQUEST FAILED", "err");
  }
}

//Показує повідомлення під кнопкою Apply
function showFeedback(text, type) {
  const fb = document.getElementById("configFeedback");
  fb.textContent = text;
  fb.className = `feedback ${type}`;
  setTimeout(() => {
    fb.textContent = "";
  }, 3000);
}
