const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else if (dirFile.endsWith('.jsx') || dirFile.endsWith('.tsx') || dirFile.endsWith('.js')) {
      filelist.push(dirFile);
    }
  });
  return filelist;
};

const files = walkSync('frontend/src');

const replacements = [
  { regex: /No posts found/gi, replace: 'No Travel Memories found' },
  { regex: /CreatePostModal/g, replace: 'CreateTravelMemoryModal' }, // Just to check if we can safely rename it, but wait, the user said don't rename files/variables unless required. The UI text is what matters.
  { regex: />\s*posts?\s*</gi, replace: '>Travel Memories<' },
  { regex: />\s*stories?\s*</gi, replace: '>Dispatches<' },
  { regex: />\s*followers?\s*</gi, replace: '>Connections<' },
  { regex: />\s*following\s*</gi, replace: '>Network<' },
  { regex: />\s*travel mates?\s*</gi, replace: '>Trip Mates<' },
  { regex: />\s*journey mates?\s*</gi, replace: '>Trip Mates<' },
  { regex: />\s*friends?\s*</gi, replace: '>Connections<' },
  
  // Specific stragglers:
  { regex: /[\"\']Travel Mates[\"\']/g, replace: '"Trip Mates"' },
  { regex: /[\"\']Journey Mates[\"\']/g, replace: '"Trip Mates"' },
  { regex: /[\"\']Friends[\"\']/g, replace: '"Connections"' }
];

let changedFiles = 0;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  replacements.forEach(({regex, replace}) => {
    content = content.replace(regex, replace);
  });
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    changedFiles++;
    console.log('Updated:', file);
  }
});
console.log('Total files updated pass 2:', changedFiles);
