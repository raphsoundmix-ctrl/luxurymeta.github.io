const site = window.SITE_DATA;

function getInitialLanguage() {
  const saved = localStorage.getItem("luxury-site-lang");
  if (saved === "ru" || saved === "en") return saved;
  return site.defaultLang || "en";
}

const state = {
  lang: getInitialLanguage(),
  activeService: null,
  activeFilter: "all",
  lightboxItem: null
};

const els = {
  servicesGrid: document.getElementById("servicesGrid"),
  featuredWorksGrid: document.getElementById("featuredWorksGrid"),
  serviceFilters: document.getElementById("serviceFilters"),
  showAllWorksBtn: document.getElementById("showAllWorksBtn"),

  serviceDrawer: document.getElementById("serviceDrawer"),
  serviceDrawerBackdrop: document.getElementById("serviceDrawerBackdrop"),
  closeServiceDrawer: document.getElementById("closeServiceDrawer"),
  serviceDrawerEyebrow: document.getElementById("serviceDrawerEyebrow"),
  serviceDrawerTitle: document.getElementById("serviceDrawerTitle"),
  serviceDrawerDescription: document.getElementById("serviceDrawerDescription"),
  servicePortfolioGrid: document.getElementById("servicePortfolioGrid"),
  serviceRequestBtn: document.getElementById("serviceRequestBtn"),
  drawerBrowseBtn: document.getElementById("drawerBrowseBtn"),

  instagramProfileLink: document.getElementById("instagramProfileLink"),
  instagramCtaLink: document.getElementById("instagramCtaLink"),
  instagramFooterLink: document.getElementById("instagramFooterLink"),

  lightbox: document.getElementById("lightbox"),
  lightboxBackdrop: document.getElementById("lightboxBackdrop"),
  closeLightbox: document.getElementById("closeLightbox"),
  lightboxMedia: document.getElementById("lightboxMedia"),
  lightboxService: document.getElementById("lightboxService"),
  lightboxTitle: document.getElementById("lightboxTitle"),
  lightboxDescription: document.getElementById("lightboxDescription"),
  lightboxRequestBtn: document.getElementById("lightboxRequestBtn"),
  lightboxInstagramBtn: document.getElementById("lightboxInstagramBtn"),

  openGlobalFormBtn: document.getElementById("openGlobalFormBtn"),
  openEmbeddedFormBtn: document.getElementById("openEmbeddedFormBtn"),
  mobileRequestBtn: document.getElementById("mobileRequestBtn")
};

const t = (path) => {
  const source = site.translations[state.lang];
  const value = path.split(".").reduce((acc, key) => (acc ? acc[key] : undefined), source);
  return value ?? path;
};

function getServiceById(id) {
  return site.services.find((item) => item.id === id);
}

function getServiceTitle(id) {
  return getServiceById(id)?.title?.[state.lang] || id;
}

function getServiceFormLink(serviceId) {
  const perService = site.forms?.serviceLinks?.[serviceId];
  if (perService && !String(perService).startsWith("REPLACE")) return perService;

  const global = site.forms?.global;
  if (global && !String(global).startsWith("REPLACE")) return global;

  return "#order";
}

function normalizeEmbedUrl(url) {
  if (!url) return "";

  if (url.includes("youtube.com/watch?v=")) {
    const id = url.split("v=")[1]?.split("&")[0];
    return id ? `https://www.youtube.com/embed/${id}` : url;
  }

  if (url.includes("youtu.be/")) {
    const id = url.split("youtu.be/")[1]?.split("?")[0];
    return id ? `https://www.youtube.com/embed/${id}` : url;
  }

  if (url.includes("vimeo.com/") && !url.includes("player.vimeo.com")) {
    const id = url.split("vimeo.com/")[1]?.split("?")[0];
    return id ? `https://player.vimeo.com/video/${id}` : url;
  }

  if (url.includes("drive.google.com/file/d/")) {
    const id = url.split("/file/d/")[1]?.split("/")[0];
    return id ? `https://drive.google.com/file/d/${id}/preview` : url;
  }

  if (url.includes("drive.google.com/open?id=")) {
    const id = url.split("open?id=")[1]?.split("&")[0];
    return id ? `https://drive.google.com/file/d/${id}/preview` : url;
  }

  return url;
}

