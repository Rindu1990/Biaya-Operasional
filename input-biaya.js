async function generateDanUploadPDF(data) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("p", "mm", "a4");

  const tanggal = data.tanggal_dokumen || new Date().toISOString().slice(0, 10);
  const fileName = `pdf/biaya-${tanggal}-${Date.now()}.pdf`;
  const publicUrl = `https://rindu1990.github.io/Biaya-Operasional/${fileName}`;

  // --- Buat QR Code ---
  const qr = new QRious({
    value: publicUrl,
    size: 100
  });

  const qrData = qr.toDataURL();

  // --- Tulis PDF ---
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text("FORM BIAYA OPERASIONAL USAHA", 10, 15);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.text(`Nama Pelapor: ${data.nama_pelapor}`, 10, 25);
  pdf.text(`Tanggal Dokumen: ${tanggal}`, 10, 30);
  pdf.text(`Tempat Dokumen: ${data.tempat_dokumen}`, 10, 35);

  pdf.text("Rincian Biaya:", 10, 45);
  let y = 50;
  data.rincian_biaya.forEach((item, i) => {
    pdf.text(`${i + 1}. ${item.nama_biaya} - Rp ${item.nilai.toLocaleString()}`, 12, y);
    y += 6;
  });

  y += 10;
  pdf.text(`Pengesah: ${data.nama_pengesah}`, 10, y);
  pdf.text(`Jabatan: ${data.jabatan_pengesah}`, 10, y + 5);

  // --- QR Code ---
  pdf.addImage(qrData, "PNG", 150, 20, 40, 40);
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "italic");
  pdf.text("Scan QR untuk membuka file online", 150, 63);

  // --- Upload PDF ---
  const pdfBlob = pdf.output("blob");
  const reader = new FileReader();

  reader.onloadend = async function () {
    const base64data = reader.result.split(",")[1];

    const uploadRes = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${fileName}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${GITHUB_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: `Upload PDF biaya operasional ${tanggal}`,
        content: base64data,
        branch: GITHUB_BRANCH
      })
    });

    const statusEl = document.getElementById("status");
    if (uploadRes.ok) {
      statusEl.textContent += "\n✅ PDF berhasil diupload dengan QR Code!";
      statusEl.style.color = "green";
    } else {
      const err = await uploadRes.json();
      statusEl.textContent = "❌ Gagal upload PDF: " + (err.message || "Terjadi kesalahan");
      statusEl.style.color = "red";
    }
  };

  reader.readAsDataURL(pdfBlob);
}
