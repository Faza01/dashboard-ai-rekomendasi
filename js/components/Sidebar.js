// Sidebar Navigation Component
import AUTH from '../auth.js';
import SHEETS_API from '../sheets.js';

export const Sidebar = {
  async render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const user = AUTH.getCurrentUser();
    if (!user) return;

    // Get current path to highlight active link
    const currentPath = window.location.pathname;
    const isDashboard = currentPath.endsWith('dashboard.html') || currentPath.endsWith('index.html');
    const isSiswa = currentPath.endsWith('siswa.html') || currentPath.includes('siswa-detail.html');
    const isPending = currentPath.endsWith('pending.html');
    const isLaporan = currentPath.endsWith('laporan.html');

    // Get active theme
    const activeTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', activeTheme);

    // Determine paths based on current directory structure
    const isInPagesFolder = currentPath.includes('/pages/');
    const basePath = isInPagesFolder ? './' : './pages/';
    const rootPath = isInPagesFolder ? '../' : './';

    // Renders the HTML
    container.innerHTML = `
      <aside class="sidebar">
        <div class="sidebar-brand">
          <!-- Logo SMK Telkom (SVG Graphic fallback) -->
          <svg class="sidebar-logo" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="background: white; padding: 4px;">
            <circle cx="50" cy="50" r="45" fill="#D32F2F"/>
            <path d="M30 30H70V38H54V70H46V38H30V30Z" fill="white"/>
            <rect x="50" y="38" width="8" height="32" fill="#E57373"/>
          </svg>
          <div>
            <span class="sidebar-title">SMK Telkom</span>
            <span class="sidebar-subtitle">AI Rekomendasi Karier</span>
          </div>
        </div>

        <nav class="sidebar-nav">
          <a href="${basePath}dashboard.html" class="sidebar-link ${isDashboard ? 'active' : ''}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 9V3h8v6h-8zM3 13h8V3H3v10zm10 8h8v-8h-8v8zM3 21h8v-6H3v6z"/>
            </svg>
            Dashboard
          </a>
          <a href="${basePath}siswa.html" class="sidebar-link ${isSiswa ? 'active' : ''}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
            Data Siswa
          </a>
          <a href="${basePath}pending.html" class="sidebar-link ${isPending ? 'active' : ''}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/>
            </svg>
            Pending
            <span class="sidebar-badge" id="sidebar-pending-count" style="display:none;">0</span>
          </a>
          <a href="${basePath}laporan.html" class="sidebar-link ${isLaporan ? 'active' : ''}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
            Laporan
          </a>
        </nav>

        <div class="sidebar-footer">
          <div class="sidebar-profile">
            <div class="profile-avatar">${user.username.charAt(0).toUpperCase()}</div>
            <div class="profile-info">
              <span class="profile-name" title="${user.username}">${user.username}</span>
              <span class="profile-role">${user.role}</span>
            </div>
          </div>

          <button class="theme-toggle-btn" id="theme-toggle">
            <span class="theme-icon">${activeTheme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}</span>
          </button>

          <div class="logout-btn" id="logout-trigger">
            <svg style="width:16px;height:16px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C18.43 8.56 19 10.22 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-1.78.57-3.44 1.59-4.41L5.17 5.17C3.8 6.8 3 8.9 3 11c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.1-.8-4.2-2.17-5.83z"/>
            </svg>
            Logout
          </div>
        </div>
      </aside>
    `;

    // Hook events
    document.getElementById('logout-trigger').addEventListener('click', () => {
      if (confirm('Apakah Anda yakin ingin keluar?')) {
        AUTH.logout();
      }
    });

    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      themeToggle.querySelector('.theme-icon').textContent = newTheme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode';
    });

    // Mobile Sidebar responsiveness menu toggle handling
    const addMobileSupport = () => {
      const headerToggle = document.querySelector('.menu-toggle');
      if (headerToggle) {
        headerToggle.addEventListener('click', (e) => {
          e.stopPropagation();
          const sidebarElement = container.querySelector('.sidebar');
          if (sidebarElement) {
            sidebarElement.classList.toggle('open');
          }
        });
      }

      // Close sidebar if clicking outside of it
      document.addEventListener('click', (e) => {
        const sidebarElement = container.querySelector('.sidebar');
        if (sidebarElement && sidebarElement.classList.contains('open') && !sidebarElement.contains(e.target)) {
          sidebarElement.classList.remove('open');
        }
      });
    };

    addMobileSupport();

    // Async update pending badge count
    this.updatePendingCount();
  },

  async updatePendingCount() {
    try {
      const data = await SHEETS_API.getSheetData('hasil_rekomendasi');
      if (!data || data.length <= 1) return;
      
      // Filter out pending students who are marked as resolved in localStorage
      const pendingSiswa = data.slice(1).filter(row => {
        const isPending = row[7] === 'PENDING';
        const isResolvedLocally = localStorage.getItem(`resolved_pending_${row[1]}`) === 'true';
        return isPending && !isResolvedLocally;
      });
      
      const badge = document.getElementById('sidebar-pending-count');
      if (badge && pendingSiswa.length > 0) {
        badge.textContent = pendingSiswa.length;
        badge.style.display = 'inline-block';
      } else if (badge) {
        badge.style.display = 'none';
      }
    } catch (e) {
      console.error("Error loading sidebar pending badge:", e);
    }
  }
};

export default Sidebar;
