import React, { useState } from 'react';
import { useNavigate,Link } from 'react-router-dom';

import './login.css';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState(''); 
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage(''); // Clear any existing error messages

    try {
      const response = await fetch('/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      });
  
      if (response.ok) {
        console.log('Logged in successfully');
        navigate('/loggedContent'); // Navigate on success
      } else {
        console.log('Failed to log in');
        setErrorMessage('Failed to log in. Please check your credentials.'); // Set an error message
      }
    } catch (error) {
      console.error('There was an error during login:', error);
      setErrorMessage('An error occurred during login. Please try again later.'); // Set an error message
    }
  };
  

  const handleReturn = () => {
    navigate('/mainContent'); 
  };

  return (
    <>
      <h1>Login - </h1>
      <form onSubmit={handleSubmit}>
        {/* Username (or Email) field */}
        <div>
          <label htmlFor="username">Username or Email:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        {/* Password field */}
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {/* Submit button */}
        <button type="submit">Login</button>
        {errorMessage && <div className="error-message">Error: {errorMessage}</div>}
      </form>

      {/* Return button */}
      <button className="return-button" onClick={handleReturn}>Return to Home</button>
      <div className='create-account'><p>Don't have an account?<Link to="/createAccount">Create one</Link></p></div>
    </>
  );
}

export default Login;
