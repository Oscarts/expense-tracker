// Local storage service for expenses
class LocalStorageService {
  constructor() {
    this.storageKey = 'expenseTracker_expenses'
    this.settingsKey = 'expenseTracker_settings'
  }

  // Get all expenses from localStorage
  getExpenses() {
    try {
      const expenses = localStorage.getItem(this.storageKey)
      return expenses ? JSON.parse(expenses) : []
    } catch (error) {
      console.error('Error getting expenses from localStorage:', error)
      return []
    }
  }

  // Add expense to localStorage
  addExpense(expense) {
    try {
      const expenses = this.getExpenses()
      const newExpense = {
        ...expense,
        id: Date.now(), // Simple ID generation
        createdAt: new Date().toISOString(),
        synced: false // Track sync status
      }
      expenses.push(newExpense)
      localStorage.setItem(this.storageKey, JSON.stringify(expenses))
      return newExpense
    } catch (error) {
      console.error('Error adding expense to localStorage:', error)
      throw error
    }
  }

  // Update expense in localStorage
  updateExpense(id, updatedExpense) {
    try {
      const expenses = this.getExpenses()
      const index = expenses.findIndex(exp => exp.id === id)
      if (index !== -1) {
        expenses[index] = { ...expenses[index], ...updatedExpense, synced: false }
        localStorage.setItem(this.storageKey, JSON.stringify(expenses))
        return expenses[index]
      }
      throw new Error('Expense not found')
    } catch (error) {
      console.error('Error updating expense in localStorage:', error)
      throw error
    }
  }

  // Delete expense from localStorage
  deleteExpense(id) {
    try {
      const expenses = this.getExpenses()
      const filteredExpenses = expenses.filter(exp => exp.id !== id)
      localStorage.setItem(this.storageKey, JSON.stringify(filteredExpenses))
      return true
    } catch (error) {
      console.error('Error deleting expense from localStorage:', error)
      throw error
    }
  }

  // Mark expenses as synced
  markAsSynced(expenseIds) {
    try {
      const expenses = this.getExpenses()
      expenses.forEach(expense => {
        if (expenseIds.includes(expense.id)) {
          expense.synced = true
        }
      })
      localStorage.setItem(this.storageKey, JSON.stringify(expenses))
    } catch (error) {
      console.error('Error marking expenses as synced:', error)
    }
  }

  // Get unsynced expenses
  getUnsyncedExpenses() {
    return this.getExpenses().filter(expense => !expense.synced)
  }

  // Clear all expenses
  clearExpenses() {
    try {
      localStorage.removeItem(this.storageKey)
    } catch (error) {
      console.error('Error clearing expenses:', error)
    }
  }

  // Get app settings
  getSettings() {
    try {
      const settings = localStorage.getItem(this.settingsKey)
      return settings ? JSON.parse(settings) : {
        autoSync: false,
        defaultCurrency: 'USD',
        categories: [
          'Food & Dining',
          'Transportation',
          'Shopping',
          'Entertainment',
          'Bills & Utilities',
          'Healthcare',
          'Travel',
          'Other'
        ]
      }
    } catch (error) {
      console.error('Error getting settings:', error)
      return {}
    }
  }

  // Save app settings
  saveSettings(settings) {
    try {
      localStorage.setItem(this.settingsKey, JSON.stringify(settings))
    } catch (error) {
      console.error('Error saving settings:', error)
    }
  }

  // Get total expenses
  getTotalExpenses() {
    const expenses = this.getExpenses()
    return expenses.reduce((total, expense) => total + (expense.amount || 0), 0)
  }

  // Get expenses by date range
  getExpensesByDateRange(startDate, endDate) {
    const expenses = this.getExpenses()
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date)
      return expenseDate >= startDate && expenseDate <= endDate
    })
  }

  // Get expenses by category
  getExpensesByCategory() {
    const expenses = this.getExpenses()
    const categoryTotals = {}
    
    expenses.forEach(expense => {
      const category = expense.category || 'Other'
      categoryTotals[category] = (categoryTotals[category] || 0) + expense.amount
    })
    
    return categoryTotals
  }
}

// Create singleton instance
const localStorageService = new LocalStorageService()

export default localStorageService
