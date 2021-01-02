import Welcome from "../components/Welcome";
import Config from "../components/Config";
import Game from "../components/Game";
import Wrapper, {PhaseDispatch, SocketContext} from "../components/Wrapper";
import { useState, useEffect, useContext } from "react";

function Main(props) {
  switch (props.phase) {
    case "welcome":
      return <Welcome />;
    case "config":
      return <Config />;
    case "day":
      return <Game />;
    case "night":
      return <Game />;
  }
}

function App() {
  useEffect(() => {
    //document.title = phase;
  });
  return (
      <div className="hero is-fullheight is-black">
        <div className="hero-body">
          <div className="container">
            <Wrapper>
              <Main phase={"welcome"} />
            </Wrapper>
          </div>
        </div>
      </div>
  );
}
export default App;
