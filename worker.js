/**
 * Cloudflare Worker with D1 Database + Static Assets (Single Fullstack Worker)
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

function getFormattedDate() {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, "0");
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const y = now.getFullYear();
  return `${d}.${m}.${y}`;
}

function generateToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, "");
    const method = request.method.toUpperCase();

    // CORS Preflight
    if (method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
          "Access-Control-Allow-Headers": "*",
        },
      });
    }

    // If NOT an API route, serve static assets (HTML, JS, CSS, images)
    if (!path.startsWith("/ajax") && env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    const params = {};
    for (const [k, v] of url.searchParams.entries()) params[k] = v;

    let body = {};
    if (method === "POST" || method === "PATCH") {
      const contentType = (request.headers.get("content-type") || "").toLowerCase();
      try {
        if (contentType.includes("application/json")) {
          body = await request.json();
        } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
          const formData = await request.formData();
          for (const [k, v] of formData.entries()) body[k] = v;
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
      for (const [k, v] of Object.entries(body)) {
        if (!(k in params)) params[k] = v;
      }
    }

    const db = env.DB;

    // Helper: Get user by token
    async function getUserByToken(token) {
      if (!token || !db) return null;
      try {
        const tokRow = await db.prepare("SELECT username FROM tokens WHERE token = ?").bind(token).first();
        if (!tokRow) return null;
        return await db.prepare("SELECT * FROM users WHERE LOWER(username) = LOWER(?)").bind(tokRow.username).first();
      } catch {
        return null;
      }
    }

    // Helper: Issue token
    async function issueToken(username) {
      const token = generateToken();
      if (db) {
        try {
          await db.prepare("INSERT INTO tokens (token, username) VALUES (?, ?)").bind(token, username).run();
        } catch {}
      }
      return token;
    }

    // ==================== AUTH ENDPOINTS ====================
    if ((path === "/ajax/users/auth/default" || path === "/ajax/users/auth/login" || path === "/ajax/users/auth/signin") && method === "POST") {
      const rawUser = (params.username || params.email || body.username || body.email || "").trim();
      if (!rawUser) {
        return textResponse("Введите логин или почту.", 400);
      }

      const isSuperAdmin = rawUser.toLowerCase() === "dustgames" || rawUser.toLowerCase() === "nikiforova280987@gmail.com";
      
      let user = null;
      if (db) {
        user = await db.prepare("SELECT * FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)")
          .bind(rawUser, rawUser).first();
      }

      // If user does not exist in DB
      if (!user) {
        if (isSuperAdmin) {
          const email = "nikiforova280987@gmail.com";
          const username = "DustGames";
          const role = "ADMIN";
          const subtill = "31.12.2099";
          if (db) {
            const regdate = getFormattedDate();
          await db.prepare("INSERT INTO users (username, email, role, subtill, regdate) VALUES (?, ?, ?, ?, ?)")
            .bind(username, email, role, subtill, regdate).run();
            user = await db.prepare("SELECT * FROM users WHERE LOWER(username) = LOWER(?)").bind(username).first();
          } else {
            user = {
              id: 1,
              username,
              email,
              isEmailVerified: 1,
              role,
              banned: 0,
              hwid: "LOCAL-FULL-ACCESS",
              subtill,
              regdate: getFormattedDate(),
            };
          }
        } else {
          return textResponse("Аккаунт не зарегистрирован. Пожалуйста, пройдите регистрацию (Sign Up).", 400);
        }
      }

      if (user.banned) {
        return textResponse("Ваш аккаунт заблокирован.", 403);
      }

      const token = await issueToken(user.username);
      return jsonResponse({
        authStatus: true,
        authMessage: `Добро пожаловать, ${user.username}!`,
        token,
      });
    }

    if (path === "/ajax/users/auth/register" && method === "POST") {
      const rawUser = (params.username || body.username || "").trim();
      const rawEmail = (params.email || body.email || "").trim();
      if (!rawUser) {
        return textResponse("Введите имя пользователя.", 400);
      }

      const isSuperAdmin = rawUser.toLowerCase() === "dustgames" || rawEmail.toLowerCase() === "nikiforova280987@gmail.com";
      const username = isSuperAdmin ? "DustGames" : rawUser;
      const email = isSuperAdmin ? "nikiforova280987@gmail.com" : (rawEmail || `${username.toLowerCase()}@localhost`);
      const role = isSuperAdmin ? "ADMIN" : "USER";
      const subtill = isSuperAdmin ? "31.12.2099" : "None";

      let user = null;
      if (db) {
        const existing = await db.prepare("SELECT * FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)")
          .bind(username, email).first();
        if (existing) {
          return textResponse("Пользователь с таким логином или почтой уже зарегистрирован.", 400);
        }

        const regdate = getFormattedDate();
        await db.prepare("INSERT INTO users (username, email, role, subtill, regdate) VALUES (?, ?, ?, ?, ?)")
          .bind(username, email, role, subtill, regdate).run();
        user = await db.prepare("SELECT * FROM users WHERE LOWER(username) = LOWER(?)").bind(username).first();
      }

      const token = await issueToken(user ? user.username : username);
      return jsonResponse({
        authStatus: true,
        authMessage: "Вы успешно зарегистрировались!",
        token,
      });
    }

    if (path === "/ajax/users/auth/resetPassword" && method === "POST") {
      const email = (params.email || body.email || "").trim();
      let user = null;
      if (db && email) {
        user = await db.prepare("SELECT * FROM users WHERE LOWER(email) = LOWER(?)").bind(email).first();
      }
      if (!user) {
        return textResponse("Пользователь с такой почтой не найден.", 404);
      }
      return textResponse("Инструкция по сбросу пароля отправлена на вашу почту.");
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
      if (token && db) {
        try {
          await db.prepare("DELETE FROM tokens WHERE token = ?").bind(token).run();
        } catch {}
      }
      return textResponse("Logged out");
    }

    if (path === "/ajax/users/auth/2fa/initializePanelSession" && method === "POST") {
      return textResponse("OK");
    }

    // ==================== PAYMENTS ENDPOINTS ====================
    if (path === "/ajax/payments/getAll") {
      return jsonResponse([
        { type: 1, price: 199, time: 30 },
        { type: 2, price: 299, time: 365 },
        { type: 3, price: 499, time: 999 },
        { type: 4, price: 149 },
      ]);
    }

    if (path === "/ajax/payments/additional/getAll") {
      return jsonResponse([
        { display: "BETA 1.21.11", price: 499, id: 101, role: "BETA" },
        { display: "BETA 1.21.11 + LifeTime", price: 899, id: 102, role: "BETA", time: 999 },
      ]);
    }

    if (path === "/ajax/payments/getMethods") {
      return jsonResponse([
        { enumName: "card", displayName: "Банковская карта (RU)" },
        { enumName: "sbp", displayName: "СБП (Система быстрых платежей)" },
        { enumName: "crypto", displayName: "Криптовалюта (USDT / TON / BTC)" },
      ]);
    }

    if (path === "/ajax/payments/applyPromocode" || path === "/ajax/payments/applyPaymentPromocode" || path === "/ajax/payments/promocodes/apply") {
      const promo = (params.promocode || params.code || body.promocode || "").toUpperCase();
      if (db) {
        const row = await db.prepare("SELECT discount FROM promocodes WHERE UPPER(name) = ?").bind(promo).first();
        if (row) return jsonResponse({ status: 200, data: `${row.discount}%` });
      }
      return jsonResponse({ status: 404, message: "PROMO_CODE_NOT_FOUND" }, 404);
    }

    if (path === "/ajax/payments/createPayment" || path === "/ajax/payments/frontend/create") {
      return textResponse("Купить чит можно будет позже", 400);
    }

    // ==================== MEDIA / PROMO STATS ====================
    if (path === "/ajax/promocodes/getInformation" && method === "POST") {
      return jsonResponse({
        bet: 0,
        code: "DUSTGAMES",
        paymentBet: 0,
        payments: [],
        totalAmount: 0,
        usages: 0,
      });
    }

    if (path === "/ajax/promocodes/link" && method === "POST") {
      return textResponse("Promocode linked");
    }

    // ==================== ADMIN & DASHBOARD ====================
    if (path.startsWith("/ajax/admin/") || path.startsWith("/ajax/friends/")) {
      const token = params.token || body.token;
      const user = await getUserByToken(token);

      if (path.endsWith("/isSessionInitialized")) {
        return textResponse(user && user.role === "ADMIN" ? "true" : "false");
      }

      // Block non-admins
      if (!user || user.role !== "ADMIN") {
        return jsonResponse({ error: "Access denied. Admins only.", content: [], total: 0 }, 403);
      }

      if (path.endsWith("/finances/getBanks")) {
        return jsonResponse({
          sber: { name: "Sberbank", id: "sber" },
          tinkoff: { name: "Tinkoff", id: "tinkoff" },
          alfa: { name: "Alfa-Bank", id: "alfa" },
        });
      }

      if (path.endsWith("/finances/getBalance")) return jsonResponse({ result: 0 });

      if (path.endsWith("/finances/getWithdraws")) {
        let withdrawsList = [];
        if (db) {
          try {
            const { results } = await db.prepare("SELECT * FROM withdraws ORDER BY id DESC").all();
            withdrawsList = results;
          } catch {}
        }
        return jsonResponse(withdrawsList);
      }

      if (path.endsWith("/users/getAll") || path.endsWith("/users/search")) {
        let usersList = [];
        if (db) {
          try {
            const { results } = await db.prepare("SELECT * FROM users ORDER BY id ASC").all();
            usersList = results.map((u) => ({
              uid: u.id,
              user: u.username,
              email: u.email,
              group: u.role,
              banned: Boolean(u.banned),
              hwid: u.hwid,
              subtill: u.subtill,
            }));
          } catch {}
        }
        return jsonResponse({ content: usersList, total: Math.ceil(usersList.length / 10) || 1 });
      }

      if (path.endsWith("/users/getByIdentifier")) {
        const uid = parseInt(params.id || body.id || "1");
        let u = null;
        if (db) {
          u = await db.prepare("SELECT * FROM users WHERE id = ?").bind(uid).first();
        }
        if (u) {
          return jsonResponse({
            banned: Boolean(u.banned),
            email: u.email,
            group: u.role,
            hwid: u.hwid,
            subtill: u.subtill,
            user: u.username,
          });
        }
        return jsonResponse({
          banned: false,
          email: "dustgames@local",
          group: "ADMIN",
          hwid: "LOCAL-FULL-ACCESS",
          subtill: "31.12.2099",
          user: "DustGames",
        });
      }

      if (path.endsWith("/users/patch") && (method === "PATCH" || method === "POST")) {
        const uname = params.user || body.username || body.user;
        if (db && uname) {
          if ("role" in body) {
            await db.prepare("UPDATE users SET role = ? WHERE LOWER(username) = LOWER(?)").bind(body.role, uname).run();
          }
          if ("isBanned" in body) {
            await db.prepare("UPDATE users SET banned = ? WHERE LOWER(username) = LOWER(?)").bind(body.isBanned ? 1 : 0, uname).run();
          }
          if ("subTill" in body) {
            await db.prepare("UPDATE users SET subtill = ? WHERE LOWER(username) = LOWER(?)").bind(body.subTill, uname).run();
          }
          if ("email" in body) {
            await db.prepare("UPDATE users SET email = ? WHERE LOWER(username) = LOWER(?)").bind(body.email, uname).run();
          }
        }
        return textResponse("User updated");
      }

      if (path.endsWith("/resetHardwareId")) {
        const uname = params.user || body.username;
        if (db && uname) {
          const newHwid = "RESET-" + generateToken().slice(0, 8).toUpperCase();
          await db.prepare("UPDATE users SET hwid = ? WHERE LOWER(username) = LOWER(?)").bind(newHwid, uname).run();
        }
        return textResponse("HWID reset");
      }

      if (path.endsWith("/keys/action/getAll")) {
        let keysList = [];
        if (db) {
          try {
            const { results } = await db.prepare("SELECT key, display, generatedBy FROM keys ORDER BY id DESC").all();
            keysList = results;
          } catch {}
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
          { display: "BETA 1.21.11", price: 499, id: 101, role: "BETA" },
          { display: "BETA 1.21.11 + LifeTime", price: 899, id: 102, role: "BETA", time: 999 },
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
          const k = "DUSTGAMES-" + generateToken().slice(0, 16).toUpperCase();
          createdKeys.push(k);
          if (db) {
            try {
              await db.prepare("INSERT INTO keys (key, display, generatedBy) VALUES (?, ?, 'DustGames')").bind(k, display).run();
            } catch {}
          }
        }
        return textResponse(createdKeys.join("\n"));
      }

      if (path.endsWith("/promocodes/getAll")) {
        let promoMap = {};
        if (db) {
          try {
            const { results } = await db.prepare("SELECT * FROM promocodes").all();
            for (const r of results) {
              promoMap[r.name] = r;
            }
          } catch {}
        }
        return jsonResponse(promoMap);
      }

      if (path.endsWith("/promocodes/create")) {
        const name = (params.promocode || body.promocode || "PROMO").toUpperCase();
        const bet = parseInt(params.bet || body.bet || "10");
        const max_u = parseInt(params.maxUsages || body.maxUsages || "100");
        if (db) {
          await db.prepare("INSERT OR REPLACE INTO promocodes (name, discount, activations, maxActivations, bet, maxUsages) VALUES (?, ?, 0, ?, ?, ?)")
            .bind(name, bet, max_u, bet, max_u).run();
        }
        return textResponse("Promocode created");
      }

      if (path.endsWith("/promocodes/delete")) {
        const name = (params.promocode || body.promocode || "").toUpperCase();
        if (db && name) {
          await db.prepare("DELETE FROM promocodes WHERE UPPER(name) = ?").bind(name).run();
        }
        return textResponse("Promocode deleted");
      }

      if (path.endsWith("/autoload/getVersions")) {
        return jsonResponse({
          "1.16.5": { display: "1.16.5", identify: "1.16.5" },
          "1.21.11": { display: "1.21.11 BETA", identify: "1.21.11" },
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
        return jsonResponse({});
      }

      return jsonResponse({ ok: true });
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return jsonResponse({ ok: true, authStatus: true });
  },
};
