$(function() {

    var TodoItem = React.createClass({
        removeSelf: function(id) {
            this.props.removeTodo(id);
        },

        renderItem: function(list) {
            var self = this;
            return list.map(function(todo) {
                return React.createElement("li", {
                    onClick: self.removeSelf.bind(self, todo.id),
                    className: "todo-item " + (todo.completed ? "done" : "")
                }, todo.title);
            });
        },

        render: function() {
            var list = this.props.list || [];
            return React.createElement("ul", {
                className: "todos-container"
            }, this.renderItem(list));
        }
    });

    var TodoInput = React.createClass({
        keyHandler: function(event) {
            var ev = event || window.event;
            if (event.keyCode === 13) {
                this.props.add($(event.target).val());
            }
        },

        render: function() {
            return React.createElement("input", {
                className: "todo-input",
                onKeyUp: this.keyHandler.bind(this),
                placeholder: "请输入todo标题"
            });
        }
    });

    var Todo = React.createClass({
        getInitialState: function() {
            return {
                list: []
            };
        },

        add: function(title) {
            var list = this.state.list,
                newItem = {
                    title: title,
                    id: Math.random().toString(16).slice(2),
                    completed: Math.random() > 0.5
                };
            list.push(newItem);
            this.setState({
                list: list
            });
        },

        removeTodo: function(id) {
            var list = this.state.list;
            list = list.filter(function(todo) {
                return todo.id !== id;
            });
            this.setState({
                list: list
            });
        },

        render: function() {
            return React.createElement("div", {}, React.createElement(TodoInput, {
                add: this.add.bind(this)
            }), React.createElement(TodoItem, {
                list: this.state.list,
                removeTodo: this.removeTodo.bind(this)
            }));
        }
    });

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

    React.render(React.createElement(Todo), $("#root"));
});