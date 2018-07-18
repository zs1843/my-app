import React, { Component } from 'react';
import './App.css';

class App extends Component {
  constructor(props){
    super(props);
    this.state = {
      isOpen: false,
    }
  }

  componentDidMount(){
    this.doPromise();
    // var svgCaptcha = require('svg-captcha');

// var captcha = svgCaptcha.create();

// console.log(captcha);
  }

  showModal = () => {
    this.setState({
      isOpen: true,
    })
  }

  doPromise = async() => {
    const p1 = new Promise((resolve,reject)=>{resolve(1)});
    const p2 = new Promise((resolve,reject)=>{resolve(2)});
    const p3 = new Promise((resolve,reject)=>{resolve(3)});
    const _await = new Promise((a, b)=>{a()});
    p1.then(_p1=>{
      console.log(_p1, _await);
      return p2;
    }).then(_p2=>{
      console.log(_p2);
      return p3;
    }).then(_p3=>{
      console.log(_p3);
    }).catch(err=>{
      console.log(err);
    })
  }


  render() {
    return (
      <div className="App">
      dasd
      </div>
    );
  }
}

export default App;
