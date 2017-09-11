import * as lodash from "lodash";
import { makeArray, noop } from "./util";

const win = window,
    doc = document,
    arrPro = Array.prototype;


/**
 *  添加事件监听
 */
function addEvent({ element, type, handler, selector, capture }) {
    const listener = (e) => {
        const event = e || window.event,
            target = event.target || event.srcElement;
        if (target.matches(selector)) {
            handler(e);
        }
    };
    element.addEventListener(type, listener, capture);
    return Object.assign({
        element, type, handler, selector, capture
    }, {
        destroy: function() {
            element.removeEventListener(type, listener, capture);
        }
    });
}

/**
 *  添加事件代理
 */
function delegateEvent({ element, type, handler, selector, capture }) {
    const listener = (e) => {
        const event = e || window.event,
            target = event.target || event.srcElement;
        if (target.matches(selector)) {
            handler(e);
        }
    };
    element.addEventListener(type, listener, capture);
    return Object.assign({
        element, type, handler, selector, capture
    }, {
        destroy: function() {
            element.removeEventListener(type, listener, capture);
        }
    });
}

class Event {

    constructor() {
        this.events = [];
    }

    _add() {
        const args = makeArray(arguments);
        let item;
        for (item of args) {
            switch (item.evType) {
                case "originnal":
                    item = addEvent(item);
                    break;
                case "delegate":
                    item = delegateEvent(item);
                    break;
            }
            this.events.push(item);
        }
    }

    _remove() {
        const args = makeArray(arguments);
        let item;
        for (item of args) {
            this.events = this.events.filter((listener) => {
                if(item.type === listener.type && item.selector === listener.selector) {
                    listener.destroy();
                }
                return (item.type !== listener.type && item.selector !== listener.selector);
            });
        }
    }

    on() {
        const args = makeArray(arguments).map((item) => {
            item.evType = "originnal";
            item.handler = lodash.bind((item.handler || noop), item.context);
            if (lodash.isUndefined(item.capture)) {
                item.capture = false;
            }
            return item;
        });
        this._add(...args);
        return args;
    }

    remove() {
        const args = makeArray(arguments).map((item) => {
            item.evType = "originnal";
            return item;
        });
        this._remove(...args);
    }

    delegate() {
        const args = makeArray(arguments).map((item) => {
            item.evType = "delegate";
            item.handler = lodash.bind((item.handler || noop), item.context);
            return item;
        });
        this._add(...args);
        return args;
    }

    undelegate() {
        const args = makeArray(arguments).map((item) => {
            item.evType = "delegate";
            return item;
        });
        this._remove(...args);
        return args;
    }

}

export default new Event();