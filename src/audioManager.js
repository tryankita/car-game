class AudioManager {
  constructor() {
    this.menuMusic = null
    this.raceMusic = null       // currently playing race track
    this.raceTracks = []        // all loaded race Audio objects
    this.currentRaceIdx = -1    // index of the track playing
    this.engineSound = null
    this.volume = 0.3
    this.muted = false
    this.initialized = false
    this.userInteracted = false
  }

  init() {
    if (this.initialized) return

    try {
      // Menu music (loops)
      this.menuMusic = new Audio('/audio/menu-music.mp3')
      this.menuMusic.loop = true
      this.menuMusic.volume = this.volume
      this.menuMusic.preload = 'auto'
      this.menuMusic.onerror = () => console.warn('⚠️ menu-music.mp3 not found')

      // Race tracks playlist (random, no loops — onended picks next)
      const raceFiles = [
        '/audio/melodyayresgriffiths-the-race-is-on-racing-soundtrack-videogame-instrumental-378331.mp3',
        '/audio/muzaproduction-twisted-metal-racing-126292.mp3',
        '/audio/spinopel-speed-race-344521.mp3',
        '/audio/spmusic-heavy-racing-151129.mp3',
      ]

      this.raceTracks = raceFiles.map((src, i) => {
        const audio = new Audio(src)
        audio.loop = false
        audio.volume = this.volume
        audio.preload = 'auto'
        audio.onerror = () => console.warn(`⚠️ Race track ${i + 1} not found: ${src}`)
        audio.onended = () => this._playNextRaceTrack()
        return audio
      })

      // Engine sound (loops) - optional
      this.engineSound = new Audio('/audio/engine-sound.mp3')
      this.engineSound.loop = true
      this.engineSound.volume = 0
      this.engineSound.preload = 'auto'
      this.engineSound.onerror = () => console.warn('⚠️ engine-sound.mp3 not found (optional)')

      this.initialized = true
      console.log('✅ Audio Manager initialized')
    } catch (error) {
      console.error('❌ Audio init failed:', error)
    }
  }

  _pickRandomRaceIdx() {
    if (this.raceTracks.length === 0) return -1
    if (this.raceTracks.length === 1) return 0
    let next
    do {
      next = Math.floor(Math.random() * this.raceTracks.length)
    } while (next === this.currentRaceIdx)
    return next
  }

  _playNextRaceTrack() {
    if (!this.userInteracted || this.muted || this.raceTracks.length === 0) return
    this.currentRaceIdx = this._pickRandomRaceIdx()
    const track = this.raceTracks[this.currentRaceIdx]
    track.currentTime = 0
    track.play()
      .then(() => console.log(`🎵 Race track ${this.currentRaceIdx + 1} playing`))
      .catch(err => console.error('❌ Race track error:', err))
  }

  enableAudio() {
    this.userInteracted = true
    this.init()
  }

  playMenuMusic() {
    if (!this.userInteracted) {
      console.warn('⚠️ Audio requires user interaction first')
      return
    }
    this.init()
    if (this.muted || !this.menuMusic) return
    this.stopRaceMusic()
    this.menuMusic.currentTime = 0
    this.menuMusic.play()
      .then(() => console.log('🎵 Menu music playing'))
      .catch(err => console.error('❌ Menu music error:', err))
  }

  playRaceMusic() {
    if (!this.userInteracted) {
      console.warn('⚠️ Audio requires user interaction first')
      return
    }
    this.init()
    if (this.muted || this.raceTracks.length === 0) return
    this.stopMenuMusic()
    this._playNextRaceTrack()
  }

  stopMenuMusic() {
    if (this.menuMusic) {
      this.menuMusic.pause()
      this.menuMusic.currentTime = 0
    }
  }

  stopRaceMusic() {
    this.raceTracks.forEach(track => {
      track.pause()
      track.currentTime = 0
    })
    this.currentRaceIdx = -1
  }

  updateEngineSound(speed, maxSpeed) {
    if (!this.engineSound || this.muted) return
    
    const ratio = Math.min(speed / maxSpeed, 1)
    this.engineSound.volume = ratio * this.volume * 0.5
    this.engineSound.playbackRate = 0.8 + ratio * 0.7
    
    if (ratio > 0.05 && this.engineSound.paused) {
      this.engineSound.play().catch(() => {})
    } else if (ratio <= 0.05 && !this.engineSound.paused) {
      this.engineSound.pause()
    }
  }

  stopEngineSound() {
    if (this.engineSound) {
      this.engineSound.pause()
      this.engineSound.currentTime = 0
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol))
    if (this.menuMusic) this.menuMusic.volume = this.volume
    this.raceTracks.forEach(t => { t.volume = this.volume })
  }

  toggleMute() {
    this.muted = !this.muted
    if (this.muted) {
      this.stopMenuMusic()
      this.stopRaceMusic()
      this.stopEngineSound()
    }
    return this.muted
  }

  stopAll() {
    this.stopMenuMusic()
    this.stopRaceMusic()
    this.stopEngineSound()
  }
}

export default new AudioManager()
