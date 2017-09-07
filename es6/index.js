import React, { Component } from "./src/react";

class InputComponnet extends Component {
    constructor() {
        super();
    }

    keyUpHandler(ev) {
        console.log(this);
    }

    render() {
        return (
			<input
		        type = "text"
                ref="textInput"
		        placeholder = { "请输入..." }
		        onKeyUp = { this.keyUpHandler }
		        style = {{
	                display: "block",
	                width: "200px",
	                height: "30px",
	                fontSize: "14px",
	                lineHeight: "30px"
		        }} />
    	   );
    }
}

class App extends Component {
    constructor() {
        super();
        this.state = {
            foo: "bar"
        };
    }

    render() {
        return ( 
            <div style = { "background: red;" } >
        		App Component <InputComponnet placeholder = { "请输入..." }/> 
        	 </div>
        );
    }
}

React.render( < App / > , document.querySelector("#root"));


// l.default.createElement("div", { className: (0, m.default)
// 	("relative left text-center inline-block tab-item", { on: "decenter" === r }), 
// 	onClick: function() { t.setState({ current: "decenter" }) } }