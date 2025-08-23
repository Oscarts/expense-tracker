import React, { useState, useEffect } from 'react'
import expenseService from '../services/expenseService'
import localStorageService from '../services/localStorage'

const LocalStorageTest = () => {
  const [expenses, setExpenses] = useState([])
  const [testResult, setTestResult] = useState('')
  const [loading, setLoading] = useState(false)

  // Load expenses on component mount
  useEffect(() => {
    loadExpenses()
  }, [])

  const loadExpenses = async () => {
    try {
      await expenseService.initialize()
      const expensesData = await expenseService.getExpenses()
      setExpenses(expensesData)
      console.log('Loaded expenses:', expensesData)
    } catch (error) {
      console.error('Error loading expenses:', error)
      setTestResult(`Error loading: ${error.message}`)
    }
  }

  const testAddExpense = async () => {
    try {
      setLoading(true)
      setTestResult('')

      const testExpense = {
        description: `Test Expense ${Date.now()}`,
        amount: Math.round(Math.random() * 100 * 100) / 100,
        category: 'Food & Dining',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'Cash'
      }

      console.log('Adding test expense:', testExpense)

      // Add using expense service
      await expenseService.initialize()
      const savedExpense = await expenseService.addExpense(testExpense)

      console.log('Expense added successfully:', savedExpense)
      setTestResult(`✅ Expense added: ${savedExpense.description} - $${savedExpense.amount}`)

      // Reload expenses
      await loadExpenses()

    } catch (error) {
      console.error('Error adding expense:', error)
      setTestResult(`❌ Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testDirectLocalStorage = () => {
    try {
      const directExpense = {
        description: 'Direct localStorage test',
        amount: 99.99,
        category: 'Testing',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'Test'
      }

      const saved = localStorageService.addExpense(directExpense)
      console.log('Direct localStorage add result:', saved)
      setTestResult(`✅ Direct localStorage: ${saved.description} - $${saved.amount}`)
      loadExpenses()
    } catch (error) {
      console.error('Direct localStorage error:', error)
      setTestResult(`❌ Direct localStorage error: ${error.message}`)
    }
  }

  const clearAllData = () => {
    localStorage.removeItem('expenseTracker_expenses')
    localStorage.removeItem('expenseTracker_settings')
    setExpenses([])
    setTestResult('🗑️ All data cleared')
  }

  const checkRawLocalStorage = () => {
    const rawData = localStorage.getItem('expenseTracker_expenses')
    console.log('Raw localStorage data:', rawData)
    setTestResult(`Raw data length: ${rawData ? rawData.length : 0} characters`)
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">localStorage Persistence Test</h1>
      
      {/* Test Result */}
      {testResult && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">{testResult}</p>
        </div>
      )}

      {/* Test Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <button
          onClick={testAddExpense}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
        >
          {loading ? 'Adding...' : 'Add Test Expense'}
        </button>
        
        <button
          onClick={testDirectLocalStorage}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Test Direct localStorage
        </button>
        
        <button
          onClick={checkRawLocalStorage}
          className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
        >
          Check Raw Data
        </button>
        
        <button
          onClick={clearAllData}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Clear All Data
        </button>
      </div>

      {/* Current Expenses */}
      <div className="bg-white border rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-4">
          Current Expenses ({expenses.length})
        </h2>
        
        {expenses.length === 0 ? (
          <p className="text-gray-500">No expenses found. Add some test data!</p>
        ) : (
          <div className="space-y-2">
            {expenses.map((expense, index) => (
              <div key={expense.id || index} className="border-b pb-2">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">{expense.description}</span>
                    <span className="text-gray-500 ml-2">({expense.category})</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="font-bold">${expense.amount}</span>
                    <span className="text-sm text-gray-400">{expense.date}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      expense.synced ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {expense.synced ? 'Synced' : 'Local'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Test Instructions:</h3>
        <ol className="text-sm space-y-1 list-decimal list-inside">
          <li>Click "Add Test Expense" to add expenses using the expense service</li>
          <li>Click "Test Direct localStorage" to test localStorage directly</li>
          <li>Refresh the page to verify persistence</li>
          <li>Check browser dev tools → Application → Local Storage</li>
          <li>Use "Clear All Data" to reset for clean testing</li>
        </ol>
      </div>
    </div>
  )
}

export default LocalStorageTest
