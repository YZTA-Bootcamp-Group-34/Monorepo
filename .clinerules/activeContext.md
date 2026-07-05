# Active Context: PreClinic Setup

## Current Focus
We are setting up the initial PreClinic monorepo containing:
1. **`backend`**: FastAPI backend + SQLite database seeded with mock data.
2. **`doctor-panel`**: Next.js + shadcn/ui dashboard reproducing the Figma doctor dashboard.
3. **`mobile-app`**: Expo React Native mobile client with a custom tab navigator, CarePulse chatbot, and department views.
4. **Memory Bank Configuration**: Creating the standard memory bank documents.

## Recent Decisions
- **Monorepo Layout:** Separate directory for each module at the repository root.
- **Mock Integration:** Create a fully functional SQLite backend with seeded data matching the Figma screenshots (e.g. Ulaş Can, Esra Canpolat, Alper Duman, Dr. Alper) so the frontends load with identical data on first launch.
- **React Native UI:** Use `React Native Paper` with a custom bottom tab design matching the mint green capsule styling.

## Next Steps
1. Finish creating the systemPatterns.md, techContext.md, and progress.md files.
2. Build the backend code (models, database, main app, and seed script) and run a seed.
3. Initialize the doctor panel Next.js app and implement components.
4. Initialize the Expo app and implement tabs and screens.
