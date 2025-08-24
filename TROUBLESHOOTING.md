# 🔧 Fixing "Permission Denied" Error

## Problem
Getting error: "Permission denied. Make sure you have edit access to the spreadsheet."

## Quick Fix

### Step 1: Clear Spreadsheet ID (Let App Create New One)

1. **Open your `.env` file**
2. **Comment out the spreadsheet ID line**:
   ```env
   # VITE_SPREADSHEET_ID=your_spreadsheet_id_here
   ```
3. **Save the file**
4. **Restart the development server** if needed

### Step 2: Test Adding Expense

1. **Go to your app** (http://localhost:3001)
2. **Click "Add Expense"**
3. **Fill in expense details**
4. **Submit** - this will trigger Google login
5. **Sign in with your Google account**
6. **Grant permissions** when prompted
7. **App will create a NEW spreadsheet** automatically

### Step 3: Get New Spreadsheet ID (Optional)

After the expense is added successfully:

1. **Check browser console** (F12 → Console)
2. **Look for log**: "Created new spreadsheet: [SPREADSHEET_ID]"
3. **Copy the new spreadsheet ID**
4. **Add it to your `.env` file**:
   ```env
   VITE_SPREADSHEET_ID=your_new_spreadsheet_id_here
   ```

## Why This Happens

The spreadsheet ID in your `.env` file might:
- ✅ **Belong to someone else** (you don't have edit access)
- ✅ **Be from a shared spreadsheet** with read-only permissions
- ✅ **Have restricted permissions** from Google Workspace admin

## Prevention for Multi-User Setup

### For Shared Google Account Approach:

1. **Use the same Google account** for creating and accessing spreadsheet
2. **Let the app create the spreadsheet** (don't manually create it)
3. **Share the spreadsheet URL** with team members after creation
4. **Everyone logs in with the SAME Google account**

### Spreadsheet Permissions:
- ✅ **Owner**: Full edit access (what you want)
- ❌ **Editor**: May work but can have restrictions  
- ❌ **Viewer**: Read-only (causes permission errors)

## Success Indicators

After fixing, you should see:
- ✅ **"Expense added successfully!"** message
- ✅ **New spreadsheet created** in your Google Drive
- ✅ **Console log**: "Expense saved to Google Sheets"
- ✅ **Data appears** in both app and Google Sheets

## Still Having Issues?

1. **Check browser console** for specific error messages
2. **Try different Google account** (one you're sure owns spreadsheets)
3. **Clear browser data** and re-authenticate
4. **Check Google API quotas** in Google Cloud Console

The permission error should be resolved once the app creates its own spreadsheet that your Google account owns!
