# Deployment Instructions for Render.com

## Environment Variables

Add these environment variables in Render Dashboard → Environment:

### Required Variables

```
JWT_SECRET=<generate-a-strong-random-secret-here>
CLIENT_URL=https://misclick.onrender.com
API_BASE_URL=https://misclick.onrender.com
NODE_ENV=production
```

### Blizzard API Variables (Already Set)

```
BLIZZARD_CLIENT_ID=89c0d76eba9b4fd5a27303184e8797e4
BLIZZARD_CLIENT_SECRET=h6ifrQU4okgfHqqYKdxT7bKzidOyBHeH
BLIZZARD_REGION=us
WOW_REALM=Sargeras
WOW_GUILD_NAME=Misclick
```

## Deployment Steps

1. **Set Environment Variables** in Render Dashboard
   - Go to your Render service
   - Click "Environment" tab
   - Add the required variables above

2. **Push to GitHub**
   ```powershell
   git add .
   git commit -m "Add authentication system with auto-sync and production setup"
   git push origin main
   ```

3. **Wait for Auto-Deploy** (2-3 minutes)
   - Render will automatically deploy when code is pushed

4. **Setup Admin Account** (First time only)
   - Once deployed, go to Render Dashboard → Shell
   - Run: `node setup-production-admin.js`
   - This will create the admin account

5. **Login**
   - Go to https://misclick.onrender.com
   - Username: `juice`
   - Password: `P@55word87`

## Features Enabled

✅ **Authentication System**
- JWT-based authentication with httpOnly cookies
- 5 roles: Administrator, Officer, Raider, Member, Guest
- Role-based permissions for all features
- Persistent login (7-day token expiration)
- Case-insensitive login
- Unique usernames enforced

✅ **Auto-Sync Scheduler**
- Boss kills sync: 6 AM, 12 PM, 6 PM, 10 PM (EST)
- Guild roster sync: 3 AM (EST)
- No manual sync buttons needed

✅ **Permission System**
- Admins/Officers: Full edit access
- Raiders/Members: View all tabs, add absences/preferences
- Guests: View Home, Boss Assignments, Fight Preferences only

## Database

Database location: `/data/guild.db` (persistent disk on Render)

## Logs

View logs in Render Dashboard → Logs tab to monitor:
- Scheduled sync tasks
- Authentication events
- API requests
