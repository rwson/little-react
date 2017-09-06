import React, { Component } from "./src/react";

class InputComponnet extends Component {
	constructor () {
		super();
	}

	render() {
		return <input type="text" placeholder={"请输入..."} style={{
			display: "block",
			width: "200px",
			height: "30px",
			fontSize: "14px",
			lineHeight: "30px"
		}} />
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
		this.setState({
			foo: "foo"
		});
		return (
			<div style={"background: red;"}>
				App Component
				<InputComponnet placeholder={"请输入..."} />
			</div>
		);
	}
}

React.render(<App/>, document.querySelector("#root"));