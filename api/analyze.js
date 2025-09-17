// /api/analyze.js  (행안부 주민등록 인구·세대 현황 - REST)
export default async function handler(req, res) {
  try {
    // 프론트에서 넘길 쿼리 파라미터 (기본값 포함)
    const {
      stdgCd = "",             // 법정동코드(10자리)  ex) 1168000000
      srchFrYm = "",           // 시작년월 YYYYMM    ex) 202210
      srchToYm = "",           // 종료년월 YYYYMM    ex) 202212 (선택)
      lv = "3",                // 레벨(데이터셋 가이드 기준) 기본 3
      regSeCd = "1",           // 구분 코드(가이드 기준) 기본 1
      pageNo = "1",
      numOfRows = "1000",
      type = "JSON"            // 응답 형식
    } = req.query;

    // CORS
    const allowed = process.env.ALLOWED_ORIGIN || "*";
    res.setHeader("Access-Control-Allow-Origin", allowed);
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.status(200).end();

    // 인증키 (Vercel → Settings → Environment Variables → MOIS_API_KEY 에 저장)
    const key = process.env.MOIS_API_KEY;
    if (!key) return res.status(500).json({ error: "API key missing (set MOIS_API_KEY)" });

    // ★ 스웨거 Request URL의 경로 그대로
    //    https://apis.data.go.kr/1741000/stdgPpltnHhStus/selectStdgPpltnHhStus
    const ENDPOINT = "https://apis.data.go.kr/1741000/stdgPpltnHhStus/selectStdgPpltnHhStus";

    const url = new URL(ENDPOINT);
    url.searchParams.set("serviceKey", key); // 가이드에 따라 Decoding(일반) 키 권장
    url.searchParams.set("stdgCd", stdgCd);
    url.searchParams.set("srchFrYm", srchFrYm);
    if (srchToYm) url.searchParams.set("srchToYm", srchToYm);
    url.searchParams.set("lv", lv);
    url.searchParams.set("regSeCd", regSeCd);
    url.searchParams.set("type", type);
    url.searchParams.set("numOfRows", numOfRows);
    url.searchParams.set("pageNo", pageNo);

    const r = await fetch(url.toString(), { headers: { accept: "*/*" } });
    const text = await r.text();

    if (!r.ok) {
      return res.status(502).json({
        error: "Upstream error",
        status: r.status,
        bodySnippet: text.slice(0, 400)
      });
    }

    // 보통 이 API는 { response: { body: { items: { item: [...] }}}} 구조일 수 있음
    let data;
    try { data = JSON.parse(text); }
    catch {
      return res.status(502).json({ error: "Non-JSON response", bodySnippet: text.slice(0, 400) });
    }

    // 안전하게 아이템 배열을 찾아봄
    // 정답: 대문자 Response 경로 우선 처리 + 기존 경로는 백업
    const items =
      data?.Response?.items?.item ??      // ← 실제 응답 구조
      data?.response?.body?.items?.item ?? // (백업 경로)
      data?.data ??                        // (ODcloud 스타일 백업)
    [];

// 단일 객체로 내려오는 경우도 안전하게 배열화
const rows = Array.isArray(items) ? items : (items ? [items] : []);


    const rows = Array.isArray(items) ? items : (items ? [items] : []);
    const summary = { count: rows.length };

    res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=60");
    return res.status(200).json({
      query: { stdgCd, srchFrYm, srchToYm, lv, regSeCd, pageNo, numOfRows, type },
      summary,
      sample: rows[0] ?? null
    });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
