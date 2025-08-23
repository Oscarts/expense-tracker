// Google Sheets Service Account integration
// This service uses a service account for authentication, allowing multi-user access without individual logins

class GoogleSheetsServiceAccount {
  constructor() {
    this.spreadsheetId = null
    this.isInitialized = false
    this.serviceAccountEmail = null
    this.privateKey = null
    this.accessToken = null
    this.tokenExpiryTime = null
  }

  // Initialize service account authentication
  async initialize() {
    try {
      console.log('Initializing Google Sheets Service Account...')
      
      // Get service account credentials from environment variables
      const serviceAccountEmail = import.meta.env.VITE_SERVICE_ACCOUNT_EMAIL
      const privateKey = import.meta.env.VITE_SERVICE_ACCOUNT_PRIVATE_KEY
      const spreadsheetId = import.meta.env.VITE_SPREADSHEET_ID
      
      if (!serviceAccountEmail || !privateKey) {
        throw new Error('Service account credentials not configured. Please set VITE_SERVICE_ACCOUNT_EMAIL and VITE_SERVICE_ACCOUNT_PRIVATE_KEY')
      }
      
      this.serviceAccountEmail = serviceAccountEmail
      this.privateKey = privateKey.replace(/\\n/g, '\n') // Handle newlines in private key
      this.spreadsheetId = spreadsheetId
      
      // Get access token using service account
      await this.getServiceAccountToken()
      
      this.isInitialized = true
      console.log('Service account initialized successfully')
      
      return true
    } catch (error) {
      console.error('Failed to initialize service account:', error)
      this.isInitialized = false
      throw error
    }
  }

