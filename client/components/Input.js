import { useEffect, useContext, useReducer } from "react";
import Select from 'react-select';

function selectedReducer(state, action) {
    return action;
}

function Input(props) {
    
  const [selected, selectedDispatch] = useReducer(selectedReducer, []);
    
  useEffect(() => {
    const f = document.getElementById("form");
    
    f.addEventListener("submit", (e) => {
      let t;
      if(!props.selectable) {
        t = document.getElementById("textarea");
        console.log("TEXTAREA")
      }
      else {
        t = document.getElementById("select");
        console.log("SELECT")
      }
      t = getInputValueForm();
      //props.onSubmit(t.value);
      props.onSubmit(selected);
      t.value = ""; // clear textarea
      e.preventDefault();
    });
  }, []);
  
  const getInputValueForm = () => {
      let t;
      console.log("getinputvalueform");
      console.log("props: " + props);
      console.log("selectable: " + props.selectable);
      if(!props.selectable) {
        t = document.getElementById("textarea");
        if (t === null){
          t = document.getElementById("select");
          console.log("SELECT")
          console.log(t)
          console.log(t.value)
        } else {
          console.log("TEXTAREA")
        }
      }
      else {
        t = document.getElementById("select");
        console.log("SELECT")
      }
      return t;
  }
  
  const selectChange = (event) => {
    //this.setState({value: event.target.value});
    const t = document.getElementById("textarea");
    t.value = event.target.value;
  }
  console.log("render Input(internal)")
  console.log("selectable: " + props.selectable)
  console.log("options: " + props.options)
  
  let inputValue;
  if (!props.selectable) {
    inputValue = <input className="input" id="textarea" placeholder={props.prompt} />;
  } else {
    const options = props.options.map((option) => {
        return {
            value: option, 
            label: option,
        }
    });
    console.log(options);
    
    const selectedCallback = (e) => {
      console.log("onchange");
      console.log(e);
      //selectedDispatch(e.target.value);
      selectedDispatch(e.value);
    }
    
    inputValue = <Select id="select" options={options} onChange={selectedCallback} />;
  }
  
  return (
    <form id="form">
      <div className="field has-addons">
        <div className="control">
          {inputValue}
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
