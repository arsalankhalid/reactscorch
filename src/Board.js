import React, { Component } from 'react';
import './App.css';
import MJS from 'matter-js';
global.decomp = require('poly-decomp');

// todo: manage board canvas size, as maybe relational to screen size by scaling the world

class Board extends Component {

  // constructor arguments
  initialAngle = '90';
  state = { turn: 'A',
            angleA: this.initialAngle,
            angleB: this.initialAngle,
            forceA: 15,
            forceB: 15,
            gameOver: "-" 
          };
  canvasRef = React.createRef(); // react 16.3 new ref API
  size = { height: 550,
           width: 800,
           scale: 1 // todo: scale by screen size
         };
  bullet = {collisionCount: 0, 
            inFlight: false};


  componentDidMount() {
    // initialize matter.js
    this.initMJS();
  }

  componentWillUnmount() {
    // todo: distruct matter.js?
  }

  initMJS = () => {
    ////////////////////////////////////////////////
    // module aliases
    let Engine = MJS.Engine,
        Render = MJS.Render,
        World = MJS.World,
        Events = MJS.Events,
        //MouseConstraint = MJS.MouseConstraint,
        //Mouse = MJS.Mouse,
        //Vertices = MJS.Vertices,
        //Body = MJS.Body,
        Bodies = MJS.Bodies;

    // create an engine
    this.engine = Engine.create();

    // create a renderer
    let render = Render.create({
      element: this.canvasRef.current,
      engine: this.engine,
      options: {
        width: this.size.width,
        height: this.size.height,
        wireframes: false,
        background: this.getRandomColor() //"LightGray"
      }
    });

    let bodies = [];

    ////////////////////////////////////////////////
    // create static landscape

    let baseGround = Bodies.rectangle(this.size.width/2, 
                                      this.size.height-10, this.size.width, 20,
                                      { isStatic: true, label: "ground-base",
                                        render: {fillStyle: "DarkSlateGrey"}
                                      });
    let leftWall = Bodies.rectangle(-10, this.size.height/2, 20, this.size.height*2,
                                    { isStatic: true, label: "ground-base",
                                      render: {fillStyle: "DarkSlateGrey"}
                                    });
    let rightWall = Bodies.rectangle(this.size.width+10, this.size.height/2, 20, this.size.height*2,
                                    { isStatic: true, label: "ground-base",
                                      render: {fillStyle: "DarkSlateGrey"}
                                    });
    bodies.push(baseGround);
    bodies.push(leftWall);
    bodies.push(rightWall);

    let elementSize = 5,
        maxHeight = 300,
        smootherSize = 10,
        modifier = 0,
        maxElements = Math.floor(maxHeight/elementSize),
        x, y, i, j, k, rect;

    j = Math.floor(Math.random() * maxElements + 1);
    for (k = 0; k < Math.floor(this.size.width/elementSize)+1; k++) {
      if (k % smootherSize === 0) {
        modifier = Math.floor(Math.random() * 3 - 1);
        if (j === 1) {modifier++}
        else if (j === maxElements) {modifier--};
      };
      j = j + Math.floor(Math.random() * 3 - 1 + modifier);
      if (j<1) {j=1}
      else if (j>maxElements) {j=maxElements};
      for (i = 0; i < j; i++) {
        x = (k * elementSize);
        y = this.size.height - 10 - (i * elementSize);
        rect = Bodies.rectangle(x, y, elementSize, elementSize, 
                                { isStatic: true, label: "ground-element",
                                  render: {fillStyle: "DarkSlateGrey"}
                                });
        bodies.push(rect);
      }
    }

    ////////////////////////////////////////////////
    // create two player sprites
    let radius = 50;
    x = Math.floor((Math.random() * this.size.width/4) + 1);
    this.playerA = Bodies.circle(radius+x, 1, 20, {
      isStatic: false,
      label: "player-a",
      render: {
        sprite: {
          texture: "https://opengameart.org/sites/default/files/styles/medium/public/ship9.png",
          xScale: 0.15,
          yScale: 0.15
        }
      }
    });
    bodies.push(this.playerA);

    x = Math.floor((Math.random() * this.size.width/4) + 1);
    this.playerB = Bodies.circle(this.size.width-radius-x, 1, 20, {
      isStatic: false,
      label: "player-b",
      render: {
        sprite: {
          texture: "https://opengameart.org/sites/default/files/styles/medium/public/ship9b_0.png",
          xScale: 0.15,
          yScale: 0.15
        }
      }
    });
    bodies.push(this.playerB);

    ////////////////////////////////////////////////
    // add all of the bodies to the world
    World.add(this.engine.world, bodies);
    
    // run the engine
    Engine.run(this.engine);

    // run the renderer
    Render.run(render);

    // add collision listener (active, start, end)
    Events.on(this.engine, 'collisionStart', this.onCollision);
    Events.on(this.engine, 'collisionEnd', this.onCollision);
    //Events.on(this.engine, 'collisionActive', this.onCollision);

    ////////////////////////////////////////////////
    // add mouse control
    /*
    let mouse = Mouse.create(render.canvas),
        mouseConstraint = MouseConstraint.create(
          this.engine, {
              mouse: mouse,
              constraint: {
                  stiffness: 0.2,
                  render: {
                      visible: false
                  }
              }
          });

    World.add(this.engine.world, mouseConstraint);

    // keep the mouse in sync with rendering
    //this.render.mouse = mouse;

    // register events
    Events.on(mouseConstraint, "mousedown", this.onCanvasClick)
    */
  };

