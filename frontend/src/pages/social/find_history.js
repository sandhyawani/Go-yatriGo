const fs = require('fs');
const readline = require('readline');

const logPath = 'C:\\Users\\sandh\\.gemini\\antigravity\\brain\\36187b20-1382-4a55-bcc5-9ae80a81079f\\.system_generated\\logs\\transcript.jsonl';

async function processLineByLine() {
  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let latestView = [];
  
  for await (const line of rl) {
    if (line.includes('TravelBuddyDetails.jsx')) {
      try {
        const obj = JSON.parse(line);
        // Look for view_file responses
        if (obj.source === 'SYSTEM' && obj.tool_calls) {
           // wait, responses are in 'content' sometimes or tool_calls output?
        }
        if (obj.content && obj.content.includes('File Path: `file:///c:/Users/sandh/OneDrive/Desktop/my%20pro/frontend/src/pages/social/TravelBuddyDetails.jsx`')) {
          console.log(`Found a view_file output at step ${obj.step_index}`);
          // Just saving the last few to a file for review
          fs.writeFileSync('c:/Users/sandh/OneDrive/Desktop/my pro/frontend/src/pages/social/view_log_' + obj.step_index + '.txt', obj.content);
        }
      } catch (e) { }
    }
  }
}

processLineByLine();
