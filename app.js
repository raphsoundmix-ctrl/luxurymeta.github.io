const site = window.SITE_DATA || {};

function getInitialLanguage() {
  const saved = localStorage.getItem("luxury-site-lang");
  if (saved === "ru" || saved === "en") return saved;
  return site.defaultLang || "en";
}

const state = {
  lang: getInitialLanguage(),
  activeService: null,
  activeFilter: "all",
  showAllWorks: false,
  lightboxItem: null,
  lightboxSlideIndex: 0
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
  lightboxExternalBtn: document.getElementById("lightboxExternalBtn"),

  openGlobalFormBtn: document.getElementById("openGlobalFormBtn"),
  openEmbeddedFormBtn: document.getElementById("openEmbeddedFormBtn"),
  mobileRequestBtn: document.getElementById("mobileRequestBtn")
};

let warmObserver = null;
let autoplayObserver = null;

const t = (path) => {
  const source = site.translations?.[state.lang] || {};
  return path.split(".").reduce((acc, key) => (acc ? acc[key] : undefined), source) ?? path;
};

function getServiceById(id) {
  return (site.services || []).find((item) => item.id === id);
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

function aspectToCss(aspect) {
  return String(aspect || "4:5").replace(":", " / ");
}

function extractDriveId(input) {
  const url = String(input || "");
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }

  return "";
}

function isDriveUrl(input) {
  return /drive\.google\.com/.test(String(input || ""));
}

function toDrivePreview(input) {
  const id = extractDriveId(input);
  return id ? `https://drive.google.com/file/d/${id}/preview` : input;
}

function toDriveThumbnail(input, size = 1600) {
  const id = extractDriveId(input);
  return id ? `https://lh3.googleusercontent.com/d/${id}=w${size}` : input;
}

function toDriveImage(input, size = 2000) {
  const id = extractDriveId(input);
  return id ? `https://lh3.googleusercontent.com/d/${id}=w${size}` : input;
}

function toDrivePdfThumb(input, size = 1600) {
  // Drive's /thumbnail endpoint renders PDF first page; lh3 does not.
  const id = extractDriveId(input);
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w${size}` : input;
}

function attachDriveImageFallback(imageEl, input, size) {
  const id = extractDriveId(input);
  if (!id) return;
  imageEl.dataset.fallbackStep = "0";
  imageEl.addEventListener("error", () => {
    const step = Number(imageEl.dataset.fallbackStep || "0");
    if (step === 0) {
      imageEl.dataset.fallbackStep = "1";
      imageEl.src = `https://drive.google.com/thumbnail?id=${id}&sz=w${size}`;
    } else if (step === 1) {
      imageEl.dataset.fallbackStep = "2";
      imageEl.src = `https://lh3.googleusercontent.com/d/${id}=s${size}`;
    }
  });
}

function resolveTypeLabel(type) {
  if (type === "video") return t("common.typeVideo");
  if (type === "carousel") return t("common.typeCarousel");
  if (type === "website") return t("common.typeWebsite");
  if (type === "pdf") return t("common.typePdf");
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
    els.instagramProfileLink.textContent = site.contactLabel || "Instagram";
  }
}

function setBodyLock() {
  const shouldLock = Boolean(
    els.lightbox?.classList.contains("is-visible") || els.serviceDrawer?.classList.contains("is-visible")
  );
  document.body.style.overflow = shouldLock ? "hidden" : "";
}

function createServiceCard(service) {
  const card = document.createElement("article");
  card.className = "service-card reveal-up";

  card.innerHTML = `
    <div class="service-card__head">
      <div class="service-card__icon">${service.icon}</div>
      <span class="micro-tag">${service.tags?.[0] || "Service"}</span>
    </div>

    <div>
      <h3 class="service-card__title">${service.title?.[state.lang] || service.id}</h3>
      <p class="service-card__description">${service.short?.[state.lang] || ""}</p>
    </div>

    <div class="service-card__tags">
      ${(service.tags || []).map((tag) => `<span class="service-chip">${tag}</span>`).join("")}
    </div>

    <div class="service-card__footer">
      <button type="button" class="service-card__button">${t("common.browseWork")}</button>
      <button type="button" class="service-chip">${t("common.requestService")}</button>
    </div>
  `;

  const buttons = card.querySelectorAll("button");
  buttons[0]?.addEventListener("click", (event) => {
    event.stopPropagation();
    openServiceDrawer(service.id);
  });

  buttons[1]?.addEventListener("click", (event) => {
    event.stopPropagation();
    openForm(service.id);
  });

  card.addEventListener("click", () => openServiceDrawer(service.id));
  return card;
}

