const fs = require('fs');
const file = 'c:/Users/sandh/OneDrive/Desktop/my pro/frontend/src/pages/social/TravelBuddyDetails.jsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /\{\/\* Trip Main Information & Hero Cover \*\/\}\s+<motion\.div\s+<div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">\s+<h1 className="text-2xl sm:text-4xl font-black text-white leading-tight drop-shadow-md">\{trip\.title\}<\/h1>\s+<\/div>\s+<\/div>/;

const replaceStr = `{/* Trip Main Information & Hero Cover */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden"
            >
              {/* Hero Cover Image */}
              <div className="w-full h-[220px] sm:h-64 bg-slate-200 relative">
                {trip.coverImage ? (
                  <>
                    {!imgLoaded && !imgError && <div className="absolute inset-0 bg-slate-200 animate-pulse" />}
                    <img src={trip.coverImage} alt={\`\${trip.title} group cover photo\`} onLoad={() => setImgLoaded(true)} onError={() => setImgError(true)} className={\`w-full h-full object-cover transition-opacity \${imgLoaded ? 'opacity-100' : 'opacity-0'} \${imgError ? 'hidden' : ''}\`} />
                    {imgError && <div className="absolute inset-0 bg-[#EEEDFE] flex items-center justify-center"><MapPin className="w-12 h-12 text-[#AFA9EC]" /></div>}
                  </>
                ) : (
                  <div className="w-full h-full bg-[#6C4DF6]/20 flex items-center justify-center">
                    <MapPin className="w-12 h-12 text-[#6C4DF6]/40" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                  <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight drop-shadow-md">{trip.title}</h1>
                </div>
              </div>`;

if (regex.test(content)) {
  content = content.replace(regex, replaceStr);
  fs.writeFileSync(file, content);
  console.log("Fix 4 applied successfully.");
} else {
  console.log("Regex not found for Fix 4.");
}
