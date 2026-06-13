const fs = require('fs');
const file = 'c:/Users/sandh/OneDrive/Desktop/my pro/frontend/src/pages/social/TravelBuddyHub.jsx';
let content = fs.readFileSync(file, 'utf8');

// Add import if not present
if (!content.includes('import TripCard')) {
  content = content.replace(/import \{ AuthContext \} from "\.\.\/\.\.\/context\/authContext";/, 'import { AuthContext } from "../../context/authContext";\nimport TripCard from "../../components/social/TripCard";');
}

// Strip out variables
content = content.replace(/const slotsOpen =[\s\S]*?const isInactive =.*?;/g, '');

const regexCard = /return\s*\(\s*<motion\.div\s*key=\{trip\._id\}[\s\S]*?<\/motion\.div>\s*\);/g;

content = content.replace(regexCard, `return (
                    <TripCard
                      key={trip._id}
                      trip={trip}
                      user={user}
                      handleLike={handleLike}
                    />
                  );`);
                  
// Also need to remove the getStatusColor function from Hub since it's now inside TripCard.
// But keeping it is fine. It's used for badges, wait, the badge logic is in TripCard. 
// Is getStatusColor used anywhere else in Hub? No.
// Let's just leave it there for now.

fs.writeFileSync(file, content);
console.log("TravelBuddyHub.jsx refactored successfully.");
