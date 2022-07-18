import Input from "./Input";
import MySelect from "./MySelect";
import { useContext, useEffect, useReducer } from "react";
import { SocketContext } from "./Wrapper";

function messagesReducer(state, action) {
  return { messages: [...state.messages, action.type] };
}
function membersReducer(state, action) {
  return { members: action.type };
}
function assignsReducer(state, action) {
  return action;
}
function rankingReducer(state, action) {
  return action;
}
function rankingTitleReducer(state, action) {
  return action;
}
function voteReducer(state, action) {
  return action;
}

function Game(props) {
  const socket = useContext(SocketContext);
  const [messages, messagesDispatch] = useReducer(messagesReducer, {
    messages: [],
  });
  const [members, membersDispatch] = useReducer(membersReducer, {
    members: [props.name],
  });
  const [assigns, assignsDispatch] = useReducer(assignsReducer, {});
  const [ranking, rankingDispatch] = useReducer(rankingReducer, []);
  

  useEffect(() => {
    // handling assigns
    const assignsCallback = (assigns) => {
      console.log("on call back");
      console.log(assigns);
      assignsDispatch(assigns);
    };
    socket.on("serverAssignInfo", assignsCallback);
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
    // handling ranking
    socket.on("serverRanking", rankingDispatch);


    socket.emit("clientMemberJoin", props.name);
    return () => {
      socket.removeListener("serverAssignInfo", assignsCallback);
      socket.removeListener("serverMessage", messageCallback);
      socket.removeListener("serverMemberInfo", membersCallback);
      socket.removeListener("serverRanking", rankingDispatch);
    };
  }, []);
  useEffect(() => {
    const chat = document.getElementById("chat");
    chat.scrollTop = chat.scrollHeight;
    // https://stackoverflow.com/questions/270612/scroll-to-bottom-of-div
  });
  return (
    <div>
      <div className="columns">
        <div className="column">
          <Assign assigns={assigns} />
        </div>
        <div className="column">
          <Members members={members} ranking={ranking} />
        </div>
        <div className="column">
          <Chat messages={messages} />
        </div>
      </div>
    </div>
  );
}

export default Game;

function Assign(props) {
  return (
    <div className="notification is-black" style={{ border: "3px solid" }}>
      <p>役職</p>
      <hr />
      {console.log("render assign")}
      {console.log(props.assigns)}
      <div style={{ maxHeight: "450px", overflow: "auto" }}>
        <table class="table">
          {(() => {
            const items = [];
            for (let key in props.assigns) {
              if(props.assigns[key] === 0) {
                continue;
              }
              items.push(
                <tr>
                  <th>{key}</th>
                  <th>{props.assigns[key]}</th>
                </tr>
              );
            }
            return items;
          })()}
        </table>

      </div>
    </div>
  );
}


function Members(props) {
  return (
      <div className="notification is-black" style={{ border: "3px solid" }}>
        <p>メンバー</p>
        <hr />
        <div style={{ maxHeight: "450px", overflow: "auto" }}>
          {props.members.members.map((member) => {
            return <Member alive={member.alive} name={member.name} />;
          })}
          
        </div>
        <hr size="10"/>
        <Ranking ranking={props.ranking} />
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

function Ranking(props) {
  const socket = useContext(SocketContext);
  

  const [rankingTitle, rankingTitleDispatch] = useReducer(rankingTitleReducer, "");

  useEffect(() => {
    // handling rankingTitle
    socket.on("serverRankingTitle", rankingTitleDispatch);

    return () => {
      socket.removeListener("serverRankingTitle", rankingTitleDispatch);
    };
  }, []);

  const ranking=props.ranking
  let contents;
  if (ranking.length === 0) {
     contents = (<p>***</p>);
  } else {
    contents = ranking.map((item) => {
      return <p>{item}</p>;
    });
  }
  return (
    <div>
      <p>ランキング: {rankingTitle}</p>
      <hr />
      <div style={{ maxHeight: "450px", overflow: "auto" }}>
        {contents}
      </div>
    </div>
  );
}

function Chat(props) {
  const socket = useContext(SocketContext);
  const messages = props.messages;
  //const vote = props.vote;
  const [vote, voteDispatch] = useReducer(voteReducer, {valid:false});

  useEffect(() => {
    // handling vote
    socket.on("serverVote", voteDispatch);

    return () => {
      socket.removeListener("serverVote", voteDispatch);
    };
  }, []);


  let inputForm;
  if(!vote.valid) {
    inputForm = 
      <Input
        prompt="メッセージ"
        button="▶おくる"
        onSubmit={(msg) => {
          if (msg !== "") socket.emit("clientMessage", msg);
        }}
      />
  }
  else {
    inputForm =
      <MySelect
        button="けってい"
        onSubmit={(msg) => {
          if (msg !== "") {
            socket.emit("clientMessage", msg);
            voteDispatch({valid: false});
          }
        }}
        selectable={vote.valid}
        options={vote.choices}
      />
  }
  return (

      <div className="notification is-black" style={{ border: "3px solid" }}>
        <p>チャット</p>
        <hr />
        <ChatHistory messages={messages}/>
        {inputForm}
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