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
    this.audioCtx = null        // Web Audio API context for SFX synthesis
    this._screechNode = null    // active tire screech node (to avoid overlap)
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

  _getAudioCtx() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {})
    }
    return this.audioCtx
  }

  // Short downward-chirp blip — called on each gear change
  playGearShift() {
    if (this.muted || !this.userInteracted) return
    try {
      const ctx = this._getAudioCtx()
      const gain = ctx.createGain()
      gain.connect(ctx.destination)

      const osc = ctx.createOscillator()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(900, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(350, ctx.currentTime + 0.08)
      osc.connect(gain)

      const vol = this.volume * 0.45
      gain.gain.setValueAtTime(vol, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)

      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.13)
    } catch (_) {}
  }

  // Bandpass-filtered noise burst — duration/intensity driven by lateral slip
  playTireScreech(intensity = 1) {
    if (this.muted || !this.userInteracted) return
    // Don't stack — if already screeching, just let it continue
    if (this._screechNode) return
    try {
      const ctx = this._getAudioCtx()
      const duration = Math.min(0.12 + intensity * 0.4, 0.6)

      // White noise via AudioBuffer
      const bufLen = Math.floor(ctx.sampleRate * duration)
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate)
      const data = buf.getChannelData(0)
      for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1

      const src = ctx.createBufferSource()
      src.buffer = buf

      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.value = 1800
      filter.Q.value = 1.5

      const gain = ctx.createGain()
      const vol = this.volume * Math.min(intensity * 0.6, 0.55)
      gain.gain.setValueAtTime(vol, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

      src.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)

      src.start()
      this._screechNode = src
      src.onended = () => { this._screechNode = null }
    } catch (_) { this._screechNode = null }
  }
}

export default new AudioManager()
