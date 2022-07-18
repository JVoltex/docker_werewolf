import { useReducer } from "react";
import Select from 'react-select';

function selectedReducer(state, action) {
    return action;
}

function MySelect(props) {
    
  const [selected, selectedDispatch] = useReducer(selectedReducer, "");

  const handleOnSubmit = (e) => {
    e.preventDefault();
      // alert('A name was submitted: ' + selected);
      props.onSubmit(selected);
  }

  console.log("render Input(internal)")
  console.log("selectable: " + props.selectable)
  console.log("options: " + props.options)
  
  const colourStyles = {
    control: (styles) => ({ ...styles, backgroundColor: 'white' }),
    option: (styles) => {
      return {
      ...styles,
       color: 'black'
      };
    },
  };
  
  let inputValue=null;
  if(props.selectable){
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
      selectedDispatch(e.value);
    }
    
    inputValue = <Select options={options} onChange={(e)=>selectedCallback(e)} 
      styles={colourStyles} />;
  }
  
  return (
    <form id="form" onSubmit={(e)=>handleOnSubmit(e)}>
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

export default MySelect;
