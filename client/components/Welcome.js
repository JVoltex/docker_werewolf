import Input from "./Input";
import { useContext } from "react";
import { SocketContext, PhaseDispatch } from "./Wrapper";

function Welcome() {
  const dispatch = useContext(PhaseDispatch)
  const socket = useContext(SocketContext)
  return (
    <div className="columns is-vcentered">
      <div className="column is-8">
        <div className="notification is-black">
          <p>村長「はるばるとようこそ。</p>
          <p>村長「まずは名前を聞かせておくれ。</p>
        </div>
      </div>
      <div className="column">
        <Input
          prompt="名前"
          button="けってい"
          onSubmit={(msg) => {
            console.log("onSubmit")
            socket.emit("fromClient", msg);
            dispatch({ type: "game" });
          }}
        />
      </div>
    </div>
  );
}
export default Welcome;
