# 🔧 Production Deployment Setup

## Setting Up Environment Variables in Netlify

Your expense tracker is deployed but needs Google API credentials to work fully. Here's how to set them up:

### Step 1: Access Netlify Dashboard
1. Go to [app.netlify.com](https://app.netlify.com)
2. Click on your **expense-tracker** site
3. Go to **Site settings** → **Environment variables**

### Step 2: Add Required Variables
Add these environment variables:

| Variable Name | Description | Example Value |
|---------------|-------------|---------------|
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID | `123456789-abcdef.apps.googleusercontent.com` |
| `VITE_GOOGLE_API_KEY` | Google Sheets API Key | `AIzaSyABC123DEF456GHI789JKL` |
| `VITE_SPREADSHEET_ID` | Google Sheets ID (optional) | `1ABC123DEF456GHI789JKL` |
| `VITE_APP_NAME` | App Display Name | `Expense Tracker` |
| `VITE_DEFAULT_CURRENCY` | Default Currency | `USD` |

### Step 3: Get Google API Credentials

#### Option A: Use Existing Credentials (from local .env)
If you already have working credentials locally:
1. Copy values from your local `.env` file
2. Add them to Netlify environment variables
3. Redeploy

#### Option B: Create New Google API Credentials
1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**
2. **Create/Select Project**
   - Create new project or select existing
   - Name it "Expense Tracker"

3. **Enable APIs**
   - Go to "APIs & Services" → "Library"
   - Search and enable "Google Sheets API"
   - Search and enable "Google Drive API"

4. **Create Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy the API Key → This is your `VITE_GOOGLE_API_KEY`

5. **Create OAuth Client**
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Name: "Expense Tracker Web"
   - Authorized JavaScript origins: 
     - `https://your-site-name.netlify.app`
     - `http://localhost:3000` (for local development)
   - Copy Client ID → This is your `VITE_GOOGLE_CLIENT_ID`

### Step 4: Configure Domain
In your Google OAuth settings:
1. Add your Netlify domain to authorized origins:
   - `https://your-actual-netlify-url.netlify.app`

### Step 5: Trigger Redeploy
After adding environment variables:
1. Go to **Deploys** tab in Netlify
2. Click **Trigger deploy** → **Deploy site**
3. Wait for deployment to complete

## 🎯 Quick Setup for Demo/Testing

If you want to deploy a demo version without full Google Sheets integration:

1. **Add basic environment variables:**
   ```
   VITE_APP_NAME=Expense Tracker Demo
   VITE_DEFAULT_CURRENCY=USD
   VITE_GOOGLE_CLIENT_ID=demo
   VITE_GOOGLE_API_KEY=demo
   ```

2. **The app will show a configuration message** instead of errors
3. **Users can still navigate** and see the app structure
4. **Perfect for portfolio demonstration**

## 🔍 Troubleshooting

### Common Issues:

**"Missing required parameter client_id"**
- Add `VITE_GOOGLE_CLIENT_ID` to Netlify environment variables
- Make sure there are no typos in variable names
- Redeploy after adding variables

**"API key not valid"**
- Check that Google Sheets API is enabled in Google Cloud Console
- Verify the API key is correct
- Make sure API key restrictions allow your domain

**"Origin not allowed"**
- Add your Netlify URL to Google OAuth authorized origins
- Format: `https://your-site.netlify.app` (no trailing slash)

### Debug Steps:
1. Check browser console for detailed error messages
2. Visit the `/debug` page on your deployed site
3. Verify environment variables are set in Netlify dashboard
4. Try redeploying after making changes

## 📧 Need Help?

If you encounter issues:
1. Check the [Debug page](https://your-site.netlify.app/debug) on your deployed app
2. Verify all environment variables are set correctly
3. Ensure Google Cloud APIs are enabled and configured properly
