/* ApexBoost deferred bundle: landing motion, AI chat, UX polish. Loaded after idle. */

/* ── Navbar scroll effect ── */
(function initNavbarScroll() {
  const nav = document.getElementById('main-nav');
  if (!nav) return;
  let ticking = false;
  const handler = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        nav.classList.toggle('scrolled', window.scrollY > 40);
        ticking = false;
      });
      ticking = true;
    }
  };
  window.addEventListener('scroll', handler, { passive: true });
  handler();
})();

/* ── Active nav link on scroll ── */
(function initNavHighlight() {
  const sections = ['hero','services-promo','reseller-api','faq'];
  const links = { 'hero': 'nav-home', 'services-promo': 'nav-features', 'reseller-api': 'nav-api', 'faq': 'nav-faq' };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting && links[e.target.id]) {
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        const link = document.getElementById(links[e.target.id]);
        if (link) link.classList.add('active');
      }
    });
  }, { threshold: 0.4 });
  sections.forEach(id => { const el = document.getElementById(id); if (el) observer.observe(el); });
})();

function isMotionAllowed() {
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    && !window.matchMedia('(max-width: 760px), (pointer: coarse)').matches;
}

function runWhenReady(callback) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback, { once: true });
    return;
  }
  callback();
}

function initRevealOnScroll() {
  const revealTargets = Array.from(document.querySelectorAll('.reveal-on-scroll'));
  if (!revealTargets.length) return;

  const markVisible = (target) => {
    if (!target.classList.contains('is-visible')) {
      target.classList.add('is-visible');
    }
  };

  if (!isMotionAllowed()) {
    revealTargets.forEach(markVisible);
    return;
  }

  if (!('IntersectionObserver' in window)) {
    revealTargets.forEach(markVisible);
    return;
  }

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      markVisible(entry.target);
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -4% 0px' });

  revealTargets.forEach((target) => {
    const rect = target.getBoundingClientRect();
    const inView = rect.bottom > 0 && rect.top < window.innerHeight;
    if (inView) {
      markVisible(target);
      return;
    }
    revealObserver.observe(target);
  });
}

runWhenReady(initRevealOnScroll);

// Global UX polish: lightweight reveal motion and button feedback for landing + dashboard.
runWhenReady(() => {
  const motionAllowed = isMotionAllowed();
  document.documentElement.classList.add(motionAllowed ? 'ux-motion-ready' : 'ux-motion-reduced');
  const revealSelector = [
    '.hero-text-content',
    '.hero-graphic-container',
    '.feature-card',
    '.promo-service-card',
    '.dashboard-card',
    '.form-card',
    '.table-card',
    '.service-card',
    '.user-summary-card',
    '.support-policy-panel',
    '.profile-dropdown-menu',
    '.updates-item',
    '.ai-chat-panel'
  ].join(',');

  function markRevealElements(root = document) {
    if (!motionAllowed || !root.querySelectorAll) return;
    root.querySelectorAll(revealSelector).forEach((el, index) => {
      if (el.dataset.uxRevealReady === 'true') return;
      el.dataset.uxRevealReady = 'true';
      el.style.setProperty('--ux-reveal-delay', `${Math.min(index % 6, 5) * 34}ms`);
      el.classList.add('ux-reveal');
    });
  }

  if (motionAllowed && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('ux-reveal-in');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    const observeReady = (root = document) => {
      markRevealElements(root);
      root.querySelectorAll?.('.ux-reveal:not(.ux-reveal-in)').forEach((el) => observer.observe(el));
    };

    observeReady();
    new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node && node.nodeType === 1) observeReady(node);
        });
      });
    }).observe(document.body, { childList: true, subtree: true });
  }

  document.addEventListener('pointerdown', (event) => {
    const target = event.target.closest?.('.btn, .ai-send-btn, .ai-chat-fab, .nav-notification-btn, .updates-open-btn, .updates-delete-btn, .sidebar-nav-link, .top-tab-btn, .subtab-btn');
    if (!target || target.classList.contains('is-rippling')) return;
    window.requestAnimationFrame(() => {
      target.classList.add('is-rippling');
      window.setTimeout(() => target.classList.remove('is-rippling'), 360);
    });
  }, { passive: true });
});

// ==========================================================================
// AI CHAT WIDGET — ApexBot powered by ApexBoost AI
// ==========================================================================
(function() {
  const widget    = document.getElementById('ai-chat-widget');
  const fab       = document.getElementById('ai-chat-fab');
  const panel     = document.getElementById('ai-chat-panel');
  const closeBtn  = document.getElementById('ai-chat-close');
  const input     = document.getElementById('ai-chat-input');
  const sendBtn   = document.getElementById('ai-send-btn');
  const msgsEl    = document.getElementById('ai-chat-messages');
  const unreadBadge = document.getElementById('ai-unread-badge');

  if (!fab) return;

  let chatHistory = []; // [{role, content}]
  let isOpen = false;
  let isSending = false;
  const chatId = getOrCreateAiChatId();

  function setAiHelpVisibility(visible) {
    if (!widget) return;
    widget.classList.toggle('hidden', !visible);
    widget.classList.toggle('ai-vip-unlocked', Boolean(visible));
    widget.setAttribute('aria-hidden', visible ? 'false' : 'true');
    if (!visible) closeChat();
  }

  window.apexboostSetAiHelpVisibility = setAiHelpVisibility;

  function getOrCreateAiChatId() {
    const key = 'apexboost_ai_help_chat_id';
    try {
      const existing = localStorage.getItem(key);
      if (existing && /^[a-zA-Z0-9:_-]{12,96}$/.test(existing)) return existing;
      const bytes = new Uint8Array(12);
      window.crypto?.getRandomValues?.(bytes);
      const random = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('') || `${Date.now()}${Math.random()}`;
      const created = `webchat_${random}`;
      localStorage.setItem(key, created);
      return created;
    } catch (_err) {
      return `webchat_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    }
  }

  function escapeAiChatText(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function openChat() {
    if (typeof window.__closeHermesSuggestions === 'function') {
      window.__closeHermesSuggestions();
    }
    isOpen = true;
    panel.classList.remove('hidden');
    unreadBadge.classList.add('hidden');
    document.body.classList.add('ai-chat-open');
    input.focus();
    scrollToBottom();
  }

  function closeChat() {
    isOpen = false;
    panel.classList.add('hidden');
    document.body.classList.remove('ai-chat-open');
  }

  window.apexboostCloseAiChat = closeChat;

  fab.addEventListener('click', () => {
    if (widget && widget.classList.contains('hidden')) return;
    if (window.__apexFabWasDragged) return;
    isOpen ? closeChat() : openChat();
  });
  closeBtn.addEventListener('click', closeChat);
  setInterval(() => {
    if (isOpen) pollOpenClawCallbackReplies();
  }, 8000);

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
  sendBtn.addEventListener('click', sendMessage);

  function scrollToBottom() {
    setTimeout(() => { msgsEl.scrollTop = msgsEl.scrollHeight; }, 50);
  }

  function appendMessage(role, content) {
    const div = document.createElement('div');
    div.className = `ai-msg ai-msg-${role === 'user' ? 'user' : 'bot'}`;
    div.innerHTML = `<div class="ai-bubble">${escapeAiChatText(content).replace(/\n/g, '<br>')}</div>`;
    msgsEl.appendChild(div);
    scrollToBottom();
    return div;
  }

  async function pollOpenClawCallbackReplies() {
    try {
      const res = await safeFetch(`/api/ai/chat/replies/${encodeURIComponent(chatId)}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) return false;
      const data = await res.json();
      const replies = Array.isArray(data.replies) ? data.replies : [];
      replies.forEach((item) => {
        const reply = item.reply || item.message || item.text;
        if (reply) {
          appendMessage('bot', reply);
          chatHistory.push({ role: 'assistant', content: reply });
        }
      });
      return replies.length > 0;
    } catch (_err) {
      return false;
    }
  }

  function showTyping() {
    const div = document.createElement('div');
    div.className = 'ai-msg ai-msg-bot ai-typing-bubble';
    div.innerHTML = `<div class="ai-bubble"><div class="ai-typing-dots"><span></span><span></span><span></span></div></div>`;
    msgsEl.appendChild(div);
    scrollToBottom();
    return div;
  }

  function buildClientApexBotFallback(text) {
    const msg = String(text || '').toLowerCase();
    const isGreeting = ['hi', 'hello', 'hey', 'yo', 'helo', 'kumusta', 'kamusta'].includes(msg.trim());
    if (isGreeting) {
      return 'Hi! I am Hermes. I can help with ApexBoost promos, latest updates, services, orders, add funds, order status, API/pricelist, and account support. What do you want to check?';
    }
    if (msg.includes('promo') || msg.includes('coupon') || msg.includes('code') || msg.includes('update') || msg.includes('latest') || msg.includes('new')) {
      const promoText = document.getElementById('promo-updates-list')?.innerText?.trim() || document.getElementById('summary-announcement')?.innerText?.trim();
      return promoText ? `Here is what is currently posted on ApexBoost:\n${promoText}\n\nUse only promo codes shown in the dashboard/admin announcement. If a code fails, it may be expired, already used, or not eligible for the order amount.` : 'Wala pang posted promo or update na visible right now. Check the dashboard Promo Updates card or ask admin to publish the latest announcement.';
    }
    if (msg.includes('add') && msg.includes('fund')) {
      return 'To add funds: open Add Funds, choose your payment method, enter the amount, reveal the secure instructions, then submit your exact reference ID for admin approval.';
    }
    if (msg.includes('order') || msg.includes('service')) {
      return 'To place an order: go to New Order, choose platform/category/service, enter your target link and quantity, then review the PHP charge before launching.';
    }
    if (msg.includes('history') || msg.includes('status')) {
      return 'For order status, open History and tap Sync Statuses. Only your own orders should appear in your account history.';
    }
    return 'I can help if it is about ApexBoost. Ask me about promos, latest updates, services, prices, placing orders, add funds, order status, API/pricelist, or account support.';
  }

  async function sendMessage() {
    if (widget && widget.classList.contains('hidden')) return;
    const text = input.value.trim();
    if (!text || isSending) return;

    isSending = true;
    sendBtn.disabled = true;
    input.value = '';

    // Append user message
    appendMessage('user', text);
    chatHistory.push({ role: 'user', content: text });

    // Show typing indicator
    const typingEl = showTyping();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      const res = await safeFetch('/api/ai/chat', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatHistory, chat_id: chatId })
      });
      clearTimeout(timeout);

      const data = await res.json();
      if (!res.ok) {
        const quotaReply = data.error || data.message;
        if ((res.status === 401 || res.status === 403 || res.status === 429) && quotaReply) {
          typingEl.remove();
          appendMessage('bot', quotaReply);
          chatHistory.push({ role: 'assistant', content: quotaReply });
          if (res.status === 401 || res.status === 403) setAiHelpVisibility(false);
          return;
        }
        throw new Error(quotaReply || 'Server error');
      }
      const reply = data.reply || '';
      if (data.pending) {
        // Backend queued the request to the OpenClaw VPS agent (async reply).
        // Poll GET /api/ai/chat/replies/:chatId every 2s for up to 30s, then fall back to local bot.
        let received = false;
        for (let attempt = 0; attempt < 15 && !received; attempt++) {
          await new Promise(r => setTimeout(r, 2000));
          received = await pollOpenClawCallbackReplies();
        }
        typingEl.remove();
        if (received) {
          if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);
          if (!isOpen) {
            unreadBadge.textContent = '1';
            unreadBadge.classList.remove('hidden');
          }
        } else {
          const fallbackReply = buildClientApexBotFallback(text);
          appendMessage('bot', fallbackReply);
          chatHistory.push({ role: 'assistant', content: fallbackReply });
        }
        return;
      }
      if (!reply) {
        typingEl.remove();
        await pollOpenClawCallbackReplies();
        return;
      }

      typingEl.remove();
      appendMessage('bot', reply);
      chatHistory.push({ role: 'assistant', content: reply });

      // Keep context to last 20 messages
      if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);

      // Show unread badge if panel is closed
      if (!isOpen) {
        unreadBadge.textContent = '1';
        unreadBadge.classList.remove('hidden');
      }
    } catch (err) {
      typingEl.remove();
      const fallbackReply = buildClientApexBotFallback(text);
      appendMessage('bot', fallbackReply);
      chatHistory.push({ role: 'assistant', content: fallbackReply });
    } finally {
      isSending = false;
      sendBtn.disabled = false;
      input.focus();
    }
  }
})();


