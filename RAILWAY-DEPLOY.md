# Deploy CyberSec Study Portal on Railway

## Before deployment
1. Push the contents of this folder to a GitHub repository.
2. In Railway, create a project and deploy from that GitHub repository.
3. Add a Volume to the Node service and mount it at `/data`.
4. Add these service variables:
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = a long, random secret (at least 32 random characters)
   - `DATABASE_PATH` = `/data/portal.db`
5. Set build command to `npm install` and start command to `npm start`.
6. Generate a public domain from the service settings.

## Important
- The SQLite database must be stored at `/data/portal.db`, on the mounted volume.
- Keep `JWT_SECRET` private. Never commit `.env` or database files to GitHub.
- Register the instructor/admin account first. In this starter version, the first account in an empty database becomes admin; later accounts become students.
- Back up the database volume regularly.
