# 💰 Expense Tracker

A modern, responsive expense tracking web application built with React and integrated with Google Sheets for real-time data storage.

## ✨ Features

- 📊 **Dashboard** - Overview of expenses with totals and category breakdowns
- ➕ **Add Expenses** - Quick and easy expense entry form
- 📋 **Expense List** - View, filter, and manage all expenses
- 🔧 **Settings** - Configure categories and Google Sheets integration
- 🐛 **Debug Panel** - Troubleshoot Google Sheets API connection
- 📱 **Responsive Design** - Works perfectly on desktop and mobile
- ☁️ **Cloud Sync** - Real-time sync with Google Sheets

## 🚀 Live Demo

🌐 **[View Live App](https://gastosfamily.netlify.app/)**

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **Backend**: Google Sheets API
- **Authentication**: Google OAuth 2.0
- **Deployment**: Netlify
- **Version Control**: Git + GitHub

## 🏃‍♂️ Quick Start

1. **Clone the repository**

   ```bash
   git clone https://github.com/oscar/expense-tracker.git
   cd expense-tracker
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your Google API credentials
   ```

4. **Start development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   - Navigate to `http://localhost:3000`

## ⚙️ Google Sheets Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Sheets API
4. Create credentials (OAuth 2.0 Client IDs)
5. Add your credentials to `.env` file

## 📁 Project Structure

```
expense-tracker/
├── src/
│   ├── components/
│   │   └── layout/
│   │       └── Header.jsx
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── AddExpense.jsx
│   │   ├── ExpenseList.jsx
│   │   ├── Settings.jsx
│   │   └── Debug.jsx
│   ├── services/
│   │   └── googleSheets.js
│   ├── utils/
│   │   └── helpers.js
│   ├── App.jsx
│   └── main.jsx
├── public/
└── dist/ (generated)
```

## 🎯 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍💻 Author

**Oscar** - [GitHub Profile](https://github.com/oscar)

---

⭐ **If you found this project helpful, please give it a star!** ⭐
