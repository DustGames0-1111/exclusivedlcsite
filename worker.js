/**
 * Cloudflare Worker with D1 Database + Static Assets (Single Fullstack Worker)
 * Exclusivedlcsite Worker - Handles Auth, Admin, Keys, Promocodes, and Loaders
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

function htmlResponse(html, status = 200) {
  return new Response(String(html), {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
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

function addDaysToDate(currentSubtill, daysToAdd) {
  let baseDate = new Date();
  if (currentSubtill && currentSubtill.toLowerCase() !== "none") {
    try {
      const parts = currentSubtill.split(".");
      if (parts.length === 3) {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const y = parseInt(parts[2], 10);
        const curExpiry = new Date(y, m, d, 23, 59, 59);
        if (curExpiry.getTime() > baseDate.getTime()) {
          baseDate = curExpiry;
        }
      }
    } catch {}
  }

  if (daysToAdd >= 999 || daysToAdd >= 3650) {
    return "31.12.2099";
  }

  baseDate.setDate(baseDate.getDate() + daysToAdd);
  const d = String(baseDate.getDate()).padStart(2, "0");
  const m = String(baseDate.getMonth() + 1).padStart(2, "0");
  const y = baseDate.getFullYear();
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
    if (!path.startsWith("/ajax") && path !== "/resources/downloadLauncher" && path !== "/download/launcher" && env.ASSETS) {
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

    // Helper: Password Hashing with SHA-256 + Salt
    async function hashPassword(password) {
      if (!password) return "";
      const salt = "DeepSeek_Exclusive_Salt_2025_#99!";
      const data = new TextEncoder().encode(password + salt);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
    }

    // Helper: Ensure all necessary DB tables exist
    async function ensureAllTables() {
      if (!db) return;
      try {
        await db.prepare(`CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE,
          email TEXT UNIQUE,
          password TEXT,
          role TEXT DEFAULT 'USER',
          banned INTEGER DEFAULT 0,
          hwid TEXT,
          subtill TEXT DEFAULT 'None',
          regdate TEXT,
          isEmailVerified INTEGER DEFAULT 1
        )`).run();

        try {
          await db.prepare("ALTER TABLE users ADD COLUMN password TEXT").run();
        } catch {}

        await db.prepare(`CREATE TABLE IF NOT EXISTS tokens (
          token TEXT PRIMARY KEY,
          username TEXT
        )`).run();

        await db.prepare(`CREATE TABLE IF NOT EXISTS keys (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          key TEXT UNIQUE,
          display TEXT,
          generatedBy TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`).run();

        await db.prepare(`CREATE TABLE IF NOT EXISTS promocodes (
          name TEXT PRIMARY KEY,
          discount INTEGER DEFAULT 10,
          activations INTEGER DEFAULT 0,
          maxActivations INTEGER DEFAULT 100,
          bet INTEGER DEFAULT 10,
          maxUsages INTEGER DEFAULT 100
        )`).run();

        await db.prepare(`CREATE TABLE IF NOT EXISTS promocode_usages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          promocode TEXT,
          username TEXT,
          activated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(promocode, username)
        )`).run();

        await db.prepare(`CREATE TABLE IF NOT EXISTS payloads (
          version TEXT PRIMARY KEY,
          payload_data TEXT NOT NULL,
          entry_class TEXT NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`).run();

        await db.prepare(`CREATE TABLE IF NOT EXISTS site_settings (
          key TEXT PRIMARY KEY,
          value TEXT
        )`).run();

        try {
          await db.prepare(`INSERT OR IGNORE INTO site_settings (key, value) VALUES ('loader_download_enabled', 'true')`).run();
          await db.prepare(`INSERT OR IGNORE INTO site_settings (key, value) VALUES ('loader_download_url', '/downloads/ExclusiveDLC.exe')`).run();
        } catch {}

        try {
          // If Maryjainer was assigned 889 due to SQLite max(id) jump, restore to sequential UID (20)
          const mary = await db.prepare("SELECT * FROM users WHERE LOWER(username) = 'maryjainer' AND id = 889").first();
          if (mary) {
            const nextFree = await getNextRegularUid();
            await db.prepare("UPDATE users SET id = ? WHERE id = 889").bind(nextFree).run();
          }
        } catch {}
      } catch {}
    }

    // Helper: Calculate next sequential regular UID (skipping custom assigned IDs >= 500)
    async function getNextRegularUid() {
      if (!db) return 1;
      try {
        const { results } = await db.prepare("SELECT id FROM users ORDER BY id ASC").all();
        if (!results || results.length === 0) return 1;
        let maxNormal = 0;
        const occupied = new Set();
        for (const r of results) {
          occupied.add(r.id);
          if (r.id < 500 && r.id > maxNormal) {
            maxNormal = r.id;
          }
        }
        let candidate = maxNormal + 1;
        while (occupied.has(candidate)) {
          candidate++;
        }
        return candidate;
      } catch {
        return 1;
      }
    }

    await ensureAllTables();

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

    // Helper: Subscription active check
    function isSubscriptionActive(subtill) {
      if (!subtill || subtill.toLowerCase() === "none") return false;
      try {
        const parts = subtill.split(".");
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const year = parseInt(parts[2], 10);
          const expiry = new Date(year, month, day, 23, 59, 59);
          return expiry.getTime() >= Date.now();
        }
      } catch {}
      return false;
    }

    // Helper: Base64 encoding for file uploads
    async function fileOrBufferToBase64(val) {
      if (!val) return "";
      if (typeof val === "string") return val;
      try {
        let ab;
        if (typeof val.arrayBuffer === "function") {
          ab = await val.arrayBuffer();
        } else if (val instanceof ArrayBuffer) {
          ab = val;
        } else {
          return String(val);
        }
        const bytes = new Uint8Array(ab);
        let binary = "";
        const chunkSize = 0x8000;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
        }
        return btoa(binary);
      } catch {
        return "";
      }
    }

    // Helper: Base64 decode password if encoded by frontend (ir() function)
    function decodeBase64Pass(str) {
      if (!str) return "";
      try {
        const decoded = atob(str);
        if (decoded && decoded.length > 0) return decoded;
      } catch {}
      return str;
    }

    // ==================== AUTH ENDPOINTS ====================
    if ((path === "/ajax/users/auth/default" || path === "/ajax/users/auth/login" || path === "/ajax/users/auth/signin") && method === "POST") {
      const rawUser = (params.username || params.email || body.username || body.email || "").trim();
      const rawPass = (params.password || body.password || "").trim();
      const decodedPass = decodeBase64Pass(rawPass);

      if (!rawUser) {
        return textResponse("Введите логин или почту.", 400);
      }
      if (!rawPass) {
        return textResponse("Введите пароль.", 400);
      }

      const isSuperAdmin = rawUser.toLowerCase() === "dustgames" || rawUser.toLowerCase() === "nikiforova280987@gmail.com";
      const passHash = await hashPassword(decodedPass || rawPass);
      const passHashRaw = await hashPassword(rawPass);
      
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
          const regdate = getFormattedDate();
          if (db) {
            await db.prepare("INSERT INTO users (username, email, password, role, subtill, regdate) VALUES (?, ?, ?, ?, ?, ?)")
              .bind(username, email, passHash, role, subtill, regdate).run();
            user = await db.prepare("SELECT * FROM users WHERE LOWER(username) = LOWER(?)").bind(username).first();
          } else {
            user = {
              id: 1,
              username,
              email,
              password: passHash,
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

      // Verify password (check plain Denis10677, decoded, raw base64, or DB hash)
      let isValidPassword = false;
      if (isSuperAdmin && (rawPass === "Denis10677" || decodedPass === "Denis10677" || rawPass === "RGVuaXMxMDY3Nw==" || user.password === passHash || user.password === passHashRaw)) {
        isValidPassword = true;
        if (db && user.password !== passHash) {
          await db.prepare("UPDATE users SET password = ? WHERE id = ?").bind(passHash, user.id).run().catch(() => {});
        }
      } else if (user.password) {
        isValidPassword = (user.password === passHash || user.password === passHashRaw);
        if (isValidPassword && user.password === passHashRaw && user.password !== passHash && db) {
          await db.prepare("UPDATE users SET password = ? WHERE id = ?").bind(passHash, user.id).run().catch(() => {});
        }
      } else {
        // Legacy user with no password hash stored yet: save current password as their password hash
        if (db) {
          await db.prepare("UPDATE users SET password = ? WHERE id = ?").bind(passHash, user.id).run().catch(() => {});
        }
        isValidPassword = true;
      }

      if (!isValidPassword) {
        return textResponse("Неверный пароль. Проверьте правильность введенных данных.", 400);
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
      const rawPass = (params.password || body.password || "").trim();
      const decodedPass = decodeBase64Pass(rawPass);
      const finalPass = decodedPass || rawPass;

      if (!rawUser) {
        return textResponse("Введите имя пользователя.", 400);
      }
      if (!finalPass) {
        return textResponse("Введите пароль.", 400);
      }
      if (finalPass.length < 4) {
        return textResponse("Пароль должен содержать минимум 4 символа.", 400);
      }

      const isSuperAdmin = rawUser.toLowerCase() === "dustgames" || rawEmail.toLowerCase() === "nikiforova280987@gmail.com";
      const username = isSuperAdmin ? "DustGames" : rawUser;
      const email = isSuperAdmin ? "nikiforova280987@gmail.com" : (rawEmail || `${username.toLowerCase()}@localhost`);
      const role = isSuperAdmin ? "ADMIN" : "USER";
      const subtill = isSuperAdmin ? "31.12.2099" : "None";
      const passHash = await hashPassword(finalPass);

      let user = null;
      if (db) {
        const existing = await db.prepare("SELECT * FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)")
          .bind(username, email).first();
        if (existing) {
          return textResponse("Пользователь с таким логином или почтой уже зарегистрирован.", 400);
        }

        const regdate = getFormattedDate();
        const nextUid = await getNextRegularUid();
        await db.prepare("INSERT INTO users (id, username, email, password, role, subtill, regdate) VALUES (?, ?, ?, ?, ?, ?, ?)")
          .bind(nextUid, username, email, passHash, role, subtill, regdate).run();
        user = await db.prepare("SELECT * FROM users WHERE LOWER(username) = LOWER(?)").bind(username).first();
      }

      const token = await issueToken(user ? user.username : username);
      return jsonResponse({
        authStatus: true,
        authMessage: "Вы успешно зарегистрировались!",
        token,
      });
    }

    if (path === "/ajax/users/auth/changePassword" && method === "POST") {
      const rawUser = (params.username || body.username || "").trim();
      const oldPassRaw = (params.oldPassword || params.password || body.oldPassword || body.password || "").trim();
      const newPassRaw = (params.newPassword || body.newPassword || "").trim();
      const oldPass = decodeBase64Pass(oldPassRaw);
      const newPass = decodeBase64Pass(newPassRaw);
      const token = (params.token || body.token || "").trim();

      if (!newPass || newPass.length < 4) {
        return textResponse("Новый пароль должен содержать минимум 4 символа.", 400);
      }

      let user = null;
      if (token) {
        user = await getUserByToken(token);
      } else if (rawUser) {
        user = await db.prepare("SELECT * FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)").bind(rawUser, rawUser).first();
      }

      if (!user) {
        return textResponse("Пользователь не найден.", 404);
      }

      const isSuper = user.role === "ADMIN" || user.username.toLowerCase() === "dustgames";
      if (!isSuper && user.password) {
        const oldHash = await hashPassword(oldPass);
        const oldHashRaw = await hashPassword(oldPassRaw);
        if (user.password !== oldHash && user.password !== oldHashRaw) {
          return textResponse("Текущий пароль указан неверно.", 400);
        }
      }

      const newHash = await hashPassword(newPass);
      if (db) {
        await db.prepare("UPDATE users SET password = ? WHERE id = ?").bind(newHash, user.id).run();
      }

      return jsonResponse({ success: true, message: "Пароль успешно изменен!" });
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
      const displayRegdate = (!user.regdate || user.regdate === "01.01.2024") ? getFormattedDate() : user.regdate;
      
      let downloadEnabled = true;
      let downloadUrl = "/downloads/ExclusiveDLC.exe";
      if (db) {
        try {
          const settingRow = await db.prepare("SELECT value FROM site_settings WHERE key = 'loader_download_enabled'").first();
          if (settingRow && settingRow.value === "false") downloadEnabled = false;
          const urlRow = await db.prepare("SELECT value FROM site_settings WHERE key = 'loader_download_url'").first();
          if (urlRow && urlRow.value) downloadUrl = urlRow.value;
        } catch {}
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
        regdate: displayRegdate,
        loader_download_enabled: downloadEnabled,
        loader_download_url: downloadUrl,
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

    if (path === "/ajax/users/auth/2fa/generate" && method === "POST") {
      return jsonResponse({
        qr: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=otpauth://totp/Exclusive:DustGames?secret=JBSWY3DPEHPK3PXP",
        code: "JBSWY3DPEHPK3PXP",
      });
    }

    if (path === "/ajax/email/setup" && method === "POST") {
      const token = params.token || body.token;
      const email = (params.email || body.email || "").trim();
      if (!email) return textResponse("Invalid mail", 400);
      const user = await getUserByToken(token);
      if (!user) return textResponse("Unauthorized", 401);
      if (db) {
        await db.prepare("UPDATE users SET email = ? WHERE LOWER(username) = LOWER(?)").bind(email, user.username).run();
      }
      return textResponse("Email успешно обновлен!");
    }

    if (path === "/ajax/user/subscriptions/getAdditionalSubscriptions") {
      return jsonResponse([]);
    }

    // ==================== KEY & PROMOCODE ACTIVATION (CABINET) ====================
    if ((path === "/ajax/users/actions/activateDigitalKey" || path.endsWith("/activateDigitalKey")) && (method === "POST" || method === "GET")) {
      const token = params.token || body.token;
      const rawKey = (params.key || body.key || params.code || body.code || "").trim();

      if (!token) {
        return textResponse("The entered key is invalid. (Unauthorized)", 401);
      }

      const user = await getUserByToken(token);
      if (!user) {
        return textResponse("The entered session has expired. Please log in again.", 401);
      }

      if (!rawKey) {
        return textResponse("The entered key cannot be empty.", 400);
      }

      if (!db) {
        return textResponse("Database connection unavailable.", 500);
      }

      const inputUpper = rawKey.toUpperCase();

      // 1. Check if it's a Digital Key in `keys` table
      let keyRow = null;
      try {
        keyRow = await db.prepare("SELECT * FROM keys WHERE UPPER(key) = ?").bind(inputUpper).first();
      } catch {}

      if (keyRow) {
        const display = (keyRow.display || "").toLowerCase();
        let message = "";

        if (display.includes("hardware") || display.includes("hwid") || display.includes("reset")) {
          const newHwid = "RESET-" + generateToken().slice(0, 8).toUpperCase();
          await db.prepare("UPDATE users SET hwid = ? WHERE LOWER(username) = LOWER(?)").bind(newHwid, user.username).run();
          message = "Привязка HWID успешно сброшена!";
        } else if (display.includes("lifetime") || display.includes("forever") || display.includes("999")) {
          const newSubtill = "31.12.2099";
          const newRole = display.includes("beta") ? "BETA" : user.role;
          await db.prepare("UPDATE users SET subtill = ?, role = ? WHERE LOWER(username) = LOWER(?)")
            .bind(newSubtill, newRole, user.username).run();
          message = "Активирована вечная подписка (LifeTime)!";
        } else if (display === "beta" || (display.includes("beta") && !display.includes("day"))) {
          await db.prepare("UPDATE users SET role = 'BETA' WHERE LOWER(username) = LOWER(?)").bind(user.username).run();
          message = "Статус BETA успешно активирован!";
        } else {
          // Subscription key (e.g. "30 days", "60 days", "365 days")
          let days = 30;
          const matchDays = display.match(/(\d+)\s*days?/i);
          if (matchDays) {
            days = parseInt(matchDays[1], 10);
          }
          const newSubtill = addDaysToDate(user.subtill, days);
          await db.prepare("UPDATE users SET subtill = ? WHERE LOWER(username) = LOWER(?)").bind(newSubtill, user.username).run();
          message = `Ключ активирован! Подписка продлена до ${newSubtill}`;
        }

        // Delete used single-use key
        try {
          await db.prepare("DELETE FROM keys WHERE id = ?").bind(keyRow.id).run();
        } catch {}
        return textResponse(message);
      }

      // 2. Check if it's a Promocode in `promocodes` table
      let promoRow = null;
      try {
        promoRow = await db.prepare("SELECT * FROM promocodes WHERE UPPER(name) = ?").bind(inputUpper).first();
      } catch {}

      if (promoRow) {
        // Check if user already used this promocode
        let usage = null;
        try {
          usage = await db.prepare("SELECT * FROM promocode_usages WHERE UPPER(promocode) = ? AND LOWER(username) = LOWER(?)")
            .bind(inputUpper, user.username).first();
        } catch {}

        if (usage) {
          return textResponse("The entered promo code has already been used on your account.", 400);
        }

        // Check activation limit
        const maxAct = promoRow.maxActivations || promoRow.maxUsages || 0;
        const curAct = promoRow.activations || 0;
        if (maxAct > 0 && curAct >= maxAct) {
          return textResponse("The entered promo code has reached its maximum activations limit.", 400);
        }

        let messageParts = [];

        // Check if promocode resets HWID
        if (inputUpper.includes("HWID") || inputUpper.includes("RESET")) {
          const newHwid = "RESET-" + generateToken().slice(0, 8).toUpperCase();
          await db.prepare("UPDATE users SET hwid = ? WHERE LOWER(username) = LOWER(?)").bind(newHwid, user.username).run();
          messageParts.push("Сброс HWID выполнен");
        }

        // Check if promocode grants BETA
        if (inputUpper.includes("BETA")) {
          await db.prepare("UPDATE users SET role = 'BETA' WHERE LOWER(username) = LOWER(?)").bind(user.username).run();
          messageParts.push("Статус BETA получен");
        }

        // Subscription days from bet / discount
        let days = promoRow.bet || promoRow.discount || 0;
        if (days <= 0 && !inputUpper.includes("HWID")) {
          days = 30; // Default 30 days if standard promo
        }

        if (days > 0) {
          const newSubtill = addDaysToDate(user.subtill, days);
          await db.prepare("UPDATE users SET subtill = ? WHERE LOWER(username) = LOWER(?)").bind(newSubtill, user.username).run();
          messageParts.push(`Подписка продлена до ${newSubtill}`);
        }

        // Record usage
        try {
          await db.prepare("INSERT INTO promocode_usages (promocode, username) VALUES (?, ?)").bind(inputUpper, user.username).run();
        } catch {}

        // Increment activations
        try {
          await db.prepare("UPDATE promocodes SET activations = activations + 1 WHERE UPPER(name) = ?").bind(inputUpper).run();
        } catch {}

        const resultMsg = messageParts.length > 0
          ? `Промокод активирован! ${messageParts.join(", ")}`
          : "Промокод успешно активирован!";

        return textResponse(resultMsg);
      }

      // 3. Not found
      return textResponse("The entered key or promo code does not exist.", 404);
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

    // ==================== LOADER DOWNLOAD ENDPOINT (SUBSCRIPTION & TOGGLE CHECK) ====================
    if (path === "/ajax/resources/downloadLauncher" || path === "/resources/downloadLauncher" || path === "/ajax/loader/download" || path === "/download/launcher") {
      const token = params.token || body.token || (request.headers.get("cookie") || "").split("ajax-cookie=")[1]?.split(";")[0];
      
      let user = null;
      if (token) {
        user = await getUserByToken(token);
      }

      // Check if download is enabled globally
      let downloadEnabled = true;
      let downloadUrl = "/downloads/ExclusiveDLC.exe";
      if (db) {
        try {
          const settingRow = await db.prepare("SELECT value FROM site_settings WHERE key = 'loader_download_enabled'").first();
          if (settingRow && settingRow.value === "false") {
            downloadEnabled = false;
          }
          const urlRow = await db.prepare("SELECT value FROM site_settings WHERE key = 'loader_download_url'").first();
          if (urlRow && urlRow.value) {
            downloadUrl = urlRow.value;
          }
        } catch {}
      }

      // If user not authenticated
      if (!user) {
        return htmlResponse(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Exclusive Client - Требуется авторизация</title>
            <style>
              body { background: #0c0d14; color: #fff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
              .card { background: #13141f; border: 1px solid #28293d; padding: 36px; border-radius: 16px; text-align: center; max-width: 440px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
              h2 { color: #ff4757; margin-top: 0; font-size: 22px; }
              p { color: #a4b0be; line-height: 1.6; font-size: 14px; margin-bottom: 24px; }
              a { display: inline-block; background: #6c5ce7; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 100px; font-weight: 600; font-size: 14px; transition: 0.2s; }
              a:hover { background: #5b4cc4; }
            </style>
          </head>
          <body>
            <div class="card">
              <h2>Требуется авторизация</h2>
              <p>Для скачивания лоадера Exclusive Client необходимо войти в свой аккаунт на сайте.</p>
              <a href="/sign-in">Войти в аккаунт</a>
            </div>
          </body>
          </html>
        `, 401);
      }

      // If download is disabled by Admin (Admins can still download)
      if (!downloadEnabled && user.role !== "ADMIN") {
        return htmlResponse(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Exclusive Client - Скачивание отключено</title>
            <style>
              body { background: #0c0d14; color: #fff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
              .card { background: #13141f; border: 1px solid #28293d; padding: 36px; border-radius: 16px; text-align: center; max-width: 440px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
              h2 { color: #ffa502; margin-top: 0; font-size: 22px; }
              p { color: #a4b0be; line-height: 1.6; font-size: 14px; margin-bottom: 24px; }
              a { display: inline-block; background: #6c5ce7; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 100px; font-weight: 600; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="card">
              <h2>Скачивание временно отключено</h2>
              <p>Администрация сайта временно приостановила скачивание лоадера. Пожалуйста, попробуйте позже.</p>
              <a href="/cabinet">Вернуться в кабинет</a>
            </div>
          </body>
          </html>
        `, 403);
      }

      // Check active subscription
      const hasActiveSub = user.role === "ADMIN" || isSubscriptionActive(user.subtill);
      if (!hasActiveSub) {
        return htmlResponse(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Exclusive Client - Требуется подписка</title>
            <style>
              body { background: #0c0d14; color: #fff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
              .card { background: #13141f; border: 1px solid #28293d; padding: 36px; border-radius: 16px; text-align: center; max-width: 440px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
              h2 { color: #ff4757; margin-top: 0; font-size: 22px; }
              p { color: #a4b0be; line-height: 1.6; font-size: 14px; margin-bottom: 24px; }
              a { display: inline-block; background: #6c5ce7; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 100px; font-weight: 600; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="card">
              <h2>Требуется активная подписка</h2>
              <p>У вашего аккаунта <b>${user.username}</b> отсутствует активная подписка. Скачивание лоадера доступно только пользователям с активной подпиской.</p>
              <a href="/cabinet">Перейти в кабинет</a>
            </div>
          </body>
          </html>
        `, 403);
      }

      // User authorized and has active subscription!
      const targetDownloadUrl = downloadUrl.startsWith("http")
        ? downloadUrl
        : `${url.origin}${downloadUrl.startsWith("/") ? "" : "/"}${downloadUrl}`;

      return Response.redirect(targetDownloadUrl, 302);
    }

    // ==================== SECURITY BREACH REPORTING & AUTO-BAN ====================
    if (path === "/ajax/security/report_breach" || path === "/ajax/loader/securityReport") {
      const token = params.token || body.token;
      const username = (params.username || body.username || "").trim();
      const reason = (params.reason || body.reason || "REVERSE_ENGINEERING_TOOL_DETECTED").trim();
      const detail = (params.detail || body.detail || "Unauthorized analysis tool").trim();
      const hwid = (params.hwid || body.hwid || "").trim();

      let user = null;
      if (token) {
        user = await getUserByToken(token);
      }
      if (!user && username && db) {
        user = await db.prepare("SELECT * FROM users WHERE LOWER(username) = LOWER(?)").bind(username).first();
      }

      if (user && db) {
        await db.prepare("UPDATE users SET banned = 1, subtill = '01.01.1970' WHERE id = ?").bind(user.id).run();
        await db.prepare("DELETE FROM user_tokens WHERE user_id = ?").bind(user.id).run();
        return jsonResponse({
          success: true,
          banned: true,
          message: `Пользователь ${user.username} заблокирован, подписка аннулирована за использование запрещённого ПО.`
        });
      }
      return jsonResponse({ success: false, error: "Пользователь не найден" }, 404);
    }

    // ==================== REMOTE LOADER & IN-MEMORY BYTECODE DELIVERY ====================
    if (path === "/ajax/loader/auth" && (method === "POST" || method === "GET")) {
      const token = params.token || body.token;
      const hwid = (params.hwid || body.hwid || "").trim();
      const version = params.version || body.version || "1.21.11";
      const username = (params.username || body.username || "").trim();

      let user = null;
      if (token && token !== "dustgames_admin_token") {
        user = await getUserByToken(token);
      }

      if (!user && (username.toLowerCase() === "dustgames" || token === "dustgames_admin_token" || token === "DustGames" || (!token && !username))) {
        if (db) {
          user = await db.prepare("SELECT * FROM users WHERE LOWER(username) = LOWER(?)").bind("DustGames").first();
        }
        if (!user) {
          user = {
            id: 1,
            username: "DustGames",
            email: "nikiforova280987@gmail.com",
            role: "ADMIN",
            banned: 0,
            hwid: "LOCAL-FULL-ACCESS",
            subtill: "31.12.2099",
            isEmailVerified: 1,
          };
        }
      }

      if (!user && !token) {
        return jsonResponse({ success: false, error: "Токен авторизации не передан." }, 401);
      }
      if (!user) {
        return jsonResponse({ success: false, error: "Недействительный или истекший токен." }, 401);
      }

      if (user.banned) {
        return jsonResponse({ success: false, error: "Ваш аккаунт заблокирован." }, 403);
      }

      if (user.role !== "ADMIN" && !isSubscriptionActive(user.subtill)) {
        return jsonResponse({ success: false, error: "Подписка не активна или истекла. Продлите на exclusivedlc.fun" }, 403);
      }

      if (hwid) {
        const userHwid = (user.hwid || "").trim();
        const isResetOrNone = !userHwid || userHwid === "HWID-NONE" || userHwid.startsWith("RESET-");
        if (isResetOrNone) {
          if (db) {
            await db.prepare("UPDATE users SET hwid = ? WHERE LOWER(username) = LOWER(?)").bind(hwid, user.username).run();
          }
        } else if (userHwid.toUpperCase() !== hwid.toUpperCase() && userHwid !== "LOCAL-FULL-ACCESS" && user.role !== "ADMIN") {
          return jsonResponse({ success: false, error: "Несовпадение HWID. Сбросьте привязку HWID в профиле на сайте." }, 403);
        }
      }

      return jsonResponse({
        success: true,
        username: user.username,
        role: user.role,
        subtill: user.subtill,
        version,
        message: "Авторизация лоадера успешна",
      });
    }

    if (path === "/ajax/loader/payload" && method === "POST") {
      const token = params.token || body.token;
      const hwid = (params.hwid || body.hwid || "").trim();
      const version = params.version || body.version || "1.21.11";
      const username = (params.username || body.username || "").trim();

      let user = null;
      if (token && token !== "dustgames_admin_token") {
        user = await getUserByToken(token);
      }

      if (!user && (username.toLowerCase() === "dustgames" || token === "dustgames_admin_token" || token === "DustGames" || (!token && !username))) {
        if (db) {
          user = await db.prepare("SELECT * FROM users WHERE LOWER(username) = LOWER(?)").bind("DustGames").first();
        }
        if (!user) {
          user = {
            id: 1,
            username: "DustGames",
            email: "nikiforova280987@gmail.com",
            role: "ADMIN",
            banned: 0,
            hwid: "LOCAL-FULL-ACCESS",
            subtill: "31.12.2099",
            isEmailVerified: 1,
          };
        }
      }

      if (!user && !token) {
        return jsonResponse({ success: false, error: "Требуется токен авторизации." }, 401);
      }
      if (!user) {
        return jsonResponse({ success: false, error: "Сессия не найдена." }, 401);
      }

      if (user.banned) {
        return jsonResponse({ success: false, error: "Аккаунт заблокирован." }, 403);
      }

      if (user.role !== "ADMIN" && !isSubscriptionActive(user.subtill)) {
        return jsonResponse({ success: false, error: "Подписка не активна." }, 403);
      }

      if (hwid) {
        const userHwid = (user.hwid || "").trim();
        const isResetOrNone = !userHwid || userHwid === "HWID-NONE" || userHwid.startsWith("RESET-");
        if (isResetOrNone) {
          if (db) {
            await db.prepare("UPDATE users SET hwid = ? WHERE LOWER(username) = LOWER(?)").bind(hwid, user.username).run();
          }
        } else if (userHwid.toUpperCase() !== hwid.toUpperCase() && userHwid !== "LOCAL-FULL-ACCESS" && user.role !== "ADMIN") {
          return jsonResponse({ success: false, error: "Привязка HWID не совпадает." }, 403);
        }
      }

      let payloadRow = null;
      if (db) {
        try {
          payloadRow = await db.prepare("SELECT * FROM payloads WHERE version = ?").bind(version).first();
        } catch {}
      }

      if (version === "1.21.11") {
        const payloadUrl = (payloadRow && (payloadRow.entry_class === "JAR_URL" || payloadRow.payload_data.startsWith("http")))
          ? payloadRow.payload_data
          : "https://github.com/DustGames0-1111/ezxofkdsflgsd/releases/download/v1.0.0/mods.zip";

        return jsonResponse({
          success: true,
          version: "1.21.11",
          entryClass: "ru.exclusive.client.Main",
          url: payloadUrl,
          isUrl: true,
          updatedAt: payloadRow ? payloadRow.updated_at : new Date().toISOString(),
        });
      }

      if (!payloadRow) {
        return jsonResponse({
          success: false,
          error: `Байткод чита для версии ${version} еще не загружен на сервер Cloudflare.`,
        }, 404);
      }

      if (payloadRow.entry_class === "JAR_URL" || payloadRow.payload_data.startsWith("http")) {
        return jsonResponse({
          success: true,
          version: payloadRow.version,
          entryClass: "ru.exclusive.client.Main",
          url: payloadRow.payload_data,
          isUrl: true,
          updatedAt: payloadRow.updated_at,
        });
      }

      return jsonResponse({
        success: true,
        version: payloadRow.version,
        entryClass: payloadRow.entry_class,
        payload: payloadRow.payload_data,
        updatedAt: payloadRow.updated_at,
      });
    }

    if (path === "/ajax/loader/gameZip" || path === "/ajax/loader/downloadGameZip" || path.endsWith("/loader/gameZip") || path.endsWith("/loader/downloadGameZip")) {
      const version = params.version || body.version || "1.21.11";
      const DEFAULT_GAME_ZIP_URL = "https://github.com/DustGames0-1111/ezxofkdsflgsd/releases/download/v1.0.0/game.zip";
      let row = null;
      if (db) {
        try {
          row = await db.prepare("SELECT * FROM payloads WHERE version = ?").bind(`${version}_game_zip`).first();
        } catch {}
      }
      if (!row) {
        if (version === "1.21.11") {
          return jsonResponse({
            success: true,
            version: "1.21.11_game_zip",
            url: DEFAULT_GAME_ZIP_URL,
            isUrl: true,
            updatedAt: new Date().toISOString(),
          });
        }
        return jsonResponse({ success: false, error: `Архив game.zip для версии ${version} еще не загружен на сервер.` }, 404);
      }
      if (row.entry_class === "GAME_ZIP_URL") {
        return jsonResponse({
          success: true,
          version: row.version,
          url: row.payload_data,
          isUrl: true,
          updatedAt: row.updated_at,
        });
      }
      return jsonResponse({
        success: true,
        version: row.version,
        payload: row.payload_data,
        isUrl: false,
        updatedAt: row.updated_at,
      });
    }

    // ==================== ADMIN & DASHBOARD ====================
    if (path.startsWith("/ajax/admin/") || path.startsWith("/ajax/friends/")) {
      const token = params.token || body.token;
      const user = await getUserByToken(token);

      // getBanks is public in panel
      if (!user && path.endsWith("/finances/getBanks")) {
        return jsonResponse([
          { enumName: "TINKOFF", displayName: "Тинькофф Банк (Т-Банк)" },
          { enumName: "SBERBANK", displayName: "Сбербанк" },
          { enumName: "ALFABANK", displayName: "Альфа-Банк" },
        ]);
      }

      if (!user) {
        return textResponse("Unauthorized", 401);
      }

      // session check
      if (path.endsWith("/states/isSessionInitialized")) {
        return textResponse("true");
      }

      // users list & search (paginated, 9 users per page)
      if (path.endsWith("/users/getAll") || path.endsWith("/users/search")) {
        const q = (params.query || "").toLowerCase().trim();
        const page = Math.max(0, parseInt(params.page || body.page || "0", 10));
        const pageSize = 9;

        let allRows = [];
        if (db) {
          try {
            const { results } = await db.prepare("SELECT * FROM users ORDER BY id DESC").all();
            for (const u of results) {
              if (q && !u.username.toLowerCase().includes(q) && !(u.email || "").toLowerCase().includes(q)) {
                continue;
              }
              allRows.push({
                uid: u.id,
                user: u.username,
                email: u.email,
                group: u.role,
                banned: Boolean(u.banned),
                hwid: u.hwid,
                subtill: u.subtill,
              });
            }
          } catch {}
        }

        const totalPages = Math.max(1, Math.ceil(allRows.length / pageSize));
        const pagedContent = allRows.slice(page * pageSize, (page + 1) * pageSize);

        return jsonResponse({
          content: pagedContent,
          total: totalPages,
        });
      }

      if (path.endsWith("/users/getByIdentifier")) {
        const uid = parseInt(params.id || body.id || "1", 10);
        let u = null;
        if (db) {
          u = await db.prepare("SELECT * FROM users WHERE id = ?").bind(uid).first();
        }
        if (u) {
          return jsonResponse({
            id: u.id,
            uid: u.id,
            banned: Boolean(u.banned),
            email: u.email,
            group: u.role,
            hwid: u.hwid,
            subtill: u.subtill,
            user: u.username,
          });
        }
        return jsonResponse({
          id: 1,
          uid: 1,
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
          if ("uid" in body || "newUid" in body || "id" in body || params.uid || params.newUid) {
            const rawUid = body.newUid || body.uid || body.id || params.newUid || params.uid;
            const newId = parseInt(rawUid, 10);
            if (!isNaN(newId) && newId > 0) {
              const targetUser = await db.prepare("SELECT * FROM users WHERE LOWER(username) = LOWER(?)").bind(uname).first();
              if (targetUser && targetUser.id !== newId) {
                const existing = await db.prepare("SELECT * FROM users WHERE id = ?").bind(newId).first();
                if (existing) {
                  const maxRow = await db.prepare("SELECT MAX(id) as maxId FROM users").first();
                  const tempId = ((maxRow && maxRow.maxId) ? maxRow.maxId : 1000) + 1;
                  await db.prepare("UPDATE users SET id = ? WHERE id = ?").bind(tempId, existing.id).run();
                }
                await db.prepare("UPDATE users SET id = ? WHERE LOWER(username) = LOWER(?)").bind(newId, uname).run();
              }
            }
          }
        }
        return textResponse("User updated");
      }

      if ((path.endsWith("/users/changeUid") || path.endsWith("/users/setUid")) && (method === "POST" || method === "PATCH")) {
        const uname = params.user || params.username || body.username || body.user;
        const rawUid = params.uid || params.newUid || body.uid || body.newUid || body.id;
        const newId = parseInt(rawUid, 10);
        if (!uname || isNaN(newId) || newId <= 0) {
          return textResponse("Укажите имя пользователя и корректный UID (число > 0)", 400);
        }
        if (db) {
          const targetUser = await db.prepare("SELECT * FROM users WHERE LOWER(username) = LOWER(?)").bind(uname).first();
          if (!targetUser) {
            return textResponse("Пользователь не найден", 404);
          }
          if (targetUser.id !== newId) {
            const existing = await db.prepare("SELECT * FROM users WHERE id = ?").bind(newId).first();
            if (existing) {
              const maxRow = await db.prepare("SELECT MAX(id) as maxId FROM users").first();
              const tempId = ((maxRow && maxRow.maxId) ? maxRow.maxId : 1000) + 1;
              await db.prepare("UPDATE users SET id = ? WHERE id = ?").bind(tempId, existing.id).run();
            }
            await db.prepare("UPDATE users SET id = ? WHERE LOWER(username) = LOWER(?)").bind(newId, uname).run();
          }
        }
        return jsonResponse({ success: true, message: `UID пользователя ${uname} успешно изменен на #${newId}` });
      }

      if (path.endsWith("/resetHardwareId")) {
        const uname = params.user || body.username;
        if (db && uname) {
          const newHwid = "RESET-" + generateToken().slice(0, 8).toUpperCase();
          await db.prepare("UPDATE users SET hwid = ? WHERE LOWER(username) = LOWER(?)").bind(newHwid, uname).run();
        }
        return textResponse("HWID reset");
      }

      // ==================== ADMIN SETTINGS ENDPOINTS ====================
      if (path.endsWith("/settings/get") || path.endsWith("/settings/getAll")) {
        let downloadEnabled = true;
        let downloadUrl = "/downloads/ExclusiveDLC.exe";
        if (db) {
          try {
            const row1 = await db.prepare("SELECT value FROM site_settings WHERE key = 'loader_download_enabled'").first();
            if (row1 && row1.value === "false") downloadEnabled = false;
            const row2 = await db.prepare("SELECT value FROM site_settings WHERE key = 'loader_download_url'").first();
            if (row2 && row2.value) downloadUrl = row2.value;
          } catch {}
        }
        return jsonResponse({
          loader_download_enabled: downloadEnabled,
          loader_download_url: downloadUrl,
        });
      }

      if ((path.endsWith("/settings/set") || path.endsWith("/settings/update") || path.endsWith("/settings/toggleDownload")) && (method === "POST" || method === "PATCH")) {
        if (db) {
          try {
            if ("loader_download_enabled" in body || "enabled" in body || "loader_download_enabled" in params || "enabled" in params) {
              const val = body.loader_download_enabled !== undefined ? body.loader_download_enabled : (body.enabled !== undefined ? body.enabled : (params.loader_download_enabled || params.enabled));
              const isEnabled = (val === "true" || val === "1" || val === true || val === 1);
              await db.prepare("INSERT INTO site_settings (key, value) VALUES ('loader_download_enabled', ?) ON CONFLICT(key) DO UPDATE SET value = ?")
                .bind(isEnabled ? "true" : "false", isEnabled ? "true" : "false").run();
            }
            if ("loader_download_url" in body || "url" in body || "loader_download_url" in params) {
              const urlVal = (body.loader_download_url || body.url || params.loader_download_url || "").trim();
              if (urlVal) {
                await db.prepare("INSERT INTO site_settings (key, value) VALUES ('loader_download_url', ?) ON CONFLICT(key) DO UPDATE SET value = ?")
                  .bind(urlVal, urlVal).run();
              }
            }
          } catch {}
        }
        return jsonResponse({ success: true, message: "Настройки успешно сохранены!" });
      }

      // Keys endpoints
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
        const count = Math.min(Math.max(parseInt(params.count || body.count || "1", 10), 1), 50);
        const days = params.days || body.days || "";
        let display = "Custom";
        if (path.endsWith("/subscription")) display = days ? `${days} days` : "30 days";
        else if (path.endsWith("/hardwareReset")) display = "Hardware Reset";
        else if (path.endsWith("/beta")) display = "BETA";
        else if (path.endsWith("/additionalProduct")) {
          const prodId = params.productId || body.productId;
          display = (prodId == "102") ? "BETA 1.21.11 + LifeTime" : "BETA 1.21.11";
        }

        const createdKeys = [];
        for (let i = 0; i < count; i++) {
          const k = "EXCLUSIVE-" + generateToken().slice(0, 16).toUpperCase();
          createdKeys.push(k);
          if (db) {
            try {
              await db.prepare("INSERT INTO keys (key, display, generatedBy) VALUES (?, ?, 'DustGames')").bind(k, display).run();
            } catch {}
          }
        }
        return textResponse(createdKeys.join("\n"));
      }

      // Promocodes endpoints
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

      if (path.endsWith("/promocodes/get")) {
        const name = (params.promocode || body.promocode || "").trim().toUpperCase();
        let row = null;
        if (db && name) {
          try {
            row = await db.prepare("SELECT * FROM promocodes WHERE UPPER(name) = ?").bind(name).first();
          } catch {}
        }
        if (!row) {
          row = { name, discount: 0, activations: 0, maxActivations: 0, bet: 0, maxUsages: 0 };
        }
        return jsonResponse(row);
      }

      if (path.endsWith("/promocodes/create")) {
        const name = (params.promocode || body.promocode || "PROMO").trim().toUpperCase();
        const bet = parseInt(params.bet || body.bet || "10", 10);
        const max_u = parseInt(params.maxUsages || body.maxUsages || "100", 10);
        if (db && name) {
          try {
            await db.prepare(
              "INSERT INTO promocodes (name, discount, activations, maxActivations, bet, maxUsages) VALUES (?, ?, 0, ?, ?, ?) ON CONFLICT(name) DO UPDATE SET discount = ?, maxActivations = ?, bet = ?, maxUsages = ?"
            ).bind(name, bet, max_u, bet, max_u, bet, max_u, bet, max_u).run();
          } catch {
            await db.prepare(
              "INSERT OR REPLACE INTO promocodes (name, discount, activations, maxActivations, bet, maxUsages) VALUES (?, ?, 0, ?, ?, ?)"
            ).bind(name, bet, max_u, bet, max_u).run();
          }
        }
        return textResponse("Promocode created");
      }

      if (path.endsWith("/promocodes/patch")) {
        const name = (params.promocode || body.promocode || "").trim().toUpperCase();
        if (db && name) {
          const bet = parseInt(params.bet || body.bet || "10", 10);
          const max_u = parseInt(params.maxUsages || body.maxUsages || "100", 10);
          await db.prepare(
            "UPDATE promocodes SET discount = ?, bet = ?, maxActivations = ?, maxUsages = ? WHERE UPPER(name) = ?"
          ).bind(bet, bet, max_u, max_u, name).run();
        }
        return textResponse("Promocode updated");
      }

      if (path.endsWith("/promocodes/delete")) {
        const name = (params.promocode || body.promocode || "").trim().toUpperCase();
        if (db && name) {
          await db.prepare("DELETE FROM promocodes WHERE UPPER(name) = ?").bind(name).run();
          try {
            await db.prepare("DELETE FROM promocode_usages WHERE UPPER(promocode) = ?").bind(name).run();
          } catch {}
        }
        return textResponse("Promocode deleted");
      }

      if (path.endsWith("/promocodes/resetUsages")) {
        const name = (params.promocode || body.promocode || "").trim().toUpperCase();
        if (db && name) {
          await db.prepare("UPDATE promocodes SET activations = 0 WHERE UPPER(name) = ?").bind(name).run();
          try {
            await db.prepare("DELETE FROM promocode_usages WHERE UPPER(promocode) = ?").bind(name).run();
          } catch {}
        }
        return textResponse("Usages reset");
      }

      if (path.endsWith("/promocodes/statistic/get")) {
        return jsonResponse({ payments: [], total: 0 });
      }

      if (path.endsWith("/promocodes/statistic/clearPayments")) {
        return textResponse("Statistics cleared");
      }

      if (path.endsWith("/autoload/getVersions")) {
        return jsonResponse({
          "1.21.11": { display: "1.21.11 BETA", identify: "1.21.11" },
        });
      }

      if (path.endsWith("/autoload/uploadVersion") && method === "POST") {
        const version = (params.version || body.version || "1.21.11").trim();
        const jarFile = body.jar || params.jar;
        const zipFile = body.zip || body.file || params.zip || params.file;
        const zipUrl = (params.zipUrl || body.zipUrl || params.url || body.url || "").trim();
        const isGameZip = (body.type === "game_zip" || params.type === "game_zip" || Boolean(zipUrl) || (zipFile && !jarFile) || (zipFile && String(zipFile.name || "").endsWith(".zip")));

        if (isGameZip) {
          if (zipUrl) {
            if (db) {
              await db.prepare(
                "INSERT OR REPLACE INTO payloads (version, payload_data, entry_class, updated_at) VALUES (?, ?, 'GAME_ZIP_URL', CURRENT_TIMESTAMP)"
              ).bind(`${version}_game_zip`, zipUrl).run();
            }
            return textResponse(`Прямая ссылка на game.zip (${version}) успешно сохранена!`);
          }

          const targetFile = zipFile || jarFile;
          let payloadB64 = await fileOrBufferToBase64(targetFile);
          if (!payloadB64) {
            payloadB64 = (params.payload || body.payload || params.payload_data || body.payload_data || "").trim();
          }

          if (!payloadB64) {
            return textResponse("Ошибка: Файл game.zip не был получен.", 400);
          }

          if (db) {
            try {
              await db.prepare(
                "INSERT OR REPLACE INTO payloads (version, payload_data, entry_class, updated_at) VALUES (?, ?, 'GAME_ZIP_ARCHIVE', CURRENT_TIMESTAMP)"
              ).bind(`${version}_game_zip`, payloadB64).run();
            } catch (err) {
              return textResponse(`Ошибка базы Cloudflare: размер файла превышает лимит SQL (${Math.round(payloadB64.length / 1024 / 1024)} MB). Рекомендуется указать прямую ссылку на скачивание game.zip через поле Direct URL.`, 400);
            }
          }

          return textResponse(`Архив игры game.zip (${version}) успешно сохранен на сервере! (${Math.round(payloadB64.length * 0.75 / 1024)} KB)`);
        }

        const jarUrl = (params.jarUrl || body.jarUrl || (!isGameZip && (body.url || params.url)) || "").trim();
        if (jarUrl) {
          if (db) {
            await db.prepare(
              "INSERT OR REPLACE INTO payloads (version, payload_data, entry_class, updated_at) VALUES (?, ?, 'JAR_URL', CURRENT_TIMESTAMP)"
            ).bind(version, jarUrl).run();
          }
          return textResponse(`Прямая ссылка на мод .jar (${version}) успешно сохранена!`);
        }

        // Mod JAR upload
        let payloadB64 = await fileOrBufferToBase64(jarFile);
        if (!payloadB64) {
          payloadB64 = (params.payload || body.payload || params.payload_data || body.payload_data || "").trim();
        }

        if (!payloadB64) {
          return textResponse("Ошибка: Файл .jar не был получен.", 400);
        }

        if (db) {
          await db.prepare(
            "INSERT OR REPLACE INTO payloads (version, payload_data, entry_class, updated_at) VALUES (?, ?, 'ru.exclusive.client.Main', CURRENT_TIMESTAMP)"
          ).bind(version, payloadB64).run();
        }

        return textResponse(`Мод для версии ${version} успешно загружен на сервер! (${Math.round(payloadB64.length * 0.75 / 1024)} KB)`);
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

      if (path.endsWith("/loader/uploadPayload") && method === "POST") {
        const version = (params.version || body.version || "1.21.11").trim();
        const entryClass = (params.entry_class || params.entryClass || body.entry_class || body.entryClass || "ru.exclusive.client.Main").trim();
        const payloadData = (params.payload || body.payload || params.payload_data || body.payload_data || "").trim();

        if (!payloadData) {
          return jsonResponse({ success: false, error: "Отсутствуют данные payload (base64)." }, 400);
        }

        if (db) {
          await db.prepare(
            "INSERT OR REPLACE INTO payloads (version, payload_data, entry_class, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)"
          ).bind(version, payloadData, entryClass).run();
        }

        return jsonResponse({
          success: true,
          message: `Payload для версии ${version} успешно сохранен на сервере Cloudflare.`,
          version,
          entryClass,
          bytesLength: payloadData.length,
        });
      }

      if (path.endsWith("/loader/listPayloads")) {
        let list = [];
        if (db) {
          try {
            const { results } = await db.prepare("SELECT version, entry_class, LENGTH(payload_data) as size, updated_at FROM payloads ORDER BY updated_at DESC").all();
            list = results;
          } catch {}
        }
        return jsonResponse(list);
      }

      if (path.endsWith("/loader/deletePayload") && method === "POST") {
        const version = (params.version || body.version || "").trim();
        if (db && version) {
          await db.prepare("DELETE FROM payloads WHERE version = ?").bind(version).run();
        }
        return jsonResponse({ success: true, message: `Payload версии ${version} удален.` });
      }

      return jsonResponse({ ok: true });
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return jsonResponse({ ok: true, authStatus: true });
  },
};
