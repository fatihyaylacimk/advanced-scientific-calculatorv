const display = document.getElementById("display");
const historyBox = document.getElementById("history");
const expressionPreview = document.getElementById("expressionPreview");
const themeToggle = document.getElementById("themeToggle");
const angleToggle = document.getElementById("angleToggle");
const body = document.body;
const buttonsArea = document.getElementById("buttonsArea");
const phoneFrame = document.querySelector(".phone-frame");

let historyList = JSON.parse(localStorage.getItem("calc_history")) || [];
let memoryValue = Number(localStorage.getItem("calc_memory")) || 0;
let lastAnswer = Number(localStorage.getItem("calc_last_answer")) || 0;
let angleMode = localStorage.getItem("calc_angle_mode") || "DEG";

updateHistory();
updateAngleButton();

function saveHistory() {
  localStorage.setItem("calc_history", JSON.stringify(historyList));
}

function saveMemory() {
  localStorage.setItem("calc_memory", memoryValue);
}

function saveLastAnswer() {
  localStorage.setItem("calc_last_answer", lastAnswer);
}

function saveAngleMode() {
  localStorage.setItem("calc_angle_mode", angleMode);
}

function playClickSound() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(500, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.04, audioContext.currentTime);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.04);
  } catch (e) {}
}

function updatePreview() {
  expressionPreview.textContent = display.value;
}

function appendValue(value) {
  playClickSound();
  display.value += value;
  updatePreview();
}

function appendFunction(funcName) {
  playClickSound();
  display.value += funcName;
  updatePreview();
}

function appendPercent() {
  playClickSound();
  display.value += "%";
  updatePreview();
}

function appendAns() {
  playClickSound();
  display.value += lastAnswer;
  updatePreview();
}

function clearDisplay() {
  playClickSound();
  display.value = "";
  updatePreview();
}

function deleteLast() {
  playClickSound();
  display.value = display.value.slice(0, -1);
  updatePreview();
}

function clearHistory() {
  playClickSound();
  historyList = [];
  saveHistory();
  updateHistory();
}

function updateHistory() {
  if (historyList.length === 0) {
    historyBox.innerHTML = "No history yet";
    return;
  }

  historyBox.innerHTML = historyList
    .map((item, index) => `<div onclick="useHistory(${index})">${item}</div>`)
    .join("");
}

function useHistory(index) {
  playClickSound();
  const item = historyList[index];
  const expression = item.split(" = ")[0];
  display.value = expression;
  updatePreview();
}

function updateAngleButton() {
  angleToggle.textContent = angleMode;
}

function toggleAngleMode() {
  playClickSound();
  angleMode = angleMode === "DEG" ? "RAD" : "DEG";
  saveAngleMode();
  updateAngleButton();
}

function toRadians(value) {
  return value * (Math.PI / 180);
}

function fromRadians(value) {
  return value * (180 / Math.PI);
}

