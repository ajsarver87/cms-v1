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
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errors, setErrors] = useState({});

  /// --- Validation Logic ---
  const validateForm = () => {
    const newErrors = {};

    /// Username Validation
    if (!userName) {
      newErrors.userName = "Username is required";
    }

    /// Password Validation
    if (!password) {
      newErrors.password = "Password is required";
    }

    if (action === "Sign Up") {
      /// First and Last Name Validation
      if (!firstName) {
        newErrors.firstName = "First Name is Required";
      }
      if (!lastName) {
        newErrors.lastName = "Last Name is Required";
      }

      /// Email Validation
      const emailPattern = /\S+@\S+\.\S+/;
      if (!email) {
        newErrors.email = "E-Mail is required";
      } else if (!emailPattern.test(email)) {
        newErrors.email = "E-Mail is invalid";
      }

      /// password length validation
      if (password.length < 8) {
        newErrors.password = "Password must be at least 8 characters long";
      }

      /// Confirm Password Validation
      if (password !== confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    /// Return true is no Errors
    return Object.keys(newErrors).length === 0;
  }

  /// --- Function to handle Sign Up POST request ---
  const handleSignUp = async () => {
    if (action === "Login") {
      setAction("Sign Up");
      setErrors({});
      return;
    }

    /// Stop if validation fails
    if (!validateForm()) return;

    /// 1. Create the user data object from state variables
    const userData = {
      username: userName,
      email: email,
      password: password,
      first_name: firstName,
      last_name: lastName,
    };

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
        alert(`Error: ${errorData.detail}`);
        return;
      }

      const result = await response.json();
      alert(`User ${result.username} registered successfully!`);
      setAction("Login");
      setErrors({});
    } catch (error) {
      console.error('Error during sign up:', error);
      alert('An error occurred. Please try again later.');
    }
  };

  /// --- Function to handle login POST request ---
  const handleLogin = async () => {
    if (action === "Sign Up") {
      setAction("Login");
      setErrors({});
      return;
    }

    if (!validateForm()) return;

    /// 1. Create the login data object from state variables
    const loginData = new URLSearchParams();
    loginData.append('username', userName);
    loginData.append('password', password);

    /// 2. Make the POST request using the fetch API
    try {
      const response = await fetch('http://localhost:8000/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: loginData,
      });

      /// 3. Handle the response
      if (!response.ok) {
        const errorData = await response.json();
        alert(`Error: ${errorData.detail}`);
        return;
      }

      const result = await response.json();
      alert(`Login successful! Token: ${result.access}`);
      localStorage.setItem('token', result.access);
      setErrors({});
    } catch (error) {
      console.error('Error during login:', error);
      alert('An error occurred. Please try again later.');
    }
  };

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
            {errors.firstName && <p className="error-message">{errors.firstName}</p>}
            {errors.lastName && <p className="error-message">{errors.lastName}</p>}

            <div className="input">
              <img src={email_icon} alt="" />
              <input
                type="email"
                placeholder="E-Mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {errors.email && <p className="error-message">{errors.email}</p>}
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
        {errors.userName && <p className="error-message">{errors.userName}</p>}

        <div className="input">
          <img src={password_icon} alt="" />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {errors.password && <p className="error-message">{errors.password}</p>}

        {action === "Sign Up" && (
          <div>
            <div className="input">
              <img src={password_icon} alt="" />
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            {errors.confirmPassword && <p className="error-message">{errors.confirmPassword}</p>}
          </div>
        )}

        {action === "Sign Up" ? <div></div> : <div className="forgot-password">Lost Password? <span>Click Here!</span></div>}
        <div className="submit-container">
          <div className={action === "Login" ? "submit gray" : "submit"} onClick={() => handleSignUp()}>Sign Up</div>
          <div className={action === "Sign Up" ? "submit gray" : "submit"} onClick={() => handleLogin()}>Login</div>
        </div>
      </div>
    </div>
  )
}
