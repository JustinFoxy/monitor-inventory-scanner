let inventory = [];
let scanner = null;
let selectedPhotoFile = null;

const $ = (id) => document.getElementById(id);

function getNowText() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function getDateText() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function safeFileName(name) {
  return String(name || "资产盘点")
    .trim()
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, "_") || "资产盘点";
}

function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeText(text) {
  return String(text || "")
    .replace(/[：]/g, ":")
    .replace(/[|]/g, "I")
    .replace(/\s+/g, " ")
    .trim();
}

function extractInfo(rawText) {
  const text = normalizeText(rawText);
  const upper = text.toUpperCase();

  const modelPatterns = [
    /(GPD\s*POCKET\s*[0-9A-Z]+)/i,
    /\b([PUES][0-9]{4}[A-Z]{0,3})\b/i,
    /MODEL\s*[:：]?\s*([A-Z0-9-]{4,30})/i,
    /型号\s*[:：]?\s*([A-Z0-9-]{4,30})/i
  ];

  let model = "";
  for (const pattern of modelPatterns) {
    const match = text.match(pattern);
    if (match) {
      model = match[1].replace(/\s+/g, " ").trim();
      break;
    }
  }

  const serviceTagPatterns = [
    /SERVICE\s*TAG\s*[:：]?\s*([A-Z0-9]{5,25})/i,
    /SVC\s*TAG\s*[:：]?\s*([A-Z0-9]{5,25})/i,
    /S\/N\s*[:：]?\s*([A-Z0-9-]{5,35})/i,
    /SN\s*[:：]?\s*([A-Z0-9-]{5,35})/i,
    /序列号\s*[:：]?\s*([A-Z0-9-]{5,35})/i
  ];

  let sn = "";
  for (const pattern of serviceTagPatterns) {
    const match = upper.match(pattern);
    if (match) {
      sn = match[1].replace(/-/g, "").toUpperCase();
      break;
    }
  }

  if (!sn) {
    const candidates = upper.match(/\b[A-Z0-9]{7,30}\b/g) || [];
    sn = candidates.find(x => !x.match(/^[PUES][0-9]{4}[A-Z]{0,3}$/) && !x.includes("POCKET")) || "";
  }

  return { model, sn };
}

function fillFromText(rawText) {
  $("ocrText").textContent = rawText || "";
  const info = extractInfo(rawText);

  if (info.sn) $("sn").value = info.sn;
  if (info.model) $("model").value = info.model;

  const found = [];
  if (info.sn) found.push(`SN：${info.sn}`);
  if (info.model) found.push(`型号：${info.model}`);

  $("ocrStatus").textContent = found.length
    ? "识别完成，已自动填写：" + found.join("，")
    : "识别完成，但没有自动提取到型号或 SN。可以点开原始文本手动复制。";
}