function resolveWorkTypeLabel(type) {
  if (type === "video") return t("common.typeVideo");
  if (type === "embed") return t("common.typeEmbed");
  return t("common.typeImage");
}

function setInstagramLinks() {
  const links = [
    els.instagramProfileLink,
    els.instagramCtaLink,
    els.instagramFooterLink,
    els.lightboxInstagramBtn
  ];

  links.forEach((link) => {
    if (!link) return;
    link.href = site.instagramUrl;
    link.target = "_blank";
    link.rel = "noreferrer";
  });

  if (els.instagramProfileLink) {
    els.instagramProfileLink.textContent = site.contactLabel;
  }
}

function createServiceCard(service) {
  const card = document.createElement("article");
  card.className = "service-card reveal-up";

  card.innerHTML = `
    <div class="service-card__head">
      <div class="service-card__icon">${service.icon}</div>
      <span class="micro-tag">${service.tags[0] || "Service"}</span>
    </div>

    <div>
      <h3 class="service-card__title">${service.title[state.lang]}</h3>
      <p class="service-card__description">${service.short[state.lang]}</p>
    </div>

    <div class="service-card__tags">
      ${service.tags.map((tag) => `<span class="service-chip">${tag}</span>`).join("")}
    </div>

    <div class="service-card__footer">
      <button type="button" class="service-card__button">${t("common.browseWork")}</button>
      <button type="button" class="service-chip">${t("common.requestService")}</button>
    </div>
  `;

  const buttons = card.querySelectorAll("button");
  const browseBtn = buttons[0];
  const requestBtn = buttons[1];

  browseBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    openServiceDrawer(service.id);
  });

  requestBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    openForm(service.id);
  });

  card.addEventListener("click", () => openServiceDrawer(service.id));

  return card;
}

function renderServices() {
  if (!els.servicesGrid) return;

  els.servicesGrid.innerHTML = "";

  site.services.forEach((service, index) => {
    const card = createServiceCard(service);

    if (index % 3 === 1) card.classList.add("delay-1");
    if (index % 3 === 2) card.classList.add("delay-2");

    els.servicesGrid.appendChild(card);
  });
}

function renderFilters() {
  if (!els.serviceFilters) return;

  els.serviceFilters.innerHTML = "";

  const allButton = document.createElement("button");
  allButton.type = "button";
  allButton.className = `filter-chip ${state.activeFilter === "all" ? "is-active" : ""}`;
  allButton.textContent = t("common.filterAll");
  allButton.addEventListener("click", () => {
    state.activeFilter = "all";
    renderFilters();
    renderWorks();
  });

  els.serviceFilters.appendChild(allButton);

  site.services.forEach((service) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `filter-chip ${state.activeFilter === service.id ? "is-active" : ""}`;
    button.textContent = service.title[state.lang];

    button.addEventListener("click", () => {
      state.activeFilter = service.id;
      renderFilters();
      renderWorks();
    });

    els.serviceFilters.appendChild(button);
  });
}

function createPlaceholderMarkup(serviceTitle, itemTitle) {
  return `
    <div class="work-card__placeholder">
      <span>
        <small>${serviceTitle}</small>
        ${itemTitle}
      </span>
    </div>
  `;
}

function createMediaMarkup(item) {
  const title = item.title[state.lang];
  const serviceTitle = getServiceTitle(item.service);

  if (item.type === "image" && item.media) {
    return `<img class="work-card__image" src="${item.media}" alt="${title}" loading="lazy" />`;
  }

  if (item.type === "video" && item.media) {
    return `
      <video class="work-card__video" preload="metadata" playsinline muted poster="${item.poster || ""}">
        <source src="${item.media}" />
      </video>
    `;
  }

  if ((item.type === "embed" || item.embed) && item.embed) {
    const embed = normalizeEmbedUrl(item.embed);
    return `<iframe class="work-card__embed" src="${embed}" title="${title}" loading="lazy" allowfullscreen></iframe>`;
  }

  return createPlaceholderMarkup(serviceTitle, title);
}

