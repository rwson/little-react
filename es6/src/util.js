var Util = (function() {
    if (!Element.prototype.matches) {
        Element.prototype.matches =
            Element.prototype.matchesSelector ||
            Element.prototype.mozMatchesSelector ||
            Element.prototype.msMatchesSelector ||
            Element.prototype.oMatchesSelector ||
            Element.prototype.webkitMatchesSelector ||
            function(s) {
                var matches = (this.document || this.ownerDocument).querySelectorAll(s),
                    i = matches.length;
                while (--i >= 0 && matches.item(i) !== this) {}
                return i > -1;
            };
    }

    var doc = document,
        types = ["Number", "String", "Boolean", "Function", "Object", "Array", "Undefined", "Null"],
        util = {
            type: {},
            dom: {},
            event: {},
            object: {},
            uuid: uuid
        };

    for (var i = 0, len = types.length; i < len; i++) {
        util.type["is" + types[i]] = (function(type) {
            return function(obj) {
                return typeOf(obj) === type;
            }
        })(types[i]);
    }

    util.object.loop = function(obj, interator, context, deep) {
        var i, len, cur, typeIn;

        if (util.type.isUndefined(deep) || util.type.isNull(deep)) {
            type = false;
        }

        context = context || window;
        interator = bind(interator, context);
        if (util.type.isArray(obj)) {
            for (i = 0, len = obj.length; i < len; i++) {
                cur = obj[i];
                typeIn = typeOf(cur);
                interator(cur, i, obj);

                if (deep && (typeIn === "Array" || typeIn === "Object")) {
                    util.object.loop(cur, interator, context, true);
                }
            }
        } else if (util.type.isObject(obj)) {
            for (i in obj) {
                cur = obj[i];
                typeIn = typeOf(cur);

                interator(cur, i, obj);

                if (deep && (typeIn === "Array" || typeIn === "Object")) {
                    util.object.loop(cur, interator, context, true);
                }
            }
        }
    };

    util.dom = {
        $: function(selector) {
            return doc.querySelector(selector);
        },

        $$: function(selector) {
            return [].slice.call(doc.querySelector(selector));
        }
    };

    util.event = {
        on: function(element, type, handler, context, captute) {
            if (util.type.isUndefined(captute) || util.type.isNull(captute)) {
                captute = false;
            }

            context = context || window;
            handler = bind(handler, context);

            element.addEventListener(type, handler, captute);

            //	给后面的remove使用
            return {
                element: element,
                type: type,
                handler: handler,
                captute: captute
            };
        },

        remove: function(element, type, handler, captute) {
            element.removeEventListener(type, handler, captute);
        },

        delegate: function(element, type, selector, handler, context, context) {
            context = context || window;
            handler = bind(handler, context);

            element.addEventListener(type, function(e) {
                var event = e || window.event,
                    target = event.target || event.srcElement;
                if (target.matches(selector)) {
                    event.target = target;
                    handler(event);
                }
            });
        }
    };

    return util;

    function typeOf(obj) {
        return Object.prototype.toString.call(obj).slice(8, -1);
    }

    function bind(fn, context) {
        return function() {
            return fn.apply(context, [].slice.call(arguments));
        };
    }

    function uuid() {
        return Math.random().toString(16).slice(2) + new Date().toString(16);
    }
})();