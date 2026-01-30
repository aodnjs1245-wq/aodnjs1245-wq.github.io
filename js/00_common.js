/* ===== 공통 헤더/푸터 include ===== */
async function injectCommon(selector, url) {
  const el = document.querySelector(selector);
  if (!el) return;

  const res = await fetch(url);
  if (!res.ok) return;

  el.innerHTML = await res.text();
}

/* ===== 실행 ===== */
document.addEventListener("DOMContentLoaded", () => {
  injectCommon("#app-header", "/00_common/01_header.html");
  injectCommon("#app-footer", "/00_common/02_footer.html");
});

/* 파비콘 설정 */
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

document.addEventListener("DOMContentLoaded", () => {
  setFavicon(); /* 탭 아이콘 적용 */
});

/* ===== breadcrumb: 모바일(터치)에서 탭으로 메뉴 열기 ===== */
document.addEventListener("click", (e) => {
  // 터치 기기(모바일/태블릿)에서만 동작
  const isTouchDevice = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  if (!isTouchDevice) return;

  const toggleLink = e.target.closest(".breadcrumb-toggle");
  const dropdown = e.target.closest(".breadcrumb-dropdown");

  // 드롭다운 밖을 누르면 모두 닫기
  if (!dropdown) {
    document.querySelectorAll(".breadcrumb-dropdown.is-open")
      .forEach((el) => el.classList.remove("is-open"));
    return;
  }

  // 토글 링크를 눌렀을 때
  if (toggleLink) {
    // 이미 열려있으면 두 번째 탭은 링크 이동 허용
    if (dropdown.classList.contains("is-open")) return;

    // 첫 탭은 이동 막고 메뉴만 열기
    e.preventDefault();

    // 다른 드롭다운 닫고 현재만 열기
    document.querySelectorAll(".breadcrumb-dropdown.is-open")
      .forEach((el) => el.classList.remove("is-open"));

    dropdown.classList.add("is-open");
  }
});

/* ===== GNB: 모바일(터치)에서 탭으로 드롭다운 열기 ===== */
document.addEventListener("click", (e) => {
  const isTouchDevice = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  if (!isTouchDevice) return;

  const gnbLink = e.target.closest(".gnb-link");
  const gnbItem = e.target.closest(".gnb-item");

  // GNB 밖을 누르면 모두 닫기
  if (!gnbItem) {
    document.querySelectorAll(".gnb-item.is-open").forEach((el) => el.classList.remove("is-open"));
    return;
  }

  // 하위메뉴가 있는 상위메뉴만 토글 처리
  const subMenu = gnbItem.querySelector(".sub-menu");
  if (!subMenu) return;

  // 상위메뉴 링크를 눌렀을 때
  if (gnbLink) {
    // 이미 열려있으면 두 번째 탭은 링크 이동 허용
    if (gnbItem.classList.contains("is-open")) return;

    // 첫 탭은 이동 막고 메뉴만 열기
    e.preventDefault();

    // 다른 메뉴 닫고 현재만 열기
    document.querySelectorAll(".gnb-item.is-open").forEach((el) => {
      if (el !== gnbItem) el.classList.remove("is-open");
    });

    gnbItem.classList.add("is-open");
  }
});

/* ===== GNB: 하위메뉴 클릭 시 닫기 ===== */
document.addEventListener("click", (e) => {
  const isTouchDevice = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  if (!isTouchDevice) return;

  if (e.target.closest(".sub-menu a")) {
    document.querySelectorAll(".gnb-item.is-open").forEach((el) => el.classList.remove("is-open"));
  }
});

/* ===== GNB 현재 페이지 활성화 ===== */
function setActiveGnb() {
  const currentPath = window.location.pathname;

  // 헤더가 아직 없으면 종료
  const gnbLinks = document.querySelectorAll(".gnb-link");
  if (!gnbLinks.length) return;

  // 기존 활성화 제거
  gnbLinks.forEach((link) => link.classList.remove("is-active"));

  gnbLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;

    // href를 절대경로로 정규화 (상대경로/절대경로 섞여도 안정)
    const linkPath = new URL(href, window.location.origin).pathname;

    // 같은 폴더(섹션)면 상위 메뉴 활성화
    // 예: /02_company/xx.html => /02_company/
    const section = linkPath.substring(0, linkPath.lastIndexOf("/") + 1);

    if (currentPath.startsWith(section)) {
      link.classList.add("is-active");
    }
  });
}

/* ===== 공통 헤더/푸터 include ===== */
async function injectCommon(selector, url) {
  const el = document.querySelector(selector);
  if (!el) return false;

  const res = await fetch(url);
  if (!res.ok) return false;

  el.innerHTML = await res.text();
  return true;
}

/* ===== 실행 ===== */
document.addEventListener("DOMContentLoaded", async () => {
  const headerDone = await injectCommon("#app-header", "/00_common/01_header.html");
  await injectCommon("#app-footer", "/00_common/02_footer.html");

  // 헤더가 삽입된 뒤에 실행해야 gnb-link를 찾을 수 있음
  if (headerDone) setActiveGnb();
});

/* ===== 메인 히어로 슬라이더 ===== */
function initHeroSlider() {
  const slider = document.querySelector(".hero-slider");
  if (!slider) return; /* 메인에서만 동작 */

  /* 이미지 파일명 규칙
     1) 현재 파일이 01_index_main.jpg 라면
     2) 아래처럼 1~3으로 준비했다고 가정
     - 01_index_main1.jpg / 01_index_main2.jpg / 01_index_main3.jpg
     파일명이 다르면 배열만 수정하면 됨
  */
  const images = [
    "/assets/images/01_index/01_index_main.jpg",
    "/assets/images/01_index/02_index_main.png",
    "/assets/images/01_index/03_index_main.png",
  ];

  /* 슬라이드 생성 */
  slider.innerHTML = "";

  images.forEach((src) => {
    const slide = document.createElement("div");
    slide.className = "hero-slide";
    slide.style.backgroundImage = `url("${src}")`;
    slider.appendChild(slide);
  });

  /* 무한루프용: 첫 장 복제해서 마지막에 추가 */
  const firstClone = slider.firstElementChild.cloneNode(true);
  slider.appendChild(firstClone);

  let index = 0;
  const total = images.length; /* 원본 장수(3) */
  const intervalMs = 4000;     /* 자동 전환 시간(원하면 조절) */

  function goNext() {
    index += 1;
    slider.style.transition = "transform 800ms ease";
    slider.style.transform = `translateX(-${index * 100}%)`;

    /* 마지막(복제 슬라이드)까지 갔으면, 순간이동으로 0으로 복귀 */
    if (index === total) {
      window.setTimeout(() => {
        slider.style.transition = "none";
        slider.style.transform = "translateX(0)";
        index = 0;
      }, 820); /* transition(800ms)보다 살짝 크게 */
    }
  }

  window.setInterval(goNext, intervalMs);
}

document.addEventListener("DOMContentLoaded", () => {
  initHeroSlider(); /* DOM 준비 후 실행 */
});