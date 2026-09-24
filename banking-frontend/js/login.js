/**
 * NovaBank Secure Login Handler
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const toggleBtn = document.getElementById('togglePassword');
  const errorEl = document.getElementById('loginError');
  const submitBtn = document.getElementById('submitBtn');
  const btnText = document.getElementById('btnText');
  const rememberCheckbox = document.getElementById('rememberMe');
  const forgotLink = document.getElementById('forgotPasswordLink');
  const forgotModal = document.getElementById('forgotPasswordModal');
  const closeForgotBtn = document.getElementById('closeForgotModal');

  // Load remembered username if present
  const rememberedUser = localStorage.getItem('novabank_remembered_user');
  if (rememberedUser) {
    usernameInput.value = rememberedUser;
    if (rememberCheckbox) rememberCheckbox.checked = true;
    passwordInput.focus();
  }

  // Show / Hide Password Toggle
  toggleBtn.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    toggleBtn.textContent = isPassword ? 'Hide' : 'Show';
  });

  // Forgot Password Modal
  if (forgotLink && forgotModal && closeForgotBtn) {
    forgotLink.addEventListener('click', (e) => {
      e.preventDefault();
      forgotModal.classList.add('show');
    });
    closeForgotBtn.addEventListener('click', () => {
      forgotModal.classList.remove('show');
    });
    forgotModal.addEventListener('click', (e) => {
      if (e.target === forgotModal) forgotModal.classList.remove('show');
    });
  }

  // Login Execution
  async function performLogin(username, password) {
    errorEl.textContent = '';
    submitBtn.disabled = true;
    btnText.textContent = 'Verifying credentials...';

    try {
      const authData = await keycloakLogin(username, password);

      // Save remembered user
      if (rememberCheckbox && rememberCheckbox.checked) {
        localStorage.setItem('novabank_remembered_user', username);
      } else {
        localStorage.removeItem('novabank_remembered_user');
      }

      window.location.href = 'dashboard.html';
    } catch (err) {
      console.error('Authentication failure:', err);
      let friendlyMsg = 'Invalid username or password. Please verify and try again.';
      if (err.message && !err.message.includes('401') && !err.message.includes('invalid_grant')) {
        friendlyMsg = err.message;
      }
      errorEl.textContent = friendlyMsg;
      submitBtn.disabled = false;
      btnText.textContent = 'Sign In';
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
      errorEl.textContent = 'Please enter both your username/email and password.';
      return;
    }

    performLogin(username, password);
  });
});
