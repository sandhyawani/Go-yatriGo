class AudioManager {
  constructor() {
    this.currentAudioId = null;
    this.currentAudioNode = null;
    this.isLockedState = false;
    this.listeners = new Set();
    this.boundEndHandlers = new WeakMap();

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          this.stopAll();
        }
      });
    }
  }

  subscribe(listener) {
    if (typeof listener === "function") {
      this.listeners.add(listener);
      return () => this.listeners.delete(listener);
    }
    return () => {};
  }

  notify(event, data = {}) {
    this.listeners.forEach((listener) => {
      try {
        listener(event, {
          audioId: this.currentAudioId,
          audioNode: this.currentAudioNode,
          ...data,
        });
      } catch (err) {
        console.warn("AudioManager listener error:", err);
      }
    });
  }

  getCurrentAudioId() {
    return this.currentAudioId;
  }

  getCurrentAudioNode() {
    return this.currentAudioNode;
  }

  isPlaying(audioId) {
    if (!audioId) return Boolean(this.currentAudioId && this.currentAudioNode && !this.currentAudioNode.paused);
    return Boolean(
      this.currentAudioId === audioId &&
      this.currentAudioNode &&
      !this.currentAudioNode.paused
    );
  }

  lock() {
    this.isLockedState = true;
  }

  unlock() {
    this.isLockedState = false;
  }

  isLocked() {
    return this.isLockedState;
  }

  async play(audioId, audioNode, options = {}) {
    if (!audioNode || !audioId) {
      return Promise.reject(new Error("Audio node or audio ID is missing"));
    }

    const src = audioNode.src || audioNode.currentSrc;
    if (!src || src.trim() === "" || (typeof window !== "undefined" && src === window.location.href)) {
      return Promise.reject(new Error("Audio source URL is invalid or empty"));
    }

    if (this.isLockedState && options.source !== "story" && !options.force && options.source !== "modal") {
      return Promise.resolve();
    }

    // Stop and reset any previously playing audio
    if (this.currentAudioNode && (this.currentAudioId !== audioId || this.currentAudioNode !== audioNode)) {
      try {
        this.currentAudioNode.pause();
        this.currentAudioNode.currentTime = 0;
      } catch (e) {
        // Ignore pause errors on stale node
      }
    }

    this.currentAudioId = audioId;
    this.currentAudioNode = audioNode;

    // Attach ended handler once
    if (!this.boundEndHandlers.has(audioNode)) {
      const onEnded = () => {
        if (this.currentAudioNode === audioNode) {
          this.currentAudioId = null;
          this.currentAudioNode = null;
          this.notify("ended", { audioId });
        }
      };
      audioNode.addEventListener("ended", onEnded);
      this.boundEndHandlers.set(audioNode, onEnded);
    }

    try {
      const playPromise = audioNode.play();
      if (playPromise !== undefined) {
        await playPromise;
      }
      this.notify("play", { audioId, audioNode });
      return Promise.resolve();
    } catch (error) {
      // AbortError is a standard browser interruption when pause/stop is called before play finishes.
      if (error && error.name === "AbortError") {
        return Promise.resolve();
      }

      // If genuine failure (decoding error, network error, unsupported format), reset state
      if (this.currentAudioId === audioId) {
        this.currentAudioId = null;
        this.currentAudioNode = null;
      }
      this.notify("error", { audioId, audioNode, error });
      return Promise.reject(error);
    }
  }

  pause(audioId) {
    if (!audioId || this.currentAudioId === audioId) {
      if (this.currentAudioNode) {
        try {
          this.currentAudioNode.pause();
        } catch (e) {
          // Ignore pause error
        }
      }
      const previousId = this.currentAudioId;
      this.currentAudioId = null;
      this.notify("pause", { audioId: previousId });
    }
  }

  stop(audioId) {
    if (!audioId || this.currentAudioId === audioId) {
      if (this.currentAudioNode) {
        try {
          this.currentAudioNode.pause();
          this.currentAudioNode.currentTime = 0;
        } catch (e) {
          // Ignore stop error
        }
      }
      const previousId = this.currentAudioId;
      this.currentAudioId = null;
      this.currentAudioNode = null;
      this.notify("stop", { audioId: previousId });
    }
  }

  stopAll() {
    if (this.currentAudioNode) {
      try {
        this.currentAudioNode.pause();
        this.currentAudioNode.currentTime = 0;
      } catch (e) {
        // Ignore stopAll error
      }
    }
    const previousId = this.currentAudioId;
    this.currentAudioId = null;
    this.currentAudioNode = null;
    this.notify("stop", { audioId: previousId });
  }
}

const audioManagerInstance = new AudioManager();
export default audioManagerInstance;