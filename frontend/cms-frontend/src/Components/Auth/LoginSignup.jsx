import React, { useState } from 'react'
import './LoginSignup.css'

import user_icon from '../Assets/person.png'
import email_icon from '../Assets/email.png'
import password_icon from '../Assets/password.png'

export const LoginSignup = () => {

  /// State to toggle between Login and Sign Up
  const [action, setAction] = useState("Sign Up")

  /// State Variables to store input field values
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  /// --- Function to handle Sign Up POST request ---
  const handleSignUp = async () => {
    if (action === "Login") {
      return;
    }

    /// 1. Create the user data object from state variables
    const userData = {
      username: userName,
      email: email,
      password: password,
      first_name: firstName,
      last_name: lastName,
    }

    /// 2. Make the POST request using the fetch API
    try {
      const response = await fetch('http://localhost:8000/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      /// 3. Handle the response
      if (!response.ok) {
        const errorData = await response.json();
        alert('Error: ${errorData.detail}');
        return;
      }

      const result = await response.json();
      alert('User ${result.username} registered successfully!');
      setAction("Login");
    } catch (error) {
      console.error('Error during sign up:', error);
      alert('An error occurred. Please try again later.');
    }
  };

  /// --- Function to handle login POST request ---
  const handleLogin = async () => {
    if (action === "Sign Up") {
      return;
    }
    alert("Login functionality to be implemented");
  }

  return (
    <div className='container'>
      <div className="header">
        <div className="text">{action}</div>
        <div className="underline"></div>
      </div>
      <div className="inputs">
        {/* Conditionally render the Name input field for Sign Up */}
        {action === "Sign Up" && (
          <div>
            <div className="name-inputs">
              <div className="input">
                <img src={user_icon} alt="" />
                <input
                  type="text"
                  placeholder='First Name'
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="input">
                <img src={user_icon} alt="" />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
            <div className="input">
              <img src={email_icon} alt="" />
              <input
                type="email"
                placeholder="E-Mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
        )}
        <div className="input">
          <img src={user_icon} alt="" />
          <input
            type="text"
            placeholder="Username"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
        </div>
        <div className="input">
          <img src={password_icon} alt="" />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {action === "Sign Up" ? <div></div> : <div className="forgot-password">Lost Password? <span>Click Here!</span></div>}
        <div className="submit-container">
          <div className={action === "Login" ? "submit gray" : "submit"} onClick={() => setAction("Sign Up")}>Sign Up</div>
          <div className={action === "Sign Up" ? "submit gray" : "submit"} onClick={() => setAction("Login")}>Login</div>
        </div>
      </div>
    </div>
  )
}
