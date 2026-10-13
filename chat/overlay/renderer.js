// Original Metrobus renderer; transport and promo removed. Animation functions retained.
(function () {
  const overlayViewport = document.getElementById("overlayViewport");
  const popupLayer = document.getElementById("popupLayer");
  const featuredLayer = document.getElementById("featuredLayer");
  const stackLayer = document.getElementById("stackLayer");
  const overlayRoot = document.getElementById("overlayRoot");
  let snapshot = null;
  const EXIT_DURATION_MS = 180;
  const MOVE_DURATION_MS = 220;
  const FEATURED_EXIT_DURATION_MS = 220;
  const FEATURED_ENTER_DURATION_MS = 240;
  const POPUP_EXIT_DURATION_MS = 200;
  const POPUP_ENTER_DURATION_MS = 240;
  const STACK_TOP_BOUNDARY_RATIO = 0.45;
  let stackAnimationRunning = false;
  let pendingStackItems = null;
  let stackMeasureCard = null;
  let featuredAnimationRunning = false;
  let pendingFeaturedTarget = null;
  let currentFeaturedSignature = null;
  let featuredStabilizeUntil = 0;
  let featuredProgressFrame = null;
  let popupAnimationRunning = false;
  let pendingPopupTarget = null;
  let currentPopupSignature = null;
  let popupStabilizeUntil = 0;
  let popupStabilizeTimer = null;
  let popupHasPendingUpdate = false;

  function render() {
    if (!snapshot) return;

    renderStack(snapshot.stack);
    renderHighlighted(snapshot.featured);
    renderPopup(snapshot.popup);
    syncFeaturedProgressLoop();
  }

  function renderHighlighted(featuredState) {
    const target = featuredState.enabled ? featuredState.current : null;
    if (!target && currentFeaturedSignature && Date.now() < featuredStabilizeUntil) {
      return;
    }
    pendingFeaturedTarget = target;
    if (featuredAnimationRunning) {
      return;
    }
    void flushHighlightedTransition();
  }

  async function flushHighlightedTransition() {
    let target = pendingFeaturedTarget;
    pendingFeaturedTarget = null;
    if (!target && currentFeaturedSignature) {
      target = await resolveFeaturedTargetBeforeHide();
    }
    const targetSignature = getFeaturedSignature(target);

    if (targetSignature === currentFeaturedSignature) {
      if (target) {
        patchHighlighted(target);
        syncFeaturedProgress();
      }
      return;
    }

    featuredAnimationRunning = true;

    if (currentFeaturedSignature) {
      await exitHighlighted();
      currentFeaturedSignature = null;
    }

    if (target) {
      await enterHighlighted(target);
      currentFeaturedSignature = targetSignature;
    } else {
      featuredLayer.classList.add("is-empty");
      featuredLayer.innerHTML = "";
    }

    featuredAnimationRunning = false;
    if (getFeaturedSignature(pendingFeaturedTarget) !== currentFeaturedSignature) {
      void flushHighlightedTransition();
    }
  }

  function enterHighlighted(item) {
    featuredLayer.classList.remove("is-empty");
    featuredLayer.innerHTML = `
      <article class="featured-card entering">
        <div class="featured-band">
          <div class="featured-head">
            <div class="featured-author">${escapeHtml(formatAuthorDisplayName(item.authorDisplayName))}</div>
          </div>
          ${item.amountDisplayString ? `<div class="featured-amount">${escapeHtml(item.amountDisplayString)}</div>` : ""}
        </div>
        <div class="featured-body">
          <div class="featured-side">
            ${item.avatarUrl ? `<img class="featured-avatar" src="${item.avatarUrl}" alt="">` : `<div class="featured-avatar"></div>`}
          </div>
          <div class="featured-content">
            <div class="featured-text">${escapeHtml(item.messageTextDisplay)}</div>
          </div>
        </div>
        <div class="featured-progress-track"><div class="featured-progress-fill"></div></div>
      </article>
    `;
    patchHighlighted(item);
    featuredStabilizeUntil = Date.now() + 700;
    syncFeaturedProgress();
    return new Promise((resolve) => {
      window.setTimeout(() => {
        featuredLayer.querySelector(".featured-card")?.classList.remove("entering");
        resolve();
      }, FEATURED_ENTER_DURATION_MS);
    });
  }

  function exitHighlighted() {
    const card = featuredLayer.querySelector(".featured-card");
    if (!card) {
      featuredLayer.classList.add("is-empty");
      return Promise.resolve();
    }
    card.classList.add("exiting");
    return new Promise((resolve) => {
      window.setTimeout(() => {
        featuredLayer.innerHTML = "";
        featuredLayer.classList.add("is-empty");
        resolve();
      }, FEATURED_EXIT_DURATION_MS);
    });
  }

  function getFeaturedSignature(item) {
    if (!item) {
      return null;
    }
    return JSON.stringify({
      messageId: item.messageId,
      authorDisplayName: item.authorDisplayName,
      messageTextDisplay: item.messageTextDisplay,
      avatarUrl: item.avatarUrl,
      amountDisplayString: item.amountDisplayString ?? null
    });
  }

  function patchHighlighted(item) {
    const card = featuredLayer.querySelector(".featured-card");
    if (!card || !item) {
      return;
    }

    const amount = card.querySelector(".featured-amount");
    const existingAvatar = card.querySelector(".featured-avatar");
    const author = card.querySelector(".featured-author");
    const text = card.querySelector(".featured-text");

    if (author) {
      author.textContent = formatAuthorDisplayName(item.authorDisplayName);
    }
    if (text) {
      text.textContent = item.messageTextDisplay || "";
    }

    if (item.avatarUrl) {
      if (existingAvatar?.tagName === "IMG") {
        existingAvatar.src = item.avatarUrl;
      } else {
        const img = document.createElement("img");
        img.className = "featured-avatar";
        img.alt = "";
        img.src = item.avatarUrl;
        existingAvatar?.replaceWith(img);
      }
    } else if (existingAvatar?.tagName !== "DIV") {
      const placeholder = document.createElement("div");
      placeholder.className = "featured-avatar";
      existingAvatar?.replaceWith(placeholder);
    }

    if (item.amountDisplayString) {
      if (amount) {
        amount.textContent = item.amountDisplayString;
      } else {
        const badge = document.createElement("div");
        badge.className = "featured-amount";
        badge.textContent = item.amountDisplayString;
        card.querySelector(".featured-band")?.appendChild(badge);
      }
    } else {
      amount?.remove();
    }
  }

  function renderPopup(popupState) {
    const target = popupState.current || null;
    pendingPopupTarget = target;
    popupHasPendingUpdate = true;
    if (!target && currentPopupSignature && Date.now() < popupStabilizeUntil) {
      schedulePopupRecheck(Math.max(16, popupStabilizeUntil - Date.now() + 10));
      return;
    }
    if (popupAnimationRunning) {
      return;
    }
    void flushPopupTransition();
  }

  async function flushPopupTransition() {
    const target = pendingPopupTarget;
    pendingPopupTarget = null;
    popupHasPendingUpdate = false;
    const targetSignature = getPopupSignature(target);

    if (targetSignature === currentPopupSignature) {
      if (target) {
        patchPopup(target);
      }
      return;
    }

    popupAnimationRunning = true;

    if (currentPopupSignature) {
      await exitPopup();
      currentPopupSignature = null;
    }

    if (target) {
      currentPopupSignature = targetSignature;
      await enterPopup(target);
    } else {
      window.clearTimeout(popupStabilizeTimer);
      popupStabilizeTimer = null;
      popupLayer.classList.add("is-empty");
      popupLayer.innerHTML = "";
    }

    popupAnimationRunning = false;
    if (popupHasPendingUpdate && !pendingPopupTarget && currentPopupSignature && Date.now() < popupStabilizeUntil) {
      schedulePopupRecheck(Math.max(16, popupStabilizeUntil - Date.now() + 10));
      return;
    }
    if (popupHasPendingUpdate && getPopupSignature(pendingPopupTarget) !== currentPopupSignature) {
      void flushPopupTransition();
    }
  }

  function schedulePopupRecheck(delayMs) {
    window.clearTimeout(popupStabilizeTimer);
    popupStabilizeTimer = window.setTimeout(() => {
      popupStabilizeTimer = null;
      if (!popupHasPendingUpdate) {
        pendingPopupTarget = snapshot?.popup?.current || null;
        popupHasPendingUpdate = true;
      }
      if (!popupAnimationRunning) {
        void flushPopupTransition();
      }
    }, delayMs);
  }

  function enterPopup(item) {
    popupLayer.classList.remove("is-empty");
    popupLayer.innerHTML = buildPopupMarkup(item);
    patchPopup(item);
    popupStabilizeUntil = Date.now() + 700;
    return new Promise((resolve) => {
      window.setTimeout(() => {
        popupLayer.querySelector(".popup-card")?.classList.remove("entering");
        resolve();
      }, POPUP_ENTER_DURATION_MS);
    });
  }

  function exitPopup() {
    const card = popupLayer.querySelector(".popup-card");
    if (!card) {
      popupLayer.classList.add("is-empty");
      return Promise.resolve();
    }
    card.classList.add("exiting");
    return new Promise((resolve) => {
      window.setTimeout(() => {
        popupLayer.innerHTML = "";
        popupLayer.classList.add("is-empty");
        resolve();
      }, POPUP_EXIT_DURATION_MS);
    });
  }

  function buildPopupMarkup(item) {
    return `
      <article class="popup-card entering ${escapeAttribute(item.popupKind || item.accentKind || "money")}">
        <div class="popup-body">
          ${item.avatarUrl ? `<img class="popup-avatar" src="${item.avatarUrl}" alt="">` : `<div class="popup-avatar"></div>`}
          <div class="popup-content">
            <div class="popup-author">${escapeHtml(formatAuthorDisplayName(item.authorDisplayName))}</div>
            <div class="popup-summary">${escapeHtml(popupDescriptor(item))}</div>
          </div>
          <div class="popup-amount">${escapeHtml(popupBadgeText(item))}</div>
        </div>
      </article>
    `;
  }

  function getPopupSignature(item) {
    if (!item) {
      return null;
    }
    return JSON.stringify({
      jobId: item.jobId,
      messageId: item.messageId,
      authorDisplayName: item.authorDisplayName,
      summaryText: item.summaryText,
      amountDisplayString: item.amountDisplayString ?? null,
      expiresAt: item.expiresAt
    });
  }

  function patchPopup(item) {
    const card = popupLayer.querySelector(".popup-card");
    if (!card || !item) {
      return;
    }

    card.classList.toggle("money", item.popupKind === "money");
    card.classList.toggle("membership", item.popupKind === "membership");

    const author = card.querySelector(".popup-author");
    const summary = card.querySelector(".popup-summary");
    const amount = card.querySelector(".popup-amount");
    const avatar = card.querySelector(".popup-avatar");

    if (author) {
      author.textContent = formatAuthorDisplayName(item.authorDisplayName);
    }
    if (summary) {
      summary.textContent = popupDescriptor(item);
    }

    if (amount) {
      amount.textContent = popupBadgeText(item);
    }

    if (item.avatarUrl) {
      if (avatar?.tagName === "IMG") {
        avatar.src = item.avatarUrl;
      } else {
        const img = document.createElement("img");
        img.className = "popup-avatar";
        img.alt = "";
        img.src = item.avatarUrl;
        avatar?.replaceWith(img);
      }
    } else if (avatar?.tagName !== "DIV") {
      const placeholder = document.createElement("div");
      placeholder.className = "popup-avatar";
      avatar?.replaceWith(placeholder);
    }
  }

  function syncFeaturedProgressLoop() {
    if (!snapshot?.featured?.current) {
      stopFeaturedProgressLoop();
      return;
    }
    if (featuredProgressFrame) {
      return;
    }
    const tick = () => {
      syncFeaturedProgress();
      if (!snapshot?.featured?.current) {
        stopFeaturedProgressLoop();
        return;
      }
      featuredProgressFrame = window.requestAnimationFrame(tick);
    };
    featuredProgressFrame = window.requestAnimationFrame(tick);
  }

  function stopFeaturedProgressLoop() {
    if (!featuredProgressFrame) {
      return;
    }
    window.cancelAnimationFrame(featuredProgressFrame);
    featuredProgressFrame = null;
  }

  function syncFeaturedProgress() {
    const fill = featuredLayer.querySelector(".featured-progress-fill");
    const current = snapshot?.featured?.current;
    if (!fill || !current) {
      if (fill) {
        fill.style.width = "0%";
      }
      return;
    }
    const totalMs = Math.max(1, Date.parse(current.expiresAt) - Date.parse(current.shownAt));
    const remainingMs = Math.max(0, Date.parse(current.expiresAt) - Date.now());
    const ratio = Math.max(0, Math.min(1, remainingMs / totalMs));
    fill.style.width = `${ratio * 100}%`;
  }

  function popupBadgeText(item) {
    if (item.amountDisplayString) {
      return item.amountDisplayString;
    }
    switch (item.typeLabel) {
      case "newSponsorEvent":
        return "Členství";
      case "memberMilestoneChatEvent":
        return "Milník";
      case "membershipGiftingEvent":
        return "Dar členství";
      case "giftMembershipReceivedEvent":
        return "Přijato";
      default:
        return "Událost";
    }
  }

  function popupDescriptor(item) {
    switch (item.typeLabel) {
      case "superChatEvent":
        return "Darování do chatu";
      case "superStickerEvent":
        return "Super Sticker";
      case "newSponsorEvent":
        return "Nové členství";
      case "memberMilestoneChatEvent":
        return "Členský milník";
      case "membershipGiftingEvent":
        return "Dar členství";
      case "giftMembershipReceivedEvent":
        return "Přijaté darované členství";
      default:
        return "Událost";
    }
  }

  async function resolveFeaturedTargetBeforeHide() { return snapshot?.featured?.current ?? null; }

  function renderStack(stackState) {
    const rawItems = !stackState.enabled || stackState.hardHidden ? [] : stackState.items;
    pendingStackItems = fitStackItemsToRegion(rawItems);
    if (stackAnimationRunning) {
      return;
    }
    flushStackTransition();
  }

  function buildStackCard(item) {
    const card = document.createElement("article");
    card.className = `stack-card ${item.isHighlighted ? "highlight" : ""}`;
    card.setAttribute("data-message-id", item.messageId);
    card.innerHTML = `
      ${item.isHighlighted ? `<div class="stack-superchat-badge" aria-hidden="true">★</div>` : ""}
      ${item.avatarUrl ? `<img class="stack-avatar" src="${item.avatarUrl}" alt="">` : `<div class="stack-avatar"></div>`}
      <div>
        <div class="stack-author"></div>
        <div class="stack-text"></div>
      </div>
    `;
    patchStackCard(card, item);
    return card;
  }

  function fitStackItemsToRegion(items) {
    if (items.length <= 1) {
      return items;
    }

    const fitted = [];
    const maxHeight = getStackMaxHeight();
    const gap = getStackGap();
    let usedHeight = 0;

    for (let index = items.length - 1; index >= 0; index -= 1) {
      const item = items[index];
      const cardHeight = measureStackCardHeight(item);
      const nextHeight = fitted.length === 0 ? cardHeight : usedHeight + gap + cardHeight;
      if (nextHeight > maxHeight) {
        break;
      }
      fitted.unshift(item);
      usedHeight = nextHeight;
    }

    return fitted.length > 0 ? fitted : [items[items.length - 1]];
  }

  function patchStackCard(card, item) {
    card.classList.toggle("highlight", Boolean(item.isHighlighted));
    card.setAttribute("data-message-id", item.messageId);

    const avatar = card.querySelector(".stack-avatar");
    if (item.avatarUrl) {
      if (avatar.tagName !== "IMG") {
        const img = document.createElement("img");
        img.className = "stack-avatar";
        img.alt = "";
        avatar.replaceWith(img);
      }
      card.querySelector(".stack-avatar").src = item.avatarUrl;
    } else if (avatar.tagName !== "DIV") {
      const placeholder = document.createElement("div");
      placeholder.className = "stack-avatar";
      avatar.replaceWith(placeholder);
    }

    card.querySelector(".stack-author").textContent = formatAuthorDisplayName(item.authorDisplayName);
    card.querySelector(".stack-text").textContent = item.messageTextDisplay;
  }

  function animateStackPositions(previousRects, children) {
    for (const child of children) {
      const messageId = child.getAttribute("data-message-id");
      const previousRect = previousRects.get(messageId);
      if (!previousRect) {
        continue;
      }
      const nextRect = child.getBoundingClientRect();
      const deltaY = previousRect.top - nextRect.top;
      if (Math.abs(deltaY) < 1) {
        continue;
      }

      child.style.transition = "none";
      child.style.transform = `translateY(${deltaY}px)`;
      child.getBoundingClientRect();
      requestAnimationFrame(() => {
        child.style.transition = "";
        child.style.transform = "";
      });
    }
  }

  function updateStageScale() {
    const scale = Math.min(
      overlayViewport.clientWidth / 1920,
      overlayViewport.clientHeight / 1080
    ) || 1;
    overlayRoot.style.setProperty("--overlay-stage-scale", String(scale));
  }

  function getStackMaxHeight() {
    return 1080 * (1 - STACK_TOP_BOUNDARY_RATIO) - getSafeBottomInset();
  }

  function getSafeBottomInset() {
    const raw = getComputedStyle(document.documentElement).getPropertyValue("--overlay-safe-bottom").trim();
    const parsed = Number.parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : 32;
  }

  function getStackGap() {
    const raw = getComputedStyle(stackLayer).rowGap || getComputedStyle(stackLayer).gap || "8";
    const parsed = Number.parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : 8;
  }

  function measureStackCardHeight(item) {
    const card = ensureStackMeasureCard();
    patchStackCard(card, item);
    const width = stackLayer.getBoundingClientRect().width || Number.parseFloat(getComputedStyle(stackLayer).width) || 560;
    card.style.width = `${width}px`;
    return Math.ceil(card.getBoundingClientRect().height);
  }

  function ensureStackMeasureCard() {
    if (stackMeasureCard) {
      return stackMeasureCard;
    }

    stackMeasureCard = buildStackCard({
      messageId: "measure",
      authorDisplayName: "",
      messageTextDisplay: "",
      avatarUrl: null,
      isHighlighted: false
    });
    stackMeasureCard.style.position = "absolute";
    stackMeasureCard.style.visibility = "hidden";
    stackMeasureCard.style.pointerEvents = "none";
    stackMeasureCard.style.left = "-99999px";
    stackMeasureCard.style.top = "0";
    stackMeasureCard.style.width = `${Number.parseFloat(getComputedStyle(stackLayer).width) || 560}px`;
    overlayRoot.appendChild(stackMeasureCard);
    return stackMeasureCard;
  }

  function flushStackTransition() {
    if (!pendingStackItems) {
      return;
    }

    const items = pendingStackItems;
    pendingStackItems = null;
    stackAnimationRunning = true;

    const currentCards = Array.from(stackLayer.children).filter((element) => element.hasAttribute("data-message-id"));
    const existing = new Map(currentCards.map((element) => [element.getAttribute("data-message-id"), element]));
    const exitingCards = currentCards.filter((element) => !items.some((item) => item.messageId === element.getAttribute("data-message-id")));

    const continueWithLayout = () => {
      const currentAfterExit = Array.from(stackLayer.children).filter((element) => element.hasAttribute("data-message-id"));
      const previousRects = new Map(
        currentAfterExit.map((element) => [element.getAttribute("data-message-id"), element.getBoundingClientRect()])
      );
      const currentMap = new Map(currentAfterExit.map((element) => [element.getAttribute("data-message-id"), element]));
      const nextChildren = [];
      const enteringCards = [];

      for (const item of items) {
        let card = currentMap.get(item.messageId) || existing.get(item.messageId);
        if (!card) {
          card = buildStackCard(item);
          card.classList.add("pre-enter");
          enteringCards.push(card);
        } else {
          patchStackCard(card, item);
        }
        nextChildren.push(card);
      }

      nextChildren.forEach((child) => stackLayer.appendChild(child));
      animateStackPositions(previousRects, nextChildren);

      window.setTimeout(() => {
        enteringCards.forEach((card) => {
          card.classList.remove("pre-enter");
          card.classList.add("entering");
          window.setTimeout(() => card.classList.remove("entering"), 180);
        });
        stackAnimationRunning = false;
        if (pendingStackItems && !sameMessageOrder(items, pendingStackItems)) {
          flushStackTransition();
        }
      }, MOVE_DURATION_MS);
    };

    if (exitingCards.length > 0) {
      exitingCards.forEach((card) => card.classList.add("exiting"));
      window.setTimeout(() => {
        exitingCards.forEach((card) => card.remove());
        continueWithLayout();
      }, EXIT_DURATION_MS);
      return;
    }

    continueWithLayout();
  }

  function sameMessageOrder(left, right) {
    if (!left || !right || left.length !== right.length) {
      return false;
    }
    return left.every((item, index) => item.messageId === right[index].messageId);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function escapeAttribute(value) {
    return String(value).replace(/[^a-z0-9_-]/gi, "");
  }

  function formatAuthorDisplayName(value) {
    const trimmed = String(value ?? "").trim();
    if (!trimmed) {
      return "Neznamy autor";
    }
    return trimmed.startsWith("@") ? trimmed.slice(1).trimStart() || "Neznamy autor" : trimmed;
  }

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  window.addEventListener("resize", updateStageScale);
  window.applyMetrobusSnapshot = (next) => { snapshot = next; updateStageScale(); render(); };
  updateStageScale();
})();
