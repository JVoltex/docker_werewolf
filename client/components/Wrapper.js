import { createContext, useReducer, cloneElement } from "react";
import io from "socket.io-client";

const PhaseDispatch = createContext(null);
const SocketContext = createContext(io());

function reducer(state, action) {
  return { phase: action.type };
}

function Wrapper(props) {
  const [state, dispatch] = useReducer(reducer, { phase: "welcome" });
  return (
    <PhaseDispatch.Provider value={dispatch}>
        {cloneElement(props.children, { phase: state.phase })}
    </PhaseDispatch.Provider>
  );
}

export { Wrapper as default, PhaseDispatch, SocketContext };
