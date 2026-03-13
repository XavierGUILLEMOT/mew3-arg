function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...headers,
    },
  });
}

function unauthorized(cors) {
  return json({ ok: false, error: "unauthorized" }, 401, cors);
}

function getAllowedOrigins(env) {
  return (env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

function corsHeaders(origin, env) {
  const allowedOrigins = getAllowedOrigins(env);
  const allowOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0] || "*";
  return {
    "access-control-allow-origin": allowOrigin,
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type,authorization",
    "access-control-max-age": "86400",
    vary: "Origin",
  };
}

function parseLimit(value, fallback = 100, max = 500) {
  const n = Number.parseInt(String(value || ""), 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, max);
}

function readBearerToken(request) {
  const auth = request.headers.get("authorization") || "";
  return auth.replace(/^Bearer\s+/i, "").trim();
}

function isAdminAuthorized(request, env) {
  const token = readBearerToken(request);
  return Boolean(env.ADMIN_TOKEN) && token === env.ADMIN_TOKEN;
}

async function sha256Hex(input) {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function sanitizeUsername(username) {
  return String(username || "").trim().slice(0, 30);
}

function sanitizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getClientIp(request) {
  return request.headers.get("CF-Connecting-IP") || "";
}

async function hashCode(code, env) {
  const pepper = env.CODE_PEPPER || "";
  return sha256Hex(`${code}::${pepper}`);
}

async function hashIp(ip, env) {
  if (!ip) return null;
  const pepper = env.IP_PEPPER || env.CODE_PEPPER || "";
  return sha256Hex(`${ip}::${pepper}`);
}

async function verifyCode(code, env) {
  const codeHash = await hashCode(code, env);
  const codeRow = await env.DB.prepare(
    `SELECT id, max_claims, claims_count, is_active
     FROM access_codes
     WHERE code_hash = ?`
  )
    .bind(codeHash)
    .first();

  if (!codeRow || codeRow.is_active !== 1) {
    return { ok: false, reason: "invalid" };
  }

  if (codeRow.claims_count >= codeRow.max_claims) {
    return { ok: false, reason: "exhausted" };
  }

  return {
    ok: true,
    codeId: codeRow.id,
    remaining: codeRow.max_claims - codeRow.claims_count,
  };
}

async function handleVerify(request, env, cors) {
  const body = await request.json().catch(() => ({}));
  const code = String(body.code || "").trim();
  if (!code) {
    return json({ ok: false, error: "missing_code" }, 400, cors);
  }

  const result = await verifyCode(code, env);
  if (!result.ok) {
    return json({ ok: false, error: result.reason }, 404, cors);
  }

  return json({ ok: true, remaining: result.remaining }, 200, cors);
}

async function findOrCreateUser(env, username, email) {
  const existing = await env.DB.prepare(`SELECT id, username FROM users WHERE email = ?`).bind(email).first();
  if (existing) {
    if (existing.username !== username) {
      await env.DB.prepare(`UPDATE users SET username = ? WHERE id = ?`).bind(username, existing.id).run();
    }
    return existing.id;
  }

  const created = await env.DB.prepare(`INSERT INTO users (username, email) VALUES (?, ?)`).bind(username, email).run();
  return created.meta.last_row_id;
}

async function handleRegister(request, env, cors) {
  const body = await request.json().catch(() => ({}));
  const username = sanitizeUsername(body.username);
  const email = sanitizeEmail(body.email);
  const code = String(body.code || "").trim();

  if (!username || !email || !code) {
    return json({ ok: false, error: "missing_fields" }, 400, cors);
  }
  if (!validEmail(email)) {
    return json({ ok: false, error: "invalid_email" }, 400, cors);
  }

  const verification = await verifyCode(code, env);
  if (!verification.ok) {
    return json({ ok: false, error: verification.reason }, 403, cors);
  }

  const userId = await findOrCreateUser(env, username, email);

  const existingClaim = await env.DB.prepare(`SELECT id FROM claims WHERE user_id = ? AND code_id = ?`)
    .bind(userId, verification.codeId)
    .first();
  if (existingClaim) {
    return json({ ok: false, error: "already_claimed" }, 409, cors);
  }

  const inc = await env.DB.prepare(
    `UPDATE access_codes
     SET claims_count = claims_count + 1
     WHERE id = ? AND claims_count < max_claims AND is_active = 1`
  )
    .bind(verification.codeId)
    .run();

  if (!inc.meta || inc.meta.changes < 1) {
    return json({ ok: false, error: "exhausted" }, 409, cors);
  }

  const ipHash = await hashIp(getClientIp(request), env);
  const userAgent = (request.headers.get("user-agent") || "").slice(0, 200);

  await env.DB.prepare(`INSERT INTO claims (user_id, code_id, ip_hash, user_agent) VALUES (?, ?, ?, ?)`) 
    .bind(userId, verification.codeId, ipHash, userAgent)
    .run();

  return json({ ok: true, message: "registered" }, 200, cors);
}

async function handleStats(env, cors) {
  const totalRow = await env.DB.prepare(`SELECT COUNT(*) AS total FROM claims`).first();
  const recent = await env.DB.prepare(
    `SELECT u.username, c.created_at
     FROM claims c
     JOIN users u ON u.id = c.user_id
     ORDER BY c.id DESC
     LIMIT 5`
  ).all();

  return json(
    {
      ok: true,
      total: totalRow?.total || 0,
      recent: (recent.results || []).map((r) => ({ username: r.username, createdAt: r.created_at })),
    },
    200,
    cors
  );
}

async function handleCreateCode(request, env, cors) {
  const body = await request.json().catch(() => ({}));
  const code = String(body.code || "").trim();
  const label = String(body.label || "").trim().slice(0, 120);
  const maxClaims = Number.isFinite(body.maxClaims) ? Number(body.maxClaims) : 1;

  if (!code || maxClaims < 1) {
    return json({ ok: false, error: "invalid_payload" }, 400, cors);
  }

  const codeHash = await hashCode(code, env);
  await env.DB.prepare(
    `INSERT OR REPLACE INTO access_codes (code_hash, label, max_claims, claims_count, is_active)
     VALUES (?, ?, ?, COALESCE((SELECT claims_count FROM access_codes WHERE code_hash = ?), 0), 1)`
  )
    .bind(codeHash, label || null, Math.floor(maxClaims), codeHash)
    .run();

  return json({ ok: true }, 201, cors);
}

async function handleAdminListCodes(env, cors) {
  const rows = await env.DB.prepare(
    `SELECT id, label, max_claims, claims_count, is_active, created_at
     FROM access_codes
     ORDER BY id DESC`
  ).all();

  return json({ ok: true, codes: rows.results || [] }, 200, cors);
}

async function handleAdminSetCodeMax(request, env, cors) {
  const body = await request.json().catch(() => ({}));
  const id = Number.parseInt(String(body.id || ""), 10);
  const maxClaims = Number.parseInt(String(body.maxClaims || ""), 10);

  if (!Number.isFinite(id) || id < 1 || !Number.isFinite(maxClaims) || maxClaims < 1) {
    return json({ ok: false, error: "invalid_payload" }, 400, cors);
  }

  const result = await env.DB.prepare(`UPDATE access_codes SET max_claims = ? WHERE id = ?`)
    .bind(maxClaims, id)
    .run();

  if (!result.meta || result.meta.changes < 1) {
    return json({ ok: false, error: "not_found" }, 404, cors);
  }

  return json({ ok: true }, 200, cors);
}

async function handleAdminSetCodeActive(request, env, cors) {
  const body = await request.json().catch(() => ({}));
  const id = Number.parseInt(String(body.id || ""), 10);
  const isActive = body.isActive === true || body.isActive === 1 || body.isActive === "1" ? 1 : 0;

  if (!Number.isFinite(id) || id < 1) {
    return json({ ok: false, error: "invalid_payload" }, 400, cors);
  }

  const result = await env.DB.prepare(`UPDATE access_codes SET is_active = ? WHERE id = ?`)
    .bind(isActive, id)
    .run();

  if (!result.meta || result.meta.changes < 1) {
    return json({ ok: false, error: "not_found" }, 404, cors);
  }

  return json({ ok: true }, 200, cors);
}

async function handleAdminDeleteCode(request, env, cors) {
  const body = await request.json().catch(() => ({}));
  const id = Number.parseInt(String(body.id || ""), 10);

  if (!Number.isFinite(id) || id < 1) {
    return json({ ok: false, error: "invalid_payload" }, 400, cors);
  }

  // Defensive delete flow: works even if older DB schema has no ON DELETE CASCADE.
  await env.DB.prepare(`DELETE FROM claims WHERE code_id = ?`).bind(id).run();
  const result = await env.DB.prepare(`DELETE FROM access_codes WHERE id = ?`).bind(id).run();
  if (!result.meta || result.meta.changes < 1) {
    return json({ ok: false, error: "not_found" }, 404, cors);
  }

  return json({ ok: true }, 200, cors);
}

async function handleAdminListUsers(url, env, cors) {
  const limit = parseLimit(url.searchParams.get("limit"), 100, 1000);
  const rows = await env.DB.prepare(
    `SELECT u.id, u.username, u.email, u.created_at, COUNT(c.id) AS claims
     FROM users u
     LEFT JOIN claims c ON c.user_id = u.id
     GROUP BY u.id
     ORDER BY u.id DESC
     LIMIT ?`
  )
    .bind(limit)
    .all();

  return json({ ok: true, users: rows.results || [] }, 200, cors);
}

async function handleAdminDeleteUser(request, env, cors) {
  const body = await request.json().catch(() => ({}));
  const id = Number.parseInt(String(body.id || ""), 10);

  if (!Number.isFinite(id) || id < 1) {
    return json({ ok: false, error: "invalid_payload" }, 400, cors);
  }

  // Defensive delete flow: works even if older DB schema has no ON DELETE CASCADE.
  await env.DB.prepare(`DELETE FROM claims WHERE user_id = ?`).bind(id).run();
  const result = await env.DB.prepare(`DELETE FROM users WHERE id = ?`).bind(id).run();
  if (!result.meta || result.meta.changes < 1) {
    return json({ ok: false, error: "not_found" }, 404, cors);
  }

  return json({ ok: true }, 200, cors);
}

async function handleAdminListClaims(url, env, cors) {
  const limit = parseLimit(url.searchParams.get("limit"), 100, 1000);
  const rows = await env.DB.prepare(
    `SELECT c.id, c.created_at, c.user_agent, u.username, u.email, ac.label
     FROM claims c
     JOIN users u ON u.id = c.user_id
     JOIN access_codes ac ON ac.id = c.code_id
     ORDER BY c.id DESC
     LIMIT ?`
  )
    .bind(limit)
    .all();

  return json({ ok: true, claims: rows.results || [] }, 200, cors);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = corsHeaders(request.headers.get("origin") || "", env);
    try {
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: cors });
      }

      if (url.pathname === "/api/health") {
        return json({ ok: true }, 200, cors);
      }

      if (url.pathname.startsWith("/api/admin/") && !isAdminAuthorized(request, env)) {
        return unauthorized(cors);
      }

      if (request.method === "POST" && url.pathname === "/api/verify-code") {
        return handleVerify(request, env, cors);
      }

      if (request.method === "POST" && url.pathname === "/api/register") {
        return handleRegister(request, env, cors);
      }

      if (request.method === "GET" && url.pathname === "/api/stats") {
        return handleStats(env, cors);
      }

      if (request.method === "POST" && url.pathname === "/api/admin/codes") {
        return handleCreateCode(request, env, cors);
      }

      if (request.method === "GET" && url.pathname === "/api/admin/codes") {
        return handleAdminListCodes(env, cors);
      }

      if (request.method === "POST" && url.pathname === "/api/admin/codes/set-max") {
        return handleAdminSetCodeMax(request, env, cors);
      }

      if (request.method === "POST" && url.pathname === "/api/admin/codes/set-active") {
        return handleAdminSetCodeActive(request, env, cors);
      }

      if (request.method === "POST" && url.pathname === "/api/admin/codes/delete") {
        return handleAdminDeleteCode(request, env, cors);
      }

      if (request.method === "GET" && url.pathname === "/api/admin/users") {
        return handleAdminListUsers(url, env, cors);
      }

      if (request.method === "POST" && url.pathname === "/api/admin/users/delete") {
        return handleAdminDeleteUser(request, env, cors);
      }

      if (request.method === "GET" && url.pathname === "/api/admin/claims") {
        return handleAdminListClaims(url, env, cors);
      }

      return json({ ok: false, error: "not_found" }, 404, cors);
    } catch (err) {
      return json(
        {
          ok: false,
          error: "server_error",
          message: err && err.message ? String(err.message) : "unexpected_error",
        },
        500,
        cors
      );
    }
  },
};
