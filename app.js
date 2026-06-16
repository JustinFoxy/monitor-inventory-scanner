let inventory = [];
let scanner = null;

const $ = (id) => document.getElementById(id);

function getNowText() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
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

function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function clearForm() {
  $("sn").value = "";
  $("model").value = "";
  $("location").value = "";
  $("user").value = "";
  $("status").value = "在用";
  $("remark").value = "";
}

function saveLocal() {
  localStorage.setItem("monitor_inventory", JSON.stringify(inventory));
}

function loadLocal() {
  const saved = localStorage.getItem("monitor_inventory");
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
        fps: 10,
        qrbox: { width: 280, height: 140 },
        formatsToSupport: [
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
    alert("无法打开摄像头。请确认：1）手机浏览器打开；2）网址是 HTTPS；3）允许摄像头权限。");
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

function addItem() {
  const sn = $("sn").value.trim();

  if (!sn) {
    alert("请先填写或扫码 SN 序列号。");
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
});
