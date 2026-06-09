// Authentication manager for BK AI Career Recommendation Dashboard

const USERS = {
  'bk_smktelkom': 'password123',
  'bk_admin':     'adminpass456'
};

const USER_ROLES = {
  'bk_smktelkom': 'Guru BK Telkom',
  'bk_admin': 'BK Administrator'
};

export const AUTH = {
  // Login verification
  login(username, password) {
    if (!username || !password) {
      throw new Error("Username dan password tidak boleh kosong");
    }

    const trimmedUser = username.trim();
    if (USERS[trimmedUser] && USERS[trimmedUser] === password) {
      // Store session details
      const userSession = {
        username: trimmedUser,
        role: USER_ROLES[trimmedUser] || 'Guru BK',
        loginTime: new Date().toISOString()
      };
      
      sessionStorage.setItem('bk_dashboard_session', JSON.stringify(userSession));
      return true;
    }
    
    return false;
  },

  // Logout clean up
  logout() {
    sessionStorage.clear();
    // Redirect to login page
    const loginUrl = window.location.pathname.includes('/pages/') 
      ? './login.html' 
      : './pages/login.html';
    window.location.href = loginUrl;
  },

  // Get current logged-in user
  getCurrentUser() {
    const sessionStr = sessionStorage.getItem('bk_dashboard_session');
    if (!sessionStr) return null;
    try {
      return JSON.parse(sessionStr);
    } catch (e) {
      return null;
    }
  },

  // Check auth and redirect if unauthorized
  checkAuthAndRedirect() {
    const currentUser = this.getCurrentUser();
    const isLoginPage = window.location.pathname.endsWith('login.html') || window.location.pathname.endsWith('/login');
    
    if (!currentUser && !isLoginPage) {
      // Not logged in and not on login page -> redirect to login
      const loginUrl = window.location.pathname.includes('/pages/')
        ? 'login.html'
        : 'pages/login.html';
      window.location.href = loginUrl;
      return false;
    } else if (currentUser && isLoginPage) {
      // Already logged in and on login page -> redirect to dashboard
      const dashboardUrl = 'dashboard.html';
      window.location.href = dashboardUrl;
      return false;
    }
    
    return true;
  }
};

// Auto-run authorization check when script is loaded
AUTH.checkAuthAndRedirect();

export default AUTH;
