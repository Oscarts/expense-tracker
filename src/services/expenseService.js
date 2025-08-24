// Unified expense service - Google Sheets primary with localStorage backup
import localStorageService from './localStorage'
import googleSheetsService from './googleSheets'

class ExpenseService {
  constructor() {
    this.useGoogleSheets = false
    this.autoSync = true // Enable auto-sync by default
  }

  // Initialize service
  async initialize() {
    try {
      // Check if Google Sheets credentials are configured
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
      const apiKey = import.meta.env.VITE_GOOGLE_API_KEY
      
      if (clientId && apiKey && !clientId.includes('your_') && !apiKey.includes('your_')) {
        // Try to initialize Google Sheets
        await googleSheetsService.initialize()
        this.useGoogleSheets = true
        console.log('Google Sheets integration available')
      } else {
        console.log('Google Sheets not configured, using localStorage only')
        console.log('💡 Configure Google API credentials for cloud sync')
      }
      
    } catch (error) {
      console.error('Error initializing expense service:', error)
      this.useGoogleSheets = false
    }
  }

    // Add expense - Google Sheets primary, localStorage backup
  async addExpense(expense) {
    try {
      let savedExpense

      if (this.useGoogleSheets) {
        // Try Google Sheets first (primary storage)
        console.log('Adding expense to Google Sheets:', expense)
        
        try {
          // Ensure user is authenticated
          if (!googleSheetsService.isUserAuthenticated()) {
            console.log('User not authenticated, requesting authentication...')
            await googleSheetsService.authenticate()
          }
          
          // Check if we have a spreadsheet configured
          console.log('=== ENVIRONMENT VARIABLES DEBUG ===')
          console.log('All import.meta.env:', import.meta.env)
          console.log('VITE_SPREADSHEET_ID from env:', import.meta.env.VITE_SPREADSHEET_ID)
          console.log('Type of VITE_SPREADSHEET_ID:', typeof import.meta.env.VITE_SPREADSHEET_ID)
          console.log('Service spreadsheet ID:', googleSheetsService.getSpreadsheetId())
          console.log('===================================')
          
          let spreadsheetId = import.meta.env.VITE_SPREADSHEET_ID || googleSheetsService.getSpreadsheetId()
          
          console.log('Environment spreadsheet ID:', import.meta.env.VITE_SPREADSHEET_ID)
          console.log('Service spreadsheet ID:', googleSheetsService.getSpreadsheetId())
          console.log('Final spreadsheet ID to use:', spreadsheetId)
          
          if (!spreadsheetId) {
            // No spreadsheet configured, create a new one ONLY for first-time setup
            console.log('No spreadsheet found, creating new one for first-time setup...')
            spreadsheetId = await googleSheetsService.createExpenseSpreadsheet()
            console.log('🎉 Created your permanent expense spreadsheet:', spreadsheetId)
            console.log('💡 Copy this ID to your .env file: VITE_SPREADSHEET_ID=' + spreadsheetId)
            
            // Set it for this session
            googleSheetsService.setSpreadsheetId(spreadsheetId)
          } else {
            // Use the configured spreadsheet (preserves history)
            console.log('Using your permanent expense spreadsheet:', spreadsheetId)
            googleSheetsService.setSpreadsheetId(spreadsheetId)
          }
          
          // Add expense to the spreadsheet
          try {
            savedExpense = await googleSheetsService.addExpense(expense)
            
            // Also save to localStorage as backup
            localStorageService.addExpense({...savedExpense, synced: true})
            
            console.log('✅ Expense saved to your permanent Google Sheet and localStorage:', savedExpense)
            
          } catch (spreadsheetError) {
            console.warn('❌ Error with configured spreadsheet:', spreadsheetError.message)
            console.warn('🔍 Debugging info:')
            console.warn('   - Spreadsheet ID:', spreadsheetId)
            console.warn('   - User authenticated:', googleSheetsService.isUserAuthenticated())
            console.warn('   - Error details:', spreadsheetError)
            
            if (spreadsheetError.message.includes('Permission denied') ||
                spreadsheetError.message.includes('edit access')) {
              
              throw new Error(`❌ Permission denied to your spreadsheet (${spreadsheetId}). 
              
🔧 Please check:
1. Are you logged in with the correct Google account?
2. Does that account have EDIT access to the spreadsheet?
3. Try opening the spreadsheet directly: https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit
4. If you can't access it, ask the owner to give you edit permission.

� To fix: Go to Settings page and re-authenticate with the correct Google account.`)
              
            } else if (spreadsheetError.message.includes('Spreadsheet not found')) {
              
              throw new Error(`❌ Spreadsheet not found (${spreadsheetId}). 
              
🔧 Please check:
1. Is the spreadsheet ID correct in your .env file?
2. Does the spreadsheet exist at: https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit
3. Are you logged in with the correct Google account?

🔄 To fix: Verify the spreadsheet URL and re-authenticate if needed.`)
              
            } else {
              throw spreadsheetError // Re-throw if it's a different error
            }
          }
          
        } catch (error) {
          console.warn('❌ Failed to save to Google Sheets, saving to localStorage only:', error)
          savedExpense = localStorageService.addExpense(expense)
          
          // Provide helpful error message for permission issues
          if (error.message.includes('Permission denied') || error.message.includes('access')) {
            throw new Error(`Permission denied to spreadsheet. Please:
            1. Make sure you're logged in with the correct Google account
            2. Check that the spreadsheet ID in your .env file is correct
            3. Ensure you have edit access to that spreadsheet
            4. If using a shared account, make sure everyone uses the SAME Google login`)
          } else {
            throw error
          }
        }
      } else {
        // No Google Sheets: Use localStorage only
        savedExpense = localStorageService.addExpense(expense)
        console.log('Expense saved to localStorage:', savedExpense)
      }

      return savedExpense
      
    } catch (error) {
      console.error('Error adding expense:', error)
      throw error
    }
  }

