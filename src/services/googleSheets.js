// Google Sheets API integration
// This file will handle all Google Sheets operations

class GoogleSheetsService {
  constructor() {
    this.isAuthenticated = false
    this.spreadsheetId = null
    this.accessToken = null
    this.tokenClient = null
    this.tokenExpiryTime = null
    this.refreshToken = null
    
    // Try to restore previous authentication on initialization
    this.restoreAuthenticationState()
  }

  // Restore authentication state from localStorage
  restoreAuthenticationState() {
    try {
      const savedAuth = localStorage.getItem('googleSheetsAuth')
      if (savedAuth) {
        const authData = JSON.parse(savedAuth)
        const now = new Date().getTime()
        
        // Check if token is still valid (with 5 minute buffer)
        if (authData.expiryTime && authData.expiryTime > now + 300000) {
          this.accessToken = authData.accessToken
          this.tokenExpiryTime = authData.expiryTime
          this.isAuthenticated = true
          this.spreadsheetId = authData.spreadsheetId || null
          
          console.log('Restored authentication from localStorage')
          
          // Set the token in gapi client if available
          if (window.gapi && window.gapi.client) {
            window.gapi.client.setToken({
              access_token: this.accessToken
            })
          }
        } else {
          // Token expired, clear it
          this.clearAuthenticationState()
        }
      }
    } catch (error) {
      console.error('Error restoring authentication state:', error)
      this.clearAuthenticationState()
    }
  }

  // Save authentication state to localStorage
  saveAuthenticationState() {
    try {
      const authData = {
        accessToken: this.accessToken,
        expiryTime: this.tokenExpiryTime,
        spreadsheetId: this.spreadsheetId,
        savedAt: new Date().getTime()
      }
      localStorage.setItem('googleSheetsAuth', JSON.stringify(authData))
      console.log('Authentication state saved to localStorage')
    } catch (error) {
      console.error('Error saving authentication state:', error)
    }
  }

  // Clear authentication state from localStorage
  clearAuthenticationState() {
    try {
      localStorage.removeItem('googleSheetsAuth')
      this.isAuthenticated = false
      this.accessToken = null
      this.tokenExpiryTime = null
      this.spreadsheetId = null
      console.log('Authentication state cleared')
    } catch (error) {
      console.error('Error clearing authentication state:', error)
    }
  }

  // Check if token needs refresh
  needsTokenRefresh() {
    if (!this.accessToken || !this.tokenExpiryTime) {
      return true
    }
    
    const now = new Date().getTime()
    const bufferTime = 300000 // 5 minutes buffer
    
    return this.tokenExpiryTime <= now + bufferTime
  }

  // Initialize Google API
  async initialize() {
    try {
      // Load Google API script
      await this.loadGoogleAPI()
      
      // Load Google Identity Services
      await this.loadGoogleIdentityServices()
      
      // Initialize gapi client
      await new Promise((resolve) => {
        window.gapi.load('client', resolve)
      })

      // Initialize the client
      await window.gapi.client.init({
        apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
        discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4']
      })

      // Initialize the OAuth2 token client
      this.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        callback: (response) => {
          if (response.error) {
            console.error('Token error:', response.error)
            throw new Error(`Token error: ${response.error}`)
          }
          
          this.accessToken = response.access_token
          this.isAuthenticated = true
          
          // Calculate expiry time (tokens typically last 1 hour)
          const expiresIn = response.expires_in || 3600 // Default to 1 hour
          this.tokenExpiryTime = new Date().getTime() + (expiresIn * 1000)
          
          // Save authentication state
          this.saveAuthenticationState()
          
          // Set the token in gapi client
          if (window.gapi && window.gapi.client) {
            window.gapi.client.setToken({
              access_token: this.accessToken
            })
          }
          
          console.log('Authentication successful, token saved')
        },
      })

