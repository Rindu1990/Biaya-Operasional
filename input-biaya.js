const GITHUB_TOKEN = prompt("Masukkan GitHub Token Anda").trim();
const GITHUB_USER = "Rindu1990";
const GITHUB_REPO = "biaya-operasional";
const GITHUB_BRANCH = "main";

// Fungsi tambah baris ke tabel secara manual lewat input atas
function tambahBiayaManual() {
  const nama = document.getElementById("inputNamaBiaya").value.trim();
  const nilai = parseFloat(document.getElementById("inputNilaiBiaya").value);

  if (!nama || isNaN(nilai)) {
    alert("Isi nama biaya dan nilai dengan benar.");
    return;
  }

  const tbody = document.getElementById("biaya-body");
  const row = document.createElement("tr");

  row.innerHTML = `
    <td></td>
    <td><input type="text" class="nama-biaya" value="${nama}" required></td>
    <td><input type="number" class="nilai-biaya" value="${nilai}" required></td>
    <td><button type="button" class="btn-danger" onclick="hapusBaris(this)">🗑️</button></td>
  `;

  tbody.appendChild(row);
  reindexNomor();

  // Reset form input atas
  document.getElementById("inputNamaBiaya").value = "";
  document.getElementById("inputNilaiBiaya").value = "";
}

// Fungsi hapus baris
function hapusBaris(button) {
  const row = button.closest("tr");
  row.remove();
  reindexNomor();
}

// Fungsi perbarui nomor otomatis
function reindexNomor() {
  const rows = document.querySelectorAll("#biaya-body tr");
  rows.forEach((row, index) => {
    row.querySelector("td:first-child").textContent = index + 1;
  });
}

// Proses upload ke GitHub
document.getElementById("form-biaya").addEventListener("submit", async function(e) {
  e.preventDefault();
  const statusEl = document.getElementById("status");
  statusEl.textContent = "⏳ Mengupload data...";
  statusEl.style.color = "black";

  const data = {
    nama_pelapor: document.getElementById("namaPelapor").value,
    tanggal_dokumen: document.getElementById("tanggalDokumen").value,
    tempat_dokumen: document.getElementById("tempatDokumen").value,
    nama_pengesah: document.getElementById("namaPengesah").value,
    jabatan_pengesah: document.getElementById("jabatanPengesah").value,
    rincian_biaya: [],
    waktu_input: new Date().toISOString()
  };

  // Ambil data biaya dari tabel
  const namaBiayaEls = document.querySelectorAll(".nama-biaya");
  const nilaiBiayaEls = document.querySelectorAll(".nilai-biaya");

  for (let i = 0; i < namaBiayaEls.length; i++) {
    const nama = namaBiayaEls[i].value.trim();
    const nilai = parseFloat(nilaiBiayaEls[i].value);
    if (nama && !isNaN(nilai)) {
      data.rincian_biaya.push({ nama_biaya: nama, nilai });
    }
  }

  if (data.rincian_biaya.length === 0) {
    statusEl.textContent = "❌ Minimal 1 rincian biaya harus diisi.";
    statusEl.style.color = "red";
    return;
  }

  const tanggal = data.tanggal_dokumen;
  const fileName = `data/biaya-${tanggal}-${Date.now()}.json`;
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));

  const res = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${fileName}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${GITHUB_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: `Upload data biaya ${tanggal}`,
      content: content,
      branch: GITHUB_BRANCH
    })
  });

  if (res.ok) {
    statusEl.textContent = "✅ Data berhasil diupload!";
    statusEl.style.color = "green";
    document.getElementById("form-biaya").reset();
    document.getElementById("biaya-body").innerHTML = "";
    reindexNomor();
  } else {
    const err = await res.json();
    statusEl.textContent = "❌ Gagal upload: " + (err.message || "Terjadi kesalahan");
    statusEl.style.color = "red";
  }
});