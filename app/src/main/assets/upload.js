/**
 * upload.js — Faculty upload form
 */
const UploadView = (() => {
  let selectedFile = null;

  function render(container) {
    if (!Auth.isFaculty()) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔒</div>
          <h3>Faculty Access Only</h3>
          <p>Please <a href="#login" style="color:var(--accent-light);">log in as faculty</a> to upload materials.</p>
        </div>
      `;
      return;
    }

    selectedFile = null;

    container.innerHTML = `
      <div class="section-header">
        <h1>📤 Upload Material</h1>
        <p>Upload notes, lab manuals, presentations, and more for students</p>
      </div>

      <div class="card" style="max-width:700px">
        <form id="upload-form" onsubmit="UploadView.handleSubmit(event)">
          <div class="form-group">
            <label class="form-label">Title *</label>
            <input type="text" class="form-input" id="upload-title" required placeholder="e.g. Data Structures Unit 1 Notes" />
          </div>

          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea class="form-textarea" id="upload-desc" placeholder="Brief description of the material..."></textarea>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-md)">
            <div class="form-group">
              <label class="form-label">Department *</label>
              <select class="form-select" id="upload-dept" required>
                <option value="">Select department</option>
                ${HomeView.DEPARTMENTS.map(d => `<option value="${d.code}">${d.code} — ${d.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Semester *</label>
              <select class="form-select" id="upload-sem" required>
                <option value="">Select semester</option>
                ${[1, 2, 3, 4, 5, 6, 7, 8].map(s => `<option value="${s}">Semester ${s}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Material Type *</label>
            <select class="form-select" id="upload-type" required>
              <option value="notes">📄 Notes / Document</option>
              <option value="lab-manual">🔬 Lab Manual</option>
              <option value="ppt">📊 Presentation (PPT)</option>
              <option value="video">🎥 Video</option>
              <option value="image">🖼️ Image</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">File *</label>
            <div class="upload-zone" id="upload-zone">
              <div class="upload-icon">📂</div>
              <p>Drag and drop a file here, or click to browse</p>
              <p style="font-size:.78rem;color:var(--text-muted);margin-top:4px">
                PDF, DOC, DOCX, PPT, PPTX, JPG, PNG, MP4, WEBM <br> Maximum file size: 10 MB
              </p>
              <input type="file" id="upload-file" accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.mp4,.webm,.avi" onchange="UploadView.handleFileSelect(event)" />
            </div>
            <div id="file-preview-area"></div>
          </div>

          <button type="submit" class="btn btn-success btn-block" id="upload-submit" disabled>
            📤 Upload Material
          </button>
        </form>
      </div>
    `;

    // Drag & drop
    const zone = document.getElementById('upload-zone');
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', e => {
      e.preventDefault();
      zone.classList.remove('dragover');
      if (e.dataTransfer.files.length) {
        document.getElementById('upload-file').files = e.dataTransfer.files;
        handleFileSelect({ target: { files: e.dataTransfer.files } });
      }
    });
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    selectedFile = file;
    const sizeStr = file.size > 1048576
      ? (file.size / 1048576).toFixed(1) + ' MB'
      : (file.size / 1024).toFixed(0) + ' KB';

    const icon = getFileIcon(file.name);
    document.getElementById('file-preview-area').innerHTML = `
      <div class="file-preview">
        <div class="file-icon">${icon}</div>
        <div class="file-info">
          <div class="file-name">${file.name}</div>
          <div class="file-size">${sizeStr}</div>
        </div>
        <button type="button" class="btn btn-sm btn-secondary" onclick="UploadView.removeFile()">✕</button>
      </div>
    `;
    document.getElementById('upload-submit').disabled = false;
  }

  function removeFile() {
    selectedFile = null;
    document.getElementById('upload-file').value = '';
    document.getElementById('file-preview-area').innerHTML = '';
    document.getElementById('upload-submit').disabled = true;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedFile) return;

    const title = document.getElementById('upload-title').value.trim();
    const desc = document.getElementById('upload-desc').value.trim();
    const dept = document.getElementById('upload-dept').value;
    const sem = parseInt(document.getElementById('upload-sem').value);
    const type = document.getElementById('upload-type').value;
    const isLabManual = type === 'lab-manual' ? 1 : 0;

    const id = 'mat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);

    // Read file as blob
    const blob = selectedFile;
    const fileName = selectedFile.name;
    const fileSize = selectedFile.size;
    const fileExt = fileName.split('.').pop().toLowerCase();

    // Determine the actual file type category
    let fileType = 'doc';
    if (['pdf'].includes(fileExt)) fileType = 'pdf';
    else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt)) fileType = 'image';
    else if (['mp4', 'webm', 'avi', 'mov'].includes(fileExt)) fileType = 'video';
    else if (['ppt', 'pptx'].includes(fileExt)) fileType = 'ppt';

    const material = {
      id,
      title,
      description: desc,
      dept,
      sem,
      type: fileType,
      isLabManual,
      fileName,
      fileSize,
      fileExt,
      uploadedBy: Auth.getCurrentUser().name,
      createdAt: Date.now(),
    };

    const btn = document.getElementById('upload-submit');
    btn.disabled = true;
    btn.textContent = '⏳ Uploading...';

    try {
      await DB.saveMaterial(material);
      await DB.saveBlob(id, blob);
      showToast('Material uploaded successfully!', 'success');
      Router.navigate(`#departments/${dept}/${sem}`);
    } catch (err) {
      showToast('Upload failed: ' + err.message, 'error');
      btn.disabled = false;
      btn.textContent = '📤 Upload Material';
    }
  }

  return { render, handleFileSelect, handleSubmit, removeFile };
})();
