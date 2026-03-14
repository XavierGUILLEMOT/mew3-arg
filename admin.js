const API_BASE_URL = (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL)
  ? window.APP_CONFIG.API_BASE_URL.replace(/\/$/, "")
  : "https://api.mew3.online";

const API_FALLBACK_URL = (window.APP_CONFIG && window.APP_CONFIG.ADMIN_API_FALLBACK_URL)
  ? window.APP_CONFIG.ADMIN_API_FALLBACK_URL.replace(/\/$/, "")
  : "https://mew3-api.mail-xavierguillemot.workers.dev";

const tokenInput = document.getElementById("adminToken");
const authStatus = document.getElementById("authStatus");
const createStatus = document.getElementById("codeCreateStatus");

const codesTableWrap = document.getElementById("codesTableWrap");
const usersTableWrap = document.getElementById("usersTableWrap");
const claimsTableWrap = document.getElementById("claimsTableWrap");
const LANGUAGE_STORAGE_KEY = "mew3_lang";
const ADMIN_SUPPORTED_LANGUAGES = ["fr", "en"];
let adminLanguage = "fr";

const ADMIN_I18N = {
  fr: {
    pageTitle: "MEW3 Panneau Admin",
    langLabelAdmin: "Langue",
    adminTitle: "MEW3 ADMIN",
    adminSubtitle: "Gérez les codes, utilisateurs et revendications récentes.",
    adminTokenLabel: "Jeton admin",
    adminTokenPlaceholder: "Jeton Bearer",
    saveTokenBtn: "Enregistrer le jeton",
    refreshAllBtn: "Tout actualiser",
    codeSectionTitle: "Créer ou mettre à jour un code",
    newCodePlaceholder: "code",
    newLabelPlaceholder: "libellé (optionnel)",
    newMaxClaimsPlaceholder: "max revendications",
    createCodeBtn: "Enregistrer le code",
    accessCodesTitle: "Codes d'accès",
    usersTitle: "Utilisateurs",
    recentClaimsTitle: "Revendications récentes",
    missingAdminToken: "Jeton admin manquant",
    apiFallbackNotice: "API principale inaccessible, nouvel essai via le fallback...",
    noCodesYet: "Aucun code pour l'instant.",
    noUsersYet: "Aucun utilisateur pour l'instant.",
    noClaimsYet: "Aucune revendication pour l'instant.",
    setMax: "Définir max",
    setActive: "Définir actif",
    delete: "Supprimer",
    deleteUser: "Supprimer l'utilisateur",
    thLabel: "Libellé",
    thClaims: "Revendications",
    thCreatedAt: "Créé le",
    thActive: "Actif",
    thActions: "Actions",
    thUsername: "Nom d'utilisateur",
    thFirstName: "Prénom",
    thLastName: "Nom",
    thEmail: "Email",
    thUser: "Utilisateur",
    thCodeLabel: "Libellé du code",
    thUserAgent: "Agent utilisateur",
    connected: "Connecté.",
    errorPrefix: "Erreur",
    invalidCodeOrMax: "Code ou nombre max invalide.",
    codeSaved: "Code enregistré.",
    confirmDeleteCode: "Supprimer le code",
    confirmDeleteUser: "Supprimer l'utilisateur",
    confirmDeleteUserSuffix: "Les revendications seront aussi supprimées.",
    tokenSavedSession: "Jeton enregistré pour cette session navigateur."
  },
  en: {
    pageTitle: "MEW3 Admin Panel",
    langLabelAdmin: "Language",
    adminTitle: "MEW3 ADMIN",
    adminSubtitle: "Manage codes, users, and recent claims.",
    adminTokenLabel: "Admin token",
    adminTokenPlaceholder: "Bearer token",
    saveTokenBtn: "Save token",
    refreshAllBtn: "Refresh all",
    codeSectionTitle: "Create or update code",
    newCodePlaceholder: "code",
    newLabelPlaceholder: "label (optional)",
    newMaxClaimsPlaceholder: "max claims",
    createCodeBtn: "Save code",
    accessCodesTitle: "Access codes",
    usersTitle: "Users",
    recentClaimsTitle: "Recent claims",
    missingAdminToken: "Missing admin token",
    apiFallbackNotice: "Primary API unreachable, retrying via fallback...",
    noCodesYet: "No codes yet.",
    noUsersYet: "No users yet.",
    noClaimsYet: "No claims yet.",
    setMax: "Set max",
    setActive: "Set active",
    delete: "Delete",
    deleteUser: "Delete user",
    thLabel: "Label",
    thClaims: "Claims",
    thCreatedAt: "Created",
    thActive: "Active",
    thActions: "Actions",
    thUsername: "Username",
    thFirstName: "First name",
    thLastName: "Last name",
    thEmail: "Email",
    thUser: "User",
    thCodeLabel: "Code label",
    thUserAgent: "User agent",
    connected: "Connected.",
    errorPrefix: "Error",
    invalidCodeOrMax: "Invalid code or max claims.",
    codeSaved: "Code saved.",
    confirmDeleteCode: "Delete code",
    confirmDeleteUser: "Delete user",
    confirmDeleteUserSuffix: "Claims will be deleted too.",
    tokenSavedSession: "Token saved in current browser session."
  }
};