runWhenReady(() => {
  const motionAllowed = isMotionAllowed();
  const landingView = document.getElementById('landing-page-view');
  const spotlight = document.getElementById('landing-spotlight');

  if (motionAllowed && landingView && spotlight) {
    let rafId = null;
    let nextX = 50;
    let nextY = 35;

    const updateSpotlight = () => {
      document.documentElement.style.setProperty('--spotlight-x', `${nextX}%`);
      document.documentElement.style.setProperty('--spotlight-y', `${nextY}%`);
      rafId = null;
    };

    landingView.addEventListener('pointermove', (event) => {
      const rect = landingView.getBoundingClientRect();
      nextX = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 100;
      nextY = ((event.clientY - rect.top) / Math.max(rect.height, 1)) * 100;
      if (!rafId) rafId = window.requestAnimationFrame(updateSpotlight);
    }, { passive: true });
  }

  const technologyShowcase = document.getElementById('technology-showcase');
  const technologyPanels = Array.from(document.querySelectorAll('[data-technology-panel]'));
  const technologyControls = Array.from(document.querySelectorAll('[data-technology-control]'));
  const technologyStep = document.getElementById('technology-current-step');
  const technologyProgress = document.getElementById('technology-progress-bar');

  if (technologyShowcase && technologyPanels.length && technologyPanels.length === technologyControls.length) {
    let activeTechnology = 0;
    let technologyTimer = null;
    const technologyInterval = 5200;

    const selectTechnology = (index, restart = true) => {
      activeTechnology = (index + technologyPanels.length) % technologyPanels.length;
      const activePanelStyle = window.getComputedStyle(technologyPanels[activeTechnology]);
      const activeAccent = activePanelStyle.getPropertyValue('--technology-accent').trim();
      const activeGlow = activePanelStyle.getPropertyValue('--technology-glow').trim();
      if (activeAccent) technologyShowcase.style.setProperty('--technology-current-accent', activeAccent);
      if (activeGlow) technologyShowcase.style.setProperty('--technology-current-glow', activeGlow);
      technologyPanels.forEach((panel, panelIndex) => {
        const isActive = panelIndex === activeTechnology;
        panel.classList.toggle('is-active', isActive);
        panel.setAttribute('aria-hidden', String(!isActive));
      });
      technologyControls.forEach((control, controlIndex) => {
        const isActive = controlIndex === activeTechnology;
        control.classList.toggle('is-active', isActive);
        control.setAttribute('aria-selected', String(isActive));
        control.tabIndex = isActive ? 0 : -1;
      });
      if (technologyStep) technologyStep.textContent = String(activeTechnology + 1).padStart(2, '0');
      if (technologyProgress) {
        technologyProgress.classList.remove('is-running');
        void technologyProgress.offsetWidth;
        if (motionAllowed) technologyProgress.classList.add('is-running');
      }
      if (restart && motionAllowed) startTechnologyRotation();
    };

    const stopTechnologyRotation = () => {
      if (technologyTimer) window.clearInterval(technologyTimer);
      technologyTimer = null;
    };

    const startTechnologyRotation = () => {
      stopTechnologyRotation();
      technologyTimer = window.setInterval(() => selectTechnology(activeTechnology + 1, false), technologyInterval);
    };

    technologyControls.forEach((control, controlIndex) => {
      control.addEventListener('click', () => selectTechnology(controlIndex));
      control.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const nextIndex = event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? technologyControls.length - 1
            : activeTechnology + (event.key === 'ArrowRight' ? 1 : -1);
        selectTechnology(nextIndex);
        technologyControls[activeTechnology].focus();
      });
    });

    technologyShowcase.addEventListener('pointerenter', stopTechnologyRotation);
    technologyShowcase.addEventListener('pointerleave', () => {
      if (motionAllowed) startTechnologyRotation();
    });
    technologyShowcase.addEventListener('focusin', stopTechnologyRotation);
    technologyShowcase.addEventListener('focusout', (event) => {
      if (motionAllowed && !technologyShowcase.contains(event.relatedTarget)) startTechnologyRotation();
    });

    selectTechnology(0, false);
    if (motionAllowed) startTechnologyRotation();
  }

  // Premium 3D tilt is handled in app.js (single rAF-delegated path).

  const statNums = Array.from(document.querySelectorAll('.hero-stats .stat-num'));
  const animateStats = () => {
    if (!motionAllowed) return;
    statNums.forEach((stat) => {
      if (stat.dataset.animated === 'true') return;
      stat.dataset.animated = 'true';
      const target = stat.textContent.trim();
      const numeric = parseFloat(target.replace(/[^0-9.]/g, ''));
      if (!Number.isFinite(numeric)) return;
      const suffix = target.replace(/[0-9.]/g, '');
      const decimalMatch = target.match(/\.(\d+)/);
      const decimals = decimalMatch ? decimalMatch[1].length : 0;
      const started = performance.now();
      const duration = 1100;

      const tick = (now) => {
        const progress = Math.min((now - started) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = numeric * eased;
        stat.textContent = `${value.toFixed(decimals)}${suffix}`;
        if (progress < 1) {
          window.requestAnimationFrame(tick);
        } else {
          stat.textContent = target;
        }
      };

      window.requestAnimationFrame(tick);
    });
  };

  const statsWrap = document.querySelector('.hero-stats');
  if (statsWrap && 'IntersectionObserver' in window) {
    const statsObserver = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        animateStats();
        statsObserver.disconnect();
      }
    }, { threshold: 0.35 });
    statsObserver.observe(statsWrap);
  } else {
    animateStats();
  }
});

