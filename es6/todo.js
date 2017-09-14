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
            { keyCode, target } = evt;
        let { value } = target;
        value = value.trim();
        if (keyCode === 13) {
            if (!value.length) {
                return;
            }
            this.props.addTodo($(".new-todo").value.trim());
            $(".new-todo").value = "";
        }
    }

    render() {
        const { placeholder } = this.props;
        return (
            <header className="header" ref="todoHeader">
                <h1>todos</h1>
                <input className="new-todo"
                       placeholder={placeholder}
                       autofocus="true"
                       ref="todoTitle"
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
                        const isCompleted = (todo.completed === true);
                        return (
                            <li
                                className= {classname({
                                    completed: isCompleted
                                })}
                                data-id={todo.id}>
                                <div className="view">
                                    {
                                        isCompleted
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
        const { todos, filter } = this.props;
        let todoItems = null, renderTodos;
        if (todos.length) {
            renderTodos = todos.filter(({ completed }) => {
                switch (filter) {
                    case "all":
                        return true;
                    break;

                    case "completed":
                        return completed;
                    break;

                    case "last":
                        return !completed;
                    break;
                }
            });
            todoItems = this.renderTodoItem(renderTodos);
        }

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

    setFilter(newFilter) {
        const { setFilter, filter } = this.props;
        if (typeof setFilter === "function" && newFilter !== filter) {
            setFilter(newFilter);
        }
    }

    render() {
        const { left, total, completed, filter } = this.props;
        return (
            <footer className="footer">
                <span className="todo-count"><strong>{
                    left || "0"
                }</strong>剩余</span>
                <span className="todo-count">&nbsp;&nbsp;&nbsp;共<strong>{
                    total
                }</strong>项</span>
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
            completed: 0,
            filter: "all"
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

    setFilter(filter) {
        this.setState({
            filter
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
                    filter={this.state.filter}
                    todos={this.state.todos} />
            </section>
        );
    }
}

function uuid() {
    return Math.random().toString(36) + "-" +new Date().getTime();
}

React.render(<TodoApp />, document.querySelector("#root"));
