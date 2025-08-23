import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import googleSheetsService from '../../services/googleSheets'

const Header = () => {
  const location = useLocation()
  const [isSyncing, setIsSyncing] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check authentication status on component mount
    const checkAuth = () => {
      setIsAuthenticated(googleSheetsService.isUserAuthenticated() && !googleSheetsService.needsTokenRefresh())
    }
    
    checkAuth()
    
    // Check every 30 seconds for token expiry
    const interval = setInterval(checkAuth, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const isActive = (path) => location.pathname === path

  const handleSignOut = async () => {
    try {
      await googleSheetsService.signOut()
      setIsAuthenticated(false)
      alert('Successfully signed out from Google Sheets')
    } catch (error) {
      console.error('Sign out failed:', error)
      alert('Sign out failed: ' + error.message)
    }
  }

  const handleSync = async () => {
    try {
      setIsSyncing(true)
      
      // Initialize and authenticate if needed
      await googleSheetsService.ensureAuthenticated()
      setIsAuthenticated(true)
      
      // Create spreadsheet if none exists
      const spreadsheetId = import.meta.env.VITE_SPREADSHEET_ID
      if (!spreadsheetId) {
        await googleSheetsService.createExpenseSpreadsheet()
        alert('New spreadsheet created! Check the debug panel for the ID to add to your .env file.')
      }
      
      alert('Successfully synced to Google Sheets!')
    } catch (error) {
      console.error('Sync failed:', error)
      alert(`Sync failed: ${error.message}`)
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-bold text-gray-900">Expense Tracker</h1>
            <nav className="hidden md:flex space-x-6">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/') 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/add"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/add') 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Add Expense
              </Link>
              <Link
                to="/expenses"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/expenses') 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                View All
              </Link>
              <Link
                to="/settings"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/settings') 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Settings
              </Link>
              <Link
                to="/debug"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/debug') 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Debug
              </Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            {isAuthenticated && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-green-600 font-medium">✓ Connected</span>
                <button 
                  onClick={handleSignOut}
                  className="px-3 py-1 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  Sign Out
                </button>
              </div>
            )}
            <button 
              onClick={handleSync}
              disabled={isSyncing}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                isSyncing 
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              {isSyncing ? 'Syncing...' : isAuthenticated ? 'Sync to Sheets' : 'Connect to Sheets'}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
