import React, { Component } from "./src/react";

class InputComponnet extends Component {
    constructor() {
        super();
        this.state = {
            foo: "bar"
        };
    }

    render() {
        const { placeholder, handler } = this.props;
        return (
			<input
		        type = "text"
                ref="textInput"
		        placeholder = { placeholder }
		        onKeyUp = { handler }
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
            foo: "App Component",
            placeholder: "请输入..."
        };
    }

    keyUpHandler() {
        this.setState({
            foo: "fuck" + Math.random().toString(16),
            placeholder: Math.random().toString(16)
        });
    }

    render() {
        return ( 
            <div style = { "background: red;" } >
        		 {this.state.foo}
                <InputComponnet
                    placeholder = { this.state.placeholder }
                    handler = { this.keyUpHandler.bind(this) }
                    /> 
        	 </div>
        );
    }
}

React.render( <App / > , document.querySelector("#root"));
