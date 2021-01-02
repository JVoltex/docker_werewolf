import Welcome from "../components/Welcome";
import Game from "../components/Game";
import Wrapper, { PhaseDispatch, SocketContext } from "../components/Wrapper";
import { useState, useEffect, useContext } from "react";

function Main(props) {
  switch (props.phase) {
    case "welcome":
      return <Welcome />;
    case "game":
      return <Game />;
    default:
      return "loading...";
  }
}

function App() {
  return (
    <div className="hero is-fullheight is-black">
      <div className="hero-body">
        <div className="container">
          <Wrapper>
            <Main />
          </Wrapper>
        </div>
      </div>
    </div>
  );
}
export default App;