function ta(key) {
  return (ADMIN_I18N[adminLanguage] && ADMIN_I18N[adminLanguage][key]) || ADMIN_I18N.fr[key] || key;
}

function detectAdminLanguage() {
  const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (saved && ADMIN_SUPPORTED_LANGUAGES.includes(saved)) {
    return saved;
  }
  const browserLang = (navigator.language || "fr").slice(0, 2).toLowerCase();
  return ADMIN_SUPPORTED_LANGUAGES.includes(browserLang) ? browserLang : "fr";
}

function setAdminText(id, key) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = ta(key);
  }
}

function setAdminPlaceholder(id, key) {
  const el = document.getElementById(id);
  if (el) {
    el.placeholder = ta(key);
  }
}

function applyAdminLanguage(lang) {
  adminLanguage = ADMIN_SUPPORTED_LANGUAGES.includes(lang) ? lang : "fr";
  localStorage.setItem(LANGUAGE_STORAGE_KEY, adminLanguage);
  document.documentElement.lang = adminLanguage;
  document.title = ta("pageTitle");

  setAdminText("langLabelAdmin", "langLabelAdmin");
  setAdminText("adminTitle", "adminTitle");
  setAdminText("adminSubtitle", "adminSubtitle");
  setAdminText("adminTokenLabel", "adminTokenLabel");
  setAdminText("saveTokenBtn", "saveTokenBtn");
  setAdminText("refreshAllBtn", "refreshAllBtn");
  setAdminText("codeSectionTitle", "codeSectionTitle");
  setAdminText("createCodeBtn", "createCodeBtn");
  setAdminText("accessCodesTitle", "accessCodesTitle");
  setAdminText("usersTitle", "usersTitle");
  setAdminText("recentClaimsTitle", "recentClaimsTitle");

  setAdminPlaceholder("adminToken", "adminTokenPlaceholder");
  setAdminPlaceholder("newCode", "newCodePlaceholder");
  setAdminPlaceholder("newLabel", "newLabelPlaceholder");
  setAdminPlaceholder("newMaxClaims", "newMaxClaimsPlaceholder");

  const langSelect = document.getElementById("langSelectAdmin");
  if (langSelect) {
    langSelect.value = adminLanguage;
  }
}

function getToken() {
  return (tokenInput.value || "").trim();
}

function setStatus(el, text, isError = false) {
  el.textContent = text;
  el.style.color = isError ? "#ff6b6b" : "#8df6cd";
}

async function adminFetch(path, options = {}) {
  const token = getToken();
  if (!token) {
    throw new Error(ta("missingAdminToken"));
  }

  const requestOptions = {
    ...options,
    headers: {
      "content-type": "application/json",
      "authorization": `Bearer ${token}`,
      ...(options.headers || {}),
    },
  };

  async function doRequest(baseUrl) {
    const response = await fetch(`${baseUrl}${path}`, requestOptions);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || `http_${response.status}`);
    }
    return data;
  }

  try {
    return await doRequest(API_BASE_URL);
  } catch (e) {
    // Network-level failures can happen on custom-domain edge rules; fallback to workers.dev.
    if (e && e.message === "Failed to fetch" && API_FALLBACK_URL && API_FALLBACK_URL !== API_BASE_URL) {
      setStatus(authStatus, ta("apiFallbackNotice"), true);
      return doRequest(API_FALLBACK_URL);
    }
    throw e;
  }
}

