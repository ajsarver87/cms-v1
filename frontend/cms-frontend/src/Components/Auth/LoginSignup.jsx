import React, { useState } from 'react'
import './LoginSignup.css'

import user_icon from '../Assets/person.png'
import email_icon from '../Assets/email.png'
import password_icon from '../Assets/password.png'

///--- Constants
const MIN_PASSWORD_LENGTH = 8;
const SPECIAL_CHARACTERS = process.env.REACT_APP_SPECIAL_CHARACTERS || "!@#$%^&*";
const apiUrl = process.env.REACT_APP_API_URL || '';

if (!apiUrl) {
  console.error("REACT_APP_API_URL environment variable is not set.  API calls will fail.");
}

export const LoginSignup = ({ onLoginSuccess }) => {

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

      /// password length and complexity validation
      if (password && password.length < MIN_PASSWORD_LENGTH) {
        newErrors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`;
      } else if (password) {
        const complexityPattern = new RegExp(`^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[${SPECIAL_CHARACTERS.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]).{${MIN_PASSWORD_LENGTH},}$`);
        if (password && !complexityPattern.test(password)) {
          newErrors.password = `Password must include 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (${SPECIAL_CHARACTERS})`;
        }
      }

      /// Confirm Password Validation
      if (!confirmPassword) {
        newErrors.confirmPassword = "Confirm Password is required";
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    /// Return true if no Errors
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
      const response = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        credentials: 'include',
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
      const response = await fetch(`${apiUrl}/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: loginData,
        credentials: 'include',
      });

      /// 3. Handle the response
      if (!response.ok) {
        const errorData = await response.json();
        alert(`Error: ${errorData.detail}`);
        return;
      }

      const result = await response.json();
      alert(`Message: ${result.message}`);
      setErrors({});

      if (onLoginSuccess) {
        onLoginSuccess();
      }

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
                  aria-invalid={Boolean(errors.firstName)}
                  aria-describedby={errors.firstName ? "firstName-error" : undefined}
                />
              </div>
              <div className="input">
                <img src={user_icon} alt="" />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  aria-invalid={Boolean(errors.lastName)}
                  aria-describedby={errors.lastName ? "lastName-error" : undefined}
                />
              </div>
            </div>
            {errors.firstName && <p id="firstName-error" className="error-message">{errors.firstName}</p>}
            {errors.lastName && <p id="lastName-error" className="error-message">{errors.lastName}</p>}

            <div className="input">
              <img src={email_icon} alt="" />
              <input
                type="email"
                placeholder="E-Mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
            </div>
            {errors.email && <p id="email-error" className="error-message">{errors.email}</p>}
          </div>
        )}
        <div className="input">
          <img src={user_icon} alt="" />
          <input
            type="text"
            placeholder="Username"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            aria-invalid={Boolean(errors.userName)}
            aria-describedby={errors.userName ? "userName-error" : undefined}
          />
        </div>
        {errors.userName && <p id="userName-error" className="error-message">{errors.userName}</p>}

        <div className="input">
          <img src={password_icon} alt="" />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
          />
        </div>
        {errors.password && <p id="password-error" className="error-message">{errors.password}</p>}

        {action === "Sign Up" && (
          <div>
            <div className="input">
              <img src={password_icon} alt="" />
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                aria-invalid={Boolean(errors.confirmPassword)}
                aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
              />
            </div>
            {errors.confirmPassword && <p id="confirmPassword-error" className="error-message">{errors.confirmPassword}</p>}
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
