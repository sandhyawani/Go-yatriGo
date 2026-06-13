const fs = require('fs');
const file = 'c:/Users/sandh/OneDrive/Desktop/my pro/frontend/src/pages/social/TravelBuddyDetails.jsx';
let content = fs.readFileSync(file, 'utf8');

// Replace `uppercase` and `tracking-wider` and `tracking-wide` globally
content = content.replace(/\buppercase\b/g, '');
content = content.replace(/\btracking-wider\b/g, '');
content = content.replace(/\btracking-wide\b/g, '');

// Clean up multiple spaces in classNames
content = content.replace(/className="([^"]+)"/g, (match, classes) => {
    return `className="${classes.replace(/\s+/g, ' ').trim()}"`;
});
content = content.replace(/className=\{`([^`]+)`\}/g, (match, classes) => {
    return `className={\`${classes.replace(/\s+/g, ' ').trim()}\`}`;
});

fs.writeFileSync(file, content);
console.log("Stripped uppercase and tracking classes from TravelBuddyDetails.jsx");
