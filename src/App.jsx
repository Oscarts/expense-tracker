import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/layout/Header'
import Dashboard from './pages/Dashboard'
import AddExpense from './pages/AddExpense'
import ExpenseList from './pages/ExpenseList'
import Settings from './pages/Settings'
import Debug from './pages/Debug'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/add" element={<AddExpense />} />
            <Route path="/expenses" element={<ExpenseList />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/debug" element={<Debug />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
