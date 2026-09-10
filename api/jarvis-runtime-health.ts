export default {
  async fetch() {
    return Response.json({
      ok: true,
      runtime: 'vercel',
      environmentPresent: typeof process.env.VERCEL_ENV === 'string' && process.env.VERCEL_ENV.length > 0,
      gateway: {
        explicitKeyPresent: typeof process.env.AI_GATEWAY_API_KEY === 'string' && process.env.AI_GATEWAY_API_KEY.trim().length > 0,
        oidcTokenPresent: typeof process.env.VERCEL_OIDC_TOKEN === 'string' && process.env.VERCEL_OIDC_TOKEN.trim().length > 0,
        usableCredentialPresent: Boolean(
          (typeof process.env.AI_GATEWAY_API_KEY === 'string' && process.env.AI_GATEWAY_API_KEY.trim()) ||
          (typeof process.env.VERCEL_OIDC_TOKEN === 'string' && process.env.VERCEL_OIDC_TOKEN.trim())
        )
      }
    }, {
      headers: {
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
};