function factorial(n) {
  if (n < 0 || !Number.isInteger(n)) {
    throw new Error("Invalid factorial");
  }
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

function replaceFactorials(expression) {
  return expression.replace(/(\d+(\.\d+)?)!/g, (_, num) => `factorial(${num})`);
}

function formatExpression(expression) {
  let expr = expression;

  expr = replaceFactorials(expr);

  expr = expr.replace(/\^/g, "**");
  expr = expr.replace(/(\d+(\.\d+)?)%/g, "($1/100)");
  expr = expr.replace(/sqrt\(/g, "Math.sqrt(");
  expr = expr.replace(/log\(/g, "Math.log10(");
  expr = expr.replace(/ln\(/g, "Math.log(");
  expr = expr.replace(/abs\(/g, "Math.abs(");

  if (angleMode === "DEG") {
    expr = expr.replace(/sin\(/g, "Math.sin(toRadians(");
    expr = expr.replace(/cos\(/g, "Math.cos(toRadians(");
    expr = expr.replace(/tan\(/g, "Math.tan(toRadians(");

    expr = expr.replace(/asin\(/g, "fromRadians(Math.asin(");
    expr = expr.replace(/acos\(/g, "fromRadians(Math.acos(");
    expr = expr.replace(/atan\(/g, "fromRadians(Math.atan(");
  } else {
    expr = expr.replace(/sin\(/g, "Math.sin(");
    expr = expr.replace(/cos\(/g, "Math.cos(");
    expr = expr.replace(/tan\(/g, "Math.tan(");

    expr = expr.replace(/asin\(/g, "Math.asin(");
    expr = expr.replace(/acos\(/g, "Math.acos(");
    expr = expr.replace(/atan\(/g, "Math.atan(");
  }

  return expr;
}

function autoCloseParentheses(expression) {
  const openCount = (expression.match(/\(/g) || []).length;
  const closeCount = (expression.match(/\)/g) || []).length;
  return expression + ")".repeat(Math.max(0, openCount - closeCount));
}

function safeEvaluate(expression) {
  return Function(
    '"use strict"; return (' + expression + ')'
  )();
}

function calculateResult() {
  playClickSound();

  try {
    const originalExpression = display.value;

    if (!originalExpression.trim()) return;

    let expression = formatExpression(originalExpression);
    expression = autoCloseParentheses(expression);

    let result = Function(
      "toRadians",
      "fromRadians",
      "factorial",
      '"use strict"; return (' + expression + ')'
    )(toRadians, fromRadians, factorial);

    if (!isFinite(result)) {
      display.value = "Error";
      updatePreview();
      return;
    }

    result = Number(result.toFixed(10));
    lastAnswer = result;

    saveLastAnswer();

    historyList.unshift(`${originalExpression} = ${result}`);

    if (historyList.length > 20) {
      historyList.pop();
    }

    saveHistory();
    updateHistory();
    display.value = result;
    updatePreview();
  } catch (error) {
    display.value = "Error";
    updatePreview();
  }
}

function getDisplayNumber() {
  const value = parseFloat(display.value);
  return isNaN(value) ? 0 : value;
}

function memoryClear() {
  playClickSound();
  memoryValue = 0;
  saveMemory();
}

function memoryRecall() {
  playClickSound();
  display.value += memoryValue;
  updatePreview();
}

function memoryAdd() {
  playClickSound();
  memoryValue += getDisplayNumber();
  saveMemory();
}

function memorySubtract() {
  playClickSound();
  memoryValue -= getDisplayNumber();
  saveMemory();
}

async function copyResult() {
  playClickSound();
  try {
    await navigator.clipboard.writeText(display.value);
  } catch (e) {}
}

themeToggle.addEventListener("click", function () {
  playClickSound();

  if (body.classList.contains("dark")) {
    body.classList.remove("dark");
    body.classList.add("light");
    themeToggle.textContent = "🌙";
  } else {
    body.classList.remove("light");
    body.classList.add("dark");
    themeToggle.textContent = "☀️";
  }
});

angleToggle.addEventListener("click", toggleAngleMode);

document.addEventListener("keydown", function (e) {
  const allowedKeys = "0123456789+-*/().%";

  if (allowedKeys.includes(e.key)) {
    appendValue(e.key);
  } else if (e.key === "Enter") {
    e.preventDefault();
    calculateResult();
  } else if (e.key === "Backspace") {
    deleteLast();
  } else if (e.key === "Escape") {
    clearDisplay();
  } else if (e.key.toLowerCase() === "s") {
    appendFunction("sin(");
  } else if (e.key.toLowerCase() === "c") {
    appendFunction("cos(");
  } else if (e.key.toLowerCase() === "t") {
    appendFunction("tan(");
  } else if (e.key.toLowerCase() === "l") {
    appendFunction("log(");
  } else if (e.key.toLowerCase() === "n") {
    appendFunction("ln(");
  } else if (e.key.toLowerCase() === "r") {
    appendFunction("sqrt(");
  } else if (e.key.toLowerCase() === "a") {
    appendAns();
  } else if (e.key === "^") {
    appendValue("^");
  } else if (e.key === "!") {
    appendValue("!");
  }
});

document.querySelectorAll("button").forEach((button) => {
  button.addEventListener("touchstart", () => {
    button.classList.add("touch-active");
  });

  button.addEventListener("touchend", () => {
    button.classList.remove("touch-active");
  });
});

let startX = 0;
let currentX = 0;

phoneFrame.addEventListener("touchstart", (e) => {
  startX = e.touches[0].clientX;
});

phoneFrame.addEventListener("touchmove", (e) => {
  currentX = e.touches[0].clientX;
  const diff = currentX - startX;

  if (Math.abs(diff) < 80) {
    phoneFrame.style.transform = `translateX(${diff / 8}px)`;
  }
});

phoneFrame.addEventListener("touchend", () => {
  phoneFrame.style.transform = "translateX(0px)";
});

updatePreview();