// Helper functions for the expense tracker app

import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'

// Format currency
export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

// Format date for display
export const formatDate = (date, formatString = 'MMM dd, yyyy') => {
  if (typeof date === 'string') {
    date = parseISO(date)
  }
  return format(date, formatString)
}

// Get current month date range
export const getCurrentMonthRange = () => {
  const now = new Date()
  return {
    start: startOfMonth(now),
    end: endOfMonth(now)
  }
}

// Filter expenses by date range
export const filterExpensesByDateRange = (expenses, startDate, endDate) => {
  if (!startDate || !endDate) return expenses
  
  const interval = {
    start: typeof startDate === 'string' ? parseISO(startDate) : startDate,
    end: typeof endDate === 'string' ? parseISO(endDate) : endDate
  }
  
  return expenses.filter(expense => {
    const expenseDate = typeof expense.date === 'string' ? parseISO(expense.date) : expense.date
    return isWithinInterval(expenseDate, interval)
  })
}

// Calculate total by category
export const calculateCategoryTotals = (expenses) => {
  const totals = {}
  
  expenses.forEach(expense => {
    const category = expense.category || 'Other'
    totals[category] = (totals[category] || 0) + expense.amount
  })
  
  return totals
}

// Get expenses for current month
export const getCurrentMonthExpenses = (expenses) => {
  const { start, end } = getCurrentMonthRange()
  return filterExpensesByDateRange(expenses, start, end)
}

// Calculate category percentages
export const calculateCategoryPercentages = (expenses) => {
  const totals = calculateCategoryTotals(expenses)
  const grandTotal = Object.values(totals).reduce((sum, amount) => sum + amount, 0)
  
  if (grandTotal === 0) return {}
  
  const percentages = {}
  Object.entries(totals).forEach(([category, amount]) => {
    percentages[category] = {
      amount,
      percentage: (amount / grandTotal) * 100
    }
  })
  
  return percentages
}

// Validate expense data
export const validateExpense = (expense) => {
  const errors = {}
  
  if (!expense.amount || expense.amount <= 0) {
    errors.amount = 'Amount must be greater than 0'
  }
  
  if (!expense.category) {
    errors.category = 'Category is required'
  }
  
  if (!expense.date) {
    errors.date = 'Date is required'
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Generate expense summary
export const generateExpenseSummary = (expenses) => {
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const categoryTotals = calculateCategoryTotals(expenses)
  const topCategory = Object.entries(categoryTotals)
    .sort(([,a], [,b]) => b - a)[0]
  
  return {
    total,
    count: expenses.length,
    averageExpense: expenses.length > 0 ? total / expenses.length : 0,
    topCategory: topCategory ? topCategory[0] : null,
    topCategoryAmount: topCategory ? topCategory[1] : 0,
    categoryBreakdown: categoryTotals
  }
}

// Search expenses
export const searchExpenses = (expenses, searchTerm) => {
  if (!searchTerm) return expenses
  
  const term = searchTerm.toLowerCase()
  return expenses.filter(expense => 
    expense.description?.toLowerCase().includes(term) ||
    expense.category?.toLowerCase().includes(term) ||
    expense.paymentMethod?.toLowerCase().includes(term)
  )
}

// Sort expenses
export const sortExpenses = (expenses, sortBy = 'date', order = 'desc') => {
  return [...expenses].sort((a, b) => {
    let aVal = a[sortBy]
    let bVal = b[sortBy]
    
    // Handle date sorting
    if (sortBy === 'date') {
      aVal = new Date(aVal)
      bVal = new Date(bVal)
    }
    
    // Handle string sorting
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase()
      bVal = bVal.toLowerCase()
    }
    
    if (order === 'asc') {
      return aVal > bVal ? 1 : -1
    } else {
      return aVal < bVal ? 1 : -1
    }
  })
}

// Export expenses to CSV
export const exportToCSV = (expenses, filename = 'expenses.csv') => {
  const headers = ['Date', 'Amount', 'Category', 'Description', 'Payment Method']
  const csvContent = [
    headers.join(','),
    ...expenses.map(expense => [
      expense.date,
      expense.amount,
      expense.category,
      `"${expense.description || ''}"`, // Quote description to handle commas
      expense.paymentMethod || ''
    ].join(','))
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// Default expense categories
export const DEFAULT_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Travel',
  'Other'
]

// Default payment methods
export const DEFAULT_PAYMENT_METHODS = [
  'Cash',
  'Credit Card',
  'Debit Card',
  'Bank Transfer',
  'Digital Wallet'
]

// Color scheme for categories (for charts)
export const CATEGORY_COLORS = {
  'Food & Dining': '#FF6B6B',
  'Transportation': '#4ECDC4',
  'Shopping': '#45B7D1',
  'Entertainment': '#96CEB4',
  'Bills & Utilities': '#FECA57',
  'Healthcare': '#FF9FF3',
  'Travel': '#54A0FF',
  'Other': '#A4B0BE'
}
