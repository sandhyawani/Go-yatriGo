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
  // Exact UI phrases for Post
  { regex: />Create Post</g, replace: '>Create Travel Memory<' },
  { regex: /[\"\'\`]Create Post[\"\'\`]/g, replace: '"Create Travel Memory"' },
  { regex: />My Posts</g, replace: '>My Memories<' },
  { regex: /[\"\'\`]My Posts[\"\'\`]/g, replace: '"My Memories"' },
  { regex: />New Post</g, replace: '>Create Travel Memory<' },
  { regex: /[\"\'\`]New Post[\"\'\`]/g, replace: '"Create Travel Memory"' },
  { regex: />View Post</g, replace: '>Memory Details<' },
  { regex: /[\"\'\`]View Post[\"\'\`]/g, replace: '"Memory Details"' },
  { regex: />Posts</g, replace: '>Travel Memories<' },
  { regex: />Post</g, replace: '>Travel Memory<' },
  { regex: /([\"\'])(Posts)\1/g, replace: '$1Travel Memories$1' },
  { regex: /([\"\'])(Post)\1/g, replace: '$1Travel Memory$1' },
  { regex: /No posts yet/gi, replace: 'No Travel Memories yet' },
  { regex: /Create your first post/gi, replace: 'Create your first Travel Memory' },
  { regex: /Share your travel experiences with a new post!/gi, replace: 'Share your travel experiences with a new Travel Memory!' },

  // Exact UI phrases for Story
  { regex: />Add Story</g, replace: '>Share Dispatch<' },
  { regex: /[\"\'\`]Add Story[\"\'\`]/g, replace: '"Share Dispatch"' },
  { regex: />Story Viewer</g, replace: '>View Dispatch<' },
  { regex: /[\"\'\`]Story Viewer[\"\'\`]/g, replace: '"View Dispatch"' },
  { regex: />Story Archive</g, replace: '>Dispatch Archive<' },
  { regex: /[\"\'\`]Story Archive[\"\'\`]/g, replace: '"Dispatch Archive"' },
  { regex: />Story Highlights</g, replace: '>Dispatch Highlights<' },
  { regex: /[\"\'\`]Story Highlights[\"\'\`]/g, replace: '"Dispatch Highlights"' },
  { regex: />Active Stories</g, replace: '>Active Dispatches<' },
  { regex: /[\"\'\`]Active Stories[\"\'\`]/g, replace: '"Active Dispatches"' },
  { regex: />My Story</g, replace: '>My Dispatch<' },
  { regex: /[\"\'\`]My Story[\"\'\`]/g, replace: '"My Dispatch"' },
  { regex: />Stories</g, replace: '>Dispatches<' },
  { regex: />Story</g, replace: '>Dispatch<' },
  { regex: /([\"\'])(Stories)\1/g, replace: '$1Dispatches$1' },
  { regex: /([\"\'])(Story)\1/g, replace: '$1Dispatch$1' },
  { regex: /Reacted to your story/gi, replace: 'Reacted to your Dispatch' },
  { regex: /Replied to your story/gi, replace: 'Replied to your Dispatch' },
  { regex: /View story attachment/gi, replace: 'View Dispatch attachment' },
  { regex: /View story/g, replace: 'View Dispatch' },
  { regex: /Story Reply/g, replace: 'Dispatch Reply' },
  { regex: /Story Reaction/g, replace: 'Dispatch Reaction' },

  // Connections & Network
  { regex: />Followers</g, replace: '>Connections<' },
  { regex: /([\"\'])(Followers)\1/g, replace: '$1Connections$1' },
  { regex: />Following</g, replace: '>Network<' },
  { regex: /([\"\'])(Following)\1/g, replace: '$1Network$1' },
  { regex: />Friends</g, replace: '>Connections<' },
  { regex: /([\"\'])(Friends)\1/g, replace: '$1Connections$1' },
  { regex: /Mutual Connections/gi, replace: 'Mutual Connections' },

  // Trip Mates
  { regex: />Journey Mates</g, replace: '>Trip Mates<' },
  { regex: /([\"\'])(Journey Mates)\1/g, replace: '$1Trip Mates$1' },
  { regex: />Journey Mate</g, replace: '>Trip Mate<' },
  { regex: /([\"\'])(Journey Mate)\1/g, replace: '$1Trip Mate$1' },
  { regex: />Travel Mates</g, replace: '>Trip Mates<' },
  { regex: /([\"\'])(Travel Mates)\1/g, replace: '$1Trip Mates$1' },
  { regex: />Travel Mate</g, replace: '>Trip Mate<' },
  { regex: /([\"\'])(Travel Mate)\1/g, replace: '$1Trip Mate$1' }
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
console.log('Total files updated:', changedFiles);
