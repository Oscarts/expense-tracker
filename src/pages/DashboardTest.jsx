import React from 'react'

const DashboardTest = () => {
  return (
    <div style={{ padding: '20px', backgroundColor: '#f8f9fa' }}>
      <h1 style={{ color: '#333', fontSize: '32px', marginBottom: '20px' }}>
        🎉 Expense Tracker - Working!
      </h1>
      <p style={{ fontSize: '18px', color: '#666', marginBottom: '20px' }}>
        If you can see this message, the React app is working correctly.
      </p>
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#d4edda', 
        border: '1px solid #c3e6cb',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3 style={{ color: '#155724', margin: '0 0 10px 0' }}>✅ Status Check</h3>
        <ul style={{ color: '#155724', margin: 0, paddingLeft: '20px' }}>
          <li>React is loading ✅</li>
          <li>Components are rendering ✅</li>
          <li>Styles are working ✅</li>
          <li>Router is functional ✅</li>
        </ul>
      </div>
      <p style={{ fontSize: '14px', color: '#888' }}>
        Current time: {new Date().toLocaleString()}
      </p>
    </div>
  )
}

export default DashboardTest
