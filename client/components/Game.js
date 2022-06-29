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
      messagesDispatch({
        type: { type: msg.type, text: msg.text, timestamp: `${Date.now()}`, value: msg.value},
      });
    };
    socket.on("serverMessage", messageCallback);
    // handling members
    const membersCallback = (members) => {
      membersDispatch({ type: members });
    };
    socket.on("serverMemberInfo", membersCallback);
    socket.emit("clientMemberJoin", props.name);
    return () => {
      socket.removeListener("serverMessage", messageCallback);
      socket.removeListener("serverMemberInfo", membersCallback);
    };
  }, []);
  useEffect(() => {
    const chat = document.getElementById("chat");
    chat.scrollTop = chat.scrollHeight;
    // https://stackoverflow.com/questions/270612/scroll-to-bottom-of-div
  });
  return (
    <div className="columns">
      {/* left column */}
      <Members members={members} />
      {/* right column */}
      <Chat messages={messages} />
    </div>
  );
}

export default Game;

function Members(props) {
  return (
    <div className="column">
      <div className="notification is-black" style={{ border: "3px solid" }}>
        <p>メンバー</p>
        <hr />
        <div style={{ maxHeight: "450px", overflow: "auto" }}>
          {props.members.members.map((member) => {
            return <Member alive={member.alive} name={member.name} />;
          })}
        </div>
      </div>
    </div>
  );
}

function Member(props) {
  if (props.alive) {
    return <p key={props.name}>{props.name}</p>;
  } else {
    return (
      <p key={props.name} style={{ color: "gray" }}>
        {props.name}
      </p>
    );
  } 
}

function Chat(props) {
  const socket = useContext(SocketContext);
  const messages = props.messages;
  return (
    <div className="column">
      <div className="notification is-black" style={{ border: "3px solid" }}>
        <p>チャット</p>
        <hr />
        <ChatHistory messages={messages}/>
        <Input
          prompt="メッセージ"
          button="▶おくる"
          onSubmit={(msg) => {
            if (msg !== "") socket.emit("clientMessage", msg);
          }}
        />
      </div>
    </div>
  );

}

function ChatHistory(props) {
  const messages = props.messages;

  const handleClickChoice = (e) => {
    const choice = e.target.dataset.id;
    console.log(choice)
    const textarea = document.getElementById("textarea");
    textarea.value = choice;
  };

  return (
    <div id="chat" style={{ maxHeight: "500px", overflow: "auto" }}>
    {messages.messages.map((msg) => {
      if (msg.type === "notification") {
        return (
          <div
            className="notification is-primary is-light my-1"
            key={msg.timestamp}
          >
            {msg.text}
          </div>
        );
      } else if (msg.type === "dead") {
        return (
          <p key={msg.timestamp} style={{ color: "gray" }}>
            {msg.text}
          </p>
        );
      } else if (msg.type === "clickable") {
        return (
          <p
            key={msg.timestamp}
            onClick={handleClickChoice}
            style={{ cursor: "pointer" }}
            data-id={msg.value}
          >
            {msg.text}
          </p>
        );
      } else {
        return <p key={msg.timestamp}>{msg.text}</p>;
      }
    })}
    </div>
  );
}