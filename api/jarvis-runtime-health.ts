import { JARVIS_INVARIANTS_VERSION } from '../core/jarvis-invariants.mjs';
import { GROWTH_INTELLIGENCE_VERSION } from '../core/growth-intelligence.mjs';
import { TENANT_CONTEXT_VERSION } from '../core/tenant-context.mjs';
import { PROFILE_PACKS_VERSION } from '../core/profile-packs.mjs';
import { SKILL_PACKS_VERSION } from '../core/skill-packs.mjs';
import { ANTI_FATIGUE_VERSION } from '../server/anti-fatigue.mjs';
import { resolveGpt6Experiment } from '../server/gpt6-experiment.mjs';

export default {
  async fetch() {
    let helperOidcPresent = false;
    try {
      const { getVercelOidcToken } = await import('@vercel/oidc');
      helperOidcPresent = Boolean(await getVercelOidcToken());
    } catch {
      helperOidcPresent = false;
    }

    const explicitKeyPresent = typeof process.env.AI_GATEWAY_API_KEY === 'string' && process.env.AI_GATEWAY_API_KEY.trim().length > 0;
    const envOidcPresent = typeof process.env.VERCEL_OIDC_TOKEN === 'string' && process.env.VERCEL_OIDC_TOKEN.trim().length > 0;
    const gpt6Experiment = resolveGpt6Experiment(process.env);

    return Response.json({
      ok: true,
      runtime: 'vercel',
      environmentPresent: typeof process.env.VERCEL_ENV === 'string' && process.env.VERCEL_ENV.length > 0,
      core: {
        invariantsVersion: JARVIS_INVARIANTS_VERSION,
        antiFatigueVersion: ANTI_FATIGUE_VERSION,
        growthIntelligenceVersion: GROWTH_INTELLIGENCE_VERSION,
        tenantContextVersion: TENANT_CONTEXT_VERSION,
        profilePacksVersion: PROFILE_PACKS_VERSION,
        skillPacksVersion: SKILL_PACKS_VERSION,
        durableContinuity: true,
        profileDna: true,
        assistantHistorySeparation: true,
        tenantContracts: true,
        clientSpecificProfilesAreExplicit: true
      },
      gateway: {
        explicitKeyPresent,
        envOidcPresent,
        helperOidcPresent,
        usableCredentialPresent: explicitKeyPresent || envOidcPresent || helperOidcPresent
      },
      models: {
        currentConfiguredModel: typeof process.env.JARVIS_MODEL === 'string' ? process.env.JARVIS_MODEL : null,
        gpt6Experiment
      }
    }, {
      headers: {
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
};
