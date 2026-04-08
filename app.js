const site = window.SITE_DATA;

const state = {
  lang: localStorage.getItem("luxury-site-lang") || "ru",
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
  instagramHeaderLink: document.getElementById("instagramHeaderLink"),
  instagramProfileLink: document.getElementById("instagramProfileLink"),
  instagramCtaLink: document.getElementById("instagramCtaLink"),
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
  mobileRequestBtn: document.getElementById("mobileRequestBtn"),
  embeddedFormFrame: document.getElementById("embeddedFormFrame"),
  formPlaceholder: document.getElementById("formPlaceholder")
};

const t = (path) => {
  const source = site.translations[state.lang];
  return path.split(".").reduce((acc, key) => (acc ? acc[key] : undefined), source) || path;
};

function getServiceById(id) {
  return site.services.find((item) => item.id === id);
}

function getServiceTitle(id) {
  return getServiceById(id)?.title?.[state.lang] || id;
}

function getServiceFormLink(serviceId) {
  return site.forms.serviceLinks[serviceId] && !site.forms.serviceLinks[serviceId].startsWith("REPLACE")
    ? site.forms.serviceLinks[serviceId]
    : site.forms.global && !site.forms.global.startsWith("REPLACE")
      ? site.forms.global
      : "#order";
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
  return url;
}

function isExternalMedia(item) {
  return Boolean(item.embed);
}

function resolveWorkTypeLabel(type) {
  if (type === "video") return t("common.typeVideo");
  if (type === "embed") return t("common.typeEmbed");
  return t("common.typeImage");
}

function setInstagramLinks() {
  const instagramFooterLink = document.getElementById("instagramFooterLink");
  [els.instagramHeaderLink, els.instagramProfileLink, els.instagramCtaLink, els.lightboxInstagramBtn, instagramFooterLink].forEach((link) => {
    if (!link) return;
    link.href = site.instagramUrl;
  });
  if (els.instagramProfileLink) {
    els.instagramProfileLink.textContent = site.contactLabel;
  }
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
  renderFormShell();

  if (state.activeService) openServiceDrawer(state.activeService, { preserveState: true });
  if (state.lightboxItem) openLightbox(state.lightboxItem, { preserveState: true });
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

  const [browseBtn, requestChip] = card.querySelectorAll("button");
  browseBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    openServiceDrawer(service.id);
  });
  requestChip.addEventListener("click", (event) => {
    event.stopPropagation();
    openForm(service.id);
  });
  card.addEventListener("click", () => openServiceDrawer(service.id));

  return card;
}

function renderServices() {
  els.servicesGrid.innerHTML = "";
  site.services.forEach((service, index) => {
    const card = createServiceCard(service);
    if (index % 3 === 1) card.classList.add("delay-1");
    if (index % 3 === 2) card.classList.add("delay-2");
    els.servicesGrid.appendChild(card);
  });
}