  // Get all expenses - Google Sheets primary, localStorage fallback
  async getExpenses() {
    try {
      if (this.useGoogleSheets && googleSheetsService.isUserAuthenticated()) {
        // Load from Google Sheets as primary source
        console.log('Loading expenses from Google Sheets...')
        
        try {
          // Ensure we have a spreadsheet
          const spreadsheetId = import.meta.env.VITE_SPREADSHEET_ID || googleSheetsService.getSpreadsheetId()
          if (spreadsheetId) {
            googleSheetsService.setSpreadsheetId(spreadsheetId)
            const expenses = await googleSheetsService.getExpenses()
            
            // Update localStorage with latest data
            localStorage.setItem('expenseTracker_expenses', JSON.stringify(expenses))
            
            console.log(`Loaded ${expenses.length} expenses from Google Sheets`)
            return expenses
          }
          
        } catch (error) {
          console.warn('Failed to load from Google Sheets, using localStorage:', error)
        }
      }
      
      // Fallback to localStorage
      return localStorageService.getExpenses()
      
    } catch (error) {
      console.error('Error getting expenses:', error)
      return localStorageService.getExpenses() // Final fallback
    }
  }

  // Update expense
  async updateExpense(id, updatedExpense) {
    try {
      const expense = localStorageService.updateExpense(id, updatedExpense)
      
      // Try to sync if auto-sync is enabled
      if (this.autoSync && this.useGoogleSheets) {
        try {
          await this.syncToGoogleSheets([expense])
        } catch (error) {
          console.warn('Auto-sync update to Google Sheets failed:', error)
        }
      }
      
      return expense
    } catch (error) {
      console.error('Error updating expense:', error)
      throw error
    }
  }

  // Delete expense
  async deleteExpense(id) {
    try {
      const result = localStorageService.deleteExpense(id)
      
      // Note: Google Sheets sync for deletes would need more complex logic
      // For now, we just delete locally
      
      return result
    } catch (error) {
      console.error('Error deleting expense:', error)
      throw error
    }
  }

  // Manual sync to Google Sheets
  async syncToGoogleSheets(expenses = null) {
    try {
      if (!this.useGoogleSheets) {
        throw new Error('Google Sheets not available')
      }

      // Use service account if available, otherwise use user OAuth
      if (this.useServiceAccount) {
        return await this.syncWithServiceAccount(expenses)
      } else {
        return await this.syncWithUserAuth(expenses)
      }
    } catch (error) {
      console.error('Error syncing to Google Sheets:', error)
      throw error
    }
  }

  // Sync using service account (automatic, no user auth needed)
  async syncWithServiceAccount(expenses = null) {
    try {
      // If no specific expenses provided, sync all unsynced expenses
      const expensesToSync = expenses || localStorageService.getUnsyncedExpenses()
      
      if (expensesToSync.length === 0) {
        console.log('No expenses to sync')
        return { success: true, synced: 0 }
      }

      // Sync each expense
      let syncedCount = 0
      for (const expense of expensesToSync) {
        try {
          await googleSheetsServiceAccount.addExpense(expense)
          // Mark as synced in localStorage
          localStorageService.updateExpense(expense.id, { synced: true })
          syncedCount++
        } catch (error) {
          console.error(`Failed to sync expense ${expense.id}:`, error)
        }
      }

      console.log(`Successfully synced ${syncedCount}/${expensesToSync.length} expenses via Service Account`)
      return { success: true, synced: syncedCount, total: expensesToSync.length }
    } catch (error) {
      console.error('Service Account sync failed:', error)
      throw error
    }
  }

