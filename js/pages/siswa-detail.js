// Detail Siswa Page Controller
import Sidebar from '../components/Sidebar.js';
import Header from '../components/Header.js';
import SHEETS_API from '../sheets.js';
import UTILS from '../utils.js';

let radarChartInstance = null;

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Render layout components
  await Sidebar.render('sidebar-container');

  // 2. Get NIS from query parameter
  const nis = UTILS.getQueryParam('nis');
  if (!nis) {
    alert("NIS Siswa tidak ditentukan.");
    window.location.href = './siswa.html';
    return;
  }

  await Header.render('header-container', `Profil Detail Siswa`);

  // 3. Fetch all sheets data
  try {
    const [recData, riasecData, gradesData, achievementsData] = await Promise.all([
      SHEETS_API.getSheetData('hasil_rekomendasi'),
      SHEETS_API.getSheetData('skor_riasec'),
      SHEETS_API.getSheetData('nilai_siswa'),
      SHEETS_API.getSheetData('prestasi_siswa')
    ]);

    // 4. Find student profile in hasil_rekomendasi
    // Columns: Timestamp[0], NIS[1], Nama[2], Kelas[3], TipeRIASEC[4], Jurusan[5], Karier[6], Status[7], Expl[8], Tips[9]
    const studentRow = recData.slice(1).find(row => row[1] === nis);
    if (!studentRow) {
      displayStudentNotFound();
      return;
    }

    // 5. Populate Profile Section
    populateProfile(studentRow);

    // 6. Draw RIASEC Radar Chart
    drawRadarChart(nis, riasecData);

    // 7. Populate Grades Section
    populateGrades(nis, gradesData);

    // 8. Populate AI Advice
    populateAiAdvice(studentRow);

    // 9. Populate Achievements Table
    populateAchievements(nis, achievementsData);

    // 10. Populate Counseling Notes
    populateNotes(nis);

    // 11. Bind Actions
    setupActions(nis, studentRow);

    // Re-render chart on theme change
    document.getElementById('theme-toggle').addEventListener('click', () => {
      setTimeout(() => {
        drawRadarChart(nis, riasecData);
      }, 200);
    });

  } catch (error) {
    console.error("Error loading student detail data:", error);
    alert("Terjadi kesalahan saat memuat data profil siswa.");
  }
});

function displayStudentNotFound() {
  document.getElementById('detail-content-area').innerHTML = `
    <div class="card text-center py-12">
      <h2 class="mb-2">Siswa Tidak Ditemukan</h2>
      <p class="text-muted mb-6">Profil dengan NIS tersebut tidak terdaftar di database.</p>
      <a href="./siswa.html" class="btn btn-primary">Kembali ke Daftar Siswa</a>
    </div>
  `;
}

function populateProfile(studentRow) {
  const name = studentRow[2];
  const nis = studentRow[1];
  const kelas = studentRow[3];
  const riasec = studentRow[4];

  // Inisial avatar
  const initials = name ? name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() : '--';
  const avatar = document.getElementById('student-avatar-badge');
  avatar.textContent = initials;
  
  // Set consistent color based on RIASEC type or name hash
  if (riasec) {
    avatar.style.backgroundColor = UTILS.getRiasecColor(riasec);
  } else {
    avatar.style.backgroundColor = '#1558A7';
  }

  document.getElementById('student-name').textContent = name;
  document.getElementById('student-nis-class').textContent = `NIS: ${nis} | Kelas: ${kelas}`;

  // Badge RIASEC
  const badgeContainer = document.getElementById('student-riasec-badge-container');
  if (riasec && studentRow[7] !== 'PENDING') {
    const label = UTILS.getRiasecLabel(riasec);
    const initial = riasec.charAt(0).toLowerCase();
    badgeContainer.innerHTML = `<span class="badge-riasec badge-${initial} px-3 py-1" style="font-size: 14px;">Tipe Dominan: ${label}</span>`;
  } else {
    badgeContainer.innerHTML = `<span class="badge badge-pending">Status: PENDING</span>`;
  }
}

