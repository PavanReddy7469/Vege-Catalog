import React from 'react'
import ReactDOM from 'react-dom/client'
// Change the import to use curly braces:
import  App  from './App.tsx'
import './index.css'; // This "activates" the Tailwind styles 

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)