  // Sync using user authentication (fallback method)
  async syncWithUserAuth(expenses = null) {
    try {
      // Import the old service for fallback
      const { default: googleSheetsService } = await import('./googleSheets')
      
      // Ensure authentication
      await googleSheetsService.ensureAuthenticated()
      
      // If no specific expenses provided, sync all unsynced expenses
      const expensesToSync = expenses || localStorageService.getUnsyncedExpenses()
      
      if (expensesToSync.length === 0) {
        console.log('No expenses to sync')
        return { success: true, synced: 0 }
      }

      // Ensure spreadsheet exists
      let spreadsheetId = import.meta.env.VITE_SPREADSHEET_ID || googleSheetsService.getSpreadsheetId()
      if (!spreadsheetId) {
        spreadsheetId = await googleSheetsService.createExpenseSpreadsheet()
        console.log('Created new spreadsheet:', spreadsheetId)
      } else {
        googleSheetsService.setSpreadsheetId(spreadsheetId)
      }

      // Sync each expense
      const syncedIds = []
      for (const expense of expensesToSync) {
        try {
          await googleSheetsService.addExpense({
            date: expense.date,
            amount: expense.amount,
            category: expense.category,
            description: expense.description,
            paymentMethod: expense.paymentMethod || ''
          })
          syncedIds.push(expense.id)
          console.log('Synced expense:', expense.id)
        } catch (error) {
          console.error('Failed to sync expense:', expense.id, error)
        }
      }

      // Mark synced expenses
      if (syncedIds.length > 0) {
        localStorageService.markAsSynced(syncedIds)
      }

      return {
        success: true,
        synced: syncedIds.length,
        failed: expensesToSync.length - syncedIds.length
      }

    } catch (error) {
      console.error('Error syncing to Google Sheets:', error)
      throw error
    }
  }

  // Get sync status
  async getSyncStatus() {
    try {
      const allExpenses = localStorageService.getExpenses()
      let status = 'not_authenticated'
      
      if (this.useGoogleSheets) {
        if (googleSheetsService.isUserAuthenticated()) {
          const spreadsheetId = import.meta.env.VITE_SPREADSHEET_ID || googleSheetsService.getSpreadsheetId()
          status = spreadsheetId ? 'synced' : 'no_spreadsheet'
        } else {
          status = 'not_authenticated'
        }
      } else {
        status = 'not_configured'
      }
      
      return {
        status, // 'synced', 'not_authenticated', 'no_spreadsheet', 'not_configured', 'error'
        totalExpenses: allExpenses.length,
        googleSheetsAvailable: this.useGoogleSheets,
        userAuthenticated: googleSheetsService.isUserAuthenticated(),
        hasSpreadsheet: !!(import.meta.env.VITE_SPREADSHEET_ID || googleSheetsService.getSpreadsheetId()),
        autoSyncEnabled: this.autoSync
      }
      
    } catch (error) {
      console.error('Error getting sync status:', error)
      return {
        status: 'error',
        totalExpenses: 0,
        googleSheetsAvailable: false,
        userAuthenticated: false,
        hasSpreadsheet: false,
        autoSyncEnabled: false
      }
    }
  }

  // Toggle auto-sync
  setAutoSync(enabled) {
    this.autoSync = enabled
    const settings = localStorageService.getSettings()
    settings.autoSync = enabled
    localStorageService.saveSettings(settings)
  }

  // Get statistics
  getStatistics() {
    const expenses = localStorageService.getExpenses()
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    
    const monthlyExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date)
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear
    })

    const categoryTotals = localStorageService.getExpensesByCategory()
    const totalAmount = localStorageService.getTotalExpenses()
    const monthlyAmount = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0)

    return {
      totalExpenses: expenses.length,
      totalAmount,
      monthlyExpenses: monthlyExpenses.length,
      monthlyAmount,
      categoryTotals,
      recentExpenses: expenses.slice(-5).reverse()
    }
  }

  // Clear all data
  clearAllData() {
    localStorageService.clearExpenses()
  }

  // Sign out from Google Sheets
  signOut() {
    if (this.useGoogleSheets) {
      return googleSheetsService.signOut()
    }
    return true
  }

  // Get authentication methods
  getAuthMethods() {
    return {
      signOut: () => this.signOut(),
      authenticate: () => googleSheetsService.authenticate(),
      isAuthenticated: () => googleSheetsService.isUserAuthenticated(),
      getStatus: () => googleSheetsService.getStatus()
    }
  }
}

// Create singleton instance
const expenseService = new ExpenseService()

export default expenseService