function createWorkCard(item) {
  const card = document.createElement("article");
  card.className = "work-card reveal-up";

  const serviceTitle = getServiceTitle(item.service);
  const title = item.title[state.lang];
  const description = item.description[state.lang];

  const mediaClass =
    item.type === "video"
      ? "work-card__media work-card__media--video"
      : item.embed
        ? "work-card__media work-card__media--embed"
        : "work-card__media";

  card.innerHTML = `
    <button type="button" class="work-card__trigger" aria-label="${title}" style="all:unset; display:block; width:100%; cursor:pointer;">
      <div class="${mediaClass}">
        ${createMediaMarkup(item)}
      </div>
      <div class="work-card__body">
        <div class="work-card__meta">
          <span class="work-card__service">${serviceTitle}</span>
          <span class="work-card__type">${resolveWorkTypeLabel(item.type)}</span>
        </div>
        <h3 class="work-card__title">${title}</h3>
        <p class="work-card__description">${description}</p>
      </div>
    </button>
  `;

  card.querySelector(".work-card__trigger")?.addEventListener("click", () => openLightbox(item));
  return card;
}

function getFilteredPortfolio() {
  if (state.activeFilter === "all") return site.portfolio;
  return site.portfolio.filter((item) => item.service === state.activeFilter);
}

function renderWorks() {
  if (!els.featuredWorksGrid) return;

  els.featuredWorksGrid.innerHTML = "";

  const portfolio =
    state.activeFilter === "all"
      ? site.portfolio.filter((item) => item.featured)
      : getFilteredPortfolio();

  const list = portfolio.length ? portfolio : getFilteredPortfolio();

  list.slice(0, 6).forEach((item, index) => {
    const card = createWorkCard(item);

    if (index % 3 === 1) card.classList.add("delay-1");
    if (index % 3 === 2) card.classList.add("delay-2");

    els.featuredWorksGrid.appendChild(card);
  });
}

