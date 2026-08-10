const fs = require('fs');

const file = 'c:/Users/sandh/OneDrive/Desktop/my pro/frontend/src/pages/social/TravelBuddyDetails.jsx';
let content = fs.readFileSync(file, 'utf8');

const lines = content.split(/\r?\n/);

// Sanity check
if (lines[226].includes('const tripDuration = Math.ceil')) {
    // Delete lines 226 to 240 (inclusive) which correspond to lines 227 to 241
    lines.splice(226, 15);
    // Now line 226 is the closing tag for button
    lines.splice(226, 0, '          >', '            <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline" aria-label="Go back to groups list">Back to groups</span>', '          </button>');
    fs.writeFileSync(file, lines.join('\n'));
    console.log("Fixed the syntax error block!");
} else {
    console.log("Error: Expected line 227 to be tripDuration, got: " + lines[226]);
}