function renderFilters() {
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
  const mediaClass = item.type === "video" ? "work-card__media work-card__media--video" : item.embed ? "work-card__media work-card__media--embed" : "work-card__media";

  card.innerHTML = `
    <button type="button" class="work-card__trigger" aria-label="${title}" style="all:unset; display:block; cursor:pointer;">
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

  card.querySelector(".work-card__trigger").addEventListener("click", () => openLightbox(item));
  return card;
}

function getFilteredPortfolio() {
  const items = state.activeFilter === "all"
    ? site.portfolio
    : site.portfolio.filter((item) => item.service === state.activeFilter);
  return items;
}

function renderWorks() {
  els.featuredWorksGrid.innerHTML = "";
  const portfolio = getFilteredPortfolio().filter((item) => item.featured || state.activeFilter !== "all");
  const list = portfolio.length ? portfolio : getFilteredPortfolio();
  list.slice(0, 6).forEach((item, index) => {
    const card = createWorkCard(item);
    if (index % 3 === 1) card.classList.add("delay-1");
    if (index % 3 === 2) card.classList.add("delay-2");
    els.featuredWorksGrid.appendChild(card);
  });
}

function createServicePortfolio(item) {
  return createWorkCard(item);
}

function openServiceDrawer(serviceId, options = {}) {
  state.activeService = serviceId;
  const service = getServiceById(serviceId);
  if (!service) return;

  els.serviceDrawerEyebrow.textContent = t("common.drawerEyebrow");
  els.serviceDrawerTitle.textContent = service.title[state.lang];
  els.serviceDrawerDescription.textContent = service.detail[state.lang];
  els.serviceRequestBtn.textContent = t("common.requestService");
  els.drawerBrowseBtn.textContent = t("common.browseWork");
  els.serviceRequestBtn.onclick = () => openForm(serviceId);

  els.servicePortfolioGrid.innerHTML = "";
  const items = site.portfolio.filter((item) => item.service === serviceId);
  if (items.length) {
    items.forEach((item) => els.servicePortfolioGrid.appendChild(createServicePortfolio(item)));
  } else {
    const empty = document.createElement("div");
    empty.className = "principle-card";
    empty.innerHTML = `<p class="contact-card__text">${t("common.portfolioEmpty")}</p>`;
    els.servicePortfolioGrid.appendChild(empty);
  }

  if (!options.preserveState) {
    els.serviceDrawer.classList.add("is-visible");
    els.serviceDrawerBackdrop.classList.add("is-visible");
    els.serviceDrawer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
}

function closeServiceDrawer() {
  state.activeService = null;
  els.serviceDrawer.classList.remove("is-visible");
  els.serviceDrawerBackdrop.classList.remove("is-visible");
  els.serviceDrawer.setAttribute("aria-hidden", "true");
  if (!state.lightboxItem) document.body.style.overflow = "";
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
  state.lightboxItem = item;
  els.lightboxService.textContent = getServiceTitle(item.service);
  els.lightboxTitle.textContent = item.title[state.lang];
  els.lightboxDescription.textContent = item.description[state.lang];
  els.lightboxRequestBtn.textContent = t("common.lightboxRequest");
  els.lightboxMedia.innerHTML = buildLightboxMedia(item);
  els.lightboxRequestBtn.onclick = () => openForm(item.service);

  if (!options.preserveState) {
    els.lightbox.classList.add("is-visible");
    els.lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
}

function closeLightbox() {
  state.lightboxItem = null;
  els.lightbox.classList.remove("is-visible");
  els.lightbox.setAttribute("aria-hidden", "true");
  if (!state.activeService) document.body.style.overflow = "";
}

function openForm(serviceId = null) {
  const targetLink = serviceId ? getServiceFormLink(serviceId) : getServiceFormLink("global");
  if (targetLink === "#order") {
    document.getElementById("order").scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  window.open(targetLink, "_blank", "noopener,noreferrer");
}

function renderFormShell() {
  const hasEmbed = site.forms.embed && !site.forms.embed.startsWith("REPLACE");
  const hasGlobal = site.forms.global && !site.forms.global.startsWith("REPLACE");
  if (hasEmbed) {
    els.embeddedFormFrame.src = site.forms.embed;
    els.embeddedFormFrame.classList.remove("is-hidden");
    els.formPlaceholder.classList.add("is-hidden");
    return;
  }
  if (hasGlobal) {
    els.formPlaceholder.classList.remove("is-hidden");
    els.formPlaceholder.innerHTML = `
      <p class="form-shell__eyebrow">Google Form</p>
      <h3>${t("order.placeholderTitle")}</h3>
      <p>${t("order.placeholderText")}</p>
      <button type="button" class="btn btn--primary" id="placeholderFormBtn">${t("order.formCta")}</button>
    `;
    els.formPlaceholder.querySelector("#placeholderFormBtn").addEventListener("click", () => openForm());
    els.embeddedFormFrame.classList.add("is-hidden");
  } else {
    els.formPlaceholder.classList.remove("is-hidden");
    els.formPlaceholder.innerHTML = `
      <p class="form-shell__eyebrow">Google Form</p>
      <h3>${t("order.placeholderTitle")}</h3>
      <p>${t("order.placeholderText")}</p>
    `;
    els.embeddedFormFrame.classList.add("is-hidden");
  }
}

function bindEvents() {
  document.querySelectorAll(".lang-btn").forEach((button) => {
    button.addEventListener("click", () => {
      state.lang = button.dataset.lang;
      localStorage.setItem("luxury-site-lang", state.lang);
      applyTranslations();
    });
  });

  els.openGlobalFormBtn.addEventListener("click", () => openForm());
  els.openEmbeddedFormBtn.addEventListener("click", () => openForm());
  els.mobileRequestBtn.addEventListener("click", () => openForm());
  els.showAllWorksBtn.addEventListener("click", () => {
    state.activeFilter = "all";
    renderFilters();
    renderWorks();
    document.getElementById("works").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  els.closeServiceDrawer.addEventListener("click", closeServiceDrawer);
  els.serviceDrawerBackdrop.addEventListener("click", closeServiceDrawer);
  els.closeLightbox.addEventListener("click", closeLightbox);
  els.lightboxBackdrop.addEventListener("click", closeLightbox);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (els.lightbox.classList.contains("is-visible")) closeLightbox();
      if (els.serviceDrawer.classList.contains("is-visible")) closeServiceDrawer();
    }
  });
}

function init() {
  setInstagramLinks();
  bindEvents();
  applyTranslations();
}

init();
