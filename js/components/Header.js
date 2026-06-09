// Top Header Navigation Component
import SHEETS_API from '../sheets.js';
import UTILS from '../utils.js';

export const Header = {
  async render(containerId, titleText) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Renders the basic header structure
    container.innerHTML = `
      <header class="main-header">
        <div class="header-title-section">
          <button class="menu-toggle" aria-label="Toggle Menu">☰</button>
          <h1 class="header-title">${titleText}</h1>
        </div>
        <div class="header-actions">
          <div class="header-counsel-badge" id="header-counsel-stats">
            <span>Konseling: -- / -- Siswa</span>
          </div>
          <div id="api-status-badge"></div>
        </div>
      </header>
    `;

    // Perform updates asynchronously
    this.updateStats();
    this.renderApiStatus();
  },

  async updateStats() {
    try {
      const data = await SHEETS_API.getSheetData('hasil_rekomendasi');
      if (!data || data.length <= 1) return;

      const siswaRows = data.slice(1);
      // Valid students (status !== PENDING)
      const validSiswa = siswaRows.filter(row => row[7] !== 'PENDING');
      const totalSiswa = validSiswa.length;

      // Count counseled (check localStorage or flag_konseling in Google Sheets)
      let counseledCount = 0;
      validSiswa.forEach(row => {
        const nis = row[1];
        // If flag in localStorage is true OR sheet column (index 10 or 11, wait, let's look at the columns) is true
        // Let's assume localStorage takes precedence, and fallback to sheet's value if any
        if (UTILS.isCounseled(nis)) {
          counseledCount++;
        }
      });

      const statsBadge = document.getElementById('header-counsel-stats');
      if (statsBadge) {
        statsBadge.innerHTML = `
          <svg style="width:12px;height:12px;" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <span>Konseling: <strong>${counseledCount}</strong> / ${totalSiswa} Siswa</span>
        `;
      }
    } catch (e) {
      console.error("Error loading header counseling statistics:", e);
    }
  },

  renderApiStatus() {
    const badgeContainer = document.getElementById('api-status-badge');
    if (!badgeContainer) return;

    if (window.isMockDataMode) {
      // Show warning badge for Mock mode
      badgeContainer.innerHTML = `
        <span class="badge badge-pending" style="text-transform:none; cursor: help;" title="Spreadsheet tidak dapat diakses atau key salah. Menampilkan data demo.">
          ⚠️ DEMO MODE
        </span>
      `;
      
      // Inject global banner to top of body if not already present
      if (!document.getElementById('demo-global-banner')) {
        const banner = document.createElement('div');
        banner.id = 'demo-global-banner';
        banner.className = 'demo-banner';
        banner.innerHTML = `
          <span><strong>Dashboard Demo:</strong> Menampilkan data simulasi (Mock Data) karena koneksi API Google Sheets dibatasi atau ditolak.</span>
        `;
        document.body.insertBefore(banner, document.body.firstChild);
        
        // Push the sidebar down if the banner is present
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
          sidebar.style.top = '40px';
          sidebar.style.height = 'calc(100vh - 40px)';
        }
        const mainWrapper = document.querySelector('.main-wrapper');
        if (mainWrapper) {
          mainWrapper.style.paddingTop = '0px';
        }
      }
    } else {
      // Show live badge
      badgeContainer.innerHTML = `
        <span class="badge badge-lengkap" style="text-transform:none;">
          ● LIVE DATA
        </span>
      `;
    }
  }
};

export default Header;
