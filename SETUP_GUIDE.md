# Misclick Guild Manager - Setup Guide

Welcome to your WoW Guild Management System! This guide will help you get everything up and running.

## 🚀 Quick Start

### 1. Install Dependencies (Already Done!)
The dependencies for both server and client have been installed.

### 2. Configure Your Environment

Edit the `.env` file in the root directory with your settings:

```env
PORT=3001
NODE_ENV=development

# Optional: For syncing roster from Blizzard API
BLIZZARD_CLIENT_ID=your_client_id
BLIZZARD_CLIENT_SECRET=your_secret
BLIZZARD_REGION=us
WOW_REALM=your-realm-slug
WOW_GUILD_NAME=Your Guild Name
```

**Note:** The Blizzard API configuration is optional. You can manually add members through the UI if you prefer.

### 3. Start the Development Server

Open a terminal and run:
```bash
npm run dev
```

This will start both the backend server (port 3001) and the React frontend (port 5173).

### 4. Access the Application

Open your browser and go to:
```
http://localhost:5173
```

## 📋 Features Overview

### **Roster Management**
- View all guild members with their class, spec, role, and rank
- Manually add/edit/delete members
- Optional: Sync roster from Blizzard API
- Color-coded by WoW class

### **Raid Calendar**
- Visual calendar showing all raid nights
- Click a date to add a raid event
- See member absences highlighted in red
- Integrated with FullCalendar for a smooth experience

### **Member Absences**
- Members can report when they'll be unavailable
- Set start/end dates and optional reason
- View all absences in a table or on the calendar
- Helps with raid planning

### **Boss Assignments (Drag & Drop)**
- Weekly mythic roster planning
- Drag members from the available pool onto specific bosses
- Navigate between weeks to plan ahead
- Save and track your roster week by week
- See exactly who's on what fight

### **Fight Preferences**
- Members can request specific boss fights
- Indicate priority (high for BiS, normal for upgrades, low for minor)
- Provide reasons (gear, progression, learning)
- Helps guild leaders make informed roster decisions
- Grouped by boss for easy review

## 🔧 Blizzard API Setup (Optional)

If you want to sync your guild roster automatically:

1. Go to https://develop.battle.net/
2. Create a new application
3. Copy your Client ID and Client Secret
4. Add them to your `.env` file
5. Set your realm (use the slug, e.g., "area-52" for Area 52)
6. Set your guild name (exact match)
7. Click "Sync from Blizzard" in the Roster page

## 📊 Database

The application uses SQLite for data storage:
- Database file: `./data/guild.db`
- Automatically created on first run
- All data is stored locally
- No external database needed

## 🏗️ Project Structure

```
.
├── server/              # Backend Express server
│   ├── db/             # Database setup
│   ├── routes/         # API endpoints
│   ├── services/       # Blizzard API integration
│   └── utils/          # Utilities and logger
├── client/             # React frontend
│   ├── src/
│   │   ├── pages/      # Main page components
│   │   ├── lib/        # API client and utilities
│   │   └── types/      # TypeScript interfaces
│   └── public/
└── data/               # SQLite database (created automatically)
```

## 🛠️ Development Commands

```bash
# Start both server and client
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Server only (development)
npm run server:dev

# Client only (development)
cd client && npm run dev
```

## 💾 Data Management

### Backing Up Your Data
Simply copy the `data/guild.db` file to back up all your guild data.

### Resetting the Database
Delete the `data/guild.db` file and restart the server to start fresh.

## 🎮 Using the Application

### For Guild Leaders:
1. **Set up your roster**: Add members manually or sync from Blizzard
2. **Create raid events**: Click dates on the calendar to add raids
3. **Review absences**: Check who's out for upcoming raids
4. **Plan boss rosters**: Use drag-and-drop to assign members to bosses
5. **Review preferences**: See who wants to be on which fights

### For Guild Members:
1. **Report absences**: Let leadership know when you'll be unavailable
2. **Submit fight preferences**: Request to be on bosses for gear or progression
3. **Check assignments**: See which bosses you're assigned to each week

## 🐛 Troubleshooting

### Port Already in Use
If port 3001 or 5173 is already in use, change the PORT in `.env` or the client port in `client/vite.config.ts`.

### Database Errors
Make sure the `data/` directory has write permissions.

### Blizzard API Not Working
- Verify your credentials are correct
- Check your realm slug format (lowercase, hyphens instead of spaces)
- Ensure your guild name matches exactly (case-sensitive)

## 📝 Notes

- The default boss list is for the current raid tier (Nerub-ar Palace)
- You can edit `MYTHIC_BOSSES` in `client/src/lib/utils.ts` for new tiers
- All timestamps use your local timezone
- The application is designed for desktop browsers (mobile-friendly but best on desktop)

## 🎉 You're All Set!

Run `npm run dev` and start managing your guild!

For questions or issues, check the logs in `error.log` and `combined.log`.
