import { createContext, useReducer, cloneElement } from "react";
import io from "socket.io-client";

const PhaseDispatch = createContext(null);
const NameDispatch = createContext(null);
const SocketContext = createContext(io());

function phaseReducer(state, action) {
  return { phase: action.type };
}
function nameReducer(state, action) {
  return { name: action.type };
}

function Wrapper(props) {
  const [phase, phaseDispatch] = useReducer(phaseReducer, { phase: "welcome" });
  const [name, nameDispatch] = useReducer(nameReducer, { name: "unknown" });
  return (
    <PhaseDispatch.Provider value={phaseDispatch}>
      <NameDispatch.Provider value={nameDispatch}>
        {cloneElement(props.children, { phase: phase.phase, name: name.name})}
      </NameDispatch.Provider>
    </PhaseDispatch.Provider>
  );
}

export { Wrapper as default, PhaseDispatch, SocketContext, NameDispatch };
