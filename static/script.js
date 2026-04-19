"use strict";

const canvas = document.getElementById("drawingCanvas");
const ctx = canvas.getContext("2d");

const predictBtn = document.getElementById("predictBtn");
const clearBtn = document.getElementById("clearBtn");
const uploadBtn = document.getElementById("uploadBtn");
const imageUpload = document.getElementById("imageUpload");
const result = document.getElementById("predictionValue");

// 🔥 NEW (for preview)
const uploadPreviewBox = document.getElementById("uploadPreviewBox");
const uploadedPreview = document.getElementById("uploadedPreview");

let uploadedFile = null;

// 🔥 Smooth canvas (HiDPI)
const ratio = window.devicePixelRatio || 1;
canvas.width = 280 * ratio;
canvas.height = 280 * ratio;
canvas.style.width = "280px";
canvas.style.height = "280px";
ctx.scale(ratio, ratio);

// Init
function initCanvas() {
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, 280, 280);

  ctx.strokeStyle = "black";
  ctx.lineWidth = 20;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
}
initCanvas();

let drawing = false;
let lastX = 0;
let lastY = 0;

// Drawing
canvas.addEventListener("mousedown", (e) => {
  drawing = true;
  [lastX, lastY] = getPos(e);
});

canvas.addEventListener("mouseup", () => drawing = false);
canvas.addEventListener("mouseleave", () => drawing = false);

canvas.addEventListener("mousemove", (e) => {
  if (!drawing) return;

  const [x, y] = getPos(e);

  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(x, y);
  ctx.stroke();

  [lastX, lastY] = [x, y];
});

function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  return [
    (e.clientX - rect.left),
    (e.clientY - rect.top)
  ];
}

// 🔥 Upload button
uploadBtn.addEventListener("click", () => imageUpload.click());

// 🔥 Upload + preview + status
imageUpload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  uploadedFile = file;

  const reader = new FileReader();
  reader.onload = (event) => {
    uploadedPreview.src = event.target.result;
    uploadPreviewBox.style.display = "flex";
  };
  reader.readAsDataURL(file);

  result.innerText = "Image uploaded";
});

// Clear
clearBtn.addEventListener("click", () => {
  initCanvas();
  uploadedFile = null;
  result.innerText = "_";

  // 🔥 Clear preview
  uploadPreviewBox.style.display = "none";
  uploadedPreview.src = "";
});

// Predict
predictBtn.addEventListener("click", async () => {
  const blob = uploadedFile ? uploadedFile : await canvasToBlob();

  const formData = new FormData();
  formData.append("file", blob, "digit.png");

  const res = await fetch("http://127.0.0.1:5000/predict", {
    method: "POST",
    body: formData
  });

  const data = await res.json();
  result.innerText = data.prediction;
});

// 🔥 Proper scaling
function canvasToBlob() {
  return new Promise((resolve) => {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = 28;
    tempCanvas.height = 28;

    const tctx = tempCanvas.getContext("2d");
    tctx.imageSmoothingEnabled = false;

    tctx.drawImage(canvas, 0, 0, 28, 28);

    tempCanvas.toBlob((blob) => resolve(blob), "image/png");
  });
}