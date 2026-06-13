const fs = require('fs');
const file = 'c:/Users/sandh/OneDrive/Desktop/my pro/frontend/src/pages/social/TravelBuddyDetails.jsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /trip\.status === "cancelled"\s*\?\s*"bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"\s*:\s*"border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"\s*\{\/\* LEFT 8 COLUMNS: Trip Parameters, Chat \*\//;

const replacement = `trip.status === "cancelled" 
                    ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                    : "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                }\`}
              >
                Cancel Group
              </button>
            )}
            <button onClick={handleLike} aria-label={hasFelt ? "Remove Felt reaction" : "Felt This"} className={\`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-xl font-medium text-sm transition-all \${
                hasFelt 
                  ? "bg-[#FAFAFA] border-[#E5E7EB] text-[#111827] hover:bg-slate-50"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }\`}
            >
              <span className={\`text-[14px] leading-none transition-all duration-300 \${hasFelt ? "drop-shadow-[0_0_6px_rgba(250,204,21,0.5)] scale-110 grayscale-0 opacity-100" : "grayscale opacity-80"}\`}>✨</span> 
              {hasFelt ? "Felt This!" : "Felt This"}
            </button>
          </div>
        </div>

        {/* 12-Column Responsive Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* LEFT 8 COLUMNS: Trip Parameters, Chat */}`;

if (regex.test(content)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync(file, content);
  console.log("Button block restored.");
} else {
  console.log("Regex not found for button block restore.");
}
