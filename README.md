# Expense Tracker Web App

A simple, intuitive expense tracking web application that works completely offline with optional Google Sheets sync for backup.

![Expense Tracker Dashboard](https://via.placeholder.com/800x400?text=Expense+Tracker+Dashboard)

## Features

- ✅ **Standalone Operation** - Works completely without internet or Google account
- ✅ **Local Storage** - All data saved in browser, persists across sessions
- ✅ **Quick Expense Entry** - Fast input form with predefined categories
- ✅ **Category Management** - Predefined and custom expense categories
- ✅ **Date Range Filtering** - View expenses by specific time periods
- ✅ **Visual Dashboard** - Charts and spending summaries
- ✅ **Optional Google Sheets Sync** - Backup data to cloud when desired
- ✅ **Mobile Responsive** - Works seamlessly on all devices
- ✅ **Modern UI** - Clean, intuitive interface with Tailwind CSS

## Tech Stack

- **Frontend**: React 18 with Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **Storage**: localStorage (primary) + Google Sheets (optional)
- **Charts**: Recharts (planned)
- **Authentication**: Google OAuth 2.0 (optional)

## Quick Start

### Prerequisites

- Node.js 16 or higher
- npm or yarn

### Installation

1. **Clone and install dependencies**
   ```bash
   npm install
   ```

2. **Start the development server**
   ```bash
   npm run dev
   ```

3. **Open your browser** and go to `http://localhost:3000`

That's it! You can start tracking expenses immediately. No configuration required.

### Optional Google Sheets Integration

If you want to backup your data to Google Sheets:

1. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Google API credentials:
   ```env
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   VITE_GOOGLE_API_KEY=your_google_api_key
   VITE_SPREADSHEET_ID=your_spreadsheet_id
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## Google Sheets Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable the Google Sheets API
4. Create credentials (OAuth 2.0 Client ID)

### 2. Configure OAuth

1. In the Google Cloud Console, go to APIs & Services > Credentials
2. Create OAuth 2.0 Client ID
3. Add your domain to authorized origins:
   - `http://localhost:3000` (for development)
   - Your production domain

### 3. Create Expense Spreadsheet

The app will automatically create a new spreadsheet when you first connect, or you can create one manually with these columns:

| Date | Amount | Category | Description | Payment Method | Created At |
|------|--------|----------|-------------|----------------|------------|

## Project Structure

```
expense-tracker/
├── src/
│   ├── components/
│   │   ├── ui/              # Reusable UI components
│   │   ├── forms/           # Form components
│   │   ├── charts/          # Chart components (planned)
│   │   └── layout/          # Layout components
│   │       └── Header.jsx
│   ├── pages/
│   │   ├── Dashboard.jsx    # Main dashboard
│   │   ├── AddExpense.jsx   # Add expense form
│   │   ├── ExpenseList.jsx  # View all expenses
│   │   └── Settings.jsx     # App settings
│   ├── services/
│   │   └── googleSheets.js  # Google Sheets API
│   ├── utils/
│   │   └── helpers.js       # Utility functions
│   ├── App.jsx              # Main app component
│   ├── main.jsx            # App entry point
│   └── index.css           # Global styles
├── public/                  # Static assets
├── .env.example            # Environment variables template
└── README.md              # This file
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Features in Detail

### Dashboard
- Overview of total expenses
- Monthly spending summary
- Category breakdown with visual indicators
- Recent expenses list

### Add Expense
- Quick expense entry form
- Category selection
- Date picker
- Payment method tracking
- Form validation

### Expense List
- View all expenses with filtering
- Search by description or category
- Date range filtering
- Sort by various fields
- Edit/delete functionality (planned)

### Settings
- Google Sheets connection management
- Custom category management
- App preferences
- Data export options (planned)

## Development Roadmap

### Phase 1: Core UI ✅
- [x] Project setup with Vite and React
- [x] Tailwind CSS configuration
- [x] Basic routing and navigation
- [x] Dashboard layout
- [x] Add expense form
- [x] Expense list view
- [x] Settings page

### Phase 2: Google Sheets Integration ⏳
- [ ] Google OAuth implementation
- [ ] Sheets API integration
- [ ] Real-time data sync
- [ ] Error handling and offline support

### Phase 3: Enhanced Features
- [ ] Charts and visualizations
- [ ] Advanced filtering and search
- [ ] Data export (CSV/PDF)
- [ ] Budget tracking
- [ ] Receipt photo capture

### Phase 4: Polish & Deploy
- [ ] Performance optimization
- [ ] Progressive Web App features
- [ ] Production deployment
- [ ] User documentation

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID | Yes |
| `VITE_GOOGLE_API_KEY` | Google API Key | Yes |
| `VITE_SPREADSHEET_ID` | Google Sheets ID (optional) | No |
| `VITE_APP_NAME` | App display name | No |
| `VITE_DEFAULT_CURRENCY` | Default currency code | No |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/expense-tracker/issues) page
2. Create a new issue with detailed information
3. Include steps to reproduce any bugs

## Acknowledgments

- Built with [Vite](https://vitejs.dev/) and [React](https://reactjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons from [Heroicons](https://heroicons.com/)
- Inspired by modern expense tracking apps

---

**Happy expense tracking! 💰📊**
