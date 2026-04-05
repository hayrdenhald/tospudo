# Releasing

## Steps

1. Make sure all work is merged and you are on `main`
2. Bump the version and create a git tag:
   ```bash
   pnpm version patch   # or minor / major
   git push --follow-tags
   ```
   `--follow-tags` pushes both the commit and the tag created by `pnpm version`. Without it the tag stays local and GitHub won't see it.
3. Create a new release on GitHub pointing to the tag — the publish workflow triggers automatically

The workflow runs tests, builds the package, and publishes to npm using OIDC authentication.

## Trusted publishing (OIDC)

The workflow uses OpenID Connect (OIDC) to publish directly from CI without storing an npm token as a secret.

To set it up on the npm side, go to `npmjs.com/package/tospudo/access` and configure a trusted publisher with your GitHub username and repository. The package must already exist on npm before trusted publishing can be enabled.
