# Releasing

## Steps

1. Make sure all work is merged, then update `main` and create a release branch:

   ```bash
   git switch main
   git pull --ff-only
   git switch -c release/vX.Y.Z
   ```

2. Bump the version without creating a commit or tag:

   ```bash
   pnpm version patch --no-git-tag-version   # or minor / major
   ```

3. Commit the version change, push the branch, and open a pull request, and merge it.
4. Update local `main` to the merged commit and create and push the release tag:

   ```bash
   git switch main
   git pull --ff-only
   git tag vX.Y.Z
   git push origin vX.Y.Z
   ```

   Push only the new tag; avoid `--follow-tags`, which can also attempt to push unrelated local tags.
5. Create a new GitHub release using the pushed tag. The publish workflow triggers automatically.

The workflow runs tests, builds the package, and publishes to npm using OIDC authentication.

## Trusted publishing (OIDC)

The workflow uses OpenID Connect (OIDC) to publish directly from CI without storing an npm token as a secret.

To set it up on the npm side, go to `npmjs.com/package/tospudo/access` and configure a trusted publisher with your GitHub username and repository. The package must already exist on npm before trusted publishing can be enabled.
