import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import Home from './Pages/Home';
import Results from './Pages/Results';
import './App.css';

function App() {
  return (
    <div className="App">
      <Router>
        <Route exact path="/" component={Home} />
        <Route path="/results" component={Results} />
      </Router>
    </div>
  );
}

export default App;
