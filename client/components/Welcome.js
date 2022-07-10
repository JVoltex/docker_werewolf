import Input from "./Input";
import { useContext, useEffect, useReducer } from "react";
import { SocketContext, PhaseDispatch, NameDispatch } from "./Wrapper";

function registeredMembersInfoReducer(state, action) {
    return action;
}

function Welcome() {
  const phaseDispatch = useContext(PhaseDispatch);
  const nameDispatch = useContext(NameDispatch);
  const socket = useContext(SocketContext);
 
  const [registeredMembersInfo, registeredMembersInfoDispatch] = useReducer(registeredMembersInfoReducer, []);
 
  
  useEffect(() => {
    // handling RegisteredMemberInfo
    socket.on("serverRegisteredMembersInfo", registeredMembersInfoDispatch);
    return () => {
      socket.removeListener("serverRegisteredMembersInfo", registeredMembersInfoDispatch);
    };
  }, []);

  
  return (
    <div className="columns is-vcentered">
      <div className="column is-8">
        <div className="notification is-black">
          <p>村長「はるばるとようこそ。</p>
          <p>村長「まずは名前を聞かせておくれ。</p>
        </div>
      </div>
      <div className="column">
        {console.log("render Input")}
        {console.log(registeredMembersInfo)}
        <Input
          prompt="名前"
          button="けってい"
          onSubmit={(name) => {
            if (name !== "") {
              nameDispatch({ type: name });
              phaseDispatch({ type: "game" });
            } else {
              alert("村長「こら、ちゃんと名乗れ！");
            }
          }}
          selectable={registeredMembersInfo.valid}
          options={registeredMembersInfo.registeredMembers}
        />
      </div>
    </div>
  );
}
export default Welcome;
