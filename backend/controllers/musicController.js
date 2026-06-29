const axios = require("axios");

// Cache API responses to avoid repeated iTunes requests
const musicCache = new Map();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

// Travel mood based search queries
const travelMoodQueries = {
  "Sunrise Trails": "acoustic sunrise morning indie",
  "Roadtrip Beats": "road trip driving highway songs",
  "Mountain Echoes": "indie folk mountain travel",
  "Ocean Vibes": "summer beach tropical waves",
  "Night Explorer": "synthwave night drive midnight",
  "Campfire Sessions": "campfire acoustic guitar chill",
  Wanderlust: "travel adventure cinematic wanderlust",
};

// Language based search queries for new movie hit songs
const languageMoodQueries = {
  "Hindi": "bollywood",
  "Telugu": "telugu",
  "Tamil": "tamil",
  "Punjabi": "punjabi",
  "Malayalam": "malayalam",
  "Kannada": "kannada",
  "Marathi": "marathi",
  "English": "pop hits",
  "K-Pop": "kpop",
  "Spanish": "reggaeton",
  "Global Mix": "top hits",
};

// Return emoji based on selected language
const getFlagForLanguage = (language) => {
  if (!language) return "🎬";

  if (
    language.includes("Hindi") ||
    language.includes("Marathi") ||
    language.includes("Punjabi") ||
    language.includes("Tamil") ||
    language.includes("Telugu") ||
    language.includes("Malayalam") ||
    language.includes("Kannada")
  ) {
    return "🇮🇳";
  }

  if (language.includes("English")) {
    return "🎧";
  }

  if (language.includes("K-Pop")) {
    return "🌸";
  }

  if (language.includes("Spanish")) {
    return "💃";
  }

  return "🎬";
};

// Fetch songs from iTunes API and store results in cache
const fetchItunesTracks = async (queryTerm, limit = 20) => {
  const cacheKey = `${queryTerm}_${limit}`;

  // Return cached data if available
  if (musicCache.has(cacheKey)) {
    const cached = musicCache.get(cacheKey);

    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }

  const browserHeaders = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  };

  const parseTracks = (results = []) => {
    if (!Array.isArray(results)) return [];
    return results
      .map((track) => ({
        id: track.trackId || Math.random().toString(),
        title: track.trackName || "Unknown Title",
        artist: track.artistName || "Unknown Artist",
        albumImage:
          track.artworkUrl100?.replace("100x100", "300x300") || null,
        previewUrl: track.previewUrl || null,
        spotifyUrl: track.trackViewUrl || null,
        durationMs: track.trackTimeMillis || 30000,
        vibe: queryTerm,
      }))
      .filter((track) => track.previewUrl !== null);
  };

  try {
    // Query Indian catalog first (for Bollywood / Hindi songs like Namo Namo)
    let response = await axios.get(
      `https://itunes.apple.com/search?term=${encodeURIComponent(
        queryTerm
      )}&entity=song&limit=${limit}&country=IN`,
      { timeout: 6000, headers: browserHeaders }
    );

    let tracks = parseTracks(response.data?.results);

    // If not found in IN store, fallback to default US store
    if (tracks.length < 5) {
      response = await axios.get(
        `https://itunes.apple.com/search?term=${encodeURIComponent(
          queryTerm
        )}&entity=song&limit=${limit}&country=US`,
        { timeout: 6000, headers: browserHeaders }
      );
      const usTracks = parseTracks(response.data?.results);
      tracks = [...tracks, ...usTracks];
    }

    // Save response in cache
    musicCache.set(cacheKey, {
      timestamp: Date.now(),
      data: tracks,
    });

    return tracks;
  } catch (error) {
    console.error(`iTunes API error for ${queryTerm}:`, error.message);

    // Use cached data if API fails
    if (musicCache.has(cacheKey)) {
      return musicCache.get(cacheKey).data;
    }

    return [];
  }
};

// Search music using user query
exports.searchMusic = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter "q" is required',
      });
    }

    let tracks = await fetchItunesTracks(q, 50);

    tracks = tracks.map((track) => ({
      ...track,
      vibe: "Searched",
      language: "Global Mix",
      flag: "🌍",
    }));

    res.status(200).json({
      success: true,
      tracks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Music service unavailable",
      error: error.message,
    });
  }
};

// Get trending music based on mood and language
exports.getTrendingMusic = async (req, res) => {
  try {
    const { mood, language } = req.query;
    let allTracks = [];

    // Apply mood and language filters
    if (mood || language) {
      if (language && !mood) {
        const safeLang = languageMoodQueries[language] ? language : "Global Mix";
        const langQuery = languageMoodQueries[safeLang];
        allTracks = await fetchItunesTracks(langQuery, 40);
        if (allTracks.length === 0) {
          allTracks = await fetchItunesTracks(`${safeLang} hits`, 40);
        }
        allTracks = allTracks.map((track) => ({
          ...track,
          vibe: "New Movie Hits",
          language: safeLang,
          flag: getFlagForLanguage(safeLang),
        }));
      } else if (mood && !language) {
        const safeMood = travelMoodQueries[mood] ? mood : "Wanderlust";
        const moodQuery = travelMoodQueries[safeMood];
        allTracks = await fetchItunesTracks(moodQuery, 40);
        allTracks = allTracks.map((track) => ({
          ...track,
          vibe: safeMood,
          language: "Global Mix",
          flag: "🌍",
        }));
      } else {
        const safeMood = travelMoodQueries[mood] ? mood : "Wanderlust";
        const safeLang = languageMoodQueries[language] ? language : "Global Mix";
        const moodQuery = travelMoodQueries[safeMood];
        const langQuery = languageMoodQueries[safeLang];

        const baseMoodWord = safeMood.split(" ")[0].toLowerCase();
        const baseLangWord = safeLang.split(" ")[0].toLowerCase();

        const combinedQuery = `${baseLangWord} ${baseMoodWord} travel songs`;
        allTracks = await fetchItunesTracks(combinedQuery, 30);

        if (allTracks.length === 0) {
          allTracks = await fetchItunesTracks(langQuery, 30);
        }
        if (allTracks.length === 0) {
          allTracks = await fetchItunesTracks(moodQuery, 30);
        }
        if (allTracks.length === 0) {
          allTracks = await fetchItunesTracks(languageMoodQueries["Global Mix"], 30);
        }

        allTracks = allTracks.map((track) => ({
          ...track,
          vibe: safeMood,
          language: safeLang,
          flag: getFlagForLanguage(safeLang),
        }));
      }
    } else {
      // Fetch trending songs from new movies across all popular languages
      const queries = [
        "bollywood",
        "telugu",
        "tamil",
        "punjabi",
        "malayalam",
        "marathi",
        "kannada",
        "pop hits",
        "kpop",
        "reggaeton",
      ];

      const results = await Promise.all(
        queries.map((query) => fetchItunesTracks(query, 12))
      );

      // Merge results round-robin to create a diverse multi-language playlist
      const maxLength = Math.max(...results.map((result) => result.length));

      for (let i = 0; i < maxLength; i++) {
        for (const result of results) {
          if (result[i]) {
            allTracks.push(result[i]);
          }
        }
      }

      allTracks = allTracks.map((track) => ({
        ...track,
        vibe: "New Movie Hits",
        language: "All Popular Languages",
        flag: "🔥",
      }));
    }

    res.status(200).json({
      success: true,
      tracks: allTracks.slice(0, 50),
    });
  } catch (error) {
    console.error("Music Trending API Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Music service unavailable",
      error: error.message,
    });
  }
};