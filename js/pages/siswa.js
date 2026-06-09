// Data Siswa Page Controller
import Sidebar from '../components/Sidebar.js';
import Header from '../components/Header.js';
import SHEETS_API from '../sheets.js';
import UTILS from '../utils.js';

// Table state
let originalStudents = [];
let filteredStudents = [];
let currentPage = 1;
const rowsPerPage = 20;

let currentSortColumn = '1'; // Default: NIS (index 1)
let currentSortDir = 'asc';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Render layout components
  await Sidebar.render('sidebar-container');
  await Header.render('header-container', 'Data Seluruh Siswa');

  // 2. Fetch data
  try {
    const data = await SHEETS_API.getSheetData('hasil_rekomendasi');
    if (!data || data.length <= 1) {
      displayEmptyTable();
      return;
    }

    // Header row is index 0
    originalStudents = data.slice(1);
    filteredStudents = [...originalStudents];

    // 3. Populate filters
    populateClassFilter(originalStudents);

    // 4. Bind events
    setupFilterEvents();
    setupTableSorting();
    setupExportEvents();

    // 5. Initial render
    applyFiltersAndRender();

  } catch (error) {
    console.error("Error loading student data:", error);
    displayEmptyTable("Gagal mengambil data siswa.");
  }
});

function displayEmptyTable(message = "Tidak ada data siswa") {
  const tbody = document.getElementById('siswa-table-body');
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="text-center text-muted">${message}</td>
      </tr>
    `;
  }
  document.getElementById('pagination-info').textContent = "Menampilkan 0-0 dari 0 siswa";
  document.getElementById('pagination-controls').innerHTML = '';
}

function populateClassFilter(students) {
  const select = document.getElementById('filter-kelas');
  if (!select) return;

  // Extract unique classes
  const classesSet = new Set();
  students.forEach(row => {
    if (row[3]) classesSet.add(row[3].trim());
  });

  // Sort classes alphabetically
  const sortedClasses = Array.from(classesSet).sort();

  sortedClasses.forEach(cls => {
    const opt = document.createElement('option');
    opt.value = cls;
    opt.textContent = cls;
    select.appendChild(opt);
  });
}

function setupFilterEvents() {
  const searchInput = document.getElementById('search-input');
  const filterKelas = document.getElementById('filter-kelas');
  const filterJurusan = document.getElementById('filter-jurusan');
  const filterStatus = document.getElementById('filter-status');
  const btnReset = document.getElementById('btn-reset-filters');

  const onFilterChange = () => {
    currentPage = 1;
    applyFiltersAndRender();
  };

  if (searchInput) searchInput.addEventListener('input', onFilterChange);
  if (filterKelas) filterKelas.addEventListener('change', onFilterChange);
  if (filterJurusan) filterJurusan.addEventListener('change', onFilterChange);
  if (filterStatus) filterStatus.addEventListener('change', onFilterChange);

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (filterKelas) filterKelas.value = '';
      if (filterJurusan) filterJurusan.value = '';
      if (filterStatus) filterStatus.value = '';
      currentPage = 1;
      applyFiltersAndRender();
    });
  }
}

function applyFiltersAndRender() {
  const searchQuery = document.getElementById('search-input').value.toLowerCase().trim();
  const selectedKelas = document.getElementById('filter-kelas').value;
  const selectedJurusan = document.getElementById('filter-jurusan').value;
  const selectedStatus = document.getElementById('filter-status').value;

  filteredStudents = originalStudents.filter(row => {
    const nis = row[1] || '';
    const nama = row[2] || '';
    const kelas = row[3] || '';
    const riasec = row[4] || '';
    const status = row[7] || '';

    // Search query matches NIS or Name
    const matchesSearch = nis.toLowerCase().includes(searchQuery) || nama.toLowerCase().includes(searchQuery);

    // Class filter matches
    const matchesClass = !selectedKelas || kelas === selectedKelas;

    // Major filter matches (checks if major tag exists in recommended majors)
    // E.g. selectedJurusan = "RPL", matches in "Rekayasa Perangkat Lunak" or if student class contains RPL
    const matchesMajor = !selectedJurusan || 
                         kelas.toUpperCase().includes(selectedJurusan) || 
                         (row[5] && row[5].toUpperCase().includes(selectedJurusan));

    // Status matches
    const matchesStatus = !selectedStatus || status === selectedStatus;

    return matchesSearch && matchesClass && matchesMajor && matchesStatus;
  });

  // Sort data
  sortData();

  // Render Table
  renderTable();
}

function setupTableSorting() {
  const headers = document.querySelectorAll('#siswa-table th[data-column]');
  headers.forEach(header => {
    header.addEventListener('click', () => {
      const colId = header.getAttribute('data-column');
      if (colId === 'num' || colId === 'counsel') return; // Don't sort index or checkbox

      if (currentSortColumn === colId) {
        currentSortDir = currentSortDir === 'asc' ? 'desc' : 'asc';
      } else {
        currentSortColumn = colId;
        currentSortDir = 'asc';
      }

      // Reset header classes
      headers.forEach(h => {
        h.classList.remove('sort-asc', 'sort-desc');
      });

      // Set class on active header
      header.classList.add(currentSortDir === 'asc' ? 'sort-asc' : 'sort-desc');

      applyFiltersAndRender();
    });
  });
}

function sortData() {
  if (!currentSortColumn) return;

  const colIndex = parseInt(currentSortColumn);

  filteredStudents.sort((a, b) => {
    let valA = a[colIndex] || '';
    let valB = b[colIndex] || '';

    // Numeric comparison for NIS or average grade if sorted by that
    if (colIndex === 1) { // NIS is index 1
      return currentSortDir === 'asc' 
        ? parseInt(valA) - parseInt(valB) 
        : parseInt(valB) - parseInt(valA);
    }

    // Alphabetical comparison
    return currentSortDir === 'asc' 
      ? valA.localeCompare(valB) 
      : valB.localeCompare(valA);
  });
}

function renderTable() {
  const tbody = document.getElementById('siswa-table-body');
  if (!tbody) return;

  if (filteredStudents.length === 0) {
    displayEmptyTable("Pencarian tidak cocok.");
    return;
  }

  // Calculate pagination boundaries
  const totalItems = filteredStudents.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  
  if (currentPage > totalPages) {
    currentPage = totalPages;
  }
  if (currentPage < 1) {
    currentPage = 1;
  }

  const startIdx = (currentPage - 1) * rowsPerPage;
  const endIdx = Math.min(startIdx + rowsPerPage, totalItems);
  const pageItems = filteredStudents.slice(startIdx, endIdx);

  // Populate rows
  tbody.innerHTML = pageItems.map((row, idx) => {
    const absoluteIndex = startIdx + idx + 1;
    const nis = row[1];
    const nama = row[2];
    const kelas = row[3];
    const riasec = row[4];
    
    // Format Majors/Careers
    const majors = row[5] ? row[5].split('|').join(', ') : '-';
    const careers = row[6] ? row[6].split('|').join(', ') : '-';
    
    const status = row[7];
    const isCounseled = UTILS.isCounseled(nis);

    // Get Status Badge
    let statusClass = 'badge-tanpa-nilai';
    if (status === 'Lengkap') statusClass = 'badge-lengkap';
    if (status === 'PENDING') statusClass = 'badge-pending';
    
    const statusBadge = `<span class="badge ${statusClass}">${status}</span>`;

    // Get Riasec Badge
    let riasecBadge = '-';
    if (riasec && status !== 'PENDING') {
      const initial = riasec.charAt(0).toLowerCase();
      riasecBadge = `<span class="badge-riasec badge-${initial}" title="${UTILS.getRiasecLabel(riasec)}">${riasec}</span>`;
    }

    return `
      <tr>
        <td>${absoluteIndex}</td>
        <td><strong>${nis}</strong></td>
        <td><a href="./siswa-detail.html?nis=${nis}" class="student-link">${nama}</a></td>
        <td>${kelas}</td>
        <td class="text-center">${riasecBadge}</td>
        <td>${majors}</td>
        <td>${careers}</td>
        <td>${statusBadge}</td>
        <td class="text-center no-print">
          <input type="checkbox" id="counsel-${nis}" ${isCounseled ? 'checked' : ''} style="transform: scale(1.2); cursor: pointer;">
        </td>
        <td class="no-print">
          <a href="./siswa-detail.html?nis=${nis}" class="btn btn-secondary btn-sm">Detail</a>
        </td>
      </tr>
    `;
  }).join('');

  // Attach event listeners to checkboxes
  pageItems.forEach(row => {
    const nis = row[1];
    const checkbox = document.getElementById(`counsel-${nis}`);
    if (checkbox) {
      checkbox.addEventListener('change', () => {
        UTILS.toggleCounseled(nis);
        // Refresh Header stats ratio
        Header.updateStats();
      });
    }
  });

  // Render pagination info
  document.getElementById('pagination-info').textContent = 
    `Menampilkan ${startIdx + 1}-${endIdx} dari ${totalItems} siswa`;

  // Render pagination controls
  renderPaginationControls(totalPages);
}

function renderPaginationControls(totalPages) {
  const controls = document.getElementById('pagination-controls');
  if (!controls) return;

  if (totalPages <= 1) {
    controls.innerHTML = '';
    return;
  }

  let html = '';

  // Previous button
  html += `<button class="pagination-btn ${currentPage === 1 ? 'disabled' : ''}" id="page-prev" ${currentPage === 1 ? 'disabled' : ''}>&lt;</button>`;

  // Page numbers
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    html += `<button class="pagination-btn ${currentPage === i ? 'active' : ''}" data-page="${i}">${i}</button>`;
  }

  // Next button
  html += `<button class="pagination-btn ${currentPage === totalPages ? 'disabled' : ''}" id="page-next" ${currentPage === totalPages ? 'disabled' : ''}>&gt;</button>`;

  controls.innerHTML = html;

  // Bind click handlers
  controls.querySelectorAll('.pagination-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('disabled')) return;
      
      if (btn.id === 'page-prev') {
        currentPage--;
      } else if (btn.id === 'page-next') {
        currentPage++;
      } else {
        currentPage = parseInt(btn.getAttribute('data-page'));
      }
      
      renderTable();
    });
  });
}

function setupExportEvents() {
  const btnCsv = document.getElementById('btn-export-csv');
  const btnExcel = document.getElementById('btn-export-excel');

  if (btnCsv) {
    btnCsv.addEventListener('click', () => {
      if (filteredStudents.length === 0) return;

      const headers = ["NIS", "Nama", "Kelas", "Tipe RIASEC", "Rekomendasi Jurusan", "Rekomendasi Karier", "Status", "Konseling"];
      const rows = filteredStudents.map(r => [
        r[1], // NIS
        r[2], // Nama
        r[3], // Kelas
        r[4] || '-', // RIASEC
        r[5] ? r[5].split('|').join(', ') : '-', // Jurusan
        r[6] ? r[6].split('|').join(', ') : '-', // Karier
        r[7], // Status
        UTILS.isCounseled(r[1]) ? "Sudah" : "Belum"
      ]);

      UTILS.exportToCSV("Daftar_Siswa_Rekomendasi_BK.csv", headers, rows);
    });
  }

  if (btnExcel) {
    btnExcel.addEventListener('click', () => {
      if (filteredStudents.length === 0) return;

      const wb = XLSX.utils.book_new();
      
      // Build cells sheet
      const wsData = [
        ["NIS", "Nama", "Kelas", "Tipe RIASEC", "Rekomendasi Jurusan", "Rekomendasi Karier", "Status", "Konseling"]
      ];

      filteredStudents.forEach(r => {
        wsData.push([
          r[1],
          r[2],
          r[3],
          r[4] || '-',
          r[5] ? r[5].split('|').join(', ') : '-',
          r[6] ? r[6].split('|').join(', ') : '-',
          r[7],
          UTILS.isCounseled(r[1]) ? "Sudah" : "Belum"
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      
      // Auto-fit columns
      const maxColWidths = wsData[0].map((_, colIdx) => {
        return Math.max(...wsData.map(row => row[colIdx] ? String(row[colIdx]).length : 0)) + 3;
      });
      ws['!cols'] = maxColWidths.map(w => ({ wch: w }));

      XLSX.utils.book_append_sheet(wb, ws, "Daftar Siswa");
      XLSX.writeFile(wb, "Daftar_Siswa_Rekomendasi_BK.xlsx");
    });
  }
}
