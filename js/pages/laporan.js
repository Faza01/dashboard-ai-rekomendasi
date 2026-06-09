// Laporan Page Controller
import Sidebar from '../components/Sidebar.js';
import Header from '../components/Header.js';
import SHEETS_API from '../sheets.js';
import UTILS from '../utils.js';

let originalStudents = [];

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Render layout components
  await Sidebar.render('sidebar-container');
  await Header.render('header-container', 'Laporan Statistik Konseling');

  // 2. Fetch data
  try {
    const data = await SHEETS_API.getSheetData('hasil_rekomendasi');
    if (!data || data.length <= 1) {
      displayEmptyState();
      return;
    }

    originalStudents = data.slice(1);

    // 3. Render general stats
    renderGeneralStats(originalStudents);

    // 4. Populate class selector options
    populateClassSelector(originalStudents);

    // 5. Setup event handlers
    setupEvents();

  } catch (error) {
    console.error("Error loading report page data:", error);
    alert("Gagal memuat data laporan.");
  }
});

function displayEmptyState() {
  document.getElementById('lbl-total').textContent = '0';
  document.getElementById('lbl-lengkap').textContent = '0';
  document.getElementById('lbl-pending').textContent = '0';
  document.getElementById('lbl-counseled').textContent = '0';
  document.getElementById('select-class-report').disabled = true;
}

function renderGeneralStats(students) {
  const total = students.length;
  const lengkap = students.filter(r => r[7] === 'Lengkap').length;
  const pending = students.filter(r => r[7] === 'PENDING').length;
  
  let counseled = 0;
  students.forEach(r => {
    if (UTILS.isCounseled(r[1])) {
      counseled++;
    }
  });

  const getPctStr = (val, tot) => tot > 0 ? `${((val / tot) * 100).toFixed(1)}%` : '0%';

  document.getElementById('lbl-total').textContent = total;
  document.getElementById('lbl-lengkap').textContent = lengkap;
  document.getElementById('lbl-pending').textContent = pending;
  document.getElementById('lbl-counseled').textContent = counseled;

  document.getElementById('pct-lengkap').textContent = getPctStr(lengkap, total);
  document.getElementById('pct-pending').textContent = getPctStr(pending, total);
  document.getElementById('pct-counseled').textContent = getPctStr(counseled, total);
}

function populateClassSelector(students) {
  const select = document.getElementById('select-class-report');
  if (!select) return;

  const classesSet = new Set();
  students.forEach(row => {
    if (row[3]) classesSet.add(row[3].trim());
  });

  const sortedClasses = Array.from(classesSet).sort();
  sortedClasses.forEach(cls => {
    const opt = document.createElement('option');
    opt.value = cls;
    opt.textContent = cls;
    select.appendChild(opt);
  });
}

function setupEvents() {
  const selectClass = document.getElementById('select-class-report');
  const panel = document.getElementById('class-report-panel');
  const placeholder = document.getElementById('class-report-placeholder');

  const btnPrint = document.getElementById('btn-print-report');
  const btnExport = document.getElementById('btn-export-full-csv');

  // Selector change event
  if (selectClass) {
    selectClass.addEventListener('change', () => {
      const selected = selectClass.value;
      if (!selected) {
        panel.style.display = 'none';
        placeholder.style.display = 'block';
        return;
      }

      panel.style.display = 'block';
      placeholder.style.display = 'none';
      renderClassReport(selected);
    });
  }

  // Print report
  if (btnPrint) {
    btnPrint.addEventListener('click', () => {
      const selectedClass = selectClass ? selectClass.value : '';
      const oldTitle = document.title;
      document.title = selectedClass 
        ? `Laporan_Statistik_BK_Kelas_${selectedClass.replace(/\s+/g, '_')}`
        : 'Laporan_Statistik_BK_SMK_Telkom';
      window.print();
      document.title = oldTitle;
    });
  }

  // Export Full CSV
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      if (originalStudents.length === 0) return;

      const headers = ["NIS", "Nama", "Kelas", "Tipe RIASEC", "Rekomendasi Jurusan", "Rekomendasi Karier", "Status", "Konseling"];
      const rows = originalStudents.map(r => [
        r[1],
        r[2],
        r[3],
        r[4] || '-',
        r[5] ? r[5].split('|').join(', ') : '-',
        r[6] ? r[6].split('|').join(', ') : '-',
        r[7],
        UTILS.isCounseled(r[1]) ? "Sudah" : "Belum"
      ]);

      UTILS.exportToCSV("Rekapitulasi_Laporan_Karier_Siswa_SMK_Telkom.csv", headers, rows);
    });
  }
}

function renderClassReport(className) {
  const classStudents = originalStudents.filter(r => r[3] === className);
  
  // Total in class
  const total = classStudents.length;
  document.getElementById('class-total-siswa').textContent = `${total} Siswa`;

  // Counsel Ratio
  let counseled = 0;
  classStudents.forEach(r => {
    if (UTILS.isCounseled(r[1])) counseled++;
  });
  const counselPct = total > 0 ? ((counseled / total) * 100).toFixed(1) : 0;
  document.getElementById('class-counsel-ratio').textContent = `${counseled} / ${total} (${counselPct}%)`;

  // Dominant RIASEC Type in Class
  const riasecCounts = {};
  classStudents.forEach(r => {
    const rType = r[4];
    if (rType && r[7] !== 'PENDING') {
      riasecCounts[rType] = (riasecCounts[rType] || 0) + 1;
    }
  });

  const dominantRiasec = Object.entries(riasecCounts)
    .sort((a, b) => b[1] - a[1])[0];
  document.getElementById('class-riasec-dominant').textContent = dominantRiasec 
    ? `${dominantRiasec[0]} (${dominantRiasec[1]} Siswa)` 
    : '-';

  // Top Major in Class
  const majorCounts = {};
  classStudents.forEach(r => {
    const majors = r[5];
    if (majors && r[7] !== 'PENDING') {
      const primary = majors.split('|')[0].trim();
      majorCounts[primary] = (majorCounts[primary] || 0) + 1;
    }
  });

  const topMajor = Object.entries(majorCounts)
    .sort((a, b) => b[1] - a[1])[0];
  document.getElementById('class-major-top').textContent = topMajor 
    ? `${topMajor[0]}` 
    : '-';

  // Render Table
  const tbody = document.getElementById('class-students-tbody');
  if (tbody) {
    tbody.innerHTML = classStudents.map(r => {
      const nis = r[1];
      const nama = r[2];
      const riasec = r[4] || '-';
      
      const primaryMajor = r[5] ? r[5].split('|')[0].trim() : '-';
      const isCounseled = UTILS.isCounseled(nis);
      const status = r[7];

      // Riasec Badge
      let riasecBadge = '-';
      if (riasec !== '-' && status !== 'PENDING') {
        const initial = riasec.charAt(0).toLowerCase();
        riasecBadge = `<span class="badge-riasec badge-${initial}">${riasec}</span>`;
      }

      // Counsel Badge
      const counselBadge = isCounseled 
        ? `<span class="badge badge-lengkap">Sudah</span>`
        : `<span class="badge badge-tanpa-nilai">Belum</span>`;

      return `
        <tr>
          <td><strong>${nis}</strong></td>
          <td>${nama}</td>
          <td>${riasecBadge}</td>
          <td>${primaryMajor}</td>
          <td>${counselBadge}</td>
        </tr>
      `;
    }).join('');
  }
}
