/* =========================
   DB 카드 추가 로드(하드코딩 유지)
========================= */
function escapeHtml(str) {
    return String(str ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function nl2br(str) {
    return escapeHtml(str).replaceAll("\n", "<br>");
}

function li(label, valueHtml) {
    if (!valueHtml) return "";
    return `<li><strong>${label}</strong>${valueHtml}</li>`;
}

function renderCard(row) {
    const f = row.fields || {};
    const img = row.image_url ? escapeHtml(row.image_url) : "";
    const imgTag = img ? `<img src="${img}" alt="실적 이미지" loading="lazy">` : "";

    let ul = "";
    if (row.category === "key") {
        ul =
            li("공사일자", escapeHtml(f.work_date)) +
            li("발&nbsp;주&nbsp;처", escapeHtml(f.client)) +
            li("시&nbsp;공&nbsp;사", escapeHtml(f.contractor)) +
            li("규&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;모", escapeHtml(f.scale));
    } else {
        ul =
            li("운영기간", escapeHtml(f.period)) +
            li("설비용량", escapeHtml(f.capacity)) +
            li("발&nbsp;주&nbsp;처", escapeHtml(f.client)) +
            li("주요업무", nl2br(f.tasks));
    }

    return `
    <div class="portfolio-card card">
      <div class="portfolio-img">${imgTag}</div>
      <div class="portfolio-info">
        <h2>${escapeHtml(row.title)}</h2>
        <ul>${ul}</ul>
      </div>
    </div>
  `;
}

async function appendDbCards(category) {
    const wrap = document.getElementById("portfolioList");
    if (!wrap) return;

    const { data, error } = await window.supabaseClient
        .from("performance_cards")
        .select("id, category, title, image_url, sort_key, fields, created_at")
        .eq("category", category)
        .order("sort_key", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error);
        return;
    }
    if (!data || data.length === 0) return;

    const html = data.map(renderCard).join("");
    wrap.insertAdjacentHTML("afterbegin", html); // 하드코딩 위에 추가(최신이 위)
}

document.addEventListener("DOMContentLoaded", () => {
    const category = document.body.getAttribute("data-perf-category"); // key / maintenance
    if (!category) return;
    appendDbCards(category);
});
