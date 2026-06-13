const fs = require('fs');

const logPath = 'C:\\Users\\sandh\\.gemini\\antigravity\\brain\\36187b20-1382-4a55-bcc5-9ae80a81079f\\.system_generated\\logs\\transcript.jsonl';
const content = fs.readFileSync(logPath, 'utf8');

const lines = content.split('\n');

for (let line of lines) {
    if (line.includes('lg:col-span-8 space-y-4')) {
        try {
            const obj = JSON.parse(line);
            if (obj.tool_calls) {
                obj.tool_calls.forEach(tc => {
                    if (tc.name === 'write_to_file' && tc.args.TargetFile.includes('TravelBuddyDetails.jsx')) {
                        fs.writeFileSync('c:/Users/sandh/OneDrive/Desktop/my pro/frontend/src/pages/social/recovered_full.txt', tc.args.CodeContent);
                        console.log('Recovered from write_to_file!');
                    }
                });
            }
        } catch(e) {}
    }
}
