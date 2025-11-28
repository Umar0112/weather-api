import { parseStringPromise } from 'xml2js';

/**
 * Serverless function:
 * GET /api/weather?lat=38.99&lon=-77.01&format=json
 */
export default async function handler(req, res) {
  // Handle preflight CORS
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  const { lat = '38.99', lon = '-77.01', format = 'json' } = req.query;

  const url = `https://graphical.weather.gov/xml/sample_products/browser_interface/ndfdXMLclient.php?lat=${encodeURIComponent(
    lat
  )}&lon=${encodeURIComponent(lon)}&product=time-series&Unit=e&maxt=maxt&mint=mint&dew=dew&wspd=wspd&wdir=wdir&pop12=pop12&rh=rh`;

  try {
    const upstream = await fetch(url);
    if (!upstream.ok) {
      const text = await upstream.text();
      return res.status(502).json({ error: 'Upstream error', status: upstream.status, body: text });
    }
    const xml = await upstream.text();

    // If caller explicitly wants raw XML: return it
    if (format === 'xml') {
      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Access-Control-Allow-Origin', '*');
      // Caching: 5 minutes on CDN
      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=59');
      return res.status(200).send(xml);
    }

    // Convert XML → JSON
    const json = await parseStringPromise(xml, {
      explicitArray: false,
      mergeAttrs: true,
      explicitRoot: true,
      trim: true
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Cache on CDN for 5 minutes
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=59');

    return res.status(200).json(json);
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}
