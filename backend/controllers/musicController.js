const axios = require('axios');

// Simple in-memory cache for iTunes API results
const musicCache = new Map();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

const travelMoodQueries = {
  "Sunrise Trails": "acoustic sunrise morning indie",
  "Roadtrip Beats": "road trip driving highway songs",
  "Mountain Echoes": "indie folk mountain travel",
  "Ocean Vibes": "summer beach tropical waves",
  "Night Explorer": "synthwave night drive midnight",
  "Campfire Sessions": "campfire acoustic guitar chill",
  "Wanderlust": "travel adventure cinematic wanderlust"
};

const languageMoodQueries = {
  "Hindi Hits": "bollywood travel songs",
  "Marathi Vibes": "marathi roadtrip songs",
  "English Chill": "indie travel chill",
  "Punjabi Beats": "punjabi adventure songs",
  "Tamil Energy": "tamil energetic songs",
  "Telugu Waves": "telugu vibe songs",
  "K-Pop": "kpop aesthetic travel",
  "Global Mix": "global viral travel hits"
};

const defaultTrendingQueries = [
  'trending bollywood travel', 
  'marathi roadtrip', 
  'punjabi adventure', 
  'kpop aesthetic travel', 
  'indie travel chill'
];

const getFlagForLanguage = (language) => {
  if (!language) return "🌍";
  if (language.includes("Hindi") || language.includes("Marathi") || language.includes("Punjabi") || language.includes("Tamil") || language.includes("Telugu")) return "🇮🇳";
  if (language.includes("English")) return "🎧";
  if (language.includes("K-Pop")) return "🌸";
  return "🌍";
};

// Helper to fetch and format tracks from iTunes
const fetchItunesTracks = async (queryTerm, limit = 20) => {
  const cacheKey = `${queryTerm}_${limit}`;
  if (musicCache.has(cacheKey)) {
    const cached = musicCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }

  try {
    const response = await axios.get(`https://itunes.apple.com/search?term=${encodeURIComponent(queryTerm)}&entity=song&limit=${limit}`, { timeout: 5000 });
    const tracks = response.data.results.map(track => ({
      id: track.trackId,
      title: track.trackName,
      artist: track.artistName,
      albumImage: track.artworkUrl100?.replace('100x100', '300x300') || null,
      previewUrl: track.previewUrl || null,
      spotifyUrl: track.trackViewUrl,
      durationMs: track.trackTimeMillis,
      vibe: queryTerm // Store the vibe for frontend use
    })).filter(t => t.previewUrl !== null);

    musicCache.set(cacheKey, { timestamp: Date.now(), data: tracks });
    return tracks;
  } catch (error) {
    console.error(`iTunes API error for ${queryTerm}:`, error.message);
    // If fail, return from cache if exists (ignore TTL)
    if (musicCache.has(cacheKey)) {
      return musicCache.get(cacheKey).data;
    }
    return []; // Return empty if absolutely no fallback
  }
};

exports.searchMusic = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, message: 'Query parameter "q" is required' });
    }

    let tracks = await fetchItunesTracks(q, 50);
    tracks = tracks.map(t => ({
      ...t,
      vibe: "Searched",
      language: "Global Mix",
      flag: "🌍"
    }));

    res.status(200).json({ success: true, tracks });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Music service unavailable', error: error.message });
  }
};

exports.getTrendingMusic = async (req, res) => {
  try {
    const { mood, language } = req.query;
    let allTracks = [];

    if (mood || language) {
      const safeMood = mood && travelMoodQueries[mood] ? mood : "Wanderlust";
      const safeLang = language && languageMoodQueries[language] ? language : "Global Mix";

      const moodQuery = travelMoodQueries[safeMood];
      const langQuery = languageMoodQueries[safeLang];

      const baseMoodWord = safeMood.split(" ")[0].toLowerCase();
      const baseLangWord = safeLang.split(" ")[0].toLowerCase();

      // Attempt 1: Mood + Language
      const combinedQuery = `${baseLangWord} ${baseMoodWord} travel songs`;
      allTracks = await fetchItunesTracks(combinedQuery, 30);

      // Attempt 2: Language only
      if (allTracks.length === 0) {
        allTracks = await fetchItunesTracks(langQuery, 30);
      }

      // Attempt 3: Mood only
      if (allTracks.length === 0) {
        allTracks = await fetchItunesTracks(moodQuery, 30);
      }

      // Attempt 4: Global Mix (fallback)
      if (allTracks.length === 0) {
        allTracks = await fetchItunesTracks(languageMoodQueries["Global Mix"], 30);
      }

      allTracks = allTracks.map(t => ({
        ...t,
        vibe: safeMood,
        language: safeLang,
        flag: getFlagForLanguage(safeLang)
      }));

    } else {
      // Default trending: fetch a mix of languages explicitly
      const queries = [
        "latest bollywood hit songs",
        "latest marathi hit songs",
        "latest telugu hit songs",
        "top global english pop songs"
      ];
      
      const results = await Promise.all(queries.map(q => fetchItunesTracks(q, 15)));
      
      // Interleave results to get a good mix
      const maxLength = Math.max(...results.map(r => r.length));
      for (let i = 0; i < maxLength; i++) {
        for (const res of results) {
          if (res[i]) allTracks.push(res[i]);
        }
      }
      
      allTracks = allTracks.map(t => ({
        ...t,
        vibe: "Top Trending",
        language: "Multi-Language Hits",
        flag: "🔥"
      }));
    }

    res.status(200).json({ success: true, tracks: allTracks.slice(0, 50) });
  } catch (error) {
    console.error('Music Trending API Error:', error.message);
    res.status(500).json({ success: false, message: 'Music service unavailable', error: error.message });
  }
};