function renderServices() {
  if (!els.servicesGrid) return;
  els.servicesGrid.innerHTML = "";

  (site.services || []).forEach((service, index) => {
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
    state.showAllWorks = false;
    renderFilters();
    renderWorks();
  });
  els.serviceFilters.appendChild(allButton);

  (site.services || []).forEach((service) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `filter-chip ${state.activeFilter === service.id ? "is-active" : ""}`;
    button.textContent = service.title?.[state.lang] || service.id;

    button.addEventListener("click", () => {
      state.activeFilter = service.id;
      state.showAllWorks = true;
      renderFilters();
      renderWorks();
    });

    els.serviceFilters.appendChild(button);
  });

  updateShowAllButton();
}

function updateShowAllButton() {
  if (!els.showAllWorksBtn) return;

  const text = state.activeFilter === "all" && !state.showAllWorks
    ? t("works.showAll")
    : t("works.showFeatured");

  els.showAllWorksBtn.textContent = text;
}

function getFeedItems() {
  const full = Array.isArray(site.portfolio) ? site.portfolio : [];

  if (state.activeFilter !== "all") {
    return full.filter((item) => item.service === state.activeFilter);
  }

  if (state.showAllWorks) return full;

  const featured = full.filter((item) => item.featured);
  return featured.length ? featured.slice(0, site.settings?.feedFeaturedLimit || 9) : full.slice(0, site.settings?.feedFeaturedLimit || 9);
}

function createMediaBadge(label) {
  const badge = document.createElement("span");
  badge.className = "media-badge";
  badge.textContent = label;
  return badge;
}

function createOpenIndicator() {
  const indicator = document.createElement("span");
  indicator.className = "media-open-indicator";
  indicator.textContent = "⤢";
  indicator.setAttribute("aria-hidden", "true");
  return indicator;
}

function createImageNode(entry, options = {}) {
  const image = document.createElement("img");
  image.className = options.lightbox ? "lightbox-image media-fill media-fill--contain" : "work-card__image media-fill";
  image.loading = options.lightbox ? "eager" : "lazy";
  image.alt = options.title || "";
  image.referrerPolicy = "no-referrer";
  const size = options.lightbox ? 2400 : 1600;
  if (isDriveUrl(entry.src)) {
    image.src = toDriveImage(entry.src, size);
    attachDriveImageFallback(image, entry.src, size);
  } else {
    image.src = entry.src;
  }
  return image;
}

function renderSoundButton(button, muted) {
  button.innerHTML = `<span>${muted ? "🔇" : "🔊"}</span><span>${muted ? t("common.soundOn") : t("common.soundOff")}</span>`;
  button.setAttribute("aria-label", muted ? t("common.soundOn") : t("common.soundOff"));
}

function ensureVideoLoaded(video) {
  if (!video || video.dataset.loaded === "true") return;

  const sources = JSON.parse(video.dataset.sources || "[]");
  sources.forEach((src) => {
    const source = document.createElement("source");
    source.src = src;
    source.type = "video/mp4";
    video.appendChild(source);
  });

  video.load();
  video.dataset.loaded = "true";
}

function pauseVideoShell(shell) {
  const video = shell?.querySelector("video");
  if (!video) return;
  video.pause();
}

function muteAllManagedVideos(exceptVideo = null) {
  document.querySelectorAll(".js-managed-video").forEach((video) => {
    if (video === exceptVideo) return;
    video.muted = true;
    const button = video.closest(".media-video-shell")?.querySelector(".media-sound-btn");
    if (button) renderSoundButton(button, true);
  });
}

