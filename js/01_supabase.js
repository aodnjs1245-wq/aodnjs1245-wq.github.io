/* =========================
   01_supabase.js
   - Supabase Client 설정
   - 중복 로드되어도 1번만 생성
========================= */

if (!window.supabaseClient) {
  window.supabaseClient = supabase.createClient(
    "https://yhakzowipdzazebswmgx.supabase.co",
    "sb_publishable_YMxUFWADxfI2wSmMU7RDew_Q6nMYnR2"
  );
}

