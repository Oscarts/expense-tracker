// Unified expense service that combines localStorage and Google Sheets Service Account
import localStorageService from './localStorage'
import googleSheetsServiceAccount from './googleSheetsServiceAccount'

class ExpenseService {
  constructor() {
    this.useGoogleSheets = false
    this.autoSync = false
    this.useServiceAccount = false
  }

  // Initialize service
  async initialize() {
    try {
      // Check if Service Account is configured (preferred)
      const serviceAccountEmail = import.meta.env.VITE_SERVICE_ACCOUNT_EMAIL
      const serviceAccountKey = import.meta.env.VITE_SERVICE_ACCOUNT_PRIVATE_KEY
      
      if (serviceAccountEmail && serviceAccountKey) {
        // Try to initialize Google Sheets with Service Account
        try {
          await googleSheetsServiceAccount.initialize()
          this.useGoogleSheets = true
          this.useServiceAccount = true
          this.autoSync = true // Enable auto-sync for service account
          console.log('Google Sheets Service Account integration available')
        } catch (error) {
          console.warn('Service Account initialization failed:', error)
          this.useServiceAccount = false
        }
      } else {
        console.log('Service Account not configured, using localStorage only')
        console.log('💡 For multi-user access, configure Service Account credentials')
      }
      
      // Load user settings
      const settings = localStorageService.getSettings()
      if (!this.useServiceAccount) {
        this.autoSync = settings.autoSync || false
      }
      
    } catch (error) {
      console.error('Error initializing expense service:', error)
      this.useGoogleSheets = false
    }
  }

    // Add expense - Primary storage based on configuration
  async addExpense(expense) {
    try {
      let savedExpense

      if (this.useServiceAccount && this.useGoogleSheets) {
        // Service Account: Use Google Sheets as primary database
        console.log('Adding expense to Google Sheets (Service Account):', expense)
        
        try {
          savedExpense = await googleSheetsServiceAccount.addExpense(expense)
          
          // Also save to localStorage as backup
          localStorageService.addExpense({...savedExpense, synced: true})
          
          console.log('Expense saved to Google Sheets and localStorage:', savedExpense)
          
        } catch (error) {
          console.warn('Failed to save to Google Sheets, saving to localStorage only:', error)
          savedExpense = localStorageService.addExpense(expense)
        }
      } else {
        // No service account: Use localStorage as primary
        savedExpense = localStorageService.addExpense(expense)
        console.log('Expense saved to localStorage:', savedExpense)

        // Try to sync to Google Sheets if enabled and available (user OAuth)
        if (this.autoSync && this.useGoogleSheets) {
          try {
            await this.syncToGoogleSheets([savedExpense])
          } catch (error) {
            console.warn('Auto-sync to Google Sheets failed:', error)
            // Don't throw error - expense is still saved locally
          }
        }
      }

      return savedExpense
      
    } catch (error) {
      console.error('Error adding expense:', error)
      throw error
    }
  }

  // Get all expenses - Source depends on configuration
  async getExpenses() {
    try {
      if (this.useServiceAccount && this.useGoogleSheets) {
        // Service Account: Load from Google Sheets as primary source
        console.log('Loading expenses from Google Sheets (Service Account)...')
        
        try {
          const expenses = await googleSheetsServiceAccount.getExpenses()
          
          // Also update localStorage with latest data
          localStorage.setItem('expenseTracker_expenses', JSON.stringify(expenses))
          
          console.log(`Loaded ${expenses.length} expenses from Google Sheets`)
          return expenses
          
        } catch (error) {
          console.warn('Failed to load from Google Sheets, using localStorage:', error)
          return localStorageService.getExpenses()
        }
      } else {
        // No service account: Load from localStorage
        return localStorageService.getExpenses()
      }
      
    } catch (error) {
      console.error('Error getting expenses:', error)
      return localStorageService.getExpenses() // Fallback to localStorage
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
      let status = 'local_only'
      
      if (this.useServiceAccount && this.useGoogleSheets) {
        // Service Account mode: All expenses automatically synced
        const serviceStatus = googleSheetsServiceAccount.getSyncStatus()
        status = serviceStatus === 'connected' ? 'synced' : serviceStatus
      } else {
        // localStorage mode: Check if sync is available and pending
        const unsyncedExpenses = localStorageService.getUnsyncedExpenses()
        
        if (this.useGoogleSheets) {
          status = unsyncedExpenses.length === 0 ? 'synced' : 'pending'
        }
      }
      
      return {
        status, // 'synced', 'pending', 'local_only', 'error', 'not_configured'
        totalExpenses: allExpenses.length,
        syncedExpenses: this.useServiceAccount ? allExpenses.length : allExpenses.length - (localStorageService.getUnsyncedExpenses()?.length || 0),
        unsyncedExpenses: this.useServiceAccount ? 0 : (localStorageService.getUnsyncedExpenses()?.length || 0),
        googleSheetsAvailable: this.useGoogleSheets,
        serviceAccountEnabled: this.useServiceAccount,
        autoSyncEnabled: this.autoSync,
        lastSync: localStorageService.getSettings().lastSync || null
      }
      
    } catch (error) {
      console.error('Error getting sync status:', error)
      return {
        status: 'error',
        totalExpenses: 0,
        syncedExpenses: 0,
        unsyncedExpenses: 0,
        googleSheetsAvailable: false,
        serviceAccountEnabled: false,
        autoSyncEnabled: false,
        lastSync: null
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
}

// Create singleton instance
const expenseService = new ExpenseService()

export default expenseService
