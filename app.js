/***********************
 * app.js (FULL - FIXED)
 * ✅ No more "missing fields" from wrong Enter handler
 * ✅ Uses <body data-page="login|signup|reset|admin">
 * ✅ Smooth loader + toast
 * ✅ Signup / Login / Reset / Admin (Google Apps Script backend)
 ***********************/

/***********************
 * SET YOUR WEB APP URL
 ***********************/
const API_URL =
  "https://script.google.com/macros/s/AKfycbwI7dOr982k6sP-BC6eWZxUXDCRzu19Qz2Z5ktQnnGL1mxYiepWbwf__ioCRefiH3icBw/exec";

/***********************
 * STABLE ADMIN (same as Apps Script)
 ***********************/
const ADMIN_USERNAME = "superadmin";
const ADMIN_PASSWORD = "Admin@2026";
const ADMIN_CODE4 = "9090";

/***********************
 * Helpers
 ***********************/
function $(id) { return document.getElementById(id); }

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[m]));
}
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

/***********************
 * Toast popup
 ***********************/
function ensureToastCss() {
  if (document.getElementById("toastCss")) return;
  const style = document.createElement("style");
  style.id = "toastCss";
  style.textContent = `
    .toast{
      position: fixed;
      right: 18px;
      top: 18px;
      width: min(360px, calc(100vw - 36px));
      padding: 12px 14px;
      border-radius: 14px;
      border: 1px solid rgba(15,23,42,.10);
      background: rgba(255,255,255,.92);
      backdrop-filter: blur(10px);
      box-shadow: 0 18px 45px rgba(15,23,42,.15);
      transform: translateY(-10px);
      opacity: 0;
      pointer-events: none;
      transition: opacity .22s ease, transform .22s ease;
      z-index: 99999;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
    }
    .toast.show{ opacity: 1; transform: translateY(0); pointer-events: auto; }
    .toast strong{ display:block; font-size: 13px; margin-bottom: 4px; }
    .toast div{ font-size: 12px; color: rgba(15,23,42,.7); line-height: 1.35; }
    .toast.ok{ border-color: rgba(34,197,94,.25); }
    .toast.err{ border-color: rgba(239,68,68,.25); }
    .toast.info{ border-color: rgba(37,99,235,.25); }
  `;
  document.head.appendChild(style);
}

function toast(type, title, msg) {
  ensureToastCss();
  let t = document.querySelector(".toast");
  if (!t) {
    t = document.createElement("div");
    t.className = "toast";
    document.body.appendChild(t);
  }
  t.className = `toast show ${type || "info"}`;
  t.innerHTML = `<strong>${escapeHtml(title)}</strong><div>${escapeHtml(msg)}</div>`;
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => t.classList.remove("show"), 2800);
}

/***********************
 * Smooth Loading overlay
 ***********************/
