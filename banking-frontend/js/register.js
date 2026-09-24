/**
 * NovaBank Customer Registration Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registerForm');
  const nameInput = document.getElementById('regName');
  const emailInput = document.getElementById('regEmail');
  const phoneInput = document.getElementById('regPhone');
  const addressInput = document.getElementById('regAddress');
  const passwordInput = document.getElementById('regPassword');
  const confirmInput = document.getElementById('regConfirmPassword');
  const errorEl = document.getElementById('regError');
  const submitBtn = document.getElementById('regSubmitBtn');
  const btnText = document.getElementById('regBtnText');
  const successBox = document.getElementById('successBox');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.textContent = '';

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const phone = phoneInput.value.trim();
    const address = addressInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmInput.value;

    // 1. Validation
    if (!name || !email || !phone || !address || !password) {
      errorEl.textContent = 'Please fill out all required fields.';
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errorEl.textContent = 'Please enter a valid email address.';
      return;
    }

    const cleanedPhone = phone.replace(/[^0-9]/g, '');
    if (cleanedPhone.length < 10) {
      errorEl.textContent = 'Please enter a valid phone number (at least 10 digits).';
      return;
    }

    if (password.length < 6) {
      errorEl.textContent = 'Password must be at least 6 characters long.';
      return;
    }

    if (password !== confirmPassword) {
      errorEl.textContent = 'Passwords do not match.';
      return;
    }

    // 2. Submit to Backend Registration API
    submitBtn.disabled = true;
    btnText.textContent = 'Creating account...';

    try {
      const payload = {
        name,
        email,
        phone,
        address,
        password
      };

      const res = await fetch(`${API_CONFIG.baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || data.error_description || 'Registration failed. Please try again.');
      }

      // Success
      form.style.display = 'none';
      successBox.classList.add('show');
      document.getElementById('successMsg').textContent =
        `Welcome ${name}! Your account has been registered successfully with email ${email}.`;

    } catch (err) {
      console.error('Registration error:', err);
      errorEl.textContent = err.message || 'Unable to register at this time. Please try again.';
      submitBtn.disabled = false;
      btnText.textContent = 'Create NovaBank Account';
    }
  });
});
