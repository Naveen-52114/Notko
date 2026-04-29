/**
 * auth.js — Faculty authentication using pre-defined credentials
 *
 * Add/edit faculty in the FACULTY_LIST below.
 * Passwords are stored as plain text here (client-side demo only).
 * Students simply browse without logging in — no account needed.
 */

const Auth = (() => {
  const SESSION_KEY = 'av_session';

  /* ====================================================
     🔑 PRE-DEFINED FACULTY CREDENTIALS
     Add or edit faculty members here.
     Format: { username, password, name }
     ==================================================== */
  const FACULTY_LIST = [
    { username: 'admin', password: 'admin123', name: 'Admin Faculty' },
    { username: 'faculty1', password: 'faculty123', name: 'Faculty Member 1' },
    { username: 'faculty2', password: 'pass2024', name: 'Faculty Member 2' },
    { username: 'naveen', password: 'naveen123', name: 'Naveen' },
    { username: 'srilakshmi', password: 'srilakshmi123', name: 'Srilakshmi' }
    // Add more faculty here ↓
    // { username: 'drsmith',  password: 'smith@2024',  name: 'Dr. Smith'  },
  ];

  function getCurrentUser() {
    const data = localStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
  }

  function isLoggedIn() {
    return !!getCurrentUser();
  }

  function isFaculty() {
    const user = getCurrentUser();
    return user && user.role === 'faculty';
  }

  async function login(username, password) {
    const faculty = FACULTY_LIST.find(
      f => f.username === username && f.password === password
    );
    if (!faculty) throw new Error('Invalid username or password');
    const session = { username: faculty.username, name: faculty.name, role: 'faculty' };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
  }

  return { getCurrentUser, isLoggedIn, isFaculty, login, logout };
})();