      console.log('Google Sheets API initialized')
    } catch (error) {
      console.error('Error initializing Google Sheets API:', error)
      throw error
    }
  }

  // Load Google API script
  loadGoogleAPI() {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        resolve()
        return
      }

      const script = document.createElement('script')
      script.src = 'https://apis.google.com/js/api.js'
      script.onload = resolve
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  // Load Google Identity Services
  loadGoogleIdentityServices() {
    return new Promise((resolve, reject) => {
      if (window.google?.accounts) {
        resolve()
        return
      }

      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.onload = resolve
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  // Authenticate user
  async authenticate() {
    return new Promise((resolve, reject) => {
      try {
        // Check if we already have a valid token
        if (this.isAuthenticated && !this.needsTokenRefresh()) {
          console.log('Using existing valid token')
          resolve(true)
          return
        }

        if (!this.tokenClient) {
          reject(new Error('Token client not initialized. Call initialize() first.'))
          return
        }

        // Set up the callback for this specific authentication request
        this.tokenClient.callback = (response) => {
          if (response.error) {
            console.error('Authentication error:', response.error)
            this.clearAuthenticationState()
            reject(new Error(`Authentication failed: ${response.error}`))
            return
          }
          
          this.accessToken = response.access_token
          this.isAuthenticated = true
          
          // Calculate expiry time
          const expiresIn = response.expires_in || 3600
          this.tokenExpiryTime = new Date().getTime() + (expiresIn * 1000)
          
          // Save authentication state
          this.saveAuthenticationState()
          
          // Set the access token for gapi client
          window.gapi.client.setToken({
            access_token: this.accessToken
          })
          
          console.log('User authenticated successfully, token will expire at:', new Date(this.tokenExpiryTime))
          resolve(true)
        }

        // Request access token - only prompt for consent if needed
        const requestOptions = this.isAuthenticated ? {} : { prompt: 'consent' }
        this.tokenClient.requestAccessToken(requestOptions)
        
      } catch (error) {
        console.error('Authentication setup failed:', error)
        this.clearAuthenticationState()
        reject(error)
      }
    })
  }

  // Sign out user
  async signOut() {
    try {
      if (this.accessToken) {
        window.google.accounts.oauth2.revoke(this.accessToken, () => {
          console.log('Token revoked')
        })
      }
      
      // Clear all authentication state
      this.clearAuthenticationState()
      
      // Clear the token from gapi client
      if (window.gapi && window.gapi.client) {
        window.gapi.client.setToken(null)
      }
      
      console.log('User signed out successfully')
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  // Create a new spreadsheet for expenses
  async createExpenseSpreadsheet() {
    try {
      // Check if authenticated
      if (!this.isAuthenticated || !this.accessToken) {
        throw new Error('User not authenticated. Please authenticate first.')
      }

      console.log('Creating new spreadsheet...')
      
      const response = await window.gapi.client.sheets.spreadsheets.create({
        resource: {
          properties: {
            title: `Expense Tracker - ${new Date().getFullYear()}`
          },
          sheets: [{
            properties: {
              title: 'Expenses'
            }
          }]
        }
      })

      if (!response.result || !response.result.spreadsheetId) {
        throw new Error('Failed to create spreadsheet - no spreadsheet ID returned')
      }

      this.spreadsheetId = response.result.spreadsheetId
      
      console.log('Spreadsheet created successfully:', this.spreadsheetId)
      
      // Set up headers
      await this.setupHeaders()
      
      console.log('Headers set up successfully')
      return this.spreadsheetId
    } catch (error) {
      console.error('Error creating spreadsheet:', {
        error,
        message: error.message,
        details: error.result || error.body || error
      })
      
      // Provide more specific error messages
      if (error.status === 403) {
        throw new Error('Permission denied. Make sure Google Sheets API is enabled and you have the correct permissions.')
      } else if (error.status === 401) {
        throw new Error('Authentication expired. Please sign in again.')
      } else if (error.message) {
        throw new Error(`Failed to create spreadsheet: ${error.message}`)
      } else {
        throw new Error(`Failed to create spreadsheet: ${JSON.stringify(error)}`)
      }
    }
  }

  // Set up headers in the spreadsheet
  async setupHeaders() {
    const headers = [
      'Date',
      'Amount',
      'Category',
      'Description',
      'Payment Method',
      'Created At'
    ]

    try {
      await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: 'Expenses!A1:F1',
        valueInputOption: 'RAW',
        resource: {
          values: [headers]
        }
      })

      // Format headers
      await window.gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: {
          requests: [{
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: 6
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: {
                    red: 0.2,
                    green: 0.5,
                    blue: 0.8
                  },
                  textFormat: {
                    foregroundColor: {
                      red: 1.0,
                      green: 1.0,
                      blue: 1.0
                    },
                    bold: true
                  }
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)'
            }
          }]
        }
      })

      console.log('Headers set up successfully')
    } catch (error) {
      console.error('Error setting up headers:', {
        error,
        message: error.message,
        spreadsheetId: this.spreadsheetId
      })
      throw new Error(`Failed to set up headers: ${error.message || JSON.stringify(error)}`)
    }
  }

  // Ensure user is authenticated before making API calls
  async ensureAuthenticated() {
    // If we have a valid token, we're good
    if (this.isAuthenticated && !this.needsTokenRefresh()) {
      return true
    }

    // If we need authentication, try to get it
    console.log('Authentication needed, requesting access...')
    await this.authenticate()
    return this.isAuthenticated
  }

  // Add a new expense to the spreadsheet
  async addExpense(expense) {
    try {
      // Ensure we're authenticated before proceeding
      await this.ensureAuthenticated()
      
      if (!window.gapi || !window.gapi.client) {
        throw new Error('Google API client not initialized. Please call initialize() first.')
      }
      
      if (!this.spreadsheetId) {
        throw new Error('No spreadsheet ID set. Please create a spreadsheet first.')
      }

      // First, verify the spreadsheet exists and check its structure
      console.log('Verifying spreadsheet structure...')
      const spreadsheetInfo = await window.gapi.client.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      })
      
      // Check if "Expenses" sheet exists
      const sheets = spreadsheetInfo.result.sheets
      const expensesSheet = sheets.find(sheet => sheet.properties.title === 'Expenses')
      
      if (!expensesSheet) {
        console.log('Expenses sheet not found, creating it...')
        // Create the Expenses sheet
        await window.gapi.client.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          resource: {
            requests: [{
              addSheet: {
                properties: {
                  title: 'Expenses'
                }
              }
            }]
          }
        })
        
        // Set up headers in the new sheet
        await this.setupHeaders()
      }

      const values = [
        expense.date,
        expense.amount,
        expense.category,
        expense.description || '',
        expense.paymentMethod || '',
        new Date().toISOString()
      ]

      console.log('Adding expense to spreadsheet:', this.spreadsheetId, values)

      const response = await window.gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'Expenses!A:F',
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        resource: {
          values: [values]
        }
      })

      console.log('Expense added successfully:', response)
      return response
    } catch (error) {
      console.error('Error adding expense:', {
        error,
        message: error.message,
        spreadsheetId: this.spreadsheetId,
        authenticated: this.isAuthenticated
      })
      
      if (error.status === 404) {
        throw new Error('Spreadsheet not found. Please check the spreadsheet ID or create a new one.')
      } else if (error.status === 403) {
        throw new Error('Permission denied. Make sure you have edit access to the spreadsheet.')
      } else if (error.status === 400 && error.result?.error?.message?.includes('Unable to parse range')) {
        throw new Error('Sheet "Expenses" not found in spreadsheet. Please create a sheet named "Expenses" or use the "Create Test Spreadsheet" button.')
      } else if (error.message) {
        throw new Error(error.message)
      } else {
        throw new Error(`Failed to add expense: ${JSON.stringify(error)}`)
      }
    }
  }

  // Get all expenses from the spreadsheet
  async getExpenses() {
    try {
      // Ensure we're authenticated before proceeding
      await this.ensureAuthenticated()
      
      const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Expenses!A2:F' // Skip header row
      })

      const rows = response.result.values || []
      const expenses = rows.map((row, index) => ({
        id: index + 1,
        date: row[0] || '',
        amount: parseFloat(row[1]) || 0,
        category: row[2] || '',
        description: row[3] || '',
        paymentMethod: row[4] || '',
        createdAt: row[5] || ''
      }))

      console.log('Expenses retrieved successfully:', expenses)
      return expenses
    } catch (error) {
      console.error('Error getting expenses:', error)
      throw error
    }
  }

  // Update an expense (by row index)
  async updateExpense(rowIndex, expense) {
    try {
      const values = [
        expense.date,
        expense.amount,
        expense.category,
        expense.description || '',
        expense.paymentMethod || '',
        expense.createdAt || new Date().toISOString()
      ]

      const response = await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `Expenses!A${rowIndex + 2}:F${rowIndex + 2}`, // +2 because of header and 0-index
        valueInputOption: 'RAW',
        resource: {
          values: [values]
        }
      })

      console.log('Expense updated successfully:', response)
      return response
    } catch (error) {
      console.error('Error updating expense:', error)
      throw error
    }
  }

  // Delete an expense (by row index)
  async deleteExpense(rowIndex) {
    try {
      const response = await window.gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: {
          requests: [{
            deleteDimension: {
              range: {
                sheetId: 0,
                dimension: 'ROWS',
                startIndex: rowIndex + 1, // +1 because of header
                endIndex: rowIndex + 2
              }
            }
          }]
        }
      })

      console.log('Expense deleted successfully:', response)
      return response
    } catch (error) {
      console.error('Error deleting expense:', error)
      throw error
    }
  }

  // Set up an existing spreadsheet for expense tracking
  async setupExistingSpreadsheet(spreadsheetId) {
    try {
      this.spreadsheetId = spreadsheetId
      
      // Get spreadsheet info
      const spreadsheetInfo = await window.gapi.client.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      })
      
      console.log('Setting up existing spreadsheet:', spreadsheetInfo.result.properties.title)
      
      // Check if "Expenses" sheet exists
      const sheets = spreadsheetInfo.result.sheets
      const expensesSheet = sheets.find(sheet => sheet.properties.title === 'Expenses')
      
      if (!expensesSheet) {
        console.log('Creating Expenses sheet...')
        // Create the Expenses sheet
        await window.gapi.client.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          resource: {
            requests: [{
              addSheet: {
                properties: {
                  title: 'Expenses'
                }
              }
            }]
          }
        })
      }
      
      // Set up headers
      await this.setupHeaders()
      
      console.log('Existing spreadsheet set up successfully')
      return this.spreadsheetId
    } catch (error) {
      console.error('Error setting up existing spreadsheet:', error)
      throw new Error(`Failed to setup spreadsheet: ${error.message}`)
    }
  }

  // Set spreadsheet ID (for existing spreadsheets)
  setSpreadsheetId(spreadsheetId) {
    this.spreadsheetId = spreadsheetId
    // Save to localStorage for persistence
    this.saveAuthenticationState()
  }

  // Get current spreadsheet ID
  getSpreadsheetId() {
    return this.spreadsheetId
  }

  // Check if user is authenticated
  isUserAuthenticated() {
    return this.isAuthenticated && this.accessToken !== null
  }

  // Check if service is ready for API calls
  isReady() {
    return this.isUserAuthenticated() && 
           window.gapi && 
           window.gapi.client && 
           this.tokenClient !== null
  }

  // Get detailed status for debugging
  getStatus() {
    return {
      isAuthenticated: this.isAuthenticated,
      hasAccessToken: !!this.accessToken,
      tokenExpiryTime: this.tokenExpiryTime ? new Date(this.tokenExpiryTime).toLocaleString() : null,
      needsRefresh: this.needsTokenRefresh(),
      hasGapi: !!window.gapi,
      hasGapiClient: !!(window.gapi && window.gapi.client),
      hasTokenClient: !!this.tokenClient,
      hasSpreadsheetId: !!this.spreadsheetId,
      spreadsheetId: this.spreadsheetId,
      googleApiLoaded: !!(window.gapi && window.google && window.google.accounts),
      isReady: this.isReady()
    }
  }
}

// Create singleton instance
const googleSheetsService = new GoogleSheetsService()

export default googleSheetsService
