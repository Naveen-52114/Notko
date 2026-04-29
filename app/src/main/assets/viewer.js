/**
 * viewer.js — Material viewer (WebView + Browser compatible)
 */
const Viewer = (() => {

  async function open(materialId) {
    const material = await DB.getMaterial(materialId);
    if (!material) { showToast('Material not found', 'error'); return; }

    const isPdf = material.fileName.toLowerCase().endsWith('.pdf');

    // ✅ If it's a PDF and we are in the Android App, open it natively IMMEDIATELY
    if (isPdf && window.Android && window.Android.openFile) {
      console.log("Opening PDF natively...");
      openExternal(materialId, material.fileName);
      return;
    }

    const blob = await DB.getBlob(materialId);
    if (!blob) { showToast('File data not available', 'error'); return; }

    const modal = document.getElementById('viewer-modal');
    const titleEl = document.getElementById('viewer-title');
    const bodyEl = document.getElementById('viewer-body');

    titleEl.textContent = material.title;

    const mimeType = isPdf ? 'application/pdf' : (material.mimeType || 'application/octet-stream');
    const actualBlob = blob instanceof Blob ? blob : new Blob([blob], { type: mimeType });
    const url = URL.createObjectURL(actualBlob);

    let content = '';

    if (isPdf) {
      // Fallback for browser if not in Android App
      content = `
        <div class="pdf-container" style="width:100%; height:80vh; display:flex; flex-direction:column; justify-content:center; align-items:center; background:#f0f0f0; border-radius:var(--r-md); text-align:center; padding:20px;">
          <div style="font-size:4rem; margin-bottom:20px;">📄</div>
          <h3>${material.fileName}</h3>
          <p style="color:#666; margin-bottom:30px;">PDF Viewer</p>
          <div style="display:flex; flex-direction:column; gap:10px; width:100%; max-width:300px;">
            <button class="btn btn-primary btn-lg" onclick="Viewer.openExternal('${materialId}','${material.fileName}')">
              View PDF
            </button>
            <button class="btn btn-secondary" onclick="Viewer.downloadBlob('${materialId}','${material.fileName}')">
              ⬇️ Download PDF
            </button>
          </div>
        </div>
      `;
      bodyEl.innerHTML = content;
      modal.classList.remove('hidden');
    } else {
      switch (material.type) {
        case 'image':
          content = `
            <div style="display:flex; flex-direction:column; align-items:center;">
              <img src="${url}" style="max-width:100%; border-radius:var(--r-md); box-shadow:var(--shadow-md);">
              <div style="margin-top:15px;">
                <button class="btn btn-secondary btn-sm" onclick="Viewer.downloadBlob('${materialId}','${material.fileName}')">⬇️ Download</button>
              </div>
            </div>
          `;
          break;

        case 'video':
          content = `
            <video controls autoplay style="width:100%; border-radius:var(--r-md); background:#000;">
              <source src="${url}">
            </video>
            <div style="margin-top:15px;">
              <button class="btn btn-secondary btn-sm" onclick="Viewer.downloadBlob('${materialId}','${material.fileName}')">⬇️ Download</button>
            </div>
          `;
          break;

        default:
          content = `
            <div class="empty-state" style="padding: 30px;">
              <div style="font-size: 3rem; margin-bottom: 15px;">📄</div>
              <h3>${material.fileName}</h3>
              <p>Preview not available for this file type.</p>
              <div style="display:flex; gap:10px; justify-content:center; margin-top:20px;">
                <button class="btn btn-primary" onclick="Viewer.downloadBlob('${materialId}','${material.fileName}')">⬇️ Download</button>
                <button class="btn btn-secondary" onclick="Viewer.openExternal('${materialId}','${material.fileName}')">📂 Open</button>
              </div>
            </div>
          `;
      }
      bodyEl.innerHTML = content;
      modal.classList.remove('hidden');
    }

    document.getElementById('viewer-close').onclick = () => closeViewer(url);
    modal.querySelector('.modal-backdrop').onclick = () => closeViewer(url);
  }

  // ✅ Download
  async function downloadBlob(materialId, fileName) {
    const material = await DB.getMaterial(materialId);
    const blob = await DB.getBlob(materialId);
    if (!blob) return;

    const isPdf = fileName.toLowerCase().endsWith('.pdf');
    const actualBlob = blob instanceof Blob ? blob : new Blob([blob], { type: isPdf ? 'application/pdf' : 'application/octet-stream' });

    if (window.Android && window.Android.downloadBase64) {
      const reader = new FileReader();
      reader.onloadend = function () {
        window.Android.downloadBase64(
          reader.result,
          actualBlob.type || 'application/octet-stream',
          fileName || 'download'
        );
      };
      reader.readAsDataURL(actualBlob);
    } else {
      const url = URL.createObjectURL(actualBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  // ✅ OPEN in Android app
  async function openExternal(materialId, fileName) {
    const material = await DB.getMaterial(materialId);
    const blob = await DB.getBlob(materialId);
    if (!blob) return;

    const isPdf = fileName.toLowerCase().endsWith('.pdf');
    const actualBlob = blob instanceof Blob ? blob : new Blob([blob], { type: isPdf ? 'application/pdf' : 'application/octet-stream' });

    if (window.Android && window.Android.openFile) {
      const reader = new FileReader();
      reader.onloadend = function () {
        window.Android.openFile(
          reader.result,
          actualBlob.type || 'application/octet-stream',
          fileName
        );
      };
      reader.readAsDataURL(actualBlob);
    } else {
      alert("Open not supported");
    }
  }

  function closeViewer(url) {
    document.getElementById('viewer-modal').classList.add('hidden');
    document.getElementById('viewer-body').innerHTML = '';
    if (url) URL.revokeObjectURL(url);
  }

  return { open, downloadBlob, openExternal, closeViewer };
})();
