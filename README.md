# CyberSec Study Portal

A starter full-stack learning portal built with Node.js, Express, SQLite and vanilla JavaScript.

## Features
- Student registration and sign-in using hashed passwords
- First registered account becomes the instructor/admin
- Six seeded cyber security learning units
- Lesson reading and multiple-choice assessments
- Server-side marking; correct answers are not exposed before submission
- Individual student progress, quiz history summary and leaderboard
- Instructor-only student report and CSV export
- Password change
- SQLite database created automatically

## Requirements (Kali Linux / Debian / Ubuntu)
Install Node.js and build tools. `better-sqlite3` may need native compilation.

```bash
sudo apt update
sudo apt install -y nodejs npm build-essential python3
```

Check versions:

```bash
node --version
npm --version
```

Use a current supported Node.js LTS release if your distribution's Node.js is very old.

## Install and run

Open a terminal in the extracted `cybersec-portal` folder:

```bash
npm install
npm run seed
npm start
```

Open this address in your browser:

```text
http://localhost:3000
```

The SQLite database file `portal.db` is created in the project folder automatically.

## First account / admin
The first account registered in an empty database receives the `admin` role. Register your instructor account first. Later registrations receive the `student` role.

## Important security notes
- The default JWT secret is for local development only. Before deployment, set a long random `JWT_SECRET` environment variable.
- Set `NODE_ENV=production` when serving over HTTPS so the authentication cookie uses the Secure flag.
- Use HTTPS in production.
- The first-account-admin approach is suitable only for a private starter deployment. For a public deployment, create the admin account out-of-band and disable public admin promotion.
- Back up `portal.db` regularly. Do not delete it unless you intend to erase users and assessment records.
- Do not expose the SQLite database or `.env` file publicly.

## Reset course seed
The seed script intentionally skips seeding if units already exist. To rebuild the demo database from scratch, stop the server and delete `portal.db` (this permanently removes all accounts and attempts), then run:

```bash
npm run seed
```

## Project structure

```text
cybersec-portal/
├── db.js
├── server.js
├── seed.js
├── package.json
├── .env.example
├── README.md
└── public/
    ├── index.html
    ├── style.css
    └── app.js
```
