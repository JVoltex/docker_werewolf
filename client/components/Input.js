import { useEffect, useContext } from "react";
import {SocketContext} from "./Wrapper";

function Input(props) {
  const socket = useContext(SocketContext);
  useEffect(() => {
    const f = document.getElementById("form");
    const t = document.getElementById("text");
    f.addEventListener("submit", (e) => {
      socket.emit("fromClient", t.value);
      t.value = ""
      e.preventDefault();
    });
  });
  return (
    <form id="form">
      <div className="field has-addons">
        <div className="control">
          <input className="input" id="text" placeholder={props.prompt} />
        </div>
        <div className="control">
          <input className="button is-black" type="submit" style={{ border: "3px solid" }} value={props.button} />
        </div>
      </div>
    </form>
  );
}
export default Input;
