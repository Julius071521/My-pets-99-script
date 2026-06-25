/* ==========================================================================
   ApexBoost - Frontend Controller (Single-Page Application)
   ========================================================================== */

// SAFETY GUARD: This file is browser-only code.
// If accidentally executed by Node.js (e.g. wrong cPanel/Passenger entrypoint),
// forward to the correct server entry instead of crashing.
if (typeof window === 'undefined' && typeof module !== 'undefined' && typeof require === 'function') {
  require('./server');
  return;
}

const safeFetch = typeof window.fetch === 'function'
  ? window.fetch.bind(window)
  : (url, options = {}) => new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(options.method || 'GET', url, true);

      const headers = options.headers || {};
      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });

      xhr.onload = () => {
        const rawHeaders = xhr.getAllResponseHeaders();
        const responseHeaders = new Map();
        rawHeaders.trim().split(/[\r\n]+/).forEach((line) => {
          if (!line) return;
          const parts = line.split(': ');
          const header = parts.shift();
          responseHeaders.set(header.toLowerCase(), parts.join(': '));
        });

        resolve({
          ok: xhr.status >= 200 && xhr.status < 300,
          status: xhr.status,
          statusText: xhr.statusText,
          headers: {
            get(name) {
              return responseHeaders.get(name.toLowerCase()) || null;
            }
          },
          json: async () => JSON.parse(xhr.responseText || 'null'),
          text: async () => xhr.responseText
        });
      };

      xhr.onerror = () => reject(new TypeError('Network request failed'));
      xhr.send(options.body || null);
    });

document.addEventListener('DOMContentLoaded', () => {
  // Programmatic scroll-lock override
  const originalScrollTo = window.scrollTo;
  window.scrollTo = function(x, y) {
    if (document.body.classList.contains('body-scroll-locked')) {
      const savedScrollY = parseInt(document.body.dataset.scrollLockY || '0', 10) || 0;
      if (typeof x === 'object') {
        if (x.top === savedScrollY) {
          originalScrollTo.apply(window, arguments);
        }
      } else if (typeof x === 'number' && y === savedScrollY) {
        originalScrollTo.apply(window, arguments);
      }
      return;
    }
    originalScrollTo.apply(window, arguments);
  };

  // Prevent background touchmove scroll leaking on mobile
  document.addEventListener('touchmove', (e) => {
    if (document.body.classList.contains('body-scroll-locked')) {
      const scrollable = e.target.closest('.nav-menu, .dash-sidebar, .updates-dropdown-menu, .auth-card, .auth-modal-overlay, .auth-form, .captcha-wrap, .compare-modal-card, .ticket-chat-overlay, .dash-viewport-container');
      if (!scrollable) {
        e.preventDefault();
      }
    }
  }, { passive: false });

  // Global toast notification utility
  window.apexToast = function(message, type = 'info', duration = 4000) {
    const container = document.getElementById('apex-toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `apex-toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(4px)';
      setTimeout(() => toast.remove(), 320);
    }, duration);
  };

  // Hoisted DOM element variables to prevent Temporal Dead Zone / lexical scoping issues
  let landingPageView, dashboardPageView, termsPageView, termsBackToHomeBtn, registerTermsLink, registerPrivacyLink, mainNavbar;
  let logoBtn, navHome, navFeatures, navDashboardTrigger, startBoostingBtn, browseServicesPromoBtn, promoEnterDashBtn, logoutToLandingBtn, themeToggleBtn, currentModeBadge, refreshBalanceBtn;
  let authModal, authCloseBtn, tabLoginBtn, tabRegisterBtn, loginForm, registerForm, authErrorAlert, navLoginBtn, navLogoutBtn;
  let registerStep1, registerStep2, registerNextBtn, registerBackBtn, registerTurnstileStatus, loginTurnstileStatus;
  let loginTurnstileWidgetId = null;
  let loginTurnstileToken = '';
  let registerTurnstileWidgetId = null;
  let registerTurnstileToken = '';
  let resolvedTurnstileSiteKey = '';
  let triggerForgotBtn, forgotForm, forgotUsernameEmail, forgotVerifyBtn, forgotStateVerify, forgotStateReset, verifiedUserName, verifiedUserEmail, forgotOtpCode, forgotNewPassword, forgotConfirmPassword, btnSubmitNewPassword, forgotBackToLoginBtn, forgotResendCodeBtn, forgotResendCountdown;
  let registerOtpForm, registerOtpCode, registerOtpTargetEmail, registerOtpResendBtn, registerOtpCountdown, registerOtpBackBtn;
  let registerOtpEmail = '';
  let registerOtpCooldownTimer = null;
  let forgotResendCooldownTimer = null;
  let sidebarTabAdmin, adminUserSearch, adminSearchBtn, adminResultsBox;
  let recoveryIdentifier = '';
  let sidebarLinks, dashTabContents;
  let orderForm, orderCategorySelect, orderServiceSelect, orderUrlInput, orderQuantityInput, serviceSpecsBox, specRateSpan, specMinSpan, specMaxSpan, specTypeSpan, calcRatePer1k, calcTotalCharge, quantityLimitsTip, submitOrderBtn, orderFormAlert, resetMockBalanceBtn;
  let servicesTableBody, servicesSearchInput, servicesCatFilter, directoryCatCustomDropdown, directoryCatDropdownTrigger, directoryCatTriggerIcon, directoryCatDropdownMenu;
  let ordersTableBody, ordersSearchInput, ordersStatusFilters, refreshHistoryBtn, historyAlert;
  let apiEndpointDisplay, subtabBtns, subtabContents;
  let serverStatusDot, serverStatusTitle, serverStatusDesc, settingsStatusAlert, saveSettingsBtn, radioModeDemo, radioModeLive, radioModeDemoLabel, radioModeLiveLabel, settingsForm;
  let promoServicesGrid, promoCatFilters;
  let orderPlatformTabs, directoryPlatformTabs;

  function queryAllDashboardElements() {
    landingPageView = document.getElementById('landing-page-view');
    dashboardPageView = document.getElementById('dashboard-page-view');
    termsPageView = document.getElementById('terms-page-view');
    termsBackToHomeBtn = document.getElementById('terms-back-to-home-btn');
    registerTermsLink = document.getElementById('register-terms-link');
    registerPrivacyLink = document.getElementById('register-privacy-link');
    mainNavbar = document.getElementById('main-nav');

    logoBtn = document.getElementById('logo-btn');
    navHome = document.getElementById('nav-home');
    navFeatures = document.getElementById('nav-features');
    navDashboardTrigger = document.getElementById('nav-dashboard-trigger');
    startBoostingBtn = document.getElementById('start-boosting-btn');
    browseServicesPromoBtn = document.getElementById('browse-services-promo-btn');
    promoEnterDashBtn = document.getElementById('promo-enter-dash-btn');
    logoutToLandingBtn = document.getElementById('logout-to-landing-btn');
    themeToggleBtn = document.getElementById('theme-toggle');
    currentModeBadge = document.getElementById('current-mode-badge');
    refreshBalanceBtn = document.getElementById('refresh-balance-btn');

    authModal = document.getElementById('auth-modal');
    authCloseBtn = document.getElementById('auth-close-btn');
    tabLoginBtn = document.getElementById('tab-login-btn');
    tabRegisterBtn = document.getElementById('tab-register-btn');
    loginForm = document.getElementById('login-form');
    registerForm = document.getElementById('register-form');
    registerStep1 = document.getElementById('register-step-1');
    registerStep2 = document.getElementById('register-step-2');
    registerNextBtn = document.getElementById('register-next-btn');
    registerBackBtn = document.getElementById('register-back-btn');
    registerTurnstileStatus = document.getElementById('register-turnstile-status');
    loginTurnstileStatus = document.getElementById('login-turnstile-status');
    authErrorAlert = document.getElementById('auth-error-alert');
    navLoginBtn = document.getElementById('nav-login-btn');
    navLogoutBtn = document.getElementById('nav-logout-btn');

    triggerForgotBtn = document.getElementById('trigger-forgot-btn');
    forgotForm = document.getElementById('forgot-form');
    forgotUsernameEmail = document.getElementById('forgot-username-email');
    forgotVerifyBtn = document.getElementById('forgot-verify-btn');
    forgotStateVerify = document.getElementById('forgot-state-verify');
    forgotStateReset = document.getElementById('forgot-state-reset');
    verifiedUserName = document.getElementById('verified-user-name');
    verifiedUserEmail = document.getElementById('verified-user-email');
    forgotOtpCode = document.getElementById('forgot-otp-code');
    forgotNewPassword = document.getElementById('forgot-new-password');
    forgotConfirmPassword = document.getElementById('forgot-confirm-password');
    btnSubmitNewPassword = document.getElementById('btn-submit-new-password');
    forgotBackToLoginBtn = document.getElementById('forgot-back-to-login-btn');
    forgotResendCodeBtn = document.getElementById('forgot-resend-code-btn');
    forgotResendCountdown = document.getElementById('forgot-resend-countdown');

    registerOtpForm = document.getElementById('register-otp-form');
    registerOtpCode = document.getElementById('register-otp-code');
    registerOtpTargetEmail = document.getElementById('register-otp-target-email');
    registerOtpResendBtn = document.getElementById('register-otp-resend-btn');
    registerOtpCountdown = document.getElementById('register-otp-countdown');
    registerOtpBackBtn = document.getElementById('register-otp-back-btn');

    sidebarTabAdmin = document.getElementById('sidebar-tab-admin');
    adminUserSearch = document.getElementById('admin-user-search');
    adminSearchBtn = document.getElementById('admin-search-btn');
    adminResultsBox = document.getElementById('admin-results-box');

    sidebarLinks = document.querySelectorAll('.sidebar-link');
    dashTabContents = document.querySelectorAll('.dash-tab-content');

    orderForm = document.getElementById('smm-order-form');
    orderCategorySelect = document.getElementById('order-category');
    orderServiceSelect = document.getElementById('order-service');
    orderUrlInput = document.getElementById('order-url');
    orderQuantityInput = document.getElementById('order-quantity');
    serviceSpecsBox = document.getElementById('service-specs');
    specRateSpan = document.getElementById('spec-rate');
    specMinSpan = document.getElementById('spec-min');
    specMaxSpan = document.getElementById('spec-max');
    specTypeSpan = document.getElementById('spec-type');
    calcRatePer1k = document.getElementById('calc-rate-per-1k');
    calcTotalCharge = document.getElementById('calc-total-charge');
    quantityLimitsTip = document.getElementById('quantity-limits-tip');
    submitOrderBtn = document.getElementById('submit-order-btn');
    orderFormAlert = document.getElementById('order-form-alert');
    resetMockBalanceBtn = document.getElementById('reset-mock-balance-btn');

    servicesTableBody = document.getElementById('services-table-body');
    servicesSearchInput = document.getElementById('services-search-input');
    servicesCatFilter = document.getElementById('services-cat-filter');
    directoryCatCustomDropdown = document.getElementById('directory-cat-custom-dropdown');
    directoryCatDropdownTrigger = document.getElementById('directory-cat-dropdown-trigger');
    directoryCatTriggerIcon = document.getElementById('directory-cat-trigger-icon');
    directoryCatDropdownMenu = document.getElementById('directory-cat-dropdown-menu');

    ordersTableBody = document.getElementById('orders-table-body');
    ordersSearchInput = document.getElementById('orders-search-input');
    ordersStatusFilters = document.getElementById('orders-status-filters');
    refreshHistoryBtn = document.getElementById('refresh-history-btn');
    historyAlert = document.getElementById('history-alert');

    apiEndpointDisplay = document.getElementById('api-endpoint-display');
    subtabBtns = document.querySelectorAll('.subtab-btn');
    subtabContents = document.querySelectorAll('.subtab-content');

    serverStatusDot = document.getElementById('server-status-dot');
    serverStatusTitle = document.getElementById('server-status-title');
    serverStatusDesc = document.getElementById('server-status-desc');
    settingsStatusAlert = document.getElementById('settings-status-alert');
    saveSettingsBtn = document.getElementById('save-settings-btn');
    radioModeDemo = document.getElementById('radio-mode-demo');
    radioModeLive = document.getElementById('radio-mode-live');
    radioModeDemoLabel = document.getElementById('radio-mode-demo-label');
    radioModeLiveLabel = document.getElementById('radio-mode-live-label');
    settingsForm = document.getElementById('proxy-mode-settings-form');

    promoServicesGrid = document.getElementById('promo-services-list');
    promoCatFilters = document.getElementById('promo-cat-filters');

    orderPlatformTabs = document.getElementById('order-platform-tabs');
    directoryPlatformTabs = document.getElementById('directory-platform-tabs');
  }

  queryAllDashboardElements();

  function cleanSmmText(text) {
    if (typeof text !== 'string') return text;
    text = text.replace(/High Sped/gi, 'High Speed');
    text = text.replace(/Global DaTa/gi, 'Global Data');
    text = text.replace(/atsApp Unba-nned For After 0-24 Hours/gi, 'WhatsApp Unbanned After 0–24 Hours');
    text = text.replace(/WhatsApp Unba-nned For After 0-12 Hours/gi, 'WhatsApp Unbanned After 0–12 Hours');
    text = text.replace(/atsApp/g, 'WhatsApp');
    text = text.replace(/WhatsApp Unba-nned/gi, 'WhatsApp Unbanned');
    text = text.replace(/Unba-nned/gi, 'Unbanned');
    text = text.replace(/p(\d+\.\d{2})/gi, '₱$1');
    return text;
  }

  function getAuthToken() {
    return localStorage.getItem('apexboost_token') || '';
  }

  async function request(url, options = {}) {
    const headers = {
      ...(options.headers || {})
    };
    const token = getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return safeFetch(url, {
      ...options,
      headers
    });
  }

  // Helper to reset deposit flow elements
  function resetDepositFlow() {
    // Show reveal button
    const btnStartDeposit = document.getElementById('btn-start-deposit');
    if (btnStartDeposit) btnStartDeposit.classList.remove('hidden');
    
    // Hide proof fields and QR card
    const proofWrapper = document.getElementById('payment-proof-submission-wrapper');
    if (proofWrapper) proofWrapper.classList.add('hidden');
    
    const dynamicQrCard = document.getElementById('dynamic-qr-card');
    if (dynamicQrCard) dynamicQrCard.classList.add('hidden');

    // Reset spans
    document.querySelectorAll('[id^="reveal-"]').forEach(span => {
      span.textContent = "Hidden until secure flow begins.";
    });
  }

  // Utility to render animated glassmorphic table skeleton rows
  function showTableSkeleton(tbody, cols, numRows = 3) {
    if (!tbody) return;
    let html = '';
    for (let r = 0; r < numRows; r++) {
      html += `
        <tr class="skeleton-row">
          ${Array(cols).fill(0).map((_, c) => {
            let width = '60%';
            if (c === 0) width = '45%';
            else if (c === 1) width = '75%';
            else if (c === 2) width = '85%';
            else if (c === 3) width = '55%';
            return `<td><div class="skeleton-line" style="width: ${width}; height: 12px; margin: 4px auto;"></div></td>`;
          }).join('')}
        </tr>
      `;
    }
    tbody.innerHTML = html;
  }

  let dashboardLoaded = false;
  async function ensureDashboardLoaded() {
    if (dashboardLoaded) return true;

    const dynamicContentContainer = document.getElementById('dashboard-dynamic-content');
    if (!dynamicContentContainer) return false;

    // Show secure loading screen
    dynamicContentContainer.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; gap: 1rem; text-align: center;">
        <div class="spinner"></div>
        <p style="color: var(--accent); font-weight: 600; font-size: 1rem; margin: 0; letter-spacing: 0.5px;">🔐 SECURITY ENFORCEMENT</p>
        <p style="color: var(--text-muted); font-size: 0.82rem; margin: 0;">Loading secure SMM control desk from server...</p>
      </div>
    `;
    dynamicContentContainer.classList.remove('hidden');

    try {
      const response = await request('/api/user/dashboard-html');
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('apexboost_token');
        localStorage.removeItem('apexboost_user');
        state.user = null;
        dashboardLoaded = false;
        dynamicContentContainer.innerHTML = '';
        dynamicContentContainer.classList.add('hidden');
        updateUserUI();
        switchView('landing');
        showPremiumToast("Session Expired", "Your secure session has expired. Please log in again.", "error");
        return false;
      }
      if (!response.ok) {
        throw new Error("HTTP error " + response.status + " fetching dashboard template.");
      }
      const htmlText = await response.text();
      dynamicContentContainer.innerHTML = htmlText;
      dashboardLoaded = true;

      // Re-query all dashboard DOM elements!
      queryAllDashboardElements();

      // Bind dynamic dashboard event listeners!
      bindDashboardEventListeners();

      // Sync active settings and badges
      updateSettingsPanelStatus();
      updateBadgeUI();
      checkMaintenanceButtonState();

      // Bind visibility toggles for dynamically injected forms (e.g. Change Password)
      setupPasswordVisibilityToggles();

      return true;
    } catch (err) {
      console.error("Failed to load customer dashboard dynamically:", err);
      const isProduction = window.location.hostname === 'apexsmmboosting.com';
      const userMessage = isProduction 
        ? 'Dashboard failed to load. Please try again or contact support.' 
        : err.message;
      dynamicContentContainer.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem 2rem; gap: 1rem; border: 1px dashed var(--danger); border-radius: 12px; background: rgba(239,68,68,0.03); text-align: center;">
          <span style="font-size: 2rem;">⚠️</span>
          <p style="color: var(--danger); font-weight: 700; margin: 0;">Failed to Load Customer Dashboard</p>
          <p style="color: var(--text-muted); font-size: 0.8rem; margin: 0; max-width: 320px;">${userMessage}</p>
          <button class="btn btn-secondary btn-sm" id="btn-retry-dashboard-load" style="margin-top: 10px;">Retry Loading 🔄</button>
        </div>
      `;
      const retryBtn = document.getElementById('btn-retry-dashboard-load');
      if (retryBtn) {
        retryBtn.addEventListener('click', ensureDashboardLoaded);
      }
      return false;
    }
  }

  function bindDashboardEventListeners() {
    // Responsive Mobile Sidebar Toggle
    const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
    const dashSidebar = document.querySelector('.dash-sidebar');
    const sidebarBackdrop = document.getElementById('sidebar-backdrop');
    if (sidebarToggleBtn && dashSidebar && sidebarBackdrop) {
      const toggleSidebar = (e) => {
        e && e.stopPropagation();
        const isOpen = dashSidebar.classList.toggle('mobile-open');
        sidebarToggleBtn.classList.toggle('active');
        if (isOpen) {
          sidebarBackdrop.classList.remove('hidden');
          // Close notifications dropdown if open
          const updatesDropdown = document.getElementById('updates-dropdown');
          const updatesBackdrop = document.getElementById('updates-dropdown-backdrop');
          const notifWrap = document.getElementById('nav-notification-wrap');
          if (updatesDropdown) updatesDropdown.classList.add('hidden');
          if (updatesBackdrop) updatesBackdrop.classList.add('hidden');
          if (notifWrap) notifWrap.classList.remove('active');

          // Close profile dropdown if open
          const profileDropdown = document.getElementById('profile-dropdown');
          const navUserProfile = document.getElementById('nav-user-profile');
          if (profileDropdown) profileDropdown.classList.add('hidden');
          if (navUserProfile) navUserProfile.classList.remove('active');
        } else {
          sidebarBackdrop.classList.add('hidden');
        }
        syncAppShellState();
      };
      
      sidebarToggleBtn.addEventListener('click', toggleSidebar);
      
      sidebarBackdrop.addEventListener('click', () => {
        closeMobileSidebar();
      });

      const mobileMenuBtn = document.getElementById('mobile-dash-menu-btn');
      if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleSidebar);
      }
      
      dashSidebar.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', () => {
          closeMobileSidebar();
        });
      });

      // Swipe Left to close Mobile Sidebar
      let touchStartX = 0;
      dashSidebar.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });
      
      dashSidebar.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].screenX;
        if (touchStartX - touchEndX > 50) { // Swiped left by more than 50px
          closeMobileSidebar();
        }
      }, { passive: true });
    }

    // Sidebar tab clicks
    if (sidebarLinks) {
      sidebarLinks.forEach(link => {
        link.addEventListener('click', () => {
          const targetTab = link.getAttribute('data-tab');
          if (targetTab) {
            switchTab(targetTab);
          }
        });
      });
    }

    // Subtabs switcher (Developer API Code blocks)
    if (subtabBtns) {
      subtabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const targetSubtab = btn.getAttribute('data-subtab');
          subtabBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          subtabContents.forEach(pane => {
            if (pane.id === `subtab-${targetSubtab}`) {
              pane.classList.remove('hidden');
            } else {
              pane.classList.add('hidden');
            }
          });
        });
      });
    }

    // Service dropdown change cascade
    if (orderCategorySelect) {
      orderCategorySelect.addEventListener('change', () => {
        populateServicesDropdownForCategory(orderCategorySelect.value);
        if (typeof updateCustomDropdownTriggerText === 'function') {
          updateCustomDropdownTriggerText();
        }
      });
    }

    // Premium Custom Category Dropdown Wrapper (Click Handler)
    const catDropdown = document.getElementById('category-custom-dropdown');
    const catMenu = document.getElementById('category-dropdown-menu');
    if (catDropdown && catMenu) {
      catDropdown.addEventListener('click', (e) => {
        if (catMenu.contains(e.target)) return;
        e.stopPropagation();
        if (catDropdown.classList.contains('disabled')) return;
        const isActive = catDropdown.classList.toggle('active');
        if (isActive) {
          catMenu.classList.remove('hidden');
          if (orderForm) orderForm.classList.add('is-category-dropdown-open');
        } else {
          catMenu.classList.add('hidden');
          if (orderForm) orderForm.classList.remove('is-category-dropdown-open');
        }
      });
    }

    // Premium Custom Directory Category Dropdown Wrapper (Click Handler)
    const dirCatDropdown = document.getElementById('directory-cat-custom-dropdown');
    const dirCatMenu = document.getElementById('directory-cat-dropdown-menu');
    if (dirCatDropdown && dirCatMenu) {
      dirCatDropdown.addEventListener('click', (e) => {
        if (dirCatMenu.contains(e.target)) return;
        e.stopPropagation();
        if (dirCatDropdown.classList.contains('disabled')) return;
        const isActive = dirCatDropdown.classList.toggle('active');
        if (isActive) {
          dirCatMenu.classList.remove('hidden');
        } else {
          dirCatMenu.classList.add('hidden');
        }
      });
    }

    if (orderServiceSelect) {
      orderServiceSelect.addEventListener('change', () => {
        handleServiceSelectionChange(orderServiceSelect.value);
        if (typeof updateCustomPackageTriggerText === 'function') {
          updateCustomPackageTriggerText();
        }
      });
    }

    // Premium Custom Package Dropdown Wrapper (Click Handler)
    const pkgDropdown = document.getElementById('package-custom-dropdown');
    const pkgMenu = document.getElementById('package-dropdown-menu');
    if (pkgDropdown && pkgMenu) {
      pkgDropdown.addEventListener('click', (e) => {
        if (pkgMenu.contains(e.target)) return;
        e.stopPropagation();
        if (pkgDropdown.classList.contains('disabled')) return;
        const isActive = pkgDropdown.classList.toggle('active');
        if (isActive) {
          pkgMenu.classList.remove('hidden');
          if (orderForm) orderForm.classList.add('is-package-dropdown-open');
        } else {
          pkgMenu.classList.add('hidden');
          if (orderForm) orderForm.classList.remove('is-package-dropdown-open');
        }
      });
    }

    // Dynamic price calculation
    if (orderQuantityInput) {
      orderQuantityInput.addEventListener('input', calculateOrderCost);
    }
    
    // Balance Manual Refresh
    if (refreshBalanceBtn) {
      refreshBalanceBtn.addEventListener('click', syncUserBalance);
    }

    const quickOrderBtn = document.getElementById('user-summary-quick-order-btn');
    if (quickOrderBtn) {
      quickOrderBtn.addEventListener('click', () => switchTab('new-order'));
    }

    const summarySupportBtn = document.getElementById('summary-support-btn');
    if (summarySupportBtn) {
      summarySupportBtn.addEventListener('click', () => switchTab('support-tickets'));
    }

    // Form submission
    if (orderForm) {
      orderForm.addEventListener('submit', handleOrderSubmission);
    }

    // Reset balance shortcut
    if (resetMockBalanceBtn) {
      resetMockBalanceBtn.addEventListener('click', resetDemoBalance);
    }

    // Services Directory Filtering
    if (servicesSearchInput) {
      servicesSearchInput.addEventListener('input', filterServicesDirectory);
    }
    if (servicesCatFilter) {
      servicesCatFilter.addEventListener('change', filterServicesDirectory);
    }

    // Orders History search & filter
    if (ordersSearchInput) {
      ordersSearchInput.addEventListener('input', filterOrdersHistory);
    }
    if (ordersStatusFilters) {
      ordersStatusFilters.addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-pill')) {
          const filters = ordersStatusFilters.querySelectorAll('.filter-pill');
          filters.forEach(f => f.classList.remove('active'));
          e.target.classList.add('active');
          filterOrdersHistory();
        }
      });
    }
    if (refreshHistoryBtn) {
      refreshHistoryBtn.addEventListener('click', () => syncOrdersStatus());
    }

    // Settings Mode toggle change
    if (radioModeDemo) {
      radioModeDemo.addEventListener('change', handleRadioModeChange);
    }
    if (radioModeLive) {
      radioModeLive.addEventListener('change', handleRadioModeChange);
    }
    if (settingsForm) {
      settingsForm.addEventListener('submit', saveModeSettings);
    }

    // Platform Selector Tabs in New Order Form
    if (orderPlatformTabs) {
      orderPlatformTabs.addEventListener('click', (e) => {
        const tab = e.target.closest('.platform-tab');
        if (!tab) return;
        orderPlatformTabs.querySelectorAll('.platform-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        state.selectedOrderPlatform = tab.getAttribute('data-platform');
        populateNewOrderDropdowns();
      });
    }

    // Platform Selector Tabs in Services Directory
    if (directoryPlatformTabs) {
      directoryPlatformTabs.addEventListener('click', (e) => {
        const tab = e.target.closest('.platform-tab');
        if (!tab) return;
        directoryPlatformTabs.querySelectorAll('.platform-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        state.selectedDirectoryPlatform = tab.getAttribute('data-platform');
        populateServicesDirectoryFilters(); // Update category filter dropdown options dynamically!
        renderServicesDirectory();
      });
    }

    if (logoutToLandingBtn) {
      logoutToLandingBtn.addEventListener('click', () => handleLogout());
    }

    // Copy API key to clipboard
    const btnCopyApiKey = document.getElementById('btn-copy-api-key');
    if (btnCopyApiKey) {
      btnCopyApiKey.addEventListener('click', () => {
        const keyDisplay = document.getElementById('developer-api-key-display');
        if (!keyDisplay) return;
        const keyText = keyDisplay.dataset.fullKey || keyDisplay.textContent;
        if (keyText && !keyText.includes('•') && keyText !== 'apx_your_api_key_here' && keyText !== 'apx_...') {
          navigator.clipboard.writeText(keyText).then(() => {
            btnCopyApiKey.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Copied!`;
            btnCopyApiKey.style.borderColor = "var(--success)";
            btnCopyApiKey.style.color = "var(--success)";
            setTimeout(() => {
              btnCopyApiKey.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy`;
              btnCopyApiKey.style.borderColor = "";
              btnCopyApiKey.style.color = "";
            }, 2000);
          }).catch(err => console.error("Clipboard copy failed:", err));
        }
      });
    }

    // Toggle API key reveal/mask
    const btnToggleApiKey = document.getElementById('btn-toggle-api-key');
    if (btnToggleApiKey) {
      btnToggleApiKey.addEventListener('click', () => {
        const keyDisplay = document.getElementById('developer-api-key-display');
        if (!keyDisplay) return;
        const isRevealed = btnToggleApiKey.getAttribute('aria-pressed') === 'true';
        if (isRevealed) {
          const full = keyDisplay.dataset.fullKey;
          if (full) keyDisplay.textContent = full.substring(0, 7) + '••••••••••••••••••••••••••••••••';
          keyDisplay.classList.add('masked');
          btnToggleApiKey.setAttribute('aria-pressed', 'false');
          btnToggleApiKey.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> Reveal`;
        } else {
          const full = keyDisplay.dataset.fullKey;
          if (full) { keyDisplay.textContent = full; keyDisplay.classList.remove('masked'); }
          btnToggleApiKey.setAttribute('aria-pressed', 'true');
          btnToggleApiKey.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg> Hide`;
        }
      });
    }

    // Generate API Key
    const btnGenerateApiKey = document.getElementById('btn-generate-api-key');
    if (btnGenerateApiKey) {
      btnGenerateApiKey.addEventListener('click', async () => {
        const alert = document.getElementById('api-key-alert');
        if (!confirm('Regenerate your API key? All existing integrations using the old key will stop working immediately.')) return;
        btnGenerateApiKey.disabled = true;
        btnGenerateApiKey.textContent = 'Generating…';
        try {
          const res = await safeFetch('/api/user/api-key/generate', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.authToken}` } });
          const data = await res.json();
          if (res.ok && (data.apiKey || data.api_key)) {
            const generatedKey = data.apiKey || data.api_key;
            const keyDisplay = document.getElementById('developer-api-key-display');
            if (keyDisplay) {
              keyDisplay.dataset.fullKey = generatedKey;
              keyDisplay.textContent = generatedKey;
              keyDisplay.classList.remove('masked');
              const btnToggle = document.getElementById('btn-toggle-api-key');
              if (btnToggle) { btnToggle.setAttribute('aria-pressed', 'true'); btnToggle.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg> Hide`; }
            }
            if (state.user) state.user.apiKey = generatedKey;
            if (alert) { alert.className = 'order-status-alert success'; alert.textContent = 'New API key generated. Copy it now — it will be masked on next page load.'; }
          } else {
            if (alert) { alert.className = 'order-status-alert error'; alert.textContent = data.error || 'Failed to generate API key.'; }
          }
        } catch (e) {
          if (alert) { alert.className = 'order-status-alert error'; alert.textContent = 'Network error. Please try again.'; }
        } finally {
          btnGenerateApiKey.disabled = false;
          btnGenerateApiKey.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> Regenerate Key`;
        }
      });
    }

    // Revoke API Key
    const btnRevokeApiKey = document.getElementById('btn-revoke-api-key');
    if (btnRevokeApiKey) {
      btnRevokeApiKey.addEventListener('click', async () => {
        const alert = document.getElementById('api-key-alert');
        if (!confirm('Revoke your API key? All API access will be immediately disabled. You can generate a new key at any time.')) return;
        btnRevokeApiKey.disabled = true;
        btnRevokeApiKey.textContent = 'Revoking…';
        try {
          const res = await safeFetch('/api/user/api-key', { method: 'DELETE', headers: { 'Authorization': `Bearer ${state.authToken}` } });
          const data = await res.json();
          if (res.ok) {
            const keyDisplay = document.getElementById('developer-api-key-display');
            if (keyDisplay) { keyDisplay.dataset.fullKey = ''; keyDisplay.textContent = 'apx_••••••••••••••••••••••••••••••••'; keyDisplay.classList.add('masked'); }
            if (state.user) state.user.apiKey = '';
            const badge = document.getElementById('api-key-status-badge');
            if (badge) { badge.textContent = 'Revoked'; badge.className = 'api-key-status-badge revoked'; }
            if (alert) { alert.className = 'order-status-alert success'; alert.textContent = 'API key revoked successfully.'; }
          } else {
            if (alert) { alert.className = 'order-status-alert error'; alert.textContent = data.error || 'Failed to revoke API key.'; }
          }
        } catch (e) {
          if (alert) { alert.className = 'order-status-alert error'; alert.textContent = 'Network error. Please try again.'; }
        } finally {
          btnRevokeApiKey.disabled = false;
          btnRevokeApiKey.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> Revoke Key`;
        }
      });
    }

    // Account settings — password strength for change-password-new
    const changePasswordNew = document.getElementById('change-password-new');
    if (changePasswordNew) {
      changePasswordNew.addEventListener('input', () => updateAccountPasswordStrength(changePasswordNew.value));
    }

    // PREMIUM TABS & SERVICES SEARCH BINDINGS
    document.querySelectorAll('.top-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tabName = btn.getAttribute('data-dash-tab');
        switchTab(tabName);
      });
    });

    const dashCustomSearch = document.getElementById('dash-custom-service-search');
    if (dashCustomSearch) {
      dashCustomSearch.addEventListener('input', () => {
        const rawQuery = dashCustomSearch.value.trim();
        const query = rawQuery.toLowerCase();
        const searchMenu = document.getElementById('search-autocomplete-menu');
        if (!searchMenu) return;
        if (!query) {
          searchMenu.innerHTML = '';
          searchMenu.classList.add('hidden');
          return;
        }

        // Check active tab behavior first
        if (state.activeTab === 'add-funds') {
          if (!state.userDeposits) state.userDeposits = [];
          const filteredDeposits = state.userDeposits.filter(d => 
            d.id.toString().includes(query) || 
            (d.reference_id || d.referenceId || '').toLowerCase().includes(query)
          );

          if (filteredDeposits.length === 0) {
            searchMenu.innerHTML = `<div class="autocomplete-no-results" style="padding: 12px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">No deposits found for "${rawQuery}"</div>`;
            searchMenu.classList.remove('hidden');
          } else {
            searchMenu.innerHTML = '';
            searchMenu.classList.remove('hidden');
            filteredDeposits.slice(0, 10).forEach(d => {
              const item = document.createElement('div');
              item.className = 'autocomplete-item';
              item.style.display = 'flex';
              item.style.justify = 'space-between';
              item.style.alignItems = 'center';
              item.style.padding = '10px 12px';
              item.style.cursor = 'pointer';
              item.style.borderBottom = '1px solid var(--border-color)';
              
              let statusColor = 'var(--text-muted)';
              if (d.status === 'Approved') statusColor = 'var(--success)';
              if (d.status === 'Pending') statusColor = 'var(--warning)';
              if (d.status === 'Rejected') statusColor = 'var(--danger)';
              
              item.innerHTML = `
                <div style="display: flex; gap: 8px; align-items: center;">
                  <span style="font-size: 1.1rem;">💳</span>
                  <div style="display: flex; flex-direction: column; text-align: left;">
                    <strong style="color: var(--text-primary); font-size: 0.82rem;">ID: #${d.id} (${d.payment_method || d.paymentMethod})</strong>
                    <span style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">Ref: ${d.reference_id || d.referenceId}</span>
                  </div>
                </div>
                <div style="display: flex; flex-direction: column; align-items: flex-end;">
                  <strong style="color: var(--primary); font-size: 0.85rem;">₱${parseFloat(d.amount).toFixed(2)}</strong>
                  <span style="font-size: 0.7rem; color: ${statusColor}; font-weight: 600; margin-top: 2px;">${d.status}</span>
                </div>
              `;
              
              item.addEventListener('click', () => {
                dashCustomSearch.value = `[Addfunds ID: #${d.id}] Ref: ${d.reference_id || d.referenceId}`;
                searchMenu.classList.add('hidden');
                const refInput = document.getElementById('funds-reference');
                if (refInput) {
                  refInput.value = d.reference_id || d.referenceId;
                }
                const amountInput = document.getElementById('funds-amount');
                if (amountInput) {
                  amountInput.value = d.amount;
                }
                showPremiumToast("Addfunds Loaded", `Loaded Ref ID ${d.reference_id || d.referenceId} details into form.`, "success");
              });
              searchMenu.appendChild(item);
            });
          }
          return;
        }
        
        // Exact ID Check
        const exactMatch = state.services.find(s => s.service.toString() === query);
        if (exactMatch) {
          selectServiceFromSearch(exactMatch);
          dashCustomSearch.value = `[ID: ${exactMatch.service}] ${exactMatch.name}`;
          searchMenu.classList.add('hidden');
          return;
        }
        
        let searchTerms = query.split(/\s+/);
        searchTerms = searchTerms.map(t => {
          if (t === 'ig') return 'instagram';
          if (t === 'fb') return 'facebook';
          if (t === 'yt') return 'youtube';
          if (t === 'tt') return 'tiktok';
          if (t === 'tg') return 'telegram';
          return t;
        });
        
        const filtered = state.services.filter(s => {
          const content = `${s.service} ${s.name} ${s.category}`.toLowerCase();
          return searchTerms.every(term => content.includes(term));
        });
        
        if (filtered.length === 0) {
          searchMenu.innerHTML = `<div class="autocomplete-no-results" style="padding: 12px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">No services found for "${rawQuery}"</div>`;
          searchMenu.classList.remove('hidden');
        } else {
          searchMenu.innerHTML = '';
          searchMenu.classList.remove('hidden');
          filtered.slice(0, 15).forEach(s => {
            const platform = getPlatformFromCategory(s.category);
            let logoHtml = '🌐';
            if (platform !== 'other' && platform !== 'all') {
              logoHtml = `<img src="/images/${platform}.png" alt="${platform}" class="autocomplete-item-logo" style="width: 16px; height: 16px; object-fit: contain;">`;
            }
            
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.style.display = 'flex';
            item.style.justify = 'space-between';
            item.style.alignItems = 'center';
            item.style.padding = '10px 12px';
            item.style.cursor = 'pointer';
            item.style.borderBottom = '1px solid rgba(255,255,255,0.03)';
            
            item.innerHTML = `
              <div class="autocomplete-item-left" style="display: flex; align-items: center; gap: 12px; max-width: 75%;">
                <div class="autocomplete-item-logo-wrap" style="display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; background: var(--input-bg); border-radius: 6px; border: 1px solid var(--border-color); flex-shrink: 0;">
                  ${logoHtml}
                </div>
                <div class="autocomplete-item-info" style="display: flex; flex-direction: column; gap: 3px; text-align: left;">
                  <span class="autocomplete-item-id" style="font-size: 0.72rem; font-weight: 800; color: var(--primary); letter-spacing: 0.05em;">#${s.service}</span>
                  <span class="autocomplete-item-name" style="font-size: 0.8rem; font-weight: 600; color: var(--text-primary); line-height: 1.3;">${s.name}</span>
                </div>
              </div>
              <span class="autocomplete-item-rate" style="font-size: 0.82rem; font-weight: 700; color: var(--success); background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2); padding: 2px 8px; border-radius: 6px; flex-shrink: 0;">₱${parseFloat(s.rate).toFixed(2)}/1K</span>
            `;
            
            item.addEventListener('click', () => {
              selectServiceFromSearch(s);
              dashCustomSearch.value = `[ID: ${s.service}] ${s.name}`;
            });
            searchMenu.appendChild(item);
          });
        }
      });

      dashCustomSearch.addEventListener('focus', () => {
        if (dashCustomSearch.value.trim() !== "") {
          dashCustomSearch.dispatchEvent(new Event('input'));
        }
      });
    }

    // Auto-close search autocomplete and custom dropdowns when clicking outside
    document.addEventListener('click', (e) => {
      const searchMenu = document.getElementById('search-autocomplete-menu');
      if (searchMenu && !searchMenu.contains(e.target) && e.target !== dashCustomSearch) {
        searchMenu.classList.add('hidden');
      }

      const catDropdown = document.getElementById('category-custom-dropdown');
      const catMenu = document.getElementById('category-dropdown-menu');
      if (catDropdown && catMenu && !catDropdown.contains(e.target)) {
        catDropdown.classList.remove('active');
        catMenu.classList.add('hidden');
        if (orderForm) orderForm.classList.remove('is-category-dropdown-open');
      }

      const dirCatDropdown = document.getElementById('directory-cat-custom-dropdown');
      const dirCatMenu = document.getElementById('directory-cat-dropdown-menu');
      if (dirCatDropdown && dirCatMenu && !dirCatDropdown.contains(e.target)) {
        dirCatDropdown.classList.remove('active');
        dirCatMenu.classList.add('hidden');
      }

      const pkgDropdown = document.getElementById('package-custom-dropdown');
      const pkgMenu = document.getElementById('package-dropdown-menu');
      if (pkgDropdown && pkgMenu && !pkgDropdown.contains(e.target)) {
        pkgDropdown.classList.remove('active');
        pkgMenu.classList.add('hidden');
        if (orderForm) orderForm.classList.remove('is-package-dropdown-open');
      }
    });

    // SUPPORT TICKETS FRONTEND INTERACTIVITY BINDINGS
    bindSupportTicketEvents();

    // DYNAMIC GCASH QR CODE GENERATOR INPUT BINDING
    const fundsAmountInput = document.getElementById('funds-amount');
    if (fundsAmountInput) {
      fundsAmountInput.addEventListener('input', () => {
        resetDepositFlow();
      });
    }

    // Sidebar toggle moved to bindDashboardEventListeners

    // Clipboard Copy for payment details
    document.querySelectorAll('.btn-copy-account').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const targetId = btn.getAttribute('data-copy-target');
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          const numText = targetEl.textContent.trim();
          navigator.clipboard.writeText(numText).then(() => {
            const origText = btn.innerHTML;
            btn.innerHTML = 'Copied! 📋';
            setTimeout(() => {
              btn.innerHTML = origText;
            }, 1500);
            showPremiumToast("Copied to Clipboard", `Copied Account Details: ${numText}`, "success");
          }).catch(err => {
            console.error("Clipboard copy failed: ", err);
          });
        }
      });
    });

    // Reference ID Format validation
    const refInput = document.getElementById('funds-reference');
    const refWarning = document.getElementById('ref-validation-warning');
    const refFieldTip = document.getElementById('ref-field-tip');
    if (refInput && refWarning) {
      refInput.addEventListener('input', () => {
        const val = refInput.value.trim();
        const activeMethodTab = document.querySelector('#payment-method-tabs .platform-tab.active');
        const isGcash = activeMethodTab && activeMethodTab.getAttribute('data-method') === 'gcash';
        
        if (isGcash && val.length > 0) {
          const isDigitOnly13 = /^\d{13}$/.test(val);
          if (!isDigitOnly13) {
            refWarning.classList.remove('hidden');
            refInput.style.borderColor = 'var(--danger)';
            if (refFieldTip) refFieldTip.classList.add('hidden');
          } else {
            refWarning.classList.add('hidden');
            refInput.style.borderColor = 'var(--success)';
            if (refFieldTip) refFieldTip.classList.remove('hidden');
          }
        } else {
          refWarning.classList.add('hidden');
          refInput.style.borderColor = '';
          if (refFieldTip) refFieldTip.classList.remove('hidden');
        }
      });

      const pmTabs = document.getElementById('payment-method-tabs');
      if (pmTabs) {
        pmTabs.addEventListener('click', () => {
          setTimeout(() => refInput.dispatchEvent(new Event('input')), 100);
        });
      }
    }

    // Dashboard Viewport Pull-to-refresh
    const viewportContainer = document.getElementById('dash-viewport-container');
    const pullIndicator = document.getElementById('pull-to-refresh-indicator');
    if (viewportContainer && pullIndicator) {
      let startY = 0;
      let currentY = 0;
      let isPulling = false;
      
      viewportContainer.addEventListener('touchstart', (e) => {
        if (viewportContainer.scrollTop === 0) {
          startY = e.touches[0].pageY;
          isPulling = true;
        }
      }, { passive: true });
      
      viewportContainer.addEventListener('touchmove', (e) => {
        if (!isPulling) return;
        currentY = e.touches[0].pageY;
        const diff = currentY - startY;
        if (diff > 10 && diff < 80) {
          pullIndicator.classList.add('visible');
          pullIndicator.style.height = `${diff}px`;
        }
      }, { passive: true });
      
      viewportContainer.addEventListener('touchend', async () => {
        if (!isPulling) return;
        isPulling = false;
        const diff = currentY - startY;
        if (diff >= 50) {
          pullIndicator.querySelector('.pull-refresh-text').textContent = 'Syncing Control Desk...';
          try {
            await syncUserBalance();
            await syncOrdersStatus({ silent: true });
            showPremiumToast("Sync Completed", "Balance and campaigns refreshed successfully.", "success");
          } catch(e) {
            console.error("Refresh failed: ", e);
          }
        }
        pullIndicator.classList.remove('visible');
        pullIndicator.style.height = '';
        pullIndicator.querySelector('.pull-refresh-text').textContent = 'Pull down to refresh...';
        startY = 0;
        currentY = 0;
      });
    }

    // Services Comparison modal triggers
    const btnCompareClear = document.getElementById('btn-compare-clear');
    const btnCompareLaunch = document.getElementById('btn-compare-launch');
    const compareModalClose = document.getElementById('compare-modal-close');
    const compareModal = document.getElementById('compare-modal');

    if (btnCompareClear) {
      btnCompareClear.addEventListener('click', () => {
        state.compareSelectedServices = [];
        document.querySelectorAll('.compare-toggle-btn').forEach(btn => {
          btn.classList.remove('is-selected');
          btn.removeAttribute('aria-pressed');
          btn.innerHTML = 'Compare';
        });
        updateComparisonBar();
      });
    }
    if (btnCompareLaunch) {
      btnCompareLaunch.addEventListener('click', () => {
        openComparisonModal();
      });
    }
    const dockClear = document.getElementById('services-compare-dock-clear');
    if (dockClear) {
      dockClear.addEventListener('click', () => {
        state.compareSelectedServices = [];
        document.querySelectorAll('.compare-toggle-btn').forEach(btn => {
          btn.classList.remove('is-selected');
          btn.removeAttribute('aria-pressed');
          btn.innerHTML = 'Compare';
        });
        updateComparisonBar();
      });
    }
    const dockLaunch = document.getElementById('services-compare-dock-launch');
    if (dockLaunch) {
      dockLaunch.addEventListener('click', () => {
        openComparisonModal();
      });
    }
    if (compareModalClose) {
      compareModalClose.addEventListener('click', () => {
        if (compareModal) {
          compareModal.classList.add('hidden');
          syncAppShellState();
        }
      });
    }
    if (compareModal) {
      compareModal.addEventListener('click', (e) => {
        if (e.target === compareModal) {
          compareModal.classList.add('hidden');
          syncAppShellState();
        }
      });
    }

    // Auto-Link Checker URL match validation
    if (orderUrlInput) {
      orderUrlInput.addEventListener('input', (e) => {
        const url = orderUrlInput.value.trim();
        const serviceId = orderServiceSelect.value;
        const warningEl = document.getElementById('url-validation-warning');
        
        if (!url || !serviceId || !warningEl) {
          if (warningEl) warningEl.classList.add('hidden');
          orderUrlInput.style.borderColor = '';
          return;
        }

        if (e && e.isTrusted) {
          state.isUrlInputDirty = true;
        }

        if (!state.isUrlInputDirty) {
          warningEl.classList.add('hidden');
          orderUrlInput.style.borderColor = '';
          return;
        }
        
        const selectedService = state.services.find(s => s.service.toString() === serviceId.toString());
        if (!selectedService) {
          warningEl.classList.add('hidden');
          orderUrlInput.style.borderColor = '';
          return;
        }
        
        const platform = getPlatformFromCategory(selectedService.category);
        const isUrlValid = validateOrderUrl(url, platform);
        if (!isUrlValid) {
          warningEl.textContent = `⚠️ This link does not match the selected platform (${platform.toUpperCase()}). Please check your link.`;
          warningEl.classList.remove('hidden');
          orderUrlInput.style.borderColor = 'var(--danger)';
        } else {
          warningEl.classList.add('hidden');
          orderUrlInput.style.borderColor = 'var(--success)';
        }
      });
      
      if (orderCategorySelect) {
        orderCategorySelect.addEventListener('change', () => {
          state.isUrlInputDirty = false;
          const warningEl = document.getElementById('url-validation-warning');
          if (warningEl) warningEl.classList.add('hidden');
          orderUrlInput.style.borderColor = '';
        });
      }

      if (orderServiceSelect) {
        orderServiceSelect.addEventListener('change', () => {
          state.isUrlInputDirty = false;
          const warningEl = document.getElementById('url-validation-warning');
          if (warningEl) warningEl.classList.add('hidden');
          orderUrlInput.style.borderColor = '';
          setTimeout(() => {
            orderUrlInput.dispatchEvent(new Event('input'));
          }, 50);
        });
      }
    }

    // Receipt Image Exporter
    const downloadReceiptBtn = document.getElementById('download-receipt-btn');
    if (downloadReceiptBtn) {
      downloadReceiptBtn.addEventListener('click', () => {
        if (state.currentReceipt) {
          downloadReceiptImage(state.currentReceipt);
        } else {
          showPremiumToast("Error", "No receipt details found to export.", "error");
        }
      });
    }

    // Add Funds Quick deposit amount buttons
    document.querySelectorAll('.quick-amount-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const amount = btn.getAttribute('data-amount');
        const fundsAmount = document.getElementById('funds-amount');
        if (fundsAmount) {
          fundsAmount.value = amount;
          fundsAmount.dispatchEvent(new Event('input'));
        }
      });
    });

    // Sidebar profile dropdown menu action bindings
    const sdItemProfile = document.getElementById('sd-item-profile');
    const sdItemFunds = document.getElementById('sd-item-funds');
    const sdItemLogout = document.getElementById('sd-item-logout');

    if (sdItemProfile) {
      sdItemProfile.addEventListener('click', () => {
        const sidebarProfileDropdown = document.getElementById('sidebar-profile-dropdown');
        if (sidebarProfileDropdown) {
          sidebarProfileDropdown.classList.add('hidden');
          sidebarProfileDropdown.classList.remove('active');
        }
        switchView('dashboard');
        switchTab('account');
      });
    }

    if (sdItemFunds) {
      sdItemFunds.addEventListener('click', () => {
        const sidebarProfileDropdown = document.getElementById('sidebar-profile-dropdown');
        if (sidebarProfileDropdown) {
          sidebarProfileDropdown.classList.add('hidden');
          sidebarProfileDropdown.classList.remove('active');
        }
        switchView('dashboard');
        switchTab('add-funds');
      });
    }

    if (sdItemLogout) {
      sdItemLogout.addEventListener('click', () => {
        const sidebarProfileDropdown = document.getElementById('sidebar-profile-dropdown');
        if (sidebarProfileDropdown) {
          sidebarProfileDropdown.classList.add('hidden');
          sidebarProfileDropdown.classList.remove('active');
        }
        handleLogout();
      });
    }

    const sidebarTabLogoutBtn = document.getElementById('sidebar-tab-logout-btn');
    if (sidebarTabLogoutBtn) {
      sidebarTabLogoutBtn.addEventListener('click', () => {
        handleLogout();
      });
    }

    const mobileBackBtn = document.getElementById('mobile-dash-back-btn');
    if (mobileBackBtn) {
      mobileBackBtn.addEventListener('click', () => {
        switchTab('new-order');
      });
    }

    // Initialize deposit interactions dynamically
    bindAddFundsEventListeners();
  }

  let adminPanelLoaded = false;
  async function ensureAdminPanelLoaded() {
    if (adminPanelLoaded) return true;

    const dynamicContentContainer = document.getElementById('admin-panel-dynamic-content');
    if (!dynamicContentContainer) return false;

    // Show secure loading screen
    dynamicContentContainer.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; gap: 1rem; text-align: center;">
        <div class="spinner"></div>
        <p style="color: var(--accent); font-weight: 600; font-size: 1rem; margin: 0; letter-spacing: 0.5px;">🔐 SECURITY ENFORCEMENT</p>
        <p style="color: var(--text-muted); font-size: 0.82rem; margin: 0;">Loading secure administrative interface from server...</p>
      </div>
    `;

    try {
      const response = await request('/api/admin/panel-html');
      if (!response.ok) {
        throw new Error("HTTP error " + response.status + " fetching admin template.");
      }
      const htmlText = await response.text();
      dynamicContentContainer.innerHTML = htmlText;
      adminPanelLoaded = true;

      // Re-query admin DOM elements
      adminUserSearch = document.getElementById('admin-user-search');
      adminSearchBtn = document.getElementById('admin-search-btn');
      adminResultsBox = document.getElementById('admin-results-box');

      // Bind dynamic event listeners
      bindAdminPanelEvents();
      return true;
    } catch (err) {
      console.error("Failed to load admin panel dynamically:", err);
      dynamicContentContainer.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem 2rem; gap: 1rem; border: 1px dashed var(--danger); border-radius: 12px; background: rgba(239,68,68,0.03); text-align: center;">
          <span style="font-size: 2rem;">⚠️</span>
          <p style="color: var(--danger); font-weight: 700; margin: 0;">Failed to Load Admin Panel</p>
          <p style="color: var(--text-muted); font-size: 0.8rem; margin: 0; max-width: 320px;">${err.message}</p>
          <button class="btn btn-secondary btn-sm" id="btn-retry-admin-load" style="margin-top: 10px;">Retry Loading 🔄</button>
        </div>
      `;
      const retryBtn = document.getElementById('btn-retry-admin-load');
      if (retryBtn) {
        retryBtn.addEventListener('click', ensureAdminPanelLoaded);
      }
      return false;
    }
  }

  function bindAdminPanelEvents() {
    if (adminSearchBtn) {
      const freshBtn = adminSearchBtn.cloneNode(true);
      if (adminSearchBtn.parentNode) {
        adminSearchBtn.parentNode.replaceChild(freshBtn, adminSearchBtn);
      }
      adminSearchBtn = freshBtn;
      adminSearchBtn.addEventListener('click', handleAdminSearch);
    }
    if (adminUserSearch) {
      const freshInput = adminUserSearch.cloneNode(true);
      if (adminUserSearch.parentNode) {
        adminUserSearch.parentNode.replaceChild(freshInput, adminUserSearch);
      }
      adminUserSearch = freshInput;
      adminUserSearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAdminSearch();
      });
    }

    // Admin panel subnav buttons
    const adminSubnavButtons = document.querySelectorAll('.admin-subnav-btn');
    adminSubnavButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = btn.getAttribute('data-admin-tab');
        
        // Remove active class from all buttons and add to this one
        adminSubnavButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Hide all tab panels
        document.querySelectorAll('.admin-tab-content-panel').forEach(panel => {
          panel.classList.add('hidden');
          panel.classList.remove('active');
        });
        
        // Show target tab panel
        const targetPanel = document.getElementById(`admin-panel-tab-${tab}`);
        if (targetPanel) {
          targetPanel.classList.remove('hidden');
          targetPanel.classList.add('active');
        }
        
        // Load target tab data
        loadAdminTabSpecificData(tab);
      });
    });

    // Load default active tab (dashboard stats)
    loadAdminTabSpecificData('dashboard');
  }

  async function updateDeveloperApiTab() {
    const keyDisplay = document.getElementById('developer-api-key-display');
    const apiEndpointDisplay = document.getElementById('api-endpoint-display');
    if (!keyDisplay) return;

    // If logged in and in live mode, fetch fresh API key info from server
    if (state.operatingMode === 'live' && state.authToken) {
      try {
        const res = await safeFetch('/api/user/api-key', { headers: { 'Authorization': `Bearer ${state.authToken}` } });
        if (res.ok) {
          const data = await res.json();
          const hasKey = data.hasKey || data.has_key;
          const maskedKey = data.maskedKey || data.masked_key;
          if (hasKey && maskedKey) {
            keyDisplay.dataset.fullKey = '';
            keyDisplay.textContent = maskedKey;
            keyDisplay.classList.add('masked');
            if (state.user) state.user.apiKey = maskedKey;
            const createdLabel = document.getElementById('api-key-created-label');
            const lastUsedLabel = document.getElementById('api-key-last-used-label');
            const createdAt = data.createdAt || data.created_at;
            const lastUsed = data.lastUsed || data.last_used;
            if (createdLabel && createdAt) createdLabel.textContent = `Created: ${new Date(createdAt).toLocaleDateString()}`;
            if (lastUsedLabel && lastUsed) lastUsedLabel.textContent = `Last used: ${new Date(lastUsed).toLocaleString()}`;
            else if (lastUsedLabel) lastUsedLabel.textContent = 'Last used: Never';
            const badge = document.getElementById('api-key-status-badge');
            if (badge) { badge.textContent = 'Active'; badge.className = 'api-key-status-badge'; }
          }
        }
      } catch (_e) { /* non-critical */ }
    }

    const apiKey = state.user ? (state.user.apiKey || 'apx_your_api_key_here') : 'apx_your_api_key_here';
    if (!keyDisplay.dataset.fullKey && !keyDisplay.classList.contains('masked')) {
      keyDisplay.textContent = apiKey;
    }

    const currentOrigin = window.location.origin;
    const apiEndpoint = `${currentOrigin}/api/v2`;
    if (apiEndpointDisplay) apiEndpointDisplay.textContent = apiEndpoint;

    // Update code boxes with separate Live Production and Offline Demo examples
    const curlCode = document.querySelector('#subtab-curl pre code');
    if (curlCode) {
      curlCode.textContent = `# 1. LIVE PRODUCTION MODE (Requires API Key)
curl -X POST ${apiEndpoint} \\
  -H "Content-Type: application/json" \\
  -d '{
    "key": "${apiKey}",
    "action": "add",
    "service": 101,
    "url": "https://instagram.com/my_page",
    "quantity": 1000
  }'

# 2. OFFLINE DEMO PREVIEW (No API Key Required)
curl -X POST ${apiEndpoint} \\
  -H "Content-Type: application/json" \\
  -d '{
    "action": "add",
    "service": 101,
    "url": "https://instagram.com/my_page",
    "quantity": 1000,
    "mode": "demo"
  }'`;
    }

    const nodeCode = document.querySelector('#subtab-nodejs pre code');
    if (nodeCode) {
      nodeCode.textContent = `// 1. LIVE PRODUCTION MODE (Requires API Key)
fetch('${apiEndpoint}', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    key: '${apiKey}',
    action: 'add',
    service: 101,
    url: 'https://instagram.com/my_page',
    quantity: 1000
  })
})
.then(res => res.json())
.then(data => console.log(data));

// 2. OFFLINE DEMO PREVIEW (No API Key Required)
fetch('${apiEndpoint}', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'add',
    service: 101,
    url: 'https://instagram.com/my_page',
    quantity: 1000,
    mode: 'demo'
  })
})
.then(res => res.json())
.then(data => console.log(data));`;
    }

    const pythonCode = document.querySelector('#subtab-python pre code');
    if (pythonCode) {
      pythonCode.textContent = `import requests

# 1. LIVE PRODUCTION MODE (Requires API Key)
live_payload = {
    "key": "${apiKey}",
    "action": "add",
    "service": 101,
    "url": "https://instagram.com/my_page",
    "quantity": 1000
}
response = requests.post("${apiEndpoint}", json=live_payload)
print("Live Response:", response.json())

# 2. OFFLINE DEMO PREVIEW (No API Key Required)
demo_payload = {
    "action": "add",
    "service": 101,
    "url": "https://instagram.com/my_page",
    "quantity": 1000,
    "mode": "demo"
}
response = requests.post("${apiEndpoint}", json=demo_payload)
print("Demo Response:", response.json())`;
  }
  }
  
  // --- STATE SYSTEM ---
  const state = {
    currentView: 'landing', // 'landing' or 'dashboard'
    activeTab: 'new-order',  // 'new-order', 'services-list', 'order-history', 'developer-api', 'settings'
    services: [],            // List of all services loaded from API
    categories: [],          // Unique categories of services
    balance: 0.00,           // User's balance
    orders: [],              // History of orders placed by this user (persisted in LocalStorage)
    operatingMode: 'demo',   // 'demo' or 'live'
    liveModeAvailable: false, // If backend server has an API key configured
    demoModeEnabled: false,
    selectedOrderPlatform: 'all',     // Filter order categories
    selectedDirectoryPlatform: 'all',  // Filter services list
    user: null,               // Active logged in user
    authResolved: false,
    sessionResolvedTicketsCount: 0,  // Count tickets resolved in this session
    directoryCurrentPage: 1,  // Pagination support
    orderHistoryPage: 1,      // Order History Pagination support
    compareSelectedServices: [],  // Service comparison tracker
    currentReceipt: null // To track the active receipt being displayed
  };

  // --- CONFIGURATION ---
  const LOCAL_STORAGE_ORDERS_KEY = 'apexboost_orders_v1';
  const LOCAL_STORAGE_MODE_KEY = 'apexboost_operating_mode';
  const OPENCLAW_VIP_THRESHOLD = 1000;
  let openClawEligibilityCache = null;
  let openClawEligibilityPromise = null;

  function isMobileFabDock() {
    return window.matchMedia('(max-width: 767px)').matches;
  }

  function computeClientOpenClawEligibility() {
    if (!state.user) return null;
    const balance = parseFloat(state.balance ?? state.user.balance ?? 0) || 0;
    const totalSpent = parseFloat(state.user.total_spent || state.user.totalSpent || 0) || 0;
    let approvedAddFunds = 0;
    if (Array.isArray(state.userDeposits)) {
      approvedAddFunds = state.userDeposits.reduce((sum, deposit) => {
        if (String(deposit.status || '').toLowerCase() !== 'approved') return sum;
        return sum + (parseFloat(deposit.amount || 0) || 0);
      }, 0);
    }
    const eligible = balance >= OPENCLAW_VIP_THRESHOLD
      || totalSpent >= OPENCLAW_VIP_THRESHOLD
      || approvedAddFunds >= OPENCLAW_VIP_THRESHOLD;
    return {
      eligible,
      balance,
      totalSpent,
      approvedAddFunds,
      threshold: OPENCLAW_VIP_THRESHOLD
    };
  }

  async function refreshOpenClawEligibility(force = false) {
    if (!state.user) {
      openClawEligibilityCache = null;
      return null;
    }
    if (!force && openClawEligibilityCache) return openClawEligibilityCache;

    try {
      const response = await request('/api/ai/eligibility');
      if (!response.ok) throw new Error('OpenClaw eligibility request failed');
      const data = await response.json();
      openClawEligibilityCache = data.eligibility || computeClientOpenClawEligibility();
    } catch (_err) {
      openClawEligibilityCache = computeClientOpenClawEligibility();
    }
    return openClawEligibilityCache;
  }

  function shouldShowHermesWidget() {
    if (!state.user || state.currentView !== 'dashboard') return false;
    return true;
  }

  window.apexboostSyncFloatingWidgets = function apexboostSyncFloatingWidgets() {
    syncFloatingWidgets();
  };

  function syncFloatingWidgets() {
    const showBackendFabStack = Boolean(state.user) && state.currentView === 'dashboard';
    const mobileDock = isMobileFabDock() && showBackendFabStack;

    document.body.classList.toggle('mobile-dashboard-fab-mode', mobileDock);
    document.body.classList.toggle('mobile-dash-pro', mobileDock);

    const messengerFab = document.getElementById('messenger-fab');
    const hermesWidget = document.getElementById('apexbot-top-widget');
    const showWhatsApp = showBackendFabStack;
    const showHermes = shouldShowHermesWidget();

    if (messengerFab) {
      messengerFab.classList.toggle('hidden', !showWhatsApp);
      messengerFab.setAttribute('aria-hidden', showWhatsApp ? 'false' : 'true');
    }

    if (hermesWidget) {
      hermesWidget.classList.toggle('hidden', !showHermes);
      hermesWidget.setAttribute('aria-hidden', showHermes ? 'false' : 'true');
    }

    const openClawEligible = Boolean(openClawEligibilityCache?.eligible);
    document.body.classList.toggle('openclaw-vip-enabled', showBackendFabStack && openClawEligible);

    if (typeof window.apexboostSetAiHelpVisibility === 'function') {
      window.apexboostSetAiHelpVisibility(showBackendFabStack && openClawEligible);
    }

    if (!showBackendFabStack) {
      openClawEligibilityCache = null;
      document.body.classList.remove('openclaw-vip-enabled');
      if (typeof window.apexboostSetAiHelpVisibility === 'function') {
        window.apexboostSetAiHelpVisibility(false);
      }
      return;
    }

    if (!openClawEligibilityCache && !openClawEligibilityPromise) {
      openClawEligibilityPromise = refreshOpenClawEligibility(true).finally(() => {
        openClawEligibilityPromise = null;
        syncFloatingWidgets();
      });
    }

    if (typeof window.apexboostInitFabDrag === 'function') {
      window.apexboostInitFabDrag();
    }
    if (typeof window.apexboostRestoreFabPositions === 'function') {
      window.apexboostRestoreFabPositions();
    }

    // Mobile dashboard toolbar visibility and title logic
    const mobileToolbar = document.getElementById('mobile-dash-toolbar');
    const mobileToolbarTitle = document.getElementById('mobile-dash-toolbar-title');
    if (mobileToolbar) {
      const isMobile = isMobileFabDock();
      const isToolbarTab = ['services-list', 'support-tickets'].includes(state.activeTab);
      const shouldShowToolbar = isMobile && showBackendFabStack && isToolbarTab;
      
      mobileToolbar.classList.toggle('hidden', !shouldShowToolbar);
      mobileToolbar.setAttribute('aria-hidden', shouldShowToolbar ? 'false' : 'true');
      document.body.classList.toggle('mobile-dash-toolbar-active', shouldShowToolbar);
      
      if (shouldShowToolbar && mobileToolbarTitle) {
        if (state.activeTab === 'services-list') {
          mobileToolbarTitle.textContent = 'Services Catalog';
        } else if (state.activeTab === 'support-tickets') {
          mobileToolbarTitle.textContent = 'Support Desk';
        }
      }
    }
  }

  function getPageScrollY() {
    return Math.max(
      window.scrollY || 0,
      document.documentElement.scrollTop || 0,
      document.body.scrollTop || 0
    );
  }

  function setBodyScrollLock(shouldLock) {
    const root = document.documentElement;
    const isLocked = root.classList.contains('body-scroll-locked');

    if (shouldLock) {
      if (isLocked) return;
      const scrollY = getPageScrollY();
      root.classList.add('body-scroll-locked');
      document.body.classList.add('body-scroll-locked');
      document.body.dataset.scrollLockY = String(scrollY);
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      return;
    }

    if (!isLocked) {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      return;
    }

    const savedScrollY = parseInt(document.body.dataset.scrollLockY || '0', 10) || 0;
    root.classList.remove('body-scroll-locked');
    document.body.classList.remove('body-scroll-locked');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    document.body.style.overflow = '';
    delete document.body.dataset.scrollLockY;
    window.scrollTo(0, savedScrollY);
  }

  function syncAppShellState() {
    const navLinks = document.getElementById('nav-links');
    const dashSidebar = document.querySelector('.dash-sidebar');
    const compareModal = document.getElementById('compare-modal');
    const ticketChatOverlay = document.getElementById('ticket-chat-overlay');

    const authOpen = !!(authModal && !authModal.classList.contains('hidden'));
    const customAlertOpen = !!(customAlertOverlay && customAlertOverlay.classList.contains('active') && !customAlertOverlay.classList.contains('hidden'));
    const navMenuOpen = !!(navLinks && navLinks.classList.contains('mobile-active'));
    const sidebarOpen = !!(dashSidebar && dashSidebar.classList.contains('mobile-open'));
    const compareOpen = !!(compareModal && !compareModal.classList.contains('hidden'));
    const chatOpen = !!(ticketChatOverlay && !ticketChatOverlay.classList.contains('hidden'));

    document.body.dataset.currentView = state.currentView;
    document.body.dataset.activeTab = state.activeTab;
    document.body.classList.toggle('is-authenticated', Boolean(state.user));
    document.body.classList.toggle('is-guest', !state.user);
    
    const role = state.user ? state.user.role : '';
    const isAdmin = role === 'admin' || role === 'super_admin';
    const isSuperAdmin = role === 'super_admin';
    document.body.classList.toggle('is-admin', isAdmin);
    document.body.classList.toggle('is-super-admin', isSuperAdmin);

    document.body.classList.toggle('auth-pending', !state.authResolved);
    document.body.classList.toggle('nav-menu-open', navMenuOpen);
    document.body.classList.toggle('sidebar-open', sidebarOpen);
    document.body.classList.toggle('auth-modal-open', authOpen);
    document.body.classList.toggle('custom-alert-open', customAlertOpen);
    document.body.classList.toggle('compare-modal-open', compareOpen);
    document.body.classList.toggle('ticket-chat-open', chatOpen);

    const updatesDropdown = document.getElementById('updates-dropdown');
    const profileDropdown = document.getElementById('profile-dropdown');
    const updatesOpen = !!(updatesDropdown && !updatesDropdown.classList.contains('hidden'));
    const profileOpen = !!(profileDropdown && !profileDropdown.classList.contains('hidden'));
    document.body.classList.toggle('updates-open', updatesOpen);
    document.body.classList.toggle('profile-menu-open', profileOpen);

    const shouldLockBody = authOpen || customAlertOpen || navMenuOpen || sidebarOpen || compareOpen || chatOpen;
    setBodyScrollLock(shouldLockBody);

    // Dynamically update Developer API tab connection details
    updateDeveloperApiTab();

    // Disable inputs and button if maintenance mode is active
    checkMaintenanceButtonState();
    syncFloatingWidgets();
  }

  function closeAllOverlays(exclude = null) {
    // 1. Mobile Sidebar Drawer
    if (exclude !== 'sidebar') {
      const dashSidebar = document.querySelector('.dash-sidebar');
      const sidebarBackdrop = document.getElementById('sidebar-backdrop');
      const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
      const hamburgerToggle = document.getElementById('hamburger-toggle');
      if (dashSidebar) dashSidebar.classList.remove('mobile-open');
      if (sidebarToggleBtn) sidebarToggleBtn.classList.remove('active');
      if (hamburgerToggle) hamburgerToggle.classList.remove('active');
      if (sidebarBackdrop) sidebarBackdrop.classList.add('hidden');
    }

    // 2. Profile Dropdown Menu
    if (exclude !== 'profile') {
      const profileDropdown = document.getElementById('profile-dropdown');
      const navUserProfile = document.getElementById('nav-user-profile');
      const sidebarProfileDropdown = document.getElementById('sidebar-profile-dropdown');
      if (profileDropdown) profileDropdown.classList.add('hidden');
      if (navUserProfile) navUserProfile.classList.remove('active');
      if (sidebarProfileDropdown) {
        sidebarProfileDropdown.classList.add('hidden');
        sidebarProfileDropdown.classList.remove('active');
      }
    }

    // 3. Notifications/Updates Dropdown Menu
    if (exclude !== 'updates') {
      const updatesDropdown = document.getElementById('updates-dropdown');
      const updatesBackdrop = document.getElementById('updates-dropdown-backdrop');
      const notifWrap = document.getElementById('nav-notification-wrap');
      if (updatesDropdown) updatesDropdown.classList.add('hidden');
      if (updatesBackdrop) updatesBackdrop.classList.add('hidden');
      if (notifWrap) notifWrap.classList.remove('active');
    }

    // 4. Mobile Navigation Menu (Landing page hamburger links)
    if (exclude !== 'navLinks') {
      const navLinks = document.getElementById('nav-links');
      const hamburgerToggle = document.getElementById('hamburger-toggle');
      if (navLinks) navLinks.classList.remove('mobile-active');
      if (hamburgerToggle) hamburgerToggle.classList.remove('active');
    }
    syncAppShellState();
  }

  function closeMobileNavMenu() {
    const hamburgerToggle = document.getElementById('hamburger-toggle');
    const navLinks = document.getElementById('nav-links');

    if (hamburgerToggle) hamburgerToggle.classList.remove('active');
    if (navLinks) navLinks.classList.remove('mobile-active');
    syncAppShellState();
  }

  function closeMobileSidebar() {
    const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
    const dashSidebar = document.querySelector('.dash-sidebar');
    const sidebarBackdrop = document.getElementById('sidebar-backdrop');
    const hamburgerToggle = document.getElementById('hamburger-toggle');

    if (dashSidebar) dashSidebar.classList.remove('mobile-open');
    if (sidebarToggleBtn) sidebarToggleBtn.classList.remove('active');
    if (hamburgerToggle) hamburgerToggle.classList.remove('active');
    if (sidebarBackdrop) sidebarBackdrop.classList.add('hidden');
    syncAppShellState();
  }

  registerOtpEmail = '';
  registerOtpCooldownTimer = null;
  forgotResendCooldownTimer = null;
  recoveryIdentifier = '';

  // --- CUSTOM PREMIUM MODAL CONTROLLERS ---
  const customAlertOverlay = document.getElementById('custom-alert-overlay');
  const receiptModalCard = document.getElementById('receipt-modal-card');
  const toastModalCard = document.getElementById('toast-modal-card');
  const toastModalIcon = document.getElementById('toast-modal-icon');
  const toastModalTitle = document.getElementById('toast-modal-title');
  const toastModalDesc = document.getElementById('toast-modal-desc');
  const toastModalOkBtn = document.getElementById('toast-modal-ok-btn');
  const closeReceiptBtn = document.getElementById('close-receipt-btn');

  function showPremiumToast(title, message, type = 'success') {
    if (!customAlertOverlay || !toastModalCard) return;
    
    if (type === 'success') {
      toastModalIcon.innerHTML = '✨';
      toastModalIcon.style.color = 'var(--success)';
      toastModalIcon.style.borderColor = 'rgba(16, 185, 129, 0.2)';
      toastModalIcon.style.background = 'rgba(16, 185, 129, 0.1)';
    } else if (type === 'logout') {
      toastModalIcon.innerHTML = '🚪';
      toastModalIcon.style.color = 'var(--warning)';
      toastModalIcon.style.borderColor = 'rgba(245, 158, 11, 0.2)';
      toastModalIcon.style.background = 'rgba(245, 158, 11, 0.1)';
    } else if (type === 'info') {
      toastModalIcon.innerHTML = '🤖';
      toastModalIcon.style.color = 'var(--primary)';
      toastModalIcon.style.borderColor = 'rgba(59, 130, 246, 0.2)';
      toastModalIcon.style.background = 'rgba(59, 130, 246, 0.1)';
    } else {
      toastModalIcon.innerHTML = '⚠️';
      toastModalIcon.style.color = 'var(--danger)';
      toastModalIcon.style.borderColor = 'rgba(239, 68, 68, 0.2)';
      toastModalIcon.style.background = 'rgba(239, 68, 68, 0.1)';
    }
    
    toastModalTitle.textContent = title;
    toastModalDesc.textContent = message;
    
    receiptModalCard.classList.add('hidden');
    toastModalCard.classList.remove('hidden');
    customAlertOverlay.classList.remove('hidden');
    customAlertOverlay.classList.add('active');
    syncAppShellState();
  }

  function showPremiumReceipt(receipt) {
    if (!customAlertOverlay || !receiptModalCard) return;
    state.currentReceipt = receipt;
    
    document.getElementById('receipt-order-id').textContent = `#${receipt.orderId}`;
    document.getElementById('receipt-service-name').textContent = receipt.serviceName;
    
    const targetLinkEl = document.getElementById('receipt-target-link');
    targetLinkEl.textContent = receipt.url;
    targetLinkEl.onclick = () => window.open(receipt.url, '_blank');
    
    document.getElementById('receipt-quantity').textContent = parseInt(receipt.quantity).toLocaleString();
    
    const spentStr = `₱${parseFloat(receipt.charge).toFixed(2)}`;
    const balStr = `₱${parseFloat(receipt.remainingBalance).toFixed(2)}`;
    
    document.getElementById('receipt-total-spent').textContent = spentStr;
    document.getElementById('receipt-remaining-balance').textContent = balStr;
    
    toastModalCard.classList.add('hidden');
    receiptModalCard.classList.remove('hidden');
    customAlertOverlay.classList.remove('hidden');
    customAlertOverlay.classList.add('active');
    syncAppShellState();
  }

  function closeCustomAlerts() {
    if (customAlertOverlay) {
      customAlertOverlay.classList.remove('active');
      customAlertOverlay.classList.add('hidden');
    }
    syncAppShellState();
  }

  if (toastModalOkBtn) {
    toastModalOkBtn.addEventListener('click', closeCustomAlerts);
  }
  if (closeReceiptBtn) {
    closeReceiptBtn.addEventListener('click', closeCustomAlerts);
  }
  if (customAlertOverlay) {
    customAlertOverlay.addEventListener('click', (e) => {
      if (e.target === customAlertOverlay) {
        closeCustomAlerts();
      }
    });
  }


  // --- INITIALIZATION ---
  async function initializeApp() {
    setupTheme();
    setupEventListeners();
    setupPasswordVisibilityToggles();

    // Resolve endpoint host visually
    const currentHost = window.location.origin;
    if (apiEndpointDisplay) {
      apiEndpointDisplay.textContent = `${currentHost}/api/v2`;
    }

    // Restore cached user shell while verifying the real server session.
    const savedUser = localStorage.getItem('apexboost_user');
    if (savedUser) {
      try {
        state.user = JSON.parse(savedUser);
        await ensureDashboardLoaded();
      } catch (e) {
        state.user = null;
      }
    }

    // Retrieve operating mode selection from LocalStorage if preset
    const savedMode = localStorage.getItem(LOCAL_STORAGE_MODE_KEY);
    if (savedMode === 'live' || savedMode === 'demo') {
      state.operatingMode = savedMode;
    }


    updateUserUI();
    syncAppShellState();

    // Check backend server setup and resolve public operating mode safely.
    try {
      await checkBackendConfig();
      await restoreSession();
      await verifyEmailFromUrl();
      await checkPasswordResetTokenFromUrl();
      await loadOrdersFromLocalStorage();
    } catch (err) {
      console.warn("Non-blocking error during initial server synchronization:", err);
    }

    // Open /login and /signup immediately — do not block auth on services sync.
    await handleClientRouting();

    try {
      await syncServicesList();
      await syncUserBalance();
    } catch (err) {
      console.warn("Non-blocking error during services/balance sync:", err);
    }

    // Background status poller: demo = simulate transitions, live = poll RKD Panel every 30s
    setInterval(() => {
      if (state.operatingMode === 'demo') {
        syncOrdersStatus({ silent: true });
      } else if (state.operatingMode === 'live' && state.orders.length > 0) {
        syncOrdersStatus({ silent: true });
      }
    }, 30000);

    // Start Live Social Proof popups!
    initSocialProofPopups();

    // Start Interactive Help Desk FAB
    initSupportAgentWidget();
    syncAppShellState();
  }


  function updateUserUI() {
    const navLoginBtn = document.getElementById('nav-login-btn');
    const navUserProfile = document.getElementById('nav-user-profile');
    const navUsername = document.getElementById('nav-username');
    const navUserAvatar = document.getElementById('nav-user-avatar');
    const sidebarUsername = document.getElementById('sidebar-username');
    
    // NEW: Dropdown Menu elements
    const dropdownUsernameVal = document.getElementById('dropdown-username-val');
    const dropdownUserAvatarMenu = document.getElementById('dropdown-user-avatar-menu');
    const accountUsernameDisplay = document.getElementById('account-username-display');
    const accountEmailDisplay = document.getElementById('account-email-display');

    if (state.user) {
      // User is logged in
      if (navLoginBtn) navLoginBtn.classList.add('hidden');
      if (navUserProfile) navUserProfile.classList.remove('hidden');
      if (navDashboardTrigger) navDashboardTrigger.classList.remove('hidden');
      if (navUsername) navUsername.textContent = state.user.username;
      
      const avatarUrl = state.user.avatar || '/images/default-ai-profile-squidward-v2.png';
      if (navUserAvatar) {
        navUserAvatar.style.backgroundImage = `url('${avatarUrl}')`;
      }
      if (dropdownUserAvatarMenu) {
        dropdownUserAvatarMenu.style.backgroundImage = `url('${avatarUrl}')`;
      }
      const sidebarAvatar = document.getElementById('sidebar-avatar-btn');
      if (sidebarAvatar) {
        sidebarAvatar.textContent = '';
        sidebarAvatar.style.backgroundImage = `url('${avatarUrl}')`;
        sidebarAvatar.classList.add('has-profile-image');
      }
      if (sidebarUsername) sidebarUsername.textContent = state.user.username;
      
      // Update dropdown elements
      if (dropdownUsernameVal) dropdownUsernameVal.textContent = state.user.username;
      if (accountUsernameDisplay) accountUsernameDisplay.value = state.user.username;
      if (accountEmailDisplay) accountEmailDisplay.value = state.user.email;
      
      // Calculate total spent and display
      updateTotalSpent();
 
      // Show admin tab if admin role or super_admin role
      if (state.user.role === 'admin' || state.user.role === 'super_admin') {
        if (sidebarTabAdmin) sidebarTabAdmin.classList.remove('hidden');
      } else {
        if (sidebarTabAdmin) sidebarTabAdmin.classList.add('hidden');
        if (state.activeTab === 'admin-panel') {
          switchTab('new-order');
        }
      }
    } else {
      // Guest / Logged out
      if (navLoginBtn) navLoginBtn.classList.remove('hidden');
      if (navUserProfile) navUserProfile.classList.add('hidden');
      if (navDashboardTrigger) navDashboardTrigger.classList.add('hidden');
      if (navUsername) navUsername.textContent = '';
      if (sidebarUsername) sidebarUsername.textContent = "Guest";
      if (dropdownUsernameVal) dropdownUsernameVal.textContent = '';
      if (accountUsernameDisplay) accountUsernameDisplay.value = '';
      if (accountEmailDisplay) accountEmailDisplay.value = '';
      if (sidebarTabAdmin) sidebarTabAdmin.classList.add('hidden');
      if (state.activeTab === 'admin-panel') {
        switchTab('new-order');
      }
    }

    syncAppShellState();
  }



  async function restoreSession() {
    const token = getAuthToken();
    if (!token) {
      state.user = null;
      state.authResolved = true;
      updateUserUI();
      return;
    }

    try {
      const response = await request('/api/auth/session');
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('apexboost_token');
          localStorage.removeItem('apexboost_user');
          state.user = null;
          dashboardLoaded = false;
          const dynamicContentContainer = document.getElementById('dashboard-dynamic-content');
          if (dynamicContentContainer) {
            dynamicContentContainer.innerHTML = '';
            dynamicContentContainer.classList.add('hidden');
          }
        } else {
          console.warn("Server returned error verifying session:", response.status);
        }
      } else {
        const data = await response.json();
        state.user = data.user || null;
        if (state.user) {
          localStorage.setItem('apexboost_user', JSON.stringify(state.user));
          await ensureDashboardLoaded();
        } else {
          dashboardLoaded = false;
          const dynamicContentContainer = document.getElementById('dashboard-dynamic-content');
          if (dynamicContentContainer) {
            dynamicContentContainer.innerHTML = '';
            dynamicContentContainer.classList.add('hidden');
          }
        }
      }
    } catch (_error) {
      console.warn("Network error verifying session, preserving cached credentials:", _error);
      if (state.user) {
        await ensureDashboardLoaded().catch(() => {});
      }
    } finally {
      state.authResolved = true;
      updateUserUI();
    }
  }

  async function verifyEmailFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('verify');
    if (!token) return;

    try {
      const response = await request('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      const data = await response.json();
      if (!response.ok) {
        showPremiumToast("Verification Failed", data.error || "Email verification failed.", "error");
      } else {
        showPremiumToast("Email Verified", "Your email has been verified. You can now log in.", "success");
        showAuthModal('login');
      }
    } catch (_error) {
      showPremiumToast("Verification Failed", "Could not verify your email right now.", "error");
    } finally {
      params.delete('verify');
      const nextUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}${window.location.hash || ''}`;
      window.history.replaceState({}, '', nextUrl);
    }
  }

  async function checkPasswordResetTokenFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('resetToken');
    const email = params.get('email') || '';
    if (!token) return;

    try {
      showAuthModal('forgot');
      setForgotStep('reset');

      recoveryIdentifier = email;
      if (forgotUsernameEmail) forgotUsernameEmail.value = email;
      if (forgotOtpCode) forgotOtpCode.value = token;

      showPremiumToast("Reset Code Loaded", "Your password reset link is valid! Enter your new password below.", "success");
    } catch (_error) {
      showPremiumToast("Reset Failed", "Could not load your password reset link.", "error");
    } finally {
      params.delete('resetToken');
      params.delete('email');
      const nextUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}${window.location.hash || ''}`;
      window.history.replaceState({}, '', nextUrl);
    }
  }

  function setupPasswordVisibilityToggles() {
    [
      'login-password',
      'register-password',
      'forgot-new-password',
      'forgot-confirm-password',
      'change-password-current',
      'change-password-new',
      'change-password-confirm'
    ].forEach((inputId) => {
      const input = document.getElementById(inputId);
      if (!input || input.dataset.hasPasswordToggle === 'true') return;

      const wrapper = document.createElement('div');
      wrapper.className = 'password-input-wrap';
      input.parentNode.insertBefore(wrapper, input);
      wrapper.appendChild(input);

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'password-toggle-btn';
      button.setAttribute('aria-label', 'Show password');
      button.textContent = 'Show';
      button.addEventListener('click', () => {
        const showing = input.type === 'text';
        input.type = showing ? 'password' : 'text';
        button.textContent = showing ? 'Show' : 'Hide';
        button.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
      });

      wrapper.appendChild(button);
      input.dataset.hasPasswordToggle = 'true';
    });
  }

  function updateTotalSpent() {
    const dropdownSpentVal = document.getElementById('dropdown-spent-val');
    const tooltipSpentVal = document.getElementById('tooltip-spent-val');
    
    let totalSpent = 0;
    if (state && Array.isArray(state.orders)) {
      totalSpent = state.orders.reduce((sum, o) => {
        if (o && o.status && typeof o.status === 'string' && o.status.toLowerCase() === 'completed') {
          const chargeVal = parseFloat(o.charge);
          return sum + (isNaN(chargeVal) ? 0 : chargeVal);
        }
        return sum;
      }, 0);
    }
    
    const formattedSpent = `₱${totalSpent.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    if (dropdownSpentVal) dropdownSpentVal.textContent = `Total Spent: ${formattedSpent}`;
    if (tooltipSpentVal) tooltipSpentVal.textContent = formattedSpent;
  }

  // --- THEME MANAGEMENT ---
  function setupTheme() {
    // Check saved theme or default to dark
    const savedTheme = localStorage.getItem('apexboost_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('apexboost_theme', newTheme);
  });


  // --- CLIENT-SIDE SPA ROUTER ---
  function updateBrowserURL() {
    let newPath = '/';
    if (state.currentView === 'terms') {
      newPath = '/terms';
    } else if (state.currentView === 'dashboard') {
      newPath = '/dashboard';
      if (state.activeTab === 'new-order') newPath = '/dashboard/new-order';
      else if (state.activeTab === 'add-funds') newPath = '/dashboard/add-funds';
      else if (state.activeTab === 'services-list') newPath = '/dashboard/services';
      else if (state.activeTab === 'order-history') newPath = '/dashboard/history';
      else if (state.activeTab === 'support-tickets') newPath = '/dashboard/support';
      else if (state.activeTab === 'developer-api') newPath = '/dashboard/api';
      else if (state.activeTab === 'account') newPath = '/dashboard/account';
      else if (state.activeTab === 'affiliates') newPath = '/dashboard/affiliates';
      else if (state.activeTab === 'popular-services') newPath = '/dashboard/popular-services';
      else if (state.activeTab === 'admin-panel') newPath = '/dashboard/admin';
      else if (state.activeTab === 'terms-conditions') newPath = '/terms';
    } else {
      const authModal = document.getElementById('auth-modal');
      if (authModal && !authModal.classList.contains('hidden')) {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        if (loginForm && !loginForm.classList.contains('hidden')) {
          newPath = '/login';
        } else if (registerForm && !registerForm.classList.contains('hidden')) {
          newPath = '/signup';
        }
      }
    }
    
    if (window.location.pathname !== newPath) {
      window.history.pushState({}, '', newPath);
    }
  }

  async function handleClientRouting() {
    const path = window.location.pathname;
    const normPath = path.replace(/\/+$/, '').toLowerCase();
    
    if (normPath === '' || normPath === '/' || normPath === '/index.html') {
      await switchView('landing');
    } else if (normPath === '/login') {
      await switchView('landing');
      showAuthModal('login');
    } else if (normPath === '/signup') {
      await switchView('landing');
      showAuthModal('register');
    } else if (normPath === '/terms') {
      if (state.user) {
        await switchView('dashboard');
        switchTab('terms-conditions');
      } else {
        await switchView('terms');
      }
    } else if (normPath === '/privacy') {
      if (state.user) {
        await switchView('dashboard');
        switchTab('terms-conditions');
      } else {
        await switchView('terms');
      }
    } else if (normPath === '/dashboard') {
      await switchView('dashboard');
      switchTab('new-order');
    } else if (normPath === '/dashboard/new-order') {
      await switchView('dashboard');
      switchTab('new-order');
    } else if (normPath === '/dashboard/add-funds' || normPath === '/dashboard/addfunds') {
      await switchView('dashboard');
      switchTab('add-funds');
    } else if (normPath === '/dashboard/services') {
      await switchView('dashboard');
      switchTab('services-list');
    } else if (normPath === '/dashboard/history') {
      await switchView('dashboard');
      switchTab('order-history');
    } else if (normPath === '/dashboard/support') {
      await switchView('dashboard');
      switchTab('support-tickets');
    } else if (normPath === '/dashboard/account') {
      await switchView('dashboard');
      switchTab('account');
    } else if (normPath === '/dashboard/affiliates') {
      await switchView('dashboard');
      switchTab('affiliates');
    } else if (normPath === '/dashboard/popular-services' || normPath === '/dashboard/popular') {
      await switchView('dashboard');
      switchTab('popular-services');
    } else if (normPath === '/dashboard/admin' || normPath === '/dashboard/admin-panel') {
      await switchView('dashboard');
      switchTab('admin-panel');
    } else {
      await switchView('landing');
    }
  }

  // --- VIEW / ROUTING STATE CONTROLS ---
  async function switchView(viewName) {
    if (viewName === 'dashboard' && !state.user) {
      showAuthModal('login');
      window.history.pushState({}, '', '/login');
      return;
    }

    if (viewName === 'dashboard') {
      const loaded = await ensureDashboardLoaded();
      if (!loaded) {
        showPremiumToast("Error", "Could not securely initialize dashboard.", "error");
        return;
      }
    }

    state.currentView = viewName;
    closeMobileNavMenu();
    if (viewName !== 'dashboard') {
      closeMobileSidebar();
    }
    
    if (viewName === 'landing') {
      if (landingPageView) landingPageView.classList.remove('hidden');
      if (dashboardPageView) dashboardPageView.classList.add('hidden');
      if (termsPageView) termsPageView.classList.add('hidden');
      
      if (navHome) navHome.classList.add('active');
      if (navFeatures) navFeatures.classList.remove('active');
      if (navDashboardTrigger) navDashboardTrigger.classList.remove('active');
    } else if (viewName === 'dashboard') {
      if (landingPageView) landingPageView.classList.add('hidden');
      if (dashboardPageView) dashboardPageView.classList.remove('hidden');
      if (termsPageView) termsPageView.classList.add('hidden');
      
      if (navHome) navHome.classList.remove('active');
      if (navFeatures) navFeatures.classList.remove('active');
      if (navDashboardTrigger) navDashboardTrigger.classList.add('active');
      
      // Auto refresh order specs, history, balance
      syncUserBalance();
      renderOrderHistory();
    } else if (viewName === 'terms') {
      if (landingPageView) landingPageView.classList.add('hidden');
      if (dashboardPageView) dashboardPageView.classList.add('hidden');
      if (termsPageView) termsPageView.classList.remove('hidden');
      
      if (navHome) navHome.classList.remove('active');
      if (navFeatures) navFeatures.classList.remove('active');
      if (navDashboardTrigger) navDashboardTrigger.classList.remove('active');
    }

    syncAppShellState();
    updateBrowserURL();
  }


  async function loadUserDepositsHistory() {
    const tbody = document.getElementById('user-deposits-history-tbody');
    if (!tbody || !state.user) return;
    
    try {
      const res = await request('/api/user/deposits/history');
      if (!res.ok) throw new Error('Failed to load user deposit history.');
      const deposits = await res.json();
      state.userDeposits = Array.isArray(deposits) ? deposits : (deposits && Array.isArray(deposits.deposits) ? deposits.deposits : []);
      openClawEligibilityCache = null;
      
      if (state.userDeposits.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No deposits submitted yet.</td></tr>`;
        return;
      }
      
      tbody.innerHTML = state.userDeposits.map(d => {
        let statusBadge = '';
        if (d.status === 'Approved') {
          statusBadge = '<span class="badge-status completed">Approved</span>';
        } else if (d.status === 'Pending') {
          statusBadge = '<span class="badge-status pending">Pending</span>';
        } else {
          statusBadge = '<span class="badge-status" style="background-color: var(--danger-bg); color: var(--danger);">Rejected</span>';
        }
        
        const dateStr = d.created_at ? new Date(d.created_at).toLocaleString() : 'N/A';
        
        return `
          <tr class="premium-svc-row">
            <td data-label="Ref ID" style="font-weight: 700;">#${d.id}</td>
            <td data-label="Payment Method"><strong style="text-transform: uppercase;">${d.payment_method || d.paymentMethod}</strong></td>
            <td data-label="Amount" style="font-weight: 700; color: var(--primary);">₱${parseFloat(d.amount).toFixed(2)}</td>
            <td data-label="Reference ID" style="font-family: monospace;">${d.reference_id || d.referenceId}</td>
            <td data-label="Status">${statusBadge}</td>
            <td data-label="Submit Date" style="color: var(--text-secondary); font-size: 0.8rem;">${dateStr}</td>
          </tr>
        `;
      }).join('');
    } catch (err) {
      console.error("Error loading user deposits history:", err.message);
      tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-danger">Failed to load deposit history.</td></tr>`;
    }
  }

  function switchTab(tabName) {
    // Hard restrict Admin Control Panel to users with the 'admin' or 'super_admin' role only
    if (tabName === 'admin-panel' && (!state.user || (state.user.role !== 'admin' && state.user.role !== 'super_admin'))) {
      tabName = 'new-order';
    }

    state.activeTab = tabName;
    document.body.dataset.activeTab = state.activeTab;
    
    // Update sidebar links
    sidebarLinks.forEach(link => {
      if (link.getAttribute('data-tab') === tabName) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Update mobile sticky bottom nav links
    document.querySelectorAll('.bottom-nav-item').forEach(item => {
      if (item.getAttribute('data-bottom-tab') === tabName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Update top tab buttons active state and slide animation
    const topTabContainer = document.querySelector('.dash-top-tabs');
    if (topTabContainer) {
      const topTabs = topTabContainer.querySelectorAll('.top-tab-btn');
      topTabs.forEach(btn => {
        if (btn.getAttribute('data-dash-tab') === tabName) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
      // Toggle sliding indicator class
      if (tabName === 'add-funds') {
        topTabContainer.classList.add('show-add-funds');
      } else {
        topTabContainer.classList.remove('show-add-funds');
      }
    }

    // Toggle search bar behavior based on tab
    const searchInput = document.getElementById('dash-custom-service-search');
    if (searchInput) {
      if (tabName === 'add-funds') {
        searchInput.placeholder = "Search deposit ID or Reference ID...";
      } else {
        searchInput.placeholder = "Search for a service...";
      }
      searchInput.value = ''; // clear search query on tab change
      const searchMenu = document.getElementById('search-autocomplete-menu');
      if (searchMenu) {
        searchMenu.innerHTML = '';
        searchMenu.classList.add('hidden');
      }
    }

    // Update tab panes
    dashTabContents.forEach(pane => {
      if (pane.id === `tab-${tabName}`) {
        pane.classList.remove('hidden');
      } else {
        pane.classList.add('hidden');
      }
    });

    // Trigger tab specific actions
    if (tabName === 'services-list') {
      renderServicesDirectory();
    } else if (tabName === 'order-history') {
      // In live mode, refresh orders from server DB first, then sync statuses
      if (state.operatingMode === 'live' && state.user) {
        loadOrdersFromLocalStorage().then(() => {
          renderOrderHistory();
          syncOrdersStatus();
        });
      } else {
        syncOrdersStatus();
      }
    } else if (tabName === 'new-order') {
      populateNewOrderDropdowns();
    } else if (tabName === 'popular-services') {
      loadPopularServices();
    } else if (tabName === 'support-tickets') {
      loadUserTickets();
    } else if (tabName === 'add-funds') {
      loadUserDepositsHistory();
    } else if (tabName === 'developer-api') {
      updateDeveloperApiTab();
    } else if (tabName === 'admin-panel') {
      ensureAdminPanelLoaded().then(loaded => {
        if (loaded) {
          loadAdminPriceEditor();
          loadAdminTicketsQueue();
          loadSuperAdminSettings();
          loadAdminUsersList();
          loadAdminDepositsQueue();
        }
      });
    }
    syncFloatingWidgets();
    updateBrowserURL();
  }

  // Quick Guide dismiss
  (function initQuickGuide() {
    const banner = document.getElementById('quick-guide-banner');
    const btn = document.getElementById('btn-dismiss-quick-guide');
    if (!banner) return;
    if (localStorage.getItem('apex_quick_guide_dismissed') === '1') {
      banner.style.display = 'none';
      return;
    }
    if (btn) {
      btn.addEventListener('click', () => {
        banner.style.maxHeight = banner.scrollHeight + 'px';
        requestAnimationFrame(() => {
          banner.style.transition = 'max-height 0.35s ease, opacity 0.35s ease, margin 0.35s ease';
          banner.style.maxHeight = '0';
          banner.style.opacity = '0';
          banner.style.marginBottom = '0';
        });
        setTimeout(() => { banner.style.display = 'none'; }, 370);
        localStorage.setItem('apex_quick_guide_dismissed', '1');
      });
    }
  })();

  // --- EVENT LISTENERS SETUP ---
  function setupEventListeners() {
    // Navigation Routing clicks
    if (logoBtn) logoBtn.addEventListener('click', (e) => { e.preventDefault(); switchView('landing'); });
    if (navHome) navHome.addEventListener('click', (e) => { e.preventDefault(); switchView('landing'); window.scrollTo(0,0); });
    
    if (navFeatures) {
      navFeatures.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('landing');
        const promoSec = document.getElementById('services-promo');
        if (promoSec) promoSec.scrollIntoView({ behavior: 'smooth' });
      });
    }

    if (navDashboardTrigger) {
      navDashboardTrigger.addEventListener('click', async (e) => {
        e.preventDefault();
        if (state.user) {
          await switchView('dashboard');
          switchTab('new-order');
        } else {
          showAuthModal('login');
          window.history.pushState({}, '', '/login');
        }
      });
    }
    if (startBoostingBtn) {
      startBoostingBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        if (state.user) {
          await switchView('dashboard');
          switchTab('new-order');
        } else {
          showAuthModal('login');
          window.history.pushState({}, '', '/login');
        }
      });
    }
    if (browseServicesPromoBtn) {
      browseServicesPromoBtn.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('landing');
        setTimeout(() => {
          const promoSec = document.getElementById('services-promo');
          if (promoSec) promoSec.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      });
    }
    if (promoEnterDashBtn) {
      promoEnterDashBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        if (state.user) {
          await switchView('dashboard');
          switchTab('new-order');
        } else {
          showAuthModal('login');
          window.history.pushState({}, '', '/login');
        }
      });
    }

    // Landing Promo Catalog Filters
    if (promoCatFilters) {
      promoCatFilters.addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-pill')) {
          const filterBtns = promoCatFilters.querySelectorAll('.filter-pill');
          filterBtns.forEach(b => b.classList.remove('active'));
          e.target.classList.add('active');
          
          const catFilter = e.target.getAttribute('data-promo-cat');
          renderPromoCatalog(catFilter);
        }
      });
    }

    // Authentication UI Event Listeners
    if (navLoginBtn) {
      navLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showAuthModal('login');
      });
    }

    if (navLogoutBtn) {
      navLogoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleLogout();
      });
    }

    if (authCloseBtn) {
      authCloseBtn.addEventListener('click', hideAuthModal);
    }

    if (termsBackToHomeBtn) {
      termsBackToHomeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('landing');
      });
    }

    if (registerTermsLink) {
      registerTermsLink.addEventListener('click', (e) => {
        e.preventDefault();
        hideAuthModal();
        switchView('terms');
      });
    }

    if (registerPrivacyLink) {
      registerPrivacyLink.addEventListener('click', (e) => {
        e.preventDefault();
        hideAuthModal();
        switchView('terms');
      });
    }

    if (tabLoginBtn) {
      tabLoginBtn.addEventListener('click', () => switchAuthTab('login'));
    }

    if (tabRegisterBtn) {
      tabRegisterBtn.addEventListener('click', () => switchAuthTab('register'));
    }

    if (loginForm) {
      loginForm.addEventListener('submit', handleLoginSubmit);
    }
    document.querySelectorAll('[data-google-auth]').forEach((googleAuthBtn) => {
      googleAuthBtn.addEventListener('click', () => {
        const popup = window.open('/auth/google', 'apexboost-google-login', 'popup=yes,width=520,height=700');
        if (!popup) window.location.href = '/auth/google';
      });
    });

    if (registerForm) {
      registerForm.addEventListener('submit', handleRegisterSubmit);
    }
    if (registerNextBtn) registerNextBtn.addEventListener('click', showRegisterVerificationStep);
    if (registerBackBtn) registerBackBtn.addEventListener('click', () => setRegisterStep(1));
    window.addEventListener('apex:turnstile-ready', () => {
      if (loginForm && !loginForm.classList.contains('hidden')) renderLoginTurnstile();
      if (registerStep2 && !registerStep2.classList.contains('hidden')) renderRegisterTurnstile();
    });
    const registerPasswordInput = document.getElementById('register-password');
    if (registerPasswordInput) {
      registerPasswordInput.addEventListener('input', () => updatePasswordStrength(registerPasswordInput.value));
      updatePasswordStrength(registerPasswordInput.value);
    }

    if (registerOtpForm) {
      registerOtpForm.addEventListener('submit', handleRegisterOtpSubmit);
    }

    if (registerOtpResendBtn) {
      registerOtpResendBtn.addEventListener('click', handleRegisterOtpResend);
    }

    if (registerOtpBackBtn) {
      registerOtpBackBtn.addEventListener('click', (e) => {
        e.preventDefault();
        switchAuthTab('login');
      });
    }

    if (triggerForgotBtn) {
      triggerForgotBtn.addEventListener('click', (e) => {
        e.preventDefault();
        switchAuthTab('forgot');
      });
    }

    if (forgotBackToLoginBtn) {
      forgotBackToLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        switchAuthTab('login');
      });
    }

    if (forgotForm) {
      forgotForm.addEventListener('submit', (e) => {
        if (forgotStateReset && !forgotStateReset.classList.contains('hidden')) {
          handleResetSubmit(e);
          return;
        }
        handleForgotSubmit(e);
      });
    }

    if (btnSubmitNewPassword) {
      btnSubmitNewPassword.addEventListener('click', handleResetSubmit);
    }

    if (forgotResendCodeBtn) {
      forgotResendCodeBtn.addEventListener('click', handleForgotResendCode);
    }

    // Responsive Mobile Navbar Toggle
    const hamburgerToggle = document.getElementById('hamburger-toggle');
    const navLinks = document.getElementById('nav-links');
    
    if (hamburgerToggle && navLinks) {
      hamburgerToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        if (state.currentView === 'dashboard') {
          // Toggle dashboard sidebar drawer
          const dashSidebar = document.querySelector('.dash-sidebar');
          const sidebarBackdrop = document.getElementById('sidebar-backdrop');
          const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
          if (dashSidebar && sidebarBackdrop) {
            const isOpen = !dashSidebar.classList.contains('mobile-open');
            if (isOpen) {
              closeAllOverlays('sidebar'); // Close profile & updates dropdowns!
              dashSidebar.classList.add('mobile-open');
              hamburgerToggle.classList.add('active');
              if (sidebarToggleBtn) sidebarToggleBtn.classList.add('active');
              sidebarBackdrop.classList.remove('hidden');
            } else {
              dashSidebar.classList.remove('mobile-open');
              hamburgerToggle.classList.remove('active');
              if (sidebarToggleBtn) sidebarToggleBtn.classList.remove('active');
              sidebarBackdrop.classList.add('hidden');
            }
            syncAppShellState();
          }
        } else {
          // Normal landing page menu toggle
          hamburgerToggle.classList.toggle('active');
          navLinks.classList.toggle('mobile-active');
          syncAppShellState();
        }
      });
      
      // Close menu when clicking a link
      navLinks.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
          closeMobileNavMenu();
        });
      });
    }
    
    // Close menu when clicking outside navbar
    document.addEventListener('click', (e) => {
      if (navLinks && navLinks.classList.contains('mobile-active') && mainNavbar && !mainNavbar.contains(e.target)) {
        closeMobileNavMenu();
      }
    });

    // Mobile Sticky Bottom Nav tab switcher bindings
    document.querySelectorAll('.bottom-nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const tabName = item.getAttribute('data-bottom-tab');
        if (tabName) {
          closeAllOverlays();
          switchView('dashboard');
          switchTab(tabName);
        }
      });
    });

    // Mobile FAB Quick Support desk redirect
    const fabSupport = document.getElementById('fab-support');
    if (fabSupport) {
      fabSupport.addEventListener('click', () => {
        switchView('dashboard');
        switchTab('support-tickets');
        const ticketFormCard = document.getElementById('tab-support-tickets');
        if (ticketFormCard) {
          ticketFormCard.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }

    // Listen to browser back/forward buttons
    window.addEventListener('popstate', () => {
      handleClientRouting();
    });

    let fabResizeTimer = null;
    window.addEventListener('resize', () => {
      if (fabResizeTimer) window.clearTimeout(fabResizeTimer);
      fabResizeTimer = window.setTimeout(() => syncFloatingWidgets(), 120);
    }, { passive: true });

    // Close auth modal when clicking outside modal card
    if (authModal) {
      authModal.addEventListener('click', (e) => {
        if (e.target === authModal) {
          hideAuthModal();
        }
      });
    }

    // Global keydown Escape listener for active overlays
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (authModal && !authModal.classList.contains('hidden')) {
          hideAuthModal();
        }
        const compareModal = document.getElementById('compare-modal');
        if (compareModal && !compareModal.classList.contains('hidden')) {
          compareModal.classList.add('hidden');
        }
        const customAlertOverlay = document.getElementById('custom-alert-overlay');
        if (customAlertOverlay && customAlertOverlay.classList.contains('active')) {
          closeCustomAlerts();
        }
        const ticketChatOverlay = document.getElementById('ticket-chat-overlay');
        if (ticketChatOverlay && !ticketChatOverlay.classList.contains('hidden')) {
          ticketChatOverlay.classList.add('hidden');
        }
      }
    });
  }


  // --- BACKEND / CONFIGURATION CHECKS ---
  async function checkBackendConfig() {
    try {
      const response = await request('/api/config');
      if (!response.ok) throw new Error("Config endpoint unresponsive");
      
      const config = await response.json();
      state.liveModeAvailable = config.liveModeAvailable;
      state.demoModeEnabled = !!config.demoModeEnabled;
      
      // Update Maintenance Mode state & banner
      state.maintenanceMode = !!config.maintenanceMode;
      const maintenanceBanner = document.getElementById('maintenance-banner');
      if (maintenanceBanner) {
        if (state.maintenanceMode) {
          maintenanceBanner.classList.remove('hidden');
        } else {
          maintenanceBanner.classList.add('hidden');
        }
      }
      
      updateSettingsPanelStatus();
      updateBadgeUI();
      checkMaintenanceButtonState();
    } catch (error) {
      console.error("Backend config check failed: ", error);
      // Fail gracefully: assume server offline or demo mode fallback
      state.liveModeAvailable = false;
      updateSettingsPanelStatus(true);
    }
  }

  function checkMaintenanceButtonState() {
    const role = state.user ? state.user.role : '';
    const isAdmin = role === 'admin' || role === 'super_admin';
    const isMaintenance = !!state.maintenanceMode;
    const submitBtnSpan = submitOrderBtn ? submitOrderBtn.querySelector('span') : null;
    const catCustomDropdown = document.getElementById('category-custom-dropdown');
    const pkgCustomDropdown = document.getElementById('package-custom-dropdown');

    if (isMaintenance && !isAdmin) {
      if (submitOrderBtn) {
        submitOrderBtn.disabled = true;
        if (submitBtnSpan) {
          submitBtnSpan.textContent = "⚠️ Maintenance Mode Active";
        }
      }
      if (orderUrlInput) orderUrlInput.disabled = true;
      if (orderQuantityInput) orderQuantityInput.disabled = true;
      if (orderCategorySelect) orderCategorySelect.disabled = true;
      if (orderServiceSelect) orderServiceSelect.disabled = true;
      if (catCustomDropdown) catCustomDropdown.classList.add('disabled');
      if (pkgCustomDropdown) pkgCustomDropdown.classList.add('disabled');
    } else {
      if (orderCategorySelect) orderCategorySelect.disabled = false;
      if (catCustomDropdown) catCustomDropdown.classList.remove('disabled');
      
      if (submitOrderBtn) {
        if (submitBtnSpan && submitBtnSpan.textContent === "⚠️ Maintenance Mode Active") {
          submitOrderBtn.disabled = false;
          submitBtnSpan.textContent = "Launch Campaign 🚀";
        }
      }
      if (orderServiceSelect && orderServiceSelect.value) {
        if (orderServiceSelect) orderServiceSelect.disabled = false;
        if (pkgCustomDropdown) pkgCustomDropdown.classList.remove('disabled');
        if (orderUrlInput && orderUrlInput.disabled) orderUrlInput.disabled = false;
        if (orderQuantityInput && orderQuantityInput.disabled) orderQuantityInput.disabled = false;
        if (submitOrderBtn && submitOrderBtn.disabled) submitOrderBtn.disabled = false;
      }
    }
  }

  function updateSettingsPanelStatus(serverOffline = false) {
    if (serverOffline) {
      if (serverStatusDot) serverStatusDot.className = 'indicator-dot warning';
      if (serverStatusTitle) serverStatusTitle.textContent = "Server Offline / Network Issue";
      if (serverStatusDesc) serverStatusDesc.textContent = "Cannot communicate with the backend server right now.";
      if (settingsStatusAlert) settingsStatusAlert.className = 'settings-status-box warning';
      
      if (radioModeLive) radioModeLive.disabled = true;
      if (radioModeLiveLabel) radioModeLiveLabel.classList.add('disabled');
      if (radioModeDemo) radioModeDemo.checked = true;
      state.operatingMode = 'demo';
      return;
    }

    if (!state.demoModeEnabled) {
      if (radioModeDemoLabel) radioModeDemoLabel.classList.add('hidden');
      state.operatingMode = 'live';
      if (radioModeLive) {
        radioModeLive.checked = true;
        radioModeLive.disabled = false;
      }
      if (radioModeLiveLabel) {
        radioModeLiveLabel.classList.remove('disabled');
        radioModeLiveLabel.classList.add('active');
      }
      if (radioModeDemo) radioModeDemo.checked = false;
      localStorage.setItem(LOCAL_STORAGE_MODE_KEY, 'live');
    } else {
      if (radioModeDemoLabel) radioModeDemoLabel.classList.remove('hidden');
    }

    if (state.liveModeAvailable) {
      if (serverStatusDot) serverStatusDot.className = 'indicator-dot ok';
      if (serverStatusTitle) serverStatusTitle.textContent = "Live Provider Connected";
      if (serverStatusDesc) serverStatusDesc.textContent = "Your production provider connection is available.";
      if (settingsStatusAlert) settingsStatusAlert.className = 'settings-status-box ok';
      
      if (state.demoModeEnabled) {
        if (radioModeLive) radioModeLive.disabled = false;
        if (radioModeLiveLabel) radioModeLiveLabel.classList.remove('disabled');
        
        // Re-read local operating mode or default to demo if live is not selected
        const savedMode = localStorage.getItem(LOCAL_STORAGE_MODE_KEY) || 'demo';
        state.operatingMode = savedMode;
        if (state.operatingMode === 'live') {
          if (radioModeLive) radioModeLive.checked = true;
          if (radioModeLiveLabel) radioModeLiveLabel.classList.add('active');
          if (radioModeDemoLabel) radioModeDemoLabel.classList.remove('active');
        } else {
          if (radioModeDemo) radioModeDemo.checked = true;
          if (radioModeDemoLabel) radioModeDemoLabel.classList.add('active');
          if (radioModeLiveLabel) radioModeLiveLabel.classList.remove('active');
        }
      }
      
      if (saveSettingsBtn) saveSettingsBtn.disabled = !state.demoModeEnabled;
    } else {
      if (serverStatusDot) serverStatusDot.className = 'indicator-dot warning';
      if (serverStatusTitle) serverStatusTitle.textContent = "Live Provider Unavailable";
      if (serverStatusDesc) serverStatusDesc.textContent = "Live services are currently unavailable.";
      if (settingsStatusAlert) settingsStatusAlert.className = 'settings-status-box warning';
      
      if (radioModeLive) radioModeLive.disabled = true;
      if (radioModeLiveLabel) radioModeLiveLabel.classList.add('disabled');

      if (state.demoModeEnabled) {
        if (radioModeDemo) radioModeDemo.checked = true;
        state.operatingMode = 'demo';
        if (radioModeDemoLabel) radioModeDemoLabel.classList.add('active');
      } else {
        if (radioModeDemo) radioModeDemo.checked = false;
        state.operatingMode = 'live';
        if (radioModeDemoLabel) radioModeDemoLabel.classList.remove('active');
      }

      if (radioModeLiveLabel) radioModeLiveLabel.classList.remove('active');
      if (saveSettingsBtn) saveSettingsBtn.disabled = true;
    }
  }

  function handleRadioModeChange() {
    if (radioModeDemo.checked) {
      radioModeDemoLabel.classList.add('active');
      radioModeLiveLabel.classList.remove('active');
    } else if (radioModeLive.checked && !radioModeLive.disabled) {
      radioModeLiveLabel.classList.add('active');
      radioModeDemoLabel.classList.remove('active');
    }
  }

  function saveModeSettings(e) {
    e.preventDefault();
    if (!state.demoModeEnabled) {
      state.operatingMode = 'live';
    } else if (radioModeLive.checked && state.liveModeAvailable) {
      state.operatingMode = 'live';
    } else if (state.demoModeEnabled && radioModeDemo.checked) {
      state.operatingMode = 'demo';
    } else {
      state.operatingMode = 'live';
    }
    localStorage.setItem(LOCAL_STORAGE_MODE_KEY, state.operatingMode);
    updateBadgeUI();
    
    // Re-fetch services and balance for the new mode!
    syncServicesList().then(() => {
      syncUserBalance();
      populateNewOrderDropdowns();
    });

    // Alert user
    showPremiumToast("Operating Mode Switched", `Successfully switched Dashboard operating mode to: ${state.operatingMode.toUpperCase()}`, "info");
  }

  function updateBadgeUI() {
    const currentModeBadge = document.getElementById('current-mode-badge');
    if (!currentModeBadge) return;

    if (!state.demoModeEnabled) {
      currentModeBadge.classList.add('hidden');
      return;
    }

    currentModeBadge.classList.remove('hidden');
    if (state.operatingMode === 'live') {
      currentModeBadge.className = 'mode-badge live';
      currentModeBadge.querySelector('.mode-text').textContent = 'Live Mode';
    } else {
      currentModeBadge.className = 'mode-badge demo';
      currentModeBadge.querySelector('.mode-text').textContent = 'Demo Mode';
    }
  }


  function renderDirectoryLoading() {
    if (!servicesTableBody) return;
    servicesTableBody.innerHTML = `
      <tr>
        <td colspan="9" class="text-center py-4">
          <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
            <div class="spinner"></div>
            <span style="color: var(--text-muted); font-size: 0.85rem;">Retrieving services directory pricing...</span>
          </div>
        </td>
      </tr>
    `;
  }

  // --- SMM API SERVICES LIST SYNC ---
  async function syncServicesList() {
    renderSkeletonLoading();
    renderDirectoryLoading();
    
    // Set dropdowns to loading state
    const catTriggerText = document.querySelector('#category-custom-dropdown .trigger-text');
    const pkgTriggerText = document.querySelector('#package-custom-dropdown .trigger-text');
    const catCustomDropdown = document.getElementById('category-custom-dropdown');
    const pkgCustomDropdown = document.getElementById('package-custom-dropdown');
    
    if (catTriggerText) catTriggerText.textContent = "Loading categories... ⏳";
    if (pkgTriggerText) pkgTriggerText.textContent = "Loading packages... ⏳";
    if (catCustomDropdown) catCustomDropdown.classList.add('disabled');
    if (pkgCustomDropdown) pkgCustomDropdown.classList.add('disabled');

    try {
      const response = await request('/api/v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'services',
          mode: state.operatingMode
        })
      });

      if (!response.ok) throw new Error("Unable to retrieve SMM services from server proxy");
      const list = await response.json();

      if (list.error) {
        throw new Error(list.error);
      }
      state.services = list.map(s => ({
        ...s,
        name: cleanSmmText(s.name),
        category: cleanSmmText(s.category)
      }));

      const catsSet = new Set(state.services.map(s => s.category));
      state.categories = Array.from(catsSet).sort((a, b) => {
        if (a.includes('Hot Offers') || a.includes('🔥')) return -1;
        if (b.includes('Hot Offers') || b.includes('🔥')) return 1;
        return a.localeCompare(b);
      });

      // Enable dropdowns
      if (catTriggerText) catTriggerText.textContent = "Select Category...";
      if (pkgTriggerText) pkgTriggerText.textContent = "Select service package...";
      if (catCustomDropdown) catCustomDropdown.classList.remove('disabled');
      if (pkgCustomDropdown) pkgCustomDropdown.classList.remove('disabled');

      renderPromoCatalog();
      populateNewOrderDropdowns();
      populateServicesDirectoryFilters();
      renderServicesDirectory();

    } catch (error) {
      console.error("Services synchronization failed:", error);
      
      // Update dropdown trigger texts to indicate failure
      if (catTriggerText) catTriggerText.textContent = "Failed to load categories ⚠️";
      if (pkgTriggerText) pkgTriggerText.textContent = "Failed to load packages ⚠️";
      
      if (promoServicesGrid) {
        promoServicesGrid.innerHTML = `
          <div class="services-loading-state">
            <div style="font-size: 3rem; margin-bottom: 8px;">⚠️</div>
            <p style="color: var(--danger); margin-bottom: 8px; font-weight: 600;">Services unavailable</p>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">Services are temporarily unavailable. Please try again later.</p>
            <button class="btn btn-secondary btn-sm btn-retry-sync">🔄 Retry Synchronization</button>
          </div>
        `;
        const retryBtn = promoServicesGrid.querySelector('.btn-retry-sync');
        if (retryBtn) {
          retryBtn.addEventListener('click', () => syncServicesList());
        }
      }
      if (servicesTableBody) {
        servicesTableBody.innerHTML = `
          <tr>
            <td colspan="9" class="text-center py-4">
              <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
                <span style="color: var(--danger); font-weight: 600;">Failed to load services pricing catalog.</span>
                <button class="btn btn-secondary btn-sm btn-retry-sync-table" style="margin-top: 6px;">🔄 Retry loading catalog</button>
              </div>
            </td>
          </tr>
        `;
        const retryBtnTable = servicesTableBody.querySelector('.btn-retry-sync-table');
        if (retryBtnTable) {
          retryBtnTable.addEventListener('click', () => syncServicesList());
        }
      }
    }
  }

  function renderSkeletonLoading() {
    if (!promoServicesGrid) return;
    const skeletonCount = 6;
    const cards = [];
    for (let i = 0; i < skeletonCount; i++) {
      cards.push([
        '<div class="skeleton-card">',
        '  <div class="skeleton-line short"></div>',
        '  <div class="skeleton-line title"></div>',
        '  <div class="skeleton-line long"></div>',
        '  <div class="skeleton-line medium"></div>',
        '  <div class="skeleton-line price"></div>',
        '</div>'
      ].join('\n'));
    }
    promoServicesGrid.innerHTML = '<div class="skeleton-grid">\n' + cards.join('\n') + '\n</div>';
  }

  // --- USER BALANCE SYNC ---
  function updateUserDashboardSummary() {
    const summaryBalance = document.getElementById('user-summary-balance');
    if (summaryBalance) summaryBalance.textContent = `₱${(parseFloat(state.balance) || 0).toFixed(2)}`;

    const counts = { pending: 0, processing: 0, completed: 0, failed: 0 };
    (state.orders || []).forEach((order) => {
      const status = String(order.status || '').toLowerCase();
      if (status.includes('complete')) counts.completed += 1;
      else if (status.includes('process') || status.includes('progress')) counts.processing += 1;
      else if (status.includes('fail') || status.includes('cancel')) counts.failed += 1;
      else counts.pending += 1;
    });

    setText('summary-pending-orders', counts.pending);
    setText('summary-processing-orders', counts.processing);
    setText('summary-completed-orders', counts.completed);
    setText('summary-failed-orders', counts.failed);
  }

  async function syncUserBalance() {
    const refreshIcon = refreshBalanceBtn ? refreshBalanceBtn.querySelector('svg') : null;
    if (refreshIcon) refreshIcon.classList.add('spinner');
    try {
      if (!state.user) return;

      const response = await request('/api/v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'balance',
          mode: state.operatingMode
        })
      });

      if (!response.ok) throw new Error("Balance endpoint returned error");
      const data = await response.json();
      
      if (data.error) {
        console.error("Balance fetch error:", data.error);
        state.balance = 0.00;
      } else {
        const parsedBal = parseFloat(data.balance);
        state.balance = isNaN(parsedBal) ? 0.00 : parsedBal;
      }
      
      // Update UI displays
      const balanceStr = `₱${state.balance.toFixed(2)}`;
      const sidebarBalance = document.getElementById('sidebar-balance-value');
      if (sidebarBalance) sidebarBalance.textContent = balanceStr;
      
      const tooltipBal = document.getElementById('tooltip-balance-val');
      if (tooltipBal) tooltipBal.textContent = balanceStr;
      
      const dropdownBalanceVal = document.getElementById('dropdown-balance-val');
      if (dropdownBalanceVal) dropdownBalanceVal.textContent = balanceStr;
      updateUserDashboardSummary();
      openClawEligibilityCache = null;
      syncFloatingWidgets();
      if (typeof window.syncUserNotifications === 'function') {
        window.syncUserNotifications();
      }
    } catch (error) {
      console.error("Failed to sync user balance:", error);
      const sidebarBalance = document.getElementById('sidebar-balance-value');
      if (sidebarBalance) sidebarBalance.textContent = "Offline";
      const tooltipBal = document.getElementById('tooltip-balance-val');
      if (tooltipBal) tooltipBal.textContent = "Offline";
    } finally {
      setTimeout(() => {
        if (refreshIcon) refreshIcon.classList.remove('spinner');
      }, 500);
    }
  }


  // --- PROMO SERVICES PREVIEW CATALOG ---
  function renderPromoCatalog(filterCategory = 'all') {
    if (!promoServicesGrid) return;
    promoServicesGrid.innerHTML = '';
    
    // Curate best seller or filter categories
    let filtered = [];
    if (filterCategory === 'all') {
      // Pick the cheapest service for each of the main platforms to showcase all channels
      const platforms = ['facebook', 'instagram', 'tiktok', 'youtube', 'telegram', 'x'];
      const cheapestPerPlatform = [];
      
      platforms.forEach(plat => {
        // Filter services belonging to this platform
        const platServices = state.services.filter(s => getPlatformFromCategory(s.category) === plat);
        if (platServices.length > 0) {
          // Sort by rate ascending and pick the cheapest one
          const sortedPlatServices = [...platServices].sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate));
          cheapestPerPlatform.push(sortedPlatServices[0]);
        }
      });

      // If we don't have enough platform services, fill in with any cheapest services
      if (cheapestPerPlatform.length < 6) {
        const sortedAll = [...state.services].sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate));
        for (let s of sortedAll) {
          if (cheapestPerPlatform.length >= 6) break;
          if (!cheapestPerPlatform.some(existing => existing.service === s.service)) {
            cheapestPerPlatform.push(s);
          }
        }
      }
      
      // Sort the final selection by rate ascending
      filtered = cheapestPerPlatform.sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate)).slice(0, 6);
    } else {
      // Matches categories containing platform keywords, sorted by rate ascending to show cheapest
      filtered = state.services.filter(s => 
        s.category.toLowerCase().includes(filterCategory.toLowerCase())
      ).sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate)).slice(0, 6);
    }

    if (filtered.length === 0) {
      promoServicesGrid.innerHTML = `
        <div class="services-loading-state">
          <p>No active services in this category. Navigate to the dashboard for full listings.</p>
        </div>
      `;
      return;
    }

    filtered.forEach(s => {
      const card = document.createElement('div');
      card.className = 'promo-service-card';
      card.style.display = 'flex';
      card.style.flexDirection = 'column';
      card.style.justifyContent = 'space-between';
      
      // Icon mapping based on category name
      let logoHtml = '<span class="cat-logo-wrap">🌐</span>';
      const cat = s.category.toLowerCase();
      if (cat.includes('instagram')) logoHtml = '<img src="/images/instagram.png" alt="Instagram" class="cat-logo">';
      else if (cat.includes('tiktok')) logoHtml = '<img src="/images/tiktok.png" alt="TikTok" class="cat-logo">';
      else if (cat.includes('youtube')) logoHtml = '<img src="/images/youtube.png" alt="YouTube" class="cat-logo">';
      else if (cat.includes('facebook')) logoHtml = '<img src="/images/facebook.png" alt="Facebook" class="cat-logo">';
      else if (cat.includes('twitter') || cat.includes('x -') || cat.includes('x (')) logoHtml = '<img src="/images/x.png" alt="X" class="cat-logo">';
      else if (cat.includes('telegram')) logoHtml = '<img src="/images/telegram.png" alt="Telegram" class="cat-logo">';
      else if (cat.includes('🔥')) logoHtml = '<span class="cat-logo-wrap">🔥</span>';

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 4px;">
          <span class="cat-badge" style="margin-bottom: 0;">${logoHtml} ${s.category}</span>
          <span class="status-badge new" style="font-size: 0.68rem; padding: 2px 6px; font-weight: 700; flex-shrink: 0; background: var(--primary-glow); border-color: rgba(20, 184, 166, 0.3); color: var(--primary); text-transform: uppercase;">ID: #${s.service}</span>
        </div>
        <h3 class="title" style="margin-bottom: 10px;">${s.name}</h3>
        <div class="specs" style="margin-bottom: 15px; border-top: 1px solid var(--border-color); padding-top: 0.8rem;">
          <span>Min: <strong>${s.min}</strong> | Max: <strong>${s.max}</strong></span>
          <span class="price">₱${parseFloat(s.rate).toFixed(2)} <small>/1K</small></span>
        </div>
        <button type="button" class="btn btn-primary btn-sm btn-block btn-order-now" style="margin-top: auto; padding: 8px 12px; font-weight: 700; letter-spacing: 0.3px; border-radius: 6px;">Order Now 🚀</button>
      `;

      const orderNowBtn = card.querySelector('.btn-order-now');
      if (orderNowBtn) {
        orderNowBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          triggerOrderNowFlow(s.category, s.service);
        });
      }
      
      promoServicesGrid.appendChild(card);
    });
  }

  // Automated routing & pre-population for 'Order Now' visual desk triggers
  function triggerOrderNowFlow(category, serviceId) {
    if (!state.user) {
      showPremiumToast("Authentication Required", "Please log in or register to place SMM orders.", "error");
      showAuthModal('login');
      return;
    }

    // A. Switch app viewport shell to SMM Control Desk
    switchView('dashboard');
    
    // B. Switch navigation menu tab to New Order
    switchTab('new-order');

    // C. Populate Category dropdown selection
    if (orderCategorySelect) {
      orderCategorySelect.value = category;
      populateServicesDropdownForCategory(category);
      if (typeof updateCustomDropdownTriggerText === 'function') {
        updateCustomDropdownTriggerText();
      }
    }
    
    // D. Populate Package dropdown selection and trigger AI/Limit calculators
    if (orderServiceSelect) {
      orderServiceSelect.value = serviceId;
      orderServiceSelect.disabled = false;
      handleServiceSelectionChange(serviceId);
      if (typeof updateCustomPackageTriggerText === 'function') {
        updateCustomPackageTriggerText();
      }
    }
    
    // E. Smooth scroll screen to New Order Form
    const form = document.getElementById('smm-order-form');
    if (form) {
      setTimeout(() => {
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Highlight form momentarily for visual cue
        form.style.boxShadow = '0 0 40px rgba(20, 184, 166, 0.4)';
        setTimeout(() => {
          form.style.boxShadow = '';
        }, 1500);
      }, 350);
    }
  }


  // --- NEW CAMPAIGN ORDER DESK ---
  // Helper: Classify platform based on category name
  function getPlatformFromCategory(categoryName) {
    const cat = categoryName.toLowerCase();
    if (cat.includes('facebook')) return 'facebook';
    if (cat.includes('instagram')) return 'instagram';
    if (cat.includes('tiktok')) return 'tiktok';
    if (cat.includes('youtube')) return 'youtube';
    if (cat.includes('twitter') || cat.includes('x -') || cat.includes('x (')) return 'x';
    if (cat.includes('telegram')) return 'telegram';
    return 'other';
  }

  // Helper: Verify if SMM URL matches the selected social platform
  function validateOrderUrl(url, platform) {
    if (!url) return true;
    const urlLower = url.toLowerCase();
    switch (platform) {
      case 'facebook':
        return urlLower.includes('facebook.com') || urlLower.includes('fb.watch') || urlLower.includes('fb.com');
      case 'instagram':
        return urlLower.includes('instagram.com') || urlLower.includes('ig.me') || urlLower.includes('instagr.am');
      case 'tiktok':
        return urlLower.includes('tiktok.com') || urlLower.includes('vm.tiktok.com');
      case 'youtube':
        return urlLower.includes('youtube.com') || urlLower.includes('youtu.be') || urlLower.includes('youtube-nocookie.com');
      case 'x':
        return urlLower.includes('twitter.com') || urlLower.includes('x.com');
      case 'telegram':
        return urlLower.includes('t.me') || urlLower.includes('telegram.me') || urlLower.includes('telegram.dog');
      default:
        return true;
    }
  }

  function populateNewOrderDropdowns() {
    if (!orderCategorySelect) return;
    
    // Preserve active category if possible
    const currentCatSelection = orderCategorySelect.value;
    
    orderCategorySelect.innerHTML = '<option value="" disabled selected>Select Category...</option>';
    
    // Filter categories based on active platform tab selection
    const activePlatform = state.selectedOrderPlatform || 'all';
    const filteredCategories = state.categories.filter(cat => {
      if (activePlatform === 'all') return true;
      return getPlatformFromCategory(cat) === activePlatform;
    });

    filteredCategories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      orderCategorySelect.appendChild(opt);
    });

    if (filteredCategories.includes(currentCatSelection)) {
      orderCategorySelect.value = currentCatSelection;
      populateServicesDropdownForCategory(currentCatSelection);
    } else {
      orderCategorySelect.value = "";
      orderServiceSelect.innerHTML = '<option value="" disabled selected>Select service package...</option>';
      orderServiceSelect.disabled = true;
      disableOrderFormFields();
    }

    // Dynamic sync of premium custom category dropdown options
    syncCustomCategoryDropdown();

    // Dynamically update DeepSeek AI Recommendations
    renderDeepSeekSmartSuggestions(activePlatform);
  }

  // --- PREMIUM CUSTOM DROPDOWN CONTROL LOGIC ---

  function updateCustomDropdownTriggerText() {
    const val = orderCategorySelect.value;
    const triggerText = document.querySelector('#category-custom-dropdown .trigger-text');
    const triggerIcon = document.getElementById('category-trigger-icon');
    if (!triggerText || !triggerIcon) return;
    
    if (!val) {
      triggerText.textContent = "Select Category...";
      triggerIcon.innerHTML = "🌐";
      return;
    }
    
    triggerText.textContent = val;
    const platform = getPlatformFromCategory(val);
    if (platform !== 'other' && platform !== 'all') {
      triggerIcon.innerHTML = `<img src="/images/${platform}.png" alt="${platform}" style="width: 16px; height: 16px; object-fit: contain;">`;
    } else {
      triggerIcon.innerHTML = "🌐";
    }
  }

  function syncCustomCategoryDropdown() {
    const customDropdown = document.getElementById('category-custom-dropdown');
    const trigger = document.getElementById('category-dropdown-trigger');
    const menu = document.getElementById('category-dropdown-menu');
    if (!customDropdown || !trigger || !menu) return;
    
    // Trigger toggle setup removed (now bound once at load initialization)
    
    // Populate dropdown items from the native select options
    menu.innerHTML = '';
    const options = Array.from(orderCategorySelect.options).filter(opt => opt.value);
    
    options.forEach(opt => {
      const val = opt.value;
      const platform = getPlatformFromCategory(val);
      
      const item = document.createElement('div');
      item.className = 'custom-dropdown-item';
      if (orderCategorySelect.value === val) {
        item.classList.add('active');
      }
      
      // Platform logo mapping
      let logoHtml = '🌐';
      if (platform !== 'other' && platform !== 'all') {
        logoHtml = `<img src="/images/${platform}.png" alt="${platform}" class="item-logo">`;
      }
      
      // Auto highlight recommended categories (keywords: cheapest, 🔥, drop, best, hq, real, provider)
      const valLower = val.toLowerCase();
      const isRecommended = valLower.includes('🔥') || 
                            valLower.includes('cheapest') || 
                            valLower.includes('best') || 
                            valLower.includes('non drop') || 
                            valLower.includes('hq') || 
                            valLower.includes('real') || 
                            valLower.includes('provider') ||
                            valLower.includes('own service');
      
      const recommendedTagHtml = isRecommended 
        ? `<span class="badge-recommended">💎 Rec</span>` 
        : '';
        
      item.innerHTML = `
        <div class="item-left">
          ${logoHtml}
          <span>${val}</span>
        </div>
        ${recommendedTagHtml}
      `;
      
      item.onclick = function(e) {
        e.stopPropagation();
        orderCategorySelect.value = val;
        
        // Trigger both change and sync
        orderCategorySelect.dispatchEvent(new Event('change'));
        
        // Remove active class from other items
        menu.querySelectorAll('.custom-dropdown-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        // Close menu
        customDropdown.classList.remove('active');
        menu.classList.add('hidden');
        if (orderForm) orderForm.classList.remove('is-category-dropdown-open');
      };
      
      menu.appendChild(item);
    });
    
    // Always sync the trigger text initially
    updateCustomDropdownTriggerText();
  }

  // --- PREMIUM SERVICE PACKAGE CUSTOM DROPDOWN CONTROL LOGIC ---

  function updateCustomPackageTriggerText() {
    const val = orderServiceSelect.value;
    const triggerText = document.querySelector('#package-custom-dropdown .trigger-text');
    const triggerIcon = document.getElementById('package-trigger-icon');
    if (!triggerText || !triggerIcon) return;
    
    if (!val) {
      triggerText.textContent = "Select service package...";
      triggerIcon.innerHTML = "📦";
      return;
    }
    
    const selectedService = state.services.find(s => s.service.toString() === val.toString());
    if (selectedService) {
      const formatted = formatServiceName(selectedService.name);
      triggerText.textContent = `[ID: ${selectedService.service}] ${formatted.name}`;
      
      const platform = getPlatformFromCategory(selectedService.category);
      if (platform !== 'other' && platform !== 'all') {
        triggerIcon.innerHTML = `<img src="/images/${platform}.png" alt="${platform}" style="width: 16px; height: 16px; object-fit: contain;">`;
      } else {
        triggerIcon.innerHTML = "📦";
      }
    } else {
      triggerText.textContent = "Select service package...";
      triggerIcon.innerHTML = "📦";
    }
  }

  function syncCustomPackageDropdown() {
    const customDropdown = document.getElementById('package-custom-dropdown');
    const trigger = document.getElementById('package-dropdown-trigger');
    const menu = document.getElementById('package-dropdown-menu');
    if (!customDropdown || !trigger || !menu) return;
    
    // Trigger toggle setup removed (now bound once at load initialization)
    
    // Populate dropdown items from the native select options
    menu.innerHTML = '';
    const options = Array.from(orderServiceSelect.options).filter(opt => opt.value);
    
    options.forEach(opt => {
      const val = opt.value;
      const selectedService = state.services.find(s => s.service.toString() === val.toString());
      if (!selectedService) return;
      
      const item = document.createElement('div');
      item.className = 'custom-dropdown-item';
      if (orderServiceSelect.value === val) {
        item.classList.add('active');
      }
      
      // Parse service name beautifully
      const formatted = formatServiceName(selectedService.name);
      const detailsHtml = formatted.details.map(d => `<span class="service-detail-pill" style="font-size: 0.65rem;">${d}</span>`).join('');
      
      // Dynamic DeepSeek AI Badge evaluation
      const aiStatus = classifyServiceWithAI(selectedService);
      
      item.innerHTML = `
        <div class="item-left" style="max-width: 70%;">
          <span class="item-id">#${selectedService.service}</span>
          <div class="item-text-block" style="text-align: left;">
            <span class="item-name" style="display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">[ID: ${selectedService.service}] ${formatted.name}</span>
            ${formatted.details.length > 0 ? `<div class="service-details-row" style="margin-top: 4px;">${detailsHtml}</div>` : ''}
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
          <span class="badge-ai-status ${aiStatus.class}" style="padding: 2px 6px; font-size: 0.65rem;">${aiStatus.text}</span>
          <span class="text-success font-weight-bold" style="font-size: 0.88rem;">₱${parseFloat(selectedService.rate).toFixed(2)}</span>
        </div>
      `;
      
      item.onclick = function(e) {
        e.stopPropagation();
        orderServiceSelect.value = val;
        
        // Trigger native change events cascade
        orderServiceSelect.dispatchEvent(new Event('change'));
        
        // Mark active item in list
        menu.querySelectorAll('.custom-dropdown-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        // Close menu
        customDropdown.classList.remove('active');
        menu.classList.add('hidden');
        if (orderForm) orderForm.classList.remove('is-package-dropdown-open');
      };
      
      menu.appendChild(item);
    });
    
    // Always sync the trigger text initially
    updateCustomPackageTriggerText();
  }

  function populateServicesDropdownForCategory(categoryName) {
    orderServiceSelect.innerHTML = '<option value="" disabled selected>Select service package...</option>';
    
    const filtered = state.services.filter(s => s.category === categoryName);
    filtered.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.service;
      opt.textContent = `[ID: ${s.service}] ${s.name} - ₱${parseFloat(s.rate).toFixed(2)}/1K`;
      orderServiceSelect.appendChild(opt);
    });

    // Reset specs and lock secondary inputs first!
    disableOrderFormFields();

    // Enable native package dropdown select
    orderServiceSelect.disabled = false;
    
    // Enable premium custom package dropdown trigger
    const customPkgDropdown = document.getElementById('package-custom-dropdown');
    if (customPkgDropdown) {
      customPkgDropdown.classList.remove('disabled');
    }
    
    // Synchronize custom package dropdown options and populate
    syncCustomPackageDropdown();
  }

  function handleServiceSelectionChange(serviceId) {
    const selectedService = state.services.find(s => s.service.toString() === serviceId.toString());
    if (!selectedService) return;

    // Show dynamic specs card
    serviceSpecsBox.classList.remove('hidden');
    specRateSpan.textContent = `₱${parseFloat(selectedService.rate).toFixed(2)}`;
    specMinSpan.textContent = parseInt(selectedService.min).toLocaleString();
    specMaxSpan.textContent = parseInt(selectedService.max).toLocaleString();
    specTypeSpan.textContent = selectedService.type;

    calcRatePer1k.textContent = `₱${parseFloat(selectedService.rate).toFixed(2)}`;
    quantityLimitsTip.textContent = `Limits: Min ${selectedService.min} - Max ${selectedService.max}`;

    // Enable quantity & link input
    orderUrlInput.disabled = false;
    orderQuantityInput.disabled = false;
    submitOrderBtn.disabled = false;
    
    // Trigger recalculation if quantity is already typed
    calculateOrderCost();

    // Disable if maintenance mode is active
    checkMaintenanceButtonState();

    // DeepSeek AI™ Speed & Success Predictor Calculations
    const nameLower = (selectedService.name || '').toLowerCase();
    const rateVal = parseFloat(selectedService.rate) || 0;
    
    let deliveryTime = '10 - 25 minutes';
    let stability = '99.8% (Ultra-Stable)';
    let stabilityClass = 'var(--success)';
    
    if (nameLower.includes('slow') || nameLower.includes('drip')) {
      deliveryTime = '6 - 24 hours';
      stability = '95.4% (Stable)';
      stabilityClass = '#f59e0b'; // amber
    } else if (nameLower.includes('instant') || nameLower.includes('rapid') || rateVal < 10) {
      deliveryTime = '2 - 15 minutes';
      stability = '99.9% (Instant)';
      stabilityClass = 'var(--success)';
    } else if (nameLower.includes('organic') || nameLower.includes('real')) {
      deliveryTime = '15 - 45 minutes';
      stability = '99.4% (High Quality)';
      stabilityClass = 'var(--success)';
    } else if (nameLower.includes('no refill') || nameLower.includes('cheap')) {
      deliveryTime = '5 - 30 minutes';
      stability = '85.2% (Medium Risk)';
      stabilityClass = '#ef4444'; // red
    }
    
    const aiPredictorCard = document.getElementById('ai-predictor-card');
    const aiPredDelivery = document.getElementById('ai-pred-delivery');
    const aiPredStability = document.getElementById('ai-pred-stability');
    
    if (aiPredictorCard && aiPredDelivery && aiPredStability) {
      aiPredDelivery.textContent = deliveryTime;
      aiPredStability.textContent = stability;
      aiPredStability.style.color = stabilityClass;
      aiPredictorCard.classList.remove('hidden');
    }

    // Update Filipino Warning box estimated delivery & speed badge
    const preSubmitServiceTime = document.getElementById('pre-submit-service-time');
    const preSubmitSpeedBadge = document.getElementById('pre-submit-speed-badge');
    if (preSubmitServiceTime) {
      preSubmitServiceTime.textContent = deliveryTime;
    }
    if (preSubmitSpeedBadge) {
      preSubmitSpeedBadge.classList.remove('hidden', 'muted', 'speed-fast', 'speed-moderate', 'speed-slow');
      preSubmitSpeedBadge.removeAttribute('hidden');
      preSubmitSpeedBadge.removeAttribute('aria-hidden');
      if (stability.includes('Ultra-Stable') || stability.includes('Instant') || stability.includes('High Quality')) {
        preSubmitSpeedBadge.classList.add('speed-fast');
        preSubmitSpeedBadge.textContent = 'Mabilis / Stable';
      } else if (stability.includes('Stable')) {
        preSubmitSpeedBadge.classList.add('speed-moderate');
        preSubmitSpeedBadge.textContent = 'Katamtaman';
      } else {
        preSubmitSpeedBadge.classList.add('speed-slow');
        preSubmitSpeedBadge.textContent = 'High Risk / Mabagal';
      }
    }

    // POPULATE PREMIUM DETAILS PANEL CARD
    const detailsMin = document.getElementById('details-minimum-val');
    const detailsMax = document.getElementById('details-maximum-val');
    const detailsLink = document.getElementById('details-example-link');
    const detailsAvg = document.getElementById('details-avg-time-val');
    const detailsDesc = document.getElementById('details-description-val');

    if (detailsMin) detailsMin.textContent = parseInt(selectedService.min).toLocaleString();
    if (detailsMax) detailsMax.textContent = parseInt(selectedService.max).toLocaleString();

    // 1. Example Link Simulator - Visually shortened with premium badge label to prevent wraps!
    if (detailsLink) {
      const platform = getPlatformFromCategory(selectedService.category);
      let sampleUrl = 'https://your-target-link.com/profile';
      
      if (platform === 'facebook') sampleUrl = 'https://www.facebook.com/profile.php?id=10008472';
      else if (platform === 'instagram') sampleUrl = 'https://www.instagram.com/apexsmmboost';
      else if (platform === 'tiktok') sampleUrl = 'https://www.tiktok.com/@apexsmmboost/video/73910297';
      else if (platform === 'youtube') sampleUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      else if (platform === 'telegram') sampleUrl = 'https://t.me/apexsmmboost';
      else if (platform === 'x') sampleUrl = 'https://x.com/apexsmmboost';

      let domainLabel = 'target-link.com 🔗';
      try {
        const parsedUrl = new URL(sampleUrl);
        domainLabel = parsedUrl.hostname.replace('www.', '') + ' 🔗';
      } catch(e) {}

      detailsLink.innerHTML = `<span class="premium-url-badge">${domainLabel}</span>`;
      detailsLink.style.cursor = 'pointer';
      detailsLink.onclick = () => window.open(sampleUrl, '_blank');
    }

    // 1.1 Backing Glow Platform Adaptivity
    const glowEl = document.getElementById('details-platform-glow');
    if (glowEl) {
      const platform = getPlatformFromCategory(selectedService.category);
      glowEl.className = 'details-platform-glow'; // Reset classes
      if (platform === 'facebook') glowEl.classList.add('facebook-glow');
      else if (platform === 'instagram') glowEl.classList.add('instagram-glow');
      else if (platform === 'tiktok') glowEl.classList.add('tiktok-glow');
      else if (platform === 'youtube') glowEl.classList.add('youtube-glow');
      else if (platform === 'telegram') glowEl.classList.add('telegram-glow');
      else if (platform === 'x') glowEl.classList.add('x-glow');
    }

    // 2. Average Time Simulator
    if (detailsAvg) {
      const name = (selectedService.name || '').toLowerCase();
      let simulatedTime = '6 hours and 14 minutes';

      if (name.includes('hidden')) {
        simulatedTime = '388 hours and 33 minutes';
      } else if (name.includes('instant') || name.includes('super fast') || name.includes('fast')) {
        simulatedTime = '12 minutes';
      } else if (name.includes('organic') || name.includes('stable')) {
        simulatedTime = '24 hours and 45 minutes';
      } else if (name.includes('subscriber') || name.includes('watch hours')) {
        simulatedTime = '72 hours';
      }

      detailsAvg.textContent = simulatedTime;
    }

    // 3. Description text population
    if (detailsDesc) {
      const type = selectedService.type || 'Default';
      const parsed = formatServiceName(selectedService.name);
      
      let descText = `Premium ${selectedService.category} channel service campaign. High-precision algorithms trigger automated boosts within minutes. All orders are processed securely via direct API reseller channels.`;
      
      if (parsed.details.length > 0) {
        descText += ` Feature attributes detected: ${parsed.details.join(', ')}.`;
      }
      
      descText += ` Safe organic algorithm maintains absolute profile integrity. Type: ${type}.`;
      detailsDesc.textContent = descText;
    }
  }

  function disableOrderFormFields() {
    serviceSpecsBox.classList.add('hidden');
    if (orderUrlInput) {
      orderUrlInput.disabled = true;
      orderUrlInput.value = '';
      orderUrlInput.style.borderColor = '';
    }
    if (orderQuantityInput) {
      orderQuantityInput.disabled = true;
      orderQuantityInput.value = '';
    }
    if (submitOrderBtn) {
      submitOrderBtn.disabled = true;
    }
    state.isUrlInputDirty = false;
    const warningEl = document.getElementById('url-validation-warning');
    if (warningEl) warningEl.classList.add('hidden');
    calcRatePer1k.textContent = "₱0.00";
    calcTotalCharge.textContent = "₱0.00";
    
    // Reset Filipino Warning box estimated delivery & speed badge
    const preSubmitServiceTime = document.getElementById('pre-submit-service-time');
    const preSubmitSpeedBadge = document.getElementById('pre-submit-speed-badge');
    if (preSubmitServiceTime) {
      preSubmitServiceTime.textContent = "Pumili muna ng service package.";
    }
    if (preSubmitSpeedBadge) {
      preSubmitSpeedBadge.classList.add('hidden', 'muted');
      preSubmitSpeedBadge.classList.remove('speed-fast', 'speed-moderate', 'speed-slow');
      preSubmitSpeedBadge.setAttribute('hidden', 'true');
      preSubmitSpeedBadge.setAttribute('aria-hidden', 'true');
      preSubmitSpeedBadge.textContent = "—";
    }
    
    // Clear and disable custom package trigger
    const customPkgDropdown = document.getElementById('package-custom-dropdown');
    if (customPkgDropdown) {
      customPkgDropdown.classList.add('disabled');
      customPkgDropdown.classList.remove('active');
      const menu = document.getElementById('package-dropdown-menu');
      if (menu) menu.classList.add('hidden');
    }

    // Reset Service details card visual states to a professional placeholder!
    const detailsMin = document.getElementById('details-minimum-val');
    const detailsMax = document.getElementById('details-maximum-val');
    const detailsLink = document.getElementById('details-example-link');
    const detailsAvg = document.getElementById('details-avg-time-val');
    const detailsDesc = document.getElementById('details-description-val');
    const glowEl = document.getElementById('details-platform-glow');

    if (detailsMin) detailsMin.textContent = "—";
    if (detailsMax) detailsMax.textContent = "—";
    if (detailsLink) {
      detailsLink.innerHTML = `<span class="premium-url-badge placeholder-badge">example.com 🔗</span>`;
      detailsLink.style.cursor = 'default';
      detailsLink.onclick = null;
    }
    if (detailsAvg) detailsAvg.textContent = "—";
    if (detailsDesc) {
      detailsDesc.textContent = "Select a premium boosting service package to view real-time delivery rules, speed details, and platform instructions.";
    }
    if (glowEl) {
      glowEl.className = 'details-platform-glow'; // Reset back to inactive state
    }
  }

  function calculateOrderCost() {
    const serviceId = orderServiceSelect.value;
    const qty = parseInt(orderQuantityInput.value, 10);
    
    if (!serviceId || isNaN(qty) || qty <= 0) {
      calcTotalCharge.textContent = "₱0.00";
      return;
    }

    const selectedService = state.services.find(s => s.service.toString() === serviceId.toString());
    if (!selectedService) return;

    const rate = parseFloat(selectedService.rate);
    const cost = (rate * (qty / 1000)).toFixed(2);
    
    calcTotalCharge.textContent = `₱${parseFloat(cost).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

    // Highlight cost if balance is insufficient
    if (state.balance < parseFloat(cost)) {
      calcTotalCharge.style.color = 'var(--danger)';
    } else {
      calcTotalCharge.style.color = 'var(--success)';
    }
  }

  async function handleOrderSubmission(e) {
    e.preventDefault();
    
    const serviceId = orderServiceSelect.value;
    const url = orderUrlInput.value.trim();
    const qty = parseInt(orderQuantityInput.value, 10);

    // Basic UI Validation
    if (!serviceId) {
      showFormAlert("Please select a service package.", "error");
      return;
    }

    if (!url) {
      showFormAlert("Please enter a valid target link/URL.", "error");
      return;
    }

    if (isNaN(qty) || qty <= 0) {
      showFormAlert("Please enter a valid positive number for quantity.", "error");
      return;
    }

    const selectedService = state.services.find(s => s.service.toString() === serviceId.toString());
    if (!selectedService) {
      showFormAlert("Invalid service selection.", "error");
      return;
    }

    const min = parseInt(selectedService.min, 10);
    const max = parseInt(selectedService.max, 10);
    if (qty < min || qty > max) {
      showFormAlert(`Quantity limits violated. Must enter between ${min} and ${max}.`, "error");
      return;
    }

    const rate = parseFloat(selectedService.rate);
    const cost = parseFloat((rate * (qty / 1000)).toFixed(2));
    if (state.balance < cost) {
      showFormAlert(`Insufficient balance. Calculated cost is ₱${cost.toFixed(2)} PHP but your balance is only ₱${state.balance.toFixed(2)} PHP. Please add funds.`, "error");
      return;
    }

    submitOrderBtn.disabled = true;
    submitOrderBtn.querySelector('span').textContent = 'Launching Campaign... 🛰️';

    try {
      const response = await request('/api/v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          service: serviceId,
          url: url,
          quantity: qty,
          mode: state.operatingMode
        })
      });

      if (!response.ok) throw new Error("Network returned bad status");
      const orderReceipt = await response.json();

      if (orderReceipt.error) {
        showFormAlert(`Campaign launch failed: ${orderReceipt.error}`, "error");
        return;
      }

      // Successful order launch!
      showFormAlert(`🎉 Campaign launched successfully! Order ID: <strong>#${orderReceipt.order}</strong>`, "success");
      triggerApexConfetti();
      
      showPremiumReceipt({
        orderId: orderReceipt.order.toString(),
        serviceName: selectedService.name,
        url: url,
        quantity: qty.toString(),
        charge: orderReceipt.charge,
        remainingBalance: state.balance - parseFloat(orderReceipt.charge)
      });
      
      // Store order locally to keep track of user actions
      const newOrderInfo = {
        orderId: orderReceipt.order.toString(),
        serviceId: serviceId,
        serviceName: selectedService.name,
        url: url,
        quantity: qty.toString(),
        charge: orderReceipt.charge,
        status: orderReceipt.status || 'Pending',
        remains: orderReceipt.remains || qty.toString(),
        createdAt: new Date().toISOString()
      };

      state.orders.unshift(newOrderInfo);
      saveOrdersToLocalStorage();
      
      // Clear forms
      orderUrlInput.value = '';
      orderQuantityInput.value = '';
      disableOrderFormFields();
      orderServiceSelect.value = '';
      orderCategorySelect.value = '';
      orderCategorySelect.dispatchEvent(new Event('change')); // Sync trigger reset!

      // Sync balance & redirect
      await syncUserBalance();
      
      // Auto transition to history tab after 2s so they see the progress live
      setTimeout(() => {
        switchTab('order-history');
        orderFormAlert.classList.add('hidden');
      }, 2000);

    } catch (error) {
      console.error("Order submit failed:", error);
      showFormAlert("Fatal connection issue: Server cannot reach proxy gateway.", "error");
    } finally {
      submitOrderBtn.disabled = false;
      submitOrderBtn.querySelector('span').textContent = 'Launch Campaign 🚀';
      checkMaintenanceButtonState();
    }
  }

  function showFormAlert(message, type) {
    orderFormAlert.innerHTML = message;
    orderFormAlert.className = `order-status-alert ${type}`;
    orderFormAlert.classList.remove('hidden');
  }

  async function resetDemoBalance() {
    try {
      const res = await request('/api/demo/reset-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionOnly: true
        })
      });
      const data = await res.json();
      const parsedBal = parseFloat(data.balance);
      state.balance = isNaN(parsedBal) ? 0.00 : parsedBal;
      syncUserBalance();
      showPremiumToast("Demo Balance Refilled", "Demo account balance refilled successfully back to ₱2.00!", "success");
    } catch (error) {
      console.error(error);
    }
  }


  // --- SERVICES DIRECTORY CATALOG ---
  function populateServicesDirectoryFilters() {
    if (!servicesCatFilter) return;
    const currentSelection = servicesCatFilter.value;
    servicesCatFilter.innerHTML = '<option value="all">All Categories</option>';
    
    const activePlatform = state.selectedDirectoryPlatform || 'all';
    const filteredCategories = state.categories.filter(cat => {
      if (activePlatform === 'all') return true;
      return getPlatformFromCategory(cat) === activePlatform;
    });

    filteredCategories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      servicesCatFilter.appendChild(opt);
    });

    if (filteredCategories.includes(currentSelection)) {
      servicesCatFilter.value = currentSelection;
    } else {
      servicesCatFilter.value = 'all';
    }

    // Dynamic sync of premium custom category filter dropdown
    syncCustomDirectoryCatDropdown();
  }

  function updateCustomDirectoryCatTriggerText() {
    const val = servicesCatFilter.value;
    const triggerText = document.querySelector('#directory-cat-custom-dropdown .trigger-text');
    const triggerIcon = document.getElementById('directory-cat-trigger-icon');
    if (!triggerText || !triggerIcon) return;
    
    if (!val || val === 'all') {
      triggerText.textContent = "All Categories";
      triggerIcon.innerHTML = "🌐";
      return;
    }
    
    triggerText.textContent = val;
    const platform = getPlatformFromCategory(val);
    if (platform !== 'other' && platform !== 'all') {
      triggerIcon.innerHTML = `<img src="/images/${platform}.png" alt="${platform}" style="width: 16px; height: 16px; object-fit: contain;">`;
    } else {
      triggerIcon.innerHTML = "🌐";
    }
  }

  function syncCustomDirectoryCatDropdown() {
    const customDropdown = document.getElementById('directory-cat-custom-dropdown');
    const trigger = document.getElementById('directory-cat-dropdown-trigger');
    const menu = document.getElementById('directory-cat-dropdown-menu');
    if (!customDropdown || !trigger || !menu) return;
    
    menu.innerHTML = '';
    const options = Array.from(servicesCatFilter.options);
    
    options.forEach(opt => {
      const val = opt.value;
      const platform = getPlatformFromCategory(val);
      
      const item = document.createElement('div');
      item.className = 'custom-dropdown-item';
      if (servicesCatFilter.value === val) {
        item.classList.add('active');
      }
      
      // Platform logo mapping
      let logoHtml = '🌐';
      if (val === 'all') {
        logoHtml = '🌐';
      } else if (platform !== 'other' && platform !== 'all') {
        logoHtml = `<img src="/images/${platform}.png" alt="${platform}" class="item-logo">`;
      }
      
      // Auto highlight recommended categories
      const valLower = val.toLowerCase();
      const isRecommended = valLower.includes('🔥') || 
                            valLower.includes('cheapest') || 
                            valLower.includes('best') || 
                            valLower.includes('non drop') || 
                            valLower.includes('hq') || 
                            valLower.includes('real') || 
                            valLower.includes('provider') ||
                            valLower.includes('own service');
      
      const recommendedTagHtml = isRecommended 
        ? `<span class="badge-recommended">💎 Rec</span>` 
        : '';
        
      item.innerHTML = `
        <div class="item-left">
          ${logoHtml}
          <span>${val === 'all' ? 'All Categories' : val}</span>
        </div>
        ${recommendedTagHtml}
      `;
      
      item.onclick = function(e) {
        e.stopPropagation();
        servicesCatFilter.value = val;
        
        // Trigger both change and sync
        servicesCatFilter.dispatchEvent(new Event('change'));
        
        // Remove active class from other items
        menu.querySelectorAll('.custom-dropdown-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        // Close menu
        customDropdown.classList.remove('active');
        menu.classList.add('hidden');
        
        updateCustomDirectoryCatTriggerText();
      };
      
      menu.appendChild(item);
    });
    
    // Always sync the trigger text initially
    updateCustomDirectoryCatTriggerText();
  }

  function renderDeepSeekSmartSuggestions(platform) {
    const grid = document.getElementById('ai-suggestions-grid');
    if (!grid) return;
    
    if (!state.services || state.services.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 20px;">AI is scanning provider networks...</div>`;
      return;
    }
    
    // Filter services by platform
    const platformSvc = state.services.filter(s => {
      if (platform === 'all') return true;
      return getPlatformFromCategory(s.category) === platform;
    });
    
    if (platformSvc.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 20px;">No AI suggestions available for this category yet.</div>`;
      return;
    }
    
    // Find Recommended, Fastest, Cheapest
    // 1. Recommended
    let recommended = platformSvc.find(s => {
      const name = s.name.toLowerCase();
      return name.includes('non drop') || name.includes('real') || name.includes('hq') || name.includes('high quality') || name.includes('recommended') || name.includes('stable');
    });
    if (!recommended) recommended = platformSvc[0];
    
    // 2. Cheapest
    let cheapest = platformSvc.reduce((min, s) => parseFloat(s.rate) < parseFloat(min.rate) ? s : min, platformSvc[0]);
    
    // 3. Fastest
    let fastest = platformSvc.find(s => {
      const name = s.name.toLowerCase();
      return name.includes('instant') || name.includes('speed') || name.includes('ultrafast') || name.includes('fast');
    });
    if (!fastest) fastest = platformSvc[0];
    
    grid.innerHTML = '';
    
    const items = [
      { service: recommended, title: '🏆 Recommended', badge: 'ai-suggest-badge rec', label: 'Best Quality & Stability' },
      { service: cheapest, title: '💎 Cheapest', badge: 'ai-suggest-badge cheapest', label: 'Lowest Cost per 1K' },
      { service: fastest, title: '⚡ Fastest Delivery', badge: 'ai-suggest-badge fast', label: 'Dispatches in milliseconds' }
    ];
    
    // Deduplicate suggestions just in case
    const uniqueIds = new Set();
    const uniqueItems = [];
    items.forEach(item => {
      if (!item.service) return;
      if (!uniqueIds.has(item.service.service.toString())) {
        uniqueIds.add(item.service.service.toString());
        uniqueItems.push(item);
      }
    });
    
    // 4. Activity smart suggestion based on user spent / campaigns
    let activityTitle = '🤖 Smart Suggestion';
    let activityLabel = 'Based on live channel activity';
    let activityBadge = 'ai-suggest-badge activity';
    
    // Fallback default activity service if no campaigns
    let activityService = platformSvc.find(s => !uniqueIds.has(s.service.toString()));
    if (!activityService) activityService = platformSvc[0];
    
    let activityDesc = '';
    const totalSpent = state.user ? parseFloat(state.user.total_spent || state.user.totalSpent || 0) : 0;
    const totalOrders = state.orders ? state.orders.length : 0;
    
    if (totalSpent === 0 || totalOrders === 0) {
      activityDesc = 'SMM network is highly stable. Launch your first campaign now!';
    } else {
      activityDesc = `You launched ${totalOrders} campaigns! Scale your presence further with this top suggestion.`;
    }
    
    if (activityService) {
      const actFormatted = formatServiceName(activityService.name);
      
      const actCard = document.createElement('div');
      actCard.className = 'ai-suggestion-item-card';
      actCard.innerHTML = `
        <div>
          <span class="${activityBadge}">${activityTitle}</span>
          <div style="font-size: 0.72rem; color: var(--text-muted); margin: 6px 0 2px 0;">${activityLabel}</div>
          <div class="ai-suggest-title" title="${actFormatted.name}">${actFormatted.name}</div>
          <div style="font-size: 0.7rem; color: var(--accent); margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${activityDesc}</div>
        </div>
        <div class="ai-suggest-price-row">
          <span class="ai-suggest-rate">₱${parseFloat(activityService.rate).toFixed(2)}/1K</span>
          <button class="ai-suggest-action-btn">Launch</button>
        </div>
      `;
      
      actCard.onclick = () => {
        selectSuggestedService(activityService);
      };
      
      grid.appendChild(actCard);
    }
    
    // Render the other suggestions
    uniqueItems.forEach(item => {
      const s = item.service;
      const formatted = formatServiceName(s.name);
      
      const card = document.createElement('div');
      card.className = 'ai-suggestion-item-card';
      card.innerHTML = `
        <div>
          <span class="${item.badge}">${item.title}</span>
          <div style="font-size: 0.72rem; color: var(--text-muted); margin: 6px 0 2px 0;">${item.label}</div>
          <div class="ai-suggest-title" title="${formatted.name}">${formatted.name}</div>
        </div>
        <div class="ai-suggest-price-row">
          <span class="ai-suggest-rate">₱${parseFloat(s.rate).toFixed(2)}/1K</span>
          <button class="ai-suggest-action-btn">Launch</button>
        </div>
      `;
      
      card.onclick = () => {
        selectSuggestedService(s);
      };
      
      grid.appendChild(card);
    });
  }

  function selectSuggestedService(s) {
    const platform = getPlatformFromCategory(s.category);
    state.selectedOrderPlatform = platform;
    
    // Sync order platform tabs active style
    if (orderPlatformTabs) {
      orderPlatformTabs.querySelectorAll('.platform-tab').forEach(t => {
        if (t.getAttribute('data-platform') === platform) {
          t.classList.add('active');
        } else {
          t.classList.remove('active');
        }
      });
    }
    
    // Re-populate order category selection options!
    populateNewOrderDropdowns();
    
    // Select category and package
    orderCategorySelect.value = s.category;
    orderCategorySelect.dispatchEvent(new Event('change'));
    
    // Populate packages and select
    populateServicesDropdownForCategory(s.category);
    orderServiceSelect.value = s.service;
    orderServiceSelect.dispatchEvent(new Event('change'));
    
    // Highlight trigger options
    updateCustomDropdownTriggerText();
    updateCustomPackageTriggerText();
    
    showPremiumToast("AI Pre-fill Successful", `Loaded campaign [ID: ${s.service}] details. Specify quantity and launch!`, "success");
    
    // Scroll down to the form
    const smmForm = document.getElementById('smm-order-form');
    if (smmForm) {
      smmForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  window.apexboostSelectHermesService = selectSuggestedService;

  // --- PREMIUM SMM PARSERS & AI CLASSIFICATION ENGINE ---
  
  // Format cluttered wholesale service names into clean, structured titles and attribute tags
  function formatServiceName(fullName) {
    fullName = fullName || '';
    const brackets = [];
    const bracketRegex = /\[([^\]]+)\]/g;
    let match;
    let cleanName = fullName;
    
    // Extract contents in square brackets []
    while ((match = bracketRegex.exec(fullName)) !== null) {
      brackets.push(match[1].trim());
      cleanName = cleanName.replace(match[0], '');
    }
    
    // Extract parts split by pipes |
    let details = [];
    if (cleanName.includes('|')) {
      const parts = cleanName.split('|');
      cleanName = parts[0].trim();
      for (let i = 1; i < parts.length; i++) {
        const p = parts[i].trim();
        if (p) details.push(p);
      }
    }
    
    // Combine brackets and split parts as pills
    const allPills = [...brackets, ...details].map(pill => {
      // Clean up extra spaces
      return pill.replace(/\s+/g, ' ').trim();
    }).filter(Boolean);
    
    // Filter out redundant/duplicate pills
    const uniquePills = Array.from(new Set(allPills));
    
    // Normalize spaces in the main title
    cleanName = cleanName.replace(/\s+/g, ' ').trim();
    
    // Remove cleanName trailing hyphens, pipes or slashes
    if (cleanName.endsWith('-') || cleanName.endsWith('/') || cleanName.endsWith('|')) {
      cleanName = cleanName.substring(0, cleanName.length - 1).trim();
    }
    
    return {
      name: cleanName,
      details: uniquePills
    };
  }

  // DeepSeek AI Service dynamic classifier engine
  function classifyServiceWithAI(s) {
    if (!s) return { text: '⚠️ Inactive', class: 'ai-not-working' };
    const nameLower = (s.name || '').toLowerCase();
    const catLower = (s.category || '').toLowerCase();
    const rateVal = parseFloat(s.rate) || 0;
    
    // 1. Not Working evaluation
    if (rateVal <= 0 || nameLower.includes('not working') || nameLower.includes('down') || nameLower.includes('inactive') || nameLower.includes('broken') || catLower.includes('not working')) {
      return { text: '⚠️ Not Working', class: 'ai-not-working' };
    }
    
    // 2. Cheapest evaluation
    if (nameLower.includes('cheapest') || nameLower.includes('ultra cheap') || nameLower.includes('cheap') || nameLower.includes('bot data') || nameLower.includes('budget')) {
      return { text: '💎 Cheapest', class: 'ai-cheapest' };
    }
    const platform = getPlatformFromCategory(s.category);
    if (platform === 'facebook' && rateVal < 8) return { text: '💎 Cheapest', class: 'ai-cheapest' };
    if (platform === 'instagram' && rateVal < 2) return { text: '💎 Cheapest', class: 'ai-cheapest' };
    if (platform === 'tiktok' && rateVal < 1) return { text: '💎 Cheapest', class: 'ai-cheapest' };
    if (platform === 'youtube' && rateVal < 10) return { text: '💎 Cheapest', class: 'ai-cheapest' };
    
    // 3. Sale / Best Offers evaluation
    if (nameLower.includes('🔥') || catLower.includes('🔥') || nameLower.includes('sale') || nameLower.includes('promo') || nameLower.includes('discount') || catLower.includes('hot offers') || catLower.includes('best seller') || nameLower.includes('special')) {
      return { text: '🏷️ Sale', class: 'ai-sale' };
    }
    
    // 4. Fast evaluation (Instant start, lightning delivery)
    if (nameLower.includes('instant') || nameLower.includes('super fast') || nameLower.includes('fast') || nameLower.includes('speed') || nameLower.includes('🚀') || nameLower.includes('mins') || nameLower.includes('hours') || nameLower.includes('rapid') || nameLower.includes('real-time') || nameLower.includes('quick')) {
      return { text: '⚡ Fast', class: 'ai-fast' };
    }
    
    // 5. Slow / Stable evaluation
    if (nameLower.includes('slow') || nameLower.includes('stable') || nameLower.includes('drip') || nameLower.includes('no refill') || nameLower.includes('organic') || nameLower.includes('natural') || nameLower.includes('manual')) {
      return { text: '⏳ Slow', class: 'ai-slow' };
    }
    
    // Default smart fallback based on price/platform
    if (rateVal < 15) {
      return { text: '⚡ Fast', class: 'ai-fast' };
    }
    return { text: '🏷️ Sale', class: 'ai-sale' };
  }

  function openComparisonModal() {
    const modal = document.getElementById('compare-modal');
    const headers = document.getElementById('compare-headers');
    const tbody = document.getElementById('compare-tbody');
    if (!modal || !headers || !tbody) return;

    headers.innerHTML = '<th>Attributes</th>';
    tbody.innerHTML = '';

    const selected = state.compareSelectedServices;
    if (selected.length === 0) return;

    // Render Headers
    selected.forEach(s => {
      const th = document.createElement('th');
      const platform = getPlatformFromCategory(s.category);
      let logoHtml = '🌐';
      if (platform !== 'other' && platform !== 'all') {
        logoHtml = `<img src="/images/${platform}.png" alt="${platform}" style="width: 14px; height: 14px; margin-right: 6px; vertical-align: middle; object-fit: contain;">`;
      }
      const formatted = formatServiceName(s.name);
      th.innerHTML = `
        <div class="compare-header-cell">
          <span class="compare-header-id">${logoHtml} ID: #${s.service}</span>
          <span class="compare-header-name">${formatted.name}</span>
        </div>
      `;
      headers.appendChild(th);
    });

    // Attributes to compare
    const attributes = [
      { key: 'category', label: 'Platform Category' },
      { key: 'rate', label: 'Wholesale Rate / 1K', format: (v) => `₱${parseFloat(v).toFixed(2)}` },
      { key: 'min', label: 'Minimum Order', format: (v) => parseInt(v).toLocaleString() },
      { key: 'max', label: 'Maximum Order', format: (v) => parseInt(v).toLocaleString() },
      { key: 'type', label: 'Delivery Type' },
      { key: 'aiStatus', label: 'AI Stability Assessment', format: (v, s) => {
          const ai = classifyServiceWithAI(s);
          return `<span class="badge-ai-status ${ai.class}">${ai.text}</span>`;
        }
      }
    ];

    attributes.forEach(attr => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${attr.label}</td>`;
      selected.forEach(s => {
        const val = s[attr.key];
        const displayVal = attr.format ? attr.format(val, s) : val;
        tr.innerHTML += `<td>${displayVal}</td>`;
      });
      tbody.appendChild(tr);
    });

    modal.classList.remove('hidden');
    syncAppShellState();
  }

  function handleCompareCheckboxChange(service, isChecked) {
    if (isChecked) {
      if (state.compareSelectedServices.length >= 3) {
        showPremiumToast("Limit Reached", "You can compare a maximum of 3 SMM service packages at once.", "warning");
        // uncheck in UI
        const btn = document.querySelector(`.compare-toggle-btn[data-id="${service.service}"]`);
        if (btn) {
          btn.classList.remove('is-selected');
          btn.removeAttribute('aria-pressed');
          btn.innerHTML = 'Compare';
        }
        return;
      }
      state.compareSelectedServices.push(service);
    } else {
      state.compareSelectedServices = state.compareSelectedServices.filter(s => s.service.toString() !== service.service.toString());
    }

    updateComparisonBar();
  }

  function updateComparisonBar() {
    const bar = document.getElementById('comparison-bar');
    const label = document.getElementById('comparison-count-value');
    const dock = document.getElementById('services-compare-dock');
    const dockLabel = document.getElementById('services-compare-dock-count');
    const dockLaunch = document.getElementById('services-compare-dock-launch');

    const count = state.compareSelectedServices.length;

    if (label) label.textContent = count;
    if (bar) {
      if (count > 0) {
        bar.classList.remove('hidden');
      } else {
        bar.classList.add('hidden');
      }
    }

    if (dockLabel) dockLabel.textContent = count;
    if (dock) {
      if (count > 0) {
        dock.classList.remove('hidden');
        dock.setAttribute('aria-hidden', 'false');
      } else {
        dock.classList.add('hidden');
        dock.setAttribute('aria-hidden', 'true');
      }
    }

    if (dockLaunch) {
      if (count >= 2) {
        dockLaunch.disabled = false;
        dockLaunch.textContent = `Compare (${count})`;
      } else {
        dockLaunch.disabled = true;
        dockLaunch.textContent = count === 1 ? 'Pick 1 more' : 'Pick 2 more';
      }
    }
  }

  function renderDirectoryPaginationControls(totalPages) {
    const container = document.getElementById('directory-pagination');
    if (!container) return;
    container.innerHTML = '';

    if (totalPages <= 1) return;

    // Previous Button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn';
    prevBtn.textContent = '◀';
    prevBtn.disabled = state.directoryCurrentPage === 1;
    prevBtn.addEventListener('click', () => {
      state.directoryCurrentPage--;
      renderServicesDirectory();
      scrollToTableTop();
    });
    container.appendChild(prevBtn);

    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, state.directoryCurrentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      const pBtn = document.createElement('button');
      pBtn.className = 'pagination-btn';
      pBtn.textContent = '1';
      pBtn.addEventListener('click', () => {
        state.directoryCurrentPage = 1;
        renderServicesDirectory();
        scrollToTableTop();
      });
      container.appendChild(pBtn);

      if (startPage > 2) {
        const dots = document.createElement('span');
        dots.className = 'pagination-ellipsis';
        dots.textContent = '...';
        container.appendChild(dots);
      }
    }

    for (let p = startPage; p <= endPage; p++) {
      const pBtn = document.createElement('button');
      pBtn.className = `pagination-btn ${p === state.directoryCurrentPage ? 'active' : ''}`;
      pBtn.textContent = p;
      pBtn.addEventListener('click', () => {
        state.directoryCurrentPage = p;
        renderServicesDirectory();
        scrollToTableTop();
      });
      container.appendChild(pBtn);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        const dots = document.createElement('span');
        dots.className = 'pagination-ellipsis';
        dots.textContent = '...';
        container.appendChild(dots);
      }

      const pBtn = document.createElement('button');
      pBtn.className = 'pagination-btn';
      pBtn.textContent = totalPages;
      pBtn.addEventListener('click', () => {
        state.directoryCurrentPage = totalPages;
        renderServicesDirectory();
        scrollToTableTop();
      });
      container.appendChild(pBtn);
    }

    // Next Button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'pagination-btn';
    nextBtn.textContent = '▶';
    nextBtn.disabled = state.directoryCurrentPage === totalPages;
    nextBtn.addEventListener('click', () => {
      state.directoryCurrentPage++;
      renderServicesDirectory();
      scrollToTableTop();
    });
    container.appendChild(nextBtn);
  }

  function scrollToTableTop() {
    const tableElement = document.getElementById('services-directory-table');
    if (tableElement) {
      tableElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function renderServicesDirectory() {
    if (!servicesTableBody) return;
    servicesTableBody.innerHTML = '';

    const query = servicesSearchInput.value.toLowerCase().trim();
    const activeCat = servicesCatFilter.value;
    const activePlatform = state.selectedDirectoryPlatform || 'all';

    const filtered = state.services.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(query) || 
                            s.service.toString().includes(query) ||
                            s.category.toLowerCase().includes(query);
      const matchesCat = activeCat === 'all' || s.category === activeCat;
      const matchesPlatform = activePlatform === 'all' || getPlatformFromCategory(s.category) === activePlatform;
      return matchesSearch && matchesCat && matchesPlatform;
    });

    // Dynamic Prepend AI Analysis Banner
    let aiBanner = document.getElementById('ai-directory-banner');
    if (!aiBanner && servicesTableBody) {
      aiBanner = document.createElement('div');
      aiBanner.id = 'ai-directory-banner';
      aiBanner.className = 'ai-analysis-banner';
      aiBanner.innerHTML = `
        <div class="ai-banner-content">
          <span class="ai-banner-icon">🧠</span>
          <div class="ai-banner-text">
            <h4>DeepSeek AI™ Smart Service Monitoring</h4>
            <p>ApexBot AI evaluates live SMM channels, speeds, and wholesale rates. The statuses below are automatically calculated and continuously monitored.</p>
          </div>
        </div>
        <div class="ai-legend-pills">
          <span class="ai-legend-pill"><span class="badge-ai-status ai-fast" style="padding: 2px 6px; font-size: 0.65rem;">⚡ Fast</span> Instant / Rapid</span>
          <span class="ai-legend-pill"><span class="badge-ai-status ai-slow" style="padding: 2px 6px; font-size: 0.65rem;">⏳ Slow</span> Stable / Drip</span>
          <span class="ai-legend-pill"><span class="badge-ai-status ai-cheapest" style="padding: 2px 6px; font-size: 0.65rem;">💎 Cheapest</span> Lowest Cost</span>
          <span class="ai-legend-pill"><span class="badge-ai-status ai-sale" style="padding: 2px 6px; font-size: 0.65rem;">🏷️ Sale</span> Promo Offer</span>
          <span class="ai-legend-pill"><span class="badge-ai-status ai-not-working" style="padding: 2px 6px; font-size: 0.65rem;">⚠️ Not Working</span> Offline</span>
        </div>
      `;
      const tableWrap = document.querySelector('.scrollable-table-wrap');
      if (tableWrap && tableWrap.parentElement) {
        tableWrap.parentElement.insertBefore(aiBanner, tableWrap);
      }
    }

    if (filtered.length === 0) {
      servicesTableBody.innerHTML = `
        <tr>
          <td colspan="9" class="text-center py-4 text-muted">No services found matching filters.</td>
        </tr>
      `;
      const paginationContainer = document.getElementById('directory-pagination');
      if (paginationContainer) paginationContainer.innerHTML = '';
      return;
    }

    // Pagination Logic
    const itemsPerPage = 25;
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    
    // Safety check for directoryCurrentPage range
    if (state.directoryCurrentPage < 1) state.directoryCurrentPage = 1;
    if (state.directoryCurrentPage > totalPages) state.directoryCurrentPage = totalPages;
    
    const startIndex = (state.directoryCurrentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filtered.length);
    const paginatedItems = filtered.slice(startIndex, endIndex);

    paginatedItems.forEach(s => {
      const tr = document.createElement('tr');
      tr.className = 'premium-svc-row'; // Apply premium styles
      const platform = getPlatformFromCategory(s.category);
      let logoHtml = '';
      if (platform !== 'other' && platform !== 'all') {
        logoHtml = `<img src="/images/${platform}.png" alt="${platform}" style="width: 14px; height: 14px; margin-right: 6px; vertical-align: middle; object-fit: contain; border-radius: 2px;">`;
      }
      const serviceLogoHtml = platform !== 'other' && platform !== 'all'
        ? `<span class="service-logo-wrap"><img src="/images/${platform}.png" alt="${platform}" class="service-row-logo"></span>`
        : `<span class="service-logo-wrap service-logo-fallback">#</span>`;
      
      // Parse service name beautifully
      const formatted = formatServiceName(s.name);
      const detailsHtml = formatted.details.map(d => `<span class="service-detail-pill">${d}</span>`).join('');
      
      // Analyze with dynamic DeepSeek AI status tag
      const aiStatus = classifyServiceWithAI(s);
      
      // Parse category beautifully into tag pills to solve unreadable text overlapping!
      const parts = s.category.split('|').map(p => p.trim());
      const categoryHtml = parts.map((part, index) => {
        if (index === 0) {
          return `<span class="cat-pill main-cat">${logoHtml}<span>${part}</span></span>`;
        } else {
          return `<span class="cat-pill sub-cat">${part}</span>`;
        }
      }).join('');
      
      const isCompareChecked = state.compareSelectedServices.some(item => item.service.toString() === s.service.toString());

      tr.innerHTML = `
        <td data-label="ID"><strong>#${s.service}</strong></td>
        <td data-label="Category" style="max-width: 260px; white-space: normal; padding: 12px 10px;">
          <div class="category-pills-container">
            ${categoryHtml}
          </div>
        </td>
        <td data-label="Service">
          <div class="service-title-container service-title-with-logo">
            ${serviceLogoHtml}
            <div class="service-title-copy">
              <div class="service-title-line">
                <span class="service-main-name">${formatted.name}</span>
                <span class="service-order-id-badge">Order ID #${s.service}</span>
              </div>
              ${formatted.details.length > 0 ? `<div class="service-details-row">${detailsHtml}</div>` : ''}
            </div>
          </div>
        </td>
        <td data-label="Rate"><span class="text-success font-weight-bold" style="font-size: 0.95rem;">₱${parseFloat(s.rate).toFixed(2)}</span></td>
        <td data-label="Min">${parseInt(s.min).toLocaleString()}</td>
        <td data-label="Max">${parseInt(s.max).toLocaleString()}</td>
        <td data-label="AI Analysis"><span class="badge-ai-status ${aiStatus.class}">${aiStatus.text}</span></td>
        <td data-label="Compare">
          <button type="button" class="compare-toggle-btn btn btn-secondary btn-sm ${isCompareChecked ? 'is-selected' : ''}" data-id="${s.service}" ${isCompareChecked ? 'aria-pressed="true"' : ''}>
            ${isCompareChecked ? 'Selected' : 'Compare'}
          </button>
        </td>
        <td data-label="Action">
          <button class="btn btn-secondary btn-sm select-cat-service-btn" data-cat="${s.category}" data-id="${s.service}">
            Order
          </button>
        </td>
      `;

      ['ID', 'Category', 'Service', 'Rate', 'Min', 'Max', 'AI Analysis', 'Compare', 'Action'].forEach((label, index) => {
        const cell = tr.children[index];
        if (cell && !cell.dataset.label) cell.dataset.label = label;
      });

      // Button click action for comparison
      const btnCompare = tr.querySelector('.compare-toggle-btn');
      if (btnCompare) {
        btnCompare.addEventListener('click', () => {
          const currentlySelected = btnCompare.classList.contains('is-selected');
          const newChecked = !currentlySelected;
          
          if (newChecked) {
            btnCompare.classList.add('is-selected');
            btnCompare.setAttribute('aria-pressed', 'true');
            btnCompare.innerHTML = 'Selected';
          } else {
            btnCompare.classList.remove('is-selected');
            btnCompare.removeAttribute('aria-pressed');
            btnCompare.innerHTML = 'Compare';
          }
          
          handleCompareCheckboxChange(s, newChecked);
        });
      }

      // Order click action from table
      tr.querySelector('.select-cat-service-btn').addEventListener('click', () => {
        const platform = getPlatformFromCategory(s.category);
        state.selectedOrderPlatform = platform;

        // Update active tab in the order platform tabs UI
        if (orderPlatformTabs) {
          orderPlatformTabs.querySelectorAll('.platform-tab').forEach(t => {
            if (t.getAttribute('data-platform') === platform) {
              t.classList.add('active');
            } else {
              t.classList.remove('active');
            }
          });
        }

        switchTab('new-order');
        orderCategorySelect.value = s.category;
        orderCategorySelect.dispatchEvent(new Event('change')); // Dispatch change so custom dropdown updates!
        populateServicesDropdownForCategory(s.category);
        orderServiceSelect.value = s.service;
        orderServiceSelect.dispatchEvent(new Event('change')); // Dispatch change so custom dropdown updates!
      });

      servicesTableBody.appendChild(tr);
    });

    renderDirectoryPaginationControls(totalPages);
  }

  function filterServicesDirectory() {
    renderServicesDirectory();
  }


  // --- ORDER HISTORY TRACKING & STATUS SYNC ---
  async function loadOrdersFromLocalStorage() {
    const raw = localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY);
    if (raw) {
      try {
        state.orders = JSON.parse(raw);
      } catch (error) {
        state.orders = [];
      }
    } else {
      state.orders = [];
    }

    // In live mode, also load from server DB (more reliable than localStorage)
    if (state.operatingMode === 'live' && state.user) {
      try {
        const resp = await request('/api/user/orders');
        if (resp.ok) {
          const serverOrders = await resp.json();
          if (Array.isArray(serverOrders) && serverOrders.length > 0) {
            // Merge: server orders take priority over cached localStorage orders
            const serverIds = new Set(serverOrders.map(o => o.orderId));
            const localOnly = state.orders.filter(o => !serverIds.has(o.orderId));
            state.orders = [...serverOrders, ...localOnly];
            saveOrdersToLocalStorage();
          }
        }
      } catch (e) {
        console.warn("Could not fetch orders from server, using local cache:", e.message);
      }
    }
    updateTotalSpent();
    updateUserDashboardSummary();
  }

  function saveOrdersToLocalStorage() {
    localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(state.orders));
  }

  function renderOrderHistory() {
    if (!ordersTableBody) return;
    updateUserDashboardSummary();
    ordersTableBody.innerHTML = '';

    const query = ordersSearchInput.value.toLowerCase().trim();
    const activeFilterEl = ordersStatusFilters.querySelector('.filter-pill.active');
    const filterStatus = activeFilterEl ? activeFilterEl.getAttribute('data-status') : 'all';

    const filtered = state.orders.filter(o => {
      const matchesSearch = o.orderId.includes(query) || o.url.toLowerCase().includes(query) || o.serviceName.toLowerCase().includes(query);
      const matchesStatus = filterStatus === 'all' || (o.status || '').toLowerCase() === filterStatus;
      return matchesSearch && matchesStatus;
    });

    // Client-side Campaign Pagination (10 rows per page)
    const itemsPerPage = 10;
    const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
    if (state.orderHistoryPage > totalPages) state.orderHistoryPage = totalPages;
    if (state.orderHistoryPage < 1) state.orderHistoryPage = 1;

    const pagPanel = document.getElementById('history-pagination');
    if (pagPanel) {
      if (filtered.length === 0) {
        pagPanel.style.display = 'none';
      } else {
        pagPanel.style.display = 'flex';
        const infoEl = pagPanel.querySelector('.pagination-info');
        if (infoEl) {
          const startNum = (state.orderHistoryPage - 1) * itemsPerPage + 1;
          const endNum = Math.min(state.orderHistoryPage * itemsPerPage, filtered.length);
          infoEl.textContent = `Showing ${startNum}-${endNum} of ${filtered.length} campaigns`;
        }

        const prevBtn = document.getElementById('btn-history-prev');
        const nextBtn = document.getElementById('btn-history-next');
        if (prevBtn) {
          prevBtn.disabled = state.orderHistoryPage === 1;
          prevBtn.onclick = () => {
            if (state.orderHistoryPage > 1) {
              state.orderHistoryPage--;
              renderOrderHistory();
            }
          };
        }
        if (nextBtn) {
          nextBtn.disabled = state.orderHistoryPage === totalPages;
          nextBtn.onclick = () => {
            if (state.orderHistoryPage < totalPages) {
              state.orderHistoryPage++;
              renderOrderHistory();
            }
          };
        }
      }
    }

    if (filtered.length === 0) {
      ordersTableBody.innerHTML = `
        <tr>
          <td colspan="9" class="text-center py-4 text-muted">No campaigns located for selection.</td>
        </tr>
      `;
      renderCampaignAnalytics();
      return;
    }

    const startIndex = (state.orderHistoryPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filtered.slice(startIndex, endIndex);

    paginated.forEach(o => {
      const tr = document.createElement('tr');
      
      const formattedDate = new Date(o.createdAt).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Platform mapping for historical order icons
      const platform = o.serviceName.toLowerCase().includes('facebook') ? 'facebook' :
                       o.serviceName.toLowerCase().includes('instagram') ? 'instagram' :
                       o.serviceName.toLowerCase().includes('tiktok') ? 'tiktok' :
                       o.serviceName.toLowerCase().includes('youtube') ? 'youtube' :
                       o.serviceName.toLowerCase().includes('telegram') ? 'telegram' :
                       (o.serviceName.toLowerCase().includes('twitter') || o.serviceName.toLowerCase().includes('x -') || o.serviceName.toLowerCase().includes('x (')) ? 'x' : 'other';
      let logoHtml = '';
      if (platform !== 'other') {
        logoHtml = `<img src="/images/${platform}.png" alt="${platform}" style="width: 14px; height: 14px; margin-right: 6px; vertical-align: middle; object-fit: contain; border-radius: 2px;">`;
      }

      // Match status to badge classes
      let statusClass = 'pending';
      const stat = (o.status || 'pending').toLowerCase();
      if (stat === 'in progress') statusClass = 'in-progress';
      else if (stat === 'completed') statusClass = 'completed';
      else if (stat === 'partial') statusClass = 'partial';
      else if (stat === 'error' || stat === 'cancelled') statusClass = 'error';

      // Refill eligibility (Completed or Partial in modern SMM panels - restricted to admin/super_admin)
      const isAdminUser = state.user && (state.user.role === 'admin' || state.user.role === 'super_admin');
      const canRefill = isAdminUser && (stat === 'completed' || stat === 'partial');
      const refillBtnHtml = canRefill 
        ? `<button class="btn btn-secondary btn-sm btn-refill-trigger" data-id="${o.orderId}" title="Request automated refill check">Refill</button>`
        : `<span class="text-muted">—</span>`;

      // Progress bar percentage & color mapping
      let progressPercent = 0;
      let progressBarColor = 'var(--accent)';
      if (stat === 'completed') {
        progressPercent = 100;
        progressBarColor = 'var(--success)';
      } else if (stat === 'partial') {
        progressPercent = 75;
        progressBarColor = 'var(--warning)';
      } else if (stat === 'in progress' || stat === 'processing') {
        progressPercent = 50;
        progressBarColor = 'var(--accent)';
      } else if (stat === 'pending') {
        progressPercent = 15;
        progressBarColor = 'var(--secondary)';
      }

      const showProgress = (stat === 'completed' || stat === 'partial' || stat === 'in progress' || stat === 'processing' || stat === 'pending');
      const progressBarHtml = showProgress ? `
        <div class="order-progress-track" style="margin-top: 5px; height: 4px; background: rgba(255,255,255,0.06); border-radius: 2px; overflow: hidden; width: 70px; margin-left: auto; margin-right: auto; position: relative;">
          <div class="order-progress-bar" style="height: 100%; width: ${progressPercent}%; background: ${progressBarColor}; border-radius: 2px; transition: width 0.6s ease; ${stat === 'in progress' ? 'animation: progressPulse 1.5s infinite;' : ''}"></div>
        </div>
      ` : '';

      tr.innerHTML = `
        <td><strong>#${o.orderId}</strong></td>
        <td><span class="text-muted" style="font-size: 0.75rem">${formattedDate}</span></td>
        <td><span style="display: inline-flex; align-items: center;">${logoHtml}<strong>${o.serviceName}</strong></span></td>
        <td><a href="${o.url}" target="_blank" class="text-secondary" style="font-size: 0.75rem; text-decoration: underline" title="${o.url}">View Target Link</a></td>
        <td>${parseInt(o.quantity).toLocaleString()}</td>
        <td><strong>₱${parseFloat(o.charge).toFixed(2)}</strong></td>
        <td>
          <span class="badge-status ${statusClass}">${o.status}</span>
          ${progressBarHtml}
        </td>
        <td>${parseInt(o.remains).toLocaleString()}</td>
        <td class="action-cell">${refillBtnHtml}</td>
      `;

      ['Order ID', 'Date', 'Service', 'Target Link', 'Qty', 'Cost', 'Status', 'Remaining', 'Actions'].forEach((label, index) => {
        const cell = tr.children[index];
        if (cell) cell.dataset.label = label;
      });

      // Setup refill listener
      if (canRefill) {
        tr.querySelector('.btn-refill-trigger').addEventListener('click', (e) => {
          triggerOrderRefill(o.orderId, e.target);
        });
      }

      ordersTableBody.appendChild(tr);
    });
    renderCampaignAnalytics();
  }

  function filterOrdersHistory() {
    state.orderHistoryPage = 1;
    renderOrderHistory();
  }

  // Live poll order status from proxy backend
  async function syncOrdersStatus(options = { silent: false }) {
    if (state.orders.length === 0) return;
    
    // Only query active, non-final orders (Pending, In Progress) to save network
    const activeOrders = state.orders.filter(o => {
      const status = (o && o.status || '').toLowerCase();
      return status === 'pending' || status === 'in progress';
    });
    
    if (activeOrders.length === 0 && !options.silent) {
      renderOrderHistory();
      return;
    }

    if (!options.silent) {
      refreshHistoryBtn.classList.add('btn-primary');
      refreshHistoryBtn.querySelector('span').textContent = 'Syncing...';
      historyAlert.classList.add('hidden');
    }

    try {
      // Query maximum of 100 orders separated by commas as documented in Multiple status API
      const orderIds = state.orders.map(o => o.orderId).slice(0, 100).join(',');
      
      const response = await request('/api/v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'status',
          orders: orderIds,
          mode: state.operatingMode
        })
      });

      if (!response.ok) throw new Error("Status query failed");
      const statusMap = await response.json();

      if (statusMap.error) {
        if (!options.silent) {
          showHistoryAlert(`Proxy Status Query Error: ${statusMap.error}`, "error");
        }
        return;
      }

      // Update state order fields based on fetched status map
      let changesMade = false;
      state.orders.forEach(o => {
        const remoteStatus = statusMap[o.orderId];
        if (remoteStatus && !remoteStatus.error) {
          if (o.status !== remoteStatus.status || o.remains !== remoteStatus.remains.toString()) {
            o.status = remoteStatus.status;
            o.remains = remoteStatus.remains.toString();
            changesMade = true;
          }
        }
      });

      if (changesMade) {
        saveOrdersToLocalStorage();
      }
      renderOrderHistory();

    } catch (error) {
      console.error("Failed to sync historical statuses:", error);
      if (!options.silent) {
        showHistoryAlert("Status Sync Failure: Unable to coordinate transaction states with backend gateway.", "error");
      }
    } finally {
      if (!options.silent) {
        refreshHistoryBtn.classList.remove('btn-primary');
        refreshHistoryBtn.querySelector('span').textContent = '🔄 Sync Statuses';
      }
    }
  }

  async function triggerOrderRefill(orderId, buttonEl) {
    buttonEl.disabled = true;
    buttonEl.textContent = 'Processing...';

    try {
      const response = await request('/api/v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'refill',
          order: orderId,
          mode: state.operatingMode
        })
      });

      if (!response.ok) throw new Error("Refill request rejected");
      const data = await response.json();

      if (data.error) {
        showPremiumToast("Refill Failed", `Refill Request Failed: ${data.error}`, "error");
        buttonEl.disabled = false;
        buttonEl.textContent = 'Refill';
        return;
      }

      showPremiumToast("Refill Process Registered", `Refill process successfully registered! Refill ID: #${data.refill}`, "success");
      buttonEl.textContent = 'Queued';
      buttonEl.style.backgroundColor = 'var(--success-bg)';
      buttonEl.style.color = 'var(--success)';
      buttonEl.style.borderColor = 'transparent';

    } catch (error) {
      console.error(error);
      showPremiumToast("Refill Failed", "Backend server is unreachable.", "error");
      buttonEl.disabled = false;
      buttonEl.textContent = 'Refill';
    }
  }

  function showHistoryAlert(message, type) {
    historyAlert.innerHTML = message;
    historyAlert.className = `order-status-alert ${type}`;
    historyAlert.classList.remove('hidden');
  }

  // --- AUTH SYSTEM CONTROLLER FUNCTIONS ---
  function showAuthModal(tab = 'login') {
    if (!authModal) return;
    closeMobileNavMenu();
    closeMobileSidebar();
    authModal.classList.remove('hidden');
    switchAuthTab(tab);
    clearAuthError();
    syncAppShellState();
  }
  window.showAuthModal = showAuthModal;

  function hideAuthModal() {
    if (!authModal) return;
    authModal.classList.add('hidden');
    syncAppShellState();
  }

  function switchAuthTab(tab) {
    clearAuthError();
    const authTabsContainer = document.querySelector('.auth-tabs');
    
    // Hide register otp form by default on other tabs
    if (registerOtpForm) registerOtpForm.classList.add('hidden');

    if (tab === 'login') {
      if (authTabsContainer) authTabsContainer.classList.remove('hidden');
      tabLoginBtn.classList.add('active');
      tabRegisterBtn.classList.remove('active');
      loginForm.classList.remove('hidden');
      registerForm.classList.add('hidden');
      forgotForm.classList.add('hidden');
      document.getElementById('auth-title').textContent = "Welcome Back";
      document.getElementById('auth-subtitle').textContent = "Accelerate your social growth with premium SMM tools.";
      setForgotStep('verify');
      renderLoginTurnstile._retryCount = 0;
      requestAnimationFrame(renderLoginTurnstile);
    } else if (tab === 'register') {
      if (authTabsContainer) authTabsContainer.classList.remove('hidden');
      tabLoginBtn.classList.remove('active');
      tabRegisterBtn.classList.add('active');
      loginForm.classList.add('hidden');
      registerForm.classList.remove('hidden');
      forgotForm.classList.add('hidden');
      document.getElementById('auth-title').textContent = "Create Account";
      document.getElementById('auth-subtitle').textContent = "Join ApexBoost to launch campaigns instantly.";
      setRegisterStep(1);
      setForgotStep('verify');
    } else if (tab === 'forgot') {
      if (authTabsContainer) authTabsContainer.classList.add('hidden');
      loginForm.classList.add('hidden');
      registerForm.classList.add('hidden');
      forgotForm.classList.remove('hidden');
      forgotUsernameEmail.value = '';
      if (forgotOtpCode) forgotOtpCode.value = '';
      forgotNewPassword.value = '';
      forgotConfirmPassword.value = '';
      document.getElementById('auth-title').textContent = "Recover Password";
      document.getElementById('auth-subtitle').textContent = "Verify your identity to reset your credentials.";
      setForgotStep('verify');
    } else if (tab === 'register-otp') {
      if (authTabsContainer) authTabsContainer.classList.add('hidden');
      loginForm.classList.add('hidden');
      registerForm.classList.add('hidden');
      forgotForm.classList.add('hidden');
      if (registerOtpForm) registerOtpForm.classList.remove('hidden');
      document.getElementById('auth-title').textContent = "Verify Your Account";
      document.getElementById('auth-subtitle').textContent = "Enter the 6-digit code sent to your email address.";
    }
  }

  function setRegisterStep(step) {
    const showVerification = Number(step) === 2;
    if (registerStep1) registerStep1.classList.toggle('hidden', showVerification);
    if (registerStep2) registerStep2.classList.toggle('hidden', !showVerification);
    clearAuthError();
    if (showVerification) {
      renderRegisterTurnstile._retryCount = 0;
      requestAnimationFrame(renderRegisterTurnstile);
    }
  }

  function showRegisterVerificationStep() {
    const username = document.getElementById('register-username');
    const email = document.getElementById('register-email');
    const password = document.getElementById('register-password');
    const confirmPassword = document.getElementById('register-confirm-password');
    const fields = [username, email, password, confirmPassword].filter(Boolean);
    const invalid = fields.find((field) => !field.checkValidity());
    if (invalid) {
      invalid.reportValidity();
      return;
    }
    if (password.value !== confirmPassword.value) {
      showAuthError('Passwords do not match.');
      confirmPassword.focus();
      return;
    }
    setRegisterStep(2);
  }

  function _calcPasswordScore(password) {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  }

  function _applyStrengthMeter(meter, score) {
    const levels = [
      { width: '0%', color: '#ef4444', level: 'weak', label: 'Use at least 8 characters.' },
      { width: '22%', color: '#ef4444', level: 'weak', label: 'Weak — add uppercase, numbers, and symbols.' },
      { width: '45%', color: '#f59e0b', level: 'medium', label: 'Fair — make it longer and less predictable.' },
      { width: '68%', color: '#eab308', level: 'medium', label: 'Good — one more improvement recommended.' },
      { width: '84%', color: '#10b981', level: 'strong', label: 'Strong password.' },
      { width: '100%', color: '#10b981', level: 'strong', label: 'Excellent password.' }
    ];
    const lvl = levels[Math.min(score, 5)];
    meter.dataset.level = lvl.level;
    meter.style.setProperty('--strength', lvl.width);
    meter.style.setProperty('--strength-color', lvl.color);
    const label = meter.querySelector('.password-strength-label');
    if (label) label.textContent = lvl.label;
  }

  function updatePasswordStrength(password = '') {
    const meter = document.getElementById('register-password-strength');
    if (!meter) return;
    _applyStrengthMeter(meter, _calcPasswordScore(password));
  }

  function updateAccountPasswordStrength(password = '') {
    const meter = document.getElementById('account-password-strength');
    if (!meter) return;
    _applyStrengthMeter(meter, _calcPasswordScore(password));
  }

  async function getTurnstileSiteKey(target) {
    if (resolvedTurnstileSiteKey) return resolvedTurnstileSiteKey;
    try {
      const response = await safeFetch('/api/config', { headers: { Accept: 'application/json' } });
      const config = response.ok ? await response.json() : {};
      resolvedTurnstileSiteKey = String(config.turnstileSiteKey || '').trim();
    } catch (_error) {
      resolvedTurnstileSiteKey = '';
    }
    return resolvedTurnstileSiteKey || String(target?.dataset?.sitekey || '').trim();
  }

  async function renderRegisterTurnstile() {
    const target = document.querySelector('#register-turnstile-wrap .cf-turnstile');
    if (!target || !window.turnstile || typeof window.turnstile.render !== 'function') {
      if (registerTurnstileStatus) registerTurnstileStatus.textContent = 'Secure verification is still loading…';
      // Retry up to 10 times (5s total) for slow mobile connections
      if (!renderRegisterTurnstile._retryCount) renderRegisterTurnstile._retryCount = 0;
      if (renderRegisterTurnstile._retryCount < 10) {
        renderRegisterTurnstile._retryCount++;
        setTimeout(renderRegisterTurnstile, 500);
      } else {
        renderRegisterTurnstile._retryCount = 0;
      }
      return;
    }
    renderRegisterTurnstile._retryCount = 0;
    if (registerTurnstileWidgetId !== null) {
      if (registerTurnstileStatus) registerTurnstileStatus.classList.add('hidden');
      return;
    }
    try {
      const sitekey = await getTurnstileSiteKey(target);
      if (!sitekey) {
        throw new Error('Turnstile site key is unavailable.');
      }
      registerTurnstileWidgetId = window.turnstile.render(target, {
        sitekey,
        theme: 'dark',
        size: 'flexible',
        callback(token) {
          registerTurnstileToken = token || '';
          if (registerTurnstileStatus) registerTurnstileStatus.classList.add('hidden');
        },
        'expired-callback'() {
          registerTurnstileToken = '';
          if (registerTurnstileStatus) {
            registerTurnstileStatus.textContent = 'Verification expired. Please verify again.';
            registerTurnstileStatus.classList.remove('hidden');
          }
        },
        'error-callback'() {
          registerTurnstileToken = '';
          if (registerTurnstileStatus) {
            registerTurnstileStatus.textContent = 'Verification could not load. Refresh and try again.';
            registerTurnstileStatus.classList.remove('hidden');
            registerTurnstileStatus.classList.add('is-error');
          }
        }
      });
      if (registerTurnstileStatus) registerTurnstileStatus.classList.add('hidden');
    } catch (error) {
      console.error('Turnstile render failed:', error);
      if (registerTurnstileStatus) {
        registerTurnstileStatus.textContent = 'Verification could not load. Refresh and try again.';
        registerTurnstileStatus.classList.add('is-error');
      }
    }
  }

  async function renderLoginTurnstile() {
    const target = document.querySelector('#login-turnstile-wrap .cf-turnstile');
    if (!target || !window.turnstile || typeof window.turnstile.render !== 'function') {
      if (loginTurnstileStatus) loginTurnstileStatus.textContent = 'Secure verification is still loading...';
      // Retry up to 10 times (5s total) for slow mobile connections
      if (!renderLoginTurnstile._retryCount) renderLoginTurnstile._retryCount = 0;
      if (renderLoginTurnstile._retryCount < 10) {
        renderLoginTurnstile._retryCount++;
        setTimeout(renderLoginTurnstile, 500);
      } else {
        renderLoginTurnstile._retryCount = 0;
      }
      return;
    }
    renderLoginTurnstile._retryCount = 0;
    if (loginTurnstileWidgetId !== null) {
      if (loginTurnstileStatus) loginTurnstileStatus.classList.add('hidden');
      return;
    }
    try {
      const sitekey = await getTurnstileSiteKey(target);
      if (!sitekey) throw new Error('Turnstile site key is unavailable.');
      loginTurnstileWidgetId = window.turnstile.render(target, {
        sitekey,
        theme: 'dark',
        size: 'flexible',
        callback(token) {
          loginTurnstileToken = token || '';
          if (loginTurnstileStatus) loginTurnstileStatus.classList.add('hidden');
        },
        'expired-callback'() {
          loginTurnstileToken = '';
          if (loginTurnstileStatus) {
            loginTurnstileStatus.textContent = 'Verification expired. Please verify again.';
            loginTurnstileStatus.classList.remove('hidden');
          }
        },
        'error-callback'() {
          loginTurnstileToken = '';
          if (loginTurnstileStatus) {
            loginTurnstileStatus.textContent = 'Verification could not load. Refresh and try again.';
            loginTurnstileStatus.classList.remove('hidden');
            loginTurnstileStatus.classList.add('is-error');
          }
        }
      });
      if (loginTurnstileStatus) loginTurnstileStatus.classList.add('hidden');
    } catch (error) {
      console.error('Login Turnstile render failed:', error);
      if (loginTurnstileStatus) {
        loginTurnstileStatus.textContent = 'Verification could not load. Refresh and try again.';
        loginTurnstileStatus.classList.add('is-error');
      }
    }
  }

  function setForgotStep(step) {
    const isResetStep = step === 'reset';

    if (forgotStateVerify) forgotStateVerify.classList.toggle('hidden', isResetStep);
    if (forgotStateReset) forgotStateReset.classList.toggle('hidden', !isResetStep);

    if (forgotUsernameEmail) forgotUsernameEmail.disabled = isResetStep;
    if (forgotVerifyBtn) {
      forgotVerifyBtn.disabled = isResetStep;
      forgotVerifyBtn.querySelector('span').textContent = 'Send Reset Code';
    }

    [forgotOtpCode, forgotNewPassword, forgotConfirmPassword].forEach((input) => {
      if (!input) return;
      input.disabled = !isResetStep;
      input.required = isResetStep;
    });

    if (btnSubmitNewPassword) {
      btnSubmitNewPassword.disabled = !isResetStep;
      btnSubmitNewPassword.querySelector('span').textContent = 'Update Password';
    }
  }

  function showAuthError(message) {
    if (authErrorAlert) {
      authErrorAlert.textContent = message;
      authErrorAlert.classList.remove('hidden');
    }
  }

  function clearAuthError() {
    if (authErrorAlert) {
      authErrorAlert.textContent = "";
      authErrorAlert.classList.add('hidden');
    }
  }

  function setButtonLoading(button, isLoading, loadingText) {
    if (!button) return () => {};
    const label = button.querySelector('span') || button;
    const originalText = label.textContent;
    button.disabled = isLoading;
    button.classList.toggle('is-loading', isLoading);
    if (isLoading && loadingText) label.textContent = loadingText;

    return () => {
      button.disabled = false;
      button.classList.remove('is-loading');
      label.textContent = originalText;
    };
  }

  function startRegisterOtpCooldown(seconds = 60) {
    if (!registerOtpResendBtn || !registerOtpCountdown) return;
    clearInterval(registerOtpCooldownTimer);
    let remaining = seconds;

    const tick = () => {
      if (remaining <= 0) {
        clearInterval(registerOtpCooldownTimer);
        registerOtpResendBtn.disabled = false;
        registerOtpResendBtn.textContent = 'Resend Code';
        registerOtpCountdown.classList.add('hidden');
        registerOtpCountdown.textContent = '';
        return;
      }

      registerOtpResendBtn.disabled = true;
      registerOtpResendBtn.classList.remove('is-loading');
      registerOtpResendBtn.textContent = 'Resend Code';
      registerOtpCountdown.textContent = `Available in ${remaining}s`;
      registerOtpCountdown.classList.remove('hidden');
      remaining -= 1;
    };

    tick();
    registerOtpCooldownTimer = setInterval(tick, 1000);
  }

  function startForgotResendCooldown(seconds = 60) {
    if (!forgotResendCodeBtn || !forgotResendCountdown) return;
    clearInterval(forgotResendCooldownTimer);
    let remaining = seconds;

    const tick = () => {
      if (remaining <= 0) {
        clearInterval(forgotResendCooldownTimer);
        forgotResendCodeBtn.disabled = false;
        forgotResendCodeBtn.textContent = 'Resend Reset Code';
        forgotResendCountdown.classList.add('hidden');
        forgotResendCountdown.textContent = '';
        return;
      }

      forgotResendCodeBtn.disabled = true;
      forgotResendCodeBtn.classList.remove('is-loading');
      forgotResendCodeBtn.textContent = 'Resend Reset Code';
      forgotResendCountdown.textContent = `Available in ${remaining}s`;
      forgotResendCountdown.classList.remove('hidden');
      remaining -= 1;
    };

    tick();
    forgotResendCooldownTimer = setInterval(tick, 1000);
  }

  async function handleLoginSubmit(e) {
    e.preventDefault();
    clearAuthError();
    
    const usernameOrEmail = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const turnstileToken = loginTurnstileToken || (
      window.turnstile && loginTurnstileWidgetId !== null
        ? window.turnstile.getResponse(loginTurnstileWidgetId)
        : ''
    );
    if (!turnstileToken) {
      showAuthError('Please complete the Cloudflare verification.');
      renderLoginTurnstile();
      return;
    }
    
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const submitBtnSpan = submitBtn ? submitBtn.querySelector('span') : null;
    const originalText = submitBtnSpan ? submitBtnSpan.textContent : 'Log In';
    
    const resetLoginLoading = setButtonLoading(submitBtn, true, 'Verifying Credentials...');
    if (submitBtnSpan) submitBtnSpan.textContent = 'Verifying Credentials... ⏳';
    
    try {
      const res = await request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail, password, turnstileToken })
      });
      
      const data = await res.json();
      if (!res.ok) {
        if (data.requiresVerification) {
          // Use the email the user typed since server only returns a masked version
          registerOtpEmail = String(usernameOrEmail || '').includes('@') ? usernameOrEmail : (data.maskedEmail || '');
          if (registerOtpTargetEmail) registerOtpTargetEmail.textContent = data.maskedEmail || registerOtpEmail;
          showAuthError('Your account email is not yet verified. Please check your inbox for the verification code.');
          setTimeout(() => switchAuthTab('register-otp'), 1200);
        } else {
          showAuthError(data.error || "Login failed");
        }
        if (window.turnstile && loginTurnstileWidgetId !== null) {
          window.turnstile.reset(loginTurnstileWidgetId);
          loginTurnstileToken = '';
        }
        return;
      }

      state.user = data.user;
      localStorage.setItem('apexboost_token', data.token || '');
      localStorage.setItem('apexboost_user', JSON.stringify(data.user));
      state.authResolved = true;
      
      await ensureDashboardLoaded();

      updateUserUI();
      hideAuthModal();
      switchView('dashboard');
      showPremiumToast(`Welcome Back, ${data.user.username}!`, "You have logged in successfully to your SMM Control Desk.", 'success');
      
    } catch (err) {
      console.error(err);
      showAuthError("Connection to authentication server failed.");
    } finally {
      resetLoginLoading();
    }
  }

  async function handleRegisterSubmit(e) {
    e.preventDefault();
    clearAuthError();
    const username = document.getElementById('register-username').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const termsChecked = document.getElementById('register-terms').checked;
    
    if (password !== confirmPassword) {
      showAuthError("Passwords do not match.");
      return;
    }
    
    if (!termsChecked) {
      showAuthError("You must accept the Terms & Conditions and Privacy Policy to register.");
      return;
    }
    const turnstileToken = registerTurnstileToken || (
      window.turnstile && registerTurnstileWidgetId !== null
        ? window.turnstile.getResponse(registerTurnstileWidgetId)
        : ''
    );
    if (!turnstileToken) {
      showAuthError('Please complete the Cloudflare verification.');
      renderRegisterTurnstile();
      return;
    }
    
    const submitBtn = registerForm.querySelector('button[type="submit"]');
    const submitBtnSpan = submitBtn ? submitBtn.querySelector('span') : null;
    const originalText = submitBtnSpan ? submitBtnSpan.textContent : 'Create Account';
    
    const resetRegisterLoading = setButtonLoading(submitBtn, true, 'Creating Secure Account...');
    if (submitBtnSpan) submitBtnSpan.textContent = 'Creating Secure Account... ⏳';
    
    try {
      const res = await request('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, turnstileToken })
      });
      
      const data = await res.json();
      if (!res.ok) {
        showAuthError(data.error || "Registration failed");
        if (data.accountCreated && data.requiresVerification) {
          registerOtpEmail = data.email || email;
          if (registerOtpTargetEmail) registerOtpTargetEmail.textContent = registerOtpEmail;
          if (registerOtpCode) registerOtpCode.value = '';
          switchAuthTab('register-otp');
          if (registerOtpResendBtn) registerOtpResendBtn.disabled = false;
        }
        if (window.turnstile && registerTurnstileWidgetId !== null) {
          window.turnstile.reset(registerTurnstileWidgetId);
          registerTurnstileToken = '';
        }
        return;
      }

      if (data.requiresVerification) {
        showPremiumToast("Verification Code Sent!", data.message || "Check your email and enter the verification code to verify your account.", 'success');
        registerOtpEmail = email;
        if (registerOtpTargetEmail) {
          registerOtpTargetEmail.textContent = email;
        }
        if (registerOtpCode) {
          registerOtpCode.value = '';
        }
        switchAuthTab('register-otp');
        startRegisterOtpCooldown(60);
      } else {
        showPremiumToast("Registration Successful!", "Account created. You can log in now.", 'success');
        switchAuthTab('login');
        document.getElementById('login-email').value = email;
        registerForm.reset();
      }
      
    } catch (err) {
      console.error(err);
      showAuthError("Connection to authentication server failed.");
    } finally {
      resetRegisterLoading();
    }
  }

  async function handleRegisterOtpSubmit(e) {
    e.preventDefault();
    clearAuthError();

    const otpCode = registerOtpCode.value.replace(/\D/g, '').slice(0, 6);
    registerOtpCode.value = otpCode;
    if (!otpCode || otpCode.length !== 6) {
      showAuthError("Please enter a valid 6-digit verification code.");
      return;
    }

    const submitBtn = registerOtpForm.querySelector('button[type="submit"]');
    const submitBtnSpan = submitBtn ? submitBtn.querySelector('span') : null;
    const originalText = submitBtnSpan ? submitBtnSpan.textContent : 'Verify & Activate Account';

    if (submitBtn) submitBtn.disabled = true;
    if (submitBtnSpan) submitBtnSpan.textContent = 'Verifying Code... ⏳';

    try {
      const res = await request('/api/auth/verify-register-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: registerOtpEmail, otpCode })
      });

      const data = await res.json();
      if (!res.ok) {
        showAuthError(data.error || "Verification failed");
        return;
      }

      showPremiumToast("Account Verified!", "Your email has been successfully verified! You can now log in.", 'success');
      switchAuthTab('login');
      document.getElementById('login-email').value = registerOtpEmail;
      registerOtpForm.reset();
      registerForm.reset();
    } catch (err) {
      console.error(err);
      showAuthError("Connection to verification server failed.");
    } finally {
      if (submitBtn) submitBtn.disabled = false;
      if (submitBtnSpan) submitBtnSpan.textContent = originalText;
    }
  }

  async function handleRegisterOtpResend(e) {
    e.preventDefault();
    clearAuthError();

    if (!registerOtpEmail) {
      showAuthError("Session expired. Please sign up again.");
      return;
    }

    const originalText = registerOtpResendBtn.textContent;
    const resetResendLoading = setButtonLoading(registerOtpResendBtn, true, 'Sending...');
    registerOtpResendBtn.textContent = 'Sending... ⏳';
    registerOtpResendBtn.style.pointerEvents = 'none';

    try {
      const res = await request('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: registerOtpEmail })
      });

      const data = await res.json();
      if (!res.ok) {
        showAuthError(data.error || "Failed to resend code.");
        return;
      }

      showPremiumToast("Code Resent!", "A new verification code has been sent to your email.", 'success');
      if (registerOtpCode) {
        registerOtpCode.value = '';
      }
      startRegisterOtpCooldown(60);
    } catch (err) {
      console.error(err);
      showAuthError("Connection to verification server failed.");
    } finally {
      registerOtpResendBtn.style.pointerEvents = 'auto';
      if (registerOtpCountdown && registerOtpCountdown.classList.contains('hidden')) {
        resetResendLoading();
        registerOtpResendBtn.textContent = originalText;
      }
    }
  }

  async function handleForgotSubmit(e) {
    e.preventDefault();
    clearAuthError();

    const usernameOrEmail = forgotUsernameEmail.value.trim();
    if (!usernameOrEmail) {
      showAuthError("Please enter your username or email.");
      return;
    }

    if (forgotVerifyBtn) {
      forgotVerifyBtn.disabled = true;
      forgotVerifyBtn.querySelector('span').textContent = 'Sending Code...';
    }

    try {
      const res = await request('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail })
      });

      const data = await res.json();
      if (!res.ok) {
        showAuthError(data.error || "Verification failed");
        if (forgotVerifyBtn) {
          forgotVerifyBtn.disabled = false;
          forgotVerifyBtn.querySelector('span').textContent = 'Send Reset Code';
        }
        return;
      }

      // Success state
      recoveryIdentifier = usernameOrEmail;
      verifiedUserName.textContent = data.user.username;
      verifiedUserEmail.textContent = data.user.maskedEmail;
      setForgotStep('reset');
      startForgotResendCooldown(60);
      showPremiumToast("Email Sent Successfully", data.message || "Please check your inbox and spam folder for the reset code.", "success");

    } catch (err) {
      console.error(err);
      showAuthError("Connection to recovery server failed.");
    } finally {
      if (forgotVerifyBtn && forgotStateReset.classList.contains('hidden')) {
        forgotVerifyBtn.disabled = false;
        forgotVerifyBtn.querySelector('span').textContent = 'Send Reset Code';
      }
    }
  }

  async function handleForgotResendCode(e) {
    if (e) e.preventDefault();
    clearAuthError();

    const usernameOrEmail = recoveryIdentifier || (forgotUsernameEmail ? forgotUsernameEmail.value.trim() : '');
    if (!usernameOrEmail) {
      showAuthError("Please enter your username or email again.");
      setForgotStep('verify');
      return;
    }

    const resetLoading = setButtonLoading(forgotResendCodeBtn, true, 'Sending...');

    try {
      const res = await request('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail })
      });

      const data = await res.json();
      if (!res.ok) {
        showAuthError(data.error || "Failed to resend reset code.");
        return;
      }

      recoveryIdentifier = usernameOrEmail;
      if (forgotOtpCode) forgotOtpCode.value = '';
      showPremiumToast("Reset Code Sent", data.message || "A fresh password reset code has been sent.", "success");
      startForgotResendCooldown(60);
    } catch (err) {
      console.error(err);
      showAuthError("Connection to recovery server failed.");
    } finally {
      if (forgotResendCountdown && forgotResendCountdown.classList.contains('hidden')) {
        resetLoading();
      }
    }
  }

  async function handleResetSubmit(e) {
    if (e) e.preventDefault();
    clearAuthError();

    const otpCode = forgotOtpCode ? forgotOtpCode.value.replace(/\D/g, '').slice(0, 6) : '';
    if (forgotOtpCode) forgotOtpCode.value = otpCode;
    const newPassword = forgotNewPassword.value;
    const confirmPassword = forgotConfirmPassword.value;

    if (!otpCode) {
      showAuthError("Please enter the 6-digit verification code sent to your email.");
      return;
    }

    if (!newPassword || !confirmPassword) {
      showAuthError("Please enter and confirm your new password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      showAuthError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      showAuthError("Password must be at least 8 characters.");
      return;
    }

    if (btnSubmitNewPassword) {
      btnSubmitNewPassword.disabled = true;
      btnSubmitNewPassword.querySelector('span').textContent = 'Updating Password...';
    }

    try {
      const res = await request('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail: recoveryIdentifier, newPassword, otpCode })
      });

      const data = await res.json();
      if (!res.ok) {
        showAuthError(data.error || "Reset password failed");
        if (btnSubmitNewPassword) {
          btnSubmitNewPassword.disabled = false;
          btnSubmitNewPassword.querySelector('span').textContent = 'Update Password';
        }
        return;
      }

      // Clear form inputs
      if (forgotOtpCode) forgotOtpCode.value = '';
      if (forgotNewPassword) forgotNewPassword.value = '';
      if (forgotConfirmPassword) forgotConfirmPassword.value = '';

      // Reset recovery screens & switch back to login tab
      setForgotStep('forgot');
      switchAuthTab('login');

      showPremiumToast("Password Restored Successfully", "Your credentials have been updated. Please log in with your new password.", "success");

    } catch (err) {
      console.error(err);
      showAuthError("Connection to reset server failed.");
      if (btnSubmitNewPassword) {
        btnSubmitNewPassword.disabled = false;
        btnSubmitNewPassword.querySelector('span').textContent = 'Update Password';
      }
    }
  }

  function handleLogout() {
    request('/api/auth/logout', { method: 'POST' }).catch(() => null);
    state.user = null;
    state.authResolved = true;
    localStorage.removeItem('apexboost_token');
    localStorage.removeItem('apexboost_user');
    
    // Clear and hide dynamic dashboard
    dashboardLoaded = false;
    const dynamicContentContainer = document.getElementById('dashboard-dynamic-content');
    if (dynamicContentContainer) {
      dynamicContentContainer.innerHTML = '';
      dynamicContentContainer.classList.add('hidden');
    }
    
    // Reset admin panel loaded state
    adminPanelLoaded = false;
    const adminDynamicContainer = document.getElementById('admin-panel-dynamic-content');
    if (adminDynamicContainer) {
      adminDynamicContainer.innerHTML = '';
    }

    updateUserUI();
    switchView('landing');
    showPremiumToast("Logged Out Successfully", "You have securely closed your active session.", 'logout');
  }

  // --- ADMIN CONTROL PANEL HANDLERS ---
  async function handleAdminSearch() {
    const query = adminUserSearch.value.trim();
    if (!query) {
      alert("Please enter a username or email to search.");
      return;
    }

    adminSearchBtn.disabled = true;
    adminSearchBtn.textContent = 'Searching...';

    try {
      const response = await request(`/api/admin/users/search?query=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error("Search request failed");
      const users = await response.json();

      renderAdminSearchResults(users);
    } catch (err) {
      console.error(err);
      alert("Search failed. Ensure you are logged in as admin.");
    } finally {
      adminSearchBtn.disabled = false;
      adminSearchBtn.textContent = 'Search 🔍';
    }
  }

  function renderAdminSearchResults(users) {
    adminResultsBox.innerHTML = '';
    adminResultsBox.classList.remove('hidden');

    if (users.length === 0) {
      adminResultsBox.innerHTML = `<div style="color: var(--text-muted); text-align: center; padding: 20px;">No users found matching "${adminUserSearch.value.trim()}".</div>`;
      return;
    }

    users.forEach(user => {
      const card = document.createElement('div');
      card.className = 'user-result-card';
      card.style.display = 'flex';
      card.style.justifyContent = 'space-between';
      card.style.alignItems = 'center';
      card.style.padding = '15px';
      card.style.background = 'rgba(255, 255, 255, 0.03)';
      card.style.border = '1px solid var(--border-color)';
      card.style.borderRadius = '8px';

      card.innerHTML = `
        <div class="user-info" style="flex: 1; min-width: 150px; margin-right: 15px;">
          <strong style="color: var(--text-primary); font-size: 1rem;">${user.username}</strong>
          <div style="font-size: 0.8rem; color: var(--text-muted);">${user.email}</div>
          <div style="margin-top: 5px; font-weight: bold; color: var(--success);">Current Balance: ₱${parseFloat(user.balance).toFixed(2)}</div>
        </div>
        <div class="user-actions" style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
          <!-- Set Balance (Overwrite/Direct Edit) -->
          <div style="display: flex; gap: 5px; align-items: center;">
            <input type="number" class="set-balance-amount" placeholder="New Balance" style="width: 120px; padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border-color); background: rgba(0,0,0,0.2); color: white;" min="0" step="0.01" value="${parseFloat(user.balance).toFixed(2)}">
            <button class="btn btn-secondary btn-sm set-balance-btn" style="background: rgba(255, 255, 255, 0.08); border: 1px solid var(--border-color); color: white; padding: 6px 12px;" data-id="${user.id}">Set Balance ✍️</button>
          </div>
          <!-- Add Funds (Increment) -->
          <div style="display: flex; gap: 5px; align-items: center;">
            <input type="number" class="add-funds-amount" placeholder="Add Amount" style="width: 110px; padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border-color); background: rgba(0,0,0,0.2); color: white;" min="0.01" step="0.01">
            <button class="btn btn-primary btn-sm add-funds-btn" style="padding: 6px 12px;" data-id="${user.id}">Add Funds 💰</button>
          </div>
        </div>
      `;

      const setBalanceBtn = card.querySelector('.set-balance-btn');
      const balanceInput = card.querySelector('.set-balance-amount');
      const addFundsBtn = card.querySelector('.add-funds-btn');
      const amountInput = card.querySelector('.add-funds-amount');

      // 1. Handle Direct Balance Editing (Set Balance)
      setBalanceBtn.addEventListener('click', async () => {
        const newBalance = parseFloat(balanceInput.value);
        if (isNaN(newBalance) || newBalance < 0) {
          alert("Please enter a valid balance greater than or equal to 0.");
          return;
        }

        setBalanceBtn.disabled = true;
        setBalanceBtn.textContent = 'Updating...';

        try {
          const res = await request('/api/admin/set-balance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              targetUserId: user.id,
              balance: newBalance
            })
          });

          const data = await res.json();
          if (!res.ok) {
            alert(data.error || "Failed to set balance");
            return;
          }

          showPremiumToast(
            "Balance Updated",
            `Balance successfully set for ${data.username}! New balance: ₱${parseFloat(data.newBalance).toFixed(2)}`,
            "success"
          );

          // Refresh search results to update balance display
          handleAdminSearch();

          // Sync balance locally if updating logged-in user
          if (user.id === state.user.id) {
            syncUserBalance();
          }
        } catch (err) {
          console.error(err);
          alert("Connection error setting balance.");
        } finally {
          setBalanceBtn.disabled = false;
          setBalanceBtn.textContent = 'Set Balance ✍️';
        }
      });

      // 2. Handle Incremental Funds Allocation (Add Funds)
      addFundsBtn.addEventListener('click', async () => {
        const amount = parseFloat(amountInput.value);
        if (isNaN(amount) || amount <= 0) {
          alert("Please enter a valid amount greater than 0.");
          return;
        }

        addFundsBtn.disabled = true;
        addFundsBtn.textContent = 'Adding...';

        try {
          const res = await request('/api/admin/add-funds', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              targetUserId: user.id,
              amount: amount
            })
          });

          const data = await res.json();
          if (!res.ok) {
            alert(data.error || "Failed to add funds");
            return;
          }

          showPremiumToast(
            "Funds Added",
            `Added ₱${amount.toFixed(2)} to ${data.username}! New balance: ₱${parseFloat(data.newBalance).toFixed(2)}`,
            "success"
          );

          // Refresh search results to update balance display
          handleAdminSearch();

          // Sync balance locally if adding funds to logged-in user
          if (user.id === state.user.id) {
            syncUserBalance();
          }
        } catch (err) {
          console.error(err);
          alert("Connection error adding funds.");
        } finally {
          addFundsBtn.disabled = false;
          addFundsBtn.textContent = 'Add Funds 💰';
        }
      });

      adminResultsBox.appendChild(card);
    });
  }

  // ==========================================================================
  // POPULAR SERVICES PANEL
  // ==========================================================================

  async function loadPopularServices() {
    const grid = document.getElementById('popular-services-grid');
    if (!grid) return;

    // 1. Define General Public Globally Trending Services
    const trendingServices = [
      {
        id: 16604,
        name: "Facebook Followers - Fast Global Delivery",
        platform: "Facebook",
        price: "39.50",
        min: 50,
        max: 500000,
        time: "~1-2 hours completion",
        badge: "Recommended",
        badgeClass: "ai-fast",
        rank: "Globally #1 Trending",
        rankEmoji: "🥇"
      },
      {
        id: 16606,
        name: "Facebook Post Reactions - Instant Engagement",
        platform: "Facebook",
        price: "49.00",
        min: 10,
        max: 100000,
        time: "Instant delivery",
        badge: "Stable",
        badgeClass: "ai-sale",
        rank: "Globally #2 Trending",
        rankEmoji: "🥈"
      },
      {
        id: 16614,
        name: "TikTok Likes - Real Phone Farm Quality",
        platform: "TikTok",
        price: "55.00",
        min: 10,
        max: 1000000,
        time: "~15-30 mins completion",
        badge: "Fast",
        badgeClass: "ai-fast",
        rank: "Globally #3 Trending",
        rankEmoji: "🥉"
      },
      {
        id: 16598,
        name: "TikTok Likes - High Retention Boost",
        platform: "TikTok",
        price: "79.00",
        min: 10,
        max: 1000000,
        time: "~30-60 mins completion",
        badge: "Stable",
        badgeClass: "ai-sale",
        rank: "Globally #4 Trending",
        rankEmoji: "🔥"
      }
    ];

    // Build the container HTML with dual grid sections
    let htmlContent = `
      <div class="trending-section" style="margin-bottom: 30px;">
        <h3 style="color: var(--primary); margin-top: 0; font-family: 'Outfit', sans-serif; display: flex; align-items: center; gap: 8px;">
          <span>🔥</span> Globally Trending SMM Services
        </h3>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 20px;">Real-time trending services across the reseller network. High safety, lightning speed, and maximum stability.</p>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">
          ${trendingServices.map(svc => `
            <div class="popular-svc-card" style="position: relative; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; border-color: rgba(20, 184, 166, 0.15);">
              <div class="popular-rank-badge" style="background: linear-gradient(135deg, var(--primary), var(--accent)); width: 36px; height: 36px; border-radius: 8px; font-weight: bold; display: flex; align-items: center; justify-content: center; position: absolute; top: 12px; right: 12px; font-size: 1.1rem; box-shadow: 0 4px 10px rgba(20, 184, 166, 0.2);">${svc.rankEmoji}</div>
              
              <div style="padding-right: 40px;">
                <div class="popular-svc-name" style="font-weight: 700; color: #fff; font-size: 0.95rem; line-height: 1.4; font-family: 'Outfit', sans-serif;">${svc.name}</div>
                <div style="font-size: 0.72rem; color: var(--text-muted); margin-bottom: 12px; margin-top: 4px;">Platform: <strong>${svc.platform}</strong> &nbsp;·&nbsp; ID #${svc.id}</div>
              </div>

              <div class="popular-svc-stats" style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px;">
                <span class="stat-chip stat-chip-spent" style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2); color: var(--success); font-weight: 700; padding: 2px 8px; border-radius: 6px; font-size: 0.75rem;">₱ ${svc.price}/1K</span>
                <span class="stat-chip stat-chip-qty" style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); color: var(--text-secondary); padding: 2px 8px; border-radius: 6px; font-size: 0.75rem;">👥 Min: ${svc.min.toLocaleString()}</span>
                <span class="stat-chip stat-chip-qty" style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); color: var(--text-secondary); padding: 2px 8px; border-radius: 6px; font-size: 0.75rem;">👥 Max: ${svc.max.toLocaleString()}</span>
                <span class="stat-chip stat-chip-time" style="background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.2); color: var(--primary); padding: 2px 8px; border-radius: 6px; font-size: 0.75rem;">⏱️ ${svc.time}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 10px; margin-top: auto;">
                <span class="badge-ai-status ${svc.badgeClass}" style="padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; text-transform: capitalize;">${svc.badge}</span>
                <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600;">${svc.rank}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="personal-section" style="margin-top: 40px; border-top: 1px solid rgba(255, 255, 255, 0.06); padding-top: 30px;">
        <h3 style="color: var(--primary); margin-top: 0; font-family: 'Outfit', sans-serif; display: flex; align-items: center; gap: 8px;">
          <span>📈</span> Your Campaign Statistics
        </h3>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 20px;">Your personal campaign order volume, quantity, and total invested balance statistics.</p>
        <div id="personal-stats-grid-container">
          <!-- Rendered dynamically -->
        </div>
      </div>
    `;

    grid.innerHTML = htmlContent;

    const personalContainer = document.getElementById('personal-stats-grid-container');
    if (!personalContainer) return;

    if (!state.user) {
      personalContainer.innerHTML = `
        <div class="popular-empty-state" style="padding: 30px; text-align: center; border: 1px dashed var(--border-color); border-radius: 12px; background: rgba(0,0,0,0.15);">
          <div class="empty-icon" style="font-size: 2rem; margin-bottom: 10px;">🔒</div>
          <p style="color: var(--text-muted); font-size: 0.88rem; margin: 0;">Please <a href="javascript:void(0)" onclick="showAuthModal('login')" style="color: var(--primary); text-decoration: underline;">log in</a> to see your personal campaign statistics.</p>
        </div>
      `;
      return;
    }

    personalContainer.innerHTML = `<div class="services-loading-state" style="padding: 20px;"><div class="spinner"></div><p>Syncing your order statistics...</p></div>`;

    try {
      const res = await request('/api/user/order-stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      const stats = await res.json();

      if (!Array.isArray(stats) || stats.length === 0) {
        personalContainer.innerHTML = `
          <div class="popular-empty-state" style="padding: 30px; text-align: center; border: 1px dashed var(--border-color); border-radius: 12px; background: rgba(0,0,0,0.15);">
            <div class="empty-icon" style="font-size: 2rem; margin-bottom: 10px;">📦</div>
            <p style="color: var(--text-muted); font-size: 0.88rem; margin: 0;">No campaigns launched yet. Place your first order to see your personalized statistics here!</p>
          </div>
        `;
        return;
      }

      personalContainer.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">
          ${stats.map((svc, idx) => {
            const rankEmoji = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
            const lastDate = svc.lastOrderedAt ? new Date(svc.lastOrderedAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
            const completionText = svc.avgCompletionMinutes
              ? (svc.avgCompletionMinutes >= 60
                  ? `~${Math.round(svc.avgCompletionMinutes / 60)}h avg`
                  : `~${svc.avgCompletionMinutes}min avg`)
              : 'N/A';

            return `
              <div class="popular-svc-card" style="position: relative;">
                <div class="popular-rank-badge" style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); color: var(--text-primary);">${rankEmoji}</div>
                <div class="popular-svc-name" style="font-weight: 700; color: #fff; font-size: 0.9rem; line-height: 1.4;">${svc.serviceName}</div>
                <div style="font-size: 0.72rem; color: var(--text-muted); margin-bottom: 12px; margin-top: 4px;">Service ID #${svc.serviceId}</div>
                
                <div class="popular-svc-stats" style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px;">
                  <span class="stat-chip stat-chip-orders" style="background: rgba(20, 184, 166, 0.06); border-color: rgba(20, 184, 166, 0.15); color: var(--primary); padding: 2px 8px; border-radius: 6px; font-size: 0.75rem;">📦 ${svc.totalOrders} order${svc.totalOrders > 1 ? 's' : ''}</span>
                  <span class="stat-chip stat-chip-qty" style="background: rgba(255,255,255,0.02); border-color: var(--border-color); color: var(--text-secondary); padding: 2px 8px; border-radius: 6px; font-size: 0.75rem;">👥 ${parseInt(svc.totalQuantity || 0).toLocaleString()} delivered</span>
                  <span class="stat-chip stat-chip-spent" style="background: rgba(16, 185, 129, 0.06); border-color: rgba(16, 185, 129, 0.15); color: var(--success); font-weight: 700; padding: 2px 8px; border-radius: 6px; font-size: 0.75rem;">₱ ${parseFloat(svc.totalSpent).toFixed(2)} spent</span>
                  ${svc.avgCompletionMinutes ? `<span class="stat-chip stat-chip-time" style="background: rgba(59, 130, 246, 0.06); border-color: rgba(59, 130, 246, 0.15); color: var(--accent); padding: 2px 8px; border-radius: 6px; font-size: 0.75rem;">⏱️ ${completionText}</span>` : ''}
                </div>
                <div class="popular-svc-footer" style="font-size: 0.72rem; color: var(--text-muted); border-top: 1px solid rgba(255,255,255,0.03); padding-top: 8px; margin-top: 10px;">📅 Last ordered: <strong>${lastDate}</strong></div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } catch (err) {
      personalContainer.innerHTML = `<div class="popular-empty-state" style="padding: 20px;"><div class="empty-icon">⚠️</div><p>Could not load order statistics. Try again shortly.</p></div>`;
      console.error('Popular services error:', err);
    }
  }

  // ==========================================================================
  // ADMIN SERVICE PRICE EDITOR
  // ==========================================================================

  let allPriceEditorServices = [];
  let priceEditorOverrides = {};
  let priceEditorLoaded = false;

  async function loadAdminPriceEditor() {
    if (!state.user || (state.user.role !== 'admin' && state.user.role !== 'super_admin')) return;
    const tbody = document.getElementById('admin-price-tbody');
    if (!tbody) return;

    // Set up search listener (only once)
    const svcSearch = document.getElementById('admin-svc-search');
    const reloadBtn = document.getElementById('admin-reload-prices-btn');

    if (!priceEditorLoaded) {
      svcSearch && svcSearch.addEventListener('input', () => renderPriceTable());
      reloadBtn && reloadBtn.addEventListener('click', () => {
        priceEditorLoaded = false;
        loadAdminPriceEditor();
      });
    }

    showTableSkeleton(tbody, 5);

    try {
      // Fetch live services list
      const svcRes = await request('/api/v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'services', mode: state.operatingMode })
      });
      const services = await svcRes.json();

      if (!Array.isArray(services)) throw new Error('Invalid services response');
      allPriceEditorServices = services;

      // Fetch current overrides
      const ovRes = await request('/api/admin/service-prices');
      priceEditorOverrides = ovRes.ok ? await ovRes.json() : {};

      priceEditorLoaded = true;
      renderPriceTable();
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="color: var(--danger); padding: 20px;">❌ Failed to load services: ${err.message}</td></tr>`;
    }
  }

  function renderPriceTable() {
    const tbody = document.getElementById('admin-price-tbody');
    const svcSearch = document.getElementById('admin-svc-search');
    if (!tbody) return;

    const q = svcSearch ? svcSearch.value.toLowerCase() : '';
    const filtered = allPriceEditorServices
      .filter(s => !q || s.name.toLowerCase().includes(q) || s.service.toString().includes(q))
      .slice(0, 150); // limit to 150 rows for performance

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding: 20px;">No services match your search.</td></tr>`;
      return;
    }

    tbody.innerHTML = '';
    filtered.forEach(svc => {
      const svcId = svc.service.toString();
      const hasOverride = priceEditorOverrides[svcId] !== undefined;
      const currentRate = hasOverride ? priceEditorOverrides[svcId] : parseFloat(svc.rate);

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><code style="font-size: 0.78rem;">#${svcId}</code></td>
        <td style="max-width: 240px; font-size: 0.8rem; white-space: normal; line-height: 1.3;">${svc.name.substring(0, 80)}${svc.name.length > 80 ? '…' : ''}</td>
        <td style="color: var(--text-muted); font-size: 0.82rem;">₱${parseFloat(svc.rate).toFixed(4)}</td>
        <td>
          <input class="price-edit-input ${hasOverride ? 'overridden' : ''}" 
            type="number" min="0" step="0.0001"
            value="${currentRate.toFixed(4)}" 
            data-service-id="${svcId}"
            data-service-name="${svc.name.replace(/"/g, '&quot;')}"
            id="price-input-${svcId}">
        </td>
        <td style="display: flex; gap: 6px; flex-wrap: wrap;">
          <button class="btn-price-save" data-svcid="${svcId}">💾 Save</button>
          ${hasOverride ? `<button class="btn-price-reset" data-svcid="${svcId}">↺ Reset</button>` : ''}
        </td>
      `;

      // Save handler
      tr.querySelector('.btn-price-save').addEventListener('click', async function() {
        const inp = document.getElementById(`price-input-${svcId}`);
        const newRate = parseFloat(inp.value);
        if (isNaN(newRate) || newRate < 0) { alert('Invalid price. Enter a positive number.'); return; }

        this.textContent = '⏳...';
        this.disabled = true;

        const res = await request('/api/admin/service-price', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ serviceId: svcId, customRate: newRate, serviceName: svc.name })
        });
        const data = await res.json();

        if (data.success) {
          priceEditorOverrides[svcId] = newRate;
          inp.classList.add('overridden');
          this.textContent = '✅ Saved!';
          setTimeout(() => { this.textContent = '💾 Save'; this.disabled = false; renderPriceTable(); }, 1200);
        } else {
          this.textContent = '❌ Error';
          this.disabled = false;
        }
      });

      // Reset handler
      const resetBtn = tr.querySelector('.btn-price-reset');
      if (resetBtn) {
        resetBtn.addEventListener('click', async function() {
          this.textContent = '⏳...';
          this.disabled = true;

          const res = await request('/api/admin/service-price', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ serviceId: svcId })
          });
          const data = await res.json();

          if (data.success) {
            delete priceEditorOverrides[svcId];
            renderPriceTable();
          } else {
            this.textContent = '❌';
            this.disabled = false;
          }
        });
      }

      tbody.appendChild(tr);
    });

    // Total count
    const countInfo = document.createElement('tr');
    countInfo.innerHTML = `<td colspan="5" style="text-align: center; font-size: 0.76rem; color: var(--text-muted); padding: 8px;">Showing ${filtered.length} of ${allPriceEditorServices.length} services · ${Object.keys(priceEditorOverrides).length} custom price(s) set</td>`;
    tbody.appendChild(countInfo);
  }

  // ==========================================================================
  // CUSTOM PREMIUM DASHBOARD ACTIONS & CUSTOM TABS logic
  // ==========================================================================

  // 1. Toggle profile dropdown popover
  const navProfileTrigger = document.getElementById('nav-profile-trigger');
  const profileDropdown = document.getElementById('profile-dropdown');
  const navUserProfile = document.getElementById('nav-user-profile');

  // Sidebar dropdown components
  const sidebarUserCard = document.getElementById('sidebar-user-card');
  const sidebarProfileDropdown = document.getElementById('sidebar-profile-dropdown');
  const sidebarUsernameBtn = document.getElementById('sidebar-username');
  const sidebarAvatarBtn = document.getElementById('sidebar-avatar-btn');

  if (navProfileTrigger && profileDropdown && navUserProfile) {
    navProfileTrigger.addEventListener('click', (e) => {
      e.stopPropagation();

      const isOpening = profileDropdown.classList.contains('hidden');
      if (isOpening) {
        closeAllOverlays('profile'); // Close other overlays
        navUserProfile.classList.add('active');
        profileDropdown.classList.remove('hidden');
      } else {
        navUserProfile.classList.remove('active');
        profileDropdown.classList.add('hidden');
      }
      syncAppShellState();
    });
    
    // Close dropdown clicking anywhere else
    document.addEventListener('click', (e) => {
      if (!navUserProfile.contains(e.target)) {
        navUserProfile.classList.remove('active');
        profileDropdown.classList.add('hidden');
        syncAppShellState();
      }
    });
  }

  // Sidebar profile dropdown toggle listeners
  const toggleSidebarDropdown = (e) => {
    e.stopPropagation();
    if (sidebarProfileDropdown) {
      sidebarProfileDropdown.classList.toggle('hidden');
      sidebarProfileDropdown.classList.toggle('active');
    }
    // Close header dropdown if open
    if (navUserProfile) navUserProfile.classList.remove('active');
    if (profileDropdown) {
      profileDropdown.classList.add('hidden');
      syncAppShellState();
    }
  };

  if (sidebarUsernameBtn) sidebarUsernameBtn.addEventListener('click', toggleSidebarDropdown);
  if (sidebarAvatarBtn) sidebarAvatarBtn.addEventListener('click', toggleSidebarDropdown);

  // Close sidebar profile dropdown on outside click
  document.addEventListener('click', (e) => {
    if (sidebarProfileDropdown && sidebarUserCard && !sidebarUserCard.contains(e.target)) {
      sidebarProfileDropdown.classList.add('hidden');
      sidebarProfileDropdown.classList.remove('active');
    }
  });

  // Close all profile dropdowns on scroll
  window.addEventListener('scroll', () => {
    if (navUserProfile && navUserProfile.classList.contains('active')) {
      navUserProfile.classList.remove('active');
    }
    if (profileDropdown && !profileDropdown.classList.contains('hidden')) {
      profileDropdown.classList.add('hidden');
      syncAppShellState();
    }
    if (sidebarProfileDropdown && !sidebarProfileDropdown.classList.contains('hidden')) {
      sidebarProfileDropdown.classList.add('hidden');
      sidebarProfileDropdown.classList.remove('active');
    }
  }, { passive: true });

  // Sidebar profile dropdown menu action bindings
  const sdItemProfile = document.getElementById('sd-item-profile');
  const sdItemFunds = document.getElementById('sd-item-funds');
  const sdItemLogout = document.getElementById('sd-item-logout');

  if (sdItemProfile) {
    sdItemProfile.addEventListener('click', () => {
      if (sidebarProfileDropdown) {
        sidebarProfileDropdown.classList.add('hidden');
        sidebarProfileDropdown.classList.remove('active');
      }
      switchView('dashboard');
      switchTab('account');
    });
  }

  if (sdItemFunds) {
    sdItemFunds.addEventListener('click', () => {
      if (sidebarProfileDropdown) {
        sidebarProfileDropdown.classList.add('hidden');
        sidebarProfileDropdown.classList.remove('active');
      }
      switchView('dashboard');
      switchTab('add-funds');
    });
  }

  if (sdItemLogout) {
    sdItemLogout.addEventListener('click', () => {
      if (sidebarProfileDropdown) {
        sidebarProfileDropdown.classList.add('hidden');
        sidebarProfileDropdown.classList.remove('active');
      }
      handleLogout();
    });
  }

  const sidebarTabLogoutBtn = document.getElementById('sidebar-tab-logout-btn');
  if (sidebarTabLogoutBtn) {
    sidebarTabLogoutBtn.addEventListener('click', () => {
      handleLogout();
    });
  }

  // 2. Dropdown tab click event listeners
  const dropdownTabs = [
    { btnId: 'dropdown-item-account', tabId: 'account' },
    { btnId: 'dropdown-item-add-funds', tabId: 'add-funds' },
    { btnId: 'dropdown-item-affiliates', tabId: 'affiliates' },
    { btnId: 'dropdown-item-terms', tabId: 'terms-conditions' }
  ];

  dropdownTabs.forEach(({ btnId, tabId }) => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.addEventListener('click', () => {
        // Close dropdown
        if (navUserProfile) navUserProfile.classList.remove('active');
        if (profileDropdown) profileDropdown.classList.add('hidden');
        
        // Switch to dashboard view
        switchView('dashboard');
        
        // Switch to tab
        switchTab(tabId);
      });
    }
  });

  // Dropdown logout button listener
  const dropdownLogoutBtn = document.getElementById('dropdown-item-logout');
  if (dropdownLogoutBtn) {
    dropdownLogoutBtn.addEventListener('click', () => {
      if (navUserProfile) navUserProfile.classList.remove('active');
      if (profileDropdown) profileDropdown.classList.add('hidden');
      handleLogout();
    });
  }

  // 3. Change Password Form Submission Handler
  const changePasswordForm = document.getElementById('change-password-form');
  const changePasswordAlert = document.getElementById('change-password-alert');
  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const currentPassword = document.getElementById('change-password-current').value;
      const newPassword = document.getElementById('change-password-new').value;
      const confirmPassword = document.getElementById('change-password-confirm').value;
      
      if (newPassword !== confirmPassword) {
        showPasswordAlert("New passwords do not match.", "error");
        return;
      }
      
      try {
        const res = await request('/api/user/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentPassword,
            newPassword
          })
        });
        
        const data = await res.json();
        if (data.error) {
          showPasswordAlert(data.error, "error");
        } else {
          showPasswordAlert("🎉 Password changed successfully!", "success");
          changePasswordForm.reset();
        }
      } catch (err) {
        showPasswordAlert("Network error. Failed to change password.", "error");
      }
    });
  }

  function showPasswordAlert(msg, type) {
    if (changePasswordAlert) {
      changePasswordAlert.innerHTML = msg;
      changePasswordAlert.className = `order-status-alert ${type}`;
      changePasswordAlert.classList.remove('hidden');
      setTimeout(() => {
        changePasswordAlert.classList.add('hidden');
      }, 5000);
    }
  }

  // 4. Add Funds Payment Tabs Switcher, Deposit Submission & Affiliates Copy Handler
  function bindAddFundsEventListeners() {
    const paymentMethodTabs = document.getElementById('payment-method-tabs');
    if (paymentMethodTabs) {
      paymentMethodTabs.addEventListener('click', (e) => {
        const tab = e.target.closest('.platform-tab');
        if (!tab) return;
        
        paymentMethodTabs.querySelectorAll('.platform-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        const method = tab.getAttribute('data-method');
        
        // Toggle instructions view
        document.querySelectorAll('.payment-method-details').forEach(detail => {
          detail.classList.add('hidden');
        });
        const activeDetail = document.getElementById(`payment-details-${method}`);
        if (activeDetail) activeDetail.classList.remove('hidden');

        resetDepositFlow();
      });
    }

    const btnStartDeposit = document.getElementById('btn-start-deposit');
    if (btnStartDeposit) {
      btnStartDeposit.addEventListener('click', async () => {
        const amountVal = document.getElementById('funds-amount').value.trim();
        if (!amountVal || isNaN(parseFloat(amountVal)) || parseFloat(amountVal) < 50) {
          showPremiumToast("Invalid Amount", "Minimum deposit amount is ₱50.00 PHP.", "error");
          return;
        }

        const activeMethodTab = document.querySelector('#payment-method-tabs .platform-tab.active');
        const paymentMethod = activeMethodTab ? activeMethodTab.getAttribute('data-method') : 'gcash';

        btnStartDeposit.disabled = true;
        btnStartDeposit.textContent = "Loading Instructions... 🔓";

        try {
          const response = await request('/api/user/deposit/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paymentMethod,
              amount: parseFloat(amountVal)
            })
          });

          const data = await response.json();
          if (!response.ok || data.error) {
            throw new Error(data.error || "Failed to retrieve secure payment instructions.");
          }

          // Populate spans
          if (paymentMethod === 'gcash') {
            document.getElementById('reveal-gcash-number').textContent = data.accountNumber;
            document.getElementById('reveal-gcash-name').textContent = data.accountName;
            
            // Setup and show dynamic QR code card
            const dynamicQrImg = document.getElementById('dynamic-qr-img');
            const dynamicQrAmount = document.getElementById('dynamic-qr-amount');
            const dynamicQrCard = document.getElementById('dynamic-qr-card');
            if (dynamicQrAmount) dynamicQrAmount.textContent = parseFloat(amountVal).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
            if (dynamicQrImg) dynamicQrImg.src = data.qrCodeData;
            if (dynamicQrCard) dynamicQrCard.classList.remove('hidden');
          } else if (paymentMethod === 'paymaya' || paymentMethod === 'maya') {
            document.getElementById('reveal-paymaya-number').textContent = data.accountNumber;
            document.getElementById('reveal-paymaya-name').textContent = data.accountName;
            
            // Setup and show dynamic QR code card (using Maya details)
            const dynamicQrImg = document.getElementById('dynamic-qr-img');
            const dynamicQrAmount = document.getElementById('dynamic-qr-amount');
            const dynamicQrCard = document.getElementById('dynamic-qr-card');
            if (dynamicQrAmount) dynamicQrAmount.textContent = parseFloat(amountVal).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
            if (dynamicQrImg) dynamicQrImg.src = data.qrCodeData;
            if (dynamicQrCard) dynamicQrCard.classList.remove('hidden');
          } else if (paymentMethod === 'bpi') {
            document.getElementById('reveal-bpi-number').textContent = data.accountNumber;
            document.getElementById('reveal-bpi-name').textContent = data.accountName;
            document.getElementById('reveal-bpi-type').textContent = data.accountType;
          }

          // Hide start button, show proof submission fields
          btnStartDeposit.classList.add('hidden');
          const proofWrapper = document.getElementById('payment-proof-submission-wrapper');
          if (proofWrapper) proofWrapper.classList.remove('hidden');

          showPremiumToast("Instructions Loaded", "🔐 Secure transfer details retrieved. Please make payment and enter Reference ID below.", "success");
        } catch (err) {
          console.error("Reveal deposit instructions failed:", err);
          showPremiumToast("Error", `❌ ${err.message}`, "error");
        } finally {
          btnStartDeposit.disabled = false;
          btnStartDeposit.textContent = "Reveal Payment Instructions 🔓";
        }
      });
    }

    const addFundsForm = document.getElementById('add-funds-submission-form');
    const fundsFormAlert = document.getElementById('funds-form-alert');
    if (addFundsForm) {
      addFundsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const amountVal = document.getElementById('funds-amount').value.trim();
        const reference = document.getElementById('funds-reference').value.trim();
        
        if (!amountVal || isNaN(parseFloat(amountVal)) || parseFloat(amountVal) < 50) {
          showPremiumToast("Invalid Amount", "Minimum deposit amount is ₱50.00 PHP.", "error");
          return;
        }
        
        if (!reference) {
          showPremiumToast("Missing Reference ID", "Please enter your GCash Transaction Reference ID.", "error");
          return;
        }

        const activeMethodTab = document.querySelector('#payment-method-tabs .platform-tab.active');
        const paymentMethod = activeMethodTab ? activeMethodTab.getAttribute('data-method') : 'gcash';
        
        const submitBtn = addFundsForm.querySelector('button[type="submit"]');
        const originalText = submitBtn ? submitBtn.textContent : 'Submit Transfer Proof';
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Submitting Proof... ⏳';
        }

        try {
          const response = await request('/api/user/deposit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paymentMethod,
              amount: parseFloat(amountVal),
              referenceId: reference
            })
          });

          const data = await response.json();
          if (!response.ok || data.error) {
            throw new Error(data.error || 'Server rejected deposit request.');
          }

          if (fundsFormAlert) {
            fundsFormAlert.classList.add('hidden');
          }
          
          showPremiumToast(
            "Request Submitted",
            `🎉 Deposit proof submitted successfully! Amount: ₱${parseFloat(amountVal).toFixed(2)}, Ref ID: ${reference}. Awaiting administrator verification.`,
            "success"
          );
          triggerApexConfetti();
          addFundsForm.reset();
          loadUserDepositsHistory();
          
          // Fully reset the deposit flow visually and hide QR codes
          resetDepositFlow();
        } catch (err) {
          console.error("Deposit submission failed:", err);
          showPremiumToast("Submission Failed", `❌ ${err.message}`, "error");
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
          }
        }
      });
    }

    const btnCopyRefLink = document.getElementById('btn-copy-ref-link');
    const affiliatesRefLink = document.getElementById('affiliates-ref-link');
    if (btnCopyRefLink && affiliatesRefLink) {
      btnCopyRefLink.addEventListener('click', () => {
        affiliatesRefLink.select();
        affiliatesRefLink.setSelectionRange(0, 99999);
        
        try {
          navigator.clipboard.writeText(affiliatesRefLink.value);
          btnCopyRefLink.textContent = "Copied! ✓";
          btnCopyRefLink.style.borderColor = "var(--success)";
          btnCopyRefLink.style.color = "var(--success)";
        } catch (err) {
          document.execCommand('copy');
          btnCopyRefLink.textContent = "Copied! ✓";
        }
        
        setTimeout(() => {
          btnCopyRefLink.textContent = "Copy";
          btnCopyRefLink.style.borderColor = "";
          btnCopyRefLink.style.color = "";
        }, 2000);
      });
    }
  }

  // 6. Floating Live Social Proof Popups Engine
  function initSocialProofPopups() {
    const socialProofContainer = document.getElementById('social-proof-container');
    if (!socialProofContainer) return;
    
    const locations = ["Manila", "Quezon City", "Cebu", "Davao", "Zamboanga", "Taguig", "Pasig", "Makati", "Iloilo", "Bacolod", "Cagayan de Oro", "General Santos", "Bulacan", "Baguio", "Angeles", "Cavite"];
    const names = ["Julius", "Mark", "Maria", "Angelo", "John", "Sarah", "Christian", "Grace", "Patricia", "Michael", "Dave", "Rhea", "Kervin", "Dante", "Elmer", "Christine"];
    
    setInterval(() => {
      if (state.currentView === 'dashboard' || state.user) {
        socialProofContainer.innerHTML = '';
        return;
      }
      if (state.services.length === 0) return;
      
      // Select random SMM package
      const svc = state.services[Math.floor(Math.random() * state.services.length)];
      
      // Random buyer details
      const loc = locations[Math.floor(Math.random() * locations.length)];
      const name = names[Math.floor(Math.random() * names.length)];
      
      // Random quantity within service limits
      const minQty = parseInt(svc.min) || 100;
      const maxQty = Math.min(parseInt(svc.max) || 10000, 5000);
      let qty = Math.floor(Math.random() * (maxQty - minQty) + minQty);
      qty = Math.round(qty / 50) * 50;
      if (qty <= 0) qty = minQty;

      // Platform icon resolver
      const platform = getPlatformFromCategory(svc.category);
      let logoHtml = '<span>🌐</span>';
      if (platform !== 'other' && platform !== 'all') {
        logoHtml = `<img src="/images/${platform}.png" alt="${platform}">`;
      } else if (svc.category.includes('🔥')) {
        logoHtml = '<span>🔥</span>';
      }
      
      const popup = document.createElement('div');
      popup.className = 'social-proof-popup';
      popup.innerHTML = `
        <div class="social-proof-icon">
          ${logoHtml}
        </div>
        <div class="social-proof-details">
          <div class="social-proof-title">
            <strong>${name}</strong> from <span>${loc}</span> ordered ${qty.toLocaleString()} units of ${svc.name.split('[')[0].trim()}
          </div>
          <div class="social-proof-meta">
            <span>Just now</span>
            <span class="social-proof-verified">✓ Verified</span>
          </div>
        </div>
      `;
      
      socialProofContainer.appendChild(popup);
      
      // Fade out and remove after 6s
      setTimeout(() => {
        popup.remove();
      }, 6000);
      
    }, 15000);
  }

  // --- SUPPORT TICKETS SYSTEM FRONTEND CONTROLLERS ---
  let selectedTicketAttachmentBase64 = null;

  function bindSupportTicketEvents() {
    const subjectInput = document.getElementById('ticket-subject');
    const requestInput = document.getElementById('ticket-request-type');
    const subjectTrigger = document.getElementById('ticket-subject-dropdown-trigger');
    const requestTrigger = document.getElementById('ticket-request-dropdown-trigger');
    const supportForm = document.getElementById('support-ticket-form');
    const supportContactPanel = document.getElementById('support-contact-panel');
    const supportSubmitButton = document.getElementById('btn-submit-ticket');

    function setHumanSupportMode(enabled) {
      const isHuman = Boolean(enabled);
      if (supportContactPanel) supportContactPanel.classList.toggle('hidden', !isHuman);
      if (supportSubmitButton) supportSubmitButton.classList.toggle('hidden', isHuman);
      if (!supportForm) return;
      supportForm.querySelectorAll(':scope > .form-group').forEach(group => {
        group.classList.toggle('hidden', isHuman);
        group.querySelectorAll('input, textarea, button').forEach(control => {
          control.disabled = isHuman;
        });
      });
    }

    // Support lane cards selector logic
    const laneCards = document.querySelectorAll('.support-lane-grid .support-lane-card');
    if (laneCards.length > 0) {
      // Set initial state from the active lane card (Order AI Support)
      const activeCard = document.querySelector('.support-lane-grid .support-lane-card.active');
      if (activeCard) {
        const initialSubject = activeCard.getAttribute('data-subject');
        const initialRequest = activeCard.getAttribute('data-request');
        if (subjectInput) {
          subjectInput.value = initialSubject;
          const textEl = subjectTrigger ? subjectTrigger.querySelector('.trigger-text') : null;
          if (textEl) textEl.textContent = initialSubject;
        }
        if (requestInput) {
          requestInput.value = initialRequest;
          const textEl = requestTrigger ? requestTrigger.querySelector('.trigger-text') : null;
          if (textEl) textEl.textContent = initialRequest;
        }
        setHumanSupportMode(activeCard.getAttribute('data-lane') === 'human');
      }

      laneCards.forEach(card => {
        card.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          laneCards.forEach(c => c.classList.remove('active'));
          card.classList.add('active');
          
          const subject = card.getAttribute('data-subject');
          const requestType = card.getAttribute('data-request');
          
          if (subjectInput) subjectInput.value = subject;
          if (requestInput) requestInput.value = requestType;
          
          if (subjectTrigger) {
            const subText = subjectTrigger.querySelector('.trigger-text');
            if (subText) subText.textContent = subject;
          }
          if (requestTrigger) {
            const reqText = requestTrigger.querySelector('.trigger-text');
            if (reqText) reqText.textContent = requestType;
          }
          
          const lane = card.getAttribute('data-lane');
          setHumanSupportMode(lane === 'human');
          const laneAlert = document.getElementById('support-lane-alert');
          const lanePolicy = document.getElementById('support-lane-policy');
          
          if (laneAlert && lanePolicy) {
            if (lane === 'fake-complete') {
              laneAlert.innerHTML = `⚠️ <strong>Requires Screenshot Proof:</strong> False completion reviews require upload of before & after screenshots.`;
              laneAlert.className = 'support-lane-alert warning';
              laneAlert.classList.remove('hidden');
              
              lanePolicy.innerHTML = `<summary>View False Completion Policy</summary><p style="margin-top: 8px; font-size: 0.8rem; color: var(--text-muted);">Filing a false completion claim requires verifying transaction histories. Fraudulent reports will lead to account termination.</p>`;
              lanePolicy.classList.remove('hidden');
            } else if (lane === 'ai') {
              laneAlert.innerHTML = `🤖 <strong>AI Instant Resolution:</strong> AI will instantly process refills, cancellations, and speed up checks if eligible.`;
              laneAlert.className = 'support-lane-alert info';
              laneAlert.classList.remove('hidden');
              
              lanePolicy.innerHTML = '';
              lanePolicy.classList.add('hidden');
            } else {
              laneAlert.innerHTML = `<strong>Direct Human Support:</strong> Use Telegram @Apexsmmboosting or the official WhatsApp Business button below.`;
              laneAlert.className = 'support-lane-alert info';
              laneAlert.classList.remove('hidden');
              
              lanePolicy.innerHTML = '';
              lanePolicy.classList.add('hidden');
            }
          }
        });
      });
    }

    // 1. Custom Dropdown toggle logic: Subject dropdown select
    const subjectDropdown = document.getElementById('ticket-subject-custom-dropdown');
    const subjectMenu = document.getElementById('ticket-subject-dropdown-menu');
    
    if (subjectTrigger && subjectDropdown && subjectMenu) {
      subjectTrigger.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        subjectDropdown.classList.toggle('active');
        subjectMenu.classList.toggle('hidden');
      });

      subjectMenu.querySelectorAll('.custom-dropdown-item').forEach(opt => {
        opt.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const val = opt.getAttribute('data-value');
          if (subjectInput) subjectInput.value = val;
          
          const textEl = subjectTrigger.querySelector('.trigger-text');
          if (textEl) textEl.textContent = val;
          
          subjectDropdown.classList.remove('active');
          subjectMenu.classList.add('hidden');
        });
      });

      document.addEventListener('click', (e) => {
        if (subjectDropdown && !subjectDropdown.contains(e.target)) {
          subjectDropdown.classList.remove('active');
          subjectMenu.classList.add('hidden');
        }
      });
    }

    // 2. Custom Dropdown toggle logic: Request Type dropdown select
    const requestDropdown = document.getElementById('ticket-request-custom-dropdown');
    const requestMenu = document.getElementById('ticket-request-dropdown-menu');
    
    if (requestTrigger && requestDropdown && requestMenu) {
      requestTrigger.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        requestDropdown.classList.toggle('active');
        requestMenu.classList.toggle('hidden');
      });

      requestMenu.querySelectorAll('.custom-dropdown-item').forEach(opt => {
        opt.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const val = opt.getAttribute('data-value');
          if (requestInput) requestInput.value = val;
          
          const textEl = requestTrigger.querySelector('.trigger-text');
          if (textEl) textEl.textContent = val;
          
          requestDropdown.classList.remove('active');
          requestMenu.classList.add('hidden');
        });
      });

      document.addEventListener('click', (e) => {
        if (requestDropdown && !requestDropdown.contains(e.target)) {
          requestDropdown.classList.remove('active');
          requestMenu.classList.add('hidden');
        }
      });
    }

    // 3. File Chooser & Screenshot Attachment Base64 conversion
    const fileInput = document.getElementById('ticket-attachment');
    const fileTriggerBtn = document.getElementById('btn-ticket-file-trigger');
    const fileNameSpan = document.getElementById('ticket-file-name');
    const filePreviewBox = document.getElementById('ticket-file-preview');

    if (fileTriggerBtn && fileInput) {
      fileTriggerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileInput.click();
      });
    }

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) {
          selectedTicketAttachmentBase64 = null;
          if (fileNameSpan) fileNameSpan.textContent = "No file chosen";
          if (filePreviewBox) {
            filePreviewBox.innerHTML = '';
            filePreviewBox.classList.add('hidden');
          }
          return;
        }

        // File type validation (Images or PDF only)
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
          showPremiumToast("Invalid File Type", "Only images (JPEG, PNG, GIF, WEBP) and PDFs are allowed.", "error");
          fileInput.value = '';
          selectedTicketAttachmentBase64 = null;
          if (fileNameSpan) fileNameSpan.textContent = "No file chosen";
          if (filePreviewBox) {
            filePreviewBox.innerHTML = '';
            filePreviewBox.classList.add('hidden');
          }
          return;
        }

        // 10MB size validation limit
        if (file.size > 10 * 1024 * 1024) {
          showPremiumToast("File Excess Limit", "Maximum file attachment upload size is 10MB. Please optimize or upload a smaller screenshot.", "error");
          fileInput.value = '';
          selectedTicketAttachmentBase64 = null;
          if (fileNameSpan) fileNameSpan.textContent = "No file chosen";
          if (filePreviewBox) {
            filePreviewBox.innerHTML = '';
            filePreviewBox.classList.add('hidden');
          }
          return;
        }

        if (fileNameSpan) fileNameSpan.textContent = file.name;

        // Convert screenshot to base64 for database transmission
        const reader = new FileReader();
        reader.onload = (event) => {
          selectedTicketAttachmentBase64 = event.target.result;
          if (filePreviewBox) {
            if (file.type === 'application/pdf') {
              filePreviewBox.innerHTML = `<div class="pdf-preview-box" style="padding: 10px; color: var(--accent);"><span style="font-size: 1.5rem;">📄</span> PDF Document Attached</div>`;
            } else {
              filePreviewBox.innerHTML = `<img src="${selectedTicketAttachmentBase64}" class="preview-img-thumbnail" alt="Screenshot preview">`;
            }
            filePreviewBox.classList.remove('hidden');
          }
        };
        reader.readAsDataURL(file);
      });
    }

    // 4. Submit ticket form handler
    const ticketForm = document.getElementById('support-ticket-form');
    const ticketFormAlert = document.getElementById('ticket-form-alert');

    if (ticketForm) {
      ticketForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!state.user) {
          showPremiumToast("Authentication Error", "You must be logged in to submit support tickets.", "error");
          return;
        }

        const subjectVal = subjectInput ? subjectInput.value : '';
        const orderIdVal = document.getElementById('ticket-order-id').value.trim();
        const requestTypeVal = requestInput ? requestInput.value : '';
        const messageVal = document.getElementById('ticket-message').value.trim();

        if (!subjectVal || !requestTypeVal || !messageVal) {
          if (ticketFormAlert) {
            ticketFormAlert.textContent = "Please select Subject, Request Type and enter your Message.";
            ticketFormAlert.className = "order-status-alert error";
            ticketFormAlert.classList.remove('hidden');
          }
          return;
        }

        const submitBtn = document.getElementById('btn-submit-ticket');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.querySelector('span').textContent = 'Launching Ticket... 🎫';
        }

        try {
          const res = await request('/api/tickets/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subject: subjectVal,
              orderId: orderIdVal || null,
              requestType: requestTypeVal,
              message: messageVal,
              attachment: selectedTicketAttachmentBase64
            })
          });

          const data = await res.json();
          if (!res.ok) {
            if (ticketFormAlert) {
              ticketFormAlert.textContent = data.error || "Failed to submit ticket concern.";
              ticketFormAlert.className = "order-status-alert error";
              ticketFormAlert.classList.remove('hidden');
            }
            return;
          }

          showPremiumToast("Support Ticket Submitted", "🎉 Your ticket concern has been successfully registered! DeepSeek AI and our team are reviewing it.", "success");
          
          // Clear forms
          ticketForm.reset();
          selectedTicketAttachmentBase64 = null;
          if (subjectInput) subjectInput.value = '';
          if (requestInput) requestInput.value = '';
          
          const subTextEl = subjectTrigger.querySelector('.trigger-text');
          if (subTextEl) subTextEl.textContent = "Select Subject...";
          const reqTextEl = requestTrigger.querySelector('.trigger-text');
          if (reqTextEl) reqTextEl.textContent = "Select Request Type...";
          
          if (fileNameSpan) fileNameSpan.textContent = "No file chosen";
          if (filePreviewBox) {
            filePreviewBox.innerHTML = '';
            filePreviewBox.classList.add('hidden');
          }
          if (ticketFormAlert) ticketFormAlert.classList.add('hidden');

          // Reload user tickets list history!
          loadUserTickets();

        } catch (err) {
          console.error(err);
          showPremiumToast("Network Issue", "Could not submit ticket to server.", "error");
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.querySelector('span').textContent = 'Submit Support Ticket 🚀';
          }
        }
      });
    }

    // 5. Connect Real-time Chat Reply Form and Attachments in Chat Modal
    const chatCloseBtn = document.getElementById('btn-close-ticket-chat');
    const ticketChatOverlay = document.getElementById('ticket-chat-overlay');
    if (chatCloseBtn) {
      chatCloseBtn.addEventListener('click', () => {
        if (ticketChatOverlay) {
          ticketChatOverlay.classList.add('hidden');
          document.body.classList.remove('chat-modal-open'); // Remove class to restore widgets
          syncAppShellState();
        }
      });
    }
    if (ticketChatOverlay) {
      ticketChatOverlay.addEventListener('click', (e) => {
        if (e.target === ticketChatOverlay) {
          ticketChatOverlay.classList.add('hidden');
          document.body.classList.remove('chat-modal-open'); // Remove class to restore widgets
          syncAppShellState();
        }
      });
    }

    const chatFileInput = document.getElementById('chat-reply-attachment');
    const chatFilePreview = document.getElementById('chat-attachment-preview-area');
    const chatFileTip = document.getElementById('chat-attachment-filename-tip');
    let selectedChatReplyAttachmentBase64 = null;

    if (chatFileInput) {
      chatFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) {
          selectedChatReplyAttachmentBase64 = null;
          if (chatFileTip) {
            chatFileTip.textContent = "No file chosen";
            chatFileTip.classList.add('hidden');
          }
          if (chatFilePreview) {
            chatFilePreview.innerHTML = '';
            chatFilePreview.classList.add('hidden');
          }
          return;
        }

        if (file.size > 10 * 1024 * 1024) {
          showPremiumToast("File Limit Exceeded", "Maximum screenshot size is 10MB.", "error");
          chatFileInput.value = '';
          selectedChatReplyAttachmentBase64 = null;
          if (chatFileTip) {
            chatFileTip.textContent = "No file chosen";
            chatFileTip.classList.add('hidden');
          }
          if (chatFilePreview) {
            chatFilePreview.innerHTML = '';
            chatFilePreview.classList.add('hidden');
          }
          return;
        }

        if (chatFileTip) {
          chatFileTip.textContent = file.name;
          chatFileTip.classList.remove('hidden');
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          selectedChatReplyAttachmentBase64 = event.target.result;
          if (chatFilePreview) {
            let previewHTML = '';
            if (file.type === 'application/pdf') {
              previewHTML = `
                <div style="position: relative; display: inline-flex; align-items: center; gap: 8px; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 6px; padding: 6px 12px; height: 48px;">
                  <span style="font-size: 1.3rem;">📄</span>
                  <span style="font-size: 0.75rem; color: #fff; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${file.name}</span>
                  <button type="button" id="btn-remove-chat-attachment" style="position: absolute; top: -6px; right: -6px; height: 16px; width: 16px; border-radius: 50%; background: var(--danger); border: none; color: #fff; font-size: 0.6rem; display: flex; align-items: center; justify-content: center; cursor: pointer;">✕</button>
                </div>
              `;
            } else {
              previewHTML = `
                <div style="position: relative; display: inline-block;">
                  <img src="${selectedChatReplyAttachmentBase64}" alt="Attachment preview" style="height: 48px; width: 48px; object-fit: cover; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1);">
                  <button type="button" id="btn-remove-chat-attachment" style="position: absolute; top: -6px; right: -6px; height: 16px; width: 16px; border-radius: 50%; background: var(--danger); border: none; color: #fff; font-size: 0.6rem; display: flex; align-items: center; justify-content: center; cursor: pointer;">✕</button>
                </div>
              `;
            }
            chatFilePreview.innerHTML = previewHTML;
            chatFilePreview.classList.remove('hidden');

            const btnRemove = document.getElementById('btn-remove-chat-attachment');
            if (btnRemove) {
              btnRemove.addEventListener('click', (ev) => {
                ev.preventDefault();
                chatFileInput.value = '';
                selectedChatReplyAttachmentBase64 = null;
                if (chatFileTip) {
                  chatFileTip.textContent = "No file chosen";
                  chatFileTip.classList.add('hidden');
                }
                if (chatFilePreview) {
                  chatFilePreview.innerHTML = '';
                  chatFilePreview.classList.add('hidden');
                }
              });
            }
          }
        };
        reader.readAsDataURL(file);
      });
    }

    const chatReplyForm = document.getElementById('ticket-reply-form');
    if (chatReplyForm) {
      chatReplyForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const activeTicketId = document.getElementById('ticket-chat-overlay').getAttribute('data-active-ticket-id');
        if (!activeTicketId) return;

        const replyInput = document.getElementById('ticket-reply-message');
        const replyVal = replyInput ? replyInput.value.trim() : '';

        if (!replyVal) return;

        const submitBtn = chatReplyForm.querySelector('button[type="submit"]');
        let originalBtnHTML = '';
        if (submitBtn) {
          originalBtnHTML = submitBtn.innerHTML;
          submitBtn.disabled = true;
          submitBtn.innerHTML = `<span class="loading-spinner" style="display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-radius: 50%; border-top-color: #fff; animation: spin 0.8s linear infinite;"></span>`;
        }

        // Instantly append user bubble in UI
        const msgContainer = document.getElementById('ticket-chat-messages-container');
        if (msgContainer) {
          const row = document.createElement('div');
          row.className = 'chat-message-row user-row';
          row.innerHTML = `
            <div class="chat-message-avatar user-avatar">👤</div>
            <div class="chat-message-content">
              <div class="chat-bubble">
                <p>${replyVal}</p>
              </div>
              <div class="chat-bubble-meta">
                <strong>${state.user ? state.user.username : 'Customer'}</strong>
              </div>
            </div>
          `;
          msgContainer.appendChild(row);
          msgContainer.scrollTop = msgContainer.scrollHeight;
        }

        // Reset reply text field and attachment preview instantly
        if (replyInput) replyInput.value = '';
        const attachmentDataToSend = selectedChatReplyAttachmentBase64;

        if (chatFileInput) chatFileInput.value = '';
        selectedChatReplyAttachmentBase64 = null;
        if (chatFileTip) {
          chatFileTip.textContent = "No file chosen";
          chatFileTip.classList.add('hidden');
        }
        if (chatFilePreview) {
          chatFilePreview.innerHTML = '';
          chatFilePreview.classList.add('hidden');
        }

        // Show DeepSeek AI typing indicator
        const typingIndicator = document.getElementById('ticket-typing-indicator');
        if (typingIndicator) typingIndicator.classList.remove('hidden');
        if (msgContainer) msgContainer.scrollTop = msgContainer.scrollHeight;

        try {
          const res = await request('/api/tickets/reply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ticketId: activeTicketId,
              replyMessage: replyVal,
              attachment: attachmentDataToSend
            })
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Failed to post support ticket reply.");
          }

          // Simulate 1.2s typing indicator from DeepSeek AI to confirm receipt
          await new Promise(resolve => setTimeout(resolve, 1200));

          if (typingIndicator) typingIndicator.classList.add('hidden');

          const syncRes = await request('/api/tickets/user');
          if (syncRes.ok) {
            const tickets = await syncRes.json();
            const currentTicket = tickets.find(t => t.id === parseInt(activeTicketId));
            if (currentTicket) {
              renderChatMessages(currentTicket);
            }
          }

          loadUserTickets();

        } catch (err) {
          console.error(err);
          showPremiumToast("Transmission Error", err.message || "Failed to send chat message response.", "error");
          if (typingIndicator) typingIndicator.classList.add('hidden');
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHTML;
          }
        }
      });
    }
  }

  // Opens premium live chat modal with skeleton loading bubbles
  function openTicketChatModal(ticket) {
    const overlay = document.getElementById('ticket-chat-overlay');
    if (!overlay) return;

    document.body.classList.add('chat-modal-open'); // Hide floating widgets to prevent overlap
    overlay.setAttribute('data-active-ticket-id', ticket.id);

    const idEl = document.getElementById('chat-ticket-id');
    const subjectEl = document.getElementById('chat-ticket-subject');
    const badgeEl = document.getElementById('chat-ticket-status-badge');

    if (idEl) idEl.textContent = `Ticket #TC-${ticket.id}`;
    if (subjectEl) subjectEl.textContent = `${ticket.subject} · ${ticket.request_type}`;
    if (badgeEl) {
      badgeEl.textContent = (ticket.status || 'PENDING').toUpperCase();
      badgeEl.className = 'status-badge';
      let badgeClass = 'pending';
      const stat = (ticket.status || 'Pending').toLowerCase();
      if (stat === 'new' || stat === 'open') badgeClass = 'new';
      else if (stat === 'pending') badgeClass = 'pending';
      else if (stat === 'answered' || stat === 'done' || stat === 'approved') badgeClass = 'done';
      else if (stat === 'closed' || stat === 'rejected') badgeClass = 'rejected';
      badgeEl.classList.add(badgeClass);
    }

    const msgContainer = document.getElementById('ticket-chat-messages-container');
    if (msgContainer) {
      msgContainer.innerHTML = `
        <div class="chat-skeleton admin-skeleton">
          <div class="skeleton-avatar"></div>
          <div class="skeleton-bubble" style="width: 220px; height: 48px;"></div>
        </div>
        <div class="chat-skeleton user-skeleton">
          <div class="skeleton-avatar"></div>
          <div class="skeleton-bubble" style="width: 160px; height: 36px;"></div>
        </div>
        <div class="chat-skeleton admin-skeleton">
          <div class="skeleton-avatar"></div>
          <div class="skeleton-bubble" style="width: 260px; height: 58px;"></div>
        </div>
      `;
    }

    const attachmentPreview = document.getElementById('chat-attachment-preview-area');
    if (attachmentPreview) attachmentPreview.classList.add('hidden');

    const typingIndicator = document.getElementById('ticket-typing-indicator');
    if (typingIndicator) typingIndicator.classList.add('hidden');

    overlay.classList.remove('hidden');
    syncAppShellState();

    setTimeout(() => {
      renderChatMessages(ticket);
    }, 600);
  }

  // Helper to render chat message bubbles inside active modal
  function renderChatMessages(ticket) {
    const msgContainer = document.getElementById('ticket-chat-messages-container');
    if (!msgContainer) return;

    msgContainer.innerHTML = '';

    const lines = (ticket.message || '').split('\n\n');
    lines.forEach(line => {
      if (!line.trim()) return;

      const row = document.createElement('div');
      row.className = 'chat-message-row';

      let avatar = '👤';
      let senderName = 'You';
      let bubbleContent = line;
      let roleBadge = '';

      if (line.startsWith('[ADMIN REPLY]:')) {
        row.classList.add('admin-row');
        avatar = '🛡️';
        senderName = 'Admin Support';
        roleBadge = '<span class="status-badge done" style="font-size: 0.6rem; padding: 1px 4px; margin-left: 6px;">STAFF</span>';
        bubbleContent = line.replace('[ADMIN REPLY]:', '').trim();
      } else if (line.startsWith('[DeepSeek AI Support]:')) {
        row.classList.add('ai-row');
        avatar = '🤖';
        senderName = 'DeepSeek SMM AI';
        roleBadge = '<span class="status-badge new" style="font-size: 0.6rem; padding: 1px 4px; margin-left: 6px; background: rgba(20, 184, 166, 0.12); color: #14b8a6; border-color: rgba(20, 184, 166, 0.25);">AI ASSISTANT</span>';
        bubbleContent = line.replace('[DeepSeek AI Support]:', '').trim();
      } else {
        row.classList.add('user-row');
        avatar = '👤';
        senderName = state.user ? state.user.username : 'Customer';
        if (line.startsWith('[USER REPLY]:')) {
          bubbleContent = line.replace('[USER REPLY]:', '').trim();
        }
      }

      row.innerHTML = `
        <div class="chat-message-avatar ${row.classList.contains('user-row') ? 'user-avatar' : row.classList.contains('admin-row') ? 'admin-avatar' : 'ai-avatar'}">${avatar}</div>
        <div class="chat-message-content">
          <div class="chat-bubble">
            <p>${bubbleContent}</p>
          </div>
          <div class="chat-bubble-meta">
            <strong>${senderName}</strong>${roleBadge}
          </div>
        </div>
      `;
      msgContainer.appendChild(row);
    });

    if (ticket.attachment) {
      const attachRow = document.createElement('div');
      attachRow.className = 'chat-message-row user-row';
      
      const isPdf = ticket.attachment.startsWith('data:application/pdf') || ticket.attachment.toLowerCase().endsWith('.pdf');
      let attachmentHTML = '';
      
      if (isPdf) {
        attachmentHTML = `
          <div style="font-size: 0.72rem; color: var(--text-muted); margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
            <span>📎 Attached Proof PDF</span>
          </div>
          <a href="${ticket.attachment}" download="attachment.pdf" style="display: flex; align-items: center; gap: 8px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 8px; padding: 10px 14px; text-decoration: none; color: #fff; transition: background 0.2s; max-width: 250px;">
            <span style="font-size: 1.5rem;">📄</span>
            <div style="text-align: left;">
              <div style="font-size: 0.82rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 160px;">Download PDF</div>
              <div style="font-size: 0.68rem; color: var(--text-muted);">Click to save document</div>
            </div>
          </a>
        `;
      } else {
        attachmentHTML = `
          <div style="font-size: 0.72rem; color: var(--text-muted); margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
            <span>📎 Attached Proof Screenshot</span>
          </div>
          <img src="${ticket.attachment}" alt="Ticket Attachment" class="chat-attachment-img view-attachment-btn" data-img="${ticket.attachment.replace(/"/g, '&quot;')}" style="max-width: 200px; border-radius: 8px; cursor: pointer; border: 1px solid rgba(255,255,255,0.08); transition: opacity 0.2s;">
        `;
      }
      
      attachRow.innerHTML = `
        <div class="chat-message-avatar user-avatar">👤</div>
        <div class="chat-message-content">
          <div class="chat-bubble" style="padding: 8px; background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-color);">
            ${attachmentHTML}
          </div>
          <div class="chat-bubble-meta">
            <strong>${state.user ? state.user.username : 'Customer'}</strong>
          </div>
        </div>
      `;
      
      if (!isPdf) {
        const img = attachRow.querySelector('.chat-attachment-img');
        if (img) {
          img.addEventListener('click', () => {
            openScreenshotModal(ticket.attachment);
          });
        }
      }
      msgContainer.appendChild(attachRow);
    }

    msgContainer.scrollTop = msgContainer.scrollHeight;
  }

  // Renders the list of user tickets in #tickets-table-body
  async function loadUserTickets() {
    const tbody = document.getElementById('tickets-table-body');
    if (!tbody || !state.user) return;

    showTableSkeleton(tbody, 7);

    try {
      const res = await request('/api/tickets/user');
      if (!res.ok) throw new Error("Unsuccessful user tickets sync");
      const tickets = await res.json();

      if (!Array.isArray(tickets) || tickets.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No tickets submitted yet. If you have any concerns, submit above!</td></tr>`;
        return;
      }

      tbody.innerHTML = '';
      tickets.forEach(ticket => {
        const tr = document.createElement('tr');
        
        const formattedDate = new Date(ticket.created_at).toLocaleString(undefined, {
          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        let badgeClass = 'pending';
        const stat = (ticket.status || 'Pending').toLowerCase();
        if (stat === 'new' || stat === 'open') badgeClass = 'new';
        else if (stat === 'pending') badgeClass = 'pending';
        else if (stat === 'answered' || stat === 'done' || stat === 'approved') badgeClass = 'done';
        else if (stat === 'closed' || stat === 'rejected') badgeClass = 'rejected';

        const lines = (ticket.message || '').split('\n\n');

        tr.innerHTML = `
          <td data-label="Ticket ID"><strong>#TC-${ticket.id}</strong></td>
          <td data-label="Date"><span class="text-muted" style="font-size: 0.78rem;">${formattedDate}</span></td>
          <td data-label="Subject"><strong>${ticket.subject}</strong></td>
          <td data-label="Request Type"><span class="status-badge new" style="background: var(--primary-glow); border: 1px solid var(--border-color); color: var(--text-primary);">${ticket.request_type}</span></td>
          <td data-label="Order ID">${ticket.order_id ? `<code style="font-size: 0.78rem;">#${ticket.order_id}</code>` : '<span class="text-muted">—</span>'}</td>
          <td data-label="Status"><span class="status-badge ${badgeClass}">${ticket.status}</span></td>
          <td data-label="Actions">
            <button class="btn btn-secondary btn-sm toggle-transcript-btn">
              💬 Show Chat (${lines.length})
            </button>
          </td>
        `;

        tr.querySelector('.toggle-transcript-btn').addEventListener('click', (e) => {
          openTicketChatModal(ticket);
        });

        tbody.appendChild(tr);
      });

    } catch (err) {
      console.error(err);
      tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="color: var(--danger); padding: 20px;">❌ Failed to synchronize ticket desk.</td></tr>`;
    }
  }

  // Opens a custom premium overlay popup of the screenshot file
  function openScreenshotModal(base64Image) {
    if (!customAlertOverlay || !toastModalCard) return;
    
    // Create preview layout inside modal ok alert
    toastModalIcon.innerHTML = '🖼️';
    toastModalIcon.style.color = 'var(--primary)';
    toastModalIcon.style.borderColor = 'rgba(59, 130, 246, 0.2)';
    toastModalIcon.style.background = 'rgba(59, 130, 246, 0.1)';
    
    toastModalTitle.textContent = "Screenshot Proof Attachment";
    toastModalDesc.innerHTML = `
      <div class="screenshot-preview-modal-body" style="margin-top: 10px;">
        <img src="${base64Image}" alt="Screenshot Proof" style="max-width: 100%; border-radius: 6px; max-height: 50vh; object-fit: contain; border: 1px solid rgba(255,255,255,0.1);">
      </div>
    `;
    
    receiptModalCard.classList.add('hidden');
    toastModalCard.classList.remove('hidden');
    customAlertOverlay.classList.remove('hidden');
    customAlertOverlay.classList.add('active');
    syncAppShellState();
  }

  // Admin Tickets Queue renderer
  async function loadAdminTicketsQueue() {
    const tbody = document.getElementById('admin-tickets-tbody');
    if (!tbody || !state.user || (state.user.role !== 'admin' && state.user.role !== 'super_admin')) return;

    showTableSkeleton(tbody, 8);

    try {
      const res = await request('/api/admin/tickets');
      if (!res.ok) throw new Error("Search request failed");
      const tickets = await res.json();

      // Count metrics
      let newCount = 0;
      let pendingCount = 0;
      tickets.forEach(ticket => {
        const stat = (ticket.status || 'Pending').toLowerCase();
        if (stat === 'new') newCount++;
        else if (stat === 'pending') pendingCount++;
      });
      const resolvedCount = state.sessionResolvedTicketsCount || 0;

      // Update metrics badges in DOM
      const countNewEl = document.getElementById('admin-count-new');
      const countPendingEl = document.getElementById('admin-count-pending');
      const countResolvedEl = document.getElementById('admin-count-resolved');
      if (countNewEl) countNewEl.textContent = newCount;
      if (countPendingEl) countPendingEl.textContent = pendingCount;
      if (countResolvedEl) countResolvedEl.textContent = resolvedCount;

      if (!Array.isArray(tickets) || tickets.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted" style="color: var(--success); font-weight: 600;">No active incoming tickets. All clear! 🌴</td></tr>`;
        return;
      }

      tbody.innerHTML = '';
      tickets.forEach(ticket => {
        const tr = document.createElement('tr');
        
        const formattedDate = new Date(ticket.created_at).toLocaleString(undefined, {
          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        let badgeClass = 'pending';
        const stat = (ticket.status || 'Pending').toLowerCase();
        if (stat === 'new' || stat === 'open') badgeClass = 'new';
        else if (stat === 'pending') badgeClass = 'pending';
        else if (stat === 'answered' || stat === 'done' || stat === 'approved') badgeClass = 'done';
        else if (stat === 'closed' || stat === 'rejected') badgeClass = 'rejected';

        // Split messages to isolate original user description
        const cleanMsg = ticket.message.split('\n\n[ADMIN REPLY]')[0].split('\n\n[DeepSeek AI Support]')[0];

        // Attachment link html
        let attachmentHtml = '<span class="text-muted">None</span>';
        if (ticket.attachment) {
          attachmentHtml = `
            <button class="ticket-thumbnail-btn view-admin-attach-btn" data-img="${ticket.attachment.replace(/"/g, '&quot;')}">
              📎 Screenshot
            </button>
          `;
        }

        tr.innerHTML = `
          <td><strong>#TC-${ticket.id}</strong></td>
          <td>
            <div style="font-size: 0.82rem; font-weight: bold; color: var(--text-primary);">${ticket.username}</div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">${ticket.email}</div>
          </td>
          <td><strong>${ticket.subject}</strong></td>
          <td><span class="status-badge new" style="background: var(--primary-glow); border: 1px solid var(--border-color); color: var(--text-primary);">${ticket.request_type}</span></td>
          <td>${ticket.order_id ? `<code style="font-size: 0.78rem;">#${ticket.order_id}</code>` : '<span class="text-muted">—</span>'}</td>
          <td><span class="text-muted" style="font-size: 0.78rem">${formattedDate}</span></td>
          <td>
            <div style="font-size: 0.8rem; line-height: 1.35; color: var(--text-secondary); max-width: 220px; white-space: normal; word-break: break-all; margin-bottom: 8px;">
              "${cleanMsg}"
            </div>
            ${attachmentHtml}
          </td>
          <td>
            <div style="display: flex; flex-direction: column; gap: 8px; min-width: 240px; margin-top: 5px;">
              <textarea class="search-input admin-reply-text" rows="2" placeholder="Write reply to customer..." style="margin-bottom: 0; padding: 6px; font-size: 0.82rem; height: 50px; background: var(--input-bg); color: var(--text-primary); border:1px solid var(--border-color);" id="admin-reply-box-${ticket.id}"></textarea>
              <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                <button class="btn btn-primary btn-sm btn-admin-ticket-act" data-id="${ticket.id}" data-action="Approved" style="background: var(--success); box-shadow: 0 0 10px rgba(16,185,129,0.3);">Approved</button>
                <button class="btn btn-secondary btn-sm btn-admin-ticket-act" data-id="${ticket.id}" data-action="Rejected" style="background: var(--danger); border-color:transparent; color:#fff; box-shadow: 0 0 10px rgba(239,68,68,0.3);">Rejected</button>
                <button class="btn btn-secondary btn-sm btn-admin-ticket-act" data-id="${ticket.id}" data-action="Done" style="background: var(--bg-glass); color: var(--text-primary); border-color:var(--border-color);">Done / Resolved</button>
              </div>
            </div>
          </td>
        `;

        // Bind attachment click
        const viewAttachBtn = tr.querySelector('.view-admin-attach-btn');
        if (viewAttachBtn) {
          viewAttachBtn.addEventListener('click', () => {
            const base64 = viewAttachBtn.getAttribute('data-img');
            openScreenshotModal(base64);
          });
        }

        // Bind admin ticket action button clicks
        tr.querySelectorAll('.btn-admin-ticket-act').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const tId = btn.getAttribute('data-id');
            const act = btn.getAttribute('data-action');
            const replyTextarea = document.getElementById(`admin-reply-box-${tId}`);
            const replyVal = replyTextarea ? replyTextarea.value.trim() : '';

            btn.disabled = true;
            btn.textContent = 'Updating...';

            try {
              const res = await request('/api/admin/tickets/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ticketId: tId,
                  newStatus: act,
                  adminReply: replyVal || null
                })
              });

              const data = await res.json();
              if (!res.ok) {
                alert(data.error || "Failed to update ticket action.");
                btn.disabled = false;
                btn.textContent = act;
                return;
              }

              showPremiumToast(
                "Ticket Updated",
                `Ticket #${tId} has been successfully updated to status: "${act}" and DeepSeek AI notification has been sent!`,
                "success"
              );

              if (act === 'Done' || act === 'Approved' || act === 'Rejected') {
                state.sessionResolvedTicketsCount = (state.sessionResolvedTicketsCount || 0) + 1;
              }

              // Instantly reload admin tickets queue so solved/resolved tickets disappear from admin table!
              loadAdminTicketsQueue();

            } catch (err) {
              console.error(err);
              alert("Connection error executing ticket update.");
              btn.disabled = false;
              btn.textContent = act;
            }
          });
        });

        tbody.appendChild(tr);
      });

    } catch (err) {
      console.error(err);
      tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="color: var(--danger); padding: 20px;">❌ Connection error loading active tickets.</td></tr>`;
    }
  }

  // --- TRIGGER BOOTSTRAP ---
  initializeApp();

  // --- PREMIUM UPGRADES: CONFETTI EMITTER & AUTOCOMPLETE HIGHLIGHT SELECTION ---
  function selectServiceFromSearch(s) {
    if (!s) return;
    
    // 1. Select the correct platform tab based on category platform
    const platform = getPlatformFromCategory(s.category);
    if (orderPlatformTabs) {
      const platformTab = orderPlatformTabs.querySelector(`.platform-tab[data-platform="${platform}"]`) ||
                          orderPlatformTabs.querySelector(`.platform-tab[data-platform="all"]`);
      if (platformTab) {
        orderPlatformTabs.querySelectorAll('.platform-tab').forEach(t => t.classList.remove('active'));
        platformTab.classList.add('active');
        state.selectedOrderPlatform = platformTab.getAttribute('data-platform');
      }
    }
    
    // 2. Populate category and service selectors
    populateNewOrderDropdowns();
    
    // 3. Set category select value
    orderCategorySelect.value = s.category;
    orderCategorySelect.dispatchEvent(new Event('change'));
    
    // 4. Set service select value
    orderServiceSelect.value = s.service;
    orderServiceSelect.dispatchEvent(new Event('change'));
    
    // 5. Sync premium custom dropdown visual triggers
    updateCustomDropdownTriggerText();
    updateCustomPackageTriggerText();
    
    // 6. Close search popover
    const searchMenu = document.getElementById('search-autocomplete-menu');
    if (searchMenu) {
      searchMenu.classList.add('hidden');
    }
  }

  function triggerApexConfetti() {
    const canvas = document.getElementById('apex-confetti-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    
    const colors = ['#f97316', '#38bdf8', '#10b981', '#a855f7', '#f43f5e', '#eab308'];
    const particles = [];
    const particleCount = 120;
    
    class ConfettiParticle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = -10 - Math.random() * 20;
        this.size = Math.random() * 8 + 6;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.speedX = Math.random() * 4 - 2;
        this.speedY = Math.random() * 5 + 4;
        this.rotation = Math.random() * 360;
        this.rotationSpeed = Math.random() * 4 - 2;
      }
      
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.rotation += this.rotationSpeed;
        this.speedX += Math.sin(this.y / 30) * 0.05;
      }
      
      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.rotation * Math.PI) / 180);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        ctx.restore();
      }
    }
    
    for (let i = 0; i < particleCount; i++) {
      particles.push(new ConfettiParticle());
    }
    
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      let active = false;
      particles.forEach(p => {
        p.update();
        p.draw();
        if (p.y < canvas.height) {
          active = true;
        }
      });
      
      if (active) {
        requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        window.removeEventListener('resize', handleResize);
      }
    }
    
    animate();
  }

  // ==========================================================================
  // SUPER ADMIN PANEL CONTROLLERS
  // ==========================================================================

  // Stores full users list for client-side filtering
  let allAdminUsersList = [];

  // Load and render the Super Admin Markup Editor card and Live Analytics
  async function loadSuperAdminSettings() {
    const card = document.getElementById('super-admin-settings-card');
    const analyticsCard = document.getElementById('super-admin-analytics-card');
    const financeCard = document.getElementById('finance-roi-dashboard-card');
    if (!card) return;

    // Show analytics card to both standard admin and super_admin
    const isAdminUser = state.user && (state.user.role === 'admin' || state.user.role === 'super_admin');
    if (!isAdminUser) {
      card.classList.add('hidden');
      if (analyticsCard) analyticsCard.classList.add('hidden');
      if (financeCard) financeCard.classList.add('hidden');
      return;
    }

    if (analyticsCard) {
      analyticsCard.classList.remove('hidden');
      loadSuperAdminAnalytics();
    }
    if (financeCard) {
      financeCard.classList.remove('hidden');
      bindFinanceDashboardControls();
      loadFinanceDashboard();
    }

    // Markup editor card is strictly visible to super_admin
    if (state.user.role !== 'super_admin') {
      card.classList.add('hidden');
      return;
    }
    card.classList.remove('hidden');

    const markupInput = document.getElementById('super-admin-markup-input');
    const saveBtn = document.getElementById('super-admin-save-markup-btn');
    if (!markupInput || !saveBtn) return;

    // Fetch current markup from server
    try {
      const res = await request('/api/admin/global-markup');
      if (res.ok) {
        const data = await res.json();
        markupInput.value = parseFloat(data.markupPercent || data.markup || 250).toFixed(0);
      }
    } catch (e) {
      console.warn('Could not fetch current markup:', e);
    }

    // Remove any previous listener by cloning button
    const freshBtn = saveBtn.cloneNode(true);
    saveBtn.parentNode.replaceChild(freshBtn, saveBtn);

    freshBtn.addEventListener('click', async () => {
      const val = parseFloat(document.getElementById('super-admin-markup-input').value);
      if (isNaN(val) || val < 0) {
        showPremiumToast('Invalid Markup', 'Please enter a valid markup percentage (minimum 0).', 'error');
        return;
      }
      freshBtn.disabled = true;
      freshBtn.textContent = '⏳ Saving...';
      try {
        const res = await request('/api/admin/global-markup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ markup: val })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showPremiumToast('Markup Saved Successfully', `Global markup updated to ${val.toFixed(0)}%. All prices recalculated.`, 'success');
          // Instantly sync services list to display new pricing to users!
          syncServicesList();
        } else {
          showPremiumToast('Markup Update Failed', data.error || 'Failed to save markup.', 'error');
        }
      } catch (err) {
        showPremiumToast('Network Error', 'Could not reach server to save markup.', 'error');
      } finally {
        freshBtn.disabled = false;
        freshBtn.textContent = 'Save Markup 💾';
      }
    });

    // Maintenance Mode Toggle Loader and Event Binder
    const maintenanceBtn = document.getElementById('super-admin-maintenance-btn');
    if (maintenanceBtn) {
      let isMaintenanceActive = false;

      const updateMaintenanceBtnUI = (active) => {
        isMaintenanceActive = active;
        if (active) {
          maintenanceBtn.textContent = 'Disable Maintenance 🛠️';
          maintenanceBtn.className = 'btn btn-primary';
          maintenanceBtn.style.borderColor = 'rgba(16, 185, 129, 0.4)';
          maintenanceBtn.style.color = '#10b981';
          maintenanceBtn.style.background = 'rgba(16, 185, 129, 0.1)';
        } else {
          maintenanceBtn.textContent = 'Enable Maintenance 🛠️';
          maintenanceBtn.className = 'btn btn-secondary';
          maintenanceBtn.style.borderColor = 'rgba(239, 68, 68, 0.4)';
          maintenanceBtn.style.color = '#f87171';
          maintenanceBtn.style.background = 'transparent';
        }
      };

      // Fetch current status
      try {
        const maintRes = await request('/api/admin/maintenance');
        if (maintRes.ok) {
          const maintData = await maintRes.json();
          updateMaintenanceBtnUI(!!maintData.maintenanceMode);
        }
      } catch (e) {
        console.warn('Could not fetch maintenance status:', e);
      }

      // Clone button to strip old listeners
      const freshMaintBtn = maintenanceBtn.cloneNode(true);
      maintenanceBtn.parentNode.replaceChild(freshMaintBtn, maintenanceBtn);

      freshMaintBtn.addEventListener('click', async () => {
        const nextState = !isMaintenanceActive;
        freshMaintBtn.disabled = true;
        freshMaintBtn.textContent = nextState ? '⏳ Enabling...' : '⏳ Disabling...';

        try {
          const maintPostRes = await request('/api/admin/maintenance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ maintenanceMode: nextState })
          });
          const maintPostData = await maintPostRes.json();
          if (maintPostRes.ok && maintPostData.success) {
            updateMaintenanceBtnUI(nextState);
            showPremiumToast(
              nextState ? 'Maintenance Mode Enabled' : 'Maintenance Mode Disabled',
              nextState ? 'Standard users are now blocked from placing new SMM orders.' : 'Standard order placements are now fully restored.',
              nextState ? 'warning' : 'success'
            );
            // Instantly toggle the main header banner locally
            const banner = document.getElementById('maintenance-banner');
            if (banner) {
              if (nextState) banner.classList.remove('hidden');
              else banner.classList.add('hidden');
            }
          } else {
            showPremiumToast('Action Failed', maintPostData.error || 'Failed to toggle maintenance mode.', 'error');
            updateMaintenanceBtnUI(isMaintenanceActive); // revert
          }
        } catch (err) {
          showPremiumToast('Network Error', 'Could not reach server to toggle maintenance mode.', 'error');
          updateMaintenanceBtnUI(isMaintenanceActive); // revert
        } finally {
          freshMaintBtn.disabled = false;
        }
      });
    }
  }

  function formatPhp(value) {
    const numeric = parseFloat(value) || 0;
    return `₱${numeric.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function formatPercent(value) {
    const numeric = parseFloat(value) || 0;
    return `${numeric.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function renderFinanceRows(tbodyId, rows, columns) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    if (!Array.isArray(rows) || rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="${columns.length}" class="text-center text-muted">No finance data for this filter yet.</td></tr>`;
      return;
    }
    tbody.innerHTML = rows.slice(0, 10).map(row => `
      <tr>
        ${columns.map(col => `<td>${col(row)}</td>`).join('')}
      </tr>
    `).join('');
  }

  function bindFinanceDashboardControls() {
    const filter = document.getElementById('finance-range-filter');
    const exportBtn = document.getElementById('finance-export-csv-btn');
    if (filter && !filter.dataset.listenerAttached) {
      filter.dataset.listenerAttached = 'true';
      filter.addEventListener('change', () => loadFinanceDashboard());
    }
    if (exportBtn && !exportBtn.dataset.listenerAttached) {
      exportBtn.dataset.listenerAttached = 'true';
      exportBtn.addEventListener('click', () => {
        const range = filter ? filter.value : 'this_month';
        window.open(`/api/admin/finance/export.csv?range=${encodeURIComponent(range)}&key=${encodeURIComponent(getAuthToken())}`, '_blank');
      });
    }
  }

  async function loadFinanceDashboard() {
    const filter = document.getElementById('finance-range-filter');
    const range = filter ? filter.value : 'this_month';
    try {
      const res = await request(`/api/admin/finance/summary?range=${encodeURIComponent(range)}`);
      if (!res.ok) throw new Error('Finance dashboard failed to load.');
      const data = await res.json();
      const today = data.today || {};
      const month = data.month || {};
      const total = data.summary || {};

      setText('finance-today-sales', formatPhp(today.grossSales));
      setText('finance-today-cost', formatPhp(today.apiCost));
      setText('finance-today-profit', formatPhp(today.netProfit));
      setText('finance-today-roi', formatPercent(today.roiPercent));
      setText('finance-month-sales', formatPhp(month.grossSales));
      setText('finance-month-cost', formatPhp(month.apiCost));
      setText('finance-month-profit', formatPhp(month.netProfit));
      setText('finance-month-roi', formatPercent(month.roiPercent));
      setText('finance-total-sales', formatPhp(total.grossSales));
      setText('finance-total-cost', formatPhp(total.apiCost));
      setText('finance-total-profit', formatPhp(total.netProfit));
      setText('finance-total-roi', formatPercent(total.roiPercent));

      renderFinanceRows('finance-service-tbody', data.byService || [], [
        row => escapeHtml(String(row.key || 'Service')),
        row => formatPhp(row.grossSales),
        row => formatPhp(row.netProfit),
        row => formatPercent(row.roiPercent)
      ]);
      renderFinanceRows('finance-daily-tbody', data.daily || [], [
        row => escapeHtml(String(row.key || 'Date')),
        row => formatPhp(row.grossSales),
        row => formatPhp(row.apiCost),
        row => formatPhp(row.netProfit)
      ]);
    } catch (error) {
      showPremiumToast('Finance Dashboard Error', error.message || 'Unable to load ROI data.', 'error');
    }
  }

  // Load all registered users into the User Directory table
  async function loadAdminUsersList() {
    const tbody = document.getElementById('admin-users-list-tbody');
    const card = document.getElementById('admin-all-users-card');
    if (!tbody || !card) return;
    if (!state.user || (state.user.role !== 'admin' && state.user.role !== 'super_admin')) {
      card.classList.add('hidden');
      return;
    }
    card.classList.remove('hidden');

    showTableSkeleton(tbody, 6);

    // Wire up search filter (once)
    const searchInput = document.getElementById('admin-users-list-search');
    const reloadBtn = document.getElementById('admin-reload-users-btn');
    if (searchInput && !searchInput.dataset.listenerAttached) {
      searchInput.dataset.listenerAttached = 'true';
      searchInput.addEventListener('input', () => filterAdminUsersList(searchInput.value));
    }
    if (reloadBtn && !reloadBtn.dataset.listenerAttached) {
      reloadBtn.dataset.listenerAttached = 'true';
      reloadBtn.addEventListener('click', () => {
        delete document.getElementById('admin-users-list-search')?.dataset.listenerAttached;
        delete reloadBtn.dataset.listenerAttached;
        allAdminUsersList = [];
        loadAdminUsersList();
      });
    }

    try {
      const res = await request('/api/admin/users/all');
      if (!res.ok) throw new Error('Failed to load users list.');
      allAdminUsersList = await res.json();
      renderAdminUsersTable(allAdminUsersList);
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="color: var(--danger); padding: 20px;">❌ ${err.message}</td></tr>`;
    }
  }

  // Filter the user directory table by search query
  function filterAdminUsersList(query) {
    if (!allAdminUsersList.length) return;
    const q = (query || '').toLowerCase().trim();
    const filtered = q
      ? allAdminUsersList.filter(u =>
          (u.username || '').toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q)
        )
      : allAdminUsersList;
    renderAdminUsersTable(filtered);
  }

  // Renders the user directory table rows
  function renderAdminUsersTable(users) {
    const tbody = document.getElementById('admin-users-list-tbody');
    if (!tbody) return;

    if (!users || users.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">No users found.</td></tr>`;
      return;
    }

    const isSuperAdmin = state.user && state.user.role === 'super_admin';

    tbody.innerHTML = users.map(u => {
      const roleLabel = u.role === 'super_admin' ? '👑 Super Admin' : u.role === 'admin' ? '🛡️ Admin' : '👤 User';
      const roleBadgeColor = u.role === 'super_admin' ? 'var(--accent)' : u.role === 'admin' ? 'var(--primary)' : 'var(--text-muted)';

      const roleSelector = isSuperAdmin
        ? `<select class="search-input" style="padding: 6px 10px; font-size: 0.8rem; margin: 0;" onchange="window._changeUserRole(${u.id}, this.value)">
            <option value="user" ${u.role === 'user' ? 'selected' : ''}>👤 User</option>
            <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>🛡️ Admin</option>
            <option value="super_admin" ${u.role === 'super_admin' ? 'selected' : ''}>👑 Super Admin</option>
           </select>`
        : `<span style="color: ${roleBadgeColor}; font-size: 0.8rem;">${roleLabel}</span>`;

      return `<tr>
        <td style="font-size:0.8rem; color: var(--text-muted);">#${u.id}</td>
        <td>
          <div style="font-weight:600; font-size:0.88rem;">${escapeHtml(u.username || '—')}</div>
          <div style="font-size:0.78rem; color:var(--text-muted);">${escapeHtml(u.email || '—')}</div>
        </td>
        <td style="font-weight:700; color:var(--success);">₱${parseFloat(u.balance || 0).toFixed(2)}</td>
        <td><span style="color:${roleBadgeColor}; font-size:0.82rem; font-weight:600;">${roleLabel}</span></td>
        <td>
          <div style="display:flex; gap:6px; align-items:center;">
            <input type="number" id="balance-override-${u.id}" placeholder="₱0.00" step="0.01" min="0"
              style="width:110px; padding:6px 10px; font-size:0.8rem; margin:0;"
              class="search-input">
            <button class="btn btn-primary btn-sm" style="font-size:0.75rem; padding:6px 10px; white-space:nowrap;"
              onclick="window._setUserBalance(${u.id}, '${escapeHtml(u.email)}')">Set ✔</button>
          </div>
        </td>
        <td>${roleSelector}</td>
      </tr>`;
    }).join('');
  }

  // Helper: escape HTML to prevent XSS in table rendering
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Global handlers for inline onclick in table rows
  window._setUserBalance = async function(userId, userEmail) {
    const input = document.getElementById(`balance-override-${userId}`);
    if (!input) return;
    const val = parseFloat(input.value);
    if (isNaN(val) || val < 0) {
      showPremiumToast('Invalid Balance Amount', 'Enter a valid balance amount (≥ 0).', 'error');
      return;
    }
    try {
      const res = await request('/api/admin/set-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId, balance: val })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showPremiumToast('Balance Updated Successfully', `Balance for ${userEmail} set to ₱${val.toFixed(2)}`, 'success');
        input.value = '';
        // Update in-memory list
        const user = allAdminUsersList.find(u => u.id === userId);
        if (user) user.balance = val;
        renderAdminUsersTable(allAdminUsersList);
      } else {
        showPremiumToast('Balance Override Failed', data.error || 'Failed to set balance.', 'error');
      }
    } catch (err) {
      showPremiumToast('Network Error', 'Could not reach server to update user balance.', 'error');
    }
  };

  window._changeUserRole = async function(userId, newRole) {
    if (!state.user || state.user.role !== 'super_admin') {
      showPremiumToast('Permission Denied', 'Only Super Admins can change user roles.', 'error');
      return;
    }
    try {
      const res = await request('/api/admin/change-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId, newRole })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showPremiumToast('Role Promoted Successfully', `Role updated to "${newRole}" for user #${userId}`, 'success');
        const user = allAdminUsersList.find(u => u.id === userId);
        if (user) user.role = newRole;
        renderAdminUsersTable(allAdminUsersList);
      } else {
        showPremiumToast('Role Promotion Failed', data.error || 'Role change failed.', 'error');
      }
    } catch (err) {
      showPremiumToast('Network Error', 'Could not reach server to update role.', 'error');
    }
  };

  // Load GCash / Manual Deposits Verification Queue
  async function loadAdminDepositsQueue() {
    const tbody = document.getElementById('admin-deposits-queue-tbody');
    const card = document.getElementById('admin-deposits-queue-card');
    if (!tbody || !card) return;
    if (!state.user || (state.user.role !== 'admin' && state.user.role !== 'super_admin')) {
      card.classList.add('hidden');
      return;
    }
    card.classList.remove('hidden');

    showTableSkeleton(tbody, 7);

    try {
      const res = await request('/api/admin/deposits/pending');
      if (!res.ok) throw new Error('Failed to load deposits queue.');
      const deposits = await res.json();

      if (!Array.isArray(deposits) || deposits.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4" style="color:var(--success); font-weight:600; padding:20px;">No pending deposit requests. All clear! 🌴</td></tr>`;
        return;
      }

      tbody.innerHTML = deposits.map(d => {
        const date = d.createdAt ? new Date(d.createdAt).toLocaleString('en-PH', { dateStyle: 'short', timeStyle: 'short' }) : '—';
        const method = String(d.paymentMethod || 'GCash').toUpperCase();
        const refId = String(d.referenceId || '').trim();
        let refWarning = '';

        if (method.includes('GCASH')) {
          if (!/^\d{13}$/.test(refId)) {
            refWarning = `<div style="font-size:0.68rem; color:var(--danger); margin-top:3px; font-weight:700;">⚠️ Format Warning (GCash expects 13 digits)</div>`;
          }
        } else if (method.includes('MAYA') || method.includes('PAYMAYA')) {
          if (!/^[a-zA-Z0-9]{10,16}$/.test(refId)) {
            refWarning = `<div style="font-size:0.68rem; color:var(--danger); margin-top:3px; font-weight:700;">⚠️ Format Warning (Maya expects 10-16 alphanumeric chars)</div>`;
          }
        }
        
        const suspicious = ['12345', '00000', '11111', 'abcde', 'test'];
        if (suspicious.some(p => refId.toLowerCase().includes(p))) {
          refWarning += `<div style="font-size:0.68rem; color:var(--warning); margin-top:3px; font-weight:700;">⚠️ Suspicious Pattern Warning</div>`;
        }

        return `<tr>
          <td style="font-size:0.8rem; color:var(--text-muted);">#${d.id}</td>
          <td>
            <div style="font-weight:600; font-size:0.85rem;">${escapeHtml(d.username || '—')}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">${escapeHtml(d.email || '—')}</div>
          </td>
          <td style="font-size:0.85rem;">${escapeHtml(d.paymentMethod || 'GCash')}</td>
          <td style="font-weight:700; color:var(--success);">₱${parseFloat(d.amount || 0).toFixed(2)}</td>
          <td style="font-size:0.82rem; font-family:monospace;">
            ${escapeHtml(d.referenceId || '—')}
            ${refWarning}
          </td>
          <td style="font-size:0.78rem; color:var(--text-muted);">${date}</td>
          <td>
            <div style="display:flex; gap:6px;">
              <button class="btn btn-primary btn-sm" style="background:var(--success); border-color:transparent; font-size:0.78rem; padding:5px 12px;"
                onclick="window._actionDeposit(${d.id}, 'approve', this)">✅ Approve</button>
              <button class="btn btn-secondary btn-sm" style="background:var(--danger); border-color:transparent; font-size:0.78rem; padding:5px 12px; color:#fff;"
                onclick="window._actionDeposit(${d.id}, 'reject', this)">❌ Reject</button>
            </div>
          </td>
        </tr>`;
      }).join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="color:var(--danger); padding:20px;">❌ ${err.message}</td></tr>`;
    }
  }

  // Global handler: Approve or Reject a deposit
  window._actionDeposit = async function(depositId, action, btn) {
    if (btn) { btn.disabled = true; btn.textContent = '⏳'; }
    try {
      const res = await request('/api/admin/deposits/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ depositId, action })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const label = action === 'approve' ? 'Approved' : 'Rejected';
        showPremiumToast('GCash Deposit Queue Updated', `Successfully ${label} deposit #${depositId}!`, 'success');
        // Reload the queue to reflect updated state
        loadAdminDepositsQueue();
      } else {
        showPremiumToast('Queue Action Failed', data.error || 'Action failed.', 'error');
        if (btn) { btn.disabled = false; btn.textContent = action === 'approve' ? '✅ Approve' : '❌ Reject'; }
      }
    } catch (err) {
      showPremiumToast('Network Error', 'Could not reach server to process GCash verification.', 'error');
      if (btn) { btn.disabled = false; btn.textContent = action === 'approve' ? '✅ Approve' : '❌ Reject'; }
    }
  };

  // Load and display Super Admin live revenue and net profit statistics
  async function loadSuperAdminAnalytics() {
    const totalDepositsEl = document.getElementById('super-admin-total-deposits');
    const totalExpensesEl = document.getElementById('super-admin-total-expenses');
    const totalProfitEl = document.getElementById('super-admin-total-profit');
    const markupDescEl = document.getElementById('super-admin-profit-markup-desc');
    
    if (!totalDepositsEl || !totalExpensesEl || !totalProfitEl) return;
    
    try {
      const res = await request('/api/admin/analytics/stats');
      if (res.ok) {
        const data = await res.json();
        const revenue = parseFloat(data.totalRevenue) || 0;
        const expenses = parseFloat(data.apiCost) || 0;
        const profit = parseFloat(data.netProfit) || 0;
        const markupPercent = parseFloat(data.markupPercent) || 250;
        
        totalDepositsEl.textContent = `₱${revenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        totalExpensesEl.textContent = `₱${expenses.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        totalProfitEl.textContent = `₱${profit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        
        if (markupDescEl) {
          markupDescEl.textContent = `Profit based on current ${markupPercent.toFixed(0)}% markup snapshots`;
        }
      }
    } catch (e) {
      console.warn("Could not load admin stats:", e);
    }
  }

  // Floating support agent FAB panel toggle
  function initSupportAgentWidget() {
    const agentFab = document.getElementById('agent-fab');
    const expandedCard = document.getElementById('agent-expanded-card');
    const openTicketBtn = document.getElementById('agent-open-ticket-btn');
    
    if (agentFab && expandedCard) {
      agentFab.addEventListener('click', (e) => {
        e.stopPropagation();
        if (expandedCard.classList.contains('hidden')) {
          expandedCard.classList.remove('hidden');
          setTimeout(() => {
            expandedCard.style.transform = 'translateY(0)';
            expandedCard.style.opacity = '1';
          }, 10);
        } else {
          expandedCard.style.transform = 'translateY(10px)';
          expandedCard.style.opacity = '0';
          setTimeout(() => {
            expandedCard.classList.add('hidden');
          }, 300);
        }
      });
      
      // Close on clicking outside
      document.addEventListener('click', (e) => {
        if (!agentFab.contains(e.target) && !expandedCard.contains(e.target)) {
          if (!expandedCard.classList.contains('hidden')) {
            expandedCard.style.transform = 'translateY(10px)';
            expandedCard.style.opacity = '0';
            setTimeout(() => {
              expandedCard.classList.add('hidden');
            }, 300);
          }
        }
      });
    }
    
    if (openTicketBtn) {
      openTicketBtn.addEventListener('click', () => {
        switchTab('support-tickets');
        if (expandedCard) {
          expandedCard.style.transform = 'translateY(10px)';
          expandedCard.style.opacity = '0';
          setTimeout(() => expandedCard.classList.add('hidden'), 300);
        }
      });
    }
  }

  // --- CAMPAIGN SVG ANALYTICS CHART RENDERER ---
  function renderCampaignAnalytics() {
    const svg = document.getElementById('campaign-analytics-svg');
    if (!svg) return;

    // Clear previous SVG contents except defs
    svg.innerHTML = '';

    // Create defs dynamically
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    defs.innerHTML = `
      <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--primary)" stop-opacity="0.35"></stop>
        <stop offset="100%" stop-color="var(--primary)" stop-opacity="0.0"></stop>
      </linearGradient>
    `;
    svg.appendChild(defs);

    // Initialize 7 days range (local time)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const date = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${date}`;
      const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      last7Days.push({
        dateStr,
        label,
        spend: 0,
        count: 0
      });
    }

    // Populate daily spend and count
    let totalSpent = 0;
    let activeOrdersCount = 0;

    state.orders.forEach(o => {
      const chargeVal = parseFloat(o.charge) || 0;
      const status = (o.status || '').toLowerCase();
      
      // Update running metrics for summary cards
      totalSpent += chargeVal;
      if (status === 'pending' || status === 'in progress') {
        activeOrdersCount += 1;
      }

      if (!o.createdAt || status === 'cancelled' || status === 'error') return;

      const orderDate = new Date(o.createdAt);
      const year = orderDate.getFullYear();
      const month = String(orderDate.getMonth() + 1).padStart(2, '0');
      const date = String(orderDate.getDate()).padStart(2, '0');
      const orderDateStr = `${year}-${month}-${date}`;

      const match = last7Days.find(day => day.dateStr === orderDateStr);
      if (match) {
        match.spend += chargeVal;
        match.count += 1;
      }
    });

    // Update UI summary elements
    const totalOrdersEl = document.getElementById('analytics-total-orders');
    const totalSpentEl = document.getElementById('analytics-total-spent');
    const activeOrdersEl = document.getElementById('analytics-active-orders');

    if (totalOrdersEl) totalOrdersEl.textContent = state.orders.length.toLocaleString();
    if (totalSpentEl) totalSpentEl.textContent = `₱${totalSpent.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    if (activeOrdersEl) activeOrdersEl.textContent = activeOrdersCount.toLocaleString();

    // Calculate maximum spend value for scaling (default to 10 if 0 to avoid division issues)
    let maxSpend = Math.max(...last7Days.map(d => d.spend));
    if (maxSpend <= 0) maxSpend = 10;

    // SVG coordinates setup
    const leftMargin = 55;
    const rightMargin = 20;
    const topMargin = 20;
    const bottomMargin = 30;
    const chartWidth = 600 - leftMargin - rightMargin;
    const chartHeight = 180 - topMargin - bottomMargin;

    // Y gridlines & labels at Y coord 20, 85, 150
    const yValues = [maxSpend, maxSpend / 2, 0];
    const yCoords = [topMargin, topMargin + chartHeight / 2, topMargin + chartHeight];

    yCoords.forEach((y, idx) => {
      // Horizontal dashed gridline
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", leftMargin);
      line.setAttribute("y1", y);
      line.setAttribute("x2", 600 - rightMargin);
      line.setAttribute("y2", y);
      line.setAttribute("class", "chart-grid-line");
      svg.appendChild(line);

      // Y-axis label text
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", leftMargin - 10);
      text.setAttribute("y", y + 4);
      text.setAttribute("text-anchor", "end");
      text.setAttribute("class", "chart-axis-text");
      text.textContent = `₱${yValues[idx].toFixed(2)}`;
      svg.appendChild(text);
    });

    // Draw X-axis line at the bottom grid line (y = 150)
    const xAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    xAxis.setAttribute("x1", leftMargin);
    xAxis.setAttribute("y1", topMargin + chartHeight);
    xAxis.setAttribute("x2", 600 - rightMargin);
    xAxis.setAttribute("y2", topMargin + chartHeight);
    xAxis.setAttribute("class", "chart-axis-line");
    svg.appendChild(xAxis);

    // Calculate daily point coordinates
    const points = last7Days.map((day, idx) => {
      const x = leftMargin + (idx / 6) * chartWidth;
      const y = (topMargin + chartHeight) - (day.spend / maxSpend) * chartHeight;
      return { x, y, day };
    });

    // Draw X-axis label texts
    points.forEach(pt => {
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", pt.x);
      text.setAttribute("y", 180 - 10);
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("class", "chart-axis-text");
      text.textContent = pt.day.label;
      svg.appendChild(text);
    });

    // Build line path definition d string
    const lineD = points.map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ');
    // Build area path definition d string (closed down to X-axis)
    const areaD = `${lineD} L ${leftMargin + chartWidth} ${topMargin + chartHeight} L ${leftMargin} ${topMargin + chartHeight} Z`;

    // Draw area under path first
    const areaPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    areaPath.setAttribute("d", areaD);
    areaPath.setAttribute("class", "chart-path-area");
    svg.appendChild(areaPath);

    // Draw line path
    const linePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    linePath.setAttribute("d", lineD);
    linePath.setAttribute("class", "chart-path-line");
    svg.appendChild(linePath);

    // Draw interactive circular node points
    points.forEach(pt => {
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", pt.x);
      circle.setAttribute("cy", pt.y);
      circle.setAttribute("r", "5");
      circle.setAttribute("class", "chart-point");

      circle.addEventListener('mouseenter', () => {
        circle.setAttribute("class", "chart-point chart-point-active");
        
        let tooltip = document.getElementById('chart-tooltip');
        if (!tooltip) {
          tooltip = document.createElement('div');
          tooltip.id = 'chart-tooltip';
          tooltip.className = 'chart-tooltip-box';
          tooltip.style.position = 'absolute';
          tooltip.style.display = 'none';
          const wrap = document.querySelector('.analytics-chart-wrap');
          if (wrap) wrap.appendChild(tooltip);
        }

        if (tooltip) {
          tooltip.innerHTML = `
            <div style="font-weight: 700; margin-bottom: 4px; color: var(--primary);">${pt.day.label}</div>
            <div style="margin-bottom: 2px;">Spend: <strong>₱${pt.day.spend.toFixed(2)}</strong></div>
            <div>Campaigns: <strong>${pt.day.count}</strong></div>
          `;
          // Position using percentages to be fully responsive
          tooltip.style.left = ((pt.x / 600) * 100) + '%';
          tooltip.style.top = ((pt.y / 180) * 100) + '%';
          tooltip.style.transform = 'translate(-50%, -115%)';
          tooltip.style.display = 'block';
        }
      });

      circle.addEventListener('mouseleave', () => {
        circle.setAttribute("class", "chart-point");
        const tooltip = document.getElementById('chart-tooltip');
        if (tooltip) {
          tooltip.style.display = 'none';
        }
      });

      svg.appendChild(circle);
    });
  }

  // --- CANVAS RECEIPT IMAGE EXPORTER ---
  function downloadReceiptImage(receipt) {
    // Create canvas element
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 700;
    const ctx = canvas.getContext('2d');

    // Check active theme
    const theme = document.documentElement.getAttribute('data-theme') || 'dark';
    const isDark = theme === 'dark';

    // Palette settings
    const bgColorStart = isDark ? '#0b0f19' : '#ffffff';
    const bgColorEnd = isDark ? '#111827' : '#f8fafc';
    const borderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0';
    const textMain = isDark ? '#ffffff' : '#0f172a';
    const textMuted = isDark ? '#94a3b8' : '#64748b';
    const primaryColor = '#f97316'; // apex orange
    const successColor = '#10b981'; // emerald green
    const successBg = isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)';

    // Draw background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 700);
    grad.addColorStop(0, bgColorStart);
    grad.addColorStop(1, bgColorEnd);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 600, 700);

    // Draw card border outline
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 580, 680);

    // Inner border or glow
    if (isDark) {
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.1)';
      ctx.lineWidth = 1;
      ctx.strokeRect(15, 15, 570, 670);
    }

    // Draw Header Logo & Name
    ctx.fillStyle = primaryColor;
    ctx.font = "bold 28px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("⚡ APEXBOOST", 300, 65);

    ctx.fillStyle = textMuted;
    ctx.font = "500 13px 'Inter', sans-serif";
    ctx.fillText("PREMIUM SOCIAL BOOSTING DESK", 300, 88);

    // Success Badge Pill
    const badgeWidth = 240;
    const badgeHeight = 32;
    const badgeX = 300 - badgeWidth / 2;
    const badgeY = 115;
    ctx.fillStyle = successBg;
    ctx.strokeStyle = successColor;
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 6, true, true);

    ctx.fillStyle = successColor;
    ctx.font = "bold 13px 'Inter', sans-serif";
    ctx.fillText("✓ ORDER PLACED SUCCESSFULLY", 300, 135);

    // Divider Line 1
    drawReceiptDivider(ctx, 40, 175, 520);

    // Helper to wrap / truncate text
    function truncateText(text, maxWidth) {
      let width = ctx.measureText(text).width;
      if (width <= maxWidth) return text;
      let ellipsified = text;
      while (width > maxWidth && ellipsified.length > 0) {
        ellipsified = ellipsified.slice(0, -1);
        width = ctx.measureText(ellipsified + '...').width;
      }
      return ellipsified + '...';
    }

    // Draw receipt rows
    const startRowY = 210;
    const rowSpacing = 42;
    const rows = [
      { label: "Campaign ID", value: `#${receipt.orderId}` },
      { label: "Date & Time", value: new Date().toLocaleString() },
      { label: "Service Name", value: receipt.serviceName },
      { label: "Target URL", value: receipt.url },
      { label: "Order Quantity", value: parseInt(receipt.quantity).toLocaleString() }
    ];

    ctx.textAlign = "left";
    rows.forEach((row, index) => {
      const currentY = startRowY + index * rowSpacing;

      // Draw label
      ctx.fillStyle = textMuted;
      ctx.font = "500 14px 'Inter', sans-serif";
      ctx.fillText(row.label, 50, currentY);

      // Draw value (aligned right)
      ctx.fillStyle = textMain;
      ctx.font = "bold 14px 'Inter', sans-serif";
      ctx.textAlign = "right";

      // Limit value width to prevent overlap
      let valStr = row.value;
      const maxValWidth = 340;
      if (row.label === "Service Name" || row.label === "Target URL") {
        ctx.font = "600 13px 'Inter', sans-serif";
      }
      valStr = truncateText(valStr, maxValWidth);

      ctx.fillText(valStr, 550, currentY);
      ctx.textAlign = "left"; // reset
    });

    // Divider Line 2
    drawReceiptDivider(ctx, 40, startRowY + rows.length * rowSpacing - 10, 520);

    // Payment totals
    const totalY = startRowY + rows.length * rowSpacing + 30;
    ctx.fillStyle = textMuted;
    ctx.font = "500 15px 'Inter', sans-serif";
    ctx.fillText("Total Charged:", 50, totalY);

    ctx.fillStyle = primaryColor;
    ctx.font = "bold 26px 'Inter', sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`₱${parseFloat(receipt.charge).toFixed(2)}`, 550, totalY + 8);

    const balY = totalY + 45;
    ctx.textAlign = "left";
    ctx.fillStyle = textMuted;
    ctx.font = "500 14px 'Inter', sans-serif";
    ctx.fillText("Remaining Balance:", 50, balY);

    ctx.fillStyle = textMain;
    ctx.font = "bold 16px 'Inter', sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`₱${parseFloat(receipt.remainingBalance).toFixed(2)}`, 550, balY);

    // Divider Line 3
    drawReceiptDivider(ctx, 40, balY + 30, 520);

    // Footer: Draw barcode
    const barcodeY = balY + 55;
    ctx.fillStyle = isDark ? '#ffffff' : '#000000';
    drawDynamicBarcode(ctx, 200, barcodeY, 200, 45, receipt.orderId);

    // Footer Text
    ctx.textAlign = "center";
    ctx.fillStyle = textMuted;
    ctx.font = "italic 11px 'Inter', sans-serif";
    ctx.fillText("This is a digital transaction receipt. Thank you for boosting with ApexBoost!", 300, barcodeY + 68);

    // Convert to PNG and trigger download
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `ApexBoost-Receipt-${receipt.orderId}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showPremiumToast("Receipt Downloaded", "PNG image receipt has been successfully saved to your downloads.", "success");
    } catch (err) {
      console.error("Failed to generate receipt image: ", err);
      showPremiumToast("Download Failed", "Browser security blocked receipt generation or export failed.", "error");
    }
  }

  // Rounded rect utility
  function drawRoundedRect(ctx, x, y, width, height, radius, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  // Receipt divider line utility
  function drawReceiptDivider(ctx, x, y, width) {
    ctx.strokeStyle = ctx.strokeStyle;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    ctx.stroke();
    ctx.setLineDash([]); // reset
  }

  // Draw dynamic barcode
  function drawDynamicBarcode(ctx, x, y, width, height, text) {
    ctx.save();
    // Draw barcode lines based on Order ID hash
    const hash = Math.abs(hashCode(text)).toString();
    const pattern = (hash + "0123456789").split("");
    const barCount = pattern.length * 4;
    const barWidth = width / barCount;
    
    ctx.fillStyle = ctx.fillStyle;
    for (let i = 0; i < barCount; i++) {
      const p = pattern[i % pattern.length];
      const thickness = parseInt(p) % 3 + 1;
      if (i % 2 === 0) {
        ctx.fillRect(x + i * barWidth, y, barWidth * thickness, height);
      }
    }
    
    // Barcode text
    ctx.fillStyle = ctx.fillStyle;
    ctx.font = "10px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.fillText(`*${text}*`, x + width / 2, y + height + 12);
    ctx.restore();
  }

  // Hash code helper
  function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
  }

  // --- ADMINISTRATIVE SUB-TABS DYNAMIC BINDINGS (TASK 3 & TASK 4) ---
  async function loadAdminTabSpecificData(tab) {
    if (tab === 'dashboard') {
      loadSuperAdminAnalytics();
      loadAdminDashboardCharts();
    } else if (tab === 'users') {
      loadAdminUsersList();
    } else if (tab === 'orders') {
      loadAdminOrders();
      bindAdminOrdersControls();
    } else if (tab === 'services') {
      loadAdminPriceEditor();
      bindAdminServicesControls();
    } else if (tab === 'finance') {
      bindFinanceDashboardControls();
      loadFinanceDashboard();
    } else if (tab === 'payments') {
      loadAdminDepositsQueue();
      loadAdminPaymentSettings();
      bindAdminPaymentSettingsControls();
    } else if (tab === 'support') {
      loadAdminTicketsQueue();
    } else if (tab === 'marketing') {
      loadSuperAdminSettings();
      loadAdminAnnouncements();
      loadAdminPromos();
      bindAdminMarketingControls();
    } else if (tab === 'settings') {
      loadAdminProviderDiagnostics();
    } else if (tab === 'security') {
      loadAdminAuditLogs();
      loadAdminIpBlacklist();
    }
  }

  async function loadAdminDashboardCharts() {
    try {
      const res = await request('/api/admin/finance/summary?range=this_month');
      if (res.ok) {
        const data = await res.json();
        const dailyData = data.daily || [];
        renderDailySalesChart(dailyData);
        renderDailyOrdersChart(dailyData);
      }
    } catch (e) {
      console.warn("Could not load charts:", e);
    }
  }

  function renderDailySalesChart(dailyData) {
    const svg = document.getElementById('admin-daily-sales-svg');
    if (!svg) return;
    svg.innerHTML = '';

    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    defs.innerHTML = `
      <linearGradient id="admin-sales-gradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--primary)" stop-opacity="0.35"></stop>
        <stop offset="100%" stop-color="var(--primary)" stop-opacity="0.0"></stop>
      </linearGradient>
    `;
    svg.appendChild(defs);

    if (dailyData.length === 0) {
      svg.innerHTML += `<text x="250" y="90" text-anchor="middle" class="chart-axis-text" fill="var(--text-muted)">No sales data available</text>`;
      return;
    }

    let maxSales = Math.max(...dailyData.map(d => parseFloat(d.grossSales) || 0));
    if (maxSales <= 0) maxSales = 100;

    const leftMargin = 55;
    const rightMargin = 20;
    const topMargin = 20;
    const bottomMargin = 30;
    const chartWidth = 500 - leftMargin - rightMargin;
    const chartHeight = 180 - topMargin - bottomMargin;

    const yValues = [maxSales, maxSales / 2, 0];
    const yCoords = [topMargin, topMargin + chartHeight / 2, topMargin + chartHeight];

    yCoords.forEach((y, idx) => {
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", leftMargin);
      line.setAttribute("y1", y);
      line.setAttribute("x2", 500 - rightMargin);
      line.setAttribute("y2", y);
      line.setAttribute("class", "chart-grid-line");
      svg.appendChild(line);

      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", leftMargin - 10);
      text.setAttribute("y", y + 4);
      text.setAttribute("text-anchor", "end");
      text.setAttribute("class", "chart-axis-text");
      text.textContent = `₱${yValues[idx].toFixed(0)}`;
      svg.appendChild(text);
    });

    const xAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    xAxis.setAttribute("x1", leftMargin);
    xAxis.setAttribute("y1", topMargin + chartHeight);
    xAxis.setAttribute("x2", 500 - rightMargin);
    xAxis.setAttribute("y2", topMargin + chartHeight);
    xAxis.setAttribute("class", "chart-axis-line");
    svg.appendChild(xAxis);

    const points = dailyData.map((day, idx) => {
      const x = leftMargin + (idx / (dailyData.length - 1 || 1)) * chartWidth;
      const y = (topMargin + chartHeight) - ((parseFloat(day.grossSales) || 0) / maxSales) * chartHeight;
      const label = day.key ? day.key.slice(5) : '—';
      return { x, y, day, label };
    });

    points.forEach((pt, idx) => {
      const showLabel = dailyData.length < 10 || idx % Math.ceil(dailyData.length / 7) === 0;
      if (showLabel) {
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", pt.x);
        text.setAttribute("y", 180 - 10);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("class", "chart-axis-text");
        text.textContent = pt.label;
        svg.appendChild(text);
      }
    });

    const lineD = points.map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ');
    const areaD = `${lineD} L ${leftMargin + chartWidth} ${topMargin + chartHeight} L ${leftMargin} ${topMargin + chartHeight} Z`;

    const areaPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    areaPath.setAttribute("d", areaD);
    areaPath.setAttribute("fill", "url(#admin-sales-gradient)");
    areaPath.setAttribute("style", "opacity: 0.2;");
    svg.appendChild(areaPath);

    const linePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    linePath.setAttribute("d", lineD);
    linePath.setAttribute("fill", "none");
    linePath.setAttribute("stroke", "var(--primary)");
    linePath.setAttribute("stroke-width", "2");
    svg.appendChild(linePath);

    points.forEach(pt => {
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", pt.x);
      circle.setAttribute("cy", pt.y);
      circle.setAttribute("r", "4");
      circle.setAttribute("fill", "var(--primary)");
      circle.setAttribute("style", "cursor: pointer;");

      circle.addEventListener('mouseenter', () => {
        circle.setAttribute("r", "6");
        let tooltip = document.getElementById('admin-chart-tooltip');
        if (!tooltip) {
          tooltip = document.createElement('div');
          tooltip.id = 'admin-chart-tooltip';
          tooltip.className = 'chart-tooltip-box';
          tooltip.style.position = 'absolute';
          document.body.appendChild(tooltip);
        }
        tooltip.innerHTML = `
          <div style="font-weight:700; color:var(--primary);">${pt.day.key}</div>
          <div>Sales: <strong>₱${pt.day.grossSales.toFixed(2)}</strong></div>
          <div>Profit: <strong style="color:var(--success);">₱${pt.day.netProfit.toFixed(2)}</strong></div>
        `;
        const rect = circle.getBoundingClientRect();
        tooltip.style.left = (rect.left + window.scrollX) + 'px';
        tooltip.style.top = (rect.top + window.scrollY - 10) + 'px';
        tooltip.style.transform = 'translate(-50%, -100%)';
        tooltip.style.display = 'block';
        tooltip.style.zIndex = '1000000';
      });

      circle.addEventListener('mouseleave', () => {
        circle.setAttribute("r", "4");
        const tooltip = document.getElementById('admin-chart-tooltip');
        if (tooltip) tooltip.style.display = 'none';
      });

      svg.appendChild(circle);
    });
  }

  function renderDailyOrdersChart(dailyData) {
    const svg = document.getElementById('admin-daily-orders-svg');
    if (!svg) return;
    svg.innerHTML = '';

    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    defs.innerHTML = `
      <linearGradient id="admin-orders-gradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.35"></stop>
        <stop offset="100%" stop-color="var(--accent)" stop-opacity="0.0"></stop>
      </linearGradient>
    `;
    svg.appendChild(defs);

    if (dailyData.length === 0) {
      svg.innerHTML += `<text x="250" y="90" text-anchor="middle" class="chart-axis-text" fill="var(--text-muted)">No orders data available</text>`;
      return;
    }

    let maxOrders = Math.max(...dailyData.map(d => parseInt(d.totalOrders) || 0));
    if (maxOrders <= 0) maxOrders = 10;

    const leftMargin = 55;
    const rightMargin = 20;
    const topMargin = 20;
    const bottomMargin = 30;
    const chartWidth = 500 - leftMargin - rightMargin;
    const chartHeight = 180 - topMargin - bottomMargin;

    const yValues = [maxOrders, maxOrders / 2, 0];
    const yCoords = [topMargin, topMargin + chartHeight / 2, topMargin + chartHeight];

    yCoords.forEach((y, idx) => {
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", leftMargin);
      line.setAttribute("y1", y);
      line.setAttribute("x2", 500 - rightMargin);
      line.setAttribute("y2", y);
      line.setAttribute("class", "chart-grid-line");
      svg.appendChild(line);

      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", leftMargin - 10);
      text.setAttribute("y", y + 4);
      text.setAttribute("text-anchor", "end");
      text.setAttribute("class", "chart-axis-text");
      text.textContent = `${yValues[idx].toFixed(0)}`;
      svg.appendChild(text);
    });

    const xAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    xAxis.setAttribute("x1", leftMargin);
    xAxis.setAttribute("y1", topMargin + chartHeight);
    xAxis.setAttribute("x2", 500 - rightMargin);
    xAxis.setAttribute("y2", topMargin + chartHeight);
    xAxis.setAttribute("class", "chart-axis-line");
    svg.appendChild(xAxis);

    const points = dailyData.map((day, idx) => {
      const x = leftMargin + (idx / (dailyData.length - 1 || 1)) * chartWidth;
      const y = (topMargin + chartHeight) - ((parseInt(day.totalOrders) || 0) / maxOrders) * chartHeight;
      const label = day.key ? day.key.slice(5) : '—';
      return { x, y, day, label };
    });

    points.forEach((pt, idx) => {
      const showLabel = dailyData.length < 10 || idx % Math.ceil(dailyData.length / 7) === 0;
      if (showLabel) {
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", pt.x);
        text.setAttribute("y", 180 - 10);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("class", "chart-axis-text");
        text.textContent = pt.label;
        svg.appendChild(text);
      }
    });

    const lineD = points.map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ');
    const areaD = `${lineD} L ${leftMargin + chartWidth} ${topMargin + chartHeight} L ${leftMargin} ${topMargin + chartHeight} Z`;

    const areaPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    areaPath.setAttribute("d", areaD);
    areaPath.setAttribute("fill", "url(#admin-orders-gradient)");
    areaPath.setAttribute("style", "opacity: 0.2;");
    svg.appendChild(areaPath);

    const linePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    linePath.setAttribute("d", lineD);
    linePath.setAttribute("fill", "none");
    linePath.setAttribute("stroke", "var(--accent)");
    linePath.setAttribute("stroke-width", "2");
    svg.appendChild(linePath);

    points.forEach(pt => {
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", pt.x);
      circle.setAttribute("cy", pt.y);
      circle.setAttribute("r", "4");
      circle.setAttribute("fill", "var(--accent)");
      circle.setAttribute("style", "cursor: pointer;");

      circle.addEventListener('mouseenter', () => {
        circle.setAttribute("r", "6");
        let tooltip = document.getElementById('admin-chart-tooltip');
        if (!tooltip) {
          tooltip = document.createElement('div');
          tooltip.id = 'admin-chart-tooltip';
          tooltip.className = 'chart-tooltip-box';
          tooltip.style.position = 'absolute';
          document.body.appendChild(tooltip);
        }
        tooltip.innerHTML = `
          <div style="font-weight:700; color:var(--accent);">${pt.day.key}</div>
          <div>Orders Placed: <strong>${pt.day.totalOrders}</strong></div>
        `;
        const rect = circle.getBoundingClientRect();
        tooltip.style.left = (rect.left + window.scrollX) + 'px';
        tooltip.style.top = (rect.top + window.scrollY - 10) + 'px';
        tooltip.style.transform = 'translate(-50%, -100%)';
        tooltip.style.display = 'block';
        tooltip.style.zIndex = '1000000';
      });

      circle.addEventListener('mouseleave', () => {
        circle.setAttribute("r", "4");
        const tooltip = document.getElementById('admin-chart-tooltip');
        if (tooltip) tooltip.style.display = 'none';
      });

      svg.appendChild(circle);
    });
  }

  let adminOrdersList = [];
  async function loadAdminOrders() {
    const tbody = document.getElementById('admin-orders-tbody');
    if (!tbody) return;

    showTableSkeleton(tbody, 8);

    const status = document.getElementById('admin-orders-status-filter')?.value || 'all';
    const query = document.getElementById('admin-orders-search-input')?.value || '';

    try {
      const res = await request(`/api/admin/orders?status=${encodeURIComponent(status)}`);
      if (!res.ok) throw new Error("Failed to fetch SMM orders.");
      const data = await res.json();
      adminOrdersList = data;
      renderAdminOrdersTable(query);
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger" style="padding: 20px;">❌ ${e.message}</td></tr>`;
    }
  }

  function renderAdminOrdersTable(query = '') {
    const tbody = document.getElementById('admin-orders-tbody');
    if (!tbody) return;

    const filtered = adminOrdersList.filter(o => {
      if (!query) return true;
      const q = query.toLowerCase();
      const oId = String(o.order_id || o.orderId || '').toLowerCase();
      const uName = String(o.username || '').toLowerCase();
      const pkgName = String(o.service_name || o.serviceName || '').toLowerCase();
      const link = String(o.url || o.link || '').toLowerCase();
      return oId.includes(q) || uName.includes(q) || pkgName.includes(q) || link.includes(q);
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted" style="padding: 20px;">No campaigns match criteria.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(o => {
      const oId = o.order_id || o.orderId;
      const charge = parseFloat(o.charge ?? o.selling_price ?? 0);
      const cost = parseFloat(o.api_cost || 0);
      const profit = parseFloat(o.net_profit ?? (charge - cost));
      const status = (o.status || 'Pending').toLowerCase();
      const notes = o.admin_notes || o.adminNotes || '';
      
      let badgeColor = 'var(--text-muted)';
      if (status.includes('pending')) badgeColor = '#f59e0b';
      else if (status.includes('processing') || status.includes('progress')) badgeColor = 'var(--primary)';
      else if (status.includes('complete')) badgeColor = 'var(--success)';
      else if (status.includes('fail') || status.includes('cancel')) badgeColor = 'var(--danger)';

      const isStuck = o.stuck_detected === 1 || ((status === 'pending' || status === 'processing') && (Date.now() - new Date(o.createdAt || o.created_at).getTime() > 24 * 3600 * 1000));
      const stuckBadge = isStuck ? `<span class="badge-recommended" style="font-size:0.6rem; background:rgba(239,68,68,0.15); color:var(--danger); border:1px solid rgba(239,68,68,0.25); display:block; margin-top:4px; text-align:center;">⚠️ STUCK</span>` : '';

      return `
        <tr>
          <td><strong>#${oId}</strong></td>
          <td>
            <div style="font-weight:600; font-size:0.85rem;">${escapeHtml(o.username || 'User')}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">${escapeHtml(o.email || '')}</div>
          </td>
          <td>
            <div style="font-weight:600; font-size:0.85rem;">${escapeHtml(o.service_name || o.serviceName || 'Service')}</div>
            <div style="font-size:0.78rem; color:var(--text-muted); max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"><a href="${escapeHtml(o.url || o.link || '#')}" target="_blank">${escapeHtml(o.url || o.link || '—')}</a></div>
            <div style="font-size:0.72rem; color:var(--primary);">Qty: ${o.quantity}</div>
          </td>
          <td style="font-size:0.85rem; color:var(--text-muted);">₱${cost.toFixed(2)}</td>
          <td style="font-size:0.85rem; font-weight:700;">₱${charge.toFixed(2)}</td>
          <td style="font-size:0.85rem; font-weight:700; color:${profit >= 0 ? 'var(--success)' : 'var(--danger)'};">₱${profit.toFixed(2)}</td>
          <td>
            <span class="status-badge" style="background:rgba(255,255,255,0.03); border:1px solid ${badgeColor}; color:${badgeColor};">${o.status}</span>
            ${stuckBadge}
          </td>
          <td>
            <div style="display:flex; flex-direction:column; gap:6px; min-width: 160px;">
              <div style="display:flex; gap:4px;">
                <button class="btn btn-primary btn-sm" style="font-size:0.75rem; padding:4px 8px;" onclick="window._actionOrder(${oId}, 'retry')">🔄 Retry</button>
                <button class="btn btn-secondary btn-sm" style="font-size:0.75rem; padding:4px 8px; background:var(--danger); border-color:transparent; color:#fff;" onclick="window._actionOrder(${oId}, 'cancel')">❌ Cancel</button>
              </div>
              <div style="display:flex; gap:4px; align-items:center; margin-top:2px;">
                <input type="text" placeholder="Internal notes..." value="${escapeHtml(notes)}" id="admin-order-note-${oId}" class="search-input" style="margin:0; padding:4px; font-size:0.75rem; flex:1;">
                <button class="btn btn-secondary btn-sm" style="font-size:0.72rem; padding:4px; background:var(--primary); color:#fff; border-color:transparent;" onclick="window._updateOrderNotes(${oId})">📝 Save</button>
              </div>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function bindAdminOrdersControls() {
    const filter = document.getElementById('admin-orders-status-filter');
    const search = document.getElementById('admin-orders-search-input');
    const reload = document.getElementById('admin-reload-orders-btn');
    const exportBtn = document.getElementById('admin-orders-export-csv-btn');
    const syncAllBtn = document.getElementById('admin-orders-sync-all-btn');

    if (filter && !filter.dataset.listenerAttached) {
      filter.dataset.listenerAttached = 'true';
      filter.addEventListener('change', () => loadAdminOrders());
    }
    if (search && !search.dataset.listenerAttached) {
      search.dataset.listenerAttached = 'true';
      search.addEventListener('input', () => renderAdminOrdersTable(search.value));
    }
    if (reload && !reload.dataset.listenerAttached) {
      reload.dataset.listenerAttached = 'true';
      reload.addEventListener('click', () => loadAdminOrders());
    }
    if (exportBtn && !exportBtn.dataset.listenerAttached) {
      exportBtn.dataset.listenerAttached = 'true';
      exportBtn.addEventListener('click', () => {
        window.open(`/api/admin/finance/export.csv?key=${encodeURIComponent(getAuthToken())}`, '_blank');
      });
    }
    if (syncAllBtn && !syncAllBtn.dataset.listenerAttached) {
      syncAllBtn.dataset.listenerAttached = 'true';
      syncAllBtn.addEventListener('click', async () => {
        syncAllBtn.disabled = true;
        syncAllBtn.textContent = 'Syncing... 🔄';
        try {
          const res = await request('/api/admin/orders/sync-all', { method: 'POST' });
          const data = await res.json();
          if (res.ok && data.success) {
            showPremiumToast('Orders Synced', data.message || 'Status checks complete.', 'success');
            loadAdminOrders();
          } else {
            showPremiumToast('Sync Failed', data.error || 'Failed to query statuses.', 'error');
          }
        } catch (e) {
          showPremiumToast('Network Error', e.message, 'error');
        } finally {
          syncAllBtn.disabled = false;
          syncAllBtn.textContent = 'Sync All Statuses 🔄';
        }
      });
    }
  }

  window._actionOrder = async function(orderId, action) {
    try {
      const res = await request('/api/admin/orders/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showPremiumToast('Order Action Executed', `Successfully triggered "${action}" on order #${orderId}`, 'success');
        loadAdminOrders();
      } else {
        showPremiumToast('Action Failed', data.error || 'Action failed.', 'error');
      }
    } catch (e) {
      showPremiumToast('Network Error', e.message, 'error');
    }
  };

  window._updateOrderNotes = async function(orderId) {
    const input = document.getElementById(`admin-order-note-${orderId}`);
    const note = input ? input.value.trim() : '';
    try {
      const res = await request('/api/admin/orders/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action: 'update-notes', note })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showPremiumToast('Notes Saved', `Successfully updated notes for order #${orderId}`, 'success');
        loadAdminOrders();
      } else {
        showPremiumToast('Notes Update Failed', data.error || 'Action failed.', 'error');
      }
    } catch (e) {
      showPremiumToast('Network Error', e.message, 'error');
    }
  };

  function bindAdminServicesControls() {
    const syncCatalogBtn = document.getElementById('admin-sync-catalog-btn');
    if (syncCatalogBtn && !syncCatalogBtn.dataset.listenerAttached) {
      syncCatalogBtn.dataset.listenerAttached = 'true';
      syncCatalogBtn.addEventListener('click', async () => {
        syncCatalogBtn.disabled = true;
        syncCatalogBtn.textContent = 'Syncing... ⏳';
        try {
          const res = await request('/api/admin/services/sync', { method: 'POST' });
          if (res.ok) {
            const data = await res.json();
            showPremiumToast('Catalog Synced', `Successfully synced ${data.count} SMM packages from reseller API.`, 'success');
            priceEditorLoaded = false;
            loadAdminPriceEditor();
          } else {
            showPremiumToast('Sync Failed', 'Failed to connect SMM provider.', 'error');
          }
        } catch (e) {
          showPremiumToast('Sync Error', e.message, 'error');
        } finally {
          syncCatalogBtn.disabled = false;
          syncCatalogBtn.textContent = 'Sync from RKD 🔄';
        }
      });
    }
  }

  async function loadAdminPaymentSettings() {
    try {
      const res = await request('/api/admin/payment-settings');
      if (res.ok) {
        const data = await res.json();
        
        const gcashNum = document.getElementById('admin-pay-gcash-num');
        const gcashName = document.getElementById('admin-pay-gcash-name');
        const mayaNum = document.getElementById('admin-pay-maya-num');
        const mayaName = document.getElementById('admin-pay-maya-name');
        const bpiNum = document.getElementById('admin-pay-bpi-num');
        const bpiName = document.getElementById('admin-pay-bpi-name');
        const toggleGcash = document.getElementById('admin-toggle-gcash');
        const toggleMaya = document.getElementById('admin-toggle-maya');
        const toggleBpi = document.getElementById('admin-toggle-bpi');

        if (gcashNum) gcashNum.value = data.gcashNumber || '';
        if (gcashName) gcashName.value = data.gcashName || '';
        if (mayaNum) mayaNum.value = data.mayaNumber || '';
        if (mayaName) mayaName.value = data.mayaName || '';
        if (bpiNum) bpiNum.value = data.bpiNumber || '';
        if (bpiName) bpiName.value = data.bpiName || '';

        const methods = data.methods || {};
        if (toggleGcash) toggleGcash.checked = !!methods.gcash;
        if (toggleMaya) toggleMaya.checked = !!methods.maya;
        if (toggleBpi) toggleBpi.checked = !!methods.bpi;
      }
    } catch (e) {
      console.warn("Could not load payment settings:", e);
    }
  }

  function bindAdminPaymentSettingsControls() {
    const form = document.getElementById('admin-payment-config-form');
    if (form && !form.dataset.listenerAttached) {
      form.dataset.listenerAttached = 'true';
      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const body = {
          gcashNumber: document.getElementById('admin-pay-gcash-num')?.value || '',
          gcashName: document.getElementById('admin-pay-gcash-name')?.value || '',
          mayaNumber: document.getElementById('admin-pay-maya-num')?.value || '',
          mayaName: document.getElementById('admin-pay-maya-name')?.value || '',
          bpiNumber: document.getElementById('admin-pay-bpi-num')?.value || '',
          bpiName: document.getElementById('admin-pay-bpi-name')?.value || '',
          methods: {
            gcash: !!document.getElementById('admin-toggle-gcash')?.checked,
            maya: !!document.getElementById('admin-toggle-maya')?.checked,
            bpi: !!document.getElementById('admin-toggle-bpi')?.checked
          }
        };

        try {
          const res = await request('/api/admin/payment-settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });
          const data = await res.json();
          if (res.ok && data.success) {
            showPremiumToast('Payment Settings Updated', 'Successfully saved payment QR details & credentials.', 'success');
            loadAdminPaymentSettings();
          } else {
            showPremiumToast('Save Failed', data.error || 'Failed to save settings.', 'error');
          }
        } catch (error) {
          showPremiumToast('Connection Error', error.message, 'error');
        }
      });
    }
  }

  async function loadAdminAnnouncements() {
    try {
      const res = await request('/api/admin/payment-settings');
      if (res.ok) {
        const data = await res.json();
        const textarea = document.getElementById('admin-announcement-input');
        if (textarea) textarea.value = data.globalAnnouncement || '';
      }
    } catch (e) {
      console.warn("Could not load announcement info:", e);
    }
  }

  async function loadAdminPromos() {
    const tbody = document.getElementById('admin-promos-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">⏳ Loading promo coupon catalog...</td></tr>`;

    try {
      const res = await request('/api/admin/marketing/promos');
      if (res.ok) {
        const data = await res.json();
        if (data.length === 0) {
          tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-3">No active discount codes.</td></tr>`;
          return;
        }
        tbody.innerHTML = data.map(p => {
          return `
            <tr>
              <td><strong>${escapeHtml(p.code)}</strong></td>
              <td>${escapeHtml(p.type)}</td>
              <td>${p.type === 'percentage' ? `${parseFloat(p.value).toFixed(0)}%` : `₱${parseFloat(p.value).toFixed(2)}`}</td>
              <td>${p.uses || 0}</td>
              <td>${p.max_uses || p.maxUses || 100}</td>
              <td>
                <button class="btn btn-secondary btn-sm" style="background:var(--danger); border-color:transparent; color:#fff;" onclick="window._deletePromo('${p.code}')">🗑️ Delete</button>
              </td>
            </tr>
          `;
        }).join('');
      }
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">❌ Failed to load codes.</td></tr>`;
    }
  }

  window._deletePromo = async function(code) {
    if (!confirm(`Are you sure you want to delete promo coupon "${code}"?`)) return;
    try {
      const res = await request('/api/admin/marketing/promos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showPremiumToast('Promo Coupon Deleted', `Successfully removed code "${code}" from catalogue.`, 'success');
        loadAdminPromos();
      } else {
        showPremiumToast('Deletion Failed', data.error || 'Action failed.', 'error');
      }
    } catch (e) {
      showPremiumToast('Network Error', e.message, 'error');
    }
  };

  function bindAdminMarketingControls() {
    const annBtn = document.getElementById('admin-save-announcement-btn');
    if (annBtn && !annBtn.dataset.listenerAttached) {
      annBtn.dataset.listenerAttached = 'true';
      annBtn.addEventListener('click', async () => {
        const announcement = document.getElementById('admin-announcement-input')?.value.trim() || '';
        annBtn.disabled = true;
        annBtn.textContent = 'Posting... ⏳';
        try {
          const res = await request('/api/admin/marketing/announcements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ announcement })
          });
          const data = await res.json();
          if (res.ok && data.success) {
            showPremiumToast('Dashboard Post Updated', 'Successfully posted global alert banner notice to client panels.', 'success');
          } else {
            showPremiumToast('Post Failed', data.error || 'Action failed.', 'error');
          }
        } catch (e) {
          showPremiumToast('Network Error', e.message, 'error');
        } finally {
          annBtn.disabled = false;
          annBtn.textContent = 'Post Dashboard Announcement 🚀';
        }
      });
    }

    const promoForm = document.getElementById('admin-create-promo-form');
    if (promoForm && !promoForm.dataset.listenerAttached) {
      promoForm.dataset.listenerAttached = 'true';
      promoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = document.getElementById('admin-promo-code')?.value.trim() || '';
        const type = document.getElementById('admin-promo-type')?.value || 'percentage';
        const value = document.getElementById('admin-promo-val')?.value || '';
        const maxUses = document.getElementById('admin-promo-uses')?.value || '';

        try {
          const res = await request('/api/admin/marketing/promos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, type, value, maxUses })
          });
          const data = await res.json();
          if (res.ok && data.success) {
            showPremiumToast('Coupon Activated', `Successfully added "${code}" SMM promo coupon package!`, 'success');
            promoForm.reset();
            loadAdminPromos();
          } else {
            showPremiumToast('Creation Failed', data.error || 'Action failed.', 'error');
          }
        } catch (err) {
          showPremiumToast('Network Error', err.message, 'error');
        }
      });
    }

    const maintBtn = document.getElementById('super-admin-maintenance-btn');
    if (maintBtn && !maintBtn.dataset.listenerAttached) {
      maintBtn.dataset.listenerAttached = 'true';
      maintBtn.addEventListener('click', async () => {
        maintBtn.disabled = true;
        maintBtn.textContent = 'Updating...';
        try {
          const curRes = await request('/api/admin/maintenance');
          const curData = await curRes.json();
          const target = !curData.maintenance;

          const postRes = await request('/api/admin/maintenance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ maintenance: target })
          });
          const postData = await postRes.json();
          if (postRes.ok && postData.success) {
            const label = target ? 'ENABLED' : 'DISABLED';
            showPremiumToast('Maintenance Lock Triggered', `cPanel maintenance has been successfully ${label}!`, 'success');
            checkMaintenanceButtonState();
          } else {
            showPremiumToast('Toggle Failed', postData.error || 'Action failed.', 'error');
          }
        } catch (e) {
          showPremiumToast('Network Error', e.message, 'error');
        } finally {
          maintBtn.disabled = false;
        }
      });
    }
  }

  async function checkMaintenanceButtonState() {
    const maintBtn = document.getElementById('super-admin-maintenance-btn');
    if (!maintBtn) return;
    try {
      const res = await request('/api/admin/maintenance');
      if (res.ok) {
        const data = await res.json();
        if (data.maintenance) {
          maintBtn.textContent = 'Disable Maintenance';
          maintBtn.style.background = 'var(--success)';
          maintBtn.style.color = '#fff';
          maintBtn.style.borderColor = 'transparent';
        } else {
          maintBtn.textContent = 'Enable Maintenance';
          maintBtn.style.background = 'none';
          maintBtn.style.color = '#f87171';
          maintBtn.style.borderColor = 'rgba(239, 68, 68, 0.4)';
        }
      }
    } catch (e) {
      console.warn("Could not verify maintenance state:", e);
    }
  }

  async function loadAdminProviderDiagnostics() {
    const balEl = document.getElementById('admin-prov-balance');
    const latEl = document.getElementById('admin-prov-latency');
    const healthEl = document.getElementById('admin-prov-health');
    const logsEl = document.getElementById('admin-prov-error-logs');
    const btn = document.getElementById('admin-btn-retest-provider');

    // Threshold inputs
    const thresholdInput = document.getElementById('admin-prov-threshold');
    const blockOrdersInput = document.getElementById('admin-prov-block-orders');
    const safetyForm = document.getElementById('admin-provider-safety-form');

    if (!balEl || !latEl || !healthEl) return;

    if (btn && !btn.dataset.listenerAttached) {
      btn.dataset.listenerAttached = 'true';
      btn.addEventListener('click', () => loadAdminProviderDiagnostics());
    }

    if (safetyForm && !safetyForm.dataset.listenerAttached) {
      safetyForm.dataset.listenerAttached = 'true';
      safetyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          const threshold = parseFloat(thresholdInput.value);
          const blockOrders = blockOrdersInput.checked;
          const res = await request('/api/admin/api-provider/safety', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lowBalanceThresholdPhp: threshold, blockOrdersWhenProviderLow: blockOrders })
          });
          const data = await res.json();
          if (res.ok && data.success) {
            showPremiumToast('Safety Settings Saved', 'Provider safety configurations updated successfully.', 'success');
            loadAdminProviderDiagnostics();
          } else {
            showPremiumToast('Save Failed', data.error || 'Failed to update safety threshold.', 'error');
          }
        } catch (err) {
          showPremiumToast('Network Error', err.message, 'error');
        }
      });
    }

    balEl.textContent = 'Checking...';
    latEl.textContent = 'Checking...';
    healthEl.textContent = 'Checking...';
    if (btn) { btn.disabled = true; btn.textContent = 'Refreshing balances...'; }

    try {
      const res = await request('/api/admin/api-provider/check');
      if (res.ok) {
        const data = await res.json();
        
        balEl.textContent = `₱${Number(data.balancePhp || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        latEl.textContent = data.speed || '0ms';

        const providerGrid = document.getElementById('admin-provider-balance-grid');
        const rateNote = document.getElementById('admin-provider-rate-note');
        const providers = Array.isArray(data.providers) ? data.providers : [];
        const peso = value => `₱${Number(value || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const dollars = value => `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const statusLabel = value => {
          const status = String(value || 'unknown').toLowerCase();
          if (status === 'online') return 'Healthy';
          if (status === 'low-balance') return 'Low balance';
          if (status === 'not-configured') return 'Not configured';
          return status === 'demo-offline' ? 'Demo only' : 'Degraded';
        };
        if (rateNote) {
          const checked = data.checkedAt ? new Date(data.checkedAt).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' }) : 'just now';
          rateNote.textContent = `1 USD = ₱${Number(data.usdToPhpRate || 0).toFixed(4)} · Updated ${checked}`;
        }
        if (providerGrid) {
          const providerCards = providers.map(provider => {
            const status = String(provider.status || 'degraded').toLowerCase();
            const statusClass = status === 'online' ? 'is-healthy' : status === 'low-balance' ? 'is-warning' : 'is-degraded';
            return `
              <article class="provider-balance-card ${statusClass}">
                <header><strong>${escapeHtml(provider.name || provider.key || 'Provider')}</strong><span class="provider-health-label">${statusLabel(status)}</span></header>
                <div class="provider-money-grid">
                  <div><span>USD balance</span><strong>${dollars(provider.balanceUsd)}</strong></div>
                  <div><span>PHP equivalent</span><strong>${peso(provider.balancePhp)}</strong></div>
                </div>
                <dl>
                  <div><dt>Latency</dt><dd>${Number(provider.latencyMs || 0).toLocaleString()}ms</dd></div>
                  <div><dt>Connection</dt><dd>${provider.configured ? 'Configured' : 'Missing credentials'}</dd></div>
                </dl>
                ${provider.errorLog && provider.errorLog !== 'None' ? `<p class="provider-card-error">${escapeHtml(provider.errorLog)}</p>` : ''}
              </article>`;
          }).join('');
          providerGrid.innerHTML = `${providerCards}
            <article class="provider-balance-card provider-total-card">
              <header><strong>Total provider liquidity</strong><span>${Number(data.configuredProviderCount || 0)} connected</span></header>
              <div class="provider-money-grid">
                <div><span>Total USD</span><strong>${dollars(data.totalBalanceUsd)}</strong></div>
                <div><span>Total PHP</span><strong>${peso(data.totalBalancePhp)}</strong></div>
              </div>
              <p class="provider-total-note">Sum of successfully configured provider balances.</p>
            </article>`;
        }
        
        const stat = (data.status || 'online').toLowerCase();
        if (stat === 'online') {
          healthEl.textContent = 'CONNECTED 🟢';
          healthEl.style.color = 'var(--success)';
        } else if (stat.includes('demo') || stat.includes('offline')) {
          healthEl.textContent = 'DEMO FALLBACK 🟡';
          healthEl.style.color = 'var(--accent)';
        } else {
          healthEl.textContent = 'DEGRADED 🔴';
          healthEl.style.color = 'var(--danger)';
        }

        if (logsEl) {
          logsEl.textContent = data.errorLog || 'No error log entries.';
        }

        if (thresholdInput && data.lowBalanceThresholdPhp) {
          thresholdInput.value = data.lowBalanceThresholdPhp;
        }
        if (blockOrdersInput) {
          blockOrdersInput.checked = !!data.blockOrdersWhenProviderLow;
        }

        const banner = document.getElementById('admin-provider-low-balance-banner');
        if (banner) {
          if (data.lowBalanceAlert) {
            banner.classList.remove('hidden');
          } else {
            banner.classList.add('hidden');
          }
        }

        // Low provider balance is shown in the persistent admin banner and
        // provider card. Do not interrupt unrelated dashboard work with a modal.
      }
    } catch (e) {
      healthEl.textContent = 'CONN ERROR ❌';
      healthEl.style.color = 'var(--danger)';
      if (logsEl) logsEl.textContent = e.message;
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Refresh provider balances'; }
    }
  }

  async function loadAdminAuditLogs() {
    const tbody = document.getElementById('admin-audit-logs-tbody');
    if (!tbody) return;

    showTableSkeleton(tbody, 8);

    try {
      const res = await request('/api/admin/audit-logs');
      if (res.ok) {
        const logs = await res.json();
        if (logs.length === 0) {
          tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-3">No administrative audit records logged.</td></tr>`;
          return;
        }

        tbody.innerHTML = logs.map(l => {
          const date = new Date(l.created_at || l.createdAt).toLocaleString('en-PH', { dateStyle: 'short', timeStyle: 'short' });
          const adminInfo = l.admin_username ? `<strong>${escapeHtml(l.admin_username)}</strong>` : `<span class="text-muted">System Agent</span>`;
          
          let prev = l.previous_value || l.previousValue || '—';
          let updated = l.new_value || l.newValue || '—';

          if (typeof prev === 'object') prev = JSON.stringify(prev);
          if (typeof updated === 'object') updated = JSON.stringify(updated);
          const auditValue = (label, value) => {
            const clean = String(value || '—');
            const summary = clean.length > 34 ? `${clean.slice(0, 34)}…` : clean;
            return `<details class="audit-value-details"><summary aria-label="View ${label}">${escapeHtml(summary)}</summary><pre>${escapeHtml(clean)}</pre></details>`;
          };

          return `
            <tr>
              <td data-label="Date" style="font-size:0.78rem; color:var(--text-muted);">${date}</td>
              <td data-label="Administrator">${adminInfo}</td>
              <td data-label="Action"><span class="status-badge new" style="background:var(--primary-glow); font-size:0.75rem;">${escapeHtml(l.action_type || l.actionType || 'Edit')}</span></td>
              <td data-label="Module" style="font-size:0.8rem; font-weight:600;">${escapeHtml(l.target_table || l.targetTable || 'API')}</td>
              <td data-label="Affected ID" style="font-size:0.78rem; color:var(--text-muted);">#${l.target_id || l.targetId || '—'}</td>
              <td data-label="Previous">${auditValue('previous value', prev)}</td>
              <td data-label="Updated">${auditValue('new value', updated)}</td>
              <td data-label="Client">
                <div style="font-size:0.75rem; color:var(--text-secondary);">${escapeHtml(l.ip_address || l.ipAddress || '—')}</div>
                <div style="font-size:0.68rem; color:var(--text-muted); max-width:120px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(l.user_agent || l.userAgent || '')}">${escapeHtml(l.user_agent || l.userAgent || 'Unknown')}</div>
              </td>
            </tr>
          `;
        }).join('');
      }
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">❌ Failed to query security audits queue.</td></tr>`;
    }
  }

  async function loadAdminIpBlacklist() {
    bindAdminIpBlacklistControls();
    const tbody = document.getElementById('admin-blacklist-tbody');
    if (!tbody) return;
    
    try {
      const res = await request('/api/admin/ip-block/list');
      if (!res.ok) throw new Error('Failed to load blacklist');
      const data = await res.json();
      const blockedIps = data.blockedIps || [];
      
      // Fetch audit logs to correlate reasons
      let auditLogs = [];
      try {
        const auditRes = await request('/api/admin/audit-logs?limit=200');
        if (auditRes.ok) {
          auditLogs = await auditRes.json();
        }
      } catch (ae) {
        console.warn('Could not fetch audit logs for IP reasons correlation', ae);
      }
      
      if (blockedIps.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-3">No banned IP addresses. All clear!</td></tr>`;
        return;
      }
      
      tbody.innerHTML = blockedIps.map(ip => {
        let reason = 'Banned by Administrator';
        let date = '—';
        
        const ipLogs = auditLogs.filter(l => (l.target_id === ip || l.targetId === ip || l.target_id === String(ip)) && (l.action === 'ip_ban' || l.actionType === 'ip_ban'));
        if (ipLogs.length > 0) {
          const latestLog = ipLogs[0];
          let parsedNew = {};
          if (typeof latestLog.new_value === 'string') {
            try { parsedNew = JSON.parse(latestLog.new_value); } catch(e){}
          } else if (latestLog.new_value) {
            parsedNew = latestLog.new_value;
          } else if (typeof latestLog.newValue === 'string') {
            try { parsedNew = JSON.parse(latestLog.newValue); } catch(e){}
          } else if (latestLog.newValue) {
            parsedNew = latestLog.newValue;
          }
          reason = parsedNew.reason || latestLog.note || 'Banned by Administrator';
          date = new Date(latestLog.created_at || latestLog.createdAt).toLocaleString('en-PH', { dateStyle: 'short', timeStyle: 'short' });
        }
        
        return `<tr>
          <td style="font-weight: 600; font-family: monospace; font-size: 0.85rem; color: var(--danger);">${escapeHtml(ip)}</td>
          <td style="font-size: 0.8rem; color: var(--text-secondary);">${escapeHtml(reason)}</td>
          <td style="font-size: 0.78rem; color: var(--text-muted);">${date}</td>
          <td>
            <button class="btn btn-secondary btn-sm" style="background: var(--success); border-color: transparent; font-size: 0.75rem; padding: 4px 8px; color: #fff;" onclick="window._unbanIp('${escapeHtml(ip)}')">🔓 Unban</button>
          </td>
        </tr>`;
      }).join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger py-3">❌ Failed to load IP blacklist: ${escapeHtml(err.message)}</td></tr>`;
    }
  }

  function bindAdminIpBlacklistControls() {
    const form = document.getElementById('admin-ip-blacklist-form');
    if (form && !form.dataset.listenerAttached) {
      form.dataset.listenerAttached = 'true';
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const ipInput = document.getElementById('admin-blacklist-ip');
        const reasonInput = document.getElementById('admin-blacklist-reason');
        if (!ipInput || !reasonInput) return;
        
        const ip = ipInput.value.trim();
        const reason = reasonInput.value.trim();
        
        try {
          const res = await request('/api/admin/ip-block', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ip, action: 'ban', reason })
          });
          const data = await res.json();
          if (res.ok && data.success) {
            showPremiumToast('IP Blacklisted', `Successfully banned ${ip}!`, 'success');
            ipInput.value = '';
            reasonInput.value = '';
            loadAdminIpBlacklist();
          } else {
            showPremiumToast('Error', data.error || 'Failed to ban IP address.', 'danger');
          }
        } catch (err) {
          showPremiumToast('Error', err.message || 'Failed to communicate with server.', 'danger');
        }
      });
    }
  }

  window._unbanIp = async function(ip) {
    if (!confirm(`Are you sure you want to unban IP: ${ip}?`)) return;
    try {
      const res = await request('/api/admin/ip-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip, action: 'unban' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showPremiumToast('IP Unbanned', `Successfully unblocked ${ip}!`, 'success');
        loadAdminIpBlacklist();
      } else {
        showPremiumToast('Error', data.error || 'Failed to unban IP.', 'danger');
      }
    } catch (err) {
      showPremiumToast('Error', err.message || 'Failed to unban IP.', 'danger');
    }
  };

  // High-performance 3D pointer-tilt: one layout read per frame, skipped on touch/mobile.
  (function init3DTiltAnimation() {
    const tiltSelector = '.premium-tilt, .stat-item, .feature-card, .promo-service-card, .analytics-preview';
    const maxTilt = 8;
    const tiltMotionQuery = window.matchMedia('(min-width: 900px) and (pointer: fine) and (prefers-reduced-motion: no-preference)');

    if (!tiltMotionQuery.matches) return;

    let activeCard = null;
    let rafId = 0;
    let pointerX = 0;
    let pointerY = 0;

    function resetTilt(card) {
      if (!card) return;
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
    }

    function applyTilt() {
      rafId = 0;
      if (!activeCard) return;

      const rect = activeCard.getBoundingClientRect();
      const halfW = Math.max(rect.width * 0.5, 1);
      const halfH = Math.max(rect.height * 0.5, 1);
      const relX = pointerX - rect.left - halfW;
      const relY = pointerY - rect.top - halfH;
      const tiltX = (-relY / halfH) * maxTilt;
      const tiltY = (relX / halfW) * maxTilt;

      activeCard.style.setProperty('--tilt-x', `${tiltX.toFixed(2)}deg`);
      activeCard.style.setProperty('--tilt-y', `${tiltY.toFixed(2)}deg`);
    }

    function scheduleTilt() {
      if (!rafId) rafId = window.requestAnimationFrame(applyTilt);
    }

    function handlePointerMove(event) {
      if (!tiltMotionQuery.matches) return;

      const card = event.target.closest(tiltSelector);
      if (!card) {
        if (activeCard) {
          resetTilt(activeCard);
          activeCard = null;
        }
        return;
      }

      if (activeCard && activeCard !== card) resetTilt(activeCard);
      activeCard = card;
      pointerX = event.clientX;
      pointerY = event.clientY;
      scheduleTilt();
    }

    function handlePointerLeave() {
      if (activeCard) {
        resetTilt(activeCard);
        activeCard = null;
      }
    }

    document.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.addEventListener('pointerleave', handlePointerLeave, { passive: true });

    const disableTiltOnCoarse = () => {
      if (!tiltMotionQuery.matches && activeCard) {
        resetTilt(activeCard);
        activeCard = null;
        if (rafId) {
          window.cancelAnimationFrame(rafId);
          rafId = 0;
        }
      }
    };

    if (typeof tiltMotionQuery.addEventListener === 'function') {
      tiltMotionQuery.addEventListener('change', disableTiltOnCoarse);
    } else if (typeof tiltMotionQuery.addListener === 'function') {
      tiltMotionQuery.addListener(disableTiltOnCoarse);
    }
  })();

  // Hash code helper
  function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
  }

  // --- USER NOTIFICATIONS SYSTEM ---
  let notificationPollInterval = null;
  function initUserNotifications() {
    const notifBtn = document.getElementById('nav-notification-btn');
    const updatesDropdown = document.getElementById('updates-dropdown');
    const updatesBackdrop = document.getElementById('updates-dropdown-backdrop');
    const updatesClose = document.getElementById('updates-dropdown-close');
    const updatesClearBtn = document.getElementById('updates-clear-btn');
    const updatesList = document.getElementById('updates-list');
    const notifBadge = document.getElementById('nav-notification-badge');
    const notifWrap = document.getElementById('nav-notification-wrap');

    if (!notifBtn || !updatesDropdown || !updatesList) return;

    // Toggle dropdown open/close
    notifBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const isHidden = updatesDropdown.classList.contains('hidden');
      if (isHidden) {
        // Close all other overlays before opening updates dropdown
        closeAllOverlays('updates');

        updatesDropdown.classList.remove('hidden');
        updatesBackdrop.classList.remove('hidden');
        notifWrap.classList.add('active');
        await loadUserNotifications();
        syncAppShellState();
      } else {
        closeNotificationsDropdown();
      }
    });

    const closeNotificationsDropdown = () => {
      updatesDropdown.classList.add('hidden');
      updatesBackdrop.classList.add('hidden');
      if (notifWrap) notifWrap.classList.remove('active');
      syncAppShellState();
    };

    if (updatesClose) updatesClose.addEventListener('click', closeNotificationsDropdown);
    if (updatesBackdrop) updatesBackdrop.addEventListener('click', closeNotificationsDropdown);

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeNotificationsDropdown();
    });

    // Mark all read
    if (updatesClearBtn) {
      updatesClearBtn.addEventListener('click', async () => {
        try {
          updatesClearBtn.disabled = true;
          const res = await request('/api/user/notifications/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ all: true })
          });
          if (res.ok) {
            await loadUserNotifications();
            showPremiumToast('Notifications', 'All notifications marked as read', 'success');
          }
        } catch (err) {
          console.error(err);
        } finally {
          updatesClearBtn.disabled = false;
        }
      });
    }

    // Individual read function on window
    window._readNotification = async function(id, event) {
      if (event) event.stopPropagation();
      try {
        const res = await request('/api/user/notifications/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationId: id })
        });
        if (res.ok) {
          await loadUserNotifications();
        }
      } catch (err) {
        console.error(err);
      }
    };

    async function loadUserNotifications() {
      try {
        const res = await request('/api/user/notifications?limit=50');
        if (!res.ok) return;
        const data = await res.json();
        const notifications = data.notifications || [];
        const unreadCount = data.unreadCount || 0;

        // Update badge
        if (notifBadge) {
          if (unreadCount > 0) {
            notifBadge.textContent = unreadCount;
            notifBadge.classList.remove('hidden');
          } else {
            notifBadge.textContent = '0';
            notifBadge.classList.add('hidden');
          }
        }

        // Render notifications list
        if (notifications.length === 0) {
          updatesList.innerHTML = '<div class="updates-empty">No new updates yet.</div>';
          if (updatesClearBtn) updatesClearBtn.disabled = true;
        } else {
          if (updatesClearBtn) updatesClearBtn.disabled = false;
          updatesList.innerHTML = notifications.map(notif => {
            const isRead = !notif.unread;
            return `
              <div class="updates-item ${isRead ? 'updates-read' : ''}" data-id="${notif.id}" style="margin-bottom:8px;">
                <div class="updates-item-header" style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                  <span class="updates-pill" style="font-size:0.68rem; padding:2px 6px; border-radius:99px; border:1px solid; text-transform:uppercase;">${escapeHtml(notif.type || 'system')}</span>
                  <span class="updates-time" style="font-size:0.7rem; color:var(--text-muted);">${new Date(notif.createdAt || notif.created_at).toLocaleDateString()}</span>
                </div>
                <strong style="display:block; margin:6px 0 4px; color:#fff; font-size:0.88rem;">${escapeHtml(notif.title || '')}</strong>
                <p style="margin:0; font-size:0.8rem; color:var(--text-muted); line-height:1.4;">${escapeHtml(notif.message || '')}</p>
                <div class="updates-actions">
                  ${!isRead ? `<button class="updates-open-btn" onclick="window._readNotification(${notif.id}, event)">Mark as Read</button>` : ''}
                </div>
              </div>
            `;
          }).join('');
        }
      } catch (err) {
        console.error('Failed to load user notifications:', err);
      }
    }

    // Export load function to state/window so it can be called elsewhere
    window.syncUserNotifications = loadUserNotifications;

    // Start polling if user is logged in
    if (notificationPollInterval) clearInterval(notificationPollInterval);
    notificationPollInterval = setInterval(() => {
      if (getAuthToken()) {
        loadUserNotifications();
      }
    }, 30000);

    // Initial fetch if logged in
    if (getAuthToken()) {
      loadUserNotifications();
    }
  }

  // Initialize notifications
  initUserNotifications();
});

// Load deferred motion/landing bundle after core app is interactive.
(function loadApexDeferredBundle() {
  if (window.__apexDeferredScheduled) return;
  window.__apexDeferredScheduled = true;

  const schedule = window.requestIdleCallback
    ? (cb) => window.requestIdleCallback(cb, { timeout: 2500 })
    : (cb) => window.setTimeout(cb, 1200);

  const injectDeferredBundle = () => {
    if (document.querySelector('script[data-apex-deferred="1"]')) return;

    const coreScript = document.querySelector('script[data-apex-core="1"]');
    const cacheVersion = (() => {
      const src = coreScript?.getAttribute('src') || '';
      const match = src.match(/[?&]v=([^&]+)/);
      return match ? match[1] : '20260617-apex-pro-v49';
    })();

    const script = document.createElement('script');
    script.src = `/app-deferred.min.js?v=${cacheVersion}`;
    script.defer = true;
    script.setAttribute('data-apex-deferred', '1');
    document.body.appendChild(script);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => schedule(injectDeferredBundle), { once: true });
  } else {
    schedule(injectDeferredBundle);
  }
})();

// Movable assistant widgets: pointer/touch dragging with persisted, bounded positions.
(function initMovableAssistants() {
  const STORAGE_PREFIX = 'apexboost_assistant_position_v2_';
  const EDGE = 8;
  const MOBILE_NAV_CLEARANCE = 84;
  const configs = [
    { key: 'openclaw', widgetId: 'ai-chat-widget', handleId: 'ai-chat-fab' },
    { key: 'hermes', widgetId: 'apexbot-top-widget', handleId: 'apexbot-top-fab' },
    { key: 'whatsapp', widgetId: 'messenger-fab', handleId: 'messenger-fab' }
  ];

  const viewport = () => ({
    width: window.visualViewport?.width || window.innerWidth,
    height: window.visualViewport?.height || window.innerHeight
  });
  const storageKey = key => `${STORAGE_PREFIX}${key}_${window.innerWidth < 768 ? 'mobile' : 'desktop'}`;

  function clampPosition(widget, left, top) {
    const vp = viewport();
    const rect = widget.getBoundingClientRect();
    const mobileClearance = window.innerWidth < 768 ? MOBILE_NAV_CLEARANCE : EDGE;
    return {
      left: Math.max(EDGE, Math.min(left, vp.width - Math.max(rect.width, 48) - EDGE)),
      top: Math.max(EDGE, Math.min(top, vp.height - Math.max(rect.height, 48) - mobileClearance))
    };
  }

  function applyPosition(widget, position, persist = false, key = '') {
    if (!widget || widget.classList.contains('hidden')) return;
    const clamped = clampPosition(widget, Number(position.left || 0), Number(position.top || 0));
    widget.style.setProperty('--fab-user-left', `${Math.round(clamped.left)}px`);
    widget.style.setProperty('--fab-user-top', `${Math.round(clamped.top)}px`);
    widget.style.setProperty('left', `${Math.round(clamped.left)}px`, 'important');
    widget.style.setProperty('top', `${Math.round(clamped.top)}px`, 'important');
    widget.style.setProperty('right', 'auto', 'important');
    widget.style.setProperty('bottom', 'auto', 'important');
    if (!widget.classList.contains('fab-user-positioned')) {
      widget.classList.add('fab-user-positioned');
    }
    if (persist && key) {
      const vp = viewport();
      localStorage.setItem(storageKey(key), JSON.stringify({
        x: clamped.left / Math.max(vp.width, 1),
        y: clamped.top / Math.max(vp.height, 1)
      }));
    }
  }

  function restorePosition(widget, key) {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey(key)) || 'null');
      if (!saved || !Number.isFinite(saved.x) || !Number.isFinite(saved.y)) return;
      const vp = viewport();
      applyPosition(widget, { left: saved.x * vp.width, top: saved.y * vp.height }, false, key);
    } catch (_) {
      localStorage.removeItem(storageKey(key));
    }
  }

  function resetPosition(widget, key) {
    localStorage.removeItem(storageKey(key));
    widget.classList.remove('fab-user-positioned', 'is-dragging');
    widget.style.removeProperty('--fab-user-left');
    widget.style.removeProperty('--fab-user-top');
    widget.style.removeProperty('left');
    widget.style.removeProperty('top');
    widget.style.removeProperty('right');
    widget.style.removeProperty('bottom');
    document.body.classList.remove('fab-drag-active');
  }

  function bind(config) {
    const widget = document.getElementById(config.widgetId);
    const handle = document.getElementById(config.handleId);
    if (!widget || !handle || handle.dataset.dragBound === 'true') return;
    handle.dataset.dragBound = 'true';
    handle.setAttribute('aria-describedby', `${config.handleId}-drag-help`);
    const help = document.createElement('span');
    help.id = `${config.handleId}-drag-help`;
    help.className = 'sr-only';
    help.textContent = 'Drag to move. Use Control plus arrow keys for precise movement.';
    widget.appendChild(help);

    let drag = null;
    let suppressClick = false;
    const finish = event => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      if (drag.moved) {
        applyPosition(widget, {
          left: parseFloat(widget.style.getPropertyValue('--fab-user-left')),
          top: parseFloat(widget.style.getPropertyValue('--fab-user-top'))
        }, true, config.key);
        suppressClick = true;
      }
      widget.classList.remove('is-dragging');
      document.body.classList.remove('fab-drag-active');
      try { handle.releasePointerCapture(event.pointerId); } catch (_) {}
      drag = null;
    };

    handle.addEventListener('pointerdown', event => {
      if (event.button !== undefined && event.button !== 0) return;
      const rect = widget.getBoundingClientRect();
      drag = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, left: rect.left, top: rect.top, moved: false };
      handle.setPointerCapture(event.pointerId);
    });
    handle.addEventListener('pointermove', event => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;
      if (!drag.moved && Math.hypot(dx, dy) < 7) return;
      drag.moved = true;
      widget.classList.add('is-dragging');
      document.body.classList.add('fab-drag-active');
      applyPosition(widget, { left: drag.left + dx, top: drag.top + dy }, false, config.key);
      event.preventDefault();
    }, { passive: false });
    handle.addEventListener('pointerup', finish);
    handle.addEventListener('pointercancel', finish);
    handle.addEventListener('click', event => {
      if (!suppressClick) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      suppressClick = false;
    }, true);
    handle.addEventListener('keydown', event => {
      if (!(event.ctrlKey || event.metaKey) || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
      const rect = widget.getBoundingClientRect();
      const delta = event.shiftKey ? 24 : 12;
      const next = { left: rect.left, top: rect.top };
      if (event.key === 'ArrowLeft') next.left -= delta;
      if (event.key === 'ArrowRight') next.left += delta;
      if (event.key === 'ArrowUp') next.top -= delta;
      if (event.key === 'ArrowDown') next.top += delta;
      applyPosition(widget, next, true, config.key);
      event.preventDefault();
    });

    document.querySelectorAll(`[data-reset-assistant="${config.key}"]`).forEach(button => {
      button.addEventListener('click', event => {
        event.stopPropagation();
        resetPosition(widget, config.key);
      });
    });
    let wasHidden = widget.classList.contains('hidden');
    new MutationObserver(() => {
      const isHidden = widget.classList.contains('hidden');
      if (wasHidden && !isHidden) restorePosition(widget, config.key);
      wasHidden = isHidden;
    }).observe(widget, { attributes: true, attributeFilter: ['class'] });
    restorePosition(widget, config.key);
  }

  const initialize = () => configs.forEach(bind);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
  const reclamp = () => configs.forEach(config => {
    const widget = document.getElementById(config.widgetId);
    if (widget?.classList.contains('fab-user-positioned')) restorePosition(widget, config.key);
  });
  window.addEventListener('resize', reclamp, { passive: true });
  window.visualViewport?.addEventListener('resize', reclamp, { passive: true });
})();

