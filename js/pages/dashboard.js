// Dashboard Page Controller
import Sidebar from '../components/Sidebar.js';
import Header from '../components/Header.js';
import SHEETS_API from '../sheets.js';
import UTILS from '../utils.js';

let riasecChartInstance = null;
let majorChartInstance = null;

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Render layout components
  await Sidebar.render('sidebar-container');
  await Header.render('header-container', 'Dashboard Ringkasan Statistik');

  // 2. Fetch data
  try {
    const data = await SHEETS_API.getSheetData('hasil_rekomendasi');
    if (!data || data.length <= 1) {
      displayNoDataState();
      return;
    }

    const headers = data[0];
    const rows = data.slice(1);

    // 3. Calculate statistics
    const totalSiswa = rows.length;
    const lengkapSiswa = rows.filter(r => r[7] === 'Lengkap').length;
    const pendingSiswaRows = rows.filter(r => r[7] === 'PENDING');
    const pendingSiswa = pendingSiswaRows.length;
    
    // Count counseled (using localStorage)
    let counseledSiswa = 0;
    rows.forEach(r => {
      if (UTILS.isCounseled(r[1])) {
        counseledSiswa++;
      }
    });

    // Populate stats in UI
    document.getElementById('stat-total-siswa').textContent = totalSiswa;
    document.getElementById('stat-lengkap').textContent = lengkapSiswa;
    document.getElementById('stat-pending').textContent = pendingSiswa;
    document.getElementById('stat-counseled').textContent = counseledSiswa;

    // 4. Render RIASEC Distribution Chart
    renderRiasecChart(rows);

    // 5. Render Major Recommendations Chart
    renderMajorChart(rows);

    // 6. Render Recent Pending Table
    renderRecentPending(pendingSiswaRows);

    // 7. Render Recent Activities
    renderRecentActivities(rows);

    // Re-render charts on theme change
    document.getElementById('theme-toggle').addEventListener('click', () => {
      // Small timeout to allow CSS variables to update
      setTimeout(() => {
        renderRiasecChart(rows);
        renderMajorChart(rows);
      }, 200);
    });

  } catch (error) {
    console.error("Error loading dashboard data:", error);
    alert("Gagal mengambil data dari Google Sheets. Dashboard dimuat dengan data kosong.");
  }
});

function displayNoDataState() {
  document.getElementById('stat-total-siswa').textContent = '0';
  document.getElementById('stat-lengkap').textContent = '0';
  document.getElementById('stat-pending').textContent = '0';
  document.getElementById('stat-counseled').textContent = '0';
  document.getElementById('pending-table-body').innerHTML = `
    <tr>
      <td colspan="5" class="text-center text-muted">Tidak ada data pending</td>
    </tr>
  `;
  document.getElementById('activity-feed-container').innerHTML = `
    <p class="text-center text-muted">Tidak ada aktivitas kuesioner</p>
  `;
}

function renderRiasecChart(rows) {
  const canvas = document.getElementById('riasecDistributionChart');
  if (!canvas) return;

  // Clean old chart instance
  if (riasecChartInstance) {
    riasecChartInstance.destroy();
  }

  // Count dominant RIASEC types (from index 4: tipe_dominan)
  const counts = {
    "Realistic": 0,
    "Investigative": 0,
    "Artistic": 0,
    "Social": 0,
    "Enterprising": 0,
    "Conventional": 0
  };

  rows.forEach(row => {
    const type = row[4];
    if (counts[type] !== undefined) {
      counts[type]++;
    }
  });

  const labels = Object.keys(counts).map(t => UTILS.getRiasecLabel(t));
  const dataset = Object.values(counts);

  // Fetch color values dynamically from theme variables
  const colors = Object.keys(counts).map(t => UTILS.getRiasecColor(t));

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textClr = isDark ? '#F3F4F6' : '#111827';
  const gridClr = isDark ? '#242E42' : '#E5E7EB';

  const ctx = canvas.getContext('2d');
  riasecChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Jumlah Siswa',
        data: dataset,
        backgroundColor: colors,
        borderRadius: 6,
        barThickness: 18
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isDark ? '#151C2C' : '#FFFFFF',
          titleColor: textClr,
          bodyColor: textClr,
          borderColor: gridClr,
          borderWidth: 1
        }
      },
      scales: {
        x: {
          grid: { color: gridClr },
          ticks: { color: textClr, font: { family: 'Inter' } }
        },
        y: {
          grid: { display: false },
          ticks: { color: textClr, font: { family: 'Inter', weight: 'bold' } }
        }
      }
    }
  });
}

