const fs = require('fs');

const file = 'c:/Users/sandh/OneDrive/Desktop/my pro/frontend/src/pages/social/TravelBuddyDetails.jsx';
let content = fs.readFileSync(file, 'utf8');

// The missing </div> for lg:col-span-8 space-y-4
const targetStr = '          {/* RIGHT 4 COLUMNS: Sidebar Actions, Host Request Manager, Companion Profiles */}';
if (content.includes(targetStr)) {
    content = content.replace(targetStr, '          </div>\n\n' + targetStr);
    fs.writeFileSync(file, content);
    console.log("Added missing </div> for lg:col-span-8!");
} else {
    console.log("Could not find RIGHT 4 COLUMNS!");
}
