# Sujan Gautam Portfolio

High-fidelity interactive portfolio and social feed. Built with React, TypeScript, Tailwind CSS, and Node.js.

## Tech Stack
- **Frontend**: Vite, React, TypeScript, Shadcn UI
- **Backend**: Node.js, Express, MongoDB, Passport.js (Google OAuth)
- **Styling**: Tailwind CSS
- **AI Integration**: Gemini API for contextual project insights
- **Media**: Cloudinary for image and video hosting

## Features
- **Social Feed**: Text, images, reels, and polls with real-time engagement.
- **Interactive About Me**: Long-hover AI insights and living UI elements.
- **Bento Grid Portfolio**: Premium project showcases with integrated AI chat.
- **Admin Dashboard**: Full CRUD for projects, feed, and site settings.

## Checks and releases

Use Node.js 22 and install both packages with `npm ci` and `npm --prefix backend ci`. Run `npm run typecheck`, `npm test`, and `npm run build` for the frontend. With a local MongoDB instance running on port 27017, run `npm --prefix backend test` for the rollout and tracking integration test. The test uses a disposable database on loopback. Set `TEST_MONGODB_PORT` if MongoDB uses a different local port.

1. Open a pull request into `main`. Review the Vercel preview and wait for **Frontend checks** and **MongoDB integration**. Those checks can be required in the GitHub rules for `main`.
2. Merge the reviewed pull request to release through the existing Vercel Git integration. GitHub Actions checks the build and the live site. Vercel owns deployment.
3. Check **Production smoke check** after the successful Vercel deployment. It verifies the production homepage and reports each effective page version. It can also be run manually from the Actions tab.

In production, pages without an override use V2. Preview and development deployments default to V1. In **Admin → Settings → Page versions**, change one page or select all V1 or all V2, then save. A saved choice takes precedence over the environment default. To roll back only the layouts, select all V1 and save. To roll back the whole release, use Vercel's deployment rollback.

V1 and V2 page modules load separately. If a V2 module fails to load or render, that page falls back to V1 and the saved switch stays in place. Both versions use the same data, access rules, and analytics.

## License
MIT
