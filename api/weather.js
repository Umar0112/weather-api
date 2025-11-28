import { parseStringPromise } from "xml2js";

export default async function handler(req, res) {
  // Required CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight request
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const { lat = "38.99", lon = "-77.01" } = req.query;

  const url = `https://graphical.weather.gov/xml/sample_products/browser_interface/ndfdXMLclient.php?lat=${lat}&lon=${lon}&product=time-series&Unit=e&maxt=maxt&mint=mint`;

  try {
    const upstream = await fetch(url);
    const xml = await upstream.text();

    const json = await parseStringPromise(xml, {
      explicitArray: false,
      mergeAttrs: true,
    });

    // CORS again (important!)
    res.setHeader("Access-Control-Allow-Origin", "*");

    return res.status(200).json(json);
  } catch (error) {
    console.error("Error:", error);

    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(500).json({ error: error.message });
  }
}
