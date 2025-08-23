// Test localStorage persistence
console.log('=== TESTING LOCALSTORAGE PERSISTENCE ===')

// Test 1: Add some test data
const testExpense = {
  description: 'Test Expense',
  amount: 25.50,
  category: 'Food & Dining',
  date: '2024-12-26',
  paymentMethod: 'Cash'
}

// Save to localStorage directly
const storageKey = 'expenseTracker_expenses'
const currentExpenses = JSON.parse(localStorage.getItem(storageKey) || '[]')
console.log('Current expenses in localStorage:', currentExpenses)

// Add test expense
const newExpense = {
  ...testExpense,
  id: Date.now(),
  createdAt: new Date().toISOString(),
  synced: false
}

currentExpenses.push(newExpense)
localStorage.setItem(storageKey, JSON.stringify(currentExpenses))

console.log('Added test expense:', newExpense)
console.log('Total expenses now:', currentExpenses.length)

// Test 2: Verify persistence
const retrievedExpenses = JSON.parse(localStorage.getItem(storageKey) || '[]')
console.log('Retrieved expenses:', retrievedExpenses)

// Test 3: Clear test data
// localStorage.removeItem(storageKey)
// console.log('Test data cleared')

console.log('=== LOCALSTORAGE TEST COMPLETE ===')
