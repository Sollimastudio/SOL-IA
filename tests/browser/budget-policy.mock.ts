// Test-only fixture. Production never reads URL parameters for authorization.
export const meteredAiEnabled = new URLSearchParams(location.search).get('budget') !== 'zero';
