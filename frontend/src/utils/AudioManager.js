class AudioManager {
  constructor() {
    this.currentAudioId = null;
    this.currentAudioNode = null;
    this.isLockedState = false;

    // Stop audio on tab hidden
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.stopAll();
      }
    });
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

  play(audioId, audioNode, options = {}) {
    if (!audioNode) return;

    if (this.isLockedState && options.source !== "story") {
      return;
    }

    if (this.currentAudioId && this.currentAudioId !== audioId && this.currentAudioNode) {
      this.currentAudioNode.pause();
      this.currentAudioNode.currentTime = 0;
    }

    this.currentAudioId = audioId;
    this.currentAudioNode = audioNode;
    
    // Play the new audio
    audioNode.play().catch(e => console.warn('Audio play failed:', e));
  }

  pause(audioId) {
    if (this.currentAudioId === audioId && this.currentAudioNode) {
      this.currentAudioNode.pause();
      this.currentAudioId = null;
    }
  }

  stop(audioId) {
    if (this.currentAudioId === audioId && this.currentAudioNode) {
      this.currentAudioNode.pause();
      this.currentAudioNode.currentTime = 0;
      this.currentAudioId = null;
      this.currentAudioNode = null;
    }
  }

  stopAll() {
    if (this.currentAudioNode) {
      this.currentAudioNode.pause();
      this.currentAudioNode.currentTime = 0;
      this.currentAudioId = null;
      this.currentAudioNode = null;
    }
  }
}

const audioManagerInstance = new AudioManager();
export default audioManagerInstance;

