import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './login';
import MainScreen from './mainContent'; // Import the MainScreen component
import CreateAccount from './CreateAccount';
import LoggedInUserContent from './loggedContent'
import AdminDashboard from './admin';
import PdfViewer from './policies';
//this will handle all the routes

const App = () => {
  return (
    <Router>
      <Routes>
        
        <Route path="/login" element={<Login />} />
        <Route path="/mainContent" element={<MainScreen />} />
        <Route path="/CreateAccount" element={<CreateAccount />} />
        <Route path="/loggedContent" element={<LoggedInUserContent />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/policies" element={<PdfViewer />} />
        
      </Routes>
    </Router>
  );
};

export default App;