function handleVideoFailure(shell) {
  const previewSrc = shell.dataset.previewSrc || "";

  if (shell.closest("#lightboxMedia") && previewSrc) {
    shell.innerHTML = "";
    shell.classList.add("has-preview-fallback");
    shell.append(createIframe(previewSrc, "lightbox-embed lightbox-frame lightbox-frame--video", "Google Drive preview", true));
    return;
  }

  shell.classList.add("has-fallback");
  shell.querySelector("video")?.classList.add("is-hidden");
  shell.querySelector(".media-sound-btn")?.classList.add("is-hidden");
  shell.querySelector(".media-fallback-link")?.classList.remove("is-hidden");
}

function createVideoShell(entry, options = {}) {
  const shell = document.createElement("div");
  shell.className = `media-video-shell ${options.lightbox ? "media-video-shell--lightbox" : ""}`;
  const drive = isDriveUrl(entry.src);

  // LIGHTBOX + Drive video = reliable Drive preview iframe (has its own controls + sound)
  if (options.lightbox && drive) {
    shell.classList.add("media-video-shell--iframe");
    const previewSrc = toDrivePreview(entry.src);
    shell.dataset.previewSrc = previewSrc;
    const frame = createIframe(
      previewSrc,
      "lightbox-embed lightbox-frame lightbox-frame--video",
      options.title || "Video preview",
      true
    );
    shell.appendChild(frame);
    return shell;
  }

  // FEED CARD + Drive video = poster image + play overlay. Tapping the card opens lightbox.
  // (Drive does not allow reliable native <video> playback and browsers block cross-origin
  // iframe autoplay, so a clean tap-to-open Explore-style grid is the honest solution.)
  if (!options.lightbox && drive) {
    shell.classList.add("media-video-shell--poster");
    const poster = document.createElement("img");
    poster.className = "media-fill media-video-poster";
    poster.loading = "lazy";
    poster.alt = options.title || "";
    poster.referrerPolicy = "no-referrer";
    const id = extractDriveId(entry.src);
    poster.src = toDriveImage(entry.src, 1600);
    attachDriveImageFallback(poster, entry.src, 1600);

    const playBadge = document.createElement("span");
    playBadge.className = "media-video-play";
    playBadge.setAttribute("aria-hidden", "true");
    playBadge.textContent = "▶";

    shell.append(poster, playBadge);
    return shell;
  }

  // NON-DRIVE video path (direct CDN mp4, future-proofing) — native <video> with sound button
  shell.dataset.lazyType = "video";
  const video = document.createElement("video");
  video.className = `media-video js-managed-video ${options.lightbox ? "lightbox-video" : "work-card__video"}`;
  video.playsInline = true;
  video.loop = !options.lightbox;
  video.muted = true;
  video.preload = "none";
  video.poster = entry.poster || "";
  video.dataset.sources = JSON.stringify([entry.src]);
  video.dataset.loaded = "false";
  video.addEventListener("error", () => handleVideoFailure(shell));

  if (options.lightbox) {
    video.addEventListener("click", (event) => {
      event.stopPropagation();
      if (video.paused) {
        ensureVideoLoaded(video);
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }

  const soundButton = document.createElement("button");
  soundButton.type = "button";
  soundButton.className = "media-sound-btn";
  soundButton.dataset.noOpen = "true";
  renderSoundButton(soundButton, true);
  soundButton.addEventListener("click", (event) => {
    event.stopPropagation();
    ensureVideoLoaded(video);
    if (video.muted) {
      muteAllManagedVideos(video);
      video.muted = false;
    } else {
      video.muted = true;
    }
    renderSoundButton(soundButton, video.muted);
    video.play().catch(() => {});
  });

  const fallbackLink = document.createElement("a");
  fallbackLink.className = "media-fallback-link is-hidden";
  fallbackLink.href = entry.src;
  fallbackLink.target = "_blank";
  fallbackLink.rel = "noreferrer";
  fallbackLink.dataset.noOpen = "true";
  fallbackLink.textContent = t("common.openSource");

  shell.append(video, soundButton, fallbackLink);
  return shell;
}

function createIframe(src, className, title, eager = false) {
  const iframe = document.createElement("iframe");
  iframe.className = className;
  iframe.title = title || "Embedded content";
  iframe.setAttribute("allow", "autoplay; fullscreen");
  iframe.referrerPolicy = "no-referrer";
  iframe.loading = eager ? "eager" : "lazy";

  if (eager) {
    iframe.src = src;
  } else {
    iframe.dataset.lazyType = "iframe";
    iframe.dataset.src = src;
  }

  return iframe;
}

function createPdfPreview(entry, options = {}) {
  const shell = document.createElement("div");
  shell.className = `pdf-preview ${options.lightbox ? "pdf-preview--lightbox" : ""}`;

  if (options.lightbox) {
    const frame = createIframe(toDrivePreview(entry.src), "lightbox-embed lightbox-frame lightbox-frame--pdf", options.title, true);
    shell.append(frame);
  } else {
    // PDFs: Drive /thumbnail endpoint renders the first page; lh3 does not.
    const image = document.createElement("img");
    image.className = "work-card__image media-fill";
    image.loading = "lazy";
    image.alt = options.title || "";
    image.referrerPolicy = "no-referrer";
    const id = extractDriveId(entry.src);
    image.src = id ? `https://drive.google.com/thumbnail?id=${id}&sz=w1600` : entry.src;
    if (id) {
      image.addEventListener("error", () => {
        if (image.dataset.pdfFallback === "true") return;
        image.dataset.pdfFallback = "true";
        image.src = `https://lh3.googleusercontent.com/d/${id}=w1600`;
      });
    }
    shell.append(image);
  }

  return shell;
}

function createWebsitePreview(entry, options = {}) {
  const shell = document.createElement("div");
  shell.className = `external-preview ${options.lightbox ? "external-preview--lightbox" : ""}`;

  const viewport = document.createElement("div");
  viewport.className = "external-preview__viewport";
  const frame = createIframe(entry.url, `external-preview__frame ${options.lightbox ? "external-preview__frame--lightbox" : ""}`, options.title, options.lightbox);
  viewport.append(frame);

  const toolbar = document.createElement("div");
  toolbar.className = "external-preview__toolbar";
  const link = document.createElement("a");
  link.className = "external-preview__link";
  link.href = entry.url;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.textContent = t("common.openSite");
  link.dataset.noOpen = "true";
  link.addEventListener("click", (event) => event.stopPropagation());
  toolbar.append(link);

  shell.append(viewport, toolbar);
  return shell;
}

function createMediaNode(entry, options = {}) {
  if (entry.type === "video") return createVideoShell(entry, options);
  if (entry.type === "website") return createWebsitePreview(entry, options);
  if (entry.type === "pdf") return createPdfPreview(entry, options);
  return createImageNode(entry, options);
}

function updateCarousel(carousel, index) {
  const slides = Array.from(carousel.querySelectorAll(".media-carousel__slide"));
  const dots = Array.from(carousel.querySelectorAll(".media-carousel__dot"));
  const safeIndex = ((index % slides.length) + slides.length) % slides.length;
  const track = carousel.querySelector(".media-carousel__track");

  carousel.dataset.index = String(safeIndex);
  if (track) track.style.transform = `translateX(-${safeIndex * 100}%)`;

  slides.forEach((slide, slideIndex) => {
    slide.classList.toggle("is-active", slideIndex === safeIndex);
  });

  dots.forEach((dot, dotIndex) => {
    dot.classList.toggle("is-active", dotIndex === safeIndex);
    dot.setAttribute("aria-current", dotIndex === safeIndex ? "true" : "false");
  });

  if (carousel.closest("#lightboxMedia")) {
    state.lightboxSlideIndex = safeIndex;
  }

  const context = carousel.closest(".js-video-context");
  if (context) syncVideosInContext(context);
}

function attachCarouselSwipe(carousel) {
  let startX = 0;
  let deltaX = 0;

  carousel.addEventListener("touchstart", (event) => {
    startX = event.changedTouches[0].clientX;
    deltaX = 0;
  }, { passive: true });

  carousel.addEventListener("touchmove", (event) => {
    deltaX = event.changedTouches[0].clientX - startX;
  }, { passive: true });

  carousel.addEventListener("touchend", () => {
    if (Math.abs(deltaX) < 40) return;
    const current = Number(carousel.dataset.index || 0);
    updateCarousel(carousel, deltaX < 0 ? current + 1 : current - 1);
  });
}

function createCarouselNode(item, options = {}) {
  const carousel = document.createElement("div");
  carousel.className = `media-carousel ${options.lightbox ? "media-carousel--lightbox" : ""}`;
  carousel.dataset.index = String(options.startIndex || 0);

  const track = document.createElement("div");
  track.className = "media-carousel__track";

  (item.items || []).forEach((entry) => {
    const slide = document.createElement("div");
    slide.className = "media-carousel__slide";
    slide.appendChild(createMediaNode(entry, { lightbox: options.lightbox, title: options.title }));
    track.appendChild(slide);
  });

  carousel.appendChild(track);

  if ((item.items || []).length > 1) {
    const nav = document.createElement("div");
    nav.className = "media-carousel__nav";

    const prev = document.createElement("button");
    prev.type = "button";
    prev.className = "media-carousel__nav-btn";
    prev.dataset.noOpen = "true";
    prev.setAttribute("aria-label", t("common.carouselPrev"));
    prev.textContent = "‹";
    prev.addEventListener("click", (event) => {
      event.stopPropagation();
      updateCarousel(carousel, Number(carousel.dataset.index || 0) - 1);
    });

    const next = document.createElement("button");
    next.type = "button";
    next.className = "media-carousel__nav-btn";
    next.dataset.noOpen = "true";
    next.setAttribute("aria-label", t("common.carouselNext"));
    next.textContent = "›";
    next.addEventListener("click", (event) => {
      event.stopPropagation();
      updateCarousel(carousel, Number(carousel.dataset.index || 0) + 1);
    });

    nav.append(prev, next);
    carousel.appendChild(nav);

    const dots = document.createElement("div");
    dots.className = "media-carousel__dots";
    (item.items || []).forEach((_, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "media-carousel__dot";
      dot.dataset.noOpen = "true";
      dot.setAttribute("aria-label", `${index + 1}`);
      dot.addEventListener("click", (event) => {
        event.stopPropagation();
        updateCarousel(carousel, index);
      });
      dots.appendChild(dot);
    });
    carousel.appendChild(dots);
    attachCarouselSwipe(carousel);
  }

  updateCarousel(carousel, options.startIndex || 0);
  return carousel;
}

function createCardMedia(item) {
  const media = document.createElement("div");
  media.className = "work-card__media";
  media.style.setProperty("--media-aspect", aspectToCss(item.aspect));

  const node = item.type === "carousel"
    ? createCarouselNode(item, { title: item.title?.[state.lang], startIndex: 0 })
    : createMediaNode(item, { title: item.title?.[state.lang] });

  media.appendChild(node);
  media.appendChild(createOpenIndicator());
  media.appendChild(createMediaBadge(resolveTypeLabel(item.type)));
  return media;
}

function getCurrentCardSlideIndex(card) {
  const carousel = card.querySelector(".media-carousel");
  return carousel ? Number(carousel.dataset.index || 0) : 0;
}

function createWorkCard(item) {
  const card = document.createElement("article");
  card.className = "work-card reveal-up js-video-context";
  card.dataset.itemId = item.id;
  card.dataset.inView = "false";

  const title = item.title?.[state.lang] || item.id;
  const description = item.description?.[state.lang] || "";

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "work-card__trigger";
  trigger.setAttribute("aria-label", title);

  trigger.appendChild(createCardMedia(item));

  const body = document.createElement("div");
  body.className = "work-card__body";
  body.innerHTML = `
    <div class="work-card__meta">
      <span class="work-card__service">${getServiceTitle(item.service)}</span>
      <span class="work-card__type">${resolveTypeLabel(item.type)}</span>
    </div>
    <h3 class="work-card__title">${title}</h3>
    <p class="work-card__description">${description}</p>
  `;

  trigger.appendChild(body);
  trigger.addEventListener("click", (event) => {
    if (event.target.closest("[data-no-open='true']")) return;
    openLightbox(item, getCurrentCardSlideIndex(card));
  });

  card.appendChild(trigger);
  return card;
}

function refreshObservers() {
  if (warmObserver) warmObserver.disconnect();
  if (autoplayObserver) autoplayObserver.disconnect();

  warmObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const target = entry.target;
      if (target.dataset.lazyType === "video") {
        const video = target.querySelector("video");
        ensureVideoLoaded(video);
      }
      if (target.dataset.lazyType === "iframe" && !target.src) {
        target.src = target.dataset.src || "";
      }
      warmObserver.unobserve(target);
    });
  }, {
    rootMargin: site.settings?.prewarmRootMargin || "700px 0px",
    threshold: 0.01
  });

  autoplayObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const context = entry.target;
      const active = entry.isIntersecting && entry.intersectionRatio >= (site.settings?.autoplayThreshold || 0.62);
      context.dataset.inView = active ? "true" : "false";
      syncVideosInContext(context);
    });
  }, {
    threshold: [0, 0.25, site.settings?.autoplayThreshold || 0.62, 1]
  });

  document.querySelectorAll("[data-lazy-type='video'], [data-lazy-type='iframe']").forEach((node) => warmObserver.observe(node));
  document.querySelectorAll(".js-video-context").forEach((node) => autoplayObserver.observe(node));
}

