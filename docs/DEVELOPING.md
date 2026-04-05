# 💻 Developing

## Testing locally

There are three ways to test tospudo without publishing to npm.

### 1. Install by path (recommended for development)

Install directly from the local filesystem into a test project:

```bash
pnpm add -D /path/to/tospudo
```

This best mimics how real users install the package — the binary is available via `pnpm tospudo`, scoped to the project. You'll need to reinstall after making changes to tospudo.

### 2. `pnpm link`

Link your local package globally, then link it into any project you want to test with:

```bash
# In the tospudo directory
pnpm link --global

# In your test project
pnpm link tospudo
```

Changes to tospudo are reflected immediately — no reinstall needed. Note that this makes the binary available globally, not just in the test project.

To unlink when you're done:

```bash
# In your test project
pnpm unlink tospudo

# In the tospudo directory
pnpm uninstall --global tospudo
```

### 3. `pnpm pack` (recommended before publishing)

Pack the project into a tarball — exactly as it would appear on npm — and install that:

```bash
# In the tospudo directory
pnpm pack

# In your test project
pnpm add -D /path/to/tospudo/tospudo-1.0.0.tgz
```

This is the most accurate way to verify what you're actually shipping. Run it as a final sanity check before every publish.

Note: always run `pnpm build` before `pnpm pack`. The `prepublishOnly` script only runs automatically for `pnpm publish`, not for `pnpm pack`.
