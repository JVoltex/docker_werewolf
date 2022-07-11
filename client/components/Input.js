import { useEffect, useContext } from "react";

function Input(props) {
  useEffect(() => {
    const f = document.getElementById("form");
    const t = document.getElementById("textarea");
    f.addEventListener("submit", (e) => {
      props.onSubmit(t.value);
      t.value = ""; // clear textarea
      e.preventDefault();
    });
  }, []);
  return (
    <form id="form">
      <div className="field has-addons">
        <div className="control">
          <input className="input" id="textarea" placeholder={props.prompt} />
        </div>
        <div className="control">
          <input
            className="button is-black"
            type="submit"
            style={{ border: "3px solid" }}
            value={props.button}
          />
        </div>
      </div>
    </form>
  );
}
export default Input;