// ==========================================================================
// HERMES SUGGESTIONS FLOATING WIDGET
// ==========================================================================
(function initHermesSuggestionsWidget() {
  const widget = document.getElementById('apexbot-top-widget');
  const fab = document.getElementById('apexbot-top-fab');
  const panel = document.getElementById('apexbot-top-panel');
  const bodyEl = document.getElementById('apexbot-top-body');
  const footerEl = document.getElementById('apexbot-top-footer');
  const closeBtn = document.getElementById('apexbot-top-close');

  if (!widget || !fab || !panel || !bodyEl) return;

  const PLATFORM_META = {
    facebook: { label: 'Facebook', img: '/images/facebook.png' },
    instagram: { label: 'Instagram', img: '/images/instagram.png' },
    tiktok: { label: 'TikTok', img: '/images/tiktok.png' },
    youtube: { label: 'YouTube', img: '/images/youtube.png' },
    telegram: { label: 'Telegram', img: '/images/telegram.png' },
    twitter: { label: 'X / Twitter', img: '/images/x.png' }
  };

  const NEED_ICONS = {
    followers: '👥',
    reactions: '❤️',
    views: '👁️',
    shares: '↗️',
    comments: '💬',
    members: '👤',
    saves: '🔖',
    boosts: '⚡'
  };

  let panelOpen = false;
  let panelHome = null;
  let currentView = 'platforms';
  let selectedPlatform = '';
  let selectedNeed = '';
  let catalogData = null;
  let catalogPromise = null;

  function hermesAuthFetch(url, options = {}) {
    const headers = { ...(options.headers || {}) };
    const token = localStorage.getItem('apexboost_token');
    if (token) headers.Authorization = `Bearer ${token}`;
    return safeFetch(url, { ...options, headers });
  }

  function escapeHermesHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function restoreHermesPanelToWidget() {
    if (!panelHome || !panelHome.parent) return;
    if (panel.parentElement === document.body) {
      if (panelHome.next) {
        panelHome.parent.insertBefore(panel, panelHome.next);
      } else {
        panelHome.parent.appendChild(panel);
      }
    }
  }

  function mountHermesPanelToBody() {
    if (panel.parentElement === document.body) return;
    panelHome = {
      parent: panel.parentElement,
      next: panel.nextSibling
    };
    document.body.appendChild(panel);
  }

  function closeHermesPanel() {
    panelOpen = false;
    panel.classList.add('hidden');
    widget.classList.remove('hermes-fab-active');
    document.body.classList.remove('apexbot-top-open');
    restoreHermesPanelToWidget();
    panel.classList.remove('apexbot-panel-positioned');
    panel.style.removeProperty('--apexbot-panel-left');
    panel.style.removeProperty('--apexbot-panel-top');
    panel.style.removeProperty('--apexbot-panel-width');
    panel.style.removeProperty('max-height');
    panel.style.removeProperty('position');
    panel.style.removeProperty('left');
    panel.style.removeProperty('top');
    panel.style.removeProperty('right');
    panel.style.removeProperty('bottom');
    panel.style.removeProperty('width');
  }

  function getHermesFabRect() {
    const anchor = fab || widget.querySelector('.apexbot-top-fab');
    return (anchor || widget).getBoundingClientRect();
  }

  function positionHermesPanelNearWidget() {
    if (!panel || panel.classList.contains('hidden')) return;

    const margin = 12;

    if (window.matchMedia('(max-width: 767px)').matches) {
      panel.style.removeProperty('left');
      panel.style.removeProperty('top');
      panel.style.removeProperty('width');
      panel.style.removeProperty('max-height');
      panel.style.removeProperty('position');
      panel.style.removeProperty('right');
      panel.style.removeProperty('bottom');
      return;
    }

    const fabRect = getHermesFabRect();
    const panelWidth = Math.min(400, window.innerWidth - margin * 2);
    const maxPanelHeight = Math.min(560, window.innerHeight - margin * 2);
    panel.style.maxHeight = `${maxPanelHeight}px`;

    const panelHeight = Math.min(panel.scrollHeight || panel.offsetHeight || 420, maxPanelHeight);
    const spaceAbove = fabRect.top - margin;
    const spaceBelow = window.innerHeight - fabRect.bottom - margin;

    let top = fabRect.top - panelHeight - margin;
    if (panelHeight > spaceAbove && spaceBelow >= spaceAbove) {
      top = fabRect.bottom + margin;
    }

    top = Math.max(margin, Math.min(top, window.innerHeight - panelHeight - margin));

    let left = fabRect.right - panelWidth;
    left = Math.max(margin, Math.min(left, window.innerWidth - panelWidth - margin));

    panel.classList.add('apexbot-panel-positioned');
    panel.style.setProperty('--apexbot-panel-left', `${left}px`);
    panel.style.setProperty('--apexbot-panel-top', `${top}px`);
    panel.style.setProperty('--apexbot-panel-width', `${panelWidth}px`);
    panel.style.setProperty('position', 'fixed', 'important');
    panel.style.setProperty('left', `${left}px`, 'important');
    panel.style.setProperty('top', `${top}px`, 'important');
    panel.style.setProperty('right', 'auto', 'important');
    panel.style.setProperty('bottom', 'auto', 'important');
    panel.style.setProperty('width', `${panelWidth}px`, 'important');
  }

  function openHermesPanel() {
    if (widget.classList.contains('hidden')) return;
    if (typeof window.apexboostCloseAiChat === 'function') {
      window.apexboostCloseAiChat();
    }
    panelOpen = true;
    mountHermesPanelToBody();
    panel.classList.remove('hidden');
    widget.classList.add('hermes-fab-active');
    document.body.classList.add('apexbot-top-open');
    const schedulePanelPosition = () => {
      window.requestAnimationFrame(() => {
        positionHermesPanelNearWidget();
        window.requestAnimationFrame(positionHermesPanelNearWidget);
      });
    };

    if (!catalogData) {
      loadHermesCatalog().then(() => {
        renderHermesView();
        schedulePanelPosition();
      });
    } else {
      renderHermesView();
      schedulePanelPosition();
    }
  }

  window.__closeHermesSuggestions = closeHermesPanel;

  async function loadHermesCatalog() {
    if (catalogData) return catalogData;
    if (catalogPromise) return catalogPromise;

    catalogPromise = hermesAuthFetch('/api/apexbot/top-services')
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load Hermes suggestions');
        const data = await res.json();
        catalogData = data;
        return data;
      })
      .catch(() => {
        catalogData = { services: [], platformCounts: {}, needCounts: {} };
        return catalogData;
      })
      .finally(() => {
        catalogPromise = null;
      });

    return catalogPromise;
  }

  function renderHermesView() {
    if (!catalogData) return;

    if (currentView === 'platforms') {
      renderPlatformGrid();
      return;
    }
    if (currentView === 'needs') {
      renderNeedGrid();
      return;
    }
    renderServiceList();
  }

  function renderPlatformGrid() {
    const counts = catalogData.platformCounts || {};
    const platforms = Object.keys(counts).filter((key) => PLATFORM_META[key]);
    if (!platforms.length) {
      bodyEl.innerHTML = '<div class="apexbot-top-empty"><strong>No suggestions yet</strong><span>Try again after services finish loading.</span></div>';
      if (footerEl) footerEl.textContent = '';
      return;
    }

    const cards = platforms.map((platform) => {
      const meta = PLATFORM_META[platform];
      const count = counts[platform] || 0;
      return `
        <button type="button" class="apexbot-top-card" data-hermes-platform="${platform}">
          <img src="${meta.img}" alt="${escapeHermesHtml(meta.label)}">
          <strong>${escapeHermesHtml(meta.label)}</strong>
          <span class="apexbot-count">${count}</span>
        </button>
      `;
    }).join('');

    bodyEl.innerHTML = `
      <h4>Choose a platform</h4>
      <div class="apexbot-top-grid">${cards}</div>
    `;

    bodyEl.querySelectorAll('[data-hermes-platform]').forEach((card) => {
      card.addEventListener('click', () => {
        selectedPlatform = card.getAttribute('data-hermes-platform') || '';
        currentView = 'needs';
        renderHermesView();
      });
    });

    if (footerEl) {
      footerEl.textContent = catalogData.dataNotice || 'Hermes ranks live provider services for your campaigns.';
    }
  }

  function renderNeedGrid() {
    const platformNeeds = (catalogData.needCounts || {})[selectedPlatform] || {};
    const needs = Object.keys(platformNeeds);
    const meta = PLATFORM_META[selectedPlatform] || { label: selectedPlatform, img: '/images/apexboost-site-logo.png' };

    if (!needs.length) {
      currentView = 'services';
      renderServiceList();
      return;
    }

    const cards = needs.map((need) => `
      <button type="button" class="apexbot-top-card" data-hermes-need="${need}">
        <span class="apexbot-need-icon">${NEED_ICONS[need] || '✨'}</span>
        <strong>${escapeHermesHtml(need)}</strong>
        <span class="apexbot-count">${platformNeeds[need] || 0}</span>
      </button>
    `).join('');

    bodyEl.innerHTML = `
      <div class="apexbot-top-breadcrumb">
        <button type="button" data-hermes-back="platforms">← Platforms</button>
        <img src="${meta.img}" alt="${escapeHermesHtml(meta.label)}">
        <span>${escapeHermesHtml(meta.label)}</span>
      </div>
      <h4>What do you need?</h4>
      <div class="apexbot-top-grid">${cards}</div>
    `;

    bodyEl.querySelector('[data-hermes-back="platforms"]')?.addEventListener('click', () => {
      currentView = 'platforms';
      selectedNeed = '';
      renderHermesView();
    });

    bodyEl.querySelectorAll('[data-hermes-need]').forEach((card) => {
      card.addEventListener('click', () => {
        selectedNeed = card.getAttribute('data-hermes-need') || '';
        currentView = 'services';
        renderHermesView();
      });
    });
  }

  function renderServiceList() {
    const meta = PLATFORM_META[selectedPlatform] || { label: selectedPlatform, img: '/images/apexboost-site-logo.png' };
    const services = (catalogData.services || [])
      .filter((svc) => svc.platform === selectedPlatform && (!selectedNeed || svc.need === selectedNeed))
      .slice(0, 8);

    if (!services.length) {
      bodyEl.innerHTML = `
        <div class="apexbot-top-breadcrumb">
          <button type="button" data-hermes-back="needs">← Needs</button>
          <img src="${meta.img}" alt="${escapeHermesHtml(meta.label)}">
          <span>${escapeHermesHtml(meta.label)}</span>
        </div>
        <div class="apexbot-top-empty"><strong>No picks found</strong><span>Try another platform or need type.</span></div>
      `;
      bodyEl.querySelector('[data-hermes-back="needs"]')?.addEventListener('click', () => {
        currentView = 'needs';
        renderHermesView();
      });
      return;
    }

    const cards = services.map((svc, index) => `
      <article class="apexbot-service-card">
        <div class="apexbot-rank">${index + 1}</div>
        <div class="apexbot-service-main">
          <h5>${escapeHermesHtml(svc.name)}</h5>
          <div class="apexbot-progress"><span style="width:${Math.max(12, Math.min(100, svc.recommendationScore || svc.completionRate || 35))}%"></span></div>
          <div class="apexbot-service-stats">
            <strong>₱${Number(svc.rate || 0).toFixed(2)}/1K</strong>
            <span>${escapeHermesHtml(svc.speedLabel || 'Speed not listed')}</span>
          </div>
          <p>${escapeHermesHtml(svc.recommendationReason || 'Hermes recommendation based on live provider data.')}</p>
          <button type="button" class="apexbot-order-btn" data-hermes-service="${escapeHermesHtml(svc.service)}">Launch Campaign</button>
        </div>
      </article>
    `).join('');

    bodyEl.innerHTML = `
      <div class="apexbot-top-breadcrumb">
        <button type="button" data-hermes-back="needs">← Needs</button>
        <img src="${meta.img}" alt="${escapeHermesHtml(meta.label)}">
        <span>${escapeHermesHtml(meta.label)}${selectedNeed ? ` · ${escapeHermesHtml(selectedNeed)}` : ''}</span>
      </div>
      <div class="apexbot-services-list">${cards}</div>
    `;

    bodyEl.querySelector('[data-hermes-back="needs"]')?.addEventListener('click', () => {
      currentView = 'needs';
      renderHermesView();
    });

    bodyEl.querySelectorAll('[data-hermes-service]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const serviceId = btn.getAttribute('data-hermes-service');
        const service = (catalogData.services || []).find((svc) => String(svc.service) === String(serviceId));
        if (!service) return;
        if (typeof window.apexboostSelectHermesService === 'function') {
          window.apexboostSelectHermesService(service);
        }
        closeHermesPanel();
      });
    });
  }

  fab.addEventListener('click', () => {
    if (widget.classList.contains('hidden')) return;
    if (window.__apexFabWasDragged) return;
    panelOpen ? closeHermesPanel() : openHermesPanel();
  });

  closeBtn?.addEventListener('click', closeHermesPanel);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && panelOpen) closeHermesPanel();
  });

  window.__repositionHermesPanel = positionHermesPanelNearWidget;
})();

