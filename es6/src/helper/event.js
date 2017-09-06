import * as lodash from "lodash";
import { noop } from "./util";

const win = window;

export default class EVENT {

    static on(element, type, handler = noop, thisArg = win, captute = false) {
        handler = lodash.bind(thisArg);
        element.addEventListener(type, handler, captute);

        return {
            element: element,
            type: type,
            handler: handler,
            captute: captute
        };
    }

    static remove(element, type, handler = noop, captute = false) {
        element.removeEventListener(type, handler, captute);
    }

    static delegate(element, type, selector, handler = noop, thisArg = win, captute = false) {
        handler = lodash.bind(handler, thisArg);

        element.addEventListener(type, function(e) {
            var event = e || window.event,
                target = event.target || event.srcElement;
            if (target.matches(selector)) {
                event.target = target;
                handler(event);
            }
        });
    }

    static undelegate(element, type, selector, handler = noop, thisArg = win, captute = false) {

    }

}