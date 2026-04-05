# 📦 Releasing

## Steps

1. Bump the version in `package.json`
2. Commit and push
3. Create a new release on GitHub — the publish workflow triggers automatically

The workflow installs dependencies, builds the package (via `prepublishOnly`), and publishes to npm using OIDC authentication.

## Trusted publishing (OIDC)

The workflow uses OpenID Connect (OIDC) to publish directly from CI without storing an npm token as a secret. This requires trusted publishing to be configured for this repository on npmjs.com.
