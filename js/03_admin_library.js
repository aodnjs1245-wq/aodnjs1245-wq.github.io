/* =========================
   03_admin_library.js
   - 자료실: 등록(파일 업로드) + 목록 + 삭제
========================= */

const BUCKET_NAME = "downloads"; // 스토리지 버킷명
const MAX_FILE_MB = 30; // 파일 제한(MB)

function qs(id) { return document.getElementById(id); }

function formatDate(iso) {
    const d = new Date(iso);
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

//* 로그인 확인(관리자만 접근) */
async function requireAdmin() {

    // 세션 확인
    const { data, error } = await window.supabaseClient.auth.getSession();

    if (error) {
        console.error(error);
        location.href = "/06_admin/01_admin_login.html";
        return null;
    }

    const session = data?.session;

    // 로그인 안 된 경우
    if (!session) {
        location.href = "/06_admin/01_admin_login.html";
        return null;
    }

    // 현재 로그인한 사용자 UID
    const userId = session.user.id;

    // 관리자 테이블 확인
    const { data: adminData, error: adminError } = await window.supabaseClient
        .from("admin_users")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

    if (adminError) {
        console.error(adminError);
        alert("관리자 권한 확인에 실패했습니다.");
        return null;
    }

    // 관리자 목록에 없으면 차단
    if (!adminData) {
        alert("관리자 권한이 없습니다.");
        location.href = "/";
        return null;
    }

    return session;
}
/* 로그아웃 */
async function handleLogout() {
    await window.supabaseClient.auth.signOut();
    location.href = "/06_admin/01_admin_login.html"; // 너 로그인 페이지 경로로 수정
}

/* 파일 업로드 + 공개 URL 반환 */
async function uploadFile(file) {
    if (!file) return { file_url: null, file_name: null, file_size: null, file_path: null };

    const maxBytes = MAX_FILE_MB * 1024 * 1024;
    if (file.size > maxBytes) {
        throw new Error(`파일 용량이 너무 큽니다. ${MAX_FILE_MB}MB 이하만 업로드 가능합니다.`);
    }

    // 파일명은 DB에 따로 저장하고, Storage에는 안전한 이름으로만 저장
    const ts = Date.now();
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    const uuid = (crypto.randomUUID ? crypto.randomUUID() : String(ts));
    const safeFile = ext ? `${uuid}.${ext}` : `${uuid}`;
    const filePath = `library/${ts}_${safeFile}`;
    const { error: uploadError } = await window.supabaseClient
        .storage
        .from(BUCKET_NAME)
        .upload(filePath, file, { upsert: false });

    if (uploadError) throw uploadError;

    const { data: pub } = window.supabaseClient
        .storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

    const fileUrl = pub?.publicUrl || null;

    return {
        file_url: fileUrl,
        file_name: file.name,
        file_size: file.size,
        file_path: filePath
    };
}

/* DB 저장 */
async function insertLibraryItem(payload) {
    const { error } = await window.supabaseClient
        .from("library_items")
        .insert(payload);

    if (error) throw error;
}

/* 목록 불러오기 */
async function fetchLibraryItems() {
    const { data, error } = await window.supabaseClient
        .from("library_items")
        .select("id, title, created_at, file_url, file_name, file_size, file_path")
        .order("id", { ascending: false });

    if (error) throw error;
    return data || [];
}

/* 삭제(파일도 같이) */
async function deleteLibraryItem(row) {
    if (!confirm("해당 자료를 삭제할까요?")) return;

    // DB 먼저 삭제
    const { error: delError } = await window.supabaseClient
        .from("library_items")
        .delete()
        .eq("id", row.id);

    if (delError) throw delError;

    // 파일 경로가 있으면 스토리지 파일도 삭제
    if (row.file_path) {
        const { error: storageError } = await window.supabaseClient
            .storage
            .from(BUCKET_NAME)
            .remove([row.file_path]);

        if (storageError) {
            console.warn("DB는 삭제됐지만 파일 삭제 실패:", storageError);
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

    // 삭제 버튼 이벤트
    wrap.querySelectorAll(".btn-del").forEach(btn => {
        btn.addEventListener("click", async () => {
            const id = Number(btn.getAttribute("data-id"));
            const row = rows.find(x => x.id === id);
            if (!row) return;

            try {
                await deleteLibraryItem(row);
                await refresh();
            } catch (e) {
                console.error(e);
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

document.addEventListener("DOMContentLoaded", async () => {
    // 로그인 확인
    const session = await requireAdmin();
    if (!session) return;

    // 목록 로드
    try {
        await refresh();
    } catch (e) {
        console.error(e);
    }

    // 로그아웃
    const btnLogout = qs("btnLogout");
    if (btnLogout) {
        btnLogout.addEventListener("click", handleLogout);
    }

    // 등록
    const form = qs("libraryForm");
    const btnSubmit = qs("btnSubmit");

    if (form) {
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
                // 파일 업로드(선택)
                const fileInfo = await uploadFile(file);

                // DB 저장
                await insertLibraryItem({
                    title,
                    content: content || null,
                    ...fileInfo
                });

                // 폼 초기화
                form.reset();

                // 목록 갱신
                await refresh();

                alert("등록되었습니다.");
            } catch (err) {
                console.error(err);
                alert(err?.message || "등록에 실패했습니다. 콘솔을 확인해주세요.");
            } finally {
                btnSubmit.disabled = false;
            }
        });
    }
});
