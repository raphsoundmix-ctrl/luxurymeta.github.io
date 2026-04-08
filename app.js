const site = window.SITE_DATA;

const state = {
  // 👉 EN по умолчанию
  lang: localStorage.getItem("luxury-site-lang") || "en",
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
  return path.split(".").reduce((acc, key) => (acc ? acc[key] : undefined), source) || path;
};

function getServiceById(id) {
  return site.services.find((item) => item.id === id);
}

function getServiceTitle(id) {
  return getServiceById(id)?.title?.[state.lang] || id;
}

function getServiceFormLink(serviceId) {
  return site.forms.serviceLinks[serviceId] || site.forms.global;
}

function openForm(serviceId = null) {
  const link = serviceId ? getServiceFormLink(serviceId) : site.forms.global;
  window.open(link, "_blank");
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
}

function init() {
  bindEvents();
  applyTranslations();
}

init();
