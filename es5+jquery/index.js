$(function() {
    var HelloMessage = React.createClass({
        getInitialState: function() {
            return { type: "say:" };
        },
        componentWillMount: function() {
            console.log("我就要开始渲染了。。。");
        },
        componentDidMount: function() {
            console.log("我已经渲染好了。。。");
        },
        changeType: function() {
            this.setState({
                type: "shout:"
            });
        },
        render: function() {
            return React.createElement("div", {
            	onClick: this.changeType
            }, this.state.type, "Hello ", this.props.name);
        }
    });

    React.render(React.createElement(HelloMessage, {
        name: "John"
    }), $("#root"));
});