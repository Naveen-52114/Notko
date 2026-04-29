/**
 * saved.js — Saved (offline-ready) materials view
 */
const SavedView = (() => {
  async function render(container) {
    const allMaterials = await DB.getAllMaterials();
    // Show materials that have blobs saved
    const savedItems = [];
    for (const m of allMaterials) {
      const blob = await DB.getBlob(m.id);
      if (blob) {
        savedItems.push(m);
      }
    }

    container.innerHTML = `
      <div class="section-header">
        <h1>📥 Saved for Offline</h1>
        <p>Materials you've saved are available even without internet connection</p>
      </div>

      ${savedItems.length === 0 ? `
        <div class="empty-state">
          <div class="empty-icon">📥</div>
          <h3>No saved materials yet</h3>
          <p>Click "Save Offline" on any material to access it without internet.</p>
        </div>
      ` : `
        <div class="card-grid">
          ${savedItems.map(m => materialCard(m, true)).join('')}
        </div>
      `}
    `;
  }

  return { render };
})();
