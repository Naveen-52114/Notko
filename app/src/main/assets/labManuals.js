/**
 * labManuals.js — Lab Manuals view
 */
const LabManualsView = (() => {
  async function render(container) {
    const labManuals = await DB.getLabManuals();
    const grouped = {};
    labManuals.forEach(m => {
      const key = `${m.dept}_Sem${m.sem}`;
      if (!grouped[key]) grouped[key] = { dept: m.dept, sem: m.sem, items: [] };
      grouped[key].items.push(m);
    });
    const groups = Object.values(grouped).sort((a, b) => 
      a.dept.localeCompare(b.dept) || a.sem - b.sem
    );

    container.innerHTML = `
      <div class="section-header">
        <h1>🔬 Lab Manuals</h1>
        <p>Browse lab manuals organized by department and semester</p>
      </div>

      <div class="search-bar">
        <span class="search-icon">🔍</span>
        <input type="text" placeholder="Search lab manuals..." id="lab-search" oninput="LabManualsView.filterLabs()" />
      </div>

      <div id="lab-list">
        ${labManuals.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">🔬</div>
            <h3>No lab manuals yet</h3>
            <p>Faculty can upload lab manuals through the upload section.</p>
          </div>
        ` : ''}

        ${groups.map(g => {
          const dept = HomeView.DEPARTMENTS.find(d => d.code === g.dept);
          return `
            <div class="section-title" style="margin-top:var(--sp-lg)">
              ${dept ? dept.icon : '📁'} ${g.dept} — Semester ${g.sem}
            </div>
            <div class="card-grid" style="margin-bottom:var(--sp-xl)">
              ${g.items.map(m => materialCard(m)).join('')}
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function filterLabs() {
    const query = document.getElementById('lab-search').value.toLowerCase();
    const cards = document.querySelectorAll('#lab-list .card');
    cards.forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(query) ? '' : 'none';
    });
  }

  return { render, filterLabs };
})();
