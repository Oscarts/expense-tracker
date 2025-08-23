import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import googleSheetsService from '../services/googleSheets'
import { formatCurrency, formatDate } from '../utils/helpers'

const Dashboard = () => {
  console.log('Dashboard component is rendering...')
  
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Load expenses from Google Sheets
  const loadExpenses = async () => {
    try {
      setLoading(true)
      setError('')
      console.log('Dashboard: Starting loadExpenses...')
      
      // Check if environment variables are configured
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
      const apiKey = import.meta.env.VITE_GOOGLE_API_KEY
      
      if (!clientId || !apiKey || clientId.includes('your_') || apiKey.includes('your_')) {
        console.log('Dashboard: Google API credentials not configured')
        setError('Google Sheets API not configured. Please set up your API credentials in environment variables.')
        setExpenses([])
        return
      }
      
      // Check if Google API is available
      if (typeof window.gapi === 'undefined') {
        console.log('Dashboard: Google API not available, showing empty state')
        setExpenses([])
        return
      }
      
      // Initialize if needed
      if (!googleSheetsService.isReady()) {
        console.log('Dashboard: Initializing Google Sheets service...')
        await googleSheetsService.initialize()
        if (!googleSheetsService.isUserAuthenticated()) {
          console.log('Dashboard: User not authenticated, showing empty state')
          setExpenses([])
          return
        }
      }
      
      // Check if we have a spreadsheet
      const spreadsheetId = import.meta.env.VITE_SPREADSHEET_ID || googleSheetsService.getSpreadsheetId()
      if (!spreadsheetId) {
        console.log('Dashboard: No spreadsheet ID, showing empty state')
        // No spreadsheet yet, show empty state
        setExpenses([])
        return
      }
      
      googleSheetsService.setSpreadsheetId(spreadsheetId)
      
      // Load expenses
      console.log('Dashboard: Loading expenses from Google Sheets...')
      const expensesData = await googleSheetsService.getExpenses()
      console.log('Dashboard: Loaded expenses:', expensesData)
      setExpenses(expensesData)
      
    } catch (error) {
      console.error('Dashboard: Error loading expenses:', error)
      
      // Provide more user-friendly error messages
      if (error.message.includes('client_id')) {
        setError('Google API configuration missing. Please contact the administrator to set up API credentials.')
      } else if (error.message.includes('API key')) {
        setError('Google API key not configured. Please contact the administrator.')
      } else {
        setError(`Failed to load expenses: ${error.message}`)
      }
      
      // Set empty expenses on error to prevent white screen
      setExpenses([])
    } finally {
      setLoading(false)
      console.log('Dashboard: loadExpenses completed')
    }
  }

  // Load expenses on component mount
  useEffect(() => {
    console.log('Dashboard: Starting to load expenses...')
    loadExpenses().catch(error => {
      console.error('Dashboard: Error in useEffect:', error)
    })
  }, [])

  // Calculate totals and categories from real data
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const monthlyExpenses = expenses
    .filter(expense => {
      const expenseDate = new Date(expense.date)
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear
    })
    .reduce((sum, expense) => sum + expense.amount, 0)

  // Calculate category breakdown
  const categoryTotals = {}
  expenses.forEach(expense => {
    const category = expense.category || 'Other'
    categoryTotals[category] = (categoryTotals[category] || 0) + expense.amount
  })

  const categoryData = Object.entries(categoryTotals).map(([name, amount]) => ({
    name,
    amount,
    percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
  }))

  // Get recent expenses (last 5)
  const recentExpenses = [...expenses]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">Overview of your expenses</p>
        </div>
        
        <div className="flex items-center justify-center min-h-48">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your expenses...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">Overview of your expenses</p>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Configuration Required</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
                {error.includes('API') && (
                  <div className="mt-3 p-3 bg-red-100 rounded border border-red-200">
                    <p className="font-medium text-red-800 mb-2">For now, you can:</p>
                    <ul className="list-disc list-inside text-red-700 space-y-1">
                      <li>Use the app locally with your own Google API credentials</li>
                      <li>Navigate to other pages to see the app structure</li>
                      <li>Check out the Debug page for API setup instructions</li>
                    </ul>
                  </div>
                )}
              </div>
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={loadExpenses}
                  className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Try Again
                </button>
                <a
                  href="/debug"
                  className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Setup Guide
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-gray-600">Overview of your expenses</p>
            <button
              onClick={loadExpenses}
              disabled={loading}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
        </div>
        <Link
          to="/add"
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors duration-200"
        >
          Add Expense
        </Link>
      </div>

      {/* Empty State */}
      {expenses.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses yet</h3>
          <p className="text-gray-600 mb-4">Start tracking your expenses by adding your first entry.</p>
          <Link
            to="/add"
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors duration-200"
          >
            Add Your First Expense
          </Link>
        </div>
      ) : (
        <>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-md">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900">${totalExpenses.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-md">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">${monthlyExpenses.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-md">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Categories</p>
              <p className="text-2xl font-bold text-gray-900">{categoryData.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Spending by Category</h2>
        <div className="space-y-4">
          {categoryData.map((category, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full bg-primary-${(index + 1) * 100}`}></div>
                <span className="text-sm font-medium text-gray-900">{category.name}</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full" 
                    style={{ width: `${category.percentage}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 w-16 text-right">
                  ${category.amount.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Expenses */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Recent Expenses</h2>
          <Link to="/expenses" className="text-primary-600 hover:text-primary-800 text-sm font-medium">
            View All
          </Link>
        </div>
        <div className="space-y-3">
          {recentExpenses.map((expense) => (
            <div key={expense.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
              <div>
                <p className="text-sm font-medium text-gray-900">{expense.description}</p>
                <p className="text-xs text-gray-500">{expense.category} • {formatDate(expense.date)}</p>
              </div>
              <span className="text-sm font-medium text-gray-900">{formatCurrency(expense.amount)}</span>
            </div>
          ))}
        </div>
      </div>
      </>
      )}
    </div>
  )
}

export default Dashboard
