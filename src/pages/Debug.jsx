import React, { useState, useEffect } from 'react'
import googleSheetsService from '../services/googleSheets'

const Debug = () => {
  const [debugInfo, setDebugInfo] = useState({
    apiLoaded: false,
    gapiInitialized: false,
    authInstance: null,
    isSignedIn: false,
    hasPermissions: false,
    error: null,
    envVars: {
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
      spreadsheetId: import.meta.env.VITE_SPREADSHEET_ID
    }
  })

  const [testResults, setTestResults] = useState([])

  const addTestResult = (test, status, message) => {
    setTestResults(prev => [...prev, {
      test,
      status, // 'success', 'error', 'warning', 'info'
      message,
      timestamp: new Date().toLocaleTimeString()
    }])
  }

  const runDiagnostics = async () => {
    setTestResults([])
    
    // Test 1: Check environment variables
    addTestResult('Environment Variables', 
      debugInfo.envVars.clientId && debugInfo.envVars.apiKey ? 'success' : 'error',
      debugInfo.envVars.clientId && debugInfo.envVars.apiKey 
        ? 'Environment variables are set' 
        : 'Missing environment variables'
    )

    // Test 2: Check if Google API script loads
    try {
      addTestResult('Google API Script', 'info', 'Loading Google API script...')
      await googleSheetsService.loadGoogleAPI()
      addTestResult('Google API Script', 'success', 'Google API script loaded successfully')
    } catch (error) {
      addTestResult('Google API Script', 'error', `Failed to load: ${error.message}`)
      return
    }

    // Test 3: Initialize Google API client
    try {
      addTestResult('API Initialization', 'info', 'Initializing Google API client...')
      await googleSheetsService.initialize()
      addTestResult('API Initialization', 'success', 'Google API client initialized')
    } catch (error) {
      addTestResult('API Initialization', 'error', `Initialization failed: ${error.message}`)
      return
    }

    // Test 4: Check authentication
    try {
      addTestResult('Authentication', 'info', 'Checking authentication status...')
      
      if (googleSheetsService.isUserAuthenticated()) {
        addTestResult('Authentication', 'success', 'User is already authenticated')
      } else {
        addTestResult('Authentication', 'info', 'Attempting to authenticate...')
        const success = await googleSheetsService.authenticate()
        addTestResult('Authentication', 
          success ? 'success' : 'error',
          success ? 'Authentication successful' : 'Authentication failed'
        )
      }
    } catch (error) {
      addTestResult('Authentication', 'error', `Auth error: ${error.message}`)
    }

    // Test 5: Test Sheets API access
    if (debugInfo.envVars.spreadsheetId) {
      try {
        addTestResult('Sheets API Access', 'info', 'Testing Sheets API access...')
        googleSheetsService.setSpreadsheetId(debugInfo.envVars.spreadsheetId)
        
        const response = await window.gapi.client.sheets.spreadsheets.get({
          spreadsheetId: debugInfo.envVars.spreadsheetId
        })
        
        addTestResult('Sheets API Access', 'success', 
          `Successfully accessed spreadsheet: ${response.result.properties.title}`
        )
      } catch (error) {
        addTestResult('Sheets API Access', 'error', 
          `Failed to access spreadsheet: ${error.message}`
        )
      }
    } else {
      addTestResult('Sheets API Access', 'warning', 
        'No spreadsheet ID provided - will create new spreadsheet'
      )
    }
  }

  const createTestSpreadsheet = async () => {
    try {
      addTestResult('Create Spreadsheet', 'info', 'Initializing Google Sheets service...')
      
      // First initialize the service
      await googleSheetsService.initialize()
      
      // Then ensure we're authenticated
      if (!googleSheetsService.isUserAuthenticated()) {
        addTestResult('Create Spreadsheet', 'info', 'Authenticating user...')
        await googleSheetsService.authenticate()
      }
      
      addTestResult('Create Spreadsheet', 'info', 'Creating test spreadsheet...')
      const spreadsheetId = await googleSheetsService.createExpenseSpreadsheet()
      addTestResult('Create Spreadsheet', 'success', 
        `Created spreadsheet with ID: ${spreadsheetId}`
      )
      
      // Update .env file suggestion
      addTestResult('Next Steps', 'info', 
        `Add this to your .env file: VITE_SPREADSHEET_ID=${spreadsheetId}`
      )
      
      // Also provide the direct link
      addTestResult('Spreadsheet Link', 'success', 
        `View your spreadsheet: https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
      )
    } catch (error) {
      addTestResult('Create Spreadsheet', 'error', 
        `Failed to create spreadsheet: ${error.message}`
      )
      console.error('Full error details:', error)
    }
  }

  const testAddExpense = async () => {
    try {
      addTestResult('Add Test Expense', 'info', 'Checking service status...')
      
      // Log current status
      const status = googleSheetsService.getStatus()
      console.log('Google Sheets Service Status:', status)
      
      addTestResult('Service Status', 'info', 
        `Ready: ${googleSheetsService.isReady()}, Auth: ${status.isAuthenticated}, Client: ${status.hasGapiClient}`
      )
      
      // Ensure Google Sheets service is initialized
      if (!status.hasGapiClient || !status.hasTokenClient) {
        addTestResult('Add Test Expense', 'info', 'Initializing service...')
        await googleSheetsService.initialize()
      }
      
      // Ensure user is authenticated
      if (!googleSheetsService.isUserAuthenticated()) {
        addTestResult('Add Test Expense', 'info', 'Authenticating user...')
        await googleSheetsService.authenticate()
      }
      
      // Ensure we have a spreadsheet
      const spreadsheetId = import.meta.env.VITE_SPREADSHEET_ID || googleSheetsService.getSpreadsheetId()
      if (!spreadsheetId) {
        addTestResult('Add Test Expense', 'info', 'Creating spreadsheet first...')
        await googleSheetsService.createExpenseSpreadsheet()
      } else {
        googleSheetsService.setSpreadsheetId(spreadsheetId)
      }
      
      addTestResult('Add Test Expense', 'info', 'Adding test expense...')
      const testExpense = {
        date: new Date().toISOString().split('T')[0],
        amount: 10.50,
        category: 'Testing',
        description: 'Debug test expense',
        paymentMethod: 'Test'
      }
      
      await googleSheetsService.addExpense(testExpense)
      addTestResult('Add Test Expense', 'success', 'Test expense added successfully')
    } catch (error) {
      addTestResult('Add Test Expense', 'error', 
        `Failed to add expense: ${error.message}`
      )
      console.error('Full error details:', error)
    }
  }

  const setupExistingSpreadsheet = async () => {
    try {
      const spreadsheetId = import.meta.env.VITE_SPREADSHEET_ID
      if (!spreadsheetId) {
        addTestResult('Setup Existing', 'error', 'No VITE_SPREADSHEET_ID found in .env file')
        return
      }
      
      addTestResult('Setup Existing', 'info', `Setting up spreadsheet: ${spreadsheetId}`)
      
      // Initialize service if needed
      if (!googleSheetsService.isReady()) {
        await googleSheetsService.initialize()
        await googleSheetsService.authenticate()
      }
      
      await googleSheetsService.setupExistingSpreadsheet(spreadsheetId)
      addTestResult('Setup Existing', 'success', 'Existing spreadsheet set up successfully with Expenses sheet')
    } catch (error) {
      addTestResult('Setup Existing', 'error', `Failed to setup: ${error.message}`)
    }
  }

  const testAuthentication = async () => {
    try {
      addTestResult('Manual Auth Test', 'info', 'Initializing Google Sheets service...')
      await googleSheetsService.initialize()
      
      addTestResult('Manual Auth Test', 'info', 'Starting authentication...')
      const success = await googleSheetsService.authenticate()
      addTestResult('Manual Auth Test', 
        success ? 'success' : 'error',
        success ? 'Manual authentication successful' : 'Manual authentication failed'
      )
    } catch (error) {
      addTestResult('Manual Auth Test', 'error', `Manual auth failed: ${error.message}`)
    }
  }

  useEffect(() => {
    // Update debug info periodically
    const updateDebugInfo = () => {
      setDebugInfo(prev => ({
        ...prev,
        apiLoaded: typeof window.gapi !== 'undefined',
        gapiInitialized: window.gapi?.client ? true : false,
        authInstance: window.google?.accounts?.oauth2 ? 'Google Identity Services' : null,
        isSignedIn: googleSheetsService.isUserAuthenticated()
      }))
    }

    updateDebugInfo()
    const interval = setInterval(updateDebugInfo, 1000)
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50'
      case 'error': return 'text-red-600 bg-red-50'
      case 'warning': return 'text-yellow-600 bg-yellow-50'
      case 'info': return 'text-blue-600 bg-blue-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Google Sheets Debug Panel</h1>
      
      {/* Current Status */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Current Status</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Google API Loaded:</span>
            <span className={`ml-2 ${debugInfo.apiLoaded ? 'text-green-600' : 'text-red-600'}`}>
              {debugInfo.apiLoaded ? '✓' : '✗'}
            </span>
          </div>
          <div>
            <span className="font-medium">GAPI Initialized:</span>
            <span className={`ml-2 ${debugInfo.gapiInitialized ? 'text-green-600' : 'text-red-600'}`}>
              {debugInfo.gapiInitialized ? '✓' : '✗'}
            </span>
          </div>
          <div>
            <span className="font-medium">User Signed In:</span>
            <span className={`ml-2 ${debugInfo.isSignedIn ? 'text-green-600' : 'text-red-600'}`}>
              {debugInfo.isSignedIn ? '✓' : '✗'}
            </span>
          </div>
          <div>
            <span className="font-medium">Client ID:</span>
            <span className="ml-2 text-xs font-mono">
              {debugInfo.envVars.clientId ? 
                `${debugInfo.envVars.clientId.substring(0, 20)}...` : 
                'Not set'
              }
            </span>
          </div>
        </div>
      </div>

      {/* Environment Variables */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Environment Variables</h2>
        <div className="space-y-2 text-sm font-mono">
          <div>
            <span className="font-medium">VITE_GOOGLE_CLIENT_ID:</span>
            <span className={`ml-2 ${debugInfo.envVars.clientId ? 'text-green-600' : 'text-red-600'}`}>
              {debugInfo.envVars.clientId || 'Not set'}
            </span>
          </div>
          <div>
            <span className="font-medium">VITE_GOOGLE_API_KEY:</span>
            <span className={`ml-2 ${debugInfo.envVars.apiKey ? 'text-green-600' : 'text-red-600'}`}>
              {debugInfo.envVars.apiKey ? `${debugInfo.envVars.apiKey.substring(0, 10)}...` : 'Not set'}
            </span>
          </div>
          <div>
            <span className="font-medium">VITE_SPREADSHEET_ID:</span>
            <span className={`ml-2 ${debugInfo.envVars.spreadsheetId ? 'text-green-600' : 'text-yellow-600'}`}>
              {debugInfo.envVars.spreadsheetId || 'Not set (optional)'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Diagnostic Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={runDiagnostics}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
          >
            Run Full Diagnostics
          </button>
          <button
            onClick={testAuthentication}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
          >
            Test Authentication Only
          </button>
          <button
            onClick={createTestSpreadsheet}
            className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700"
          >
            Create Test Spreadsheet
          </button>
          <button
            onClick={setupExistingSpreadsheet}
            className="bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-orange-700"
          >
            Setup Existing Spreadsheet
          </button>
          <button
            onClick={testAddExpense}
            className="bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-700"
          >
            Test Add Expense
          </button>
          <button
            onClick={() => setTestResults([])}
            className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700"
          >
            Clear Results
          </button>
        </div>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Test Results</h2>
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div key={index} className={`p-3 rounded-md ${getStatusColor(result.status)}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-medium">{result.test}:</span>
                    <span className="ml-2">{result.message}</span>
                  </div>
                  <span className="text-xs opacity-75">{result.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Common Issues */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Common Issues & Solutions</h2>
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-medium text-red-600">Error: "Not a valid origin for the client"</h3>
            <p className="text-gray-600 mt-1">
              Solution: Add <code className="bg-gray-100 px-1 rounded">http://localhost:3000</code> to 
              your OAuth 2.0 client's authorized JavaScript origins in Google Cloud Console.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-red-600">Error: "Popup blocked"</h3>
            <p className="text-gray-600 mt-1">
              Solution: Allow popups for localhost:3000 or use the sign-in button directly.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-red-600">Error: "Insufficient permissions"</h3>
            <p className="text-gray-600 mt-1">
              Solution: Make sure your OAuth consent screen includes the Google Sheets scope 
              and the user has granted permissions.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-red-600">Error: "Spreadsheet not found"</h3>
            <p className="text-gray-600 mt-1">
              Solution: Make sure the spreadsheet exists and is accessible by the authenticated user, 
              or create a new one using the button above.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Debug
