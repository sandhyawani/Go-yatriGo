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
  // Buddies -> Trip Mates
  { regex: />Travel Buddies</g, replace: '>Trip Mates<' },
  { regex: />Travel Buddy</g, replace: '>Trip Mate<' },
  { regex: /[\"\'\`]Travel Buddies[\"\'\`]/g, replace: '"Trip Mates"' },
  { regex: /[\"\'\`]Travel Buddy[\"\'\`]/g, replace: '"Trip Mate"' },
  { regex: />Buddies</g, replace: '>Trip Mates<' },
  { regex: />Buddy</g, replace: '>Trip Mate<' },
  { regex: /([\"\'])(Buddies)\1/g, replace: '$1Trip Mates$1' },
  { regex: /([\"\'])(Buddy)\1/g, replace: '$1Trip Mate$1' },
  { regex: /0 Buddies/g, replace: '0 Trip Mates' },
  { regex: /Find travel mates/gi, replace: 'Find Trip Mates' },
  { regex: /Find Travel Buddies/gi, replace: 'Find Trip Mates' },
  { regex: /Invite Buddy/gi, replace: 'Invite Trip Mate' },
  { regex: /Become Buddy/gi, replace: 'Become Trip Mates' },

  // Squad -> Travel Group
  { regex: />Travel Squads?</gi, replace: '>Travel Group<' },
  { regex: /[\"\'\`]Travel Squad[\"\'\`]/gi, replace: '"Travel Group"' },
  { regex: />Squads?</g, replace: '>Travel Group<' },
  { regex: /([\"\'])(Squad)\1/g, replace: '$1Travel Group$1' },
  { regex: /([\"\'])(Squads)\1/g, replace: '$1Travel Groups$1' },
  { regex: /buddy squad/gi, replace: 'travel group' },
  { regex: /Squads active/g, replace: 'Travel Groups active' },
  { regex: /Join a squad/g, replace: 'Join a travel group' },

  // Trip -> Journey (except Trip Mate)
  { regex: />Trips?</g, replace: '>Journey<' },
  { regex: />Shared trips</g, replace: '>Shared Journeys<' },
  { regex: />Past trips</g, replace: '>Past Journeys<' },
  { regex: /Shared trips/g, replace: 'Shared Journeys' },
  { regex: /Past trips/g, replace: 'Past Journeys' },
  { regex: /Shared Trip/g, replace: 'Shared Journey' },
  { regex: /Past Trip/g, replace: 'Past Journey' },
  { regex: /([\"\'])(Trips)\1/g, replace: '$1Journeys$1' },
  { regex: /([\"\'])(Trip)\1/g, replace: '$1Journey$1' },
  
  // We need to be careful with Trip Mates.
  // We already replaced Travel Mates with Trip Mates. So we don't want to replace "Trip" in "Trip Mates".
  // The above regex only replaces exactly >Trip<, "Trip", 'Trip'. It won't touch "Trip Mate".
  
  // Adventure -> Journey
  { regex: />Adventures</g, replace: '>Journeys<' },
  { regex: />Adventure</g, replace: '>Journey<' },
  { regex: /([\"\'])(Adventures)\1/g, replace: '$1Journeys$1' },
  { regex: /([\"\'])(Adventure)\1/g, replace: '$1Journey$1' },
  
  // Tour -> Journey
  { regex: />Tours</g, replace: '>Journeys<' },
  { regex: />Tour</g, replace: '>Journey<' },
  { regex: /([\"\'])(Tours)\1/g, replace: '$1Journeys$1' },
  { regex: /([\"\'])(Tour)\1/g, replace: '$1Journey$1' }
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
console.log('Total files updated pass 3:', changedFiles);
