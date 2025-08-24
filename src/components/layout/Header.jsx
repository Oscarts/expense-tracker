import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import expenseService from '../../services/expenseService'
import googleSheetsService from '../../services/googleSheets'

const Header = () => {
  const location = useLocation()
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState(null)
  const [showMoreMenu, setShowMoreMenu] = useState(false)

  useEffect(() => {
    // Check sync status on component mount
    const checkSyncStatus = async () => {
      try {
        await expenseService.initialize()
        const status = await expenseService.getSyncStatus()
        setSyncStatus(status)
      } catch (error) {
        console.error('Error checking sync status:', error)
        setSyncStatus({ status: 'error' })
      }
    }
    
    checkSyncStatus()
    
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (showMoreMenu && !event.target.closest('.relative')) {
        setShowMoreMenu(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMoreMenu])

  const isActive = (path) => location.pathname === path

  const handleSync = async () => {
    try {
      setIsSyncing(true)
      
      // Initialize expense service
      await expenseService.initialize()
      
      // Check if user is authenticated, if not, trigger authentication
      const status = await expenseService.getSyncStatus()
      
      if (!status.userAuthenticated) {
        // User needs to authenticate - trigger direct authentication
        console.log('User not authenticated, triggering Google login...')
        await handleAuthentication()
      } else {
        // User is authenticated, refresh data from Google Sheets
        console.log('Refreshing data from Google Sheets...')
        await expenseService.getExpenses() // This will load fresh data from Google Sheets
        alert('Data refreshed from Google Sheets!')
        
        // Update sync status
        const newStatus = await expenseService.getSyncStatus()
        setSyncStatus(newStatus)
      }
      
    } catch (error) {
      console.error('Sync operation failed:', error)
      alert(`Sync failed: ${error.message}`)
    } finally {
      setIsSyncing(false)
    }
  }

  const handleAuthentication = async () => {
    try {
      setIsSyncing(true)
      
      // Initialize services
      await expenseService.initialize()
      await googleSheetsService.initialize()
      
      // Trigger Google authentication directly
      console.log('Starting Google authentication...')
      await googleSheetsService.authenticate()
      
      // Update sync status after authentication
      const newStatus = await expenseService.getSyncStatus()
      setSyncStatus(newStatus)
      
      if (newStatus.userAuthenticated) {
        alert('✅ Successfully signed in with Google! Your expenses will now sync to Google Sheets.')
      } else {
        alert('⚠️ Authentication completed, but sync status is unclear. Please try adding an expense.')
      }
      
    } catch (error) {
      console.error('Authentication failed:', error)
      
      // More specific error messages
      if (error.message.includes('popup') || error.message.includes('blocked')) {
        alert('❌ Sign in was blocked. Please enable popups for this site and try again.')
      } else if (error.message.includes('cancelled') || error.message.includes('closed')) {
        alert('⚠️ Sign in was cancelled. You can try again anytime.')
      } else {
        alert(`❌ Sign in failed: ${error.message}`)
      }
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <>
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
              
              {/* More Menu Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1 ${
                    isActive('/debug') || isActive('/test') 
                      ? 'bg-primary-100 text-primary-700' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span>More</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Dropdown Menu */}
                {showMoreMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                      {/* Connection Status */}
                      <div className="px-4 py-2 text-sm text-gray-500 border-b">
                        <div className="font-medium">Connection Status</div>
                        <div className={`text-xs mt-1 ${
                          syncStatus?.status === 'synced' ? 'text-green-600' :
                          syncStatus?.status === 'not_authenticated' ? 'text-yellow-600' :
                          syncStatus?.status === 'no_spreadsheet' ? 'text-orange-600' :
                          syncStatus?.status === 'error' ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
                          {syncStatus?.userAuthenticated ? (
                            syncStatus?.hasSpreadsheet ? 
                              '✅ Connected & Synced' : 
                              '📊 Connected (No Sheet)'
                          ) : (
                            syncStatus?.googleSheetsAvailable ?
                              '🔑 Login Required' :
                              '📱 Local Only'
                          )}
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="px-4 py-2 border-b">
                        <button 
                          onClick={handleSync}
                          disabled={isSyncing}
                          className={`w-full text-left text-sm px-2 py-1 rounded ${
                            isSyncing 
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                              : 'hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          {isSyncing ? 'Connecting...' : 
                           syncStatus?.userAuthenticated ? '🔄 Refresh Data' : '🔗 Connect Google Sheets'}
                        </button>
                        
                        {/* Sign Out Button - only show if authenticated */}
                        {syncStatus?.userAuthenticated && (
                          <button 
                            onClick={async () => {
                              if (confirm('Are you sure you want to sign out from Google Sheets?')) {
                                await expenseService.signOut()
                                setSyncStatus({ ...syncStatus, userAuthenticated: false })
                                setShowMoreMenu(false)
                                alert('Signed out successfully')
                              }
                            }}
                            className="w-full text-left text-sm px-2 py-1 rounded hover:bg-red-50 text-red-600 mt-1"
                          >
                            🚪 Sign Out
                          </button>
                        )}
                      </div>
                      
                      {/* Debug/Test Links */}
                      <div className="px-4 py-2">
                        <div className="text-xs text-gray-500 mb-2">Development Tools</div>
                        <Link
                          to="/debug"
                          onClick={() => setShowMoreMenu(false)}
                          className={`block px-2 py-1 text-sm rounded ${
                            isActive('/debug') 
                              ? 'bg-primary-100 text-primary-700' 
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          🐛 Debug
                        </Link>
                        <Link
                          to="/test"
                          onClick={() => setShowMoreMenu(false)}
                          className={`block px-2 py-1 text-sm rounded mt-1 ${
                            isActive('/test') 
                              ? 'bg-primary-100 text-primary-700' 
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          🧪 Test
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </nav>
          </div>
          
          {/* Right side - Authentication & More Menu */}
          <div className="flex items-center space-x-3">
            {/* Authentication Status & Button */}
            <div className="flex items-center space-x-2">
              {syncStatus?.userAuthenticated ? (
                // User is signed in
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <div className={`text-xs font-medium ${
                      syncStatus?.hasSpreadsheet ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {syncStatus?.hasSpreadsheet ? '✅ Synced' : '📊 Connected'}
                    </div>
                    <div className="text-xs text-gray-500">Google Sheets</div>
                  </div>
                  <button 
                    onClick={async () => {
                      if (confirm('Are you sure you want to sign out from Google Sheets?')) {
                        await expenseService.signOut()
                        setSyncStatus({ ...syncStatus, userAuthenticated: false })
                        alert('Signed out successfully')
                      }
                    }}
                    className="px-3 py-2 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                // User is not signed in - Prominent sign in prompt
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <div className="text-sm font-medium text-amber-600">🔑 Sign In Required</div>
                    <div className="text-xs text-gray-500">Enable cloud sync</div>
                  </div>
                  <button 
                    onClick={handleAuthentication}
                    disabled={isSyncing}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      isSyncing 
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                        : 'bg-green-600 text-white hover:bg-green-700 shadow-md'
                    }`}
                  >
                    {isSyncing ? (
                      <span className="flex items-center space-x-1">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Connecting...</span>
                      </span>
                    ) : (
                      'Sign In with Google'
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* More Menu Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className={`p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors ${
                  isActive('/debug') || isActive('/test') ? 'bg-gray-100 text-gray-900' : ''
                }`}
                title="More options"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
              
              {/* Dropdown Menu */}
              {showMoreMenu && (
                <div className="absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    {/* Sync Actions */}
                    {syncStatus?.userAuthenticated && (
                      <div className="px-4 py-2 border-b">
                        <div className="text-xs text-gray-500 mb-2">Sync Actions</div>
                        <button 
                          onClick={() => {
                            handleSync()
                            setShowMoreMenu(false)
                          }}
                          disabled={isSyncing}
                          className={`w-full text-left text-sm px-2 py-1 rounded ${
                            isSyncing 
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                              : 'hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          {isSyncing ? '⏳ Refreshing...' : '🔄 Refresh Data'}
                        </button>
                      </div>
                    )}
                    
                    {/* App Info */}
                    <div className="px-4 py-2 border-b">
                      <div className="text-xs text-gray-500 mb-2">Status</div>
                      <div className="text-xs text-gray-700">
                        <div>Mode: {syncStatus?.userAuthenticated ? 'Cloud + Local' : 'Local Only'}</div>
                        <div>Expenses: {syncStatus?.totalExpenses || 0}</div>
                        {syncStatus?.userAuthenticated && (
                          <div>Sync: {syncStatus?.hasSpreadsheet ? 'Active' : 'Setup Needed'}</div>
                        )}
                      </div>
                    </div>
                    
                    {/* Debug/Test Links */}
                    <div className="px-4 py-2">
                      <div className="text-xs text-gray-500 mb-2">Development</div>
                      <Link
                        to="/debug"
                        onClick={() => setShowMoreMenu(false)}
                        className={`block px-2 py-1 text-sm rounded ${
                          isActive('/debug') 
                            ? 'bg-primary-100 text-primary-700' 
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        🐛 Debug Tools
                      </Link>
                      <Link
                        to="/test"
                        onClick={() => setShowMoreMenu(false)}
                        className={`block px-2 py-1 text-sm rounded mt-1 ${
                          isActive('/test') 
                            ? 'bg-primary-100 text-primary-700' 
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        🧪 Test Page
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      </header>
      
      {/* Workflow Helper Banner - Show when not signed in */}
      {syncStatus && !syncStatus.userAuthenticated && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-amber-800">
                    🚀 Complete Setup: Sign in with Google to sync your expenses across devices
                  </h3>
                  <p className="text-xs text-amber-700 mt-1">
                    Your expenses are currently saved locally only. Sign in to enable cloud backup and multi-device access.
                  </p>
                </div>
              </div>
              <button 
                onClick={handleAuthentication}
                disabled={isSyncing}
                className="ml-4 px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors"
              >
                {isSyncing ? 'Connecting...' : 'Sign In Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Header
