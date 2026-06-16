let inventory = [];
let scanner = null;

const $ = (id) => document.getElementById(id);

function getNowText() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
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

  // 常见 Dell 型号：P2422H、P2419H、U2722D、E2420H、S2721QS 等
  const modelPatterns = [
    /\b([PUES][0-9]{4}[A-Z]{0,3})\b/i,
    /MODEL\s*[:：]?\s*([A-Z0-9-]{4,20})/i,
    /型号\s*[:：]?\s*([A-Z0-9-]{4,20})/i
  ];

  let model = "";
  for (const pattern of modelPatterns) {
    const match = text.match(pattern);
    if (match) {
      model = match[1].toUpperCase();
      break;
    }
  }

  // Dell Service Tag 通常 7 位字母数字；优先匹配 Service Tag 后面的内容
  const serviceTagPatterns = [
    /SERVICE\s*TAG\s*[:：]?\s*([A-Z0-9]{5,10})/i,
    /SVC\s*TAG\s*[:：]?\s*([A-Z0-9]{5,10})/i,
    /服务标签\s*[:：]?\s*([A-Z0-9]{5,10})/i
  ];

  let serviceTag = "";
  for (const pattern of serviceTagPatterns) {
    const match = upper.match(pattern);
    if (match) {
      serviceTag = match[1].toUpperCase();
      break;
    }
  }

  // 如果没识别出 Service Tag，就从全部文本里找一个像 Dell Service Tag 的 7 位码
  if (!serviceTag) {
    const candidates = upper.match(/\b[A-Z0-9]{7}\b/g) || [];
    const blacklist = new Set(["P2422H", "P2419H", "U2722D", "E2420H"]);
    serviceTag = candidates.find(x => !blacklist.has(x)) || "";
  }

  return { model, serviceTag };
}

function fillFromText(rawText) {
  $("ocrText").textContent = rawText || "";

  const info = extractInfo(rawText);

  if (info.serviceTag) {
    $("sn").value = info.serviceTag;
  }

  if (info.model) {
    $("model").value = info.model;
  }

  const found = [];
  if (info.serviceTag) found.push(`SN/Service Tag：${info.serviceTag}`);
  if (info.model) found.push(`型号：${info.model}`);

  $("ocrStatus").textContent = found.length
    ? "识别完成，已自动填写：" + found.join("，")
    : "识别完成，但没有自动提取到型号或 Service Tag。可以点开原始文本手动复制。";
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
  $("ocrStatus").textContent = "";
  $("previewBox").classList.add("hidden");
  $("previewImg").removeAttribute("src");
}

function saveLocal() {
  localStorage.setItem("monitor_inventory_v2", JSON.stringify(inventory));
}

function loadLocal() {
  const saved = localStorage.getItem("monitor_inventory_v2");
  if (saved) {
    try {
      inventory = JSON.parse(saved);
    } catch {
      inventory = [];
    }
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

async function handlePhoto(file) {
  if (!file) return;

  if (!window.Tesseract) {
    alert("OCR 组件还没加载完成，请等几秒再试。");
    return;
  }

  const imageUrl = URL.createObjectURL(file);
  $("previewImg").src = imageUrl;
  $("previewBox").classList.remove("hidden");
  $("ocrStatus").textContent = "正在识别图片文字，手机上可能需要 5~20 秒，请稍等……";
  $("ocrText").textContent = "";

  try {
    const result = await Tesseract.recognize(
      file,
      "eng",
      {
        logger: (m) => {
          if (m.status === "recognizing text") {
            const progress = Math.round((m.progress || 0) * 100);
            $("ocrStatus").textContent = `正在 OCR 识别：${progress}%`;
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
    alert("请先填写、扫码或拍照识别 SN / Service Tag。");
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
    alert("还没有录入任何显示器。");
    return;
  }

  const rows = inventory.map((item, index) => ({
    "序号": index + 1,
    "SN/Service Tag": item.sn,
    "型号": item.model,
    "位置": item.location,
    "使用人": item.user,
    "状态": item.status,
    "备注": item.remark,
    "录入时间": item.time
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "显示器盘点");

  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `显示器盘点_${date}.xlsx`);
}

window.addEventListener("DOMContentLoaded", () => {
  loadLocal();

  $("scanBtn").addEventListener("click", startScan);
  $("stopScanBtn").addEventListener("click", stopScan);
  $("addBtn").addEventListener("click", addItem);
  $("exportBtn").addEventListener("click", exportExcel);

  $("photoInput").addEventListener("change", (event) => {
    const file = event.target.files && event.target.files[0];
    handlePhoto(file);
    event.target.value = "";
  });
});