function openServiceDrawer(serviceId, options = {}) {
  const service = getServiceById(serviceId);
  if (!service || !els.serviceDrawer) return;

  state.activeService = serviceId;

  if (els.serviceDrawerEyebrow) {
    els.serviceDrawerEyebrow.textContent = t("common.drawerEyebrow");
  }

  if (els.serviceDrawerTitle) {
    els.serviceDrawerTitle.textContent = service.title[state.lang];
  }

  if (els.serviceDrawerDescription) {
    els.serviceDrawerDescription.textContent = service.detail[state.lang];
  }

  if (els.serviceRequestBtn) {
    els.serviceRequestBtn.textContent = t("common.requestService");
    els.serviceRequestBtn.onclick = () => openForm(serviceId);
  }

  if (els.drawerBrowseBtn) {
    els.drawerBrowseBtn.textContent = t("common.browseWork");
    els.drawerBrowseBtn.onclick = (event) => {
      event.preventDefault();
      closeServiceDrawer();
      state.activeFilter = serviceId;
      renderFilters();
      renderWorks();
      document.getElementById("works")?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
  }

  if (els.servicePortfolioGrid) {
    els.servicePortfolioGrid.innerHTML = "";

    const items = site.portfolio.filter((item) => item.service === serviceId);

    if (items.length) {
      items.forEach((item) => {
        els.servicePortfolioGrid.appendChild(createWorkCard(item));
      });
    } else {
      const empty = document.createElement("div");
      empty.className = "principle-card";
      empty.innerHTML = `<p class="contact-card__text">${t("common.portfolioEmpty")}</p>`;
      els.servicePortfolioGrid.appendChild(empty);
    }
  }

  if (!options.preserveState) {
    els.serviceDrawer.classList.add("is-visible");
    els.serviceDrawer.setAttribute("aria-hidden", "false");
    els.serviceDrawerBackdrop?.classList.add("is-visible");
    document.body.style.overflow = "hidden";
  }
}

function closeServiceDrawer() {
  state.activeService = null;

  if (els.serviceDrawer) {
    els.serviceDrawer.classList.remove("is-visible");
    els.serviceDrawer.setAttribute("aria-hidden", "true");
  }

  els.serviceDrawerBackdrop?.classList.remove("is-visible");

  if (!state.lightboxItem) {
    document.body.style.overflow = "";
  }
}

function buildLightboxMedia(item) {
  if (item.type === "image" && item.media) {
    return `<img class="lightbox-image" src="${item.media}" alt="${item.title[state.lang]}" />`;
  }

  if (item.type === "video" && item.media) {
    return `
      <video class="lightbox-video" controls playsinline poster="${item.poster || ""}">
        <source src="${item.media}" />
      </video>
    `;
  }

  if ((item.type === "embed" || item.embed) && item.embed) {
    return `<iframe class="lightbox-embed" src="${normalizeEmbedUrl(item.embed)}" title="${item.title[state.lang]}" allowfullscreen></iframe>`;
  }

  return `
    <div class="work-card__placeholder" style="position:static; min-height:100%;">
      <span>
        <small>${getServiceTitle(item.service)}</small>
        ${item.title[state.lang]}
      </span>
    </div>
  `;
}

function openLightbox(item, options = {}) {
  if (!els.lightbox) return;

  state.lightboxItem = item;

  if (els.lightboxService) {
    els.lightboxService.textContent = getServiceTitle(item.service);
  }

  if (els.lightboxTitle) {
    els.lightboxTitle.textContent = item.title[state.lang];
  }

  if (els.lightboxDescription) {
    els.lightboxDescription.textContent = item.description[state.lang];
  }

  if (els.lightboxMedia) {
    els.lightboxMedia.innerHTML = buildLightboxMedia(item);
  }

  if (els.lightboxRequestBtn) {
    els.lightboxRequestBtn.textContent = t("common.lightboxRequest");
    els.lightboxRequestBtn.onclick = () => openForm(item.service);
  }

  if (!options.preserveState) {
    els.lightbox.classList.add("is-visible");
    els.lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
}

function closeLightbox() {
  state.lightboxItem = null;

  if (els.lightbox) {
    els.lightbox.classList.remove("is-visible");
    els.lightbox.setAttribute("aria-hidden", "true");
  }

  if (!state.activeService) {
    document.body.style.overflow = "";
  }
}

function openForm(serviceId = null) {
  const targetLink = serviceId ? getServiceFormLink(serviceId) : site.forms.global;

  if (!targetLink || targetLink === "#order") {
    document.getElementById("order")?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  window.open(targetLink, "_blank", "noopener,noreferrer");
}

function applyTranslations() {
  document.documentElement.lang = state.lang;

  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const value = t(node.getAttribute("data-i18n"));
    if (value) node.textContent = value;
  });

  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.lang === state.lang);
  });

  renderFilters();
  renderServices();
  renderWorks();

  if (state.activeService) openServiceDrawer(state.activeService, { preserveState: true });
  if (state.lightboxItem) openLightbox(state.lightboxItem, { preserveState: true });
}

function bindEvents() {
  document.querySelectorAll(".lang-btn").forEach((button) => {
    button.addEventListener("click", () => {
      state.lang = button.dataset.lang;
      localStorage.setItem("luxury-site-lang", state.lang);
      applyTranslations();
    });
  });

  els.openGlobalFormBtn?.addEventListener("click", () => openForm());
  els.openEmbeddedFormBtn?.addEventListener("click", () => openForm());
  els.mobileRequestBtn?.addEventListener("click", () => openForm());

  els.showAllWorksBtn?.addEventListener("click", () => {
    state.activeFilter = "all";
    renderFilters();
    renderWorks();
    document.getElementById("works")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  els.closeServiceDrawer?.addEventListener("click", closeServiceDrawer);
  els.serviceDrawerBackdrop?.addEventListener("click", closeServiceDrawer);

  els.closeLightbox?.addEventListener("click", closeLightbox);
  els.lightboxBackdrop?.addEventListener("click", closeLightbox);

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    if (els.lightbox?.classList.contains("is-visible")) closeLightbox();
    if (els.serviceDrawer?.classList.contains("is-visible")) closeServiceDrawer();
  });
}

function init() {
  setInstagramLinks();
  bindEvents();
  applyTranslations();
}

init();
