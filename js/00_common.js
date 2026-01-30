/* =========================
   00_common.js (정리본)
   - include(헤더/푸터) + 파비콘 + breadcrumb + GNB + 현재메뉴 활성화 + 메인 슬라이더
========================= */

/* =========================
   유틸: 터치 디바이스 판별(실기기 오판 방지)
========================= */
function isTouchDevice(){
  return (
    ("ontouchstart" in window) ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
    window.matchMedia("(pointer: coarse)").matches
  );
}

/* =========================
   공통 include
========================= */
async function injectCommon(selector, url) {
  const el = document.querySelector(selector);
  if (!el) return false;

  try {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) return false;

    el.innerHTML = await res.text();
    return true;
  } catch (err) {
    return false;
  }
}

/* =========================
   파비콘 설정
========================= */
function setFavicon() {
  const href = "/assets/images/00_common/logo_top.svg";

  let link = document.querySelector('link[rel="icon"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }

  link.type = "image/svg+xml";
  link.href = href;
}

/* =========================
   GNB 현재 페이지 활성화
========================= */
function setActiveGnb() {
  const currentPath = window.location.pathname;

  const gnbLinks = document.querySelectorAll(".gnb-link");
  if (!gnbLinks.length) return;

  gnbLinks.forEach((link) => link.classList.remove("is-active"));

  gnbLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;

    const linkPath = new URL(href, window.location.origin).pathname;
    const section = linkPath.substring(0, linkPath.lastIndexOf("/") + 1);

    if (currentPath.startsWith(section)) {
      link.classList.add("is-active");
    }
  });
}

/* =========================
   breadcrumb: 모바일 1탭=열기 / 2탭=이동
========================= */
function bindBreadcrumbTouch() {
  document.addEventListener("pointerdown", (e) => {
    if (!isTouchDevice()) return;

    const toggleLink = e.target.closest(".breadcrumb-toggle");
    const dropdown = e.target.closest(".breadcrumb-dropdown");

    if (!dropdown) {
      document.querySelectorAll(".breadcrumb-dropdown.is-open")
        .forEach((el) => el.classList.remove("is-open"));
      return;
    }

    if (toggleLink) {
      if (dropdown.classList.contains("is-open")) return;

      e.preventDefault();

      document.querySelectorAll(".breadcrumb-dropdown.is-open")
        .forEach((el) => el.classList.remove("is-open"));

      dropdown.classList.add("is-open");
    }
  }, { capture: true });
}

/* =========================
   GNB: 모바일 1탭=열기 / 2탭=이동
========================= */
function bindGnbTouch() {
  document.addEventListener("pointerdown", (e) => {
    if (!isTouchDevice()) return;

    const gnbLink = e.target.closest(".gnb-link");
    const gnbItem = e.target.closest(".gnb-item");

    if (!gnbItem) {
      document.querySelectorAll(".gnb-item.is-open")
        .forEach((el) => el.classList.remove("is-open"));
      return;
    }

    const subMenu = gnbItem.querySelector(".sub-menu");
    if (!subMenu || !gnbLink) return;

    if (gnbItem.classList.contains("is-open")) return;

    e.preventDefault();

    document.querySelectorAll(".gnb-item.is-open").forEach((el) => {
      if (el !== gnbItem) el.classList.remove("is-open");
    });

    gnbItem.classList.add("is-open");
  }, { capture: true });

  document.addEventListener("pointerdown", (e) => {
    if (!isTouchDevice()) return;

    if (e.target.closest(".sub-menu a")) {
      document.querySelectorAll(".gnb-item.is-open")
        .forEach((el) => el.classList.remove("is-open"));
    }
  }, { capture: true });
}

/* =========================
   메인 히어로 슬라이더(메인에서만)
========================= */
function initHeroSlider() {
  const slider = document.querySelector(".hero-slider");
  if (!slider) return;

  const images = [
    "/assets/images/01_index/01_index_main.jpg",
    "/assets/images/01_index/02_index_main.png",
    "/assets/images/01_index/03_index_main.png",
  ];

  slider.innerHTML = "";

  images.forEach((src) => {
    const slide = document.createElement("div");
    slide.className = "hero-slide";
    slide.style.backgroundImage = `url("${src}")`;
    slider.appendChild(slide);
  });

  const firstClone = slider.firstElementChild?.cloneNode(true);
  if (firstClone) slider.appendChild(firstClone);

  let index = 0;
  const total = images.length;
  const intervalMs = 4000;

  function goNext() {
    index += 1;
    slider.style.transition = "transform 800ms ease";
    slider.style.transform = `translateX(-${index * 100}%)`;

    if (index === total) {
      window.setTimeout(() => {
        slider.style.transition = "none";
        slider.style.transform = "translateX(0)";
        index = 0;
      }, 820);
    }
  }

  window.setInterval(goNext, intervalMs);
}

/* =========================
   실행(단 1회)
========================= */
document.addEventListener("DOMContentLoaded", async () => {
  setFavicon();                 /* 탭 아이콘 */
  bindBreadcrumbTouch();        /* breadcrumb 터치 */
  bindGnbTouch();               /* GNB 터치 */

  const headerDone = await injectCommon("#app-header", "/00_common/01_header.html");
  await injectCommon("#app-footer", "/00_common/02_footer.html");

  if (headerDone) setActiveGnb(); /* 헤더 삽입 후 활성화 */

  initHeroSlider();             /* 메인에서만 동작 */
});
