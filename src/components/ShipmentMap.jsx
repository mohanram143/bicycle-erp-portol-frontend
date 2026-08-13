import React, { useEffect, useState } from 'react';

// TopoJSON URL for world map (uses world-atlas package CDN)
const WORLD_TOPOJSON = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

export default function ShipmentMap({ apiPath = '/api/dashboard' }) {
  const [worldGeo, setWorldGeo] = useState(null);
  const [data, setData] = useState({ shipmentsByCountry: {}, shipmentsByState: [] });
  const [loading, setLoading] = useState(true);
  const [mapLib, setMapLib] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        // Dynamic imports: avoid build-time failure if libs aren't installed
        const [topojsonClient, d3Geo, rsMaps, topoJsonRaw, apiRes] = await Promise.all([
          import('topojson-client').catch(() => null),
          import('d3-geo').catch(() => null),
          import('react-simple-maps').catch(() => null),
          fetch(WORLD_TOPOJSON).then((r) => r.json()).catch(() => null),
          fetch(apiPath).then((r) => r.json()).catch(() => ({ data: {} })),
        ]);

        if (!mounted) return;

        // set data from API
        setData(apiRes.data || {});

        // build geo features if topo loaded
        if (topoJsonRaw && topojsonClient) {
          const geo = topojsonClient.feature(topoJsonRaw, topoJsonRaw.objects.countries);
          setWorldGeo(geo.features);
        }

        // expose needed libs/components to render
        if (rsMaps && d3Geo) {
          setMapLib({
            ComposableMap: rsMaps.ComposableMap,
            Geographies: rsMaps.Geographies,
            Geography: rsMaps.Geography,
            ZoomableGroup: rsMaps.ZoomableGroup,
            Marker: rsMaps.Marker,
            geoCentroid: d3Geo.geoCentroid,
          });
        }
      } catch (err) {
        // ignore errors — map will show fallback
        // console.warn('ShipmentMap load error', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, [apiPath]);

  if (loading) return <div style={{ color: 'var(--color-text-dim)' }}>Loading map…</div>;
  if (!mapLib || !worldGeo) return (
    <div style={{ color: 'var(--color-text-dim)' }}>
      Map libraries not available. Install react-simple-maps, topojson-client and d3-geo to see the map.
    </div>
  );

  const { ComposableMap, Geographies, Geography, ZoomableGroup, Marker, geoCentroid } = mapLib;
  const countryCounts = data.shipmentsByCountry || {};

  const markers = [];
  for (const feat of worldGeo) {
    const props = feat.properties || {};
    const isoA2 = props.ISO_A2 || props.iso_a2 || props.ADM0_A3 || props.ISO_A3 || props.iso_a3;
    const key = isoA2 || props.name || null;
    const count = key ? (countryCounts[key] || countryCounts[key?.toUpperCase?.()] || 0) : 0;
    if (count > 0) {
      const centroid = geoCentroid(feat);
      markers.push({ coordinates: centroid, count, name: props.name || key });
    }
  }

  const max = Math.max(1, ...markers.map((m) => m.count));

  return (
    <div>
      <ComposableMap projectionConfig={{ scale: 140 }} style={{ width: '100%', height: 360 }}>
        <ZoomableGroup>
          <Geographies geography={{ type: 'FeatureCollection', features: worldGeo || [] }}>
            {({ geographies }) => geographies.map((geo) => (
              <Geography key={geo.rsmKey} geography={geo} fill="var(--color-surface-alt)" stroke="var(--color-border)" />
            ))}
          </Geographies>
          {markers.map((m, i) => (
            <Marker key={i} coordinates={m.coordinates}>
              <circle r={6 + (m.count / max) * 18} fill="rgba(224,39,27,0.9)" stroke="#fff" strokeWidth={1} opacity={0.9} />
            </Marker>
          ))}
        </ZoomableGroup>
      </ComposableMap>
      <div style={{ marginTop: 8, color: 'var(--color-text-dim)', fontSize: 13 }}>
        Showing shipment volumes by country. Install map libs to see interactive map.
      </div>
    </div>
  );
}
