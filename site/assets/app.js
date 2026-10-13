/**
 * Kodex Client - Complete High Performance Frontend Engine
 * Exact match to reference screenshots with smooth animations and authentic Kodex branding
 */

(function () {
  'use strict';

  // State Management
  const state = {
    user: null,
    token: localStorage.getItem('kodex_token') || '',
    currentRoute: 'home',
    lang: 'ru',
    authMode: 'signin', // 'signin' or 'signup'
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
      tryFree: 'Попробовать бесплатно ↗',
      seeInAction: 'Посмотреть в деле',
      createAccount: 'Создать аккаунт ↗',
      downloadKodex: 'Скачать Kodex ↗',
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
      downloadKodex: 'Download Kodex ↗',
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
        localStorage.removeItem('kodex_token');
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
    if (route === 'cabinet') url = '/cabinet';
    else if (route === 'auth') url = state.authMode === 'signup' ? '/sign-up' : '/sign-in';

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
      init3DCharacter();
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
              <img src="/assets/logo.png" alt="Kodex" class="header-logo-img" />
              <span class="header-logo-text">Kodex</span>
            </a>
          </div>

          <nav class="header-nav-pill">
            <a href="#hero" class="nav-item active" data-target="hero">Главная</a>
            <a href="#visuals" class="nav-item" data-target="visuals">Визуал</a>
            <a href="#showcase" class="nav-item" data-target="showcase">Косметика</a>
            <a href="#cloud" class="nav-item" data-target="cloud">Облако</a>
            <a href="#pricing" class="nav-item" data-target="pricing">Цены</a>
            <a href="http://kodexclient.fun/pricing" class="nav-item">Магазин</a>
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
            Визуальный<br />
            клиент Minecraft<br />
            нового поколения
          </h1>
          <p class="hero-subtitle">
            Плащи, крылья, шляпы и 3D-скины. HUD, который можно собрать заново. Шейдеры на руке, блоках и нике. Один клиент, одно меню — и ничего лишнего.
          </p>
          <div class="hero-actions">
            <button class="btn-black-pill" id="heroCtaRegister">
              <span>Попробовать бесплатно</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
            </button>
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
            <span class="section-tag">только визуал</span>
            <h2 class="section-big-title">играй<br /><em>красивее</em></h2>
            <p class="section-desc">
              Kodex не трогает твой аим, дистанцию удара и движение. Он меняет то, как игра выглядит, — и отдаёт тебе все настройки.
            </p>
            <div class="separator-line"></div>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">КОСМЕТИЧЕСКИХ ПРЕДМЕТОВ</span>
                <span class="stat-value">535</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">ВИЗУАЛЬНЫХ МОДУЛЕЙ</span>
                <span class="stat-value">32</span>
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
          <img src="/assets/night-1z0pI4rK.png" class="mockup-game-bg" alt="Game Background" />

          <div class="mockup-inner">
            <!-- Top HUD Bar -->
            <div class="hud-top-bar">
              <div class="hud-perf-pill">
                <span>CPU <strong>6%</strong></span>
                <span>RAM <strong>19%</strong></span>
                <span>FPS <strong>101</strong></span>
              </div>
              <div class="hud-watermark-pill">
                <img src="/assets/logo.png" alt="Kodex" />
                <span>Kodex</span>
                <span style="color:#71717a">|</span>
                <span>darkich</span>
                <span style="color:#71717a">|</span>
                <span style="color:#22c55e">102 FPS</span>
                <span style="color:#71717a">|</span>
                <span style="color:#38bdf8">0 PING</span>
              </div>
              <div class="hud-keybinds-pill">
                Keybinds · Crosshair <strong>EQUAL</strong>
              </div>
            </div>

            <!-- Client GUI Container -->
            <div class="client-gui-container">
              <div class="gui-sidebar">
                <div class="gui-logo-title">
                  <img src="/assets/logo.png" alt="Kodex" />
                  <span>Kodex</span>
                </div>
                <ul class="gui-nav-list">
                  <li><button class="gui-nav-btn"><span>⚔ Combat</span> <span class="gui-badge">2</span></button></li>
                  <li><button class="gui-nav-btn"><span>🏃 Movement</span> <span class="gui-badge">2</span></button></li>
                  <li><button class="gui-nav-btn active"><span>👁 Render</span> <span class="gui-badge">8</span></button></li>
                  <li><button class="gui-nav-btn"><span>⚙ Misc</span> <span class="gui-badge">4</span></button></li>
                  <li><button class="gui-nav-btn"><span>🎯 Crosshair</span> <span class="gui-badge">1</span></button></li>
                  <li><button class="gui-nav-btn"><span>👕 Cosmetics</span> <span class="gui-badge">2</span></button></li>
                </ul>
                <div class="gui-user-pill">
                  <div class="gui-user-avatar"></div>
                  <div>
                    <div style="font-size:12px; font-weight:700; color:#fff">darkich</div>
                    <div style="font-size:10px; color:#8b5cf6">Developer</div>
                  </div>
                </div>
              </div>

              <div class="gui-content">
                <div class="gui-top-search">
                  <span class="gui-breadcrumb">Render &gt; Modules (8 active)</span>
                  <div style="font-size:12px; color:#a1a1aa">Search modules...</div>
                </div>
                <div class="gui-panels-grid">
                  <!-- Panel 1: Chams -->
                  <div class="gui-panel-box">
                    <div class="gui-panel-title">
                      <span>❄ Chams</span>
                      <span style="color:#22c55e; font-size:11px">ENABLED</span>
                    </div>
                    <div class="gui-slider-row">
                      <div class="gui-slider-label"><span>Glow Opacity</span><span>0.9</span></div>
                      <div class="gui-slider-track"><div class="gui-slider-fill" style="width: 90%;"></div></div>
                    </div>
                    <div class="gui-slider-row">
                      <div class="gui-slider-label"><span>Glow Radius</span><span>14</span></div>
                      <div class="gui-slider-track"><div class="gui-slider-fill" style="width: 70%;"></div></div>
                    </div>
                    <div class="gui-slider-row">
                      <div class="gui-slider-label"><span>Line Opacity</span><span>0.9</span></div>
                      <div class="gui-slider-track"><div class="gui-slider-fill" style="width: 90%;"></div></div>
                    </div>
                  </div>

                  <!-- Panel 2: BlockOverlay -->
                  <div class="gui-panel-box">
                    <div class="gui-panel-title">
                      <span>💠 BlockOverlay</span>
                      <span style="color:#22c55e; font-size:11px">ENABLED</span>
                    </div>
                    <div class="gui-slider-row">
                      <div class="gui-slider-label"><span>Shader Speed</span><span>1.0</span></div>
                      <div class="gui-slider-track"><div class="gui-slider-fill" style="width: 60%;"></div></div>
                    </div>
                    <div class="gui-slider-row">
                      <div class="gui-slider-label"><span>Shader Opacity</span><span>1.0</span></div>
                      <div class="gui-slider-track"><div class="gui-slider-fill" style="width: 100%;"></div></div>
                    </div>
                    <div class="gui-slider-row">
                      <div class="gui-slider-label"><span>Client Color Sync</span><span>Active</span></div>
                      <div class="gui-slider-track"><div class="gui-slider-fill" style="width: 80%; background:#22c55e"></div></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
            <div class="cloud-check-row">
              <span>Новое устройство</span>
              <span class="cloud-status-badge">вошёл и играешь</span>
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
                <span>Все 32 визуальных модуля</span>
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

            <a href="http://kodexclient.fun/pricing" class="btn-card-secondary">Купить</a>
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

            <a href="http://kodexclient.fun/pricing" class="btn-card-primary">Купить</a>
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

            <a href="http://kodexclient.fun/pricing" class="btn-card-secondary">Купить</a>
          </div>
        </div>

        <p class="pricing-footnote reveal">
          Один платёж за выбранный период — без автопродления и повторных списаний без твоего действия. Цены указаны в рублях (₽), итоговая сумма видна до подтверждения. Подробности — в <a href="http://kodexclient.fun/pricing">магазине</a> или у <a href="https://t.me/blydota4ka" target="_blank">поддержки</a>.
        </p>
      </section>

      <!-- Section 6: Swords and Totems (Screenshot 6) -->
      <section class="section-swords">
        <div class="swords-card reveal">
          <div class="swords-left">
            <span class="section-tag">ТОЛЬКО С ПОДПИСКОЙ</span>
            <h3 class="swords-title">Скины мечей и тотемов.</h3>
            <p class="swords-desc">
              128 пиксельных скинов мечей из лучших SkyBlock-паков и 29 тотемов — классические, анимированные и 3D. Видны в руке, в хотбаре и в анимации срабатывания тотема. Обе вкладки появляются в клиенте сразу, как только активна подписка.
            </p>
            <div class="swords-tags-row">
              <span class="swords-tag-pill">128 мечей</span>
              <span class="swords-tag-pill">29 тотемов</span>
              <span class="swords-tag-pill">Анимированные текстуры</span>
              <span class="swords-tag-pill">Свой тотем при срабатывании</span>
            </div>
          </div>

          <div class="swords-items-grid">
            <!-- 14 Pixel Art Item Boxes -->
            ${renderPixelItemsGrid()}
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
            <span class="basic-pill">Бесплатный перенос между устройствами</span>
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
            <div class="cell-icon-box">👕</div>
            <h4 class="cell-title">Косметика</h4>
            <p class="cell-desc">Плащи, крылья, шляпы, рюкзаки, 3D-скины, стили ника, скины оружия, а с подпиской — скины мечей и тотемов. Всё с предпросмотром до того, как наденешь.</p>
          </div>

          <!-- 2. Миникарта -->
          <div class="feature-table-cell">
            <div class="cell-icon-box">🗺</div>
            <h4 class="cell-title">Миникарта</h4>
            <p class="cell-desc">Вращающаяся миникарта с игроками, мобами, предметами, вейпоинтами, биомом и координатами. Вместо точек — лица игроков, если захочешь.</p>
          </div>

          <!-- 3. Анимации рук -->
          <div class="feature-table-cell">
            <div class="cell-icon-box">✋</div>
            <h4 class="cell-title">Анимации рук</h4>
            <p class="cell-desc">Анимации удара и удержания переписаны с нуля: своя поза для каждого предмета и камера от первого лица, которая следует за движением.</p>
          </div>

          <!-- 4. Свой прицел -->
          <div class="feature-table-cell">
            <div class="cell-icon-box">🎯</div>
            <h4 class="cell-title">Свой прицел</h4>
            <p class="cell-desc">Собери прицел из форм, отступов, обводок и цветов — с живым превью, которое меняется прямо под ползунком.</p>
          </div>

          <!-- 5. Медиаплеер -->
          <div class="feature-table-cell">
            <div class="cell-icon-box">🎵</div>
            <h4 class="cell-title">Медиаплеер</h4>
            <p class="cell-desc">Управляй тем, что уже играет на компьютере: обложка, название трека и медиа-клавиши прямо в HUD.</p>
          </div>

          <!-- 6. Трекер хранилищ -->
          <div class="feature-table-cell">
            <div class="cell-icon-box">📦</div>
            <h4 class="cell-title">Трекер хранилищ</h4>
            <p class="cell-desc">Каждый открытый сундук запоминается по измерениям, ищется по предмету и подсвечивается в мире, когда он тебе нужен.</p>
          </div>

          <!-- 7. Темы -->
          <div class="feature-table-cell">
            <div class="cell-icon-box">🌓</div>
            <h4 class="cell-title">Темы</h4>
            <p class="cell-desc">Тёмная, светлая и неоновая из коробки, плюс токены плотности, скругления и анимации — весь интерфейс меняется разом.</p>
          </div>

          <!-- 8. HUD производительности -->
          <div class="feature-table-cell">
            <div class="cell-icon-box">📈</div>
            <h4 class="cell-title">HUD производительности</h4>
            <p class="cell-desc">FPS, процессор и память прямо из работающего клиента, с цветовой шкалой — просадку видно сразу.</p>
          </div>

          <!-- 9. Баг-репорты -->
          <div class="feature-table-cell">
            <div class="cell-icon-box">🐞</div>
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
            Начни с бесплатного тарифа — без карты, без листа ожидания и без борьбы с лаунчером.
          </p>
          <button class="btn-black-pill" id="ctaDownloadBtn">
            <span>Скачать Kodex</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
          </button>
        </div>
      </section>

      <!-- Section 10: Footer (Screenshot 10) -->
      <footer class="site-footer">
        <div class="footer-inner">
          <div class="footer-top-grid">
            <div class="footer-brand">
              <img src="/assets/logo.png" alt="Kodex" class="footer-brand-logo" />
              <p class="footer-brand-tagline">Играй с самым красивым клиентом.</p>
            </div>

            <div>
              <h5 class="footer-col-title">ПРОДУКТ</h5>
              <ul class="footer-links-list">
                <li><a href="#pricing" class="footer-link">Цены</a></li>
                <li><a href="/downloads/kodexlauncher.exe" class="footer-link">Скачать</a></li>
                <li><a href="#showcase" class="footer-link">Косметика</a></li>
                <li><a href="http://kodexclient.fun/pricing" class="footer-link">Магазин</a></li>
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
                <li><a href="http://kodexclient.fun/pricing" class="footer-link">Оплата и возвраты</a></li>
              </ul>
            </div>
          </div>

          <div class="footer-bottom-row">
            <span>© 2026 Kodex</span>
            <span>Не связано с Mojang и Microsoft</span>
          </div>
        </div>
      </footer>
    `;
  }

  // Pixel items grid generator (Swords & Totems)
  function renderPixelItemsGrid() {
    const items = [
      { color: '#38bdf8', shape: 'sword', name: 'Diamond Blade' },
      { color: '#f97316', shape: 'totem', name: 'Fox Totem' },
      { color: '#10b981', shape: 'sword', name: 'Emerald Katana' },
      { color: '#ec4899', shape: 'totem', name: 'Axolotl Totem' },
      { color: '#94a3b8', shape: 'sword', name: 'Iron Dagger' },
      { color: '#eab308', shape: 'totem', name: 'Duck Totem' },
      { color: '#f59e0b', shape: 'sword', name: 'Firebrand' },
      { color: '#60a5fa', shape: 'totem', name: 'Ice Minion' },
      { color: '#d97706', shape: 'sword', name: 'Golden Saber' },
      { color: '#06b6d4', shape: 'totem', name: 'Wither Crest' },
      { color: '#ef4444', shape: 'sword', name: 'Crimson Edge' },
      { color: '#f8fafc', shape: 'totem', name: 'Tux Penguin' },
      { color: '#fbbf24', shape: 'sword', name: 'Sun Rapier' },
      { color: '#a855f7', shape: 'sword', name: 'Void Scythe' }
    ];

    return items.map(item => `
      <div class="pixel-item-box" title="${item.name}">
        <svg class="pixel-svg-icon" viewBox="0 0 16 16" fill="none">
          ${item.shape === 'sword' ? `
            <path d="M12 2L14 4L7 11L5 9L12 2Z" fill="${item.color}" />
            <path d="M13 3L11 5L10 4L12 2Z" fill="#ffffff" opacity="0.6"/>
            <path d="M4 10L6 12L5 13L3 11L4 10Z" fill="#d97706"/>
            <path d="M2 14L4 12L3 11L1 13L2 14Z" fill="#78350f"/>
          ` : `
            <rect x="5" y="3" width="6" height="5" rx="1" fill="${item.color}" />
            <rect x="6" y="5" width="1" height="1" fill="#ffffff"/>
            <rect x="9" y="5" width="1" height="1" fill="#ffffff"/>
            <rect x="4" y="8" width="8" height="6" rx="1" fill="${item.color}" opacity="0.85"/>
            <circle cx="8" cy="11" r="1.5" fill="#fef08a"/>
          `}
        </svg>
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
          <span>Back to site</span>
        </button>

        <div class="auth-card">
          <img src="/assets/logo.png" alt="Kodex" class="auth-card-logo" />
          <span class="auth-card-tag">ACCOUNT</span>
          <h2 class="auth-card-title">${isSignup ? 'Create your account' : 'Welcome back'}</h2>
          <p class="auth-card-desc">
            ${isSignup 
              ? 'One account for your cosmetics, configs and friends — on every device.' 
              : 'Sign in to sync your cosmetics, configs and friends across every device.'}
          </p>

          <div class="auth-toggle-pill">
            <button class="auth-toggle-btn ${!isSignup ? 'active' : ''}" id="toggleSignIn">Sign in</button>
            <button class="auth-toggle-btn ${isSignup ? 'active' : ''}" id="toggleSignUp">Sign up</button>
          </div>

          <div class="auth-error-msg" id="authErrorMsg"></div>

          <form class="auth-form" id="authForm">
            ${isSignup ? `
              <div class="auth-field-group">
                <label class="auth-field-label">Login</label>
                <input type="text" name="username" class="auth-input" placeholder="username (3-20 characters)" required autocomplete="username" />
              </div>
              <div class="auth-field-group">
                <label class="auth-field-label">Email (optional)</label>
                <input type="email" name="email" class="auth-input" placeholder="you@example.com" autocomplete="email" />
              </div>
              <div class="auth-field-group">
                <label class="auth-field-label">Password</label>
                <input type="password" name="password" class="auth-input" placeholder="at least 6 characters" required autocomplete="new-password" />
              </div>
              <button type="submit" class="auth-submit-btn" id="authSubmitBtn">Create account</button>
            ` : `
              <div class="auth-field-group">
                <label class="auth-field-label">Login or Email</label>
                <input type="text" name="username" class="auth-input" placeholder="username or you@example.com" required autocomplete="username" />
              </div>
              <div class="auth-field-group">
                <label class="auth-field-label">Password</label>
                <input type="password" name="password" class="auth-input" placeholder="at least 6 characters" required autocomplete="current-password" />
              </div>
              <button type="submit" class="auth-submit-btn" id="authSubmitBtn">Sign in</button>
            `}
          </form>

          <p class="auth-card-footer-note">
            Your account carries your cosmetics, module configs and friends list. It is bound to your device on first sign-in.
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
    const planText = user.role === 'ADMIN' ? 'Admin (Lifetime)' : (user.subtill && user.subtill !== 'None' ? `Pro (${user.subtill})` : 'Free');

    return `
      <div class="cabinet-page-view">
        <!-- Sidebar -->
        <aside class="cabinet-sidebar">
          <div class="cabinet-brand-row">
            <img src="/assets/logo.png" alt="Kodex" class="cabinet-brand-logo" />
            <span class="cabinet-brand-name">Kodex</span>
          </div>

          <ul class="cabinet-menu-list">
            <li class="cabinet-menu-item active">
              <div class="cabinet-menu-item-left">
                <span>👤</span>
                <span>Account</span>
              </div>
            </li>
            <li class="cabinet-menu-item" onclick="window.location.href='http://kodexclient.fun/pricing'">
              <div class="cabinet-menu-item-left">
                <span>✨</span>
                <span>Pro</span>
              </div>
              <span class="cabinet-badge-pro">GET</span>
            </li>
            <li class="cabinet-menu-item">
              <div class="cabinet-menu-item-left">
                <span>🎯</span>
                <span>FunTime</span>
              </div>
              <span class="cabinet-badge-live">LIVE</span>
            </li>
            <li class="cabinet-menu-item">
              <div class="cabinet-menu-item-left">
                <span>👕</span>
                <span>Cosmetics</span>
              </div>
            </li>
            <li class="cabinet-menu-item">
              <div class="cabinet-menu-item-left">
                <span>👥</span>
                <span>Friends</span>
              </div>
            </li>
            <li class="cabinet-menu-item">
              <div class="cabinet-menu-item-left">
                <span>⚙</span>
                <span>Configs</span>
              </div>
            </li>
            <li class="cabinet-menu-item" onclick="window.location.href='http://kodexclient.fun/pricing'">
              <div class="cabinet-menu-item-left">
                <span>🛍</span>
                <span>Store</span>
              </div>
            </li>
            <li class="cabinet-menu-item">
              <div class="cabinet-menu-item-left">
                <span>📥</span>
                <span>My purchases</span>
              </div>
            </li>
          </ul>

          <div class="cabinet-sidebar-bottom">
            <div class="cabinet-user-badge">
              <div class="cabinet-user-avatar">${initial}</div>
              <span class="cabinet-user-name">${user.username}</span>
            </div>
            <button class="cabinet-logout-btn" id="cabinetLogoutBtn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              <span>Log out</span>
            </button>
          </div>
        </aside>

        <!-- Main Body -->
        <main class="cabinet-main-body">
          <div class="cabinet-content-col">
            <div>
              <h1 class="cabinet-header-title">Account</h1>
              <p class="cabinet-header-subtitle">Manage your account settings</p>
            </div>

            <div class="cabinet-user-header">
              <div class="cabinet-big-avatar">${initial}</div>
              <div class="cabinet-user-details">
                <h3>${user.username}</h3>
                <p>${user.email || 'No email attached'}</p>
              </div>
            </div>

            <!-- Launcher Card (Screenshot 13 & 14) -->
            <div>
              <div class="cabinet-section-label">
                <span>↓</span> <span>LAUNCHER</span>
              </div>
              <div class="launcher-card">
                <div class="launcher-card-left">
                  <div class="launcher-icon-box">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  </div>
                  <div class="launcher-info">
                    <h4 class="launcher-info-title">Kodex Launcher</h4>
                    <p class="launcher-info-sub">Windows 10 / 11 · 64-bit</p>
                    <div class="launcher-badges-row">
                      <span class="launcher-badge">v1.1.41.0</span>
                      <span class="launcher-badge">74.5 MB</span>
                      <span class="launcher-badge">built 12.10.2026</span>
                    </div>
                  </div>
                </div>
                <button class="btn-launcher-download" id="downloadLauncherBtn">Download</button>
              </div>
              <p class="launcher-subtext">Sign in inside the launcher with this account.</p>
            </div>

            <!-- Account Data Table (Screenshot 13 & 14) -->
            <div>
              <div class="cabinet-section-label">
                <span>🪪</span> <span>ACCOUNT DATA</span>
              </div>
              <div class="account-data-list">
                <div class="account-data-row">
                  <span class="account-data-label">🏷 UID</span>
                  <span class="account-data-val">${user.uid || user.id || '20018'}</span>
                </div>
                <div class="account-data-row">
                  <span class="account-data-label">👑 Role</span>
                  <span class="account-data-val">${user.role || 'User'}</span>
                </div>
                <div class="account-data-row">
                  <span class="account-data-label">@ Login</span>
                  <span class="account-data-val">${user.username}</span>
                </div>
                <div class="account-data-row">
                  <span class="account-data-label">✉ Email</span>
                  <span class="account-data-val">${user.email || '—'}</span>
                </div>
                <div class="account-data-row">
                  <span class="account-data-label">🕒 Registered</span>
                  <span class="account-data-val">${user.regdate || '13.10.2026, 00:28'}</span>
                </div>
                <div class="account-data-row">
                  <span class="account-data-label">⚡ Plan</span>
                  <div class="account-data-val">
                    <span>${planText}</span>
                    <button class="btn-plan-upgrade" onclick="window.location.href='http://kodexclient.fun/pricing'">Upgrade</button>
                  </div>
                </div>
                <div class="account-data-row">
                  <span class="account-data-label">⌗ HWID</span>
                  <span class="account-data-val">${user.hwid || '—'}</span>
                </div>
              </div>
            </div>

            <!-- Action Pills Row -->
            <div class="cabinet-actions-row">
              <button class="btn-cabinet-pill" id="btnChangeAvatar">
                <span>🖼</span> <span>Change avatar</span>
              </button>
              <button class="btn-cabinet-pill" id="btnEditEmail">
                <span>✉</span> <span>Edit email</span>
              </button>
              <button class="btn-cabinet-pill" id="btnChangePass">
                <span>🔑</span> <span>Change password</span>
              </button>
              <button class="btn-cabinet-pill" id="btnCopyHwid">
                <span>📋</span> <span>Copy HWID</span>
              </button>
            </div>
          </div>

          <!-- Character Viewport Card (Screenshot 13 & 14) -->
          <div class="character-viewport-card">
            <div class="character-card-label">
              <span>👤</span> <span>CHARACTER</span>
            </div>
            <div class="character-3d-stage" id="characterStage">
              <canvas id="steveCanvas" width="280" height="360"></canvas>
            </div>
            <div class="character-card-foot">
              <h4>Launch the game to link your character</h4>
              <p>Drag to rotate — spins automatically</p>
              <p style="margin-top:8px; color:#52525b">No cosmetics equipped</p>
            </div>
          </div>
        </main>
      </div>
    `;
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

    const ctaDownloadBtn = document.getElementById('ctaDownloadBtn');
    if (ctaDownloadBtn) {
      ctaDownloadBtn.onclick = () => {
        window.location.href = '/downloads/kodexlauncher.exe';
      };
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
            localStorage.setItem('kodex_token', data.token);
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
        localStorage.removeItem('kodex_token');
        state.token = '';
        state.user = null;
        navigate('home');
      };
    }

    const downloadLauncherBtn = document.getElementById('downloadLauncherBtn');
    if (downloadLauncherBtn) {
      downloadLauncherBtn.onclick = () => {
        window.location.href = '/downloads/kodexlauncher.exe';
      };
    }

    const btnCopyHwid = document.getElementById('btnCopyHwid');
    if (btnCopyHwid) {
      btnCopyHwid.onclick = () => {
        const hwid = (state.user && state.user.hwid) ? state.user.hwid : 'NONE';
        navigator.clipboard.writeText(hwid);
        btnCopyHwid.innerText = 'Copied!';
        setTimeout(() => {
          btnCopyHwid.innerHTML = '<span>📋</span> <span>Copy HWID</span>';
        }, 2000);
      };
    }

    const btnChangePass = document.getElementById('btnChangePass');
    if (btnChangePass) {
      btnChangePass.onclick = () => {
        const newPass = prompt('Enter new password:');
        if (newPass && newPass.length >= 6) {
          fetch('/ajax/users/settings/password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: state.token, password: newPass }),
          }).then(() => alert('Password updated successfully!'));
        }
      };
    }

    const btnEditEmail = document.getElementById('btnEditEmail');
    if (btnEditEmail) {
      btnEditEmail.onclick = () => {
        const newEmail = prompt('Enter new email:');
        if (newEmail && newEmail.includes('@')) {
          fetch('/ajax/users/settings/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: state.token, email: newEmail }),
          }).then(() => {
            alert('Email updated!');
            checkSession().then(renderApp);
          });
        }
      };
    }
  }

  // ==========================================================================
  // Interactive 3D Minecraft Steve Character (Canvas 3D Renderer)
  // ==========================================================================
  function init3DCharacter() {
    const canvas = document.getElementById('steveCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rotY = 0.3;
    let rotX = 0.05;
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;

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
        rotX = Math.max(-0.5, Math.min(0.5, rotX));
        lastX = e.clientX;
        lastY = e.clientY;
      };

      // Touch support
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

    // 3D Box Rendering Engine
    function render() {
      if (!isDragging) {
        rotY += 0.012; // Auto rotate smoothly
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2 + 10;

      // Draw subtle shadow below Steve
      ctx.beginPath();
      ctx.ellipse(cx, cy + 140, 50, 14, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fill();

      // Steve Body Parts
      // Head: 28x28x28 at y: -100
      drawCube(ctx, cx, cy - 90, 0, 36, 36, 36, rotX, rotY, '#c49774', '#4a3321', '#2d1e12');
      // Body: 36x48x18 at y: -30 (Cyan shirt)
      drawCube(ctx, cx, cy - 30, 0, 36, 50, 20, rotX, rotY, '#0ea5e9', '#0284c7', '#0369a1');
      // Left Arm: 14x48x14
      drawCube(ctx, cx - 27, cy - 30, 0, 14, 48, 14, rotX, rotY, '#c49774', '#0ea5e9', '#0284c7');
      // Right Arm: 14x48x14
      drawCube(ctx, cx + 27, cy - 30, 0, 14, 48, 14, rotX, rotY, '#c49774', '#0ea5e9', '#0284c7');
      // Left Leg: 16x52x16 (Blue pants)
      drawCube(ctx, cx - 10, cy + 35, 0, 16, 54, 16, rotX, rotY, '#3b43a8', '#2b3184', '#1f2463');
      // Right Leg: 16x52x16
      drawCube(ctx, cx + 10, cy + 35, 0, 16, 54, 16, rotX, rotY, '#3b43a8', '#2b3184', '#1f2463');

      requestAnimationFrame(render);
    }

    function drawCube(ctx, ox, oy, oz, w, h, d, rx, ry, frontCol, sideCol, topCol) {
      const hw = w / 2;
      const hh = h / 2;
      const hd = d / 2;

      // Vertices
      const v = [
        [-hw, -hh, -hd], [hw, -hh, -hd], [hw, hh, -hd], [-hw, hh, -hd],
        [-hw, -hh, hd],  [hw, -hh, hd],  [hw, hh, hd],  [-hw, hh, hd]
      ];

      // Rotate Y then X
      const p = v.map(([x, y, z]) => {
        // Rot Y
        const cosY = Math.cos(ry);
        const sinY = Math.sin(ry);
        const x1 = x * cosY + z * sinY;
        const z1 = -x * sinY + z * cosY;

        // Rot X
        const cosX = Math.cos(rx);
        const sinX = Math.sin(rx);
        const y2 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;

        // Project
        const fov = 350;
        const scale = fov / (fov + z2 + oz);
        return [ox + x1 * scale, oy + y2 * scale, z2];
      });

      // Faces with normal depth sorting
      const faces = [
        { idx: [0, 1, 2, 3], col: frontCol, z: (p[0][2] + p[1][2] + p[2][2] + p[3][2]) / 4 }, // Front
        { idx: [5, 4, 7, 6], col: sideCol,  z: (p[4][2] + p[5][2] + p[6][2] + p[7][2]) / 4 }, // Back
        { idx: [4, 0, 3, 7], col: sideCol,  z: (p[0][2] + p[4][2] + p[7][2] + p[3][2]) / 4 }, // Left
        { idx: [1, 5, 6, 2], col: frontCol, z: (p[1][2] + p[5][2] + p[6][2] + p[2][2]) / 4 }, // Right
        { idx: [4, 5, 1, 0], col: topCol,   z: (p[0][2] + p[1][2] + p[5][2] + p[4][2]) / 4 }, // Top
        { idx: [3, 2, 6, 7], col: sideCol,  z: (p[3][2] + p[2][2] + p[6][2] + p[7][2]) / 4 }, // Bottom
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

    render();
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

  function initSmoothScroll() {
    const navItems = document.querySelectorAll('.header-nav-pill .nav-item[data-target]');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const targetId = item.getAttribute('data-target');
        if (!targetId) return;
        e.preventDefault();
        const el = document.getElementById(targetId);
        if (el) {
          const offsetTop = targetId === 'hero' ? 0 : el.offsetTop - 85;
          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
          });
          navItems.forEach(i => i.classList.remove('active'));
          item.classList.add('active');
        }
      });
    });

    const generalAnchors = document.querySelectorAll('a[href^="#"]:not(.nav-item)');
    generalAnchors.forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const targetId = anchor.getAttribute('href').replace('#', '');
        const el = document.getElementById(targetId);
        if (el) {
          e.preventDefault();
          const offsetTop = targetId === 'hero' ? 0 : el.offsetTop - 85;
          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  function initScrollSpy() {
    const sections = document.querySelectorAll('section[id]');
    const navItems = document.querySelectorAll('.header-nav-pill .nav-item[data-target]');

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          let current = 'hero';
          const scrollPosition = window.scrollY + 120;

          sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            if (scrollPosition >= top && scrollPosition < top + height) {
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
