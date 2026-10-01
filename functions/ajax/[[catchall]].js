/**
 * Cloudflare Pages Function handling all /ajax/* API requests
 * Integrates with Cloudflare D1 Database (env.DB)
 */

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "*",
      "Cache-Control": "no-store",
    },
  });
}

function textResponse(text, status = 200) {
  return new Response(String(text), {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "*",
      "Cache-Control": "no-store",
    },
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}

// In-memory fallback if D1 DB is not bound yet
let memoryTokens = new Map();
let memoryUsers = new Map([
  [
    "Resence",
    {
      id: 1,
      username: "Resence",
      email: "resence@localhost",
      isEmailVerified: 1,
      role: "ADMIN",
      banned: 0,
      hwid: "LOCAL-FULL-ACCESS",
      subtill: "31.12.2099",
      regdate: "01.01.2024",
    },
  ],
]);

function generateToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, "");
  const method = request.method.toUpperCase();

  if (method === "OPTIONS") {
    return onRequestOptions();
  }

  // Parse Query Parameters
  const params = {};
  for (const [k, v] of url.searchParams.entries()) {
    params[k] = v;
  }

  // Parse Body if POST or PATCH
  let body = {};
  if (method === "POST" || method === "PATCH") {
    const contentType = (request.headers.get("content-type") || "").toLowerCase();
    try {
      if (contentType.includes("application/json")) {
        body = await request.json();
      } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
        const formData = await request.formData();
        for (const [k, v] of formData.entries()) {
          body[k] = v;
        }
      } else {
        const text = await request.text();
        if (text) {
          try {
            body = JSON.parse(text);
          } catch {
            const sp = new URLSearchParams(text);
            for (const [k, v] of sp.entries()) body[k] = v;
          }
        }
      }
    } catch {
      body = {};
    }
    // merge body into params
    for (const [k, v] of Object.entries(body)) {
      if (!(k in params)) params[k] = v;
    }
  }

  const db = env.DB; // Cloudflare D1 Database binding

  // Helper: Get user by token
  async function getUserByToken(token) {
    if (!token) return null;
    if (db) {
      try {
        const tokRow = await db.prepare("SELECT username FROM tokens WHERE token = ?").bind(token).first();
        if (!tokRow) return null;
        const user = await db.prepare("SELECT * FROM users WHERE username = ?").bind(tokRow.username).first();
        return user || null;
      } catch (e) {
        console.error("D1 token lookup error:", e);
      }
    }
    const username = memoryTokens.get(token);
    return username ? memoryUsers.get(username) || null : null;
  }

  // Helper: Issue token
  async function issueToken(username) {
    const token = generateToken();
    if (db) {
      try {
        await db.prepare("INSERT INTO tokens (token, username) VALUES (?, ?)").bind(token, username).run();
      } catch (e) {
        console.error("D1 token insert error:", e);
      }
    }
    memoryTokens.set(token, username);
    return token;
  }

  // ==================== AUTH ENDPOINTS ====================
  if (path === "/ajax/users/auth/default" && method === "POST") {
    const username = params.username || "Resence";
    let user = null;
    if (db) {
      try {
        user = await db.prepare("SELECT * FROM users WHERE username = ?").bind(username).first();
        if (!user) {
          await db.prepare("INSERT INTO users (username, email, role, subtill, regdate) VALUES (?, ?, 'ADMIN', '31.12.2099', '01.01.2024')")
            .bind(username, `${username}@localhost`).run();
          user = await db.prepare("SELECT * FROM users WHERE username = ?").bind(username).first();
        }
      } catch (e) {
        console.error("D1 auth error:", e);
      }
    }
    if (!user) {
      if (!memoryUsers.has(username)) {
        memoryUsers.set(username, {
          id: memoryUsers.size + 1,
          username,
          email: `${username}@localhost`,
          isEmailVerified: 1,
          role: "ADMIN",
          banned: 0,
          hwid: "LOCAL-FULL-ACCESS",
          subtill: "31.12.2099",
          regdate: "01.01.2024",
        });
      }
      user = memoryUsers.get(username);
    }
    const token = await issueToken(user.username);
    return jsonResponse({
      authStatus: true,
      authMessage: `Welcome, ${user.username}!`,
      token,
    });
  }

  if (path === "/ajax/users/auth/register" && method === "POST") {
    const username = params.username || `user_${Date.now().toString().slice(-4)}`;
    const email = params.email || `${username}@localhost`;
    if (db) {
      try {
        await db.prepare("INSERT OR IGNORE INTO users (username, email, role, subtill, regdate) VALUES (?, ?, 'USER', '31.12.2099', '01.01.2024')")
          .bind(username, email).run();
      } catch (e) {
        console.error("D1 register error:", e);
      }
    }
    if (!memoryUsers.has(username)) {
      memoryUsers.set(username, {
        id: memoryUsers.size + 1,
        username,
        email,
        isEmailVerified: 1,
        role: "USER",
        banned: 0,
        hwid: "HWID-" + generateToken().slice(0, 8).toUpperCase(),
        subtill: "31.12.2099",
        regdate: "01.01.2024",
      });
    }
    const token = await issueToken(username);
    return jsonResponse({
      authStatus: true,
      authMessage: "Registered with full access",
      token,
    });
  }

  if (path === "/ajax/users/auth/session" && method === "POST") {
    const token = params.token || body.token;
    const user = await getUserByToken(token);
    if (!user) {
      return jsonResponse({ authStatus: false, authMessage: "No session" });
    }
    return jsonResponse({
      authStatus: true,
      authMessage: "OK",
      id: user.id,
      username: user.username,
      email: user.email,
      isEmailVerified: Boolean(user.isEmailVerified),
      role: user.role,
      banned: Boolean(user.banned),
      token,
      hwid: user.hwid,
      subtill: user.subtill,
      regdate: user.regdate,
    });
  }

  if (path === "/ajax/users/auth/logout" && method === "POST") {
    const token = params.token || body.token;
    if (token) {
      if (db) {
        try {
          await db.prepare("DELETE FROM tokens WHERE token = ?").bind(token).run();
        } catch {}
      }
      memoryTokens.delete(token);
    }
    return textResponse("Logged out");
  }

  if (path === "/ajax/users/auth/2fa/initializePanelSession" && method === "POST") {
    return textResponse("OK");
  }

  // ==================== PAYMENTS ENDPOINTS ====================
  if (path === "/ajax/payments/getAll") {
    return jsonResponse([
      { type: 1, price: 339, time: 30 },
      { type: 2, price: 489, time: 365 },
      { type: 3, price: 629, time: 999 },
      { type: 4, price: 299 },
    ]);
  }

  if (path === "/ajax/payments/additional/getAll") {
    return jsonResponse([
      { display: "BETA 1.21.4", price: 899, id: 101, role: "BETA" },
      { display: "BETA 1.21.4 + LifeTime", price: 1399, id: 102, role: "BETA", time: 999 },
    ]);
  }

  if (path === "/ajax/payments/getMethods") {
    return jsonResponse([
      { enumName: "card", displayName: "Банковская карта (RU)" },
      { enumName: "sbp", displayName: "СБП (Система быстрых платежей)" },
      { enumName: "crypto", displayName: "Криптовалюта (USDT / TON / BTC)" },
    ]);
  }

  if (path === "/ajax/payments/applyPromocode" || path === "/ajax/payments/applyPaymentPromocode") {
    const promo = (params.promocode || params.code || body.promocode || "").toUpperCase();
    if (promo === "WELCOME") return jsonResponse({ status: 200, data: "10%" });
    if (promo === "FULLACCESS") return jsonResponse({ status: 200, data: "50%" });
    return jsonResponse({ status: 404, message: "PROMO_CODE_NOT_FOUND" }, 404);
  }

  if (path === "/ajax/payments/createPayment") {
    return jsonResponse({ status: 200, data: "https://pay.example.com" });
  }

  // ==================== PROMOCODES & MEDIA ====================
  if (path === "/ajax/promocodes/getInformation" && method === "POST") {
    const now = Date.now();
    const payments = [
      { title: "Lifetime", amount: 629, buyTime: now - 86400000 * 6, name: "Lifetime", value: 629, payload: { time: now - 86400000 * 6 } },
      { title: "30 days", amount: 339, buyTime: now - 86400000 * 3, name: "30 days", value: 339, payload: { time: now - 86400000 * 3 } },
      { title: "365 days", amount: 489, buyTime: now - 86400000, name: "365 days", value: 489, payload: { time: now - 86400000 } },
    ];
    return jsonResponse({
      bet: 15,
      code: "RESENCE",
      paymentBet: 50,
      payments,
      totalAmount: 1457,
      usages: 12,
    });
  }

  if (path === "/ajax/promocodes/link" && method === "POST") {
    return textResponse("Promocode linked");
  }

  // ==================== ADMIN & DASHBOARD ====================
  if (path.startsWith("/ajax/admin/") || path.startsWith("/ajax/friends/")) {
    if (path.endsWith("/isSessionInitialized")) {
      return textResponse("true");
    }

    if (path.endsWith("/finances/getBanks")) {
      return jsonResponse({
        sber: { name: "Sberbank", id: "sber" },
        tinkoff: { name: "Tinkoff", id: "tinkoff" },
        alfa: { name: "Alfa-Bank", id: "alfa" },
      });
    }

    if (path.endsWith("/finances/getBalance")) {
      return jsonResponse({ result: 999999 });
    }

    if (path.endsWith("/finances/getWithdraws")) {
      return jsonResponse([
        { orderId: "WD-1001", amount: 1500, status: "PENDING", type: "SBP", wallet: "79001234567", bank: "sber" },
      ]);
    }

    if (path.endsWith("/users/getAll") || path.endsWith("/users/search")) {
      let usersList = [];
      if (db) {
        try {
          const { results } = await db.prepare("SELECT * FROM users").all();
          usersList = results.map((u) => ({
            uid: u.id,
            user: u.username,
            email: u.email,
            group: u.role,
            banned: Boolean(u.banned),
            hwid: u.hwid,
            subtill: u.subtill,
          }));
        } catch (e) {
          console.error("D1 users query error:", e);
        }
      }
      if (usersList.length === 0) {
        usersList = Array.from(memoryUsers.values()).map((u) => ({
          uid: u.id,
          user: u.username,
          email: u.email,
          group: u.role,
          banned: Boolean(u.banned),
          hwid: u.hwid,
          subtill: u.subtill,
        }));
      }
      return jsonResponse({ content: usersList, total: 1 });
    }

    if (path.endsWith("/users/getByIdentifier")) {
      return jsonResponse({
        banned: false,
        email: "resence@localhost",
        group: "ADMIN",
        hwid: "LOCAL-FULL-ACCESS",
        subtill: "31.12.2099",
        user: "Resence",
      });
    }

    if (path.endsWith("/resetHardwareId")) {
      return textResponse("HWID reset");
    }

    if (path.endsWith("/keys/action/getAll")) {
      let keysList = [];
      if (db) {
        try {
          const { results } = await db.prepare("SELECT key, display, generatedBy FROM keys").all();
          keysList = results;
        } catch {}
      }
      if (keysList.length === 0) {
        keysList = [
          { key: "RESENCE-AAAA-BBBB-CCCC-DDDD", display: "Lifetime", generatedBy: "Resence" },
          { key: "RESENCE-1111-2222-3333-4444", display: "30 days", generatedBy: "Resence" },
        ];
      }
      return jsonResponse(keysList);
    }

    if (path.endsWith("/keys/action/remove")) {
      const k = params.key || body.key;
      if (db && k) {
        try {
          await db.prepare("DELETE FROM keys WHERE key = ?").bind(k).run();
        } catch {}
      }
      return textResponse("Key removed");
    }

    if (path.endsWith("/keys/getAdditionalProducts")) {
      return jsonResponse([
        { display: "BETA 1.21.4", price: 899, id: 101, role: "BETA" },
        { display: "BETA 1.21.4 + LifeTime", price: 1399, id: 102, role: "BETA", time: 999 },
      ]);
    }

    if (path.includes("/multiactions/keys/")) {
      const count = Math.min(Math.max(parseInt(params.count || body.count || "1"), 1), 50);
      const days = params.days || body.days || "";
      let display = "Custom";
      if (path.endsWith("/subscription")) display = days ? `${days} days` : "Subscription";
      else if (path.endsWith("/hardwareReset")) display = "Hardware Reset";
      else if (path.endsWith("/beta")) display = "BETA";

      const createdKeys = [];
      for (let i = 0; i < count; i++) {
        const k = "RESENCE-" + generateToken().slice(0, 16).toUpperCase();
        createdKeys.push(k);
        if (db) {
          try {
            await db.prepare("INSERT INTO keys (key, display, generatedBy) VALUES (?, ?, 'Resence')").bind(k, display).run();
          } catch {}
        }
      }
      return textResponse(createdKeys.join("\n"));
    }

    if (path.endsWith("/promocodes/getAll")) {
      return jsonResponse({
        WELCOME: { name: "WELCOME", discount: 10, activations: 2, maxActivations: 100, bet: 10, maxUsages: 100 },
        FULLACCESS: { name: "FULLACCESS", discount: 50, activations: 0, maxActivations: 999, bet: 50, maxUsages: 999 },
      });
    }

    if (path.endsWith("/autoload/getVersions")) {
      return jsonResponse({
        "1.16.5": { display: "1.16.5", identify: "1.16.5" },
        "1.21.4": { display: "1.21.4 BETA", identify: "1.21.4" },
      });
    }

    if (path.endsWith("/media/getVideo")) {
      return jsonResponse({ videoUrl: "https://www.youtube.com/embed/LsF6GYEHx1I?si=IFRCxX32_8xlJYTQ" });
    }

    if (path.endsWith("/media/setVideo")) {
      const videoUrl = params.videoUrl || body.videoUrl || "";
      return jsonResponse({ status: "ok", videoUrl });
    }

    if (path.endsWith("/logs/getAllByCategory")) {
      const now = Math.floor(Date.now() / 1000);
      return jsonResponse({
        [now - 3600]: { username: "Resence", action: "Logged into dashboard" },
        [now - 1800]: { username: "Resence", action: "Generated lifetime key" },
      });
    }

    return jsonResponse({ ok: true, message: "Cloudflare D1 Mock OK" });
  }

  // Catch-all for generic ajax
  return jsonResponse({ ok: true, authStatus: true });
}
