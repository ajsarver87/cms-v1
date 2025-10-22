import './App.css';
import { LoginSignup } from './Components/Auth/LoginSignup';
import React, { useState } from 'react';

const apiUrl = process.env.REACT_APP_API_URL || '';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    try {
      const response = await fetch(`${apiUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        setIsLoggedIn(false);
      } else {
        alert("Logout failed. Please try again.");
      }
    } catch (error) {
      console.error('Error during logout:', error);
      alert('An error occurred during logout.');
    }
  };

  return (
    <div>
      {/*Conditionally render based on login state*/}
      {isLoggedIn ? (
        <div className='container'>
          <div className='header'>
            <div className="text">Welcome!</div>
            <div className="underline"></div>
          </div>
          <p style={{ textAlign: 'center' }}>You are logged in.</p>
          <div className="submit" onClick={handleLogout}>Logout</div>
        </div>
      ) : (
        <LoginSignup onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

export default App;
