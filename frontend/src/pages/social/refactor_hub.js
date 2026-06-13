const fs = require('fs');
const file = 'c:/Users/sandh/OneDrive/Desktop/my pro/frontend/src/pages/social/TravelBuddyHub.jsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('import TripCard')) {
  content = content.replace(/import \{ showToast \} from "\.\.\/\.\.\/utils\/showToast";/, 'import { showToast } from "../../utils/showToast";\nimport TripCard from "../../components/social/TripCard";');
}

const startString = "return (\n                    <motion.div\n                      key={trip._id}";
const endString = "</motion.div>\n                  );\n                })}";

const startIndex = content.indexOf(startString);
const endIndex = content.indexOf(endString) + endString.length;

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `return (\n                    <TripCard\n                      key={trip._id}\n                      trip={trip}\n                      user={user}\n                      handleLike={handleLike}\n                    />\n                  );\n                })}`;
  content = content.slice(0, startIndex) + replacement + content.slice(endIndex);
  fs.writeFileSync(file, content);
  console.log("TravelBuddyHub.jsx refactored to use TripCard.");
} else {
  console.log("Could not find block to replace in TravelBuddyHub.jsx");
}
