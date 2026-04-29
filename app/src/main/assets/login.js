/**
 * login.js — Faculty login view (login only, no public registration)
 */
const LoginView = (() => {

  function render(container) {
    if (Auth.isFaculty()) {
      // Already logged in — this means user clicked Logout
      Auth.logout();
      showToast('Logged out successfully', 'info');
      Router.navigate('#home');
      return;
    }

    container.innerHTML = `
      <div class="section-header">
        <h1>👤 Faculty Portal</h1>
        <p>Sign in with your faculty credentials to upload and manage materials</p>
      </div>

      <div class="card" style="max-width:440px">
        <form id="auth-form" onsubmit="LoginView.handleSubmit(event)">

          <div class="form-group">
            <label class="form-label">Username</label>
            <input type="text" class="form-input" id="auth-username"
              placeholder="Enter your faculty username" required autocomplete="username" />
          </div>

          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" class="form-input" id="auth-password"
              placeholder="••••••••" required autocomplete="current-password" />
          </div>

          <button type="submit" class="btn btn-primary btn-block" id="auth-submit">
            🔓 Sign In
          </button>

        </form>

        <p style="text-align:center;margin-top:var(--sp-lg);font-size:.85rem;color:var(--text-muted)">
          🎓 Students can browse all materials without logging in.<br>
          Faculty accounts are managed by the administrator.
        </p>
      </div>
    `;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const username = document.getElementById('auth-username').value.trim();
    const password = document.getElementById('auth-password').value;
    const btn = document.getElementById('auth-submit');

    try {
      btn.disabled = true;
      btn.textContent = '⏳ Signing in…';
      await Auth.login(username, password);
      const user = Auth.getCurrentUser();
      showToast(`Welcome, ${user.name}! 🎉`, 'success');
      Router.navigate('#home');
    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false;
      btn.textContent = '🔓 Sign In';
    }
  }

  return { render, handleSubmit };
})();
