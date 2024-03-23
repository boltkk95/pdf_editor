// SignOut.js

import React from 'react';
import { useNavigate } from 'react-router-dom';

const SignOut = () => {
  const navigate = useNavigate();

  const handleSignOut = () => {
    // Clear the token from localStorage
    localStorage.removeItem('token');
    // Redirect to the login page or any other page
    navigate('/login');
  };

  return (
    <button onClick={handleSignOut}>Sign Out</button>
  );
};

export default SignOut;
