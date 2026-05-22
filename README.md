# Misclick Guild Manager

A comprehensive World of Warcraft guild management web application for tracking rosters, raid calendars, absences, and boss assignments.

## Features

- **Roster Management**: View guild roster with ranks and roles
- **Raid Calendar**: Track raid nights and member absences
- **Absence Submissions**: Members can submit when they'll be unavailable
- **Boss Assignments**: Drag-and-drop interface to assign players to specific bosses
- **Fight Preferences**: Members can indicate which fights they want to be on

## Tech Stack

- **Backend**: Node.js + TypeScript + Express + SQLite
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Drag & Drop**: @dnd-kit/core
- **Calendar**: FullCalendar

## Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and configure your settings
3. Install dependencies:
   ```bash
   npm run setup
   ```
4. Start development servers:
   ```bash
   npm run dev
   ```

The backend will run on `http://localhost:3001` and the frontend on `http://localhost:5173`.

## Configuration

Edit `.env` with your Blizzard API credentials and guild information. See `.env.example` for all available options.

## Building for Production

```bash
npm run build
npm start
```

## License

MIT
