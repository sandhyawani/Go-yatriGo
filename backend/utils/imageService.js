const axios = require("axios");

/**
 * Service to automatically select a relevant cover image for a trip based on its details.
 */
class ImageService {
  constructor() {
    this.unsplashApiKey = process.env.IMAGE_PROVIDER_API_KEY;
    // The deterministic default fallback image used if no image is found or API fails.
    this.defaultCoverImage = "https://images.unsplash.com/photo-1488646953014-85cb44e25828";
    this.cache = new Map(); // Simple in-memory cache for queries
  }

  /**
   * Fetches an automatic cover image based on the trip's destination, title, and category.
   * @param {Object} params - The trip details.
   * @param {String} params.destination - The destination of the trip.
   * @param {String} params.title - The title of the trip.
   * @param {String} params.category - The category of the trip.
   * @returns {Promise<String>} The selected image URL.
   */
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

  /**
   * Fetches multiple automatic cover images based on the trip's details.
   */
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
