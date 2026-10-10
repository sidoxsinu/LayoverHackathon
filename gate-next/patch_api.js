const fs = require('fs');
let code = fs.readFileSync('src/app/api/mission/route.ts', 'utf8');

code = code.replace(/"llama3-8b-8192"/, '"openai/gpt-oss-20b"');

fs.writeFileSync('src/app/api/mission/route.ts', code);
