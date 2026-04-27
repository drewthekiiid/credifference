---
name: deploy-vercel
description: Deploy this Next.js app to Vercel with build, environment, and operational checks.
disable-model-invocation: true
---

# Deploy Vercel

Use this skill to deploy this repo's Next.js app to Vercel with appropriate operational checks.

Steps:

1. Check the current branch and working tree.
2. Confirm the app builds locally with `npm run build` unless the user explicitly only wants a remote deploy attempt.
3. Check Vercel linking with `.vercel/project.json` or `vercel project ls`.
4. Verify required production auth environment variables when deploying production:
   - `JWT_SECRET`
   - `RP_ID`
   - `EXPECTED_ORIGIN`
5. Deploy with `vercel deploy --prod --yes` only when production is requested; otherwise use a preview deploy.
6. Return the deployment URL, alias URL if present, and any verification or follow-up needed.

Recommended staff:

- Use `agentsy-ops-director` for deployment readiness, rollback, and runtime concerns.
- Use `agentsy-risk-officer` when auth, secrets, public exposure, client data, or irreversible production changes are involved.
- Use `agentsy-qa-director` after deploy-impacting changes to verify behavior.

If the user included a hostname, target environment, or rollout instruction after the slash command, treat that as the deployment brief.
