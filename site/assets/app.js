/**
 * Exclusive Client - Complete High Performance Frontend Engine
 * Exact match to reference screenshots with smooth animations and authentic Exclusive branding
 */

(function () {
  'use strict';

  // State Management
  const state = {
    user: null,
    token: localStorage.getItem('exclusive_token') || localStorage.getItem('kodex_token') || '',
    currentRoute: 'home',
    lang: 'ru',
    authMode: 'signin', // 'signin' or 'signup'
    cabinetTab: 'account', // 'account' or 'admin'
    adminSubTab: 'overview', // 'overview', 'users', 'keys', 'promocodes', 'settings'
    adminData: {
      users: [],
      usersPage: 0,
      usersTotalPages: 1,
      usersSearch: '',
      keys: [],
      promocodes: {},
      settings: {
        loader_download_enabled: true,
        loader_download_url: '/downloads/exclusivelauncher.exe'
      },
      stats: {
        totalUsers: 0,
        activeSubs: 0,
        totalKeys: 0
      }
    }
  };

  // Translations
  const i18n = {
    ru: {
      navHome: 'Главная',
      navVisual: 'Визуал',
      navCosmetics: 'Косметика',
      navCloud: 'Облако',
      navPricing: 'Цены',
      navStore: 'Магазин',
      navLogin: 'Войти',
      navCabinet: 'Кабинет',
      tryFree: 'Купить подписку ↗',
      seeInAction: 'Посмотреть в деле',
      createAccount: 'Создать аккаунт ↗',
      downloadExclusive: 'Скачать Exclusive ↗', downloadKodex: 'Скачать Exclusive ↗',
      welcomeBack: 'Welcome back',
      createAccountTitle: 'Create your account',
      signIn: 'Sign in',
      signUp: 'Sign up',
      account: 'Account',
      launcher: 'LAUNCHER',
      accountData: 'ACCOUNT DATA',
      character: 'CHARACTER',
    },
    en: {
      navHome: 'Home',
      navVisual: 'Visuals',
      navCosmetics: 'Cosmetics',
      navCloud: 'Cloud',
      navPricing: 'Pricing',
      navStore: 'Store',
      navLogin: 'Sign in',
      navCabinet: 'Cabinet',
      tryFree: 'Try for free ↗',
      seeInAction: 'See in action',
      createAccount: 'Create account ↗',
      downloadExclusive: 'Download Exclusive ↗', downloadKodex: 'Download Exclusive ↗',
      welcomeBack: 'Welcome back',
      createAccountTitle: 'Create your account',
      signIn: 'Sign in',
      signUp: 'Sign up',
      account: 'Account',
      launcher: 'LAUNCHER',
      accountData: 'ACCOUNT DATA',
      character: 'CHARACTER',
    }
  };

  // DOM Elements
  let mainContainer;

  // Initialize App
  document.addEventListener('DOMContentLoaded', async () => {
    mainContainer = document.getElementById('root');
    await checkSession();
    initRouting();
    renderApp();
    setupScrollEffects();
  });

  // Backend Auth Session Check
  async function checkSession() {
    if (!state.token) return;
    try {
      const res = await fetch('/ajax/users/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: state.token }),
      });
      const data = await res.json();
      if (data && data.authStatus) {
        state.user = data;
      } else {
        localStorage.removeItem('exclusive_token'); localStorage.removeItem('kodex_token');
        state.token = '';
        state.user = null;
      }
    } catch (e) {
      console.warn('Session check warning:', e);
    }
  }

  // Routing Logic
  function initRouting() {
    function handlePath() {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();

      if (path === '/cabinet' || hash === '#cabinet') {
        state.currentRoute = state.user ? 'cabinet' : 'auth';
        state.cabinetTab = 'account';
        state.authMode = 'signin';
      } else if (path === '/admin' || path === '/dashboard' || hash === '#admin') {
        state.currentRoute = state.user ? 'cabinet' : 'auth';
        state.cabinetTab = 'admin';
        state.authMode = 'signin';
      } else if (path === '/sign-in' || path === '/signin' || hash === '#signin') {
        state.currentRoute = 'auth';
        state.authMode = 'signin';
      } else if (path === '/sign-up' || path === '/signup' || hash === '#signup') {
        state.currentRoute = 'auth';
        state.authMode = 'signup';
      } else {
        state.currentRoute = 'home';
      }
      renderApp();
    }

    window.addEventListener('popstate', handlePath);
    handlePath();
  }

  function navigate(route, pushState = true) {
    state.currentRoute = route;
    let url = '/';
    if (route === 'cabinet') {
      url = state.cabinetTab === 'admin' ? '/admin' : '/cabinet';
    } else if (route === 'admin') {
      state.currentRoute = 'cabinet';
      state.cabinetTab = 'admin';
      url = '/admin';
    } else if (route === 'auth') {
      url = state.authMode === 'signup' ? '/sign-up' : '/sign-in';
    }

    if (pushState && window.location.pathname !== url) {
      window.history.pushState({}, '', url);
    }
    renderApp();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Main Render Switcher
  function renderApp() {
    if (!mainContainer) return;

    if (state.currentRoute === 'auth') {
      mainContainer.innerHTML = renderAuthScreen();
      attachAuthEvents();
    } else if (state.currentRoute === 'cabinet') {
      if (!state.user) {
        navigate('auth');
        return;
      }
      mainContainer.innerHTML = renderCabinetScreen();
      attachCabinetEvents();
      if (state.cabinetTab === 'account') {
        init3DCharacter();
      } else {
        attachAdminEvents();
        loadAdminData();
      }
    } else {
      mainContainer.innerHTML = renderHomeScreen();
      attachHomeEvents();
      initSmoothScroll();
      initScrollSpy();
      initRevealElements();
    }
  }

  // ==========================================================================
  // Home Screen Template (Screenshots 1 - 10)
  // ==========================================================================
  function renderHomeScreen() {
    const isLogged = !!state.user;
    const userInitial = isLogged ? (state.user.username || 'U')[0].toUpperCase() : 'U';

    return `
      <!-- Floating Navigation Pill (Exact match to Screenshot 1 & 2) -->
      <header class="site-header" id="siteHeader">
        <div class="header-container">
          <div class="header-left">
            <a href="/" class="header-logo-link" onclick="event.preventDefault(); window.scrollTo({top: 0, behavior: 'smooth'});">
              <img src="/assets/logo.png" alt="Exclusive" class="header-logo-img" />
              <span class="header-logo-text">Exclusive</span>
            </a>
          </div>

          <nav class="header-nav-pill">
            <a href="#hero" class="nav-item active" data-target="hero">Главная</a>
            <a href="#visuals" class="nav-item" data-target="visuals">Визуал</a>
            <a href="#showcase" class="nav-item" data-target="showcase">Косметика</a>
            <a href="#cloud" class="nav-item" data-target="cloud">Облако</a>
            <a href="#pricing" class="nav-item" data-target="pricing">Цены</a>
          </nav>

          <div class="header-right">
            ${
              isLogged
                ? `<button class="user-nav-pill" id="toCabinetBtn">
                    <span class="user-nav-avatar">${userInitial}</span>
                    <span>${state.user.username}</span>
                   </button>`
                : `<button class="login-nav-btn" id="openAuthBtn">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                    <span>Войти</span>
                   </button>`
            }
          </div>
        </div>
      </header>

      <!-- Hero Section (Screenshot 1) -->
      <section class="hero-section" id="hero">
        <div class="hero-bg-container">
          <img src="/assets/morning-CcRdvl8L.png" alt="Minecraft Landscape" class="hero-bg-img" />
          <div class="hero-bg-overlay"></div>
        </div>

        <div class="hero-content reveal active">
          <h1 class="hero-title">
            Вспомогательный<br />
            клиент Minecraft<br />
            нового поколения
          </h1>
          <p class="hero-subtitle">
            Умная KillAura, Velocity, TargetESP и модули помощи в PvP. Кастомизация HUD, плащи, крылья и 3D-скины. Один клиент, максимальное преимущество — и ничего лишнего.
          </p>
          <div class="hero-actions">
            <a href="#pricing" class="btn-black-pill" id="heroCtaPricing">
              <span>Купить подписку</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
            </a>
            <a href="#showcase" class="btn-glass-pill">
              <span>Посмотреть в деле</span>
            </a>
          </div>
        </div>
      </section>

      <!-- Section 2: Visuals (Screenshot 2) -->
      <section class="section-visuals" id="visuals">
        <div class="visuals-grid-container">
          <div class="feature-cards-grid reveal">
            <!-- Card 01 -->
            <div class="feature-card">
              <img src="/assets/night-3-Ba3J82nB.jpg" class="feature-card-bg" alt="/01" />
              <div class="feature-card-gradient"></div>
              <div class="feature-card-header">
                <span class="feature-card-num">/ 01</span>
                <div class="feature-card-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
                </div>
              </div>
              <div class="feature-card-content">
                <h3 class="feature-card-title">Настраивается всё</h3>
                <p class="feature-card-desc">Каждый модуль открывается в своей панели — цвета, режимы, прозрачность, кривые анимации, клавиши. Любое...</p>
              </div>
            </div>

            <!-- Card 02 -->
            <div class="feature-card">
              <img src="/assets/morning-3-Djoe_UWf.jpg" class="feature-card-bg" alt="/02" />
              <div class="feature-card-gradient"></div>
              <div class="feature-card-header">
                <span class="feature-card-num">/ 02</span>
                <div class="feature-card-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                </div>
              </div>
              <div class="feature-card-content">
                <h3 class="feature-card-title">HUD, который ты собираешь сам</h3>
                <p class="feature-card-desc">Пятнадцать перетаскиваемых элементов — вотермарка, зелья, кейбинды, таргет-HUD, миникарта, скорборд, медиаплее...</p>
              </div>
            </div>

            <!-- Card 03 -->
            <div class="feature-card">
              <img src="/assets/morning-4-BFeRX6yn.jpg" class="feature-card-bg" alt="/03" />
              <div class="feature-card-gradient"></div>
              <div class="feature-card-header">
                <span class="feature-card-num">/ 03</span>
                <div class="feature-card-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                </div>
              </div>
              <div class="feature-card-content">
                <h3 class="feature-card-title">Настоящие шейдеры, а не оверлеи</h3>
                <p class="feature-card-desc">Следы от руки, подсветка блоков, круги от прыжка и шейдерные плащи — это полноценные GLSL-программы на...</p>
              </div>
            </div>

            <!-- Card 04 -->
            <div class="feature-card">
              <img src="/assets/day-4-mV0FtEqT.jpg" class="feature-card-bg" alt="/04" />
              <div class="feature-card-gradient"></div>
              <div class="feature-card-header">
                <span class="feature-card-num">/ 04</span>
                <div class="feature-card-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                </div>
              </div>
              <div class="feature-card-content">
                <h3 class="feature-card-title">Друзья внутри клиента</h3>
                <p class="feature-card-desc">Добавляй друзей, смотри, кто онлайн, заходи к ним на сервер одним нажатием и делись конфигом прямо из клиента. Б...</p>
              </div>
            </div>
          </div>

          <div class="visuals-right-panel reveal">
            <span class="section-tag">боевое преимущество</span>
            <h2 class="section-big-title">играй<br /><em>с преимуществом</em></h2>
            <p class="section-desc">
              Продвинутая KillAura, идеальный Velocity, TargetESP и надёжные модули помощи в бою. Exclusive даёт тебе абсолютный контроль над схваткой и отдаёт все настройки.
            </p>
            <div class="separator-line"></div>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">КОСМЕТИЧЕСКИХ ПРЕДМЕТОВ</span>
                <span class="stat-value">535</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">МОДУЛЕЙ И ФУНКЦИЙ</span>
                <span class="stat-value">32+</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">ВЫПУЩЕНО СБОРОК</span>
                <span class="stat-value">529</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">ДНЕЙ В РАЗРАБОТКЕ</span>
                <span class="stat-value">137</span>
              </div>
            </div>
            <button class="btn-white-pill" id="statsCreateAccountBtn">
              <span>Создать аккаунт</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
            </button>
          </div>
        </div>
      </section>

      <!-- Section 3: Client in Action / Cosmetics (Screenshot 3) -->
      <section class="section-showcase" id="showcase">
        <div class="showcase-header reveal">
          <span class="section-tag">КЛИЕНТ В ДЕЛЕ</span>
          <h2 class="section-big-title">Это не макет.<br /><em>Это сам клиент.</em></h2>
        </div>

        <div class="client-mockup-window reveal">
          <img src="/assets/primer.jpg" class="client-photo-img" alt="Exclusive Client in Action" />
        </div>

        <div class="mockup-pills-row reveal">
          <div class="mockup-pill-item">Одно меню, все модули</div>
          <div class="mockup-pill-item">Перетаскиваемый HUD</div>
          <div class="mockup-pill-item">Живые пресеты</div>
          <div class="mockup-pill-item">Minecraft 1.21.4</div>
        </div>
      </section>

      <!-- Section 4: Cloud Settings (Screenshot 4) -->
      <section class="section-cloud" id="cloud">
        <div class="cloud-grid-container">
          <div class="reveal">
            <span class="section-tag">ОБЛАКО</span>
            <h2 class="section-big-title">Твои настройки<br /><em>всегда с тобой.</em></h2>
            <p class="section-desc">
              Косметика, конфиги и друзья живут в аккаунте, а не на одном компьютере. Зайди на новом ПК — и клиент вернётся ровно таким, каким ты его оставил: ничего копировать и экспортировать не нужно.
            </p>
            <button class="btn-white-pill" id="cloudCreateAccountBtn">
              <span>Создать аккаунт</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
            </button>
          </div>

          <div class="cloud-checklist-card reveal">
            <div class="cloud-check-row">
              <span>Надетая косметика</span>
              <span class="cloud-status-badge">синхронизировано</span>
            </div>
            <div class="cloud-check-row">
              <span>Конфиги модулей</span>
              <span class="cloud-status-badge">синхронизировано</span>
            </div>
            <div class="cloud-check-row">
              <span>Расположение HUD</span>
              <span class="cloud-status-badge">синхронизировано</span>
            </div>
            <div class="cloud-check-row">
              <span>Список друзей</span>
              <span class="cloud-status-badge">синхронизировано</span>
            </div>
            <div class="cloud-check-row">
              <span>Темы и пресеты</span>
              <span class="cloud-status-badge">синхронизировано</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Section 5: Pricing (Screenshot 5 & 6) -->
      <section class="section-pricing" id="pricing">
        <div class="reveal">
          <span class="section-tag">ЦЕНЫ</span>
          <h2 class="section-big-title">Покупка, о которой<br /><em>ты не пожалеешь.</em></h2>
          <p class="section-desc">
            Выбери подходящий тариф. Никаких скрытых списаний — моментальная активация сразу после оплаты.
          </p>
        </div>

        <div class="pricing-cards-grid">
          <!-- 30 Days Card (199 RUB) -->
          <div class="pricing-card reveal">
            <div class="pricing-card-badge">30 ДНЕЙ</div>
            <h3 class="pricing-plan-title">30 дней</h3>
            <p class="pricing-plan-subtitle">Полный доступ к клиенту на 30 дней</p>
            <div class="pricing-price-box">
              <span class="pricing-price-main">199 ₽</span>
            </div>
            <p class="pricing-price-note">за 30 дней</p>

            <span class="pricing-features-tag">В ТАРИФ ВХОДИТ</span>
            <ul class="pricing-features-list">
              <li class="pricing-feature-item">
                <span class="pricing-feature-check">✓</span>
                <span>Все боевые и вспомогательные модули</span>
              </li>
              <li class="pricing-feature-item">
                <span class="pricing-feature-check">✓</span>
                <span>Полный редактор HUD и темы</span>
              </li>
              <li class="pricing-feature-item">
                <span class="pricing-feature-check">✓</span>
                <span>Стартовая и базовая косметика</span>
              </li>
              <li class="pricing-feature-item">
                <span class="pricing-feature-check">✓</span>
                <span>Поддержка сообщества</span>
              </li>
              <li class="pricing-feature-item">
                <span class="pricing-feature-check">✓</span>
                <span>Облачные конфиги</span>
              </li>
            </ul>

            <a href="https://t.me/blydota4ka" target="_blank" class="btn-card-secondary">Купить</a>
          </div>

          <!-- 90 Days Card (399 RUB) -->
          <div class="pricing-card featured reveal">
            <div class="pricing-card-badge">ПОПУЛЯРНОЕ</div>
            <h3 class="pricing-plan-title">90 дней</h3>
            <p class="pricing-plan-subtitle">Вся библиотека — на три месяца</p>
            <div class="pricing-price-box">
              <span class="pricing-price-main">399 ₽</span>
              <span class="pricing-price-old">599 ₽</span>
            </div>
            <p class="pricing-price-note">за 90 дней (дешевле за месяц)</p>

            <span class="pricing-features-tag">ВСЁ ИЗ 30 ДНЕЙ, ПЛЮС</span>
            <ul class="pricing-features-list">
              <li class="pricing-feature-item">
                <span class="pricing-feature-check">✓</span>
                <span>Все 535 косметических предметов</span>
              </li>
              <li class="pricing-feature-item">
                <span class="pricing-feature-check">✓</span>
                <span>Анимированные и шейдерные плащи</span>
              </li>
              <li class="pricing-feature-item">
                <span class="pricing-feature-check">✓</span>
                <span>Облачная синхронизация между устройствами</span>
              </li>
              <li class="pricing-feature-item">
                <span class="pricing-feature-check">✓</span>
                <span>Друзья и обмен конфигами</span>
              </li>
              <li class="pricing-feature-item">
                <span class="pricing-feature-check">✓</span>
                <span>Приоритетные обновления</span>
              </li>
              <li class="pricing-feature-item">
                <span class="pricing-feature-check">✓</span>
                <span>128 скинов мечей и 29 тотемов</span>
              </li>
            </ul>

            <a href="https://t.me/blydota4ka" target="_blank" class="btn-card-primary">Купить</a>
          </div>

          <!-- Lifetime Card (499 RUB) -->
          <div class="pricing-card reveal">
            <div class="pricing-card-badge">ВЫГОДНЕЕ ВСЕГО</div>
            <h3 class="pricing-plan-title">Навсегда</h3>
            <p class="pricing-plan-subtitle">Пожизненный безлимитный доступ ко всем возможностям</p>
            <div class="pricing-price-box">
              <span class="pricing-price-main">499 ₽</span>
              <span class="pricing-price-old">999 ₽</span>
            </div>
            <p class="pricing-price-note">один раз и навсегда</p>

            <span class="pricing-features-tag">ВСЁ ИЗ 90 ДНЕЙ, ПЛЮС</span>
            <ul class="pricing-features-list">
              <li class="pricing-feature-item">
                <span class="pricing-feature-check">✓</span>
                <span>Пожизненная подписка без продлений</span>
              </li>
              <li class="pricing-feature-item">
                <span class="pricing-feature-check">✓</span>
                <span>Все будущие обновления и новые модули</span>
              </li>
              <li class="pricing-feature-item">
                <span class="pricing-feature-check">✓</span>
                <span>Ранний доступ к новой косметике</span>
              </li>
              <li class="pricing-feature-item">
                <span class="pricing-feature-check">✓</span>
                <span>Сборки бета-канала</span>
              </li>
              <li class="pricing-feature-item">
                <span class="pricing-feature-check">✓</span>
                <span>Приоритетная VIP поддержка</span>
              </li>
              <li class="pricing-feature-item">
                <span class="pricing-feature-check">✓</span>
                <span>Эксклюзивные плащи и скины</span>
              </li>
            </ul>

            <a href="https://t.me/blydota4ka" target="_blank" class="btn-card-secondary">Купить</a>
          </div>
        </div>

        <p class="pricing-footnote reveal">
          Один платёж за выбранный период — без автопродления и повторных списаний без твоего действия. Цены указаны в рублях (₽), итоговая сумма видна до подтверждения. Подробности — у <a href="https://t.me/blydota4ka" target="_blank">поддержки</a>.
        </p>
      </section>

      <!-- Section 6: Swords and Totems / Mace (Screenshot 6) -->
      <section class="section-swords">
        <div class="swords-card reveal">
          <div class="swords-left">
            <span class="section-tag">ТОЛЬКО С ПОДПИСКОЙ</span>
            <h3 class="swords-title">Скины мечей и булав (Mace).</h3>
            <p class="swords-desc">
              128 пиксельных скинов мечей из лучших SkyBlock-паков и 29 булав и тотемов — классические, анимированные и 3D. Видны в руке, в хотбаре и в анимации удара. Обе вкладки появляются в клиенте сразу, как только активна подписка.
            </p>
            <div class="swords-tags-row">
              <span class="swords-tag-pill">128 мечей</span>
              <span class="swords-tag-pill">Булавы и тотемы</span>
              <span class="swords-tag-pill">Анимированные текстуры</span>
              <span class="swords-tag-pill">Свой скин в руке</span>
            </div>
          </div>

          <div class="swords-right-wrap">
            <div class="swords-filter-tabs">
              <button class="swords-filter-btn active" data-filter="all">Микс (14)</button>
              <button class="swords-filter-btn" data-filter="swords">Мечи (20)</button>
              <button class="swords-filter-btn" data-filter="maces">Булавы (14)</button>
            </div>
            <div class="swords-items-grid" id="swordsItemsGrid">
              ${renderPixelItemsGrid('all')}
            </div>
          </div>
        </div>
      </section>

      <!-- Section 7: Basic Features (Screenshot 7) -->
      <section class="section-basic">
        <div class="basic-card reveal">
          <div class="basic-left">
            <span class="section-tag">В КАЖДОМ ТАРИФЕ</span>
            <h3 class="basic-title">Базовые вещи никогда не прячутся за платной стеной.</h3>
          </div>
          <div class="basic-pills-wrap">
            <span class="basic-pill">Вход с привязкой к устройству</span>
            <span class="basic-pill">Мгновенная активация</span>
            <span class="basic-pill">Синхронизация между устройствами</span>
            <span class="basic-pill">Автообновления</span>
            <span class="basic-pill">Баг-репорты из клиента</span>
          </div>
        </div>
      </section>

      <!-- Section 8: 9-Feature Table Grid (Screenshot 8 & 9) -->
      <section class="section-features-grid">
        <div class="reveal">
          <span class="section-tag">ИЗ КОРОБКИ</span>
          <h2 class="section-big-title">Работает сразу<br /><em>после запуска.</em></h2>
          <p class="section-desc">
            Здесь больше, чем помещается на одну страницу. Это то, чем ты будешь пользоваться с первого дня.
          </p>
        </div>

        <div class="features-table-grid reveal">
          <!-- 1. Косметика -->
          <div class="feature-table-cell">
            <div class="cell-icon-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>
              </svg>
            </div>
            <h4 class="cell-title">Косметика</h4>
            <p class="cell-desc">Плащи, крылья, шляпы, рюкзаки, 3D-скины, стили ника, скины оружия, а с подпиской — скины мечей и тотемов. Всё с предпросмотром до того, как наденешь.</p>
          </div>

          <!-- 2. Миникарта -->
          <div class="feature-table-cell">
            <div class="cell-icon-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
                <line x1="8" y1="2" x2="8" y2="18"/>
                <line x1="16" y1="6" x2="16" y2="22"/>
              </svg>
            </div>
            <h4 class="cell-title">Миникарта</h4>
            <p class="cell-desc">Вращающаяся миникарта с игроками, мобами, предметами, вейпоинтами, биомом и координатами. Вместо точек — лица игроков, если захочешь.</p>
          </div>

          <!-- 3. Анимации рук -->
          <div class="feature-table-cell">
            <div class="cell-icon-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/>
                <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/>
                <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/>
                <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.83L7 15"/>
              </svg>
            </div>
            <h4 class="cell-title">Анимации рук</h4>
            <p class="cell-desc">Анимации удара и удержания переписаны с нуля: своя поза для каждого предмета и камера от первого лица, которая следует за движением.</p>
          </div>

          <!-- 4. Свой прицел -->
          <div class="feature-table-cell">
            <div class="cell-icon-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="22" y1="12" x2="18" y2="12"/>
                <line x1="6" y1="12" x2="2" y2="12"/>
                <line x1="12" y1="6" x2="12" y2="2"/>
                <line x1="12" y1="22" x2="12" y2="18"/>
              </svg>
            </div>
            <h4 class="cell-title">Свой прицел</h4>
            <p class="cell-desc">Собери прицел из форм, отступов, обводок и цветов — с живым превью, которое меняется прямо под ползунком.</p>
          </div>

          <!-- 5. Медиаплеер -->
          <div class="feature-table-cell">
            <div class="cell-icon-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 18V5l12-2v13"/>
                <circle cx="6" cy="18" r="3"/>
                <circle cx="18" cy="16" r="3"/>
              </svg>
            </div>
            <h4 class="cell-title">Медиаплеер</h4>
            <p class="cell-desc">Управляй тем, что уже играет на компьютере: обложка, название трека и медиа-клавиши прямо в HUD.</p>
          </div>

          <!-- 6. Трекер хранилищ -->
          <div class="feature-table-cell">
            <div class="cell-icon-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
            </div>
            <h4 class="cell-title">Трекер хранилищ</h4>
            <p class="cell-desc">Каждый открытый сундук запоминается по измерениям, ищется по предмету и подсвечивается в мире, когда он тебе нужен.</p>
          </div>

          <!-- 7. Темы -->
          <div class="feature-table-cell">
            <div class="cell-icon-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 2a10 10 0 0 1 0 20z" fill="#ffffff"/>
              </svg>
            </div>
            <h4 class="cell-title">Темы</h4>
            <p class="cell-desc">Тёмная, светлая и неоновая из коробки, плюс токены плотности, скругления и анимации — весь интерфейс меняется разом.</p>
          </div>

          <!-- 8. HUD производительности -->
          <div class="feature-table-cell">
            <div class="cell-icon-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <h4 class="cell-title">HUD производительности</h4>
            <p class="cell-desc">FPS, процессор и память прямо из работающего клиента, с цветовой шкалой — просадку видно сразу.</p>
          </div>

          <!-- 9. Баг-репорты -->
          <div class="feature-table-cell">
            <div class="cell-icon-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="8" y="9" width="8" height="10" rx="4"/>
                <line x1="6" y1="4" x2="8" y2="6"/>
                <line x1="18" y1="4" x2="16" y2="6"/>
                <line x1="12" y1="9" x2="12" y2="19"/>
                <line x1="2" y1="11" x2="8" y2="11"/>
                <line x1="16" y1="11" x2="22" y2="11"/>
                <line x1="2" y1="16" x2="8" y2="16"/>
                <line x1="16" y1="16" x2="22" y2="16"/>
              </svg>
            </div>
            <h4 class="cell-title">Баг-репорты</h4>
            <p class="cell-desc">Одна команда — и клиент отправляет нам лог, диагностику и состояние клиента. Никаких скриншотов краш-лога.</p>
          </div>
        </div>
      </section>

      <!-- Section 9: Cream CTA Banner (Screenshot 9) -->
      <section class="section-cta">
        <div class="cta-banner-card reveal">
          <h2 class="cta-banner-title">Готов выглядеть лучше?</h2>
          <p class="cta-banner-subtitle">
            Выбери подходящий тариф от 199 ₽ — моментальная активация, доступ ко всей библиотеке косметики и без лишней возни.
          </p>
          <a href="#pricing" class="btn-black-pill" id="ctaPricingBtn">
            <span>Купить Exclusive</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
          </a>
        </div>
      </section>

      <!-- Section 10: Footer (Screenshot 10) -->
      <footer class="site-footer">
        <div class="footer-inner">
          <div class="footer-top-grid">
            <div class="footer-brand">
              <img src="/assets/logo.png" alt="Exclusive" class="footer-brand-logo" />
              <p class="footer-brand-tagline">Играй с самым красивым клиентом.</p>
            </div>

            <div>
              <h5 class="footer-col-title">ПРОДУКТ</h5>
              <ul class="footer-links-list">
                <li><a href="#pricing" class="footer-link">Цены</a></li>
                <li><a href="/downloads/exclusivelauncher.exe" class="footer-link">Скачать</a></li>
                <li><a href="#showcase" class="footer-link">Косметика</a></li>
              </ul>
            </div>

            <div>
              <h5 class="footer-col-title">ПОДДЕРЖКА</h5>
              <ul class="footer-links-list">
                <li><a href="https://t.me/blydota4ka" target="_blank" class="footer-link">Написать в поддержку</a></li>
                <li><a href="/cabinet" class="footer-link" onclick="event.preventDefault(); window.navigate('cabinet');">Твой аккаунт</a></li>
                <li><a href="#cloud" class="footer-link">Облачная синхронизация</a></li>
                <li><a href="#pricing" class="footer-link">Что входит</a></li>
              </ul>
            </div>

            <div>
              <h5 class="footer-col-title">ПРАВОВОЕ</h5>
              <ul class="footer-links-list">
                <li><a href="/termsofservice" class="footer-link">Условия использования</a></li>
                <li><a href="/privacypolicy" class="footer-link">Конфиденциальность</a></li>
                <li><a href="#pricing" class="footer-link">Оплата и тарифы</a></li>
              </ul>
            </div>
          </div>

          <div class="footer-bottom-row">
            <span>© 2026 Exclusive</span>
            <span>Не связано с Mojang и Microsoft</span>
          </div>
        </div>
      </footer>
    `;
  }

  // Real pixel-art items from /assets/sword/ and /assets/mace/
  const swordsData = [
    { file: '/assets/sword/katana.png', name: 'Катана' },
    { file: '/assets/sword/ruby.png', name: 'Рубиновый клинок' },
    { file: '/assets/sword/frost.png', name: 'Ледяной меч' },
    { file: '/assets/sword/flame.png', name: 'Пламенный меч' },
    { file: '/assets/sword/shadow.png', name: 'Теневой клинок' },
    { file: '/assets/sword/emerald.png', name: 'Изумрудный меч' },
    { file: '/assets/sword/goldbroad.png', name: 'Золотой палаш' },
    { file: '/assets/sword/cleaver.png', name: 'Мясницкий тесак' },
    { file: '/assets/sword/rapier.png', name: 'Рапира' },
    { file: '/assets/sword/sabre.png', name: 'Сабля' },
    { file: '/assets/sword/bone.png', name: 'Костяной меч' },
    { file: '/assets/sword/celestial.png', name: 'Небесный меч' },
    { file: '/assets/sword/laser.png', name: 'Лазерный меч' },
    { file: '/assets/sword/serrated.png', name: 'Зазубренный меч' },
    { file: '/assets/sword/obsidian.png', name: 'Обсидиановый меч' },
    { file: '/assets/sword/amethyst.png', name: 'Аметистовый меч' },
    { file: '/assets/sword/neon.png', name: 'Неоновый меч' },
    { file: '/assets/sword/greatsword.png', name: 'Двуручник' },
    { file: '/assets/sword/starry.png', name: 'Звёздный меч' },
    { file: '/assets/sword/runic.png', name: 'Рунический меч' }
  ];

  const macesData = [
    { file: '/assets/mace/spiked.png', name: 'Шипастый шар' },
    { file: '/assets/mace/warhammer.png', name: 'Боевой молот' },
    { file: '/assets/mace/flanged.png', name: 'Шестопёр' },
    { file: '/assets/mace/morningstar.png', name: 'Утренняя звезда' },
    { file: '/assets/mace/crystal.png', name: 'Хрустальная булава' },
    { file: '/assets/mace/lavahammer.png', name: 'Огненный молот' },
    { file: '/assets/mace/ice.png', name: 'Ледяная булава' },
    { file: '/assets/mace/skull.png', name: 'Черепная булава' },
    { file: '/assets/mace/scepter.png', name: 'Золотой скипетр' },
    { file: '/assets/mace/pumpkin.png', name: 'Тыквенная булава' },
    { file: '/assets/mace/thunder.png', name: 'Громовая булава' },
    { file: '/assets/mace/amethyst.png', name: 'Аметистовая булава' },
    { file: '/assets/mace/breeze.png', name: 'Ветряная булава' },
    { file: '/assets/mace/sledge.png', name: 'Кувалда' }
  ];

  // Alternating mix (exactly 14 items: 7 swords & 7 maces matching the screenshot layout)
  const defaultMix = [
    swordsData[0],  // Катана
    macesData[0],   // Шипастый шар
    swordsData[1],  // Рубиновый клинок
    macesData[4],   // Хрустальная булава
    swordsData[5],  // Изумрудный меч
    macesData[5],   // Огненный молот
    swordsData[11], // Небесный меч
    macesData[6],   // Ледяная булава
    swordsData[2],  // Ледяной меч
    macesData[7],   // Черепная булава
    swordsData[3],  // Пламенный меч
    macesData[3],   // Утренняя звезда
    swordsData[4],  // Теневой клинок
    macesData[10]   // Громовая булава
  ];

  function renderPixelItemsGrid(filter = 'all') {
    let items = defaultMix;
    if (filter === 'swords') items = swordsData;
    else if (filter === 'maces') items = macesData;

    return items.map(item => `
      <div class="pixel-item-box" data-name="${item.name}" title="${item.name}">
        <img src="${item.file}" alt="${item.name}" class="pixel-item-img" loading="lazy" />
      </div>
    `).join('');
  }

  // ==========================================================================
  // Auth Screen Template (Screenshots 11 & 12)
  // ==========================================================================
  function renderAuthScreen() {
    const isSignup = state.authMode === 'signup';

    return `
      <div class="auth-page-view">
        <div class="auth-bg-container">
          <img src="/assets/morning-CcRdvl8L.png" alt="Minecraft Background" class="auth-bg-img" />
        </div>

        <button class="auth-back-btn" id="authBackBtn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          <span>Назад на сайт</span>
        </button>

        <div class="auth-card">
          <img src="/assets/logo.png" alt="Exclusive" class="auth-card-logo" />
          <span class="auth-card-tag">АККАУНТ</span>
          <h2 class="auth-card-title">${isSignup ? 'Создать аккаунт' : 'С возвращением'}</h2>
          <p class="auth-card-desc">
            ${isSignup 
              ? 'Единый аккаунт для конфигураций, настроек и привязки вашего клиента.' 
              : 'Войдите в аккаунт для доступа к клиенту, настройкам и подписке.'}
          </p>

          <div class="auth-toggle-pill">
            <button class="auth-toggle-btn ${!isSignup ? 'active' : ''}" id="toggleSignIn">Вход</button>
            <button class="auth-toggle-btn ${isSignup ? 'active' : ''}" id="toggleSignUp">Регистрация</button>
          </div>

          <div class="auth-error-msg" id="authErrorMsg"></div>

          <form class="auth-form" id="authForm">
            ${isSignup ? `
              <div class="auth-field-group">
                <label class="auth-field-label">Логин</label>
                <input type="text" name="username" class="auth-input" placeholder="логин (3-20 символов)" required autocomplete="username" />
              </div>
              <div class="auth-field-group">
                <label class="auth-field-label">Email (необязательно)</label>
                <input type="email" name="email" class="auth-input" placeholder="you@example.com" autocomplete="email" />
              </div>
              <div class="auth-field-group">
                <label class="auth-field-label">Пароль</label>
                <input type="password" name="password" class="auth-input" placeholder="не менее 6 символов" required autocomplete="new-password" />
              </div>
              <button type="submit" class="auth-submit-btn" id="authSubmitBtn">Создать аккаунт</button>
            ` : `
              <div class="auth-field-group">
                <label class="auth-field-label">Логин или Email</label>
                <input type="text" name="username" class="auth-input" placeholder="логин или email" required autocomplete="username" />
              </div>
              <div class="auth-field-group">
                <label class="auth-field-label">Пароль</label>
                <input type="password" name="password" class="auth-input" placeholder="не менее 6 символов" required autocomplete="current-password" />
              </div>
              <button type="submit" class="auth-submit-btn" id="authSubmitBtn">Войти</button>
            `}
          </form>

          <p class="auth-card-footer-note">
            Ваш аккаунт привязывается к оборудованию при первом запуске клиента.
          </p>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // Cabinet Screen Template (Screenshots 13 & 14)
  // ==========================================================================
  function renderCabinetScreen() {
    const user = state.user || {
      username: 'User',
      email: 'user@example.com',
      uid: 10001,
      role: 'User',
      regdate: '13.10.2026, 00:28',
      plan: 'Free',
      hwid: '—'
    };

    const initial = (user.username || 'U')[0].toUpperCase();
    const planText = user.role === 'ADMIN' ? 'Админ (Навсегда)' : (user.subtill && user.subtill !== 'None' ? (user.subtill === '31.12.2099' ? 'Навсегда' : `Подписка (${user.subtill})`) : 'Без подписки');
    const roleText = user.role === 'ADMIN' ? 'Администратор' : (user.role === 'BETA' ? 'Beta-тестер' : 'Пользователь');

    return `
      <div class="cabinet-page-view">
        <!-- Sidebar -->
        <aside class="cabinet-sidebar">
          <div class="cabinet-brand-row">
            <img src="/assets/logo.png" alt="Exclusive" class="cabinet-brand-logo" />
            <span class="cabinet-brand-name">Exclusive</span>
          </div>

          <ul class="cabinet-menu-list">
            <li class="cabinet-menu-item ${state.cabinetTab === 'account' ? 'active' : ''}" id="tabBtnAccount">
              <div class="cabinet-menu-item-left">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                <span>Аккаунт</span>
              </div>
            </li>
            <li class="cabinet-menu-item ${state.cabinetTab === 'admin' ? 'active' : ''}" id="tabBtnAdmin">
              <div class="cabinet-menu-item-left">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                <span>Админ-панель</span>
              </div>
            </li>
          </ul>

          <div class="cabinet-sidebar-bottom">
            <div class="cabinet-user-badge">
              <div class="cabinet-user-avatar">${initial}</div>
              <span class="cabinet-user-name">${user.username}</span>
            </div>
            <button class="cabinet-logout-btn" id="cabinetLogoutBtn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              <span>Выйти</span>
            </button>
          </div>
        </aside>

        <!-- Main Body -->
        <main class="cabinet-main-body ${state.cabinetTab === 'admin' ? 'cabinet-admin-view' : ''}">
          ${state.cabinetTab === 'admin' ? renderAdminPanel(user) : `
            <div class="cabinet-content-col">
              <div>
                <h1 class="cabinet-header-title">Личный кабинет</h1>
                <p class="cabinet-header-subtitle">Управление настройками аккаунта</p>
              </div>

              <div class="cabinet-user-header">
                <div class="cabinet-big-avatar">${initial}</div>
                <div class="cabinet-user-details">
                  <h3>${user.username}</h3>
                  <p>${user.email || 'Email не привязан'}</p>
                </div>
              </div>

              <!-- Launcher Card (Screenshot 13 & 14) -->
              <div>
                <div class="cabinet-section-label">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
                  <span>ЛАУНЧЕР</span>
                </div>
                <div class="launcher-card">
                  <div class="launcher-card-left">
                    <div class="launcher-icon-box">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    </div>
                    <div class="launcher-info">
                      <h4 class="launcher-info-title">Exclusive Launcher</h4>
                      <p class="launcher-info-sub">Windows 10 / 11 · 64-bit</p>
                      <div class="launcher-badges-row">
                        <span class="launcher-badge">v1.1.41.0</span>
                        <span class="launcher-badge">74.5 МБ</span>
                        <span class="launcher-badge">сборка 12.10.2026</span>
                      </div>
                    </div>
                  </div>
                  <button class="btn-launcher-download" id="downloadLauncherBtn" style="display:inline-flex; align-items:center; gap:8px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0c0c0e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    <span>Скачать</span>
                  </button>
                </div>
                <p class="launcher-subtext">Войдите в лаунчер, используя логин и пароль от этого аккаунта.</p>
              </div>

              <!-- Account Data Table (Screenshot 13 & 14) -->
              <div>
                <div class="cabinet-section-label">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                  <span>ДАННЫЕ АККАУНТА</span>
                </div>
                <div class="account-data-list">
                  <div class="account-data-row">
                    <span class="account-data-label">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                      <span>UID</span>
                    </span>
                    <span class="account-data-val">${user.uid || user.id || '20018'}</span>
                  </div>
                  <div class="account-data-row">
                    <span class="account-data-label">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="2 4 5 20 19 20 22 4 16 10 12 4 8 10 2 4"></polygon></svg>
                      <span>Роль</span>
                    </span>
                    <span class="account-data-val">${roleText}</span>
                  </div>
                  <div class="account-data-row">
                    <span class="account-data-label">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><circle cx="12" cy="12" r="4"></circle><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"></path></svg>
                      <span>Логин</span>
                    </span>
                    <span class="account-data-val">${user.username}</span>
                  </div>
                  <div class="account-data-row">
                    <span class="account-data-label">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                      <span>Email</span>
                    </span>
                    <span class="account-data-val">${user.email || '—'}</span>
                  </div>
                  <div class="account-data-row">
                    <span class="account-data-label">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                      <span>Регистрация</span>
                    </span>
                    <span class="account-data-val">${user.regdate || '13.10.2026, 00:28'}</span>
                  </div>
                  <div class="account-data-row">
                    <span class="account-data-label">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                      <span>Тариф</span>
                    </span>
                    <div class="account-data-val">
                      <span>${planText}</span>
                      <button class="btn-plan-upgrade" onclick="window.open('https://t.me/blydota4ka', '_blank')">Продлить</button>
                    </div>
                  </div>
                  <div class="account-data-row">
                    <span class="account-data-label">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="15" x2="23" y2="15"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="15" x2="4" y2="15"></line></svg>
                      <span>HWID</span>
                    </span>
                    <span class="account-data-val">${user.hwid || '—'}</span>
                  </div>
                </div>
              </div>

              <!-- Action Pills Row -->
              <div class="cabinet-actions-row">
                <button class="btn-cabinet-pill" id="btnChangeAvatar">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                  <span>Сменить аватар</span>
                </button>
                <button class="btn-cabinet-pill" id="btnEditEmail">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  <span>Изменить email</span>
                </button>
                <button class="btn-cabinet-pill" id="btnChangePass">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  <span>Сменить пароль</span>
                </button>
                <button class="btn-cabinet-pill" id="btnCopyHwid">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                  <span>Скопировать HWID</span>
                </button>
              </div>
            </div>

            <!-- Character Viewport Card (Screenshot 13 & 14) -->
            <div class="character-viewport-card">
              <div class="character-card-label">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                <span>ПЕРСОНАЖ</span>
              </div>
              <div class="character-3d-stage" id="characterStage">
                <canvas id="steveCanvas" width="280" height="360"></canvas>
              </div>
              <div class="character-card-foot">
                <h4>Запустите игру, чтобы привязать персонажа</h4>
                <p>Вращайте мышью — крутится автоматически</p>
                <p style="margin-top:8px; color:#52525b">3D-модель Стива</p>
              </div>
            </div>
          `}
        </main>
      </div>
    `;
  }

  // ==========================================================================
  // Admin Panel Template (Redesigned in Personal Cabinet Style)
  // ==========================================================================
  function renderAdminPanel(user) {
    return `
      <div class="admin-panel-container">
        <!-- Admin Header -->
        <div class="admin-header-row">
          <div>
            <h1 class="cabinet-header-title">Админ-панель</h1>
            <p class="cabinet-header-subtitle">Управление сервером, пользователями, ключами активации и промокодами</p>
          </div>
          <div class="admin-subnav-pills">
            <button class="admin-subnav-btn ${state.adminSubTab === 'overview' ? 'active' : ''}" data-subtab="overview">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              <span>Обзор</span>
            </button>
            <button class="admin-subnav-btn ${state.adminSubTab === 'users' ? 'active' : ''}" data-subtab="users">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              <span>Пользователи</span>
            </button>
            <button class="admin-subnav-btn ${state.adminSubTab === 'keys' ? 'active' : ''}" data-subtab="keys">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-2-2l2 2m0 0l-7 7m0 0l-3-3-4 4 3 3-2 2-2-2-2 2 4 4 7-7"></path></svg>
              <span>Ключи</span>
            </button>
            <button class="admin-subnav-btn ${state.adminSubTab === 'promocodes' ? 'active' : ''}" data-subtab="promocodes">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path></svg>
              <span>Промокоды</span>
            </button>
            <button class="admin-subnav-btn ${state.adminSubTab === 'settings' ? 'active' : ''}" data-subtab="settings">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
              <span>Настройки</span>
            </button>
          </div>
        </div>

        <!-- Metric Stat Cards -->
        <div class="admin-stats-grid">
          <div class="admin-stat-card">
            <div class="admin-stat-header">
              <span class="admin-stat-title">ПОЛЬЗОВАТЕЛИ</span>
              <div class="admin-stat-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
              </div>
            </div>
            <div class="admin-stat-val" id="statUsersCount">${state.adminData.stats.totalUsers || state.adminData.users.length || '—'}</div>
            <div class="admin-stat-sub">Аккаунтов в базе данных</div>
          </div>

          <div class="admin-stat-card">
            <div class="admin-stat-header">
              <span class="admin-stat-title">АКТИВНЫЕ КЛЮЧИ</span>
              <div class="admin-stat-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><path d="M21 2l-2 2m-2-2l2 2m0 0l-7 7m0 0l-3-3-4 4 3 3-2 2-2-2-2 2 4 4 7-7"></path></svg>
              </div>
            </div>
            <div class="admin-stat-val" id="statKeysCount">${state.adminData.keys.length || '0'}</div>
            <div class="admin-stat-sub">Готовы к активации</div>
          </div>

          <div class="admin-stat-card">
            <div class="admin-stat-header">
              <span class="admin-stat-title">ПРОМОКОДЫ</span>
              <div class="admin-stat-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path></svg>
              </div>
            </div>
            <div class="admin-stat-val" id="statPromosCount">${Object.keys(state.adminData.promocodes).length || '0'}</div>
            <div class="admin-stat-sub">Созданные промокоды</div>
          </div>

          <div class="admin-stat-card">
            <div class="admin-stat-header">
              <span class="admin-stat-title">ЗАГРУЗКА ЛАУНЧЕРА</span>
              <div class="admin-stat-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              </div>
            </div>
            <div class="admin-stat-val" id="statDownloadState" style="color: ${state.adminData.settings.loader_download_enabled ? '#4ade80' : '#f87171'}">
              ${state.adminData.settings.loader_download_enabled ? 'ДОСТУПНА' : 'ОТКЛЮЧЕНА'}
            </div>
            <div class="admin-stat-sub">${state.adminData.settings.loader_download_enabled ? 'Скачивание открыто' : 'Скачивание отключено'}</div>
          </div>
        </div>

        <!-- Users Management Section -->
        <div class="admin-section-card" id="adminUsersSection" style="${state.adminSubTab !== 'overview' && state.adminSubTab !== 'users' ? 'display:none;' : ''}">
          <div class="admin-card-head">
            <div class="cabinet-section-label">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
              <span>УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ</span>
            </div>
            <div class="admin-head-tools">
              <div class="admin-search-wrapper">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#71717a" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input type="text" id="adminUserSearchInput" class="admin-search-input" placeholder="Поиск по логину, email или UID..." value="${state.adminData.usersSearch}" />
              </div>
              <button class="btn-cabinet-pill" id="adminRefreshUsersBtn">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                <span>Обновить</span>
              </button>
            </div>
          </div>

          <div class="admin-users-table">
            <div class="admin-table-head-row">
              <span>ПОЛЬЗОВАТЕЛЬ</span>
              <span>UID</span>
              <span>РОЛЬ</span>
              <span>ПОДПИСКА</span>
              <span>HWID</span>
              <span style="text-align:right;">ДЕЙСТВИЯ</span>
            </div>
            <div id="adminUsersTableBody">
              ${renderAdminUsersRowsHTML()}
            </div>
          </div>

          <div class="admin-pagination-row">
            <span class="admin-page-info" id="adminPageInfo">Страница ${state.adminData.usersPage + 1} из ${state.adminData.usersTotalPages}</span>
            <div class="admin-page-btns">
              <button class="admin-page-btn" id="adminPrevPageBtn" ${state.adminData.usersPage <= 0 ? 'disabled' : ''}>← Назад</button>
              <button class="admin-page-btn" id="adminNextPageBtn" ${state.adminData.usersPage >= state.adminData.usersTotalPages - 1 ? 'disabled' : ''}>Вперед →</button>
            </div>
          </div>
        </div>

        <!-- Keys Generator & List Section -->
        <div class="admin-section-card" id="adminKeysSection" style="${state.adminSubTab !== 'overview' && state.adminSubTab !== 'keys' ? 'display:none;' : ''}">
          <div class="cabinet-section-label">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><path d="M21 2l-2 2m-2-2l2 2m0 0l-7 7m0 0l-3-3-4 4 3 3-2 2-2-2-2 2 4 4 7-7"></path></svg>
            <span>ГЕНЕРАТОР И СПИСОК КЛЮЧЕЙ</span>
          </div>
          <div class="admin-two-cols">
            <!-- Key Generator -->
            <div class="admin-subcard">
              <h4 class="admin-subcard-title">Генерация новых ключей</h4>
              <div class="admin-form-group">
                <label class="admin-field-label">Тип ключа</label>
                <select id="adminKeyTypeSelect" class="admin-select">
                  <option value="sub-30">Подписка (30 дней — 199 ₽)</option>
                  <option value="sub-90">Подписка (90 дней — 399 ₽)</option>
                  <option value="sub-lifetime">Навсегда (Lifetime — 499 ₽)</option>
                  <option value="hwid">Ключ сброса HWID</option>
                  <option value="beta">Ключ Beta-доступа</option>
                </select>
              </div>
              <div class="admin-form-group">
                <label class="admin-field-label">Количество (1 - 50)</label>
                <input type="number" id="adminKeyCountInput" class="admin-input" min="1" max="50" value="1" />
              </div>
              <button class="btn-launcher-download" id="adminGenerateKeysBtn" style="width:100%; justify-content:center; display:inline-flex; align-items:center; gap:8px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0c0c0e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                <span>Сгенерировать ключи</span>
              </button>

              <div id="adminGeneratedKeysBox" class="admin-output-box" style="display:none;">
                <div class="admin-output-head">
                  <span>Сгенерированные ключи:</span>
                  <button class="admin-copy-sm-btn" id="adminCopyGeneratedKeys">Копировать все</button>
                </div>
                <textarea id="adminGeneratedKeysText" class="admin-keys-textarea" readonly rows="4"></textarea>
              </div>
            </div>

            <!-- Active Keys -->
            <div class="admin-subcard">
              <div class="admin-output-head">
                <h4 class="admin-subcard-title" id="adminActiveKeysTitle" style="margin:0;">Активные ключи (${state.adminData.keys.length})</h4>
                <button class="btn-cabinet-pill" id="adminRefreshKeysBtn" style="padding:4px 10px; font-size:11px;">Обновить</button>
              </div>
              <div class="admin-keys-scroll-list" id="adminKeysListBody">
                ${renderAdminKeysListHTML()}
              </div>
            </div>
          </div>
        </div>

        <!-- Promocodes Management Section -->
        <div class="admin-section-card" id="adminPromosSection" style="${state.adminSubTab !== 'overview' && state.adminSubTab !== 'promocodes' ? 'display:none;' : ''}">
          <div class="cabinet-section-label">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path></svg>
            <span>УПРАВЛЕНИЕ ПРОМОКОДАМИ</span>
          </div>
          <div class="admin-two-cols">
            <div class="admin-subcard">
              <h4 class="admin-subcard-title">Создать промокод</h4>
              <div class="admin-form-group">
                <label class="admin-field-label">Название промокода</label>
                <input type="text" id="adminPromoNameInput" class="admin-input" placeholder="Например: EXCLUSIVE2026" />
              </div>
              <div class="admin-form-group">
                <label class="admin-field-label">Скидка %</label>
                <input type="number" id="adminPromoBetInput" class="admin-input" min="1" max="100" value="20" />
              </div>
              <div class="admin-form-group">
                <label class="admin-field-label">Лимит активаций</label>
                <input type="number" id="adminPromoMaxInput" class="admin-input" min="1" value="50" />
              </div>
              <button class="btn-launcher-download" id="adminCreatePromoBtn" style="width:100%; justify-content:center; display:inline-flex; align-items:center; gap:8px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0c0c0e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                <span>Создать промокод</span>
              </button>
            </div>

            <div class="admin-subcard">
              <div class="admin-output-head">
                <h4 class="admin-subcard-title" id="adminActivePromosTitle" style="margin:0;">Активные промокоды (${Object.keys(state.adminData.promocodes).length})</h4>
                <button class="btn-cabinet-pill" id="adminRefreshPromosBtn" style="padding:4px 10px; font-size:11px;">Обновить</button>
              </div>
              <div class="admin-promos-scroll-list" id="adminPromosListBody">
                ${renderAdminPromosListHTML()}
              </div>
            </div>
          </div>
        </div>

        <!-- Settings Section -->
        <div class="admin-section-card" id="adminSettingsSection" style="${state.adminSubTab !== 'overview' && state.adminSubTab !== 'settings' ? 'display:none;' : ''}">
          <div class="cabinet-section-label">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            <span>НАСТРОЙКИ СИСТЕМЫ И ЗАГРУЗКИ</span>
          </div>
          <div class="admin-subcard" style="max-width: 600px;">
            <div class="admin-setting-row">
              <div>
                <div class="admin-setting-title">Скачивание лаунчера</div>
                <div class="admin-setting-desc">Разрешить или приостановить загрузку лаунчера посетителями сайта</div>
              </div>
              <label class="admin-toggle-switch">
                <input type="checkbox" id="adminDownloadEnabledToggle" ${state.adminData.settings.loader_download_enabled ? 'checked' : ''} />
                <span class="admin-toggle-slider"></span>
              </label>
            </div>

            <div class="admin-form-group" style="margin-top:16px;">
              <label class="admin-field-label">Путь или URL-ссылка на файл лаунчера</label>
              <input type="text" id="adminDownloadUrlInput" class="admin-input" value="${state.adminData.settings.loader_download_url || '/downloads/exclusivelauncher.exe'}" />
            </div>

            <button class="btn-launcher-download" id="adminSaveSettingsBtn" style="margin-top:14px; width:fit-content; display:inline-flex; align-items:center; gap:8px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0c0c0e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
              <span>Сохранить настройки</span>
            </button>
            <div id="adminSettingsStatus" class="admin-status-msg" style="display:none;"></div>
          </div>
        </div>

        <!-- Edit User Modal -->
        <div class="admin-modal-overlay" id="adminEditUserModal" style="display:none;">
          <div class="admin-modal-card">
            <div class="admin-modal-head">
              <h3 class="admin-modal-title">Редактирование: <span id="modalTargetUser">User</span></h3>
              <button class="admin-modal-close" id="modalCloseBtn">✕</button>
            </div>
            <div class="admin-modal-body">
              <div class="admin-form-group">
                <label class="admin-field-label">UID (Уникальный номер)</label>
                <input type="number" id="modalUserUid" class="admin-input" min="0" />
              </div>
              <div class="admin-form-group">
                <label class="admin-field-label">Роль</label>
                <select id="modalUserRole" class="admin-select">
                  <option value="USER">USER (Пользователь)</option>
                  <option value="ADMIN">ADMIN (Администратор)</option>
                  <option value="BETA">BETA (Тестер)</option>
                </select>
              </div>
              <div class="admin-form-group">
                <label class="admin-field-label">Подписка действует до</label>
                <input type="text" id="modalUserSub" class="admin-input" placeholder="31.12.2099, None или ДД.ММ.ГГГГ" />
                <div class="admin-modal-presets">
                  <button type="button" class="admin-preset-btn" id="modalPresetLifetime">Навсегда</button>
                  <button type="button" class="admin-preset-btn" id="modalPreset30d">+30 дней</button>
                  <button type="button" class="admin-preset-btn" id="modalPresetNone">Без подписки</button>
                </div>
              </div>
              <div class="admin-form-group">
                <label class="admin-field-label">Email</label>
                <input type="email" id="modalUserEmail" class="admin-input" />
              </div>
              <div class="admin-setting-row" style="margin-top:8px;">
                <div>
                  <div class="admin-setting-title">Блокировка аккаунта</div>
                  <div class="admin-setting-desc">Заблокировать доступ пользователя к клиенту и сайту</div>
                </div>
                <label class="admin-toggle-switch">
                  <input type="checkbox" id="modalUserBanned" />
                  <span class="admin-toggle-slider"></span>
                </label>
              </div>
            </div>
            <div class="admin-modal-foot">
              <button class="btn-cabinet-pill" id="modalCancelBtn">Отмена</button>
              <button class="btn-launcher-download" id="modalSaveUserBtn">Сохранить изменения</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderAdminUsersRowsHTML() {
    const list = state.adminData.users;
    if (!list || list.length === 0) {
      return `<div style="padding:24px; text-align:center; color:#71717a;">Пользователи не найдены. Нажмите «Обновить» или сбросьте фильтр поиска.</div>`;
    }
    return list.map(u => {
      const initial = (u.user || 'U')[0].toUpperCase();
      const isBanned = Boolean(u.banned);
      const isDust = (u.user || '').toLowerCase() === 'dustgames';
      const role = u.group || 'USER';
      const roleClass = role === 'ADMIN' ? 'admin' : (role === 'BETA' ? 'beta' : 'user');
      const sub = u.subtill === '31.12.2099' ? 'Навсегда' : (u.subtill && u.subtill !== 'None' ? u.subtill : 'Без подписки');
      const hwidShort = u.hwid ? (u.hwid.length > 12 ? u.hwid.slice(0, 10) + '...' : u.hwid) : 'Нет';

      return `
        <div class="admin-user-row" data-username="${u.user}">
          <div class="admin-cell-user">
            <div class="admin-user-avatar-sm">${initial}</div>
            <div class="admin-user-info-text">
              <span class="admin-user-name">${u.user}</span>
              <span class="admin-user-email">${u.email || 'Email отсутствует'}</span>
            </div>
          </div>
          <div>
            <span class="admin-chip-uid">#${u.uid !== undefined ? u.uid : '—'}</span>
          </div>
          <div>
            <span class="admin-chip-role ${roleClass}">${role}</span>
            ${isBanned ? '<span class="admin-chip-banned" style="margin-left:4px;">ЗАБАНЕН</span>' : ''}
          </div>
          <div>
            <span class="admin-cell-sub">${sub}</span>
          </div>
          <div class="admin-cell-hwid">
            <span style="font-family:monospace; font-size:11px; color:#a1a1aa;" title="${u.hwid || ''}">${hwidShort}</span>
            <button class="admin-sm-btn primary admin-btn-reset-hwid" data-user="${u.user}" title="Сбросить HWID">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
            </button>
          </div>
          <div class="admin-cell-actions" style="justify-content:flex-end;">
            <button class="admin-sm-btn primary admin-btn-edit-user" data-user="${u.user}" data-uid="${u.uid}" data-role="${role}" data-sub="${u.subtill || ''}" data-email="${u.email || ''}" data-banned="${isBanned}">
              Изменить
            </button>
            ${!isDust ? `
              <button class="admin-sm-btn ${isBanned ? 'success' : 'danger'} admin-btn-ban-user" data-user="${u.user}" data-banned="${isBanned}">
                ${isBanned ? 'Разбанить' : 'Забанить'}
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  function renderAdminKeysListHTML() {
    const list = state.adminData.keys;
    if (!list || list.length === 0) {
      return `<div style="padding:16px; text-align:center; color:#71717a; font-size:12px;">Нет активных ключей. Сгенерируйте их выше.</div>`;
    }
    return list.map(k => {
      let displayRu = k.display || 'Подписка';
      if (k.type === 'sub-30' || displayRu.includes('30')) displayRu = 'Подписка (30 дней)';
      else if (k.type === 'sub-90' || displayRu.includes('90')) displayRu = 'Подписка (90 дней)';
      else if (k.type === 'sub-lifetime' || displayRu.toLowerCase().includes('lifetime')) displayRu = 'Навсегда (Lifetime)';
      else if (k.type === 'hwid' || displayRu.toLowerCase().includes('hwid')) displayRu = 'Сброс HWID';
      else if (k.type === 'beta' || displayRu.toLowerCase().includes('beta')) displayRu = 'Beta-доступ';

      return `
        <div class="admin-key-item">
          <div>
            <div class="admin-key-code">${k.key}</div>
            <div class="admin-key-meta">${displayRu} · Создал: ${k.generatedBy || 'Админ'}</div>
          </div>
          <div style="display:flex; gap:6px;">
            <button class="admin-copy-sm-btn admin-btn-copy-key" data-key="${k.key}">Копия</button>
            <button class="admin-sm-btn danger admin-btn-del-key" data-key="${k.key}" title="Удалить ключ">✕</button>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderAdminPromosListHTML() {
    const promos = state.adminData.promocodes;
    const entries = Object.entries(promos);
    if (!entries || entries.length === 0) {
      return `<div style="padding:16px; text-align:center; color:#71717a; font-size:12px;">Промокоды еще не созданы.</div>`;
    }
    return entries.map(([name, p]) => `
      <div class="admin-promo-item">
        <div>
          <div class="admin-key-code">${name}</div>
          <div class="admin-key-meta">Скидка ${p.bet || p.discount || 0}% · Использований: ${p.activations || 0} / ${p.maxUsages || p.maxActivations || '∞'}</div>
        </div>
        <button class="admin-sm-btn danger admin-btn-del-promo" data-promo="${name}" title="Удалить промокод">✕</button>
      </div>
    `).join('');
  }

  // ==========================================================================
  // Event Handlers & Interactions
  // ==========================================================================
  function attachHomeEvents() {
    const openAuthBtn = document.getElementById('openAuthBtn');
    if (openAuthBtn) {
      openAuthBtn.onclick = () => {
        state.authMode = 'signin';
        navigate('auth');
      };
    }

    const toCabinetBtn = document.getElementById('toCabinetBtn');
    if (toCabinetBtn) {
      toCabinetBtn.onclick = () => navigate('cabinet');
    }

    const heroCtaRegister = document.getElementById('heroCtaRegister');
    if (heroCtaRegister) {
      heroCtaRegister.onclick = () => {
        if (state.user) navigate('cabinet');
        else {
          state.authMode = 'signup';
          navigate('auth');
        }
      };
    }

    const statsCreateAccountBtn = document.getElementById('statsCreateAccountBtn');
    if (statsCreateAccountBtn) {
      statsCreateAccountBtn.onclick = () => {
        if (state.user) navigate('cabinet');
        else {
          state.authMode = 'signup';
          navigate('auth');
        }
      };
    }

    const cloudCreateAccountBtn = document.getElementById('cloudCreateAccountBtn');
    if (cloudCreateAccountBtn) {
      cloudCreateAccountBtn.onclick = () => {
        if (state.user) navigate('cabinet');
        else {
          state.authMode = 'signup';
          navigate('auth');
        }
      };
    }

    const pricingStartFree = document.getElementById('pricingStartFree');
    if (pricingStartFree) {
      pricingStartFree.onclick = () => {
        if (state.user) navigate('cabinet');
        else {
          state.authMode = 'signup';
          navigate('auth');
        }
      };
    }

    const ctaPricingBtn = document.getElementById('ctaPricingBtn');
    if (ctaPricingBtn) {
      ctaPricingBtn.onclick = (e) => {
        e.preventDefault();
        const pricingEl = document.getElementById('pricing');
        if (pricingEl) {
          manualScrollLock = true;
          clearTimeout(manualScrollTimer);

          const navItems = document.querySelectorAll('.header-nav-pill .nav-item[data-target]');
          navItems.forEach(i => {
            if (i.getAttribute('data-target') === 'pricing') i.classList.add('active');
            else i.classList.remove('active');
          });

          const offsetTop = Math.max(0, pricingEl.offsetTop - 85);
          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
          });

          manualScrollTimer = setTimeout(() => {
            manualScrollLock = false;
          }, 1200);
        }
      };
    }

    const filterBtns = document.querySelectorAll('.swords-filter-btn');
    const itemsGrid = document.getElementById('swordsItemsGrid');
    if (filterBtns.length && itemsGrid) {
      filterBtns.forEach(btn => {
        btn.onclick = () => {
          filterBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const filter = btn.getAttribute('data-filter') || 'all';
          itemsGrid.style.opacity = '0';
          setTimeout(() => {
            itemsGrid.innerHTML = renderPixelItemsGrid(filter);
            itemsGrid.style.opacity = '1';
          }, 150);
        };
      });
    }
  }

  function attachAuthEvents() {
    const authBackBtn = document.getElementById('authBackBtn');
    if (authBackBtn) {
      authBackBtn.onclick = () => navigate('home');
    }

    const toggleSignIn = document.getElementById('toggleSignIn');
    const toggleSignUp = document.getElementById('toggleSignUp');

    if (toggleSignIn) {
      toggleSignIn.onclick = () => {
        state.authMode = 'signin';
        renderApp();
      };
    }
    if (toggleSignUp) {
      toggleSignUp.onclick = () => {
        state.authMode = 'signup';
        renderApp();
      };
    }

    const authForm = document.getElementById('authForm');
    const authErrorMsg = document.getElementById('authErrorMsg');
    const authSubmitBtn = document.getElementById('authSubmitBtn');

    if (authForm) {
      authForm.onsubmit = async (e) => {
        e.preventDefault();
        authErrorMsg.style.display = 'none';
        authSubmitBtn.disabled = true;
        authSubmitBtn.innerText = 'Please wait...';

        const formData = new FormData(authForm);
        const endpoint = state.authMode === 'signup' 
          ? '/ajax/users/auth/register' 
          : '/ajax/users/auth/default';

        try {
          const res = await fetch(endpoint, {
            method: 'POST',
            body: formData,
          });

          const contentType = res.headers.get('content-type') || '';
          let data;
          if (contentType.includes('application/json')) {
            data = await res.json();
          } else {
            const text = await res.text();
            try { data = JSON.parse(text); } catch { data = { authMessage: text }; }
          }

          if (res.ok && (data.authStatus || data.token)) {
            state.token = data.token;
            localStorage.setItem('exclusive_token', data.token);
            await checkSession();
            navigate('cabinet');
          } else {
            authErrorMsg.innerText = data.authMessage || data.message || 'Authentication failed. Please check your credentials.';
            authErrorMsg.style.display = 'block';
            authSubmitBtn.disabled = false;
            authSubmitBtn.innerText = state.authMode === 'signup' ? 'Create account' : 'Sign in';
          }
        } catch (err) {
          authErrorMsg.innerText = 'Network error. Please try again.';
          authErrorMsg.style.display = 'block';
          authSubmitBtn.disabled = false;
          authSubmitBtn.innerText = state.authMode === 'signup' ? 'Create account' : 'Sign in';
        }
      };
    }
  }

  function attachCabinetEvents() {
    const tabBtnAccount = document.getElementById('tabBtnAccount');
    if (tabBtnAccount) {
      tabBtnAccount.onclick = () => {
        state.cabinetTab = 'account';
        navigate('cabinet');
      };
    }

    const tabBtnAdmin = document.getElementById('tabBtnAdmin');
    if (tabBtnAdmin) {
      tabBtnAdmin.onclick = () => {
        state.cabinetTab = 'admin';
        navigate('admin');
      };
    }

    const cabinetLogoutBtn = document.getElementById('cabinetLogoutBtn');
    if (cabinetLogoutBtn) {
      cabinetLogoutBtn.onclick = async () => {
        try {
          await fetch('/ajax/users/auth/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: state.token }),
          });
        } catch {}
        localStorage.removeItem('exclusive_token'); localStorage.removeItem('kodex_token');
        state.token = '';
        state.user = null;
        navigate('home');
      };
    }

    const downloadLauncherBtn = document.getElementById('downloadLauncherBtn');
    if (downloadLauncherBtn) {
      downloadLauncherBtn.onclick = () => {
        window.location.href = '/downloads/exclusivelauncher.exe';
      };
    }

    const btnCopyHwid = document.getElementById('btnCopyHwid');
    if (btnCopyHwid) {
      btnCopyHwid.onclick = () => {
        const hwid = (state.user && state.user.hwid) ? state.user.hwid : 'NONE';
        navigator.clipboard.writeText(hwid);
        btnCopyHwid.innerText = 'Скопировано!';
        setTimeout(() => {
          btnCopyHwid.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> <span>Скопировать HWID</span>';
        }, 2000);
      };
    }

    const btnChangePass = document.getElementById('btnChangePass');
    if (btnChangePass) {
      btnChangePass.onclick = () => {
        const newPass = prompt('Введите новый пароль (не менее 6 символов):');
        if (newPass && newPass.length >= 6) {
          fetch('/ajax/users/settings/password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: state.token, password: newPass }),
          }).then(() => alert('Пароль успешно обновлен!'));
        }
      };
    }

    const btnEditEmail = document.getElementById('btnEditEmail');
    if (btnEditEmail) {
      btnEditEmail.onclick = () => {
        const newEmail = prompt('Введите новый адрес email:');
        if (newEmail && newEmail.includes('@')) {
          fetch('/ajax/users/settings/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: state.token, email: newEmail }),
          }).then(() => {
            alert('Email успешно обновлен!');
            checkSession().then(renderApp);
          });
        }
      };
    }
  }

  // ==========================================================================
  // Admin Panel Event Handlers & API Operations
  // ==========================================================================
  function attachAdminEvents() {
    // Sub-navigation pills
    const subnavBtns = document.querySelectorAll('.admin-subnav-btn');
    subnavBtns.forEach(btn => {
      btn.onclick = () => {
        const sub = btn.getAttribute('data-subtab');
        state.adminSubTab = sub;
        subnavBtns.forEach(b => b.classList.toggle('active', b === btn));
        updateAdminSectionVisibility();
      };
    });

    // Users Search input (with debounce)
    const searchInput = document.getElementById('adminUserSearchInput');
    if (searchInput) {
      let searchTimer;
      searchInput.oninput = () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
          fetchAdminUsers(0, searchInput.value.trim()).then(renderAdminUsersRows);
        }, 300);
      };
    }

    // Refresh Users button
    const refreshUsersBtn = document.getElementById('adminRefreshUsersBtn');
    if (refreshUsersBtn) {
      refreshUsersBtn.onclick = () => {
        const query = searchInput ? searchInput.value.trim() : '';
        fetchAdminUsers(state.adminData.usersPage, query).then(renderAdminUsersRows);
      };
    }

    // Pagination
    const prevBtn = document.getElementById('adminPrevPageBtn');
    if (prevBtn) {
      prevBtn.onclick = () => {
        if (state.adminData.usersPage > 0) {
          fetchAdminUsers(state.adminData.usersPage - 1, state.adminData.usersSearch).then(renderAdminUsersRows);
        }
      };
    }

    const nextBtn = document.getElementById('adminNextPageBtn');
    if (nextBtn) {
      nextBtn.onclick = () => {
        if (state.adminData.usersPage < state.adminData.usersTotalPages - 1) {
          fetchAdminUsers(state.adminData.usersPage + 1, state.adminData.usersSearch).then(renderAdminUsersRows);
        }
      };
    }

    // Key Generator
    const genBtn = document.getElementById('adminGenerateKeysBtn');
    if (genBtn) {
      genBtn.onclick = async () => {
        const type = document.getElementById('adminKeyTypeSelect')?.value || 'sub-30';
        const count = parseInt(document.getElementById('adminKeyCountInput')?.value || '1', 10);
        genBtn.disabled = true;
        genBtn.innerHTML = '<span>Генерация...</span>';
        await generateAdminKeys(type, count);
        genBtn.disabled = false;
        genBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0c0c0e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg><span>Сгенерировать ключи</span>';
      };
    }

    // Copy Generated Keys
    const copyGenBtn = document.getElementById('adminCopyGeneratedKeys');
    if (copyGenBtn) {
      copyGenBtn.onclick = () => {
        const txt = document.getElementById('adminGeneratedKeysText')?.value || '';
        navigator.clipboard.writeText(txt);
        copyGenBtn.innerText = 'Скопировано!';
        setTimeout(() => { copyGenBtn.innerText = 'Копировать все'; }, 2000);
      };
    }

    // Refresh Keys
    const refreshKeysBtn = document.getElementById('adminRefreshKeysBtn');
    if (refreshKeysBtn) {
      refreshKeysBtn.onclick = () => fetchAdminKeys().then(renderAdminKeysList);
    }

    // Create Promocode
    const createPromoBtn = document.getElementById('adminCreatePromoBtn');
    if (createPromoBtn) {
      createPromoBtn.onclick = async () => {
        const nameInput = document.getElementById('adminPromoNameInput');
        const betInput = document.getElementById('adminPromoBetInput');
        const maxInput = document.getElementById('adminPromoMaxInput');
        const promoName = (nameInput?.value || '').trim();
        const bet = parseInt(betInput?.value || '20', 10);
        const maxUsages = parseInt(maxInput?.value || '50', 10);

        if (!promoName) {
          alert('Введите название промокода');
          return;
        }

        createPromoBtn.disabled = true;
        try {
          await fetch('/ajax/admin/promocodes/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: state.token, promocode: promoName, bet, maxUsages })
          });
          nameInput.value = '';
          await fetchAdminPromos();
          renderAdminPromosList();
          updateAdminStatsUI();
        } catch (e) {
          alert('Ошибка при создании промокода');
        } finally {
          createPromoBtn.disabled = false;
        }
      };
    }

    // Refresh Promocodes
    const refreshPromosBtn = document.getElementById('adminRefreshPromosBtn');
    if (refreshPromosBtn) {
      refreshPromosBtn.onclick = () => fetchAdminPromos().then(renderAdminPromosList);
    }

    // Save Settings
    const saveSettingsBtn = document.getElementById('adminSaveSettingsBtn');
    if (saveSettingsBtn) {
      saveSettingsBtn.onclick = async () => {
        const toggle = document.getElementById('adminDownloadEnabledToggle');
        const urlInput = document.getElementById('adminDownloadUrlInput');
        const statusBox = document.getElementById('adminSettingsStatus');
        const enabled = toggle?.checked || false;
        const url = urlInput?.value || '/downloads/exclusivelauncher.exe';

        saveSettingsBtn.disabled = true;
        try {
          const res = await fetch('/ajax/admin/settings/set', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: state.token,
              loader_download_enabled: enabled,
              loader_download_url: url
            })
          });
          state.adminData.settings.loader_download_enabled = enabled;
          state.adminData.settings.loader_download_url = url;
          if (statusBox) {
            statusBox.className = 'admin-status-msg success';
            statusBox.innerText = 'Настройки успешно сохранены!';
            statusBox.style.display = 'block';
            setTimeout(() => { statusBox.style.display = 'none'; }, 3000);
          }
          updateAdminStatsUI();
        } catch (e) {
          if (statusBox) {
            statusBox.className = 'admin-status-msg error';
            statusBox.innerText = 'Ошибка при сохранении настроек.';
            statusBox.style.display = 'block';
          }
        } finally {
          saveSettingsBtn.disabled = false;
        }
      };
    }

    // Modal Events
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const modalCancelBtn = document.getElementById('modalCancelBtn');
    if (modalCloseBtn) modalCloseBtn.onclick = closeEditUserModal;
    if (modalCancelBtn) modalCancelBtn.onclick = closeEditUserModal;

    const modalPresetLifetime = document.getElementById('modalPresetLifetime');
    if (modalPresetLifetime) modalPresetLifetime.onclick = () => { document.getElementById('modalUserSub').value = '31.12.2099'; };
    const modalPreset30d = document.getElementById('modalPreset30d');
    if (modalPreset30d) modalPreset30d.onclick = () => { document.getElementById('modalUserSub').value = '+30d'; };
    const modalPresetNone = document.getElementById('modalPresetNone');
    if (modalPresetNone) modalPresetNone.onclick = () => { document.getElementById('modalUserSub').value = 'None'; };

    const modalSaveBtn = document.getElementById('modalSaveUserBtn');
    if (modalSaveBtn) {
      modalSaveBtn.onclick = saveUserEdits;
    }

    // Delegate row buttons (Edit, Ban, HWID reset)
    bindUserRowActions();
  }

  function updateAdminSectionVisibility() {
    const tab = state.adminSubTab;
    const usersSec = document.getElementById('adminUsersSection');
    const keysSec = document.getElementById('adminKeysSection');
    const promosSec = document.getElementById('adminPromosSection');
    const settingsSec = document.getElementById('adminSettingsSection');

    if (usersSec) usersSec.style.display = (tab === 'overview' || tab === 'users') ? 'flex' : 'none';
    if (keysSec) keysSec.style.display = (tab === 'overview' || tab === 'keys') ? 'flex' : 'none';
    if (promosSec) promosSec.style.display = (tab === 'overview' || tab === 'promocodes') ? 'flex' : 'none';
    if (settingsSec) settingsSec.style.display = (tab === 'overview' || tab === 'settings') ? 'flex' : 'none';
  }

  async function loadAdminData() {
    await Promise.allSettled([
      fetchAdminUsers(state.adminData.usersPage, state.adminData.usersSearch),
      fetchAdminKeys(),
      fetchAdminPromos(),
      fetchAdminSettings(),
    ]);
    renderAdminUsersRows();
    renderAdminKeysList();
    renderAdminPromosList();
    updateAdminStatsUI();
  }

  async function fetchAdminUsers(page = 0, query = '') {
    state.adminData.usersPage = page;
    state.adminData.usersSearch = query;
    try {
      const endpoint = query ? '/ajax/admin/users/search' : '/ajax/admin/users/getAll';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: state.token, page, query })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.content)) {
          state.adminData.users = data.content;
          state.adminData.usersTotalPages = Math.max(1, data.total || 1);
          state.adminData.stats.totalUsers = Math.max(data.content.length, (data.total || 1) * 9);
        }
      }
    } catch (e) {
      console.warn('Failed to load users from API:', e);
    }

    if (state.adminData.users.length === 0 && state.user) {
      state.adminData.users = [{
        uid: state.user.uid || 0,
        user: state.user.username || 'DustGames',
        email: state.user.email || 'nikiforova280987@gmail.com',
        group: state.user.role || 'ADMIN',
        banned: false,
        hwid: state.user.hwid || 'LOCAL-FULL-ACCESS',
        subtill: '31.12.2099'
      }];
      state.adminData.stats.totalUsers = 1;
    }
  }

  async function fetchAdminKeys() {
    try {
      const res = await fetch('/ajax/admin/keys/action/getAll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: state.token })
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          state.adminData.keys = data;
        }
      }
    } catch (e) {
      console.warn('Failed to load keys:', e);
    }
  }

  async function fetchAdminPromos() {
    try {
      const res = await fetch('/ajax/admin/promocodes/getAll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: state.token })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === 'object') {
          state.adminData.promocodes = data;
        }
      }
    } catch (e) {
      console.warn('Failed to load promocodes:', e);
    }
  }

  async function fetchAdminSettings() {
    try {
      const res = await fetch('/ajax/admin/settings/get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: state.token })
      });
      if (res.ok) {
        const data = await res.json();
        if (data) {
          state.adminData.settings = data;
        }
      }
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }
  }

  function renderAdminUsersRows() {
    const container = document.getElementById('adminUsersTableBody');
    if (container) {
      container.innerHTML = renderAdminUsersRowsHTML();
      bindUserRowActions();
    }
    const pageInfo = document.getElementById('adminPageInfo');
    if (pageInfo) {
      pageInfo.innerText = `Страница ${state.adminData.usersPage + 1} из ${state.adminData.usersTotalPages}`;
    }
    const prevBtn = document.getElementById('adminPrevPageBtn');
    const nextBtn = document.getElementById('adminNextPageBtn');
    if (prevBtn) prevBtn.disabled = state.adminData.usersPage <= 0;
    if (nextBtn) nextBtn.disabled = state.adminData.usersPage >= state.adminData.usersTotalPages - 1;
    updateAdminStatsUI();
  }

  function renderAdminKeysList() {
    const container = document.getElementById('adminKeysListBody');
    if (container) {
      container.innerHTML = renderAdminKeysListHTML();
      container.querySelectorAll('.admin-btn-del-key').forEach(btn => {
        btn.onclick = async () => {
          const key = btn.getAttribute('data-key');
          if (confirm(`Удалить ключ ${key}?`)) {
            await fetch('/ajax/admin/keys/action/remove', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: state.token, key })
            });
            await fetchAdminKeys();
            renderAdminKeysList();
            updateAdminStatsUI();
          }
        };
      });
      container.querySelectorAll('.admin-btn-copy-key').forEach(btn => {
        btn.onclick = () => {
          const key = btn.getAttribute('data-key');
          navigator.clipboard.writeText(key);
          btn.innerText = 'Скопировано!';
          setTimeout(() => { btn.innerText = 'Копия'; }, 2000);
        };
      });
    }
    const titleEl = document.getElementById('adminActiveKeysTitle');
    if (titleEl) {
      titleEl.innerText = `Активные ключи (${state.adminData.keys.length})`;
    }
  }

  function renderAdminPromosList() {
    const container = document.getElementById('adminPromosListBody');
    if (container) {
      container.innerHTML = renderAdminPromosListHTML();
      container.querySelectorAll('.admin-btn-del-promo').forEach(btn => {
        btn.onclick = async () => {
          const promo = btn.getAttribute('data-promo');
          if (confirm(`Удалить промокод ${promo}?`)) {
            await fetch('/ajax/admin/promocodes/remove', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: state.token, promocode: promo })
            });
            await fetchAdminPromos();
            renderAdminPromosList();
            updateAdminStatsUI();
          }
        };
      });
    }
    const promoTitleEl = document.getElementById('adminActivePromosTitle');
    if (promoTitleEl) {
      promoTitleEl.innerText = `Активные промокоды (${Object.keys(state.adminData.promocodes).length})`;
    }
  }

  function updateAdminStatsUI() {
    const uCount = document.getElementById('statUsersCount');
    if (uCount) uCount.innerText = state.adminData.stats.totalUsers || state.adminData.users.length || '1';
    const kCount = document.getElementById('statKeysCount');
    if (kCount) kCount.innerText = state.adminData.keys.length || '0';
    const pCount = document.getElementById('statPromosCount');
    if (pCount) pCount.innerText = Object.keys(state.adminData.promocodes).length || '0';
    const dState = document.getElementById('statDownloadState');
    if (dState) {
      const en = state.adminData.settings.loader_download_enabled;
      dState.innerText = en ? 'ДОСТУПНА' : 'ОТКЛЮЧЕНА';
      dState.style.color = en ? '#4ade80' : '#f87171';
    }
  }

  function bindUserRowActions() {
    document.querySelectorAll('.admin-btn-reset-hwid').forEach(btn => {
      btn.onclick = async () => {
        const username = btn.getAttribute('data-user');
        if (confirm(`Сбросить HWID для пользователя ${username}?`)) {
          await fetch('/ajax/admin/resetHardwareId', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: state.token, username })
          });
          alert(`HWID для пользователя ${username} успешно сброшен!`);
          fetchAdminUsers(state.adminData.usersPage, state.adminData.usersSearch).then(renderAdminUsersRows);
        }
      };
    });

    document.querySelectorAll('.admin-btn-ban-user').forEach(btn => {
      btn.onclick = async () => {
        const username = btn.getAttribute('data-user');
        const currentlyBanned = btn.getAttribute('data-banned') === 'true';
        const action = currentlyBanned ? 'разбанить' : 'забанить';
        if (confirm(`Вы уверены, что хотите ${action} пользователя ${username}?`)) {
          await fetch('/ajax/admin/users/patch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: state.token, username, isBanned: !currentlyBanned })
          });
          fetchAdminUsers(state.adminData.usersPage, state.adminData.usersSearch).then(renderAdminUsersRows);
        }
      };
    });

    document.querySelectorAll('.admin-btn-edit-user').forEach(btn => {
      btn.onclick = () => {
        const username = btn.getAttribute('data-user');
        const uid = btn.getAttribute('data-uid');
        const role = btn.getAttribute('data-role');
        const sub = btn.getAttribute('data-sub');
        const email = btn.getAttribute('data-email');
        const banned = btn.getAttribute('data-banned') === 'true';
        openEditUserModal({ username, uid, role, sub, email, banned });
      };
    });
  }

  let editingTargetUsername = '';
  function openEditUserModal(u) {
    editingTargetUsername = u.username;
    const modal = document.getElementById('adminEditUserModal');
    if (!modal) return;
    document.getElementById('modalTargetUser').innerText = u.username;
    document.getElementById('modalUserUid').value = u.uid || 0;
    document.getElementById('modalUserRole').value = u.role || 'USER';
    document.getElementById('modalUserSub').value = u.sub || '31.12.2099';
    document.getElementById('modalUserEmail').value = u.email || '';
    document.getElementById('modalUserBanned').checked = u.banned;
    modal.style.display = 'flex';
  }

  function closeEditUserModal() {
    const modal = document.getElementById('adminEditUserModal');
    if (modal) modal.style.display = 'none';
  }

  async function saveUserEdits() {
    if (!editingTargetUsername) return;
    const newUid = parseInt(document.getElementById('modalUserUid').value, 10);
    const newRole = document.getElementById('modalUserRole').value;
    const newSub = document.getElementById('modalUserSub').value.trim();
    const newEmail = document.getElementById('modalUserEmail').value.trim();
    const isBanned = document.getElementById('modalUserBanned').checked;

    const saveBtn = document.getElementById('modalSaveUserBtn');
    if (saveBtn) saveBtn.disabled = true;

    try {
      if (!isNaN(newUid) && newUid >= 0) {
        await fetch('/ajax/admin/users/changeUid', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: state.token, username: editingTargetUsername, uid: newUid })
        });
      }

      await fetch('/ajax/admin/users/patch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: state.token,
          username: editingTargetUsername,
          role: newRole,
          subTill: newSub,
          email: newEmail,
          isBanned: isBanned
        })
      });

      closeEditUserModal();
      fetchAdminUsers(state.adminData.usersPage, state.adminData.usersSearch).then(renderAdminUsersRows);
    } catch (e) {
      alert('Ошибка при сохранении изменений пользователя');
    } finally {
      if (saveBtn) saveBtn.disabled = false;
    }
  }

  async function generateAdminKeys(type, count) {
    let endpoint = '/ajax/admin/multiactions/keys/subscription';
    let params = { token: state.token, count };

    if (type === 'sub-30') {
      endpoint = '/ajax/admin/multiactions/keys/subscription';
      params.days = 30;
    } else if (type === 'sub-90') {
      endpoint = '/ajax/admin/multiactions/keys/subscription';
      params.days = 90;
    } else if (type === 'sub-lifetime') {
      endpoint = '/ajax/admin/multiactions/keys/subscription';
      params.days = 3650;
    } else if (type === 'hwid') {
      endpoint = '/ajax/admin/multiactions/keys/hardwareReset';
    } else if (type === 'beta') {
      endpoint = '/ajax/admin/multiactions/keys/beta';
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const text = await res.text();
      const outputBox = document.getElementById('adminGeneratedKeysBox');
      const outputText = document.getElementById('adminGeneratedKeysText');
      if (outputBox && outputText) {
        outputText.value = text.trim();
        outputBox.style.display = 'flex';
      }
      await fetchAdminKeys();
      renderAdminKeysList();
      updateAdminStatsUI();
    } catch (e) {
      alert('Ошибка при генерации ключей');
    }
  }

  // ==========================================================================
  // Interactive 3D Minecraft Steve Character (WebGL skinview3d & Fallback)
  // ==========================================================================
  let currentSkinViewer = null;

  function init3DCharacter() {
    const canvas = document.getElementById('steveCanvas');
    if (!canvas) return;

    if (currentSkinViewer) {
      try {
        currentSkinViewer.dispose();
      } catch (e) {}
      currentSkinViewer = null;
    }

    if (window.skinview3d) {
      try {
        const viewer = new window.skinview3d.SkinViewer({
          canvas: canvas,
          width: 280,
          height: 360,
          skin: '/assets/steve.png'
        });
        currentSkinViewer = viewer;
        viewer.fov = 65;
        viewer.zoom = 0.95;
        if (viewer.controls) {
          viewer.controls.enableZoom = false;
          viewer.controls.enablePan = false;
          viewer.controls.enableRotate = true;
        }
        viewer.animation = new window.skinview3d.IdleAnimation();
        viewer.animation.speed = 0.8;
        viewer.autoRotate = true;
        viewer.autoRotateSpeed = 1.0;
        viewer.adjustCameraDistance();

        if ('IntersectionObserver' in window) {
          const obs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
              if (currentSkinViewer) {
                currentSkinViewer.renderPaused = !entry.isIntersecting;
              }
            });
          }, { threshold: 0.1 });
          obs.observe(canvas);
        }
        return;
      } catch (err) {
        console.warn('SkinViewer WebGL initialization failed, using fallback:', err);
      }
    }

    if (!window.skinview3d && !document.querySelector('script[src*="skinview3d"]')) {
      const s = document.createElement('script');
      s.src = '/assets/skinview3d.bundle.js';
      s.onload = () => {
        init3DCharacter();
      };
      document.head.appendChild(s);
    }

    initFallbackSteve(canvas);
  }

  function initFallbackSteve(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rotY = 0.35;
    let rotX = 0.05;
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    let time = 0;

    const stage = document.getElementById('characterStage');
    if (stage) {
      stage.onmousedown = (e) => {
        isDragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
      };
      window.onmouseup = () => { isDragging = false; };
      window.onmousemove = (e) => {
        if (!isDragging) return;
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        rotY += dx * 0.015;
        rotX += dy * 0.01;
        rotX = Math.max(-0.4, Math.min(0.4, rotX));
        lastX = e.clientX;
        lastY = e.clientY;
      };

      stage.ontouchstart = (e) => {
        isDragging = true;
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
      };
      window.ontouchend = () => { isDragging = false; };
      window.ontouchmove = (e) => {
        if (!isDragging) return;
        const dx = e.touches[0].clientX - lastX;
        const dy = e.touches[0].clientY - lastY;
        rotY += dx * 0.015;
        rotX += dy * 0.01;
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
      };
    }

    function renderFallback() {
      if (!isDragging) {
        rotY += 0.01;
        time += 0.03;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2 + 10;
      const breath = Math.sin(time) * 1.5;

      // Drop shadow
      ctx.beginPath();
      ctx.ellipse(cx, cy + 135, 45, 12, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fill();

      // Steve Body Parts with authentic Minecraft proportions
      drawCube(ctx, cx, cy - 78 + breath, 0, 32, 32, 32, rotX, rotY, '#b88358', '#422814', '#2a1a0d');
      drawCube(ctx, cx, cy - 38 + breath, 0, 32, 48, 16, rotX, rotY, '#0097a7', '#00838f', '#006064');
      drawCube(ctx, cx - 22, cy - 38 + breath, 0, 12, 48, 12, rotX, rotY, '#b88358', '#00838f', '#006064');
      drawCube(ctx, cx + 22, cy - 38 + breath, 0, 12, 48, 12, rotX, rotY, '#b88358', '#00838f', '#006064');
      drawCube(ctx, cx - 8, cy + 11, 0, 14, 50, 14, rotX, rotY, '#283593', '#1a237e', '#101652');
      drawCube(ctx, cx + 8, cy + 11, 0, 14, 50, 14, rotX, rotY, '#283593', '#1a237e', '#101652');

      if (!currentSkinViewer) {
        requestAnimationFrame(renderFallback);
      }
    }

    function drawCube(ctx, ox, oy, oz, w, h, d, rx, ry, frontCol, sideCol, topCol) {
      const hw = w / 2;
      const hh = h / 2;
      const hd = d / 2;

      const v = [
        [-hw, -hh, -hd], [hw, -hh, -hd], [hw, hh, -hd], [-hw, hh, -hd],
        [-hw, -hh, hd],  [hw, -hh, hd],  [hw, hh, hd],  [-hw, hh, hd]
      ];

      const p = v.map(([x, y, z]) => {
        const cosY = Math.cos(ry);
        const sinY = Math.sin(ry);
        const x1 = x * cosY + z * sinY;
        const z1 = -x * sinY + z * cosY;

        const cosX = Math.cos(rx);
        const sinX = Math.sin(rx);
        const y2 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;

        const fov = 350;
        const scale = fov / (fov + z2 + oz);
        return [ox + x1 * scale, oy + y2 * scale, z2];
      });

      const faces = [
        { idx: [0, 1, 2, 3], col: frontCol, z: (p[0][2] + p[1][2] + p[2][2] + p[3][2]) / 4 },
        { idx: [5, 4, 7, 6], col: sideCol,  z: (p[4][2] + p[5][2] + p[6][2] + p[7][2]) / 4 },
        { idx: [4, 0, 3, 7], col: sideCol,  z: (p[0][2] + p[4][2] + p[7][2] + p[3][2]) / 4 },
        { idx: [1, 5, 6, 2], col: frontCol, z: (p[1][2] + p[5][2] + p[6][2] + p[2][2]) / 4 },
        { idx: [4, 5, 1, 0], col: topCol,   z: (p[0][2] + p[1][2] + p[5][2] + p[4][2]) / 4 },
        { idx: [3, 2, 6, 7], col: sideCol,  z: (p[3][2] + p[2][2] + p[6][2] + p[7][2]) / 4 },
      ];

      faces.sort((a, b) => b.z - a.z);

      faces.forEach(f => {
        ctx.beginPath();
        ctx.moveTo(p[f.idx[0]][0], p[f.idx[0]][1]);
        for (let i = 1; i < 4; i++) {
          ctx.lineTo(p[f.idx[i]][0], p[f.idx[i]][1]);
        }
        ctx.closePath();
        ctx.fillStyle = f.col;
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.12)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    }

    renderFallback();
  }

  // ==========================================================================
  // Scroll Effects & Intersection Observer
  // ==========================================================================
  function setupScrollEffects() {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 80) {
        document.body.classList.add('scrolled');
      } else {
        document.body.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  function initRevealElements() {
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    reveals.forEach(el => observer.observe(el));
  }

  let manualScrollLock = false;
  let manualScrollTimer = null;

  function initSmoothScroll() {
    const navItems = document.querySelectorAll('.header-nav-pill .nav-item[data-target]');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const targetId = item.getAttribute('data-target');
        if (!targetId) return;
        e.preventDefault();
        const el = document.getElementById(targetId);
        if (el) {
          manualScrollLock = true;
          clearTimeout(manualScrollTimer);

          // Lock the active pill to the clicked tab instantly
          navItems.forEach(i => i.classList.remove('active'));
          item.classList.add('active');

          const offsetTop = targetId === 'hero' ? 0 : Math.max(0, el.offsetTop - 85);
          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
          });

          // Keep lock active until smooth scroll completes
          manualScrollTimer = setTimeout(() => {
            manualScrollLock = false;
          }, 1200);
        }
      });
    });

    const headerLogoLink = document.querySelector('.header-logo-link');
    if (headerLogoLink) {
      headerLogoLink.addEventListener('click', (e) => {
        e.preventDefault();
        manualScrollLock = true;
        clearTimeout(manualScrollTimer);
        navItems.forEach(i => {
          if (i.getAttribute('data-target') === 'hero') i.classList.add('active');
          else i.classList.remove('active');
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        manualScrollTimer = setTimeout(() => {
          manualScrollLock = false;
        }, 1200);
      });
    }

    const generalAnchors = document.querySelectorAll('a[href^="#"]:not(.nav-item)');
    generalAnchors.forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const targetId = anchor.getAttribute('href').replace('#', '');
        const el = document.getElementById(targetId);
        if (el) {
          e.preventDefault();
          manualScrollLock = true;
          clearTimeout(manualScrollTimer);

          navItems.forEach(i => {
            if (i.getAttribute('data-target') === targetId) {
              i.classList.add('active');
            } else {
              i.classList.remove('active');
            }
          });

          const offsetTop = targetId === 'hero' ? 0 : Math.max(0, el.offsetTop - 85);
          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
          });

          manualScrollTimer = setTimeout(() => {
            manualScrollLock = false;
          }, 1200);
        }
      });
    });

    // Native scrollend event support to unlock immediately when scroll finishes
    window.addEventListener('scrollend', () => {
      manualScrollLock = false;
      clearTimeout(manualScrollTimer);
    }, { passive: true });
  }

  function initScrollSpy() {
    const sections = Array.from(document.querySelectorAll('section[id]'));
    const navItems = document.querySelectorAll('.header-nav-pill .nav-item[data-target]');

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (manualScrollLock) return; // Do not overwrite active pill while user is smoothly scrolling!

      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (manualScrollLock) {
            ticking = false;
            return;
          }

          let current = sections[0]?.getAttribute('id') || 'hero';
          const scrollPosition = window.scrollY + 140;

          sections.forEach(section => {
            if (scrollPosition >= section.offsetTop) {
              current = section.getAttribute('id');
            }
          });

          if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 50) {
            current = 'pricing';
          }

          navItems.forEach(item => {
            if (item.getAttribute('data-target') === current) {
              item.classList.add('active');
            } else {
              item.classList.remove('active');
            }
          });
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  // Expose navigate globally
  window.navigate = navigate;

})();
