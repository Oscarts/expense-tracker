import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import expenseService from '../../services/expenseService'

const Header = () => {
  const location = useLocation()
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState(null)

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
  }, [])

  const isActive = (path) => location.pathname === path

  const handleSync = async () => {
    try {
      setIsSyncing(true)
      
      // Initialize expense service
      await expenseService.initialize()
      
      // Try to sync to Google Sheets
      const result = await expenseService.syncToGoogleSheets()
      
      // Update sync status
      const status = await expenseService.getSyncStatus()
      setSyncStatus(status)
      
      if (result.synced > 0) {
        alert(`Successfully synced ${result.synced} expenses to Google Sheets!`)
      } else {
        alert('All expenses are already synced!')
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
              <Link
                to="/test"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/test') 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Test
              </Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-medium ${
                syncStatus?.status === 'synced' ? 'text-green-600' :
                syncStatus?.status === 'connected' ? 'text-green-600' :
                syncStatus?.status === 'pending' ? 'text-yellow-600' :
                syncStatus?.status === 'error' ? 'text-red-600' :
                'text-gray-600'
              }`}>
                {syncStatus?.serviceAccountEnabled ? (
                  // Service Account Mode
                  syncStatus?.status === 'connected' || syncStatus?.status === 'synced' ? 
                    '🤖 Multi-User (Live)' : 
                  syncStatus?.status === 'initializing' ? 
                    '🤖 Connecting...' :
                  syncStatus?.status === 'not_configured' ?
                    '🤖 Setup Required' :
                    '🤖 Connection Error'
                ) : (
                  // localStorage Mode  
                  syncStatus?.status === 'synced' ? '✓ Synced' :
                  syncStatus?.status === 'pending' ? '⏳ Sync Pending' :
                  syncStatus?.status === 'error' ? '✗ Sync Error' :
                  '○ Local Only'
                )}
              </span>
            </div>
            {!syncStatus?.serviceAccountEnabled && (
              <button 
                onClick={handleSync}
                disabled={isSyncing || !syncStatus?.googleSheetsAvailable}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  isSyncing || !syncStatus?.googleSheetsAvailable
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                {isSyncing ? 'Syncing...' : 'Sync to Sheets'}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
