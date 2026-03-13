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
    throw new Error("Missing admin token");
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
      setStatus(authStatus, "Primary API unreachable, retrying via fallback...", true);
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
    codesTableWrap.innerHTML = "<p>No codes yet.</p>";
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
            <button data-code-save="${c.id}">Set Max</button>
            <button data-code-toggle="${c.id}">Set Active</button>
            <button data-code-delete="${c.id}">Delete</button>
          </div>
        </td>
      </tr>`;
  }).join("");

  codesTableWrap.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Label</th>
          <th>Claims</th>
          <th>Max</th>
          <th>Created</th>
          <th>Active</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function renderUsers(users) {
  if (!users.length) {
    usersTableWrap.innerHTML = "<p>No users yet.</p>";
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
      <td><button data-user-delete="${u.id}">Delete User</button></td>
    </tr>
  `).join("");

  usersTableWrap.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Username</th>
          <th>First Name</th>
          <th>Last Name</th>
          <th>Email</th>
          <th>Claims</th>
          <th>Created</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function renderClaims(claims) {
  if (!claims.length) {
    claimsTableWrap.innerHTML = "<p>No claims yet.</p>";
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
          <th>User</th>
          <th>First Name</th>
          <th>Last Name</th>
          <th>Email</th>
          <th>Code Label</th>
          <th>User Agent</th>
          <th>Created</th>
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
    setStatus(authStatus, "Connected.");
  } catch (e) {
    setStatus(authStatus, `Error: ${e.message}`, true);
  }
}

async function createOrUpdateCode() {
  const code = document.getElementById("newCode").value.trim();
  const label = document.getElementById("newLabel").value.trim();
  const maxClaims = Number.parseInt(document.getElementById("newMaxClaims").value, 10);

  if (!code || !Number.isFinite(maxClaims) || maxClaims < 1) {
    setStatus(createStatus, "Invalid code or max claims.", true);
    return;
  }

  try {
    await adminFetch("/api/admin/codes", {
      method: "POST",
      body: JSON.stringify({ code, label, maxClaims }),
    });
    setStatus(createStatus, "Code saved.");
    await refreshAll();
  } catch (e) {
    setStatus(createStatus, `Error: ${e.message}`, true);
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
      if (!window.confirm(`Delete code #${id}?`)) return;
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
      if (!window.confirm(`Delete user #${id}? Claims will be deleted too.`)) return;
      await adminFetch("/api/admin/users/delete", {
        method: "POST",
        body: JSON.stringify({ id }),
      });
      await refreshAll();
    }
  } catch (e) {
    setStatus(authStatus, `Error: ${e.message}`, true);
  }
}

function init() {
  const storedToken = sessionStorage.getItem("mew3_admin_token") || "";
  tokenInput.value = storedToken;

  document.getElementById("saveTokenBtn").addEventListener("click", () => {
    sessionStorage.setItem("mew3_admin_token", getToken());
    setStatus(authStatus, "Token saved in current browser session.");
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
