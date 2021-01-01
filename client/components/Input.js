import { useEffect, useContext } from "react"

function Input(props) {
  useEffect(() => {
    const f = document.getElementById("form")
    f.addEventListener("server", (e) => {
      socket
      e.preventDefault()
    })
  })
  return (
    <div className="field has-addons">
      <div className="control">
        <form id="form">
          <input className="input" placeholder={props.prompt}></input>
        </form>
      </div>
      <div className="control">
        <button
          className="button is-black"
          style={{ border: "3px solid" }}
        >
          {props.button}
        </button>
      </div>
    </div>
  )
}
export default Input
