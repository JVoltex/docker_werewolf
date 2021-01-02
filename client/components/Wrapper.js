import { createContext, useReducer, cloneElement } from "react";
import io from "socket.io-client";

const PhaseDispatch = createContext(null);
const SocketContext = createContext(null);

function reducer(state, action) {
  return { phase: action.type };
}

function Wrapper(props) {
  const [state, dispatch] = useReducer(reducer, { phase: "welcome" });
  const socket = io();
  return (
    <PhaseDispatch.Provider value={dispatch}>
      <SocketContext.Provider value={socket}>
        {cloneElement(props.children, { phase: state.phase })}
      </SocketContext.Provider>
    </PhaseDispatch.Provider>
  );
}

export { Wrapper as default, PhaseDispatch, SocketContext };
