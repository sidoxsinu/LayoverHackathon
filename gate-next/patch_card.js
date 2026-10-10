const fs = require('fs');
let code = fs.readFileSync('src/components/MissionCard.tsx', 'utf8');

code = code.replace(/if \(!mission\) return null;/g, 
`if (!mission) {
    return (
      <div
        style={{
          margin: '12px 16px',
          backgroundColor: '#E6E1D3',
          border: '1px dashed #8C887C',
          borderRadius: '2px',
          padding: '40px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px'
        }}
      >
        <span style={{ fontFamily: 'var(--font-plex), monospace', fontSize: '12px', color: '#101010', animation: 'blink 1s infinite' }}>
          CONTACTING TOWER...
        </span>
        <span style={{ fontFamily: 'var(--font-barlow), sans-serif', fontSize: '16px', color: '#8C887C', letterSpacing: '0.05em' }}>
          GENERATING OBJECTIVE
        </span>
      </div>
    );
  }`);

fs.writeFileSync('src/components/MissionCard.tsx', code);
