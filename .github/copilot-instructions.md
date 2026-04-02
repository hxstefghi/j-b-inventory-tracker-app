# Copilot Workspace Instructions

## Project context
- This is a cross-platform inventory tracker app.
- Root has an empty README and an initially empty `backend/` folder.
- `mobile-frontend/` is an Expo-managed React Native app, created by `create-expo-app`, using `app/` file-based routing.

## Goals
- Keep this guidance concise and actionable for Copilot and collaborators.
- Focus on local setup, expected folder usage, and safe init/reset behavior.

## Quick tasks
1. `cd mobile-frontend`
2. `npm install`
3. `npx expo start`

## Fresh app behavior
- Keep `app/` as the active code path.
- For safe resets, use the built-in script:
  - `npm run reset-project` (moves current starter code to `app-example` and creates an empty `app`).

## Backend
- `backend/` currently empty. Ask the user for architecture intent (API server, DB, etc.) before scaffolding.

## Helpful notes for auto-generated content
- Avoid suggesting operations that delete the entire repo root.
- When creating new mobile features, prefer Expo router conventions (file-based routes in `app/`).

## Where to find docs
- `mobile-frontend/README.md` for Expo startup instructions.
- Expo docs: https://docs.expo.dev
