// form.js — Internship registration form handler

document.addEventListener('DOMContentLoaded', () => {

  const form = document.getElementById('internshipForm');
  if (!form) return;

  // ── REPLACE THIS WITH YOUR ACTUAL GOOGLE APPS SCRIPT WEB APP URL ──
  const SHEET_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';

  const submitBtn  = form.querySelector('#submitBtn');
  const btnText    = form.querySelector('#btnText');
  const btnSpinner = form.querySelector('#btnSpinner');
  const successMsg = document.getElementById('successMsg');
  const errorMsg   = document.getElementById('errorMsg');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Basic validation
    const requiredFields = form.querySelectorAll('[required]');
    let valid = true;
    requiredFields.forEach(field => {
      field.style.borderColor = '';
      if (!field.value.trim()) {
        field.style.borderColor = '#ef4444';
        valid = false;
      }
    });
    if (!valid) return;

    // Phone validation
    const phone = form.querySelector('#phone');
    if (phone && !/^[6-9]\d{9}$/.test(phone.value.trim())) {
      phone.style.borderColor = '#ef4444';
      showError('Please enter a valid 10-digit mobile number.');
      return;
    }

    // Loading state
    setLoading(true);
    hideMessages();

    // Build payload
    const data = new FormData(form);
    data.append('timestamp', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
    data.append('source', 'bputnotes.in');

    try {
      await fetch(SHEET_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: data
      });
      // no-cors means we can't read the response, assume success
      showSuccess();
      form.reset();
      // Scroll to success message
      successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (err) {
      console.error(err);
      showError('Something went wrong. Please try again or WhatsApp us directly.');
    } finally {
      setLoading(false);
    }
  });

  // Clear error border on input
  form.querySelectorAll('input, select, textarea').forEach(el => {
    el.addEventListener('input', () => el.style.borderColor = '');
  });

  function setLoading(state) {
    submitBtn.disabled = state;
    btnText.style.display = state ? 'none' : 'inline';
    btnSpinner.style.display = state ? 'inline-block' : 'none';
  }

  function showSuccess() {
    if (successMsg) successMsg.style.display = 'block';
    if (errorMsg)   errorMsg.style.display   = 'none';
  }

  function showError(msg) {
    if (errorMsg) { errorMsg.textContent = msg; errorMsg.style.display = 'block'; }
    if (successMsg) successMsg.style.display = 'none';
  }

  function hideMessages() {
    if (successMsg) successMsg.style.display = 'none';
    if (errorMsg)   errorMsg.style.display   = 'none';
  }
});
