import { NextResponse } from 'next/server';

function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dPhi = ((lat2 - lat1) * Math.PI) / 180;
  const dLambda = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) * Math.sin(dLambda / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Exact Coordinates of TinkerSpace Calicut
const TINKERSPACE_LAT = 11.2784487;
const TINKERSPACE_LON = 75.8442351;

interface ExtractedLocation {
  conciseName: string;
  detailedLocation: string;
  isSpecificBuilding: boolean;
}

function extractBuildingLevelLocation(
  geoData: any,
  lat?: number,
  lon?: number,
  locationOverride?: string
): ExtractedLocation {
  if (locationOverride && locationOverride.trim().length > 0) {
    const clean = locationOverride.trim().toUpperCase();
    return {
      conciseName: clean,
      detailedLocation: clean,
      isSpecificBuilding: true,
    };
  }

  // 1. Precise proximity to TinkerSpace Calicut (within 500m)
  if (typeof lat === 'number' && typeof lon === 'number') {
    const dist = getDistanceMeters(lat, lon, TINKERSPACE_LAT, TINKERSPACE_LON);
    if (dist <= 500) {
      return {
        conciseName: 'TINKERSPACE, CALICUT',
        detailedLocation: 'TinkerSpace Calicut, Paliative road, Velliparamba, Kozhikode, Kerala, India',
        isSpecificBuilding: true,
      };
    }
  }

  if (!geoData) {
    return {
      conciseName: 'TINKERSPACE, CALICUT',
      detailedLocation: 'TinkerSpace Calicut',
      isSpecificBuilding: true,
    };
  }

  const address = geoData.address || {};

  // Check if raw name in OSM references TinkerSpace
  const rawName = String(geoData.name || geoData.namedetails?.name || address.leisure || '');
  if (rawName.toLowerCase().includes('tinkerspace')) {
    return {
      conciseName: 'TINKERSPACE, CALICUT',
      detailedLocation: geoData.display_name || 'TinkerSpace Calicut, Kozhikode',
      isSpecificBuilding: true,
    };
  }

  // 2. Identify the building, venue, amenity, business, or POI from OpenStreetMap
  const building =
    geoData.name ||
    geoData.namedetails?.name ||
    address.leisure ||
    address.amenity ||
    address.building ||
    address.office ||
    address.shop ||
    address.tourism ||
    address.craft ||
    address.club ||
    address.historic ||
    address.commercial ||
    address.industrial ||
    address.aeroway ||
    address.house_name ||
    address.public_building ||
    null;

  let city =
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.suburb ||
    address.hamlet ||
    address.county ||
    null;

  // Normalize Calicut / Kozhikode for clean travel signage
  if (city && city.toLowerCase() === 'kozhikode') {
    city = 'CALICUT';
  }

  let conciseName = 'TINKERSPACE, CALICUT';
  let isSpecificBuilding = false;

  if (building && typeof building === 'string' && building.trim().length > 0) {
    isSpecificBuilding = true;
    let cleanBuilding = building.trim();
    const lower = cleanBuilding.toLowerCase();

    if (city && typeof city === 'string') {
      const cityLower = city.toLowerCase();
      if (lower.endsWith(' ' + cityLower)) {
        cleanBuilding = cleanBuilding.slice(0, cleanBuilding.length - city.length - 1).trim();
        conciseName = `${cleanBuilding.toUpperCase()}, ${city.toUpperCase()}`;
      } else if (!lower.includes(cityLower)) {
        conciseName = `${cleanBuilding.toUpperCase()}, ${city.toUpperCase()}`;
      } else {
        conciseName = cleanBuilding.toUpperCase();
      }
    } else {
      conciseName = cleanBuilding.toUpperCase();
    }
  } else {
    // If no building detected, use neighborhood / street + city
    const subArea = address.neighbourhood || address.suburb || address.road || address.hamlet;
    if (subArea && city) {
      conciseName = `${subArea.toUpperCase()}, ${city.toUpperCase()}`;
    } else if (city) {
      conciseName = city.toUpperCase();
    }
  }

  const parts = [
    building,
    address.road,
    address.neighbourhood || address.suburb || address.hamlet,
    address.city || address.town || address.village,
    address.state,
    address.country,
  ].filter(Boolean);

  const detailedLocation = parts.length > 0 ? parts.join(', ') : (geoData.display_name || conciseName);

  return { conciseName, detailedLocation, isSpecificBuilding };
}

export async function POST(req: Request) {
  try {
    const { lat, lon, locationOverride } = await req.json();

    if (!locationOverride && (!lat || !lon)) {
      return NextResponse.json({ error: 'Missing location data' }, { status: 400 });
    }

    let geoData: any = null;

    // 1. Precise Reverse Geocoding via Nominatim with full namedetails and extratags
    if (!locationOverride && typeof lat === 'number' && typeof lon === 'number') {
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1&extratags=1&namedetails=1`,
          {
            headers: { 'User-Agent': 'GATE-Hackathon-App (contact@layover-gate.app)' },
            signal: AbortSignal.timeout(3500),
          }
        );
        if (geoRes.ok) {
          geoData = await geoRes.json();
        }
      } catch (e) {
        console.warn('Reverse geocoding network/timeout error:', e);
      }
    }

    // 2. Extract building-level concise location name and venue category
    const { conciseName, detailedLocation, isSpecificBuilding } = extractBuildingLevelLocation(
      geoData,
      lat,
      lon,
      locationOverride
    );

    const address = geoData?.address || {};
    const osmCategory =
      geoData?.type ||
      geoData?.class ||
      geoData?.addresstype ||
      address?.leisure ||
      address?.amenity ||
      address?.building ||
      address?.tourism ||
      address?.office ||
      'transit hub';

    const city =
      address?.city ||
      address?.town ||
      address?.village ||
      address?.municipality ||
      address?.suburb ||
      address?.county ||
      'local area';

    return NextResponse.json({
      airport: conciseName,
      osmCategory: String(osmCategory),
      city: String(city),
      missions: [],
    });
  } catch (error) {
    console.error('Setup API Error, falling back to building level location:', error);
    return NextResponse.json({
      airport: 'TINKERSPACE, CALICUT',
      osmCategory: 'hackerspace',
      city: 'CALICUT',
      missions: [],
    });
  }
}
