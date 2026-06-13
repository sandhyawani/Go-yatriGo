const fs = require('fs');
const path = require('path');

const srcDir = 'c:/Users/sandh/OneDrive/Desktop/my pro/frontend/src/pages/social';
const routerDir = 'c:/Users/sandh/OneDrive/Desktop/my pro/frontend/src/router';

// 1. Delete SavedPosts.jsx
const savedPostsPath = path.join(srcDir, 'SavedPosts.jsx');
if (fs.existsSync(savedPostsPath)) {
  fs.unlinkSync(savedPostsPath);
  console.log("Deleted SavedPosts.jsx");
}

// 2. Rename LikedPosts.jsx to FeltVibes.jsx and update its content
const likedPostsPath = path.join(srcDir, 'LikedPosts.jsx');
const feltVibesPath = path.join(srcDir, 'FeltVibes.jsx');
if (fs.existsSync(likedPostsPath)) {
  let content = fs.readFileSync(likedPostsPath, 'utf8');
  content = content.replace(/LikedPosts/g, 'FeltVibes');
  content = content.replace(/likedPosts/g, 'feltVibes');
  content = content.replace(/setLikedPosts/g, 'setFeltVibes');
  content = content.replace(/fetchLikedPosts/g, 'fetchFeltVibes');
  content = content.replace(/Liked memory/g, 'Felt vibe');
  content = content.replace(/Felt Memories/g, 'Felt Vibes');
  content = content.replace(/No felt memories yet./g, 'No felt vibes yet.');
  content = content.replace(/Remove from Felt Vibes/g, 'Remove from Felt Vibes');
  
  fs.writeFileSync(feltVibesPath, content);
  fs.unlinkSync(likedPostsPath);
  console.log("Renamed LikedPosts to FeltVibes and updated content");
}

// 3. Update RouteTour.js
const routePath = path.join(routerDir, 'RouteTour.js');
if (fs.existsSync(routePath)) {
  let content = fs.readFileSync(routePath, 'utf8');
  // Remove SavedPosts route and import
  content = content.replace(/import SavedPosts from "\.\.\/pages\/social\/SavedPosts";\r?\n/g, '');
  content = content.replace(/<Route path="\/saved-posts" element=\{<ProtectedRoute><SavedPosts \/><\/ProtectedRoute>\} \/>\r?\n/g, '');
  
  // Replace LikedPosts with FeltVibes
  content = content.replace(/import LikedPosts from "\.\.\/pages\/social\/LikedPosts";/g, 'import FeltVibes from "../pages/social/FeltVibes";');
  content = content.replace(/<Route path="\/liked-posts" element=\{<ProtectedRoute><LikedPosts \/><\/ProtectedRoute>\} \/>/g, '<Route path="/felt-vibes" element={<ProtectedRoute><FeltVibes /></ProtectedRoute>} />');
  
  fs.writeFileSync(routePath, content);
  console.log("Updated RouteTour.js");
}

// 4. Update Settings.jsx
const settingsPath = path.join(srcDir, 'Settings.jsx');
if (fs.existsSync(settingsPath)) {
  let content = fs.readFileSync(settingsPath, 'utf8');
  // Remove Saved Groups SettingsRow
  content = content.replace(/\s*<SettingsRow icon=\{Bookmark\} title="Saved Groups".*?\/>/g, '');
  
  // Update Liked Groups to Felt Vibes
  content = content.replace(/title="Liked Groups" subtitle="Groups you've liked" to="\/liked-posts"/g, 'title="Felt Vibes" subtitle="Groups you\'ve felt" to="/felt-vibes"');
  
  // Clean up unused Bookmark import if possible, but leaving it is fine.
  fs.writeFileSync(settingsPath, content);
  console.log("Updated Settings.jsx");
}

// 5. Update TravelBuddyDetails.jsx
const detailsPath = path.join(srcDir, 'TravelBuddyDetails.jsx');
if (fs.existsSync(detailsPath)) {
  let content = fs.readFileSync(detailsPath, 'utf8');
  
  content = content.replace(/const isSaved = /g, 'const hasFelt = ');
  content = content.replace(/isSaved \?/g, 'hasFelt ?');
  content = content.replace(/\{isSaved \? "Unsave this group" : "Save this group"\}/g, '{hasFelt ? "Remove Felt reaction" : "Felt This group"}');
  content = content.replace(/isSaved\n/g, 'hasFelt\n');
  content = content.replace(/\{isSaved \? "Saved" : "Save"\}/g, '{hasFelt ? "Felt This" : "Felt This"}');
  content = content.replace(/isSaved \? "drop-shadow/g, 'hasFelt ? "drop-shadow');
  
  content = content.replace(/"Added to favorites!" : "Removed from favorites"/g, '"You felt this vibe!" : "Removed from Felt Vibes"');
  
  fs.writeFileSync(detailsPath, content);
  console.log("Updated TravelBuddyDetails.jsx");
}

// 6. Update TravelBuddyHub.jsx
const hubPath = path.join(srcDir, 'TravelBuddyHub.jsx');
if (fs.existsSync(hubPath)) {
  let content = fs.readFileSync(hubPath, 'utf8');
  content = content.replace(/"Saved to favorites!" : "Removed from favorites"/g, '"You felt this vibe!" : "Removed from Felt Vibes"');
  // We can keep isLiked variable name internally, it's fine.
  fs.writeFileSync(hubPath, content);
  console.log("Updated TravelBuddyHub.jsx");
}

console.log("Refactoring complete.");
