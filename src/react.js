/**
 * ReactElement就是虚拟DOM的概念
 * @param    {[type]}   type  代表节点类型
 * @param    {[type]}   key   [description]
 * @param    {[type]}   props 节点属性props
 */
function ReactElement(type, key, props) {
    this.type = type;
    this.key = key;
    this.props = props;
}

//	component工厂  根据node类型来返回一个React Component实例
function instantiateReactComponent(node) {
    if (typeof node === "string" || typeof node === "number") {
        return new ReactDOMTextComponent(node);
    }

    //	浏览器默认节点
    if (typeof node === "object" && typeof node.type === "string") {
        return new ReactDOMComponent(node);
    }

    //	自定义元素节点
    if (typeof node === "object" && typeof node.type === "function") {
    	return new ReactCompositeComponent(node);
    }
}

var React = {
    //	作为每个Component标识的id
    nextReactRootIndex: 0,

	//	作为入口负责渲染
    render: function(element, container, callback) {
        var componentInstance = instantiateReactComponent(element),
            markup = componentInstance.mountComponent(React.nextReactRootIndex++);

        $(container).html(markup);

        $(document).trigger("mountReady");

        if (typeof callback === "function") {
            callback();
        }
    },

    /**
     * 参数修正, 返回一个虚拟DOM
     * @param    {[type]}   nodeName [description]
     * @param    {[type]}   config   [description]
     * @param    {[type]}   children [description]
     * @return   {[type]}            [description]
     */
    createElement: function(nodeName, config, children) {
        config = config || {};

        //	看有没有key，用来标识element的类型，方便以后高效的更新
        var key = config.key || null,
            props = {},
            propName, childrenLength, childArray, i;

        //	复制config中除了key以外的属性到props
        for (propName in config) {
            if (config.hasOwnProperty(propName) && propName !== key) {
                props[propName] = config[propName];
            }
        }

        //	获取当前组件的children
        childrenLength = arguments.length - 2;
        if (childrenLength === 1) {
            props.children = $.isArray(children) ? children : [children];
        } else if (childrenLength > 1) {
            childArray = Array(childrenLength);
            for (i = 0; i < childrenLength; i++) {
                childArray[i] = arguments[i + 2];
            }
            props.children = childArray;
        }

        return new ReactElement(nodeName, key, props);
    },

    createClass: function(spec) {
        var Constructor = function(props) {
            this.props = props;
            this.state = this.getInitialState ? this.getInitialState() : null;
        };

        //原型继承，继承超级父类
        Constructor.prototype = new ReactClass();
        Constructor.prototype.constructor = Constructor;

        //混入spec到原型
        $.extend(Constructor.prototype, spec);

        return Constructor;
    }
};