function drawRadarChart(nis, riasecData) {
  const canvas = document.getElementById('riasecRadarChart');
  if (!canvas) return;

  if (radarChartInstance) {
    radarChartInstance.destroy();
  }

  // Find student scores row
  // Columns: NIS[0], R[1], I[2], A[3], S[4], E[5], C[6]
  const scoresRow = riasecData.slice(1).find(row => row[0] === nis);
  
  // Default score values if missing (e.g. pending student)
  let scores = [0, 0, 0, 0, 0, 0];
  if (scoresRow) {
    scores = [
      parseFloat(scoresRow[1]) || 0,
      parseFloat(scoresRow[2]) || 0,
      parseFloat(scoresRow[3]) || 0,
      parseFloat(scoresRow[4]) || 0,
      parseFloat(scoresRow[5]) || 0,
      parseFloat(scoresRow[6]) || 0
    ];
  }

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textClr = isDark ? '#F3F4F6' : '#111827';
  const gridClr = isDark ? '#242E42' : '#E5E7EB';
  const primaryClr = isDark ? '#3B82F6' : '#1558A7';
  const primaryLightClr = isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(21, 88, 167, 0.2)';

  const ctx = canvas.getContext('2d');
  radarChartInstance = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['R', 'I', 'A', 'S', 'E', 'C'],
      datasets: [{
        label: 'Skor RIASEC',
        data: scores,
        backgroundColor: primaryLightClr,
        borderColor: primaryClr,
        borderWidth: 2,
        pointBackgroundColor: primaryClr,
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: primaryClr
      }]
    },
    options: {
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
        r: {
          angleLines: { color: gridClr },
          grid: { color: gridClr },
          pointLabels: {
            color: textClr,
            font: { family: 'Outfit', size: 14, weight: 'bold' }
          },
          ticks: {
            color: textClr,
            backdropColor: 'transparent',
            font: { size: 9 },
            stepSize: 3
          },
          min: 0,
          max: 15
        }
      }
    }
  });
}

