// Unified expense service that combines localStorage and Google Sheets
import localStorageService from './localStorage'
import googleSheetsService from './googleSheets'

class ExpenseService {
  constructor() {
    this.useGoogleSheets = false
    this.autoSync = false
  }

  // Initialize service
  async initialize() {
    try {
      // Check if Google Sheets is available and configured
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
      const apiKey = import.meta.env.VITE_GOOGLE_API_KEY
      
      if (clientId && apiKey && !clientId.includes('your_') && !apiKey.includes('your_')) {
        // Try to initialize Google Sheets
        await googleSheetsService.initialize()
        this.useGoogleSheets = true
        console.log('Google Sheets integration available')
      } else {
        console.log('Google Sheets not configured, using localStorage only')
      }
      
      // Load user settings
      const settings = localStorageService.getSettings()
      this.autoSync = settings.autoSync || false
      
    } catch (error) {
      console.error('Error initializing expense service:', error)
      this.useGoogleSheets = false
    }
  }

  // Add expense (always to localStorage, optionally to Google Sheets)
  async addExpense(expense) {
    try {
      // Always save to localStorage first
      const savedExpense = localStorageService.addExpense(expense)
      console.log('Expense saved to localStorage:', savedExpense)

      // Try to sync to Google Sheets if enabled and available
      if (this.autoSync && this.useGoogleSheets) {
        try {
          await this.syncToGoogleSheets([savedExpense])
        } catch (error) {
          console.warn('Auto-sync to Google Sheets failed:', error)
          // Don't throw error - expense is still saved locally
        }
      }

      return savedExpense
    } catch (error) {
      console.error('Error adding expense:', error)
      throw error
    }
  }

  // Get all expenses (from localStorage)
  getExpenses() {
    return localStorageService.getExpenses()
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
  getSyncStatus() {
    const allExpenses = localStorageService.getExpenses()
    const unsyncedExpenses = localStorageService.getUnsyncedExpenses()
    
    return {
      totalExpenses: allExpenses.length,
      syncedExpenses: allExpenses.length - unsyncedExpenses.length,
      unsyncedExpenses: unsyncedExpenses.length,
      googleSheetsAvailable: this.useGoogleSheets,
      autoSyncEnabled: this.autoSync
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
