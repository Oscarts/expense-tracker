import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import googleSheetsService from '../services/googleSheets'

const AddExpense = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: ''
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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

  const paymentMethods = [
    'Cash',
    'Credit Card',
    'Debit Card',
    'Bank Transfer',
    'Digital Wallet'
  ]

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')
    
    try {
      // Validate form data
      if (!formData.amount || !formData.category) {
        throw new Error('Amount and category are required')
      }
      
      // Prepare expense data
      const expenseData = {
        date: formData.date,
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description || '',
        paymentMethod: formData.paymentMethod || ''
      }
      
      console.log('Saving expense:', expenseData)
      
      // Initialize Google Sheets service if needed
      if (!googleSheetsService.isUserAuthenticated()) {
        setError('Please connect to Google Sheets first. Go to Settings to connect.')
        setIsLoading(false)
        return
      }
      
      // Check if we have a spreadsheet ID
      const spreadsheetId = import.meta.env.VITE_SPREADSHEET_ID
      if (spreadsheetId) {
        googleSheetsService.setSpreadsheetId(spreadsheetId)
      } else {
        // Create a new spreadsheet if none exists
        console.log('No spreadsheet ID found, creating new spreadsheet...')
        await googleSheetsService.createExpenseSpreadsheet()
      }
      
      // Add the expense to Google Sheets
      await googleSheetsService.addExpense(expenseData)
      
      setSuccess('Expense added successfully!')
      
      // Reset form
      setFormData({
        amount: '',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: ''
      })
      
      // Navigate back to dashboard after a short delay
      setTimeout(() => {
        navigate('/')
      }, 1500)
      
    } catch (error) {
      console.error('Error saving expense:', error)
      setError(`Failed to save expense: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Expense</h1>
        
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        
        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Amount *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                id="amount"
                name="amount"
                step="0.01"
                min="0"
                required
                value={formData.amount}
                onChange={handleChange}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              id="category"
              name="category"
              required
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              placeholder="What did you spend on?"
            />
          </div>

          {/* Date */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Date *
            </label>
            <input
              type="date"
              id="date"
              name="date"
              required
              value={formData.date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <select
              id="paymentMethod"
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select payment method</option>
              {paymentMethods.map((method) => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </div>

          {/* Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                isLoading 
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              {isLoading ? 'Saving...' : 'Add Expense'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              disabled={isLoading}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 ${
                isLoading 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              }`}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddExpense
