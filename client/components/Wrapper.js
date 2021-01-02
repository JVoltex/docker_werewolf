import { createContext, useReducer } from "react";
import io from "socket.io-client";

const PhaseDispatch = createContext(null);
const SocketContext = createContext(null);

function reducer(state, action) {
  return { phase: action.type };
}

function Wrapper({ children }) {
  const [state, dispatch] = useReducer(reducer, { phase: "welcome" });
  const socket = io();
  return (
    <PhaseDispatch.Provider value={dispatch}>
      <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
    </PhaseDispatch.Provider>
  );
}

export { Wrapper as default, PhaseDispatch, SocketContext };
