const fs = require('fs');
const file = 'c:/Users/sandh/OneDrive/Desktop/my pro/frontend/src/pages/social/TravelBuddyHub.jsx';
let content = fs.readFileSync(file, 'utf8');

// Add import if not present
if (!content.includes('import TripCard')) {
  content = content.replace(/import \{ AuthContext \} from "\.\.\/\.\.\/context\/authContext";/, 'import { AuthContext } from "../../context/authContext";\nimport TripCard from "../../components/social/TripCard";');
}

const startMarker = `return (
                    <motion.div
                      key={trip._id}
                      layout
                      initial={{ opacity: 0, y: 15 }}`;
                      
const endMarker = `</motion.div>
                  );
                })}
              </AnimatePresence>`;
              
const idxStart = content.indexOf(`return (\n                    <motion.div\n                      key={trip._id}`);
const idxEnd = content.indexOf(`</motion.div>\n                  );\n                })}`);

if (idxStart !== -1 && idxEnd !== -1) {
  const finalEnd = idxEnd + `</motion.div>\n                  );\n                })}`.length;
  const replacement = `return (
                    <TripCard
                      key={trip._id}
                      trip={trip}
                      user={user}
                      handleLike={handleLike}
                    />
                  );
                })}`;
  
  content = content.slice(0, idxStart) + replacement + content.slice(finalEnd);
  
  // also need to remove unused variables that were extracted to TripCard
  content = content.replace(/const slotsOpen =.*?\n/g, '');
  content = content.replace(/const isLiked =.*?\n/g, '');
  content = content.replace(/const startDate =.*?\n/g, '');
  content = content.replace(/const isStartingSoon =.*?\n/g, '');
  content = content.replace(/const travelDates =[\s\S]*?\n                  \}\);\n/g, '');
  content = content.replace(/const currentUserId =.*?\n/g, '');
  content = content.replace(/const hasRequested =.*?\n/g, '');
  content = content.replace(/const hasJoined =.*?\n/g, '');
  content = content.replace(/const isInactive =.*?\n/g, '');
  
  fs.writeFileSync(file, content);
  console.log("TravelBuddyHub.jsx refactored successfully.");
} else {
  console.log("Could not find replacement boundaries.");
}