  /*
  onCanvasClick = (e) => {
    let {x, y} = e.mouse.mousedownPosition;
    console.log ("clicked: " + x + ", " + y); //JSON.stringify
  }
  */

  onCollision = (e) => {
    let i,
        pair,
        pairs = e.pairs, 
        Body = MJS.Body,
        World = MJS.World;

    for (i = 0; i < pairs.length; i++) {
      pair = pairs[i];
      //console.log ("Collision of A: " + pair.bodyA.label + ", B: " + pair.bodyB.label)

      ///////////////////////////////////////////
      // handle initial player sprite positioning
      if (pair.bodyA.label.startsWith("player") && pair.bodyB.label.startsWith("ground")) {
        Body.setStatic(pair.bodyA, true); 
        //Body.setPosition(pair.bodyA, {x: pair.bodyA.position.x-15, y: pair.bodyA.position.y});
        Body.setAngle(pair.bodyA, 0);
      };
      if (pair.bodyB.label.startsWith("player") && pair.bodyA.label.startsWith("ground")) {
        Body.setStatic(pair.bodyB, true);
        //Body.setPosition(pair.bodyB, {x: pair.bodyB.position.x-15, y: pair.bodyB.position.y});
        Body.setAngle(pair.bodyB, 0);
      };

      ///////////////////////////////////////////
      // handle bullet collisions
      if (pair.bodyA.label.startsWith("bullet") || pair.bodyB.label.startsWith("bullet")) {
        this.bullet.collisionCount++;
        let bullet = pair.bodyA.label.startsWith("bullet") ? pair.bodyA : pair.bodyB;

        if (this.bullet.collisionCount > 2) { // first two collisions are on firing
          this.nextTurn();
          this.bullet = { collisionCount: 0, 
                          inFlight: false};
          Body.scale(bullet, 5, 5);
          World.remove(this.engine.world, [bullet]);

          if (pair.bodyA.label.startsWith("ground-element")) {
            World.remove(this.engine.world, [pair.bodyA]);
          }
          else if (pair.bodyB.label.startsWith("ground-element")) {
            World.remove(this.engine.world, [pair.bodyB]);
          }

          if (pair.bodyA.label.startsWith("player") || pair.bodyB.label.startsWith("player")) {
            //console.log ("game over");
            if (pair.bodyA.label.startsWith("player")) {
              this.setState({gameOver: pair.bodyA.label});
            };
            if (pair.bodyB.label.startsWith("player")) {
              this.setState({gameOver: pair.bodyB.label});
            };
          }
        }
      }  
    }
  }

