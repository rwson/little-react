import * as lodash from "lodash";
import { makeArray, noop } from "./util";

const win = window,
    doc = document,
    arrPro = Array.prototype;


/**
 *  添加事件监听
 */
function addEvent({ element, type, handler, captute }) {
    element.addEventListener(type, handler, captute);
}

/**
 *  移除事件监听
 */
function removeEvent({ element, type, handler, captute }) {
    element.removeEventListener(type, handler, captute);
}

/**
 *  添加事件代理
 */
function delegateEvent({ element, type, selector, handler }) {
    element.addEventListener(type, function(e) {
        const event = e || window.event,
            target = event.target || event.srcElement;
        if (target.matches(selector)) {
            event.curTarget = target;
            handler(event);
        }
    });
}

/**
 *  移除事件代理
 */
function undelegateEvent({ element, type, selector, handler }) {
    element.addEventListener(type, function(e) {
        const event = e || window.event,
            target = event.target || event.srcElement;
        if (target.matches(selector)) {
            event.curTarget = target;
            handler(event);
        }
    });
}

class Event {

    constructor() {
        this.events = [];
    }

    _add() {
        const args = makeArray(arguments);
        arrPro.push.apply(this.events, args);
        for (let item of args) {
            switch (item.evType) {
                case "originnal":
                    addEvent(item);
                    break;
                case "delegate":
                    delegateEvent(item);
                    break;
            }
        }
    }

    _remove() {
        const args = makeArray(arguments);
        for (let item of args) {
            this.events = this.events.filter((type, selector) => type !== item.type && selector !== item.selector);
            switch (item.evType) {
                case "originnal":
                    removeEvent(item);
                    break;
                case "delegate":
                    undelegateEvent(item);
                    break;
            }
        }
    }

    on() {
        const args = makeArray(arguments).map((item) => {
            item.evType = "originnal";
            item.handler = lodash.bind((item.handler || noop), item.context);
            if (lodash.isUndefined(item.captute)) {
                item.captute = false;
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
        this._add(...args);
        return args;
    }

}

export default new Event();