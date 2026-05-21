/* =========================
   DB 카드 추가 로드(하드코딩 유지)
========================= */

import { db } from "/js/01_firebase.js";

import {
    collection,
    getDocs,
    query,
    where,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

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
    const imgTag = img
        ? `<img src="${img}" alt="실적 이미지" loading="lazy">`
        : "";

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

    try {
        const q = query(
            collection(db, "performance_cards"),
            where("category", "==", category),
            orderBy("created_at", "desc")
        );

        const snap = await getDocs(q);

        if (snap.empty) return;

        const rows = snap.docs.map((d) => ({
            id: d.id,
            ...d.data()
        }));

        rows.sort((a, b) => {
            const aKey = Number(a.sort_key || 0);
            const bKey = Number(b.sort_key || 0);

            if (bKey !== aKey) return bKey - aKey;

            const aTime = a.created_at?.toDate
                ? a.created_at.toDate().getTime()
                : 0;

            const bTime = b.created_at?.toDate
                ? b.created_at.toDate().getTime()
                : 0;

            return bTime - aTime;
        });

        const html = rows.map(renderCard).join("");

        wrap.insertAdjacentHTML("afterbegin", html);
    } catch (error) {
        console.error(error);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const category = document.body.getAttribute("data-perf-category");
    if (!category) return;

    appendDbCards(category);
});