function isShellActive(shell) {
  const slide = shell.closest(".media-carousel__slide");
  if (!slide) return true;
  return slide.classList.contains("is-active");
}

function syncVideosInContext(context) {
  context.querySelectorAll(".media-video-shell").forEach((shell) => {
    const video = shell.querySelector("video");
    if (!video) return;

    const shouldPlay = context.dataset.inView === "true" && isShellActive(shell) && !shell.classList.contains("has-fallback");

    if (shouldPlay) {
      ensureVideoLoaded(video);
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  });
}

function renderWorks() {
  if (!els.featuredWorksGrid) return;
  els.featuredWorksGrid.innerHTML = "";

  const items = getFeedItems();
  items.forEach((item, index) => {
    const card = createWorkCard(item);
    if (index % 3 === 1) card.classList.add("delay-1");
    if (index % 3 === 2) card.classList.add("delay-2");
    els.featuredWorksGrid.appendChild(card);
  });

  updateShowAllButton();
  requestAnimationFrame(refreshObservers);
}

function openServiceDrawer(serviceId, options = {}) {
  const service = getServiceById(serviceId);
  if (!service || !els.serviceDrawer) return;

  state.activeService = serviceId;
  if (els.serviceDrawerEyebrow) els.serviceDrawerEyebrow.textContent = t("common.drawerEyebrow");
  if (els.serviceDrawerTitle) els.serviceDrawerTitle.textContent = service.title?.[state.lang] || serviceId;
  if (els.serviceDrawerDescription) els.serviceDrawerDescription.textContent = service.detail?.[state.lang] || "";

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
      state.showAllWorks = true;
      renderFilters();
      renderWorks();
      document.getElementById("works")?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
  }

  if (els.servicePortfolioGrid) {
    els.servicePortfolioGrid.innerHTML = "";
    const items = (site.portfolio || []).filter((item) => item.service === serviceId);

    if (items.length) {
      items.forEach((item) => els.servicePortfolioGrid.appendChild(createWorkCard(item)));
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
  }

  setBodyLock();
  requestAnimationFrame(refreshObservers);
}

function closeServiceDrawer() {
  state.activeService = null;
  if (els.serviceDrawer) {
    els.serviceDrawer.classList.remove("is-visible");
    els.serviceDrawer.setAttribute("aria-hidden", "true");
  }
  els.serviceDrawerBackdrop?.classList.remove("is-visible");
  setBodyLock();
}

function configureLightboxActions(item) {
  if (els.lightboxRequestBtn) {
    els.lightboxRequestBtn.textContent = t("common.lightboxRequest");
    els.lightboxRequestBtn.onclick = () => openForm(item.service);
  }

  if (els.lightboxExternalBtn) {
    els.lightboxExternalBtn.classList.add("is-hidden");
    els.lightboxExternalBtn.removeAttribute("href");

    if (item.type === "website") {
      els.lightboxExternalBtn.href = item.url;
      els.lightboxExternalBtn.textContent = t("common.openSite");
      els.lightboxExternalBtn.classList.remove("is-hidden");
    }

    if (item.type === "pdf") {
      els.lightboxExternalBtn.href = item.src;
      els.lightboxExternalBtn.textContent = t("common.openPdf");
      els.lightboxExternalBtn.classList.remove("is-hidden");
    }
  }
}

function createLightboxMedia(item, startIndex = 0) {
  const wrapper = document.createElement("div");
  wrapper.className = "lightbox-media-inner js-video-context";
  wrapper.dataset.inView = "true";

  const node = item.type === "carousel"
    ? createCarouselNode(item, { lightbox: true, title: item.title?.[state.lang], startIndex })
    : createMediaNode(item, { lightbox: true, title: item.title?.[state.lang] });

  wrapper.appendChild(node);
  return wrapper;
}

function openLightbox(item, startIndex = 0, options = {}) {
  if (!els.lightbox || !els.lightboxMedia) return;

  state.lightboxItem = item;
  state.lightboxSlideIndex = startIndex;

  muteAllManagedVideos();

  if (els.lightboxService) els.lightboxService.textContent = getServiceTitle(item.service);
  if (els.lightboxTitle) els.lightboxTitle.textContent = item.title?.[state.lang] || item.id;
  if (els.lightboxDescription) els.lightboxDescription.textContent = item.description?.[state.lang] || "";

  els.lightboxMedia.innerHTML = "";
  els.lightboxMedia.style.setProperty("--media-aspect", aspectToCss(item.aspect || "4:5"));
  const media = createLightboxMedia(item, startIndex);
  els.lightboxMedia.appendChild(media);
  configureLightboxActions(item);

  if (!options.preserveState) {
    els.lightbox.classList.add("is-visible");
    els.lightbox.setAttribute("aria-hidden", "false");
  }

  setBodyLock();

  requestAnimationFrame(() => {
    media.querySelectorAll("[data-lazy-type='video'] video").forEach((video) => ensureVideoLoaded(video));
    media.querySelectorAll("[data-lazy-type='iframe']").forEach((frame) => {
      if (!frame.src) frame.src = frame.dataset.src || "";
    });
    syncVideosInContext(media);
  });
}

function closeLightbox() {
  state.lightboxItem = null;
  state.lightboxSlideIndex = 0;

  if (els.lightboxMedia) {
    els.lightboxMedia.querySelectorAll("video").forEach((video) => video.pause());
    els.lightboxMedia.innerHTML = "";
  }

  if (els.lightbox) {
    els.lightbox.classList.remove("is-visible");
    els.lightbox.setAttribute("aria-hidden", "true");
  }

  setBodyLock();
}

function openForm(serviceId = null) {
  const targetLink = serviceId ? getServiceFormLink(serviceId) : site.forms?.global;
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

  document.querySelectorAll(".lang-btn").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.lang === state.lang);
  });

  renderServices();
  renderFilters();
  renderWorks();
  setInstagramLinks();

  if (state.activeService) {
    openServiceDrawer(state.activeService, { preserveState: true });
  }

  if (state.lightboxItem) {
    openLightbox(state.lightboxItem, state.lightboxSlideIndex, { preserveState: true });
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

  els.openGlobalFormBtn?.addEventListener("click", () => openForm());
  els.openEmbeddedFormBtn?.addEventListener("click", () => openForm());
  els.mobileRequestBtn?.addEventListener("click", () => openForm());

  els.showAllWorksBtn?.addEventListener("click", () => {
    if (state.activeFilter === "all" && !state.showAllWorks) {
      state.showAllWorks = true;
    } else {
      state.activeFilter = "all";
      state.showAllWorks = false;
    }

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
    if (els.lightbox?.classList.contains("is-visible")) {
      closeLightbox();
      return;
    }
    if (els.serviceDrawer?.classList.contains("is-visible")) {
      closeServiceDrawer();
    }
  });
}

function init() {
  setInstagramLinks();
  bindEvents();
  applyTranslations();
}

init();
