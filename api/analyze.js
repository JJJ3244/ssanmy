// /api/analyze.js
export default async function handler(req, res) {
  try {
    const { city = "", district = "", dong = "" } = req.query;

    // CORS (배포 후 ALLOWED_ORIGIN을 https://www.ssan.my 로 바꾸세요)
    const allowed = process.env.ALLOWED_ORIGIN || "*";
    res.setHeader("Access-Control-Allow-Origin", allowed);
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.status(200).end();

    const key = process.env.MOIS_API_KEY;
    if (!key) return res.status(500).json({ error: "API key missing" });

    // ★ 공공데이터포털 실제 엔드포인트로 교체 필요 (지금은 껍데기)
    const url = new URL("https://api.odcloud.kr/api/15077606/v1/uddi:EXAMPLE");
    url.searchParams.set("serviceKey", key);
    url.searchParams.set("page", "1");
    url.searchParams.set("perPage", "10");

    const r = await fetch(url);
    if (!r.ok) return res.status(502).json({ error: "Upstream error" });
    const raw = await r.json();

    const count = Array.isArray(raw?.data) ? raw.data.length : 0;
    res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=60");
    return res.status(200).json({ query: { city, district, dong }, summary: { count } });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
