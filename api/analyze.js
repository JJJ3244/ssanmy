// /api/analyze.js
export default async function handler(req, res) {
  try {
    const { city = "", district = "", dong = "" } = req.query;

    // --- CORS (처음엔 *로 두고, 배포 후 ALLOWED_ORIGIN에 https://www.ssan.my 넣으세요)
    const allowed = process.env.ALLOWED_ORIGIN || "*";
    res.setHeader("Access-Control-Allow-Origin", allowed);
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.status(200).end();

    // --- 공공데이터포털 인증키 (환경변수에 반드시 넣어야 함)
    const key = process.env.MOIS_API_KEY;
    if (!key) return res.status(500).json({ error: "API key missing (set MOIS_API_KEY)" });

    // ★ 행안부 주민등록 인구/세대 현황 엔드포인트 (화면에 보인 End Point 그대로 사용)
    // 예: https://apis.data.go.kr/1741000/stdgPpltnHhStus
    const ENDPOINT = "https://apis.data.go.kr/1741000/stdgPpltnHhStus";

    // 보통 page/perPage/returnType 또는 type 파라미터가 필요합니다.
    // (데이터셋 문서 기준으로 바꾸세요. 대부분 JSON 응답은 returnType=JSON 으로 됩니다.)
    const url = new URL(ENDPOINT);
    url.searchParams.set("serviceKey", key);                // 인코딩(Encoding) 키 권장
    url.searchParams.set("page", "1");
    url.searchParams.set("perPage", "10");
    url.searchParams.set("returnType", "JSON");             // 혹은 resultType=JSON / type=json 인 경우도 있음

    // 필요하면 지역 필터를 cond[...] 형태로 추가 (데이터셋 문서에 맞춰 키를 변경)
    // 예시) url.searchParams.set("cond[CTPV_NM::EQ]", city);  // 시/도명 필드명 예시
    // 예시) url.searchParams.set("cond[SGG_NM::EQ]", district);
    // 예시) url.searchParams.set("cond[EMD_NM::EQ]", dong);

    const r = await fetch(url.toString(), { headers: { accept: "application/json" } });
    const text = await r.text();

    if (!r.ok) {
      // 원인 파악을 위해 상태코드 & 일부 본문을 함께 반환 (키 노출 없음)
      return res.status(502).json({
        error: "Upstream error",
        status: r.status,
        bodySnippet: text.slice(0, 300)
      });
    }

    // JSON 파싱
    let data;
    try { data = JSON.parse(text); }
    catch {
      // 혹시 XML이 오면 returnType 파라미터가 맞는지 확인 필요
      return res.status(502).json({ error: "Non-JSON response. Check returnType/type param.", bodySnippet: text.slice(0, 300) });
    }

    // 데이터 배열 위치는 보통 data 필드에 있음 (문서에 따라 다를 수 있음)
    const rows = Array.isArray(data?.data) ? data.data : [];
    const summary = { count: rows.length };

    // 캐시(엣지) - 10분
    res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=60");
    return res.status(200).json({ query: { city, district, dong }, summary, rawCount: rows.length });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
