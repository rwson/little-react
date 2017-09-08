import React, { Component } from "./src/react";
import "./todomvc.css";
import "todomvc-app-css/index.css";

class TodoInput extends Component {
    constructor() {
        super();
    }

    keyUpHandler(ev) {
        const evt = ev || window.event,
            { keyCode } = evt;
        if (keyCode === 13) {
            this.props.addTodo(this.refs["title"].value);
        }
    }

    render() {
        return (
            <header className="header">
                <h1>todos</h1>
                <input className="new-todo" placeholder="What needs to be done?" autofocus=""  onKeyUp={this.keyUpHandler.bind(this, event)} />
            </header>
        );
    }
}

class TodoList extends Component {
    constructor () {
        super();
    }

    renderTodoItem() {
        const { todos } = this.props;
        if (!todos || !todos.length) {
            return null;
        }
        return todos.map((todo) => {
            return (
                <li 
                    className= {classname({
                        "completed": todo.completed
                    })}
                    data-id={id}>
                    <div className="view">
                        <input 
                            className="toggle"
                            type="checkbox"
                            checked={todo.completed} />
                        <label>{todo.title}</label>
                        <button className="destroy"></button>
                    </div>
                    <input className="edit" value="{todo.title}" />
                </li>
            );
        });
    }

    render() {
        return (
            <section>
                <input type="checkbox" />
                <label for="toggle-all">Mark all as complete</label>
                <ul>
                    { this.renderTodoItem() }
                </ul>
            </section>
        );
    }
}

class TodoApp extends Component {
    constructor() {
        super();
        this.state = {
            todos: [],
            left: 0,
            total: 0,
            completed: 0
        };
    }

    addTodo(title) {
        let { todos } = this.state,
            todo = {
                title,
                id: uuid(),
                completed: false
            },
            totalCount = 0,
            leftCount = 0,
            completedCount = false;

        todos.push(todo);
        totalCount = todos.length;
        todos.forEach(({completed}) => {
            if (completed) {
                completedCount += 1;
            } else {
                leftCount += 1;
            }
        });

        this.setState({
            todos,
            left: leftCount,
            completed: completedCount,
            total: totalCount
        });
    }

    render() {
        return (
            <section className="todoapp">
                <TodoInput />
            </section>
        );
    }
}

// <TodoList />

function uuid() {
    return Math.random().toString(36) + new Date().getTime();
}

React.render(<TodoApp />, document.querySelector("#root"));
