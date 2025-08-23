import React, { useState, useEffect } from 'react'
import expenseService from '../services/expenseService'

const ExpenseList = () => {
  // Real data from Google Sheets
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [filters, setFilters] = useState({
    category: '',
    dateFrom: '',
    dateTo: '',
    search: ''
  })

  // Load expenses from local storage
  const loadExpenses = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Initialize expense service
      await expenseService.initialize()
      
      // Load expenses
      const expensesData = await expenseService.getExpenses()
      setExpenses(expensesData)
      
    } catch (error) {
      console.error('Error loading expenses:', error)
      setError(`Failed to load expenses: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Load expenses on component mount
  useEffect(() => {
    loadExpenses()
  }, [])

  const categories = [
    'Food & Dining',
    'Transportation',
    'Shopping',
    'Entertainment',
    'Bills & Utilities',
    'Healthcare',
    'Travel',
    'Other'
  ]

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    })
  }

  const filteredExpenses = expenses.filter(expense => {
    const matchesCategory = !filters.category || expense.category === filters.category
    const matchesSearch = !filters.search || 
      expense.description.toLowerCase().includes(filters.search.toLowerCase()) ||
      expense.category.toLowerCase().includes(filters.search.toLowerCase())
    const matchesDateFrom = !filters.dateFrom || expense.date >= filters.dateFrom
    const matchesDateTo = !filters.dateTo || expense.date <= filters.dateTo

    return matchesCategory && matchesSearch && matchesDateFrom && matchesDateTo
  })

  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">All Expenses</h1>
        <div className="flex items-center space-x-4">
          <div className="text-lg font-semibold text-gray-900">
            Total: ${totalAmount.toFixed(2)}
          </div>
          <button
            onClick={loadExpenses}
            disabled={loading}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              loading 
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
          <button 
            onClick={loadExpenses}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              id="search"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              placeholder="Search expenses..."
            />
          </div>
          
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="category"
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              id="dateFrom"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          
          <div>
            <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              id="dateTo"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Expenses List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            {filteredExpenses.length} Expense{filteredExpenses.length !== 1 ? 's' : ''}
          </h2>
        </div>
        
        {filteredExpenses.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-gray-500">No expenses found matching your criteria.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredExpenses.map((expense) => (
              <div key={expense.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{expense.description}</p>
                        <p className="text-xs text-gray-500">
                          {expense.category} • {expense.paymentMethod} • {expense.date}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-lg font-semibold text-gray-900">
                      ${expense.amount.toFixed(2)}
                    </span>
                    <div className="flex space-x-2">
                      <button className="text-primary-600 hover:text-primary-800 text-sm">
                        Edit
                      </button>
                      <button className="text-red-600 hover:text-red-800 text-sm">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ExpenseList