function escapeHtml(input) {
  return String(input ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderCodes(codes) {
  if (!codes.length) {
    codesTableWrap.innerHTML = `<p>${escapeHtml(ta("noCodesYet"))}</p>`;
    return;
  }

  const rows = codes.map((c) => {
    const active = c.is_active === 1 ? "checked" : "";
    return `
      <tr>
        <td>${c.id}</td>
        <td>${escapeHtml(c.label || "-")}</td>
        <td>${c.claims_count}</td>
        <td>${c.max_claims}</td>
        <td>${c.created_at}</td>
        <td><input type="checkbox" data-code-active="${c.id}" ${active}></td>
        <td>
          <div class="action-cell">
            <input class="small-input" type="number" min="1" value="${c.max_claims}" data-code-max="${c.id}">
            <button data-code-save="${c.id}">${escapeHtml(ta("setMax"))}</button>
            <button data-code-toggle="${c.id}">${escapeHtml(ta("setActive"))}</button>
            <button data-code-delete="${c.id}">${escapeHtml(ta("delete"))}</button>
          </div>
        </td>
      </tr>`;
  }).join("");

  codesTableWrap.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>${escapeHtml(ta("thLabel"))}</th>
          <th>${escapeHtml(ta("thClaims"))}</th>
          <th>Max</th>
          <th>${escapeHtml(ta("thCreatedAt"))}</th>
          <th>${escapeHtml(ta("thActive"))}</th>
          <th>${escapeHtml(ta("thActions"))}</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function renderUsers(users) {
  if (!users.length) {
    usersTableWrap.innerHTML = `<p>${escapeHtml(ta("noUsersYet"))}</p>`;
    return;
  }

  const rows = users.map((u) => `
    <tr>
      <td>${u.id}</td>
      <td>${escapeHtml(u.username)}</td>
      <td>${escapeHtml(u.first_name || u.firstName || "-")}</td>
      <td>${escapeHtml(u.last_name || u.lastName || "-")}</td>
      <td>${escapeHtml(u.email)}</td>
      <td>${u.claims}</td>
      <td>${u.created_at}</td>
      <td><button data-user-delete="${u.id}">${escapeHtml(ta("deleteUser"))}</button></td>
    </tr>
  `).join("");

  usersTableWrap.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>${escapeHtml(ta("thUsername"))}</th>
          <th>${escapeHtml(ta("thFirstName"))}</th>
          <th>${escapeHtml(ta("thLastName"))}</th>
          <th>${escapeHtml(ta("thEmail"))}</th>
          <th>${escapeHtml(ta("thClaims"))}</th>
          <th>${escapeHtml(ta("thCreatedAt"))}</th>
          <th>${escapeHtml(ta("thActions"))}</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function renderClaims(claims) {
  if (!claims.length) {
    claimsTableWrap.innerHTML = `<p>${escapeHtml(ta("noClaimsYet"))}</p>`;
    return;
  }

  const rows = claims.map((c) => `
    <tr>
      <td>${c.id}</td>
      <td>${escapeHtml(c.username)}</td>
      <td>${escapeHtml(c.first_name || c.firstName || "-")}</td>
      <td>${escapeHtml(c.last_name || c.lastName || "-")}</td>
      <td>${escapeHtml(c.email)}</td>
      <td>${escapeHtml(c.label || "-")}</td>
      <td>${escapeHtml(c.user_agent || "-")}</td>
      <td>${c.created_at}</td>
    </tr>
  `).join("");

  claimsTableWrap.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>${escapeHtml(ta("thUser"))}</th>
          <th>${escapeHtml(ta("thFirstName"))}</th>
          <th>${escapeHtml(ta("thLastName"))}</th>
          <th>${escapeHtml(ta("thEmail"))}</th>
          <th>${escapeHtml(ta("thCodeLabel"))}</th>
          <th>${escapeHtml(ta("thUserAgent"))}</th>
          <th>${escapeHtml(ta("thCreatedAt"))}</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

async function refreshAll() {
  try {
    const [codes, users, claims] = await Promise.all([
      adminFetch("/api/admin/codes", { method: "GET", headers: {} }),
      adminFetch("/api/admin/users?limit=200", { method: "GET", headers: {} }),
      adminFetch("/api/admin/claims?limit=200", { method: "GET", headers: {} }),
    ]);

    renderCodes(codes.codes || []);
    renderUsers(users.users || []);
    renderClaims(claims.claims || []);
    setStatus(authStatus, ta("connected"));
  } catch (e) {
    setStatus(authStatus, `${ta("errorPrefix")} : ${e.message}`, true);
  }
}

async function createOrUpdateCode() {
  const code = document.getElementById("newCode").value.trim();
  const label = document.getElementById("newLabel").value.trim();
  const maxClaims = Number.parseInt(document.getElementById("newMaxClaims").value, 10);

  if (!code || !Number.isFinite(maxClaims) || maxClaims < 1) {
    setStatus(createStatus, ta("invalidCodeOrMax"), true);
    return;
  }

  try {
    await adminFetch("/api/admin/codes", {
      method: "POST",
      body: JSON.stringify({ code, label, maxClaims }),
    });
    setStatus(createStatus, ta("codeSaved"));
    await refreshAll();
  } catch (e) {
    setStatus(createStatus, `${ta("errorPrefix")} : ${e.message}`, true);
  }
}

async function handleTableClick(event) {
  try {
    const saveBtn = event.target.closest("[data-code-save]");
    if (saveBtn) {
      const id = Number(saveBtn.getAttribute("data-code-save"));
      const input = document.querySelector(`[data-code-max=\"${id}\"]`);
      const maxClaims = Number.parseInt(input?.value || "", 10);
      if (!Number.isFinite(maxClaims) || maxClaims < 1) return;
      await adminFetch("/api/admin/codes/set-max", {
        method: "POST",
        body: JSON.stringify({ id, maxClaims }),
      });
      await refreshAll();
      return;
    }

    const toggleBtn = event.target.closest("[data-code-toggle]");
    if (toggleBtn) {
      const id = Number(toggleBtn.getAttribute("data-code-toggle"));
      const checkbox = document.querySelector(`[data-code-active=\"${id}\"]`);
      const isActive = Boolean(checkbox?.checked);
      await adminFetch("/api/admin/codes/set-active", {
        method: "POST",
        body: JSON.stringify({ id, isActive }),
      });
      await refreshAll();
      return;
    }

    const deleteCodeBtn = event.target.closest("[data-code-delete]");
    if (deleteCodeBtn) {
      const id = Number(deleteCodeBtn.getAttribute("data-code-delete"));
      if (!window.confirm(`${ta("confirmDeleteCode")} #${id} ?`)) return;
      await adminFetch("/api/admin/codes/delete", {
        method: "POST",
        body: JSON.stringify({ id }),
      });
      await refreshAll();
      return;
    }

    const deleteUserBtn = event.target.closest("[data-user-delete]");
    if (deleteUserBtn) {
      const id = Number(deleteUserBtn.getAttribute("data-user-delete"));
      if (!window.confirm(`${ta("confirmDeleteUser")} #${id} ? ${ta("confirmDeleteUserSuffix")}`)) return;
      await adminFetch("/api/admin/users/delete", {
        method: "POST",
        body: JSON.stringify({ id }),
      });
      await refreshAll();
    }
  } catch (e) {
    setStatus(authStatus, `${ta("errorPrefix")} : ${e.message}`, true);
  }
}

function init() {
  applyAdminLanguage(detectAdminLanguage());

  const storedToken = sessionStorage.getItem("mew3_admin_token") || "";
  tokenInput.value = storedToken;

  const langSelect = document.getElementById("langSelectAdmin");
  if (langSelect) {
    langSelect.addEventListener("change", (event) => {
      applyAdminLanguage(event.target.value);
      if (storedToken) {
        refreshAll();
      }
    });
  }

  document.getElementById("saveTokenBtn").addEventListener("click", () => {
    sessionStorage.setItem("mew3_admin_token", getToken());
    setStatus(authStatus, ta("tokenSavedSession"));
  });

  document.getElementById("refreshAllBtn").addEventListener("click", refreshAll);
  document.getElementById("createCodeBtn").addEventListener("click", createOrUpdateCode);

  codesTableWrap.addEventListener("click", handleTableClick);
  usersTableWrap.addEventListener("click", handleTableClick);

  if (storedToken) {
    refreshAll();
  }
}

init();
