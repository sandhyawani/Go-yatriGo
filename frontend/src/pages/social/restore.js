const fs = require('fs');

// 1. Read view_log_360.txt and extract original code
const logContent = fs.readFileSync('c:/Users/sandh/OneDrive/Desktop/my pro/frontend/src/pages/social/view_log_360.txt', 'utf8');
const logLines = logContent.split('\n');

let originalCode = '';
for (let line of logLines) {
    const match = line.match(/^\d+:\s(.*)/);
    if (match) {
        originalCode += match[1] + '\n';
    }
}

// 2. Find the split point in original code
const splitString = '          {/* RIGHT 4 COLUMNS';
const originalSplitIndex = originalCode.indexOf(splitString);
if (originalSplitIndex === -1) {
    console.error("Could not find split string in original code");
    process.exit(1);
}
const topPart = originalCode.substring(0, originalSplitIndex);

// 3. Read current file and find split point
const currentContent = fs.readFileSync('c:/Users/sandh/OneDrive/Desktop/my pro/frontend/src/pages/social/TravelBuddyDetails.jsx', 'utf8');
const currentSplitIndex = currentContent.indexOf(splitString);
if (currentSplitIndex === -1) {
    console.error("Could not find split string in current code");
    process.exit(1);
}
const bottomPart = currentContent.substring(currentSplitIndex);

// 4. Concatenate
let finalContent = topPart + bottomPart;

// 5. Apply the uppercase cleanup we promised the user
finalContent = finalContent.replace(/\buppercase\b/g, '');
finalContent = finalContent.replace(/\btracking-wider\b/g, '');
finalContent = finalContent.replace(/\btracking-wide\b/g, '');

finalContent = finalContent.replace(/className="([^"]+)"/g, (match, classes) => {
    return `className="${classes.replace(/\s+/g, ' ').trim()}"`;
});
finalContent = finalContent.replace(/className=\{`([^`]+)`\}/g, (match, classes) => {
    return `className={\`${classes.replace(/\s+/g, ' ').trim()}\`}`;
});

// Also fix the floating bracket
finalContent = finalContent.replace('{/* LEFT 8 COLUMNS: Trip Parameters, Chat */}}', '{/* LEFT 8 COLUMNS: Trip Parameters, Chat */}');

// 6. Write back
fs.writeFileSync('c:/Users/sandh/OneDrive/Desktop/my pro/frontend/src/pages/social/TravelBuddyDetails.jsx', finalContent);
console.log("Successfully restored and cleaned up TravelBuddyDetails.jsx!");
