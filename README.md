# focusroom

FocusRoom has separate frontend (`client/`) and API/socket server (`server/`) apps.

## Local development

1. Copy `client/.env.example` to `client/.env`.
2. Copy `server/.env.example` to `server/.env`.
3. In `client/`, leave `VITE_API_URL` empty for local development so Vite can proxy `/api` and `/socket.io` to `http://localhost:4000`.
4. Start the API from `server/` with `npm run dev`.
5. Start the frontend from `client/` with `npm run dev`.

## Production deployment

- Set `VITE_API_URL` in the frontend deployment to your deployed API origin, for example `https://your-api.onrender.com`.
- Set `CLIENT_URL` in the server deployment to your frontend origin, for example `https://www.focusroom.live`.
- Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in the server deployment. Protected routes like `POST /api/rooms` return `503` without them.
- Build the server before starting it. The production start command now expects compiled output in `server/dist/`.

If the deployed app shows "Could not create room", the fastest checks are:

- frontend `VITE_API_URL` is set correctly
- server `SUPABASE_URL` is set
- server `SUPABASE_SERVICE_ROLE_KEY` is set
- server `CLIENT_URL` matches the exact frontend origin