function renderMajorChart(rows) {
  const canvas = document.getElementById('majorDistributionChart');
  if (!canvas) return;

  if (majorChartInstance) {
    majorChartInstance.destroy();
  }

  // Count primary recommended major (index 5)
  const majorCounts = {};
  rows.forEach(row => {
    if (row[7] === 'PENDING') return; // Skip pending
    const majorsStr = row[5];
    if (majorsStr) {
      const primaryMajor = majorsStr.split('|')[0].trim();
      majorCounts[primaryMajor] = (majorCounts[primaryMajor] || 0) + 1;
    }
  });

  // Sort and split top 6
  const sortedMajors = Object.entries(majorCounts)
    .sort((a, b) => b[1] - a[1]);

  let topLabels = [];
  let topData = [];
  let otherSum = 0;

  sortedMajors.forEach(([major, count], idx) => {
    if (idx < 6) {
      topLabels.push(major);
      topData.push(count);
    } else {
      otherSum += count;
    }
  });

  if (otherSum > 0) {
    topLabels.push("Lainnya");
    topData.push(otherSum);
  }

  // Stylish chart color palettes
  const basePalette = [
    '#1558A7', // Primary Blue
    '#10B981', // Emerald
    '#8B5CF6', // Purple
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#EC4899', // Pink
    '#6B7280'  // Gray
  ];

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textClr = isDark ? '#F3F4F6' : '#111827';
  const borderClr = isDark ? '#151C2C' : '#FFFFFF';

  const ctx = canvas.getContext('2d');
  majorChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: topLabels,
      datasets: [{
        data: topData,
        backgroundColor: basePalette.slice(0, topLabels.length),
        borderColor: borderClr,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: textClr,
            font: { family: 'Inter', size: 11 },
            boxWidth: 12
          }
        },
        tooltip: {
          backgroundColor: isDark ? '#151C2C' : '#FFFFFF',
          titleColor: textClr,
          bodyColor: textClr,
          borderColor: borderClr,
          borderWidth: 1
        }
      },
      cutout: '60%'
    }
  });
}

function renderRecentPending(pendingRows) {
  const tbody = document.getElementById('pending-table-body');
  if (!tbody) return;

  if (pendingRows.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-muted">Tidak ada siswa pending</td>
      </tr>
    `;
    return;
  }

  // Sort by timestamp desc (index 0)
  const sorted = [...pendingRows].sort((a, b) => new Date(b[0].replace(/-/g, '/')) - new Date(a[0].replace(/-/g, '/')));
  const recent = sorted.slice(0, 5);

  tbody.innerHTML = recent.map(row => {
    const nis = row[1];
    const nama = row[2] || "Siswa Belum Terdata";
    const kelas = row[3] || "-";
    const alasan = row[10] || "Data tidak cocok / nilai kurang";

    return `
      <tr>
        <td><strong>${nis}</strong></td>
        <td>${nama}</td>
        <td>${kelas}</td>
        <td><span class="badge badge-pending">${alasan}</span></td>
        <td class="no-print">
          <a href="./siswa-detail.html?nis=${nis}" class="btn btn-secondary btn-sm">Lihat</a>
        </td>
      </tr>
    `;
  }).join('');
}

function renderRecentActivities(rows) {
  const container = document.getElementById('activity-feed-container');
  if (!container) return;

  // Filter valid rows and sort by timestamp desc
  const sorted = [...rows]
    .filter(row => row[0]) // check timestamp
    .sort((a, b) => new Date(b[0].replace(/-/g, '/')) - new Date(a[0].replace(/-/g, '/')));

  const recent = sorted.slice(0, 5);

  if (recent.length === 0) {
    container.innerHTML = `<p class="text-center text-muted">Belum ada aktivitas kuesioner</p>`;
    return;
  }

  container.innerHTML = `
    <div class="activity-feed">
      ${recent.map(row => {
        const timeFormatted = UTILS.formatDate(row[0]);
        const name = row[2] || `Siswa NIS ${row[1]}`;
        const kelas = row[3] ? ` (${row[3]})` : '';
        const statusText = row[7] === 'PENDING' ? 'menyelesaikan kuesioner (PENDING)' : 'mendapatkan rekomendasi karier';

        return `
          <div class="activity-item">
            <div class="activity-icon"></div>
            <div class="activity-content">
              <span><strong>${name}</strong>${kelas} baru saja ${statusText}.</span>
              <span class="activity-time">${timeFormatted}</span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}
