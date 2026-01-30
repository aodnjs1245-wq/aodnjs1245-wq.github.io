/* =========================
   01_supabase.js
   - Supabase Client 설정
   - 중복 로드되어도 1번만 생성
========================= */

if (!window.supabaseClient) {
  window.supabaseClient = supabase.createClient(
    "https://yhakzowipdzazebswmgx.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloYWt6b3dpcGR6YXplYnN3bWd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NDMyMDUsImV4cCI6MjA4NTMxOTIwNX0.Id3Lfhzpz9FG8jA7b9xkKXrfiZXu2VvvOX7JDpgdrgw"
  );
}