function populateGrades(nis, gradesData) {
  const container = document.getElementById('grades-list-container');
  if (!container) return;

  // Find grades row
  // Columns: NIS[0], Mat[1], Ind[2], Ing[3], Pem[4], Jar[5], TJA[6], Avg[7]
  const row = gradesData.slice(1).find(r => r[0] === nis);
  if (!row) {
    container.innerHTML = `<p class="text-center text-muted py-4">Data nilai tidak tersedia</p>`;
    return;
  }

  const subjects = [
    { name: "Matematika", score: parseInt(row[1]) || 0 },
    { name: "B. Indonesia", score: parseInt(row[2]) || 0 },
    { name: "B. Inggris", score: parseInt(row[3]) || 0 },
    { name: "Pemrograman", score: parseInt(row[4]) || 0 },
    { name: "Jaringan", score: parseInt(row[5]) || 0 },
    { name: "Teknik Jaringan Akses (TJA)", score: parseInt(row[6]) || 0 },
    { name: "Rata-rata", score: parseFloat(row[7]) || 0, isAverage: true }
  ];

  container.innerHTML = subjects.map(sub => {
    // Determine grade level style
    let barColor = 'var(--color-primary)';
    if (sub.score >= 85) barColor = 'var(--color-success)';
    else if (sub.score < 75) barColor = 'var(--color-danger)';

    return `
      <div class="grade-row ${sub.isAverage ? 'semibold mt-3' : ''}">
        <span>${sub.name}</span>
        <div class="d-flex align-items-center">
          <strong style="min-width: 32px; text-align: right;">${sub.score}</strong>
          <div class="grade-bar-container no-print">
            <div class="grade-bar-fill" style="width: ${sub.score}%; background-color: ${barColor};"></div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function populateAiAdvice(studentRow) {
  const status = studentRow[7];
  
  const recMajorsList = document.getElementById('rec-majors-list');
  const recCareersList = document.getElementById('rec-careers-list');
  const explBox = document.getElementById('ai-explanation-box');
  const tipsBox = document.getElementById('ai-tips-box');

  if (status === 'PENDING') {
    recMajorsList.innerHTML = `<li class="text-muted">Rekomendasi tertunda</li>`;
    recCareersList.innerHTML = `<li class="text-muted">Rekomendasi tertunda</li>`;
    explBox.innerHTML = `Siswa ini berstatus PENDING. Rekomendasi AI tidak dapat diproses karena: <strong>${studentRow[10] || 'Kesalahan Data NIS/Nilai'}</strong>.`;
    tipsBox.innerHTML = `Lakukan pemeriksaan data NIS siswa di Lembar Data Nilai atau formulir kuesioner.`;
    return;
  }

  // Populate recommended majors
  const majors = studentRow[5] ? studentRow[5].split('|') : [];
  if (majors.length > 0) {
    recMajorsList.innerHTML = majors.map((major, i) => `
      <li class="rec-item">
        <span class="rec-num">${i + 1}</span>
        <div><strong>${major}</strong></div>
      </li>
    `).join('');
  } else {
    recMajorsList.innerHTML = `<li class="text-muted">-</li>`;
  }

  // Populate recommended careers
  const careers = studentRow[6] ? studentRow[6].split('|') : [];
  if (careers.length > 0) {
    recCareersList.innerHTML = careers.map((career, i) => `
      <li class="rec-item">
        <span class="rec-num">${i + 1}</span>
        <div><strong>${career}</strong></div>
      </li>
    `).join('');
  } else {
    recCareersList.innerHTML = `<li class="text-muted">-</li>`;
  }

  // Explanations
  explBox.textContent = studentRow[8] || "Analisis tidak tersedia.";
  tipsBox.textContent = studentRow[9] || "Tips tidak tersedia.";
}

function populateAchievements(nis, achievementsData) {
  const tbody = document.getElementById('achievements-table-body');
  if (!tbody) return;

  // Columns: NIS[0], NamaKegiatan[1], Kategori[2], Tingkat[3], Prestasi[4]
  const rows = achievementsData.slice(1).filter(r => r[0] === nis);
  if (rows.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center text-muted">Tidak ada data prestasi tercatat</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = rows.map(r => `
    <tr>
      <td><strong>${r[1]}</strong></td>
      <td>${r[2]}</td>
      <td>${r[3]}</td>
      <td><span class="badge badge-lengkap">${r[4]}</span></td>
    </tr>
  `).join('');
}

function populateNotes(nis) {
  const container = document.getElementById('notes-list-container');
  if (!container) return;

  const notes = UTILS.getCounselingNotes(nis);
  if (notes.length === 0) {
    container.innerHTML = `<p class="text-muted py-4 text-center">Belum ada catatan konseling untuk siswa ini.</p>`;
    return;
  }

  container.innerHTML = notes.map(note => {
    const formattedDate = UTILS.formatDate(note.timestamp);
    return `
      <div class="note-item" id="note-${note.id}">
        <div class="note-header">
          <span>📅 ${formattedDate}</span>
          <span class="note-delete" data-id="${note.id}" style="cursor:pointer;">Hapus</span>
        </div>
        <p class="note-text">${note.text}</p>
      </div>
    `;
  }).join('');

  // Bind deletes
  container.querySelectorAll('.note-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Hapus catatan konseling ini?')) {
        const noteId = parseInt(btn.getAttribute('data-id'));
        UTILS.deleteCounselingNote(nis, noteId);
        populateNotes(nis);
      }
    });
  });
}

function setupActions(nis, studentRow) {
  const btnCounsel = document.getElementById('btn-toggle-counsel');
  const btnPrint = document.getElementById('btn-print-laporan');
  const noteForm = document.getElementById('note-form');

  // Counsel Toggle
  const updateCounselBtnState = () => {
    const counseled = UTILS.isCounseled(nis);
    if (counseled) {
      btnCounsel.textContent = '✓ Sudah Dikonseling';
      btnCounsel.className = 'btn btn-success';
    } else {
      btnCounsel.textContent = 'Tandai Dikonseling';
      btnCounsel.className = 'btn btn-outline-primary';
    }
  };

  updateCounselBtnState();

  btnCounsel.addEventListener('click', () => {
    UTILS.toggleCounseled(nis);
    updateCounselBtnState();
    // Update Header progress bar ratio
    Header.updateStats();
  });

  // Print Action
  btnPrint.addEventListener('click', () => {
    // Temporarily set document title for a cleaner filename when exporting to PDF
    const oldTitle = document.title;
    document.title = `Laporan_Rekomendasi_${studentRow[2].replace(/\s+/g, '_')}_${nis}`;
    window.print();
    document.title = oldTitle;
  });

  // Notes Form Submit
  if (noteForm) {
    noteForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const textarea = document.getElementById('note-textarea');
      const text = textarea.value.trim();
      if (text) {
        UTILS.saveCounselingNote(nis, text);
        textarea.value = '';
        populateNotes(nis);
      }
    });
  }
}
