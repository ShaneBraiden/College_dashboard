# 🚀 Quick Start Guide

## Step 1: Setup MongoDB

### Option A: Local MongoDB
```powershell
# Install MongoDB from https://www.mongodb.com/try/download/community
# Start MongoDB service
net start MongoDB
```

### Option B: MongoDB Atlas (Recommended)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a cluster (M0 Free Tier)
4. Click "Connect" → "Connect your application"
5. Copy the connection string
6. Update `server/config/config.env`:
   ```
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/attendance_manager
   ```

## Step 2: Install Dependencies

```powershell
# Backend
cd server
npm install

# Frontend (in a new terminal)
cd client
npm install
```

## Step 3: Start the Application

```powershell
# Terminal 1: Start Backend (from server directory)
npm run dev

# Terminal 2: Start Frontend (from client directory)
npm start
```

The app will open at `http://localhost:3000`

## Step 4: Create Your First Admin Account

1. Go to `http://localhost:3000/register`
2. Fill in the form:
   - Name: Admin User
   - Email: admin@example.com
   - Password: admin123
   - Role: **Admin**
3. Click Register
4. Login with your credentials

## Step 5: Set Up Your System

### As Admin:

1. **Create Teachers**
   - Go to Admin Dashboard
   - Click "+ Add User"
   - Create teacher accounts

2. **Create Students**
   - Click "+ Add User"
   - Create student accounts

3. **Create Classes**
   - Click "+ Add Class"
   - Add class details (name, code, semester, branch)

4. **Create Timetables**
   - In the Class Management table, click "Timetable" button
   - Select day of week
   - Add time slots with subjects and faculty
   - Save timetable

### As Teacher:

1. Login with teacher credentials
2. View assigned classes
3. Click "Mark Attendance" for a class
4. Select date and period
5. Mark students as present/absent
6. Submit attendance

### As Student:

1. Login with student credentials
2. View attendance percentage
3. Check daily/weekly/monthly reports
4. View bunked hours list

## 🎯 Test Data Setup (Optional)

You can create test accounts:

**Admin:**
- Email: admin@college.edu
- Password: admin123
- Role: admin

**Teacher:**
- Email: teacher@college.edu
- Password: teacher123
- Role: teacher

**Student:**
- Email: student@college.edu
- Password: student123
- Role: student

## 📊 Features to Try

✅ Create a class: "Computer Science - Semester 5"
✅ Create a timetable with 6 periods
✅ Assign students to the class
✅ Mark attendance for a session
✅ View attendance charts in admin dashboard
✅ Check student reports with different periods
✅ View bunked hours list

## 🐛 Troubleshooting

### MongoDB Connection Error
```
Error: Invalid scheme, expected connection string to start with "mongodb://"
```
**Fix:** Update `MONGO_URI` in `server/config/config.env`

### CORS Error
```
Access to XMLHttpRequest has been blocked by CORS policy
```
**Fix:** Backend CORS is already configured. Make sure backend is running on port 5000.

### Port Already in Use
```
Error: Port 5000 is already in use
```
**Fix:** Kill the process using port 5000:
```powershell
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

## 📱 Access from Other Devices

To access the app from other devices on the same network:

1. Find your computer's IP address:
```powershell
ipconfig
# Look for IPv4 Address (e.g., 192.168.1.100)
```

2. On other devices, visit:
```
http://YOUR_IP:3000
```

## 🎉 You're All Set!

Start managing attendance efficiently with your new MERN stack application!

For detailed documentation, see [README.md](./README.md)
