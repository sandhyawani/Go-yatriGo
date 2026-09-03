const axios = require("axios");

class ImageService {
  constructor() {
    this.unsplashApiKey = process.env.IMAGE_PROVIDER_API_KEY;
    this.defaultCoverImage = "https://images.unsplash.com/photo-1488646953014-85cb44e25828";
    this.cache = new Map();
  }

  async fetchAutoCoverImage({ destination = "", title = "", category = "" }) {
    if (!this.unsplashApiKey) {
      return this.defaultCoverImage;
    }

    const keywords = [];
    if (destination) keywords.push(destination.trim());
    if (category && category.toLowerCase() !== "general") keywords.push(category.trim());
    
    const query = keywords.join(" ").toLowerCase();

    if (!query) {
      return this.defaultCoverImage;
    }

    if (this.cache.has(query)) {
      return this.cache.get(query);
    }

    try {
      const response = await axios.get("https://api.unsplash.com/search/photos", {
        params: {
          query,
          orientation: "landscape",
          per_page: 5,
        },
        headers: {
          Authorization: `Client-ID ${this.unsplashApiKey}`,
        },
        timeout: 3000, 
      });

      if (response.data && response.data.results && response.data.results.length > 0) {
        const selectedImageUrl = response.data.results[0].urls.regular;
        this.cache.set(query, selectedImageUrl);
        return selectedImageUrl;
      } else {
        if (destination && destination.trim().toLowerCase() !== query) {
          return this.fetchAutoCoverImage({ destination, title: "", category: "" });
        }
        return this.defaultCoverImage;
      }
    } catch (error) {
      console.error("Image API request failed:", error.message);
      return this.defaultCoverImage;
    }
  }

  async fetchAutoCoverImages({ destination = "", title = "", category = "" }, limit = 10) {
    if (!this.unsplashApiKey) {
      return [this.defaultCoverImage];
    }

    const keywords = [];
    if (destination) keywords.push(destination.trim());
    if (category && category.toLowerCase() !== "general") keywords.push(category.trim());
    
    const query = keywords.join(" ").toLowerCase();

    if (!query) {
      return [this.defaultCoverImage];
    }

    const cacheKey = `multi_${query}_${limit}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await axios.get("https://api.unsplash.com/search/photos", {
        params: {
          query,
          orientation: "landscape",
          per_page: limit,
        },
        headers: {
          Authorization: `Client-ID ${this.unsplashApiKey}`,
        },
        timeout: 3000, 
      });

      if (response.data && response.data.results && response.data.results.length > 0) {
        const urls = response.data.results.map(r => r.urls.regular);
        this.cache.set(cacheKey, urls);
        return urls;
      } else {
        if (destination && destination.trim().toLowerCase() !== query) {
            return this.fetchAutoCoverImages({ destination, title: "", category: "" }, limit);
        }
        return [this.defaultCoverImage];
      }
    } catch (error) {
      return [this.defaultCoverImage];
    }
  }
}

module.exports = new ImageService();
