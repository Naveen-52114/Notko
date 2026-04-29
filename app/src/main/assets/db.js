/**
 * db.js — Firebase Realtime Database wrapper
 * Exposes a global `DB` object for use by the rest of the app.
 * Files are stored as base64 strings in Firebase RTDB under "blobs/".
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  get,
  child,
  remove
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";

/* 🔑 Your Firebase Config */
const firebaseConfig = {
  apiKey: "AIzaSyAtq62lA9Ib_peOU4a6-otpeEWOOFXMJZA",
  authDomain: "kecnotes-5abab.firebaseapp.com",
  projectId: "kecnotes-5abab",
  storageBucket: "kecnotes-5abab.firebasestorage.app",
  messagingSenderId: "549037255624",
  appId: "1:549037255624:web:78fbdce5bc8b48d22deefd",
  measurementId: "G-6HNLRNVXJC",
  databaseURL: "https://kecnotes-5abab-default-rtdb.asia-southeast1.firebasedatabase.app"
};

/* Initialize Firebase */
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

/* ---- Helpers ---- */

/** Convert a Blob to a base64 string */
async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result); // data:mime;base64,xxxx
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** Convert a base64 data-URL back to a Blob */
function base64ToBlob(dataUrl) {
  const [header, data] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)[1];
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/** Wraps a promise with a timeout so Firebase doesn't hang forever */
function withTimeout(promise, ms = 30000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Firebase request timed out after ${ms / 1000}s. Check your connection or Firebase rules.`)), ms)
    )
  ]);
}

/* ---- DB API ---- */
const DB = (() => {

  /** Called by app.js on startup — nothing to initialise with Firebase */
  async function open() {
    return Promise.resolve();
  }

  // ---- Materials ----

  async function saveMaterial(material) {
    return set(ref(database, "materials/" + material.id), material);
  }

  async function getMaterial(id) {
    const snapshot = await withTimeout(get(child(ref(database), "materials/" + id)));
    return snapshot.exists() ? snapshot.val() : null;
  }

  async function getAllMaterials() {
    const snapshot = await withTimeout(get(child(ref(database), "materials")));
    if (!snapshot.exists()) return [];
    return Object.values(snapshot.val());
  }

  async function getMaterialsByDeptSem(dept, sem) {
    const all = await getAllMaterials();
    return all.filter(m => m.dept === dept && m.sem == sem);
  }

  async function getLabManuals() {
    const all = await getAllMaterials();
    return all.filter(m => m.isLabManual == 1);
  }

  async function deleteMaterial(id) {
    await remove(ref(database, "materials/" + id));
    // Also remove the blob if it exists
    await remove(ref(database, "blobs/" + id)).catch(() => { });
  }

  // ---- Blobs (files stored as base64 in Firebase RTDB) ----

  async function saveBlob(id, blob) {
    const base64 = await blobToBase64(blob);
    return set(ref(database, "blobs/" + id), { data: base64 });
  }

  async function getBlob(id) {
    const snapshot = await withTimeout(get(child(ref(database), "blobs/" + id)));
    if (!snapshot.exists()) return null;
    return base64ToBlob(snapshot.val().data);
  }

  // ---- Users ----

  async function saveUser(user) {
    return set(ref(database, "users/" + user.username), user);
  }

  async function getUser(username) {
    const snapshot = await withTimeout(get(child(ref(database), "users/" + username)));
    return snapshot.exists() ? snapshot.val() : null;
  }

  // ---- Stats ----

  async function getStats() {
    const all = await getAllMaterials();
    const depts = new Set(all.map(m => m.dept));
    const labs = all.filter(m => m.isLabManual);
    return {
      totalMaterials: all.length,
      totalDepts: depts.size,
      totalLabs: labs.length
    };
  }

  return {
    open,
    saveMaterial,
    getMaterial,
    getAllMaterials,
    getMaterialsByDeptSem,
    getLabManuals,
    deleteMaterial,
    saveBlob,
    getBlob,
    saveUser,
    getUser,
    getStats
  };

})();

/* Expose DB globally so non-module scripts can use it */
window.DB = DB;

/* Signal that DB is ready */
window.dispatchEvent(new Event('db-ready'));