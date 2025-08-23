import React, { useState } from 'react'
import googleSheetsService from '../services/googleSheets'

const Settings = () => {
  const [settings, setSettings] = useState({
    autoSync: true,
    notifications: true,
    defaultCategory: 'Other',
    currency: 'USD'
  })

  const [customCategories, setCustomCategories] = useState([
    'Food & Dining',
    'Transportation',
    'Shopping',
    'Entertainment',
    'Bills & Utilities',
    'Healthcare',
    'Travel',
    'Other'
  ])

  const [newCategory, setNewCategory] = useState('')
  const [googleSheetsConnected, setGoogleSheetsConnected] = useState(false)

  const handleSettingChange = (e) => {
    const { name, value, type, checked } = e.target
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const addCategory = () => {
    if (newCategory.trim() && !customCategories.includes(newCategory.trim())) {
      setCustomCategories([...customCategories, newCategory.trim()])
      setNewCategory('')
    }
  }

  const removeCategory = (categoryToRemove) => {
    setCustomCategories(customCategories.filter(cat => cat !== categoryToRemove))
  }

  const connectGoogleSheets = async () => {
    try {
      console.log('Connecting to Google Sheets...')
      
      // Initialize the service first
      await googleSheetsService.initialize()
      
      // Then authenticate
      await googleSheetsService.authenticate()
      
      setGoogleSheetsConnected(true)
      console.log('Successfully connected to Google Sheets')
    } catch (error) {
      console.error('Failed to connect to Google Sheets:', error)
      alert(`Failed to connect: ${error.message}`)
    }
  }

  const disconnectGoogleSheets = () => {
    setGoogleSheetsConnected(false)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* Google Sheets Integration */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Google Sheets Integration</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">
              {googleSheetsConnected 
                ? 'Connected to Google Sheets. Your expenses will be automatically synced.'
                : 'Connect your Google account to sync expenses with Google Sheets.'
              }
            </p>
            {googleSheetsConnected && (
              <p className="text-xs text-gray-500 mt-1">
                Sheet ID: [Placeholder - will show actual sheet ID when connected]
              </p>
            )}
          </div>
          <button
            onClick={googleSheetsConnected ? disconnectGoogleSheets : connectGoogleSheets}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              googleSheetsConnected
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {googleSheetsConnected ? 'Disconnect' : 'Connect Google Sheets'}
          </button>
        </div>
      </div>

      {/* General Settings */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium text-gray-900 mb-4">General Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="autoSync" className="text-sm font-medium text-gray-700">
                Auto-sync to Google Sheets
              </label>
              <p className="text-xs text-gray-500">Automatically sync new expenses to your Google Sheet</p>
            </div>
            <input
              type="checkbox"
              id="autoSync"
              name="autoSync"
              checked={settings.autoSync}
              onChange={handleSettingChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="notifications" className="text-sm font-medium text-gray-700">
                Enable notifications
              </label>
              <p className="text-xs text-gray-500">Get notified about sync status and errors</p>
            </div>
            <input
              type="checkbox"
              id="notifications"
              name="notifications"
              checked={settings.notifications}
              onChange={handleSettingChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
          </div>

          <div>
            <label htmlFor="defaultCategory" className="block text-sm font-medium text-gray-700 mb-1">
              Default Category
            </label>
            <select
              id="defaultCategory"
              name="defaultCategory"
              value={settings.defaultCategory}
              onChange={handleSettingChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              {customCategories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
              Currency
            </label>
            <select
              id="currency"
              name="currency"
              value={settings.currency}
              onChange={handleSettingChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="CAD">CAD (C$)</option>
              <option value="AUD">AUD (A$)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Categories Management */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Expense Categories</h2>
        
        {/* Add New Category */}
        <div className="flex space-x-2 mb-4">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Add new category"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            onKeyPress={(e) => e.key === 'Enter' && addCategory()}
          />
          <button
            onClick={addCategory}
            className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700"
          >
            Add
          </button>
        </div>

        {/* Categories List */}
        <div className="space-y-2">
          {customCategories.map((category) => (
            <div key={category} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md">
              <span className="text-sm font-medium text-gray-700">{category}</span>
              {customCategories.length > 1 && (
                <button
                  onClick={() => removeCategory(category)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Data Management</h2>
        <div className="space-y-3">
          <button className="w-full bg-primary-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-primary-700">
            Export Data (CSV)
          </button>
          <button className="w-full bg-yellow-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-yellow-700">
            Backup to Google Drive
          </button>
          <button className="w-full bg-red-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-red-700">
            Clear All Data
          </button>
        </div>
      </div>
    </div>
  )
}

export default Settings
