/* =========================
   01_supabase.js
   - Supabase Client 설정
   - 중복 로드되어도 1번만 생성
========================= */

if (!window.supabaseClient) {
  window.supabaseClient = supabase.createClient(
    "https://wnaezdaizoildoyuirqe.supabase.co",
    "sb_publishable_m9OudVQBw4tvPC0JFieUXg_B8T5Iww1"
  );
}

