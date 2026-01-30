/* =========================
   00_common.js (정리본)
   - include(헤더/푸터) + 파비콘 + breadcrumb + GNB + 현재메뉴 활성화 + 메인 슬라이더
========================= */

/* =========================
   유틸: 터치/모바일 판별(실기기 오판 방지)
========================= */
function isTouchDevice(){
  const hasTouch =
    ("ontouchstart" in window) ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);

  const coarse = window.matchMedia("(pointer: coarse)").matches;

  /* 화면폭도 함께 사용(모바일/태블릿에서 확실히 잡기) */
  const smallScreen = window.matchMedia("(max-width: 1024px)").matches;

  return hasTouch || coarse || smallScreen;
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
   breadcrumb: 모바일 1탭=열기 / 2탭=이동 (삼성인터넷 안정화)
========================= */
function bindBreadcrumbTouch() {

  function closeAll(){
    document.querySelectorAll(".breadcrumb-dropdown.is-open")
      .forEach((el) => el.classList.remove("is-open"));
  }

  function openDrop(dropdown){
    document.querySelectorAll(".breadcrumb-dropdown.is-open")
      .forEach((el) => {
        if (el !== dropdown) el.classList.remove("is-open");
      });
    dropdown.classList.add("is-open");
  }

  /* 1) 터치 시작에서 첫 탭 이동 차단 (삼성인터넷 핵심: passive:false) */
  document.addEventListener("touchstart", (e) => {
    if (!isTouchDevice()) return;

    const toggleLink = e.target.closest(".breadcrumb-toggle");
    const dropdown = e.target.closest(".breadcrumb-dropdown");

    if (!dropdown) {
      closeAll();
      return;
    }

    if (!toggleLink) return;

    /* 이미 열려있으면 두 번째 탭은 이동 허용 */
    if (dropdown.classList.contains("is-open")) return;

    /* 첫 탭: 이동 막고 열기 */
    e.preventDefault();
    toggleLink.dataset.blockOnce = "1"; /* 뒤이어 발생하는 click 1회 차단 */
    openDrop(dropdown);

  }, { capture: true, passive: false });

  /* 2) click에서도 1회 차단(삼성인터넷 보험) */
  document.addEventListener("click", (e) => {
    if (!isTouchDevice()) return;

    const toggleLink = e.target.closest(".breadcrumb-toggle");
    if (!toggleLink) return;

    /* 첫 탭 직후 발생하는 click만 막고, 이후는 허용 */
    if (toggleLink.dataset.blockOnce === "1") {
      e.preventDefault();
      e.stopPropagation();
      delete toggleLink.dataset.blockOnce;
    }
  }, { capture: true });

  /* 3) 메뉴 항목을 누르면 닫기 */
  document.addEventListener("click", (e) => {
    if (!isTouchDevice()) return;

    if (e.target.closest(".breadcrumb-menu a")) {
      closeAll();
    }
  }, { capture: true });
}

/* =========================
   GNB: 모바일 1탭=열기 / 2탭=이동 (삼성인터넷/사파리 안정화)
========================= */
function bindGnbTouch() {
  function isMobileMenuMode(){
    return isTouchDevice();
  }

  function closeAll(){
    document.querySelectorAll(".gnb-item.is-open")
      .forEach((el) => el.classList.remove("is-open"));
  }

  function openItem(gnbItem){
    document.querySelectorAll(".gnb-item.is-open").forEach((el) => {
      if (el !== gnbItem) el.classList.remove("is-open");
    });
    gnbItem.classList.add("is-open");
  }

  /* 1) 터치 시작에서 먼저 잡기 (passive:false 중요) */
  document.addEventListener("touchstart", (e) => {
    if (!isMobileMenuMode()) return;

    const gnbLink = e.target.closest(".gnb-link");
    const gnbItem = e.target.closest(".gnb-item");

    if (!gnbItem) {
      closeAll();
      return;
    }

    const subMenu = gnbItem.querySelector(".sub-menu");
    if (!subMenu || !gnbLink) return;

    /* 열려있으면 2번째 탭은 이동 허용 */
    if (gnbItem.classList.contains("is-open")) return;

    /* 첫 탭: 이동 막고 열기 */
    e.preventDefault();
    gnbLink.dataset.blockOnce = "1"; /* 이어지는 click 1회 차단용 */
    openItem(gnbItem);
  }, { capture: true, passive: false });

  /* 2) click에서도 1회 차단 (삼성인터넷/사파리 보험) */
  document.addEventListener("click", (e) => {
    if (!isMobileMenuMode()) return;

    const gnbLink = e.target.closest(".gnb-link");
    if (!gnbLink) return;

    if (gnbLink.dataset.blockOnce === "1") {
      e.preventDefault();
      e.stopPropagation();
      delete gnbLink.dataset.blockOnce;
    }
  }, { capture: true });

  /* 3) 하위메뉴 누르면 닫기 */
  document.addEventListener("click", (e) => {
    if (!isMobileMenuMode()) return;

    if (e.target.closest(".sub-menu a")) {
      closeAll();
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

/* =========================
   Supabase Client (공지 테스트용)
========================= */

const SUPABASE_URL = "https://yhakzowipdzazebswmgx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloYWt6b3dpcGR6YXplYnN3bWd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NDMyMDUsImV4cCI6MjA4NTMxOTIwNX0.Id3Lfhzpz9FG8jA7b9xkKXrfiZXu2VvvOX7JDpgdrgw";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

/* =========================
   Supabase Client 설정
========================= */

const SUPABASE_URL = "https://yhakzowipdzazebswmgx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloYWt6b3dpcGR6YXplYnN3bWd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NDMyMDUsImV4cCI6MjA4NTMxOTIwNX0.Id3Lfhzpz9FG8jA7b9xkKXrfiZXu2VvvOX7JDpgdrgw";

window.supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