// ==========================================================================
// DRAGGABLE FLOATING WIDGETS (Hermes, OpenClaw, WhatsApp) — desktop + mobile
// ==========================================================================
(function initDraggableFloatingWidgets() {
  const STORAGE_KEY = 'apexboost_fab_positions_v1';
  const DRAG_THRESHOLD = 10;
  const EDGE_PADDING = 10;

  const WIDGET_CONFIG = [
    { id: 'messenger-fab', handle: null },
    { id: 'apexbot-top-widget', handle: '.apexbot-top-fab' },
    { id: 'ai-chat-widget', handle: '#ai-chat-fab' }
  ];

  window.__apexFabWasDragged = false;
  window.__apexFabDragLock = window.__apexFabDragLock || new Set();

  function isMobileFabDockMode() {
    return window.matchMedia('(max-width: 767px)').matches;
  }

  function resetMobileDockPositions() {
    if (!isMobileFabDockMode()) return;
    WIDGET_CONFIG.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.remove('fab-user-positioned');
      el.style.removeProperty('--fab-user-left');
      el.style.removeProperty('--fab-user-top');
      delete el.dataset.fabUserLeft;
      delete el.dataset.fabUserTop;
    });
  }

  function readPositions() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (_err) {
      return {};
    }
  }

  function writePositions(positions) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
    } catch (_err) {
      /* ignore quota errors */
    }
  }

  function getFabClampSize(el) {
    if (el.id === 'apexbot-top-widget') {
      const anchor = el.querySelector('.apexbot-top-fab');
      if (anchor) {
        const rect = anchor.getBoundingClientRect();
        return { width: rect.width || 64, height: rect.height || 64 };
      }
    }
    if (el.id === 'ai-chat-widget') {
      const anchor = el.querySelector('#ai-chat-fab');
      if (anchor) {
        const rect = anchor.getBoundingClientRect();
        return { width: rect.width || 48, height: rect.height || 48 };
      }
    }
    return { width: el.offsetWidth || 48, height: el.offsetHeight || 48 };
  }

  function clampToViewport(el, x, y) {
    const { width, height } = getFabClampSize(el);
    const maxX = Math.max(EDGE_PADDING, window.innerWidth - width - EDGE_PADDING);
    const maxY = Math.max(EDGE_PADDING, window.innerHeight - height - EDGE_PADDING);
    return {
      x: Math.max(EDGE_PADDING, Math.min(x, maxX)),
      y: Math.max(EDGE_PADDING, Math.min(y, maxY))
    };
  }

  function applyWidgetPosition(el, x, y) {
    const clamped = clampToViewport(el, x, y);
    el.classList.add('fab-user-positioned');
    el.style.setProperty('--fab-user-left', `${clamped.x}px`);
    el.style.setProperty('--fab-user-top', `${clamped.y}px`);
    el.dataset.fabUserLeft = String(clamped.x);
    el.dataset.fabUserTop = String(clamped.y);
    return clamped;
  }

  function restoreSavedPositions() {
    if (isMobileFabDockMode()) {
      resetMobileDockPositions();
      return;
    }
    const saved = readPositions();
    WIDGET_CONFIG.forEach(({ id }) => {
      const el = document.getElementById(id);
      const pos = saved[id];
      if (!el || !pos || typeof pos.x !== 'number' || typeof pos.y !== 'number') return;
      if (el.classList.contains('hidden') || el.classList.contains('apexbot-dismissed')) return;
      applyWidgetPosition(el, pos.x, pos.y);
    });
  }

  function bindDraggable(el, handleSelector) {
    if (!el || el.dataset.fabDragBound === '1') return;
    if (isMobileFabDockMode()) return;
    el.dataset.fabDragBound = '1';

    const handle = handleSelector ? el.querySelector(handleSelector) : el;
    if (!handle) return;

    let pointerId = null;
    let startX = 0;
    let startY = 0;
    let originLeft = 0;
    let originTop = 0;
    let dragging = false;
    let moved = false;

    const getCurrentPosition = () => {
      const rect = el.getBoundingClientRect();
      return { x: rect.left, y: rect.top };
    };

    handle.style.touchAction = 'none';
    handle.setAttribute('aria-grabbed', 'false');

    handle.addEventListener('pointerdown', (event) => {
      if (event.button !== undefined && event.button !== 0) return;
      if (el.classList.contains('hidden') || el.getAttribute('aria-hidden') === 'true') return;

      const current = getCurrentPosition();
      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      originLeft = current.x;
      originTop = current.y;
      dragging = false;
      moved = false;

      try {
        handle.setPointerCapture(pointerId);
      } catch (_err) {
        /* ignore */
      }
    });

    handle.addEventListener('pointermove', (event) => {
      if (pointerId === null || event.pointerId !== pointerId) return;

      const deltaX = event.clientX - startX;
      const deltaY = event.clientY - startY;
      if (!dragging && Math.hypot(deltaX, deltaY) < DRAG_THRESHOLD) return;

      dragging = true;
      moved = true;
      window.__apexFabWasDragged = true;
      document.body.classList.add('fab-drag-active');
      handle.setAttribute('aria-grabbed', 'true');

      const next = applyWidgetPosition(el, originLeft + deltaX, originTop + deltaY);
      originLeft = next.x;
      originTop = next.y;
      startX = event.clientX;
      startY = event.clientY;

      if (typeof window.__closeHermesSuggestions === 'function' && el.id === 'apexbot-top-widget') {
        /* keep panel open but reposition on release */
      }
    });

    const endDrag = (event) => {
      if (pointerId === null || (event.pointerId !== undefined && event.pointerId !== pointerId)) return;

      if (dragging && moved) {
        const rect = el.getBoundingClientRect();
        const positions = readPositions();
        positions[el.id] = { x: rect.left, y: rect.top };
        writePositions(positions);
        window.__apexFabDragLock.add(el.id);
        window.setTimeout(() => window.__apexFabDragLock.delete(el.id), 400);

        if (el.id === 'apexbot-top-widget' && !document.getElementById('apexbot-top-panel')?.classList.contains('hidden')) {
          window.requestAnimationFrame(() => window.__repositionHermesPanel?.());
        }
      }

      pointerId = null;
      dragging = false;
      document.body.classList.remove('fab-drag-active');
      handle.setAttribute('aria-grabbed', 'false');

      window.setTimeout(() => {
        window.__apexFabWasDragged = false;
      }, 0);
    };

    handle.addEventListener('pointerup', endDrag);
    handle.addEventListener('pointercancel', endDrag);

    if (el.tagName === 'A') {
      el.addEventListener('click', (event) => {
        if (window.__apexFabDragLock.has(el.id) || window.__apexFabWasDragged) {
          event.preventDefault();
          event.stopPropagation();
        }
      }, true);
    }
  }

  function initBindings() {
    WIDGET_CONFIG.forEach(({ id, handle }) => {
      const el = document.getElementById(id);
      if (el) bindDraggable(el, handle);
    });
    restoreSavedPositions();
  }

  window.apexboostRestoreFabPositions = restoreSavedPositions;
  window.apexboostInitFabDrag = initBindings;

  runWhenReady(initBindings);

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    if (resizeTimer) window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (isMobileFabDockMode()) {
        resetMobileDockPositions();
        return;
      }
      WIDGET_CONFIG.forEach(({ id }) => {
        const el = document.getElementById(id);
        if (!el || !el.classList.contains('fab-user-positioned')) return;
        const x = Number(el.dataset.fabUserLeft || 0);
        const y = Number(el.dataset.fabUserTop || 0);
        applyWidgetPosition(el, x, y);
      });
      window.__repositionHermesPanel?.();
    }, 120);
  });
})();

if (typeof window.apexboostSyncFloatingWidgets === 'function') {
  window.apexboostSyncFloatingWidgets();
  if (typeof window.apexboostRestoreFabPositions === 'function') {
    window.apexboostRestoreFabPositions();
  }
}
