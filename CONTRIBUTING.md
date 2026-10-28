# Contributing

## Branches

- `main` – stable, released code. No direct pushes.
- `dev` – integration branch. All PRs target `dev`.

Flow: branch off `dev` → PR into `dev` → when ready to release, PR `dev` → `main`.

## Setup

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go.

## Before opening a PR

```bash
npx tsc --noEmit
```

Keep PRs small and focused. Describe what changed and how you tested it (device / Expo Go / web).

## Releases

1. Merge `dev` into `main`.
2. Create a GitHub Release with a new tag (e.g. `v1.1.0`), target `main`.
3. The `Release APK` workflow builds the Android APK and attaches it to the release.

Bump `version` in `app.json` and `package.json` before releasing.