function ensureLoader() {
  if (document.getElementById("loadingOverlay")) return;

  const style = document.createElement("style");
  style.id = "loaderCss";
  style.textContent = `
    .loading-overlay{
      position: fixed;
      inset: 0;
      display: grid;
      place-items: center;
      background: rgba(255,255,255,.65);
      backdrop-filter: blur(8px);
      opacity: 0;
      pointer-events: none;
      transition: opacity .25s ease;
      z-index: 9999;
    }
    .loading-overlay.show{ opacity: 1; pointer-events: auto; }
    .loading-card{
      width: min(420px, 90vw);
      padding: 18px;
      border-radius: 20px;
      background: rgba(255,255,255,.92);
      border: 1px solid rgba(15,23,42,.10);
      box-shadow: 0 18px 45px rgba(15,23,42,.18);
      transform: translateY(10px) scale(.985);
      transition: transform .25s cubic-bezier(.2,.9,.2,1);
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
    }
    .loading-overlay.show .loading-card{ transform: translateY(0) scale(1); }
    .loading-top{ display:flex; align-items:center; gap: 12px; }
    .spinner{
      width: 38px; height: 38px;
      border-radius: 50%;
      border: 4px solid rgba(37,99,235,.18);
      border-top-color: rgba(37,99,235,.95);
      animation: spin 1s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg);} }
    .loading-text strong{ display:block; font-size: 14px; color: rgba(15,23,42,.95); }
    .loading-text span{ display:block; margin-top: 2px; font-size: 12px; color: rgba(15,23,42,.65); }
    .shimmer{
      margin-top: 14px;
      height: 10px;
      border-radius: 999px;
      background: rgba(15,23,42,.06);
      overflow:hidden;
      position: relative;
    }
    .shimmer::before{
      content:"";
      position:absolute;
      inset: 0;
      background: linear-gradient(90deg,
        transparent,
        rgba(37,99,235,.20),
        rgba(79,70,229,.20),
        transparent
      );
      transform: translateX(-60%);
      animation: shimmer 1.2s ease-in-out infinite;
    }
    @keyframes shimmer{
      0%{ transform: translateX(-60%); }
      100%{ transform: translateX(60%); }
    }
  `;
  document.head.appendChild(style);

  const overlay = document.createElement("div");
  overlay.id = "loadingOverlay";
  overlay.className = "loading-overlay";
  overlay.innerHTML = `
    <div class="loading-card" role="status" aria-live="polite">
      <div class="loading-top">
        <div class="spinner"></div>
        <div class="loading-text">
          <strong id="loadingTitle">Loading…</strong>
          <span id="loadingText">Please wait a moment</span>
        </div>
      </div>
      <div class="shimmer"></div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function setLoading(on, text = "Please wait a moment", title = "Loading…") {
  ensureLoader();
  const overlay = document.getElementById("loadingOverlay");
  const t = document.getElementById("loadingText");
  const h = document.getElementById("loadingTitle");
  if (h) h.textContent = title;
  if (t) t.textContent = text;
  overlay.classList.toggle("show", !!on);
}

/***********************
 * API call
 ***********************/
async function api(action, payload) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, ...payload }),
  });
  return await res.json();
}

/***********************
 * Signup
 ***********************/
function rand4() { return String(Math.floor(1000 + Math.random() * 9000)); }

function generateCode() {
  const el = document.getElementById("code4");
  if (el) el.value = rand4();
  toast("ok", "Generated", "A unique 4-digit code was generated. Save it!");
}

async function handleSignup() {
  const name = document.getElementById("name")?.value.trim();
  const studentId = document.getElementById("studentId")?.value.trim();
  const email = document.getElementById("email")?.value.trim();
  const username = document.getElementById("username")?.value.trim();
  const password = document.getElementById("password")?.value;
  const confirm = document.getElementById("confirm")?.value;
  const code4 = document.getElementById("code4")?.value.trim();

  if (!name || !studentId || !email || !username || !password || !confirm || !code4) {
    return toast("err", "Missing info", "Please fill all fields.");
  }
  if (password !== confirm) return toast("err", "Password mismatch", "Passwords do not match.");
  if (!/^\d{4}$/.test(code4)) return toast("err", "Invalid code", "4-digit code must be exactly 4 digits.");

  try {
    setLoading(true, "Creating your account…", "Signing up");
    const out = await api("signup", { name, studentId, email, username, password, code4 });

    if (out.ok) {
      toast("ok", "Success", out.message || "Account created.");
      setLoading(true, "Redirecting to login…", "Almost done");
      setTimeout(() => (location.href = "index.html"), 900);
    } else {
      setLoading(false);
      toast("err", "Signup failed", out.message || "Try again.");
    }
  } catch (e) {
    setLoading(false);
    toast("err", "Network error", "Check your API_URL and Apps Script deployment access.");
  }
}

/***********************
 * Login
 ***********************/
async function handleLogin() {
  const studentId = document.getElementById("studentId")?.value.trim() || "";
  const username  = document.getElementById("username")?.value.trim()  || "";
  const password  = document.getElementById("password")?.value        || "";
  const code4     = document.getElementById("code4")?.value.trim()     || "";

  const missing = [];
  if (!studentId) missing.push("Student ID");
  if (!username)  missing.push("Username");
  if (!password)  missing.push("Password");
  if (!code4)     missing.push("4-Digit Code");

  if (missing.length) {
    return toast("err", "Missing info", "Please fill: " + missing.join(", "));
  }

  try {
    setLoading(true, "Checking login…", "Signing in");
    const out = await api("login", { studentId, username, password, code4 });
    setLoading(false);

    if (out.ok) {
      toast("ok", "Welcome", out.message || "Login successful.");
      setLoading(true, "Redirecting…", "Welcome");
      setTimeout(() => (window.location.href = "track.html"), 800);
    } else {
      toast("err", "Login failed", out.message || "Try again.");
    }
  } catch (e) {
    setLoading(false);
    toast("err", "Network error", "Check your API_URL and Apps Script deployment access.");
  }
}

/***********************
 * Reset password
 ***********************/
async function handleReset() {
  const name = document.getElementById("name")?.value.trim();
  const studentId = document.getElementById("studentId")?.value.trim();
  const username = document.getElementById("username")?.value.trim();
  const code4 = document.getElementById("code4")?.value.trim();
  const newPassword = document.getElementById("newPassword")?.value;
  const confirm = document.getElementById("confirm")?.value;

  if (!name || !studentId || !username || !code4 || !newPassword || !confirm) {
    return toast("err", "Missing info", "Please fill all fields.");
  }
  if (newPassword !== confirm) return toast("err", "Mismatch", "Passwords do not match.");

  try {
    setLoading(true, "Resetting password…", "Updating");
    const out = await api("forgotReset", { name, studentId, username, code4, newPassword });
    setLoading(false);

    if (out.ok) {
      toast("ok", "Done", out.message || "Password reset.");
      setLoading(true, "Redirecting to login…", "Success");
      setTimeout(() => (location.href = "index.html"), 900);
    } else {
      toast("err", "Reset failed", out.message || "Try again.");
    }
  } catch (e) {
    setLoading(false);
    toast("err", "Network error", "Check your API_URL and Apps Script deployment access.");
  }
}

/***********************
 * Admin (your existing functions)
 * Note: You can paste your existing admin functions below if needed.
 ***********************/
let __adminLoggedIn = false;
let __adminUsers = [];

function adminLogout() {
  __adminLoggedIn = false;
  __adminUsers = [];
  if ($("adminLoginBox")) $("adminLoginBox").style.display = "block";
  if ($("adminPanel")) $("adminPanel").style.display = "none";
  toast("ok", "Logged out", "Admin session cleared.");
}

async function adminLogin() {
  const username = document.getElementById("adminUser")?.value.trim();
  const password = document.getElementById("adminPass")?.value;
  const code4 = document.getElementById("adminCode")?.value.trim();

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD || code4 !== ADMIN_CODE4) {
    return toast("err", "Admin login failed", "Wrong admin username/password/code.");
  }

  try {
    setLoading(true, "Verifying admin…", "Admin Login");
    const out = await api("adminLogin", { username, password, code4 });
    setLoading(false);

    if (out.ok) {
      __adminLoggedIn = true;
      toast("ok", "Admin", out.message || "Logged in.");
      if ($("adminLoginBox")) $("adminLoginBox").style.display = "none";
      if ($("adminPanel")) $("adminPanel").style.display = "block";
      await loadUsers();
    } else {
      toast("err", "Admin login failed", out.message || "Try again.");
    }
  } catch (e) {
    setLoading(false);
    toast("err", "Network error", "Check your API_URL and Apps Script deployment access.");
  }
}

async function loadUsers() {
  if (!__adminLoggedIn) return toast("err", "Unauthorized", "Please login as admin.");
  try {
    setLoading(true, "Fetching users from sheet…", "Loading Users");
    const out = await api("adminListUsers", {});
    setLoading(false);

    if (!out.ok) return toast("err", "Admin error", out.message || "Could not load users.");

    __adminUsers = out.users || [];
    const tbody = document.getElementById("usersBody");
    if (!tbody) return;

    tbody.innerHTML = "";
    __adminUsers.forEach((u, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(u.name)}</td>
        <td><code>${escapeHtml(String(u.studentId ?? ""))}</code></td>
        <td>${escapeHtml(u.email)}</td>
        <td>${escapeHtml(u.username)}</td>
        <td><code>${escapeHtml(String(u.code4 ?? ""))}</code></td>
        <td>${escapeHtml(String(u.status ?? ""))}</td>
        <td>${escapeHtml(String(u.created ?? u.createdAt ?? ""))}</td>
        <td>${escapeHtml(String(u.updated ?? u.updatedAt ?? ""))}</td>
        <td><button class="secondary" data-edit-index="${i}">Edit</button></td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll("button[data-edit-index]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.getAttribute("data-edit-index"));
        fillEditByIndex(idx);
      });
    });
  } catch (e) {
    setLoading(false);
    toast("err", "Network error", "Could not load users.");
  }
}

function fillEditByIndex(i) {
  const u = __adminUsers[i];
  if (!u) return toast("err", "Not found", "User not found.");
  if ($("e_name")) $("e_name").value = u.name || "";
  if ($("e_studentId")) $("e_studentId").value = u.studentId || "";
  if ($("e_email")) $("e_email").value = u.email || "";
  if ($("e_username")) $("e_username").value = u.username || "";
  if ($("e_code4")) $("e_code4").value = u.code4 || "";
  if ($("e_status")) $("e_status").value = u.status || "active";
  if ($("e_newPassword")) $("e_newPassword").value = "";
  toast("ok", "Edit mode", "Update fields and click Save.");
}

async function saveUser() {
  if (!__adminLoggedIn) return toast("err", "Unauthorized", "Please login as admin.");

  const user = {
    name: $("e_name")?.value.trim(),
    studentId: $("e_studentId")?.value.trim(),
    email: $("e_email")?.value.trim(),
    username: $("e_username")?.value.trim(),
    code4: $("e_code4")?.value.trim(),
    status: $("e_status")?.value.trim(),
    newPassword: $("e_newPassword")?.value,
  };

  if (!user.name || !user.studentId || !user.email || !user.username || !/^\d{4}$/.test(user.code4)) {
    return toast("err", "Missing info", "Fill Name, Student ID, Email, Username, and valid 4-digit code.");
  }

  try {
    setLoading(true, "Saving changes…", "Updating User");
    const out = await api("adminUpsertUser", { user });
    setLoading(false);

    if (out.ok) {
      toast("ok", "Saved", out.message || "User updated.");
      await loadUsers();
    } else {
      toast("err", "Save failed", out.message || "Try again.");
    }
  } catch (e) {
    setLoading(false);
    toast("err", "Network error", "Could not save user.");
  }
}

/***********************
 * Auto init + Enter key support (FIXED)
 * ✅ Only binds Enter handlers for the current page
 * ✅ Requires you to set body data-page="login|signup|reset|admin"
 ***********************/
window.addEventListener("DOMContentLoaded", () => {
  ensureLoader();
  ensureToastCss();

  const page = document.body?.dataset?.page || "";

  function bindEnter(ids, fn){
    ids.forEach(id => {
      const el = document.getElementById(id);
      if(!el) return;
      el.addEventListener("keydown", (e) => {
        if(e.key === "Enter") fn();
      });
    });
  }

  if(page === "admin"){
    bindEnter(["adminUser","adminPass","adminCode"], adminLogin);
  }

  if(page === "login"){
    bindEnter(["studentId","username","password","code4"], handleLogin);
  }

  if(page === "signup"){
    bindEnter(["name","studentId","email","username","password","confirm","code4"], handleSignup);
  }

  if(page === "reset"){
    bindEnter(["name","studentId","username","code4","newPassword","confirm"], handleReset);
  }
});
