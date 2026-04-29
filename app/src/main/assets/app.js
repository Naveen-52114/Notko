/**
 * app.js — Main application entry point
 */

// ===== Global Helpers =====

/**
 * Get a user-friendly file icon based on file extension
 */
function getFileIcon(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const icons = {
    pdf: '📕', doc: '📄', docx: '📄',
    ppt: '📊', pptx: '📊',
    jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', webp: '🖼️',
    mp4: '🎥', webm: '🎥', avi: '🎥', mov: '🎥',
  };
  return icons[ext] || '📄';
}

/**
 * Format file size
 */
function formatSize(bytes) {
  if (bytes > 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
  return (bytes / 1024).toFixed(0) + ' KB';
}

/**
 * Format date
 */
function formatDate(ts) {
  return new Date(ts).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

/**
 * Create a material card HTML
 */
function materialCard(material, showSaved = false) {
  const icon = getFileIcon(material.fileName);
  const typeLabel = material.isLabManual ? 'Lab Manual' : material.type.toUpperCase();
  const typeClass = material.isLabManual ? 'lab' : material.type;
  const isFaculty = Auth.isFaculty();

  return `
    <div class="card material-card" data-id="${material.id}">
      <span class="mat-type ${typeClass}">${icon} ${typeLabel}</span>
      <h3>${material.title}</h3>
      ${material.description ? `<p class="mat-desc">${material.description}</p>` : ''}
      <div class="mat-meta">
        ${material.dept} • Sem ${material.sem} • ${formatSize(material.fileSize)} • ${formatDate(material.createdAt)}
      </div>
      <div class="mat-meta" style="margin-top:2px;">
        Uploaded by: ${material.uploadedBy}
      </div>
      <div class="mat-actions">
        <button class="btn btn-sm btn-primary" onclick="viewFileFromCard('${material.id}')">
          View
        </button>
        <button class="btn btn-sm btn-secondary" onclick="downloadMaterial('${material.id}')">
          ⬇️ Download
        </button>
        <button class="btn btn-sm btn-success" onclick="saveOffline('${material.id}')" style="display:none;">
          📥 Save Offline
        </button>
        ${isFaculty ? `
          <button class="btn btn-sm btn-danger btn-delete-material" onclick="deleteMaterialAction('${material.id}')" title="Delete">
            🗑️
          </button>
        ` : ''}
      </div>
    </div>
  `;
}

/**
 * Helper for view button in card
 */
async function viewFileFromCard(id) {
  const material = await DB.getMaterial(id);
  if (!material) return;

  const isPdf = material.fileName.toLowerCase().endsWith('.pdf');

  // ✅ FOR PDFs: Direct Native View (Bypassing everything)
  if (isPdf && window.Android && window.Android.openFile) {
      const blob = await DB.getBlob(id);
      if (!blob) {
          showToast('File data not available', 'error');
          return;
      }

      const reader = new FileReader();
      reader.onloadend = function () {
          window.Android.openFile(
              reader.result,
              'application/pdf',
              material.fileName
          );
      };
      const actualBlob = blob instanceof Blob ? blob : new Blob([blob], { type: 'application/pdf' });
      reader.readAsDataURL(actualBlob);
      return;
  }

  // ✅ FOR OTHERS: Use standard viewer
  if (typeof Viewer !== 'undefined' && Viewer.open) {
    Viewer.open(id);
  } else {
    const blob = await DB.getBlob(id);
    if (!material || !blob) {
      showToast('Material data missing', 'error');
      return;
    }
    const actualBlob = blob instanceof Blob ? blob : new Blob([blob], { type: 'application/pdf' });
    const url = URL.createObjectURL(actualBlob);
    window.open(url, '_blank');
  }
}

/**
 * Download a material's file
 */
async function downloadMaterial(id) {
  const material = await DB.getMaterial(id);
  const blob = await DB.getBlob(id);
  if (!blob) {
    showToast('File not available for download', 'error');
    return;
  }
  const b = blob instanceof Blob ? blob : new Blob([blob]);

  if (window.Android && window.Android.downloadBase64) {
      const reader = new FileReader();
      reader.onloadend = function() {
          window.Android.downloadBase64(reader.result, 'application/pdf', material.fileName);
      }
      reader.readAsDataURL(b);
  } else {
      const url = URL.createObjectURL(b);
      const a = document.createElement('a');
      a.href = url;
      a.download = material.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  }
  showToast('Download started!', 'success');
}

/**
 * Save a material for offline access
 */
async function saveOffline(id) {
  showToast('Material is already stored for offline access!', 'success');
}

/**
 * Delete a material (faculty only)
 */
async function deleteMaterialAction(id) {
  if (!Auth.isFaculty()) return;
  if (!confirm('Are you sure you want to delete this material?')) return;
  await DB.deleteMaterial(id);
  showToast('Material deleted', 'info');
  Router.render();
}

/**
 * Show a toast notification
 */
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'} ${message}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}


// ===== Initialize Application =====

(async function init() {
  // Initialize DB
  await DB.open();

  // Register routes
  Router.register('home', HomeView.render);
  Router.register('departments', DepartmentsView.render);
  Router.register('lab-manuals', LabManualsView.render);
  Router.register('upload', UploadView.render);
  Router.register('login', LoginView.render);
  Router.register('logout', LoginView.render);

  // Initialize router
  Router.init();

  // Mobile sidebar toggle
  document.getElementById('menu-toggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebar-overlay').classList.toggle('visible');
  });

  // Theme Toggle Logic
  const themeToggle = document.getElementById('theme-toggle');
  const body = document.body;

  // Check for saved theme preference
  const savedTheme = localStorage.getItem('theme') || 'light';
  body.setAttribute('data-theme', savedTheme);
  themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

  themeToggle.addEventListener('click', () => {
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
  });

  document.getElementById('sidebar-overlay').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('visible');
  });

  // Hide splash
  setTimeout(() => {
    const splash = document.getElementById('splash');
    if (splash) {
        splash.classList.add('fade-out');
        document.getElementById('app').classList.remove('hidden');
        setTimeout(() => splash.remove(), 500);
    }
  }, 1200);

  // Register service worker for offline support
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('sw.js');
      console.log('Service Worker registered');
    } catch (e) {
      console.log('Service Worker registration failed:', e);
    }
  }
})();
