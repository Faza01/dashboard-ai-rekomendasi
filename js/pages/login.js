// Login Page Controller
import AUTH from '../auth.js';

document.addEventListener('DOMContentLoaded', () => {
  // Check if theme preference exists and apply it
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);

  const loginForm = document.getElementById('login-form');
  const errorPanel = document.getElementById('error-message');
  const errorText = document.getElementById('error-text');

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const usernameInput = document.getElementById('username');
      const passwordInput = document.getElementById('password');
      
      const username = usernameInput.value;
      const password = passwordInput.value;

      try {
        errorPanel.style.display = 'none';
        
        const success = AUTH.login(username, password);
        
        if (success) {
          // Redirect to dashboard page
          window.location.href = 'dashboard.html';
        } else {
          // Show authentication failed error
          errorText.textContent = "Username atau password salah.";
          errorPanel.style.display = 'flex';
          passwordInput.value = '';
          passwordInput.focus();
        }
      } catch (err) {
        errorText.textContent = err.message || "Terjadi kesalahan sistem.";
        errorPanel.style.display = 'flex';
      }
    });
  }
});
