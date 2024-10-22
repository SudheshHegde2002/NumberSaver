// src/App.js
import React from 'react';
import Recognizer from './Components/Recognizer';
import './App.css';  // Import the CSS file

const App = () => {
  return (
    <div className="container"> {/* Use the container class */}
      <h1>Phone Number Recognizer</h1>
      <Recognizer />
    </div>
  );
};

export default App;
