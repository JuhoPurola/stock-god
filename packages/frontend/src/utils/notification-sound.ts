// Notification sound utilities

let audioContext: AudioContext | null = null;
let soundEnabled = true;

// Initialize audio context on user interaction
export function initAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

// Enable/disable sound notifications
export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
  if (enabled) {
    localStorage.setItem('notification-sound-enabled', 'true');
  } else {
    localStorage.removeItem('notification-sound-enabled');
  }
}

// Get sound enabled state
export function isSoundEnabled(): boolean {
  const stored = localStorage.getItem('notification-sound-enabled');
  return stored === 'true' || stored === null; // Enabled by default
}

// Initialize sound state
soundEnabled = isSoundEnabled();

// Play notification sound using Web Audio API
export function playNotificationSound(type: 'info' | 'success' | 'warning' | 'error' = 'info') {
  if (!soundEnabled) return;

  try {
    const ctx = initAudioContext();
    if (!ctx) return;

    // Create oscillator for sound generation
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Set sound characteristics based on type
    const soundProfiles = {
      info: { freq1: 800, freq2: 600, duration: 0.1 },
      success: { freq1: 600, freq2: 900, duration: 0.15 },
      warning: { freq1: 700, freq2: 500, duration: 0.2 },
      error: { freq1: 400, freq2: 200, duration: 0.3 },
    };

    const profile = soundProfiles[type];

    // Set frequency sweep
    oscillator.frequency.setValueAtTime(profile.freq1, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      profile.freq2,
      ctx.currentTime + profile.duration
    );

    // Set volume envelope
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + profile.duration);

    // Play sound
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + profile.duration);
  } catch (error) {
    console.warn('Failed to play notification sound:', error);
  }
}

// Play sound for alert types
export function playAlertSound(severity: 'info' | 'warning' | 'error') {
  const soundTypeMap: Record<string, 'info' | 'success' | 'warning' | 'error'> = {
    info: 'info',
    warning: 'warning',
    error: 'error',
  };

  playNotificationSound(soundTypeMap[severity] || 'info');
}

// Initialize audio context on first user interaction
if (typeof window !== 'undefined') {
  const initOnInteraction = () => {
    initAudioContext();
    document.removeEventListener('click', initOnInteraction);
    document.removeEventListener('keydown', initOnInteraction);
  };

  document.addEventListener('click', initOnInteraction, { once: true });
  document.addEventListener('keydown', initOnInteraction, { once: true });
}
