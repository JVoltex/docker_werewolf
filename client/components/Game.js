import Input from "./Input";
import { useContext, useEffect, useState } from "react";
import { SocketContext } from "./Wrapper";

function Game() {
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState("「入室しました");
  const socket = useContext(SocketContext);
  useEffect(() => {
    console.log("game effect");
    const callback = (msg) => {
      console.log(msg);
      setMessages(messages + msg);
    };
    socket.on("fromServerBroadcast", callback);
    return () => socket.removeListener("fromServer", callback);
  }, []);
  return (
    <div className="columns">
      <div className="column">
        <div className="notification is-black" style={{ border: "3px solid" }}>
          <p>メンバー</p>
          <hr />
          <div style={{ maxHeight: "500px", overflow: "auto" }}>
            <p>占い師</p>
            <p>狩人</p>
            <p>霊媒師</p>
          </div>
        </div>
      </div>
      <div className="column">
        <div className="notification is-black" style={{ border: "3px solid" }}>
          <p>チャット</p>
          <hr />
          <div style={{ maxHeight: "500px", overflow: "auto" }}>
            <p>{messages}</p>
          </div>
          <Input
            prompt="メッセージ"
            button="▶おくる"
            onSubmit={(msg) => {
              socket.emit("fromClientChat", msg);
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default Game;
