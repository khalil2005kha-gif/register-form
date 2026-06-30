/* =========================================
   app.js – Register Now Form Logic
   ========================================= */
// ── State ──────────────────────────────────
const state = {
  username: '',
  email:    '',
  phone:    ''
};
// ── Element refs ───────────────────────────
const step1       = document.getElementById('step1');
const step2       = document.getElementById('step2');
const stepSuccess = document.getElementById('stepSuccess');
const step1Form   = document.getElementById('step1Form');
const step2Form   = document.getElementById('step2Form');
const usernameEl  = document.getElementById('usernameField');
const emailEl     = document.getElementById('emailField');
const phoneEl     = document.getElementById('phoneField');
const nextBtn     = document.getElementById('nextBtn');
const backBtn     = document.getElementById('backBtn');
const submitBtn   = document.getElementById('submitBtn');
const restartBtn  = document.getElementById('restartBtn');
const avatarCircle  = document.getElementById('avatarCircle');
const avatarInitial = document.getElementById('avatarInitial');
const avatarCircle2 = document.getElementById('avatarCircle2');
const avatarInitial2= document.getElementById('avatarInitial2');
// ── Live avatar initial update ─────────────
usernameEl.addEventListener('input', () => {
  const val = usernameEl.value.trim();
  clearError('grp-username');
  if (val.length > 0) {
    const letter = val[0].toUpperCase();
    avatarInitial.textContent = letter;
    avatarCircle.classList.add('has-initial', 'filled');
  } else {
    avatarInitial.textContent = '';
    avatarCircle.classList.remove('has-initial', 'filled');
  }
});
// ── Helpers ────────────────────────────────
function showStep(show, ...hideList) {
  hideList.forEach(el => el.classList.add('hidden'));
  show.classList.remove('hidden');
  show.style.animation = 'none';
  show.offsetHeight;
  show.style.animation = '';
}
function setError(groupId, msg) {
  const grp = document.getElementById(groupId);
  if (!grp) return;
  grp.classList.add('error');
  let errEl = grp.querySelector('.error-msg');
  if (!errEl) {
    errEl = document.createElement('span');
    errEl.className = 'error-msg';
    grp.appendChild(errEl);
  }
  errEl.textContent = msg;
}
function clearError(groupId) {
  const grp = document.getElementById(groupId);
  if (!grp) return;
  grp.classList.remove('error');
  const errEl = grp.querySelector('.error-msg');
  if (errEl) errEl.textContent = '';
}
function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}
function simulateLoading(btn, label = 'Loading…', duration = 1000) {
  const original = btn.innerHTML;
  btn.classList.add('loading');
  btn.innerHTML = label;
  btn.disabled = true;
  return new Promise(resolve => {
    setTimeout(() => {
      btn.classList.remove('loading');
      btn.innerHTML = original;
      btn.disabled = false;
      resolve();
    }, duration);
  });
}
// ── Step 1 → Step 2 ───────────────────────
step1Form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError('grp-username');
  const uname = usernameEl.value.trim();
  if (!uname) {
    setError('grp-username', 'Please enter a username.');
    usernameEl.focus();
    return;
  }
  if (uname.length < 3) {
    setError('grp-username', 'Username must be at least 3 characters.');
    usernameEl.focus();
    return;
  }
  if (/\s/.test(uname)) {
    setError('grp-username', 'Username cannot contain spaces.');
    usernameEl.focus();
    return;
  }
  state.username = uname;
  // Copy initial to step 2 avatar
  const letter = uname[0].toUpperCase();
  avatarInitial2.textContent = letter;
  avatarCircle2.classList.add('has-initial');
  await simulateLoading(nextBtn, 'Checking…', 900);
  showStep(step2, step1);
  emailEl.focus();
});
// ── Back ───────────────────────────────────
backBtn.addEventListener('click', () => {
  showStep(step1, step2);
  usernameEl.focus();
});
// ── Step 2 → Success ──────────────────────
step2Form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError('grp-email');
  const em = emailEl.value.trim();
  if (!em) {
    setError('grp-email', 'Please enter your email address.');
    emailEl.focus();
    return;
  }
  if (!isValidEmail(em)) {
    setError('grp-email', 'Please enter a valid email address.');
    emailEl.focus();
    return;
  }
  state.email = em;
  state.phone = phoneEl.value.trim();
  await simulateLoading(submitBtn, 'جارٍ الحفظ…', 1400);
  // ── ضع هنا رابط Google Apps Script بعد نشره ──
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwAU6bCANUR83J6mRSqVqgaY_4uUQgPNRNoH5uXw3kyLGGh5LA3RInL4B5QPFW4IOE6/exec';
  try {
    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: state.username,
        email:    state.email,
        phone:    state.phone || 'لم يُدخل',
        date:     new Date().toLocaleString('ar-SA')
      })
    });
  } catch (err) {
    console.error('خطأ في الإرسال:', err);
  }
  // ── إشعار للمتصفح (يظهر على سطح المكتب) ──
  if ('Notification' in window) {
    Notification.requestPermission().then(perm => {
      if (perm === 'granted') {
        new Notification('📋 تسجيل جديد!', {
          body: `👤 ${state.username}\n📧 ${state.email}`,
          icon: 'https://img.icons8.com/color/96/google-sheets.png'
        });
      }
    });
  }
  showStep(stepSuccess, step2, step1);
});
// ── Restart ───────────────────────────────
restartBtn.addEventListener('click', () => {
  state.username = '';
  state.email    = '';
  state.phone    = '';
  usernameEl.value = '';
  emailEl.value    = '';
  phoneEl.value    = '';
  avatarInitial.textContent = '';
  avatarInitial2.textContent= '';
  avatarCircle.classList.remove('has-initial', 'filled');
  avatarCircle2.classList.remove('has-initial');
  ['grp-username','grp-email','grp-phone'].forEach(clearError);
  showStep(step1, stepSuccess, step2);
  usernameEl.focus();
});
// ── Live clearing of email error ──────────
emailEl.addEventListener('input', () => clearError('grp-email'));
