(async function () {
  const cfg = window.OUTRO_CONFIG || {};

  const app = document.getElementById("app");

  const titleTop = document.getElementById("titleTop");
  const titleBottom = document.getElementById("titleBottom");

  const guestsTitle = document.getElementById("guestsTitle");
  const guestsList = document.getElementById("guestsList");

  const ctaLeadTitle = document.getElementById("ctaLeadTitle");
  const socialsTitle = document.getElementById("socialsTitle");
  const socialsList = document.getElementById("socialsList");
  const forendorsTitle = document.getElementById("forendorsTitle");
  const forendorsText = document.getElementById("forendorsText");
  const forendorsLink = document.getElementById("forendorsLink");

  const supportersTitle = document.getElementById("supportersTitle");
  const supportersTrack = document.getElementById("supportersTrack");
  const supportersThanks = document.getElementById("supportersThanks");

  const footer = document.getElementById("footer");
  const easterEgg = document.getElementById("easterEgg");

  function setText(el, value) {
    if (!el) return;
    el.textContent = value ?? "";
  }

  function renderGuests(list) {
    guestsList.innerHTML = "";
    (list || []).forEach(name => {
      const div = document.createElement("div");
      div.textContent = name;
      guestsList.appendChild(div);
    });
  }

  function iconSvg(name) {
    const icons = {
      web: `
        <svg class="social-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm6.93 9h-3.08a15.7 15.7 0 0 0-1.38-5.01A8.03 8.03 0 0 1 18.93 11zM12 4.04c.83 1.2 1.8 3.48 2.08 6.96H9.92C10.2 7.52 11.17 5.24 12 4.04zM4.07 13h3.08c.12 1.76.57 3.47 1.38 5.01A8.03 8.03 0 0 1 4.07 13zm3.08-2H4.07a8.03 8.03 0 0 1 4.46-5.01A15.7 15.7 0 0 0 7.15 11zm1.77 2h6.16c-.14 1.73-.63 3.99-1.58 5.77-.45.84-.96 1.5-1.5 1.94-.54-.44-1.05-1.1-1.5-1.94-.95-1.78-1.44-4.04-1.58-5.77zm0-2c.14-1.73.63-3.99 1.58-5.77.45-.84.96-1.5 1.5-1.94.54.44 1.05 1.1 1.5 1.94.95 1.78 1.44 4.04 1.58 5.77H8.92zM14.47 18.01A15.7 15.7 0 0 0 15.85 13h3.08a8.03 8.03 0 0 1-4.46 5.01z"/>
        </svg>
      `,
      youtube: `
        <svg class="social-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.6 3.5 12 3.5 12 3.5s-7.6 0-9.4.6A3 3 0 0 0 .5 6.2 31.7 31.7 0 0 0 0 12a31.7 31.7 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.8.6 9.4.6 9.4.6s7.6 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.7 31.7 0 0 0 24 12a31.7 31.7 0 0 0-.5-5.8zM9.75 15.5v-7L16 12l-6.25 3.5z"/>
        </svg>
      `,
      instagram: `
        <svg class="social-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2.2A2.8 2.8 0 0 0 4.2 7v10A2.8 2.8 0 0 0 7 19.8h10a2.8 2.8 0 0 0 2.8-2.8V7A2.8 2.8 0 0 0 17 4.2H7zm5 2.3A5.5 5.5 0 1 1 6.5 12 5.5 5.5 0 0 1 12 6.5zm0 2.2A3.3 3.3 0 1 0 15.3 12 3.3 3.3 0 0 0 12 8.7zm5.8-3.1a1.3 1.3 0 1 1-1.3 1.3 1.3 1.3 0 0 1 1.3-1.3z"/>
        </svg>
      `,
      mastodon: `
        <svg class="social-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21.53 7.14C21.2 4.68 19 3 16.43 3H7.57C5 3 2.8 4.68 2.47 7.14 2.33 8.17 2.2 9.39 2.2 10.9c0 3.04.16 6.05 2.16 7.34 1.2.78 2.8 1.06 4.35 1.12 2.5.1 3.17-.57 3.17-.57l-.07-1.54s-1.45.45-3.08.4c-1.62-.06-3.33-.18-3.6-2.17a4.1 4.1 0 0 1-.04-.59s1.59.39 3.61.48c1.23.05 2.39-.07 3.56-.21 2.26-.27 4.23-1.64 4.48-2.9.39-1.99.36-4.86.36-4.86 0-1.51-.13-2.73-.27-3.76zM17.5 13h-2.17V7.73c0-1.11-.47-1.68-1.4-1.68-1.02 0-1.53.66-1.53 1.98v2.88h-2.16V8.03c0-1.32-.51-1.98-1.53-1.98-.93 0-1.4.57-1.4 1.68V13H5.14V7.57c0-1.11.29-2 .88-2.66.61-.66 1.42-1 2.44-1 .94 0 1.65.36 2.13 1.07l.46.77.46-.77c.48-.71 1.19-1.07 2.13-1.07 1.02 0 1.83.34 2.44 1 .59.66.88 1.55.88 2.66V13z"/>
        </svg>
      `
    };

    return icons[name] || icons.web;
  }

  function renderSocials(items) {
    socialsList.innerHTML = "";

    (items || []).forEach(item => {
      const row = document.createElement("div");
      row.className = "social-item";

      const iconWrap = document.createElement("div");
      iconWrap.className = "social-icon-wrap";
      iconWrap.innerHTML = iconSvg(item.icon);

      const content = document.createElement("div");
      content.className = "social-content";

      const label = document.createElement("div");
      label.className = "social-label";
      label.textContent = item.label || "";

      const value = document.createElement("div");
      value.className = "social-value";
      value.textContent = item.value || "";

      content.appendChild(label);
      content.appendChild(value);

      row.appendChild(iconWrap);
      row.appendChild(content);

      socialsList.appendChild(row);
    });
  }

  async function loadSupporters(jsonFile) {
    const url = new URL(jsonFile, window.location.href);
    url.searchParams.set("v", Date.now().toString());
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Supporters: HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.supporters)) throw new Error("Invalid supporters data");
    return data.supporters;
  }

  function renderSupporters(items) {
    supportersTrack.innerHTML = "";

    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "supporter-empty";
      empty.textContent = "—";
      supportersTrack.appendChild(empty);
      return;
    }

    const standard = items.filter(item => item.tier.toLowerCase() === "standard");
    const midibus = items.filter(item => item.tier.toLowerCase() === "midibus");

    function addTierLabel(text) {
      const label = document.createElement("div");
      label.className = "supporter-tier-label";
      label.textContent = text;
      supportersTrack.appendChild(label);
    }

    function addSupporter(item) {
      const div = document.createElement("div");
      div.className = `supporter ${item.tier.toLowerCase() === "standard" ? "standard" : "midibus"}`;
      div.textContent = item.name;
      supportersTrack.appendChild(div);
    }

    if (standard.length) {
      addTierLabel("Standard");
      standard.forEach(addSupporter);
    }

    if (midibus.length) {
      addTierLabel("Midibus");
      midibus.forEach(addSupporter);
    }
  }

    async function loadSimpleLines(file) {
    try {
      const res = await fetch(file, { cache: "no-store" });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }

      return (await res.text())
        .replace(/^\uFEFF/, "")
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean);
    } catch (err) {
      console.error("Nepodařilo se načíst easter egg CSV:", err);
      return [];
    }
  }

  function shuffleArray(arr) {
    const copy = [...arr];

    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }

    return copy;
  }

  function startEasterEggRotation(items) {
    if (!easterEgg || !items.length) {
      return;
    }

    let pool = shuffleArray(items);
    let index = 0;

    function nextItem() {
      if (index >= pool.length) {
        pool = shuffleArray(items);
        index = 0;
      }

      return pool[index++];
    }

    function showText(text) {
      easterEgg.textContent = text;
      easterEgg.classList.remove("is-hidden");
      easterEgg.classList.add("is-visible");
    }

    function swapText() {
      easterEgg.classList.remove("is-visible");
      easterEgg.classList.add("is-hidden");

      setTimeout(() => {
        showText(nextItem());
      }, 420);
    }

    showText(nextItem());

    if (items.length > 1) {
      setInterval(swapText, cfg.easterEggRotateMs || 15000);
    }
  }

  function startAnimations() {
    setTimeout(() => {
      app.classList.remove("hidden");
    }, 2000);

    setTimeout(() => {
      document.querySelectorAll(".anim").forEach(el => el.classList.add("play"));
    }, 2000);
  }

  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  async function startSupportersScroll() {
    // Wait until the supporters panel has finished its entrance animation.
    await delay(7600);
    const windowEl = document.querySelector(".supporters-window");
    const contentHeight = supportersTrack.scrollHeight;
    const startY = windowEl.clientHeight + 30;
    // An extra margin lets the very last wrapped name leave the mask fully.
    const endY = -contentHeight - 30;
    const configuredSpeed = Number(cfg.supportersSpeedPxPerSec);
    const speed = configuredSpeed > 0 && Number.isFinite(configuredSpeed)
      ? configuredSpeed : 42;
    const durationMs = ((startY - endY) / speed) * 1000;

    supportersTrack.style.opacity = "1";
    const scroll = supportersTrack.animate([
      { transform: `translateY(${startY}px)` },
      { transform: `translateY(${endY}px)` }
    ], { duration: durationMs, easing: "linear", fill: "forwards" });

    // Await actual playback completion instead of a fixed outro deadline.
    await scroll.finished;
    supportersThanks.classList.add("credits-complete");
    const configuredPause = Number(cfg.creditsEndPauseMs);
    await delay(Number.isFinite(configuredPause) && configuredPause >= 0
      ? configuredPause : 3500);
    app.classList.add("fade-out");
  }

  setText(titleTop, cfg.titleTop || "METROBUS");
  setText(titleBottom, cfg.titleBottom || "Pokec");

  setText(guestsTitle, cfg.guestsTitle || "V tomto díle vystoupili");
  renderGuests(cfg.guests || []);

  setText(ctaLeadTitle, cfg.ctaLeadTitle || "Pokračujte s Metrobusem");
  setText(socialsTitle, cfg.socialsTitle || "Najdete nás i jinde");
  renderSocials(cfg.socials || []);
  setText(forendorsTitle, cfg.forendorsTitle || "Forendors");
  setText(forendorsText, cfg.forendorsText || "Celý záznam vysílání a další plné díly podcastů");
  setText(forendorsLink, cfg.forendorsLink || "forendors.cz/metrobuscz");

  setText(supportersTitle, cfg.supportersTitle || "Předplatitelé Metrobusu");
  setText(supportersThanks,(cfg.supportersThanks || "Všem děkujeme za podporu!"));
  setText(footer, cfg.footer || "Metrobus · 2026");

  const supporters = await loadSupporters(cfg.supportersJson || "supporters.json");
  renderSupporters(supporters);

  const easterEggItems = await loadSimpleLines(cfg.easterEggCsv || "easteregg.csv");

  // Loaded fonts may change line wrapping and the total credits height.
  await document.fonts.ready;
  startAnimations();

  setTimeout(() => {
    startEasterEggRotation(easterEggItems);
  }, cfg.easterEggStartDelayMs ?? 9000);

  await startSupportersScroll();
})().catch(err => {
  console.error("Outro initialization failed:", err);
  const notice = document.createElement("div");
  notice.textContent = "Outro: nepodařilo se načíst podporovatele. Obnovte zdroj prohlížeče.";
  notice.style.cssText = "position:fixed;bottom:20px;left:20px;color:white;background:#9b2020;padding:16px;font:24px sans-serif;z-index:9999";
  document.body.appendChild(notice);
});