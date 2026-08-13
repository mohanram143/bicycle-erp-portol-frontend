import React, { useEffect, useState } from 'react';

// Rough centroid lat/lng for Indian states — keep small list for common states.
const STATE_CENTROIDS = {
  "Maharashtra": [76.5, 19.6],
  "Karnataka": [76.6, 15.3],
  "Tamil Nadu": [78.7, 11.0],
  "Kerala": [76.3, 10.8],
  "Gujarat": [71.2, 22.3],
  "Rajasthan": [73.7, 27.2],
  "Uttar Pradesh": [80.9, 26.8],
  "Bihar": [85.0, 25.1],
  "West Bengal": [87.0, 22.9],
  "Madhya Pradesh": [78.6, 22.9],
  "Odisha": [85.8, 20.9],
  "Telangana": [79.0, 18.0],
  "Andhra Pradesh": [79.2, 15.9],
  "Jharkhand": [85.3, 23.4],
  "Assam": [92.8, 26.7],
  "Punjab": [75.7, 30.9],
  "Haryana": [76.9, 29.0],
  "Delhi": [77.2, 28.6],
};

export default function IndiaMap({ apiPath = '/api/dashboard' }) {
  const [data, setData] = useState({ shipmentsByState: [] });
  const [loading, setLoading] = useState(true);
  const [mapLib, setMapLib] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const [rsMaps, apiRes] = await Promise.all([
          import('react-simple-maps').catch(() => null),
          fetch(apiPath).then((r) => r.json()).catch(() => ({ data: {} })),
        ]);
        if (!mounted) return;
        setData(apiRes.data || {});
        if (rsMaps) {
          setMapLib({
            ComposableMap: rsMaps.ComposableMap,
            Geographies: rsMaps.Geographies,
            Geography: rsMaps.Geography,
            ZoomableGroup: rsMaps.ZoomableGroup,
            Marker: rsMaps.Marker,
          });
        }
      } catch (err) {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, [apiPath]);

  if (loading) return <div style={{ color: 'var(--color-text-dim)' }}>Loading India map…</div>;
  if (!mapLib) return <div style={{ color: 'var(--color-text-dim)' }}>Install react-simple-maps to display India map.</div>;

  const { ComposableMap, Geographies, Geography, ZoomableGroup, Marker } = mapLib;

  const counts = {};
  (data.shipmentsByState || []).forEach((s) => {
    if (!s.state) return;
    const key = s.state.replace(/\s+/g, '') || s.state;
    counts[key] = (counts[key] || 0) + (s.count || 0);
  });

  const markers = Object.entries(STATE_CENTROIDS).map(([name, [lng, lat]]) => ({ coordinates: [lng, lat], name, count: counts[name.replace(/\s+/g, '')] || 0 }));
  const max = Math.max(1, ...markers.map((m) => m.count));

  return (
    <div>
      <ComposableMap projection="geoMercator" projectionConfig={{ scale: 1200, center: [82.8, 22.0] }} style={{ width: '100%', height: 320 }}>
        <ZoomableGroup>
          <Geographies geography="https://raw.githubusercontent.com/IndiaMap/india-state-topojson/master/india.topo.json">
            {({ geographies }) => geographies.map((geo) => (
              <Geography key={geo.rsmKey} geography={geo} fill="var(--color-surface-alt)" stroke="var(--color-border)" />
            ))}
          </Geographies>
          {markers.map((m, i) => (
            <Marker key={i} coordinates={m.coordinates}>
              <circle r={4 + (m.count / max) * 14} fill="rgba(224,39,27,0.92)" stroke="#fff" strokeWidth={0.8} />
            </Marker>
          ))}
        </ZoomableGroup>
      </ComposableMap>
      <div style={{ marginTop: 8, color: 'var(--color-text-dim)', fontSize: 13 }}>India shipments by state (approximate centers).</div>
    </div>
  );
}
