import Input from "./Input";
import { useContext } from "react";
import { SocketContext, PhaseDispatch, NameDispatch } from "./Wrapper";

function Welcome() {
  const phaseDispatch = useContext(PhaseDispatch);
  const nameDispatch = useContext(NameDispatch);
  const socket = useContext(SocketContext);
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
          onSubmit={(name) => {
            if (name !== "") {
              nameDispatch({ type: name });
              phaseDispatch({ type: "game" });
            } else {
              alert("村長「こら、ちゃんと名乗れ！");
            }
          }}
        />
      </div>
    </div>
  );
}
export default Welcome;