  onAngleChange = (e) => {
    let Body = MJS.Body;
    let value = e.target.value;

    if (this.state.turn === 'A') {
      this.setState({
        angleA: value
      });
      Body.setAngle(this.playerA, (value-90)*Math.PI/180);
    } else {
      this.setState({
        angleB: value
      });
      Body.setAngle(this.playerB, (value-90)*Math.PI/180);
    }
    //console.log (e.target.value);
  }

  onForceChange = (e) => {
    let value = e.target.value;

    if (this.state.turn === 'A') {
      this.setState({
        forceA: value
      });
    } else {
      this.setState({
        forceB: value
      });
    }
    //console.log (e.target.value);
  }

  onAttack = (e) => {
    if (this.readyToAttack()) {
      this.bullet = {collisionCount: 0, inFlight: true};
      let Body = MJS.Body,
          Bodies = MJS.Bodies,
          World = MJS.World,
          player = this.getPlayer(),
          bullet = Bodies.circle(player.position.x, player.position.y, 5, 
                                 { isStatic: false, label: "bullet" });
      Body.setVelocity(bullet, this.getVelocity());
      World.add(this.engine.world, [bullet]);
    }
  }

  nextTurn = () => {
    if (this.bullet.inFlight) {
      this.setState(function(prevState, props) {
        return {
          turn: (prevState.turn === 'A') ? 'B' : 'A'
        };
      });
      //console.log ("next turn");
    }
  }

  getPlayer = () => {
    return ((this.state.turn === 'A') ? this.playerA : this.playerB);
  }

  getAngle = () => {
    return ((this.state.turn === 'A') ? this.state.angleA : this.state.angleB);
  }
  
  getForce = () => {
    return ((this.state.turn === 'A') ? this.state.forceA : this.state.forceB);
  }

  getVelocity = () => {
    return ({ x: -1*this.getForce()*Math.cos(Math.PI/180*(this.getAngle())), 
              y: -1*this.getForce()*Math.sin(Math.PI/180*(this.getAngle())) });
  }

  readyToAttack = () => {
    // if both players are in place
    return (this.playerA.isStatic && this.playerB.isStatic && !this.bullet.inFlight);
  }

  getRandomColor = () => {
    let letters = '0123456789ABCDEF',
        color = '#',
        i;
    for (i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  // todo: one shot state, detect hit, damage, missile with mass on tip
  // todo: switch turns, victory, end/new game

  render() {
    let angle = this.getAngle(),
        force = this.getForce();
    let controls;

    if (this.state.gameOver === '-') {
      controls =  <div className="Board-controlers">
                    <p className="Board-turn">Player {this.state.turn}</p>
                    <div className="Board-angle">
                      <p>Angle: {angle}</p>
                      <input type="range" name="angle"
                            min='20' max='160' step='1' 
                            value={angle} onChange={this.onAngleChange} />
                    </div>
                    <div className="Board-force">
                      <p>Force: {force}</p>
                      <input type="range" name="angle"
                            min='5' max='25' step='1' 
                            value={force} onChange={this.onForceChange} />
                    </div>
                    <input className="Board-attack" type="image" alt="attack"
                          onClick={this.onAttack}
                          src="https://www.freeiconspng.com/uploads/nuclear-explosion-png-10.png" />
                  </div>;
    } else {
      let won = (this.state.gameOver === "player-a") ? "Player B" : "Player A"
      controls = <p className="Board-gameover">Game Over: {won} Won</p>;
    }

    return (
      <div className="Board">
        <div className="Board-canvas" ref={this.canvasRef}></div>
        {controls}
      </div>
    );
  }
}

export default Board;
