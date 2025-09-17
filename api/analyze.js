// /api/analyze.js
export default async function handler(req, res) {
  try {
    const {
      stdgCd = "",
      srchFrYm = "",
      srchToYm = "",
      lv = "3",
      regSeCd = "1",
      pageNo = "1",
      numOfRows = "1000",
      type = "JSON"
    } = req.query;

    // CORS
    const allowed = process.env.ALLOWED_ORIGIN || "*";
    res.setHeader("Access-Control-Allow-Origin", allowed);
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.status(200).end();

    // 키 확인
    const key = process.env.MOIS_API_KEY;
    if (!key) {
      return res.status(500).json({ error: "API key missing: set MOIS_API_KEY in Vercel env" });
    }

    // ★ 정확한 엔드포인트 확인 (Swagger의 Request URL 경로 그대로)
    // 예) https://apis.data.go.kr/1741000/stdgPpltnHhStus/selectStdgPpltnHhStus
    const ENDPOINT = "https://apis.data.go.kr/1741000/stdgPpltnHhStus/selectStdgPpltnHhStus";

    // 필수 파라미터 체크
    if (!stdgCd || !srchFrYm) {
      return res.status(400).json({ error: "Missing required params: stdgCd, srchFrYm" });
    }

    const url = new URL(ENDPOINT);
    url.searchParams.set("serviceKey", key);
    url.searchParams.set("stdgCd", stdgCd);
    url.searchParams.set("srchFrYm", srchFrYm);
    if (srchToYm) url.searchParams.set("srchToYm", srchToYm);
    url.searchParams.set("lv", lv);
    url.searchParams.set("regSeCd", regSeCd);
    url.searchParams.set("type", type);
    url.searchParams.set("numOfRows", numOfRows);
    url.searchParams.set("pageNo", pageNo);

    // 호출
    const resp = await fetch(url.toString(), { headers: { accept: "*/*" } });
    const bodyText = await resp.text();

    if (!resp.ok) {
      return res.status(502).json({
        error: "Upstream error",
        status: resp.status,
        bodySnippet: bodyText.slice(0, 500)
      });
    }

    // JSON 파싱 시도 (XML이면 예외)
    let data;
    try {
      data = JSON.parse(bodyText);
    } catch (e) {
      // XML로 온 경우 타입 파라미터(type/returnType) 다시 확인 필요
      return res.status(502).json({
        error: "Non-JSON response (likely XML). Check 'type=JSON' or param names.",
        bodySnippet: bodyText.slice(0, 500)
      });
    }

    // 실제 응답 구조 대응: Response.items.item 또는 response.body.items.item
    const itemsPathA = data?.Response?.items?.item;
    const itemsPathB = data?.response?.body?.items?.item;
    const rawItems = itemsPathA ?? itemsPathB ?? data?.data ?? [];

    const rows = Array.isArray(rawItems) ? rawItems : (rawItems ? [rawItems] : []);
    const summary = { count: rows.length };

    res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=60");
    return res.status(200).json({
      query: { stdgCd, srchFrYm, srchToYm, lv, regSeCd, pageNo, numOfRows, type },
      summary,
      sample: rows[0] ?? null
    });
  } catch (err) {
    // 절대 크래시하지 않도록 최종 방어
    return res.status(500).json({ error: "Handler crashed", message: String(err) });
  }
}
