import React from 'react'

function AppSimple() {
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <h1 style={{ color: 'red', fontSize: '32px' }}>BASIC TEST</h1>
      <p style={{ fontSize: '18px', marginTop: '16px' }}>This is a basic React test with inline styles.</p>
      <div style={{ marginTop: '16px', padding: '16px', backgroundColor: 'lightgreen' }}>
        <p>If you can see this, React is working!</p>
      </div>
    </div>
  )
}

export default AppSimple
