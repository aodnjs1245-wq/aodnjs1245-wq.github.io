/* =========================
   03_admin_library.js
   - 자료실: 등록(파일 업로드) + 목록 + 삭제
========================= */

import { auth, db, storage } from "/js/01_firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    query,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-storage.js";

const MAX_FILE_MB = 30;

function qs(id) {
    return document.getElementById(id);
}

function formatDate(value) {
    const d = value?.toDate ? value.toDate() : new Date(value);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function formatBytes(bytes) {
    const n = Number(bytes);
    if (!n || n <= 0) return "";

    const units = ["B", "KB", "MB", "GB"];
    let i = 0;
    let v = n;

    while (v >= 1024 && i < units.length - 1) {
        v = v / 1024;
        i++;
    }

    return `${v.toFixed(i === 0 ? 0 : 1)}${units[i]}`;
}

/* 파일 업로드 */
async function uploadFile(file) {
    if (!file) {
        return {
            file_url: null,
            file_name: null,
            file_size: null,
            file_path: null
        };
    }

    const maxBytes = MAX_FILE_MB * 1024 * 1024;

    if (file.size > maxBytes) {
        throw new Error(`파일 용량이 너무 큽니다. ${MAX_FILE_MB}MB 이하만 업로드 가능합니다.`);
    }

    const ts = Date.now();
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    const uuid = crypto.randomUUID ? crypto.randomUUID() : String(ts);
    const safeFile = ext ? `${uuid}.${ext}` : uuid;
    const filePath = `library/${ts}_${safeFile}`;

    const storageRef = ref(storage, filePath);

    await uploadBytes(storageRef, file, {
        contentType: file.type
    });

    const fileUrl = await getDownloadURL(storageRef);

    return {
        file_url: fileUrl,
        file_name: file.name,
        file_size: file.size,
        file_path: filePath
    };
}

/* DB 저장 */
async function insertLibraryItem(payload) {
    await addDoc(collection(db, "library_items"), {
        ...payload,
        created_at: serverTimestamp()
    });
}

/* 목록 불러오기 */
async function fetchLibraryItems() {
    const q = query(
        collection(db, "library_items"),
        orderBy("created_at", "desc")
    );

    const snap = await getDocs(q);

    return snap.docs.map((d) => ({
        id: d.id,
        ...d.data()
    }));
}

/* 삭제 */
async function deleteLibraryItem(row) {
    if (!confirm("해당 자료를 삭제할까요?")) return;

    await deleteDoc(doc(db, "library_items", row.id));

    if (row.file_path) {
        try {
            await deleteObject(ref(storage, row.file_path));
        } catch (error) {
            console.warn("DB는 삭제됐지만 파일 삭제 실패:", error);
        }
    }
}

/* 목록 렌더 */
function renderList(rows) {
    const wrap = qs("libraryAdminList");
    if (!wrap) return;

    if (!rows.length) {
        wrap.innerHTML = `<div style="color:#6b7280; font-size:14px;">등록된 자료가 없습니다.</div>`;
        return;
    }

    wrap.innerHTML = rows.map(r => {
        const date = r.created_at ? formatDate(r.created_at) : "";
        const size = r.file_size ? formatBytes(r.file_size) : "";

        const fileLine = r.file_url
            ? `<div style="margin-top:6px; color:#6b7280; font-size:13px;">
                첨부: <a href="${r.file_url}" target="_blank" style="text-decoration:underline;">${r.file_name || "첨부파일"}</a>
                ${size ? `(${size})` : ``}
               </div>`
            : `<div style="margin-top:6px; color:#6b7280; font-size:13px;">첨부: 없음</div>`;

        return `
            <div style="padding:14px 14px; border:1px solid #e5e7eb; border-radius:12px; background:#fff; margin-bottom:10px;">
                <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start;">
                    <div style="min-width:0;">
                        <div style="font-weight:800; color:#374151; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                            ${r.title}
                        </div>
                        <div style="margin-top:4px; color:#6b7280; font-size:13px;">작성일: ${date}</div>
                        ${fileLine}
                    </div>

                    <button data-id="${r.id}" class="btn-del"
                        style="flex:0 0 auto; padding:8px 10px; border:1px solid #e5e7eb; border-radius:10px; background:#fff; cursor:pointer;">
                        삭제
                    </button>
                </div>
            </div>
        `;
    }).join("");

    wrap.querySelectorAll(".btn-del").forEach(btn => {
        btn.addEventListener("click", async () => {
            const id = btn.getAttribute("data-id");
            const row = rows.find(x => x.id === id);
            if (!row) return;

            try {
                await deleteLibraryItem(row);
                await refresh();
            } catch (error) {
                console.error(error);
                alert("삭제에 실패했습니다. 콘솔을 확인해주세요.");
            }
        });
    });
}

/* 새로고침 */
async function refresh() {
    const rows = await fetchLibraryItems();
    renderList(rows);
}

/* 초기 실행 */
document.addEventListener("DOMContentLoaded", () => {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            location.href = "/06_admin/01_admin_login.html";
            return;
        }

        try {
            await refresh();
        } catch (error) {
            console.error(error);
        }

        const btnLogout = qs("btnLogout");
        if (btnLogout) {
            btnLogout.addEventListener("click", async () => {
                await signOut(auth);
                location.href = "/06_admin/01_admin_login.html";
            });
        }

        const form = qs("libraryForm");
        const btnSubmit = qs("btnSubmit");

        if (!form) return;

        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const title = (qs("libTitle")?.value || "").trim();
            const content = (qs("libContent")?.value || "").trim();
            const file = qs("libFile")?.files?.[0] || null;

            if (!title) {
                alert("제목은 필수입니다.");
                return;
            }

            btnSubmit.disabled = true;

            try {
                const fileInfo = await uploadFile(file);

                await insertLibraryItem({
                    title,
                    content: content || null,
                    ...fileInfo
                });

                form.reset();
                await refresh();

                alert("등록되었습니다.");
            } catch (error) {
                console.error(error);
                alert(error?.message || "등록에 실패했습니다. 콘솔을 확인해주세요.");
            } finally {
                btnSubmit.disabled = false;
            }
        });
    });
});