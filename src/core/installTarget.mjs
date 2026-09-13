// Device hints choose instructions only; installation uses browser capability detection.
export function installPlatform({ userAgent = '', platform = '', maxTouchPoints = 0 } = {}) {
  if (/iPad|iPhone|iPod/i.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1)) return 'ios';
  if (/Android/i.test(userAgent)) return 'android';
  return 'desktop';
}
