import React, { Component } from 'react';
import logo from './svg-rocket.svg';
import './App.css';
import Board from './Board.js';

// todo: flow
// todo: jest test

class App extends Component {

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">React Scorch</h1>
        </header>
        <Board/>
      </div>
    );
  }
}

export default App;
