import Input from "./Input";
import { useContext, useEffect, useReducer } from "react";
import { SocketContext } from "./Wrapper";

function messagesReducer(state, action) {
  return { messages: state.messages + action.type };
}
function membersReducer(state, action) {
  return { members: action.type }; // return unique members
}

function Game(props) {
  const socket = useContext(SocketContext);
  // handling messages
  const [messages, messagesDispatch] = useReducer(messagesReducer, {
    messages: "「入室しました",
  });
  useEffect(() => {
    console.log("messages effect");
    const callback = (msg) => {
      messagesDispatch({type: msg});
    };
    socket.on("serverMessage", callback);
    return () => socket.removeListener("ServerBroadcast", callback);
  }, []);
  // handling members
  const [members, membersDispatch] = useReducer(membersReducer, {
    members: [props.name],
  });
  useEffect(() => {
    console.log("members effect")
    const callback = (members) => {
      membersDispatch({type: members})
    }
    socket.on("serverMemberJoin", callback)
    socket.emit("clientMemberJoin", props.name)
    return () => socket.removeListener("ServerMemberJoin", callback)
  }, [])
  return (
    <div className="columns">
      <div className="column">
        <div className="notification is-black" style={{ border: "3px solid" }}>
          <p>メンバー</p>
          <hr />
          <div style={{ maxHeight: "500px", overflow: "auto" }}>
            <p>{props.name}</p>
            <p>{members.members}</p>
          </div>
        </div>
      </div>
      <div className="column">
        <div className="notification is-black" style={{ border: "3px solid" }}>
          <p>チャット</p>
          <hr />
          <div style={{ maxHeight: "500px", overflow: "auto" }}>
            <p>{messages.messages}</p>
          </div>
          <Input
            prompt="メッセージ"
            button="▶おくる"
            onSubmit={(msg) => {
              socket.emit("clientMessage", msg);
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default Game;
