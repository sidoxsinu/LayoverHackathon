const fs = require('fs');

let code = fs.readFileSync('src/components/SetupScreen.tsx', 'utf8');

// Add imports
code = code.replace(/import \{ useState, useCallback \} from 'react';/, "import { useState, useCallback, useEffect } from 'react';\nimport { Mission } from '@/lib/missions';");

// Update Props
code = code.replace(/onStart: \(payload: \{/g, `onStart: (payload: {\n  airportName: string;\n  customMissions: Mission[];`);

// Add state for airport and missions
code = code.replace(/const \[error, setError\] = useState<string \| null>\(null\);/g, 
`const [error, setError] = useState<string | null>(null);
  const [airportName, setAirportName] = useState('LOCATING TOWER...');
  const [customMissions, setCustomMissions] = useState<Mission[]>([]);
  const [isLocating, setIsLocating] = useState(true);

  useEffect(() => {
    let active = true;
    async function initAirport() {
      try {
        const geoRes = await fetch('https://freeipapi.com/api/json');
        if (!geoRes.ok) throw new Error('Geo API failed');
        const geo = await geoRes.json();
        
        const initRes = await fetch('/api/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ city: geo.cityName, region: geo.regionName, country: geo.countryName })
        });
        if (!initRes.ok) throw new Error('Init API failed');
        const data = await initRes.json();
        
        if (active && data.airportName) {
          setAirportName(data.airportName.toUpperCase());
          setCustomMissions(data.missions || []);
          setIsLocating(false);
        }
      } catch (err) {
        if (active) {
          setAirportName('TBA');
          setIsLocating(false);
        }
      }
    }
    initAirport();
    return () => { active = false; };
  }, []);`);

// Update handleStart
code = code.replace(/gate: gate \|\| 'TBA',/g, 
`airportName,
      customMissions,
      gate: gate || 'TBA',`);

// Insert Airport row right above Gate
code = code.replace(/\{\/\* Gate \*\/\}/g, 
`{/* Airport */}
        <Row>
          <Label>AIRPORT</Label>
          <input
            type="text"
            value={airportName}
            readOnly
            style={{ ...inputStyle, color: '#8C887C', backgroundColor: '#181816' }}
          />
        </Row>

        {/* Gate */}`);

fs.writeFileSync('src/components/SetupScreen.tsx', code);
