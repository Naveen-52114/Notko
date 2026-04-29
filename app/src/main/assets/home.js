/**
 * home.js — Home / Landing page view
 */
const HomeView = (() => {
  const DEPARTMENTS = [
    { code: 'AIDS', name: 'AI & Data Science', icon: '🤖' },
    { code: 'CSE', name: 'Computer Science & Engineering', icon: '💻' },
    { code: 'ECE', name: 'Electronics & Communication', icon: '📡' },
    { code: 'S&H', name: 'Science and Humanity', icon: '📚' },
    { code: 'MECH', name: 'Mechanical Engineering', icon: '⚙️' },
    { code: 'MBA', name: 'Master of Business Administration', icon: '💰' },
    { code: 'IT', name: 'Information Technology', icon: '🌐' },
    { code: 'CSBS', name: 'Computer Science and Business Systems', icon: '🧠' },
  ];

  async function render(container) {
    let stats = { totalMaterials: 0, totalDepts: 0, totalLabs: 0 };
    let recent = [];
    let dbError = null;

    try {
      stats = await DB.getStats();
      const recentMaterials = await DB.getAllMaterials();
      recent = recentMaterials
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 6);
    } catch (err) {
      dbError = err.message || 'Could not connect to Firebase database.';
      console.error('DB error:', err);
    }

    container.innerHTML = `
      <div class="hero">
        <h1>Your Academic <span>Materials Hub</span></h1>
        <p>Access notes, lab manuals, presentations, and more — organized by department and semester. Save them for offline viewing anytime.</p>
        <div class="hero-stats">
          <div class="stat">
            <div class="stat-value">${stats.totalMaterials}</div>
            <div class="stat-label">Materials</div>
          </div>
          <div class="stat">
            <div class="stat-value">${DEPARTMENTS.length}</div>
            <div class="stat-label">Departments</div>
          </div>
          <div class="stat">
            <div class="stat-value">${stats.totalLabs}</div>
            <div class="stat-label">Lab Manuals</div>
          </div>
        </div>
      </div>

      ${dbError ? `
        <div class="card" style="border:1px solid var(--red,#e55);margin-bottom:var(--sp-lg);padding:var(--sp-md);">
          ⚠️ <strong>Firebase connection issue:</strong> ${dbError}<br>
          <small style="color:var(--text-muted)">Check your Firebase Realtime Database URL and security rules.</small>
        </div>
      ` : ''}

      <div class="section-title">🏛️ Browse by Department</div>
      <div class="card-grid" style="margin-bottom:var(--sp-2xl)">
        ${DEPARTMENTS.map(d => `
          <div class="card dept-card" onclick="Router.navigate('#departments/${d.code}')">
            <div class="dept-icon">${d.icon}</div>
            <div class="dept-name">${d.code}</div>
            <div class="dept-full">${d.name}</div>
          </div>
        `).join('')}
      </div>

      ${recent.length > 0 ? `
        <div class="section-title">🕐 Recent Uploads</div>
        <div class="card-grid">
          ${recent.map(m => materialCard(m)).join('')}
        </div>
      ` : ''}
    `;
  }

  return { render, DEPARTMENTS };
})();
