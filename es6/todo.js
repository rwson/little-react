import classname from "classname";

import React, { Component } from "./src/react";
import "./todomvc.css";
import "todomvc-app-css/index.css";

const $ = (selector) => document.querySelector(selector);

class TodoInput extends Component {
    constructor() {
        super();
    }

    keyUpHandler(ev) {
        const evt = ev || window.event,
            { keyCode } = evt;
        if (keyCode === 13) {
            this.props.addTodo($(".new-todo").value.trim());
            $(".new-todo").value = "";
        }
    }

    render() {
        const { placeholder } = this.props;
        return (
            <header className="header">
                <h1>todos</h1>
                <input className="new-todo"
                       placeholder={placeholder}
                       autofocus="true"
                       onKeyUp={this.keyUpHandler.bind(this, event)} />
            </header>
        );
    }
}

class TodoList extends Component {
    constructor () {
        super();
    }

    checkTodo(todo) {
        const { checkTodo } = this.props;
        if (typeof checkTodo === "function") {
            checkTodo(todo);
        }
    }

    removeTodo(todo) {
        const { removeTodo } = this.props;
        if (typeof removeTodo === "function") {
            removeTodo(todo);
        }
    }

    renderTodoItem(todos) {
        return (<ul className="todo-list">
                {
                    todos.map((todo) => {
                        return (
                            <li
                                className= {classname({
                                    completed: todo.completed
                                })}
                                data-id={todo.id}>
                                <div className="view">
                                    {
                                        todo.completed
                                         ? 
                                        (
                                            <input
                                                className="toggle"
                                                type="checkbox"
                                                checked="checked" />
                                        )
                                         : 
                                        (
                                            <input
                                                className="toggle"
                                                type="checkbox" />
                                        )
                                    }
                                    <label
                                        onClick={this.checkTodo.bind(this, todo)}>{todo.title}</label>
                                    <button className="destroy"
                                        onClick={this.removeTodo.bind(this, todo)}></button>
                                </div>
                                <input className="edit" value={todo.title} />
                            </li>
                        )
                    })
                }
            </ul>);
    }

    render() {
        const { todos } = this.props,
            todoItems = (todos && todos.length) ? this.renderTodoItem(todos) : null;
        return (
            <section>
                <label for="toggle-all">Mark all as complete</label>
                { todoItems }
            </section>
        );
    }
}

class TodoFooter extends Component {
    constructor() {
        super();
    }

    render() {
        const { left, total, completed } = this.props;
        return (
            <footer className="footer">
                <span className="todo-count"><strong>{
                    left || "0"
                }</strong>剩余</span>
                <ul className="filters">
                    <li>
                        <a className="selected" href="javascript:;">所有</a>
                    </li>
                    <li>
                        <a href="javascript:;">未完成</a>
                    </li>
                    <li>
                        <a href="javascript:;">已完成</a>
                    </li>
                </ul>
                <button className="javascript:;">清除已完成</button>
            </footer>
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
            completedCount = 0;

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

    removeTodo({id}) {
        let { todos } = this.state,
            totalCount = 0,
            leftCount = 0,
            completedCount = 0;
        todos = todos.filter((todo) => todo.id !== id);
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

    checkTodo({id}) {
        let { todos } = this.state,
            completedCount = 0,
            leftCount = 0;
        todos.forEach((todo) => {
            if (todo.id === id) {
                todo.completed = !todo.completed;
            }

            if (todo.completed) {
                completedCount += 1;
            } else {
                leftCount += 1;
            }
        });

        this.setState({
            todos,
            left: leftCount,
            total: completedCount
        });
    }

    render() {
        return (
            <section className="todoapp">
                <TodoInput
                    placeholder={"请输入代办标题"}
                    addTodo={this.addTodo.bind(this)} />
                <TodoList
                    checkTodo={this.checkTodo.bind(this)}
                    removeTodo={this.removeTodo.bind(this)}
                    todos={this.state.todos} />
                <TodoFooter
                    left={this.state.left}
                    total={this.state.total}
                    completed={this.state.completed}
                />
            </section>
        );
    }
}

function uuid() {
    return Math.random().toString(36) + "-" +new Date().getTime();
}

React.render(<TodoApp />, document.querySelector("#root"));
