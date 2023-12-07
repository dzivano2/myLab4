import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './create.css'; // Import the CSS file

function CreateAccount() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState(''); 
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log('Creating an account with', email, password);
  
    try {
      const response = await fetch('/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });
  
      if (response.ok) {
        console.log('Account created successfully');
        navigate('/login'); // Navigate to login on success
      } else {
        console.log('Failed to create account');
        setErrorMessage('Failed to create account')
        
      }
    } catch (error) {
      console.error('There was an error creating the account:', error);
    }
  };
  

  return (
    <div className="create-account-container">
      <h1 className='header'>Create Account</h1>
      <form className="create-account-form" onSubmit={handleSubmit}>
        {/* Email field */}
        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
        <button type="submit">Create Account</button>
        {errorMessage && <div className="error-message">Error: {errorMessage}</div>}
      </form>

      {/* Return to Home button */}
      <div className="return-home-button">
        <button onClick={() => navigate('/mainContent')}>Return to Home</button>
      </div>
    </div>
  );
}

export default CreateAccount;