  // Get access token using service account JWT
  async getServiceAccountToken() {
    try {
      console.log('Getting service account access token...')
      
      // Create JWT for service account authentication
      const jwt = await this.createServiceAccountJWT()
      
      // Exchange JWT for access token
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: jwt
        })
      })
      
      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Failed to get access token: ${response.status} ${errorData}`)
      }
      
      const tokenData = await response.json()
      this.accessToken = tokenData.access_token
      this.tokenExpiryTime = Date.now() + (tokenData.expires_in * 1000)
      
      console.log('Service account access token obtained')
      return this.accessToken
    } catch (error) {
      console.error('Error getting service account token:', error)
      throw error
    }
  }

  // Create JWT for service account authentication
  async createServiceAccountJWT() {
    try {
      // JWT header
      const header = {
        alg: 'RS256',
        typ: 'JWT'
      }
      
      // JWT payload
      const now = Math.floor(Date.now() / 1000)
      const payload = {
        iss: this.serviceAccountEmail,
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600, // 1 hour
        iat: now
      }
      
      // Encode header and payload
      const encodedHeader = this.base64UrlEncode(JSON.stringify(header))
      const encodedPayload = this.base64UrlEncode(JSON.stringify(payload))
      
      // Create signature
      const signatureInput = `${encodedHeader}.${encodedPayload}`
      const signature = await this.signWithPrivateKey(signatureInput)
      
      // Return complete JWT
      return `${signatureInput}.${signature}`
    } catch (error) {
      console.error('Error creating JWT:', error)
      throw error
    }
  }

  // Sign data with private key using Web Crypto API
  async signWithPrivateKey(data) {
    try {
      // Import private key
      const privateKeyPem = this.privateKey
        .replace('-----BEGIN PRIVATE KEY-----', '')
        .replace('-----END PRIVATE KEY-----', '')
        .replace(/\s/g, '')
      
      const binaryDer = this.base64ToBinary(privateKeyPem)
      
      const cryptoKey = await crypto.subtle.importKey(
        'pkcs8',
        binaryDer,
        {
          name: 'RSASSA-PKCS1-v1_5',
          hash: 'SHA-256'
        },
        false,
        ['sign']
      )
      
      // Sign the data
      const encoder = new TextEncoder()
      const dataBuffer = encoder.encode(data)
      const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, dataBuffer)
      
      // Convert signature to base64url
      return this.base64UrlEncode(new Uint8Array(signature))
    } catch (error) {
      console.error('Error signing with private key:', error)
      throw error
    }
  }

  // Utility: Base64 URL encode
  base64UrlEncode(data) {
    if (typeof data === 'string') {
      data = new TextEncoder().encode(data)
    }
    
    const base64 = btoa(String.fromCharCode.apply(null, data))
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }

  // Utility: Convert base64 to binary
  base64ToBinary(base64) {
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes
  }

  // Check if token needs refresh
  needsTokenRefresh() {
    return !this.accessToken || Date.now() >= (this.tokenExpiryTime - 300000) // 5 minute buffer
  }

  // Ensure we have a valid access token
  async ensureValidToken() {
    if (this.needsTokenRefresh()) {
      await this.getServiceAccountToken()
    }
  }

  // Make authenticated request to Google Sheets API
  async makeApiRequest(endpoint, options = {}) {
    try {
      await this.ensureValidToken()
      
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${endpoint}`
      const headers = {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
      
      const response = await fetch(url, {
        ...options,
        headers
      })
      
      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Google Sheets API error: ${response.status} ${errorData}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // Create expense spreadsheet
  async createExpenseSpreadsheet(title = 'Expense Tracker') {
    try {
      console.log('Creating new expense spreadsheet...')
      
      await this.ensureValidToken()
      
      const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: {
            title: title
          },
          sheets: [{
            properties: {
              title: 'Expenses'
            }
          }]
        })
      })
      
      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Failed to create spreadsheet: ${response.status} ${errorData}`)
      }
      
      const spreadsheetData = await response.json()
      this.spreadsheetId = spreadsheetData.spreadsheetId
      
      // Add header row
      await this.setupHeaderRow()
      
      console.log('Spreadsheet created:', this.spreadsheetId)
      console.log('⚠️ IMPORTANT: Add this to your environment variables:')
      console.log(`VITE_SPREADSHEET_ID=${this.spreadsheetId}`)
      
      return this.spreadsheetId
    } catch (error) {
      console.error('Error creating spreadsheet:', error)
      throw error
    }
  }

  // Setup header row in the spreadsheet
  async setupHeaderRow() {
    const headers = ['Date', 'Amount', 'Category', 'Description', 'Payment Method', 'Created At']
    
    await this.makeApiRequest(`${this.spreadsheetId}/values/Expenses!A1:F1`, {
      method: 'PUT',
      body: JSON.stringify({
        values: [headers]
      })
    })
    
    console.log('Header row added to spreadsheet')
  }

  // Add expense to Google Sheets
  async addExpense(expense) {
    try {
      if (!this.spreadsheetId) {
        throw new Error('No spreadsheet ID configured')
      }
      
      console.log('Adding expense to Google Sheets:', expense)
      
      const row = [
        expense.date,
        expense.amount,
        expense.category,
        expense.description || '',
        expense.paymentMethod || '',
        new Date().toISOString()
      ]
      
      const result = await this.makeApiRequest(`${this.spreadsheetId}/values/Expenses!A:F:append`, {
        method: 'POST',
        body: JSON.stringify({
          values: [row]
        }),
        params: new URLSearchParams({
          valueInputOption: 'USER_ENTERED',
          insertDataOption: 'INSERT_ROWS'
        })
      })
      
      console.log('Expense added to Google Sheets successfully')
      return result
    } catch (error) {
      console.error('Error adding expense to Google Sheets:', error)
      throw error
    }
  }

  // Get all expenses from Google Sheets
  async getExpenses() {
    try {
      if (!this.spreadsheetId) {
        return []
      }
      
      console.log('Loading expenses from Google Sheets...')
      
      const result = await this.makeApiRequest(`${this.spreadsheetId}/values/Expenses!A2:F`)
      
      if (!result.values) {
        return []
      }
      
      const expenses = result.values.map((row, index) => ({
        id: index + 2, // Row number (starting from 2)
        date: row[0] || '',
        amount: parseFloat(row[1]) || 0,
        category: row[2] || '',
        description: row[3] || '',
        paymentMethod: row[4] || '',
        createdAt: row[5] || '',
        synced: true
      }))
      
      console.log(`Loaded ${expenses.length} expenses from Google Sheets`)
      return expenses
    } catch (error) {
      console.error('Error getting expenses from Google Sheets:', error)
      throw error
    }
  }

  // Check if service is ready
  isReady() {
    return this.isInitialized && this.accessToken
  }

  // Get spreadsheet ID
  getSpreadsheetId() {
    return this.spreadsheetId
  }

  // Set spreadsheet ID
  setSpreadsheetId(id) {
    this.spreadsheetId = id
  }
}

// Export singleton instance
const googleSheetsServiceAccount = new GoogleSheetsServiceAccount()
export default googleSheetsServiceAccount