function renderTable() {
  const tbody = $("inventoryBody");
  tbody.innerHTML = "";

  inventory.forEach((item, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${escapeHtml(item.sn)}</td>
      <td>${escapeHtml(item.model)}</td>
      <td>${escapeHtml(item.location)}</td>
      <td>${escapeHtml(item.user)}</td>
      <td>${escapeHtml(item.status)}</td>
      <td>${escapeHtml(item.remark)}</td>
      <td>${escapeHtml(item.time)}</td>
      <td><button class="deleteBtn" data-index="${index}">删除</button></td>
    `;
    tbody.appendChild(tr);
  });

  document.querySelectorAll(".deleteBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const index = Number(btn.dataset.index);
      inventory.splice(index, 1);
      saveLocal();
      renderTable();
    });
  });
}

function clearForm() {
  $("sn").value = "";
  $("model").value = "";
  $("location").value = "";
  $("user").value = "";
  $("status").value = "在用";
  $("remark").value = "";
  $("ocrText").textContent = "";
  $("ocrStatus").textContent = "请先拍照或选择图片，然后点击“开始 OCR 识别”。";
  $("previewBox").classList.add("hidden");
  $("previewImg").removeAttribute("src");
  selectedPhotoFile = null;
}

function saveLocal() {
  localStorage.setItem("asset_inventory_v22", JSON.stringify(inventory));
  localStorage.setItem("asset_inventory_filename_v22", $("fileName").value || "资产盘点");
}

function loadLocal() {
  const savedName = localStorage.getItem("asset_inventory_filename_v22");
  if (savedName) $("fileName").value = savedName;

  const saved = localStorage.getItem("asset_inventory_v22");
  if (saved) {
    try { inventory = JSON.parse(saved); } catch { inventory = []; }
  }
  renderTable();
}

async function startScan() {
  $("scannerBox").classList.remove("hidden");

  if (!window.Html5Qrcode) {
    alert("扫码组件还没加载完成，请等几秒再试。");
    return;
  }

  scanner = new Html5Qrcode("reader");

  try {
    await scanner.start(
      { facingMode: "environment" },
      {
        fps: 15,
        qrbox: { width: 280, height: 220 },
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.DATA_MATRIX,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E
        ]
      },
      async (decodedText) => {
        $("sn").value = decodedText;
        await stopScan();
        alert("扫码成功：" + decodedText);
      },
      () => {}
    );
  } catch (err) {
    alert("无法打开摄像头。请确认：手机浏览器、HTTPS、允许摄像头权限。");
    console.error(err);
  }
}

async function stopScan() {
  if (scanner) {
    try {
      await scanner.stop();
      await scanner.clear();
    } catch (err) {
      console.warn(err);
    }
    scanner = null;
  }
  $("scannerBox").classList.add("hidden");
}

function selectPhoto(file) {
  if (!file) return;
  selectedPhotoFile = file;

  const imageUrl = URL.createObjectURL(file);
  $("previewImg").src = imageUrl;
  $("previewBox").classList.remove("hidden");
  $("ocrText").textContent = "";
  $("ocrStatus").textContent = "图片已选择。现在点击“开始 OCR 识别”。";
}

async function runOCR() {
  if (!selectedPhotoFile) {
    alert("请先拍照或选择一张标签图片。");
    return;
  }

  $("ocrStatus").textContent = "正在加载 OCR 组件……第一次可能比较慢。";

  if (!window.Tesseract) {
    $("ocrStatus").textContent = "OCR 组件加载失败。请检查网络，刷新页面后再试。";
    return;
  }

  try {
    $("ocrStatus").textContent = "正在识别图片文字，手机上可能需要 5~30 秒，请稍等……";

    const result = await Tesseract.recognize(
      selectedPhotoFile,
      "eng",
      {
        logger: (m) => {
          if (m.status === "recognizing text") {
            const progress = Math.round((m.progress || 0) * 100);
            $("ocrStatus").textContent = `正在 OCR 识别：${progress}%`;
          } else if (m.status) {
            $("ocrStatus").textContent = `OCR 状态：${m.status}`;
          }
        }
      }
    );

    fillFromText(result.data.text);
  } catch (err) {
    $("ocrStatus").textContent = "OCR 识别失败。建议拍近一点、对焦清楚、标签尽量占满画面。";
    console.error(err);
  }
}

function addItem() {
  const sn = $("sn").value.trim();
  if (!sn) {
    alert("请先填写、扫码或拍照识别 SN 序列号。");
    return;
  }

  const item = {
    sn,
    model: $("model").value.trim(),
    location: $("location").value.trim(),
    user: $("user").value.trim(),
    status: $("status").value,
    remark: $("remark").value.trim(),
    time: getNowText()
  };

  inventory.push(item);
  saveLocal();
  renderTable();
  clearForm();
}

function exportExcel() {
  if (inventory.length === 0) {
    alert("还没有录入任何资产。");
    return;
  }

  const rows = inventory.map((item, index) => ({
    "序号": index + 1,
    "SN序列号": item.sn,
    "型号": item.model,
    "位置": item.location,
    "使用人": item.user,
    "状态": item.status,
    "备注": item.remark,
    "录入时间": item.time
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();

  const sheetName = safeFileName($("fileName").value).slice(0, 31);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const fileName = `${safeFileName($("fileName").value)}_${getDateText()}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

window.addEventListener("DOMContentLoaded", () => {
  loadLocal();

  $("fileName").addEventListener("input", saveLocal);
  $("scanBtn").addEventListener("click", startScan);
  $("stopScanBtn").addEventListener("click", stopScan);
  $("addBtn").addEventListener("click", addItem);
  $("exportBtn").addEventListener("click", exportExcel);
  $("ocrBtn").addEventListener("click", runOCR);

  $("photoInput").addEventListener("change", (event) => {
    const file = event.target.files && event.target.files[0];
    selectPhoto(file);
  });
});
