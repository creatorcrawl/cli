# Changelog

## 0.3.1

- Fixed the published executable containing duplicate shebang lines.
- Added the hosted `https://creatorcrawl.com/install.sh` installation path.

## 0.3.0

**Breaking changes.**

- Bumped `@creatorcrawl/sdk` to `^0.3.0`, which switches every endpoint to the new unified `{ data, page?, meta }` envelope.
- All platforms (TikTok, Instagram, Twitter/X, YouTube, Reddit, LinkedIn) now return canonical `Creator` / `Post` / `Comment` shapes with snake_case fields and ISO 8601 dates.
- CLI surface is unchanged: command names, arguments, and flags are identical to 0.2. Only the shape of the JSON printed to stdout has changed.
- README examples updated to reflect the new envelope (e.g. `.data.handle` / `.data.follower_count` instead of `.user.uniqueId` / `.stats.followerCount`).

See the [`@creatorcrawl/sdk` changelog](https://www.npmjs.com/package/@creatorcrawl/sdk) for the full type-level migration.

## 0.2.0

- Initial public release.
