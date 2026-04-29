/**
 * router.js — Hash-based SPA router
 */
const Router = (() => {
  const routes = {};
  let currentView = null;

  function register(name, renderFn) {
    routes[name] = renderFn;
  }

  function navigate(hash) {
    window.location.hash = hash;
  }

  function getParams() {
    const hash = window.location.hash.replace('#', '');
    const parts = hash.split('/');
    return {
      view: parts[0] || 'home',
      params: parts.slice(1),
    };
  }

  async function render() {
    const { view, params } = getParams();
    const container = document.getElementById('main-content');
    const renderFn = routes[view] || routes['home'];

    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.toggle('active', link.dataset.view === view);
    });

    // Update UI visibility based on auth
    updateAuthUI();

    if (renderFn) {
      container.innerHTML = '';
      container.style.animation = 'none';
      // Force reflow
      void container.offsetHeight;
      container.style.animation = 'fadeIn .4s var(--ease)';
      await renderFn(container, params);
      currentView = view;
    }

    // Close mobile sidebar
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('visible');
  }

  function updateAuthUI() {
    const uploadLink = document.getElementById('nav-upload');
    const loginLink = document.getElementById('nav-login');
    const footer = document.getElementById('sidebar-footer');

    if (Auth.isFaculty()) {
      uploadLink.classList.remove('hidden');
      const user = Auth.getCurrentUser();
      loginLink.innerHTML = `<span class="nav-icon">🚪</span><span class="nav-label">Logout</span>`;
      loginLink.href = '#logout';
      loginLink.dataset.view = 'logout';
      footer.innerHTML = `👤 <strong>${user.name}</strong><br><span style="color:var(--green)">Faculty</span>`;
    } else {
      uploadLink.classList.add('hidden');
      loginLink.innerHTML = `<span class="nav-icon">👤</span><span class="nav-label">Faculty Login</span>`;
      loginLink.href = '#login';
      loginLink.dataset.view = 'login';
      footer.innerHTML = '';
    }
  }

  function init() {
    window.addEventListener('hashchange', render);
    if (!window.location.hash) {
      window.location.hash = '#home';
    } else {
      render();
    }
  }

  return { register, navigate, render, init, getParams };
})();
