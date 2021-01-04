import Input from "./Input";
import { useContext, useEffect, useReducer } from "react";
import { SocketContext } from "./Wrapper";

function messagesReducer(state, action) {
  return { messages: [...state.messages, action.type] };
}
function membersReducer(state, action) {
  return { members: action.type };
}

function Game(props) {
  const socket = useContext(SocketContext);
  const [messages, messagesDispatch] = useReducer(messagesReducer, {
    messages: [],
  });
  const [members, membersDispatch] = useReducer(membersReducer, {
    members: [props.name],
  });
  useEffect(() => {
    // handling message
    const messageCallback = (msg) => {
      messagesDispatch({ type: { text: msg, timestamp: `${Date.now()}` } });
    };
    socket.on("serverMessage", messageCallback);
    // handling members
    const membersCallback = (members) => {
      membersDispatch({ type: members });
    };
    socket.on("serverMemberJoin", membersCallback);
    socket.emit("clientMemberJoin", props.name);
    return () => {
      socket.removeListener("serverMessage", messageCallback);
      socket.removeListener("serverMemberJoin", membersCallback);
    };
  }, []);
  useEffect(() => {
    const chat = document.getElementById("chat");
    chat.scrollTop = chat.scrollHeight;
    // https://stackoverflow.com/questions/270612/scroll-to-bottom-of-div
  });
  return (
    <div className="columns">
      <div className="column">
        <div className="notification is-black" style={{ border: "3px solid" }}>
          <p>メンバー</p>
          <hr />
          <div style={{ maxHeight: "500px", overflow: "auto" }}>
            {members.members.map((member) => (
              <p key={member}>{member}</p>
            ))}
          </div>
        </div>
      </div>
      <div className="column">
        <div className="notification is-black" style={{ border: "3px solid" }}>
          <p>チャット</p>
          <hr />
          <div id="chat" style={{ maxHeight: "500px", overflow: "auto" }}>
            {messages.messages.map((msg) => (
              <p key={msg.timestamp}>{msg.text}</p>
            ))}
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
