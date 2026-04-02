# 🍠 Tospudo

Scans your codebase for `TODO` and `FIXME` comments so they don't get forgotten.

## Installation

```bash
pnpm add -D tospudo
```

## Usage

```bash
pnpm tospudo
```

Or add it to your `package.json` scripts:

```json
{
  "scripts": {
    "todos": "tospudo"
  }
}
```

Tospudo scans all files from the current directory, respecting `.gitignore` and ignoring `node_modules/`. It reports every `TODO` and `FIXME` comment found in code, plus unchecked items (`- [ ]`) in `TODO.md` files.

## CLI options

- `--max <number>` — exit with code 1 if the TODO count exceeds this number (useful in CI)
- `--help`
- `--version`

## Configuration

Configuration is optional. Add a `tospudo` key to `package.json`:

```json
{
  "tospudo": {
    "ignore": ["src/generated/**"],
    "max": 20
  }
}
```

Or use a `tospudo.config.ts` / `.json` / `.yaml` file:

```ts
export default {
  ignore: ["src/generated/**"],
  max: 20,
};
```

**Options:**

- `ignore` — additional glob patterns to exclude from scanning
- `max` — maximum number of TODOs allowed before failing

---

## Testing locally (for contributors)

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

##

<br>
<br>
<br>
<div align="center">
  <img src="logo.svg" width="200px">
</div>
