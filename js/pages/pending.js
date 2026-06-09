// Pending Page Controller
import Sidebar from '../components/Sidebar.js';
import Header from '../components/Header.js';
import SHEETS_API from '../sheets.js';
import UTILS from '../utils.js';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Render layout components
  await Sidebar.render('sidebar-container');
  await Header.render('header-container', 'Daftar Siswa Pending');

  // 2. Fetch and render pending list
  await renderPendingList();
});

async function renderPendingList() {
  const tbody = document.getElementById('pending-table-body');
  if (!tbody) return;

  try {
    const data = await SHEETS_API.getSheetData('hasil_rekomendasi');
    if (!data || data.length <= 1) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center text-muted">Tidak ada data pending tersedia</td>
        </tr>
      `;
      return;
    }

    const rows = data.slice(1);
    
    // Filter rows with status 'PENDING' and not resolved locally in this browser session
    const pendingRows = rows.filter(row => {
      const isStatusPending = row[7] === 'PENDING';
      const isResolvedLocally = localStorage.getItem(`resolved_pending_${row[1]}`) === 'true';
      return isStatusPending && !isResolvedLocally;
    });

    if (pendingRows.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center text-muted">🎉 Semua data bersih! Tidak ada antrean siswa pending.</td>
        </tr>
      `;
      return;
    }

    // Populate rows
    tbody.innerHTML = pendingRows.map(row => {
      const timestamp = UTILS.formatDate(row[0]);
      const nis = row[1];
      const nama = row[2] || "Siswa Belum Terdata";
      const kelas = row[3] || "-";
      const alasan = row[10] || "Data nilai belum lengkap / NIS typo";

      return `
        <tr id="row-pending-${nis}">
          <td><strong>${nis}</strong></td>
          <td>${nama}</td>
          <td>${kelas}</td>
          <td>${timestamp}</td>
          <td><span class="badge badge-pending">${alasan}</span></td>
          <td class="no-print">
            <div class="d-flex gap-2">
              <button class="btn btn-success btn-sm btn-resolve" data-nis="${nis}">Tandai Selesai</button>
              <a href="./siswa-detail.html?nis=${nis}" class="btn btn-secondary btn-sm">Detail</a>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Bind resolve buttons
    tbody.querySelectorAll('.btn-resolve').forEach(btn => {
      btn.addEventListener('click', async () => {
        const nis = btn.getAttribute('data-nis');
        if (confirm(`Tandai status pending untuk siswa NIS ${nis} sebagai selesai?`)) {
          // Store resolution in localStorage
          localStorage.setItem(`resolved_pending_${nis}`, 'true');
          
          // Animate hide row
          const row = document.getElementById(`row-pending-${nis}`);
          if (row) {
            row.style.opacity = '0';
            row.style.transform = 'scale(0.95)';
            row.style.transition = 'all 0.3s ease';
            setTimeout(async () => {
              // Refresh full view
              await renderPendingList();
              // Update sidebar badge
              await Sidebar.updatePendingCount();
            }, 300);
          }
        }
      });
    });

  } catch (error) {
    console.error("Error loading pending page data:", error);
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted">Gagal memuat data pending.</td>
      </tr>
    `;
  }
}
