// Simple browser fingerprinting for preview tracking
export function generateFingerprint(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  let fingerprint = '';
  
  // Screen resolution
  fingerprint += `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
  
  // Timezone
  fingerprint += `-${new Date().getTimezoneOffset()}`;
  
  // Language
  fingerprint += `-${navigator.language}`;
  
  // Platform
  fingerprint += `-${navigator.platform}`;
  
  // User agent (simplified)
  fingerprint += `-${navigator.userAgent.slice(0, 50)}`;
  
  // Canvas fingerprint (basic)
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('fingerprint', 2, 2);
    fingerprint += `-${canvas.toDataURL().slice(-50)}`;
  }
  
  // Create hash
  return simpleHash(fingerprint);
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

export function getStoredFingerprint(): string {
  const stored = localStorage.getItem('device_fp');
  if (stored) return stored;
  
  const fingerprint = generateFingerprint();
  localStorage.setItem('device_fp', fingerprint);
  return fingerprint;
}
