# 🤖 Service Account Setup Guide

## Multi-User Expense Tracker Setup

This guide will help you set up Service Account authentication for multi-user expense tracking without requiring individual Google logins.

## 🎯 What Service Account Enables

**Before**: Only you can add expenses (requires your Google credentials)  
**After**: Anyone can add expenses automatically synced to Google Sheets

- ✅ **No user authentication required**
- ✅ **Multi-user access** - family/team can all add expenses
- ✅ **Automatic Google Sheets sync** in the background
- ✅ **Perfect for shared expense tracking**

## 📋 Setup Process (5 minutes)

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Name it something like "Expense Tracker Service"

### Step 2: Enable Google Sheets API

1. Go to **APIs & Services** → **Library**
2. Search for "Google Sheets API"
3. Click **Enable**

### Step 3: Create Service Account

1. Go to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **Service Account**
3. Fill in details:
   - **Service account name**: `expense-tracker-service`
   - **Service account ID**: (auto-generated)
   - **Description**: "Service account for expense tracker app"
4. Click **Create and Continue**
5. Skip role assignment (click **Continue**)
6. Click **Done**

### Step 4: Generate Service Account Key

1. In **Credentials**, click on your service account email
2. Go to **Keys** tab
3. Click **Add Key** → **Create new key**
4. Select **JSON** format
5. Click **Create**
6. **Download the JSON file** (keep it secure!)

### Step 5: Create/Share Google Sheet

**Option A: Create New Sheet**
1. Go to [Google Sheets](https://sheets.google.com/)
2. Create a new spreadsheet
3. Name it "Expense Tracker" or similar
4. Copy the spreadsheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
   ```

**Option B: Use Existing Sheet**
1. Open your existing expense spreadsheet
2. Copy the spreadsheet ID from URL

### Step 6: Share Sheet with Service Account

1. In your Google Sheet, click **Share**
2. Add the service account email (found in the JSON file)
   - Email looks like: `expense-tracker-service@your-project.iam.gserviceaccount.com`
3. Give it **Editor** permissions
4. Click **Send**

### Step 7: Configure Environment Variables

Add these to your `.env` file:

```env
# Service Account Configuration
VITE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
VITE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key content here\n-----END PRIVATE KEY-----\n"
VITE_SPREADSHEET_ID=your_spreadsheet_id_here
```

**⚠️ Important**: The private key must include the full key with `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` markers, and newlines should be represented as `\n`.

### Step 8: Configure Netlify Environment Variables

In Netlify Dashboard → Site settings → Environment variables:

1. **VITE_SERVICE_ACCOUNT_EMAIL**
   - Value: Your service account email

2. **VITE_SERVICE_ACCOUNT_PRIVATE_KEY**
   - Value: The entire private key from JSON file (including BEGIN/END markers)

3. **VITE_SPREADSHEET_ID**
   - Value: Your Google Sheet ID

### Step 9: Deploy and Test

1. Push your code to GitHub (environment variables will be used automatically)
2. Netlify will rebuild with service account support
3. Test the app - expenses should automatically sync to Google Sheets!

## 🔒 Security Notes

- **Keep the JSON file secure** - it contains sensitive credentials
- **Never commit the JSON file** to your repository
- **Use environment variables** for deployment
- **The service account only has access** to sheets you explicitly share with it

## ✅ Verification

After setup, your app will show:
- 🤖 **Multi-User Ready** status in the header
- **Automatic syncing** without manual sync button
- **No authentication prompts** for users

## 🛠️ Troubleshooting

**Problem**: "Service account credentials not configured"
- **Solution**: Check environment variables are set correctly

**Problem**: "Failed to get access token"
- **Solution**: Verify private key format includes BEGIN/END markers

**Problem**: "Google Sheets API error: 403"
- **Solution**: Make sure you shared the sheet with service account email

**Problem**: Private key formatting issues
- **Solution**: Ensure newlines are represented as `\n` in environment variable

## 🎉 Success!

Once configured, anyone can use your expense tracker app and all expenses will automatically sync to your Google Sheet in real-time!

**Multi-user expense tracking without any authentication hassles! 🚀**
