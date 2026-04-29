/**
 * departments.js — Department & semester browser
 */
const DepartmentsView = (() => {
  async function render(container, params) {
    const selectedDept = params[0] || null;
    const selectedSem = params[1] || null;

    if (!selectedDept) {
      // Show all departments list
      container.innerHTML = `
        <div class="section-header">
          <h1>Departments</h1>
          <p>Select a department to browse its materials</p>
        </div>
        <div class="card-grid">
          ${HomeView.DEPARTMENTS.map(d => `
            <div class="card dept-card" onclick="Router.navigate('#departments/${d.code}')">
              <div class="dept-icon">${d.icon}</div>
              <div class="dept-name">${d.code}</div>
              <div class="dept-full">${d.name}</div>
            </div>
          `).join('')}
        </div>
      `;
      return;
    }

    const dept = HomeView.DEPARTMENTS.find(d => d.code === selectedDept);
    const deptName = dept ? dept.name : selectedDept;

    if (!selectedSem) {
      // Show semester selector
      container.innerHTML = `
        <div class="breadcrumbs">
          <a href="#departments">Departments</a>
          <span class="sep">›</span>
          <span>${selectedDept}</span>
        </div>
        <div class="section-header">
          <h1>${dept ? dept.icon : '📁'} ${selectedDept}</h1>
          <p>${deptName} — Select a semester</p>
        </div>
        <div class="semester-tabs" style="flex-wrap:wrap;">
          ${[1,2,3,4,5,6,7,8].map(s => `
            <button class="sem-tab" onclick="Router.navigate('#departments/${selectedDept}/${s}')">
              Semester ${s}
            </button>
          `).join('')}
        </div>
        <div id="dept-all-materials"></div>
      `;
      // Show all materials for this department
      const allMats = await DB.getAllMaterials();
      const deptMats = allMats.filter(m => m.dept === selectedDept);
      const matContainer = document.getElementById('dept-all-materials');
      if (deptMats.length > 0) {
        matContainer.innerHTML = `
          <div class="section-title" style="margin-top:var(--sp-lg)">📄 All Materials (${deptMats.length})</div>
          <div class="card-grid">${deptMats.map(m => materialCard(m)).join('')}</div>
        `;
      } else {
        matContainer.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">📭</div>
            <h3>No materials yet</h3>
            <p>Faculty can upload materials for this department.</p>
          </div>
        `;
      }
      return;
    }

    // Show materials for dept + sem
    const materials = await DB.getMaterialsByDeptSem(selectedDept, selectedSem);
    const notes = materials.filter(m => !m.isLabManual);
    const labs = materials.filter(m => m.isLabManual);

    container.innerHTML = `
      <div class="breadcrumbs">
        <a href="#departments">Departments</a>
        <span class="sep">›</span>
        <a href="#departments/${selectedDept}">${selectedDept}</a>
        <span class="sep">›</span>
        <span>Semester ${selectedSem}</span>
      </div>
      <div class="section-header">
        <h1>${dept ? dept.icon : '📁'} ${selectedDept} — Sem ${selectedSem}</h1>
        <p>${deptName} • Semester ${selectedSem} materials</p>
      </div>

      <div class="search-bar">
        <span class="search-icon">🔍</span>
        <input type="text" placeholder="Search materials..." id="dept-search" oninput="DepartmentsView.filterMaterials()" />
      </div>

      <div id="materials-list">
        ${materials.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">📭</div>
            <h3>No materials uploaded yet</h3>
            <p>Faculty can upload notes, lab manuals, and more for this semester.</p>
          </div>
        ` : ''}

        ${notes.length > 0 ? `
          <div class="section-title">📄 Notes & Materials (${notes.length})</div>
          <div class="card-grid" style="margin-bottom:var(--sp-2xl)">
            ${notes.map(m => materialCard(m)).join('')}
          </div>
        ` : ''}

        ${labs.length > 0 ? `
          <div class="section-title">🔬 Lab Manuals (${labs.length})</div>
          <div class="card-grid">
            ${labs.map(m => materialCard(m)).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  function filterMaterials() {
    const query = document.getElementById('dept-search').value.toLowerCase();
    const cards = document.querySelectorAll('#materials-list .card');
    cards.forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(query) ? '' : 'none';
    });
  }

  return { render, filterMaterials };
})();
