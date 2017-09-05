//  全局的更新深度标识
var updateDepth = 0,
    //  全局的更新队列, 所有的差异都存在这里
    diffQueue = [],
    //  差异更新的几种类型
    UPDATE_TYPES = {
        MOVE_EXISTING: 1,
        REMOVE_NODE: 2,
        INSERT_MARKUP: 3
    };

//  定义ReactClass类,所有自定义的超级父类
function ReactClass() {}

//  留给子类去继承覆盖重写
ReactClass.prototype = {
    constructor: ReactClass,

    setState: function(newState) {
        this._reactInternalInstance.receiveComponent(null, newState);
    },

    render: function() {}
};

function ReactDOMTextComponent(text) {
    this._currentElement = "" + text;
    this._rootNodeID = null;
}

ReactDOMTextComponent.prototype = {
    constructor: ReactDOMTextComponent,

    mountComponent: function(rootNodeID) {
        this._rootNodeID = rootNodeID;
        return "<span data-reactid='" + rootNodeID + "'>" + this._currentElement + "</span>";
    },

    receiveComponent: function(nextElement) {
        var nextStringText = "" + nextElement;
        if (nextStringText !== this._currentElement) {
            $("[data-reactid='" + this._rootNodeID + "']").html(nextStringText);
        }
    }
};

function ReactDOMComponent(element) {
    this._currentElement = element;
    this._rootNodeID = null;
}

ReactDOMComponent.prototype = {
    constructor: ReactDOMComponent,

    mountComponent: function(rootNodeID) {
        var element = this._currentElement,
            props = element.props,
            type = element.type,
            children = props.children || [],
            tagOpen, tagClose, propKey, eventType, content, childrenInstances, curRootId, childMarkup;
        this._rootNodeID = rootNodeID;
        tagOpen = "<" + type + "data-reactid=" + this._rootNodeID;
        tagClose = "</" + type + ">";
        for (propKey in props) {
            if (/^on[a-z]+i/.test(propKey)) {
                eventType = propKey.replace("on", "").toLowerCase();
                $(document).delegate("[data-reactid='" + this._rootNodeID + "']", eventType + "." + this._rootNodeID, props[key]);
            }

            if (props[propKey] && propKey !== "children" && /on[a-z]+i/.test(propKey)) {
                tagOpen += " " + propKey + "=" + props[propKey];
            }
        }

        content = "";
        childrenInstances = [];
        $.each(children, function(key, child) {
            childComponentInstance = instantiateReactComponent(child);
            childComponentInstance._mountIndex = key;
            childrenInstances.push(childComponentInstance);
            curRootId = this._rootNodeID + "." + key;
            childMarkup = childComponentInstance.mountComponent(curRootId);

            content += " " + childMarkup;
        }.bind(this));

        this._renderedChildren = childrenInstances;

        tagOpen += ">";

        return tagOpen + content + tagClose;
    },

    receiveComponent: function(nextElement) {
        var lastProps = this._currentElement.props,
            nextProps = nextElement.props;

        this._currentElement = nextElement;

        //  更新组件DOM的属性
        this._updateDOMProperties(lastProps, nextProps);

        //  更新子节点
        this._updateDOMChildren(nextProps.children);
    },

    _updateDOMProperties: function(lastProps, nextProps) {
        var propKey, eventType;
        for (propKey in lastProps) {
            if (nextProps.hasOwnProperty(propKey) || !lastProps.hasOwnProperty(propKey)) {
                continue;
            }

            //  事件类型
            if (/^on[a-z]+/i.test(propKey)) {
                eventType = propKey.replace("on", "").toLowerCase();
                $(document).undelegate("[data-reactid='" + this._rootNodeID + "']", eventType, lastProps[propKey]);
                continue;
            }

            //  移除节点属性
            $("[data-reactid='" + this._rootNodeID + "']").removeAttribute(propKey);
        }

        for (propKey in nextProps) {
            if (/^on[a-z]+/i.test(propKey)) {
                eventType = propKey.replace("on", "");
                if (lastProps[propKey]) {
                    $(document).undelegate("[data-reactid='" + this._rootNodeID + "']", eventType + "." + this._rootNodeID, lastProps[propKey]);
                }
                $(document).delegate("[data-reactid='" + this._rootNodeID + "']", eventType + "." + this._rootNodeID, nextProps[propKey]);
                continue;
            }

            if (propKey === "children") {
                continue;
            }

            $("[data-reactid='" + this._rootNodeID + "']").prop(propKey, nextProps[propKey]);
        }
    },

    _updateDOMChildren: function(nextChildrenElements) {
        updateDepth++;
        this._diff(diffQueue, nextChildrenElements);
        updateDepth--;
        if (updateDepth === 0) {
            this._patch(diffQueue);
            diffQueue = [];
        }
    },

    //  _diff用来递归找出差别,组装差异对象,添加到更新队列diffQueue
    _diff: function(diffQueue, nextChildrenElements) {
        var prevChildren, nextChildren, prevChild, nextChild, nextIndex, name;

        //  把_renderedChildren变成一个Map对象
        prevChildren = flattenChildren(this._renderedChildren);

        //  生成新的子节点的component对象集合(会复用老的component对象)
        nextChildren = generateComponentChildren(prevChildren, nextChildrenElements);

        this._renderedChildren = [];

        //  重新赋值_renderedChildren,使用最新的
        $.each(nextChildren, function(key, inst) {
            this._renderedChildren.push(inst);
        }.bind(this));

        nextIndex = 0;

        //  对比两个集合的差异
        for (name in nextChildren) {
            if (!nextChildren.hasOwnProperty(name)) {
                continue;
            }

            prevChild = prevChildren && prevChildren[name];
            nextChild = nextChildren[name];

            if (prevChild === nextChild) {
                //添加差异对象，类型：MOVE_EXISTING
                diffQueue.push({
                    parentId: this._rootNodeID,
                    parentNode: $("[data-reactid='" + this._rootNodeID + "']"),
                    type: UPATE_TYPES.MOVE_EXISTING,
                    fromIndex: prevChild._mountIndex,
                    toIndex: nextIndex
                });
            } else {
                if (prevChild) {
                    diffQueue.push({
                        parentId: this._rootNodeID,
                        parentNode: $("[data-reactid='" + this._rootNodeID + "']"),
                        type: UPATE_TYPES.REMOVE_NODE,
                        fromIndex: prevChild._mountIndex,
                        toIndex: null
                    });

                    //如果以前已经渲染过了，记得先去掉以前所有的事件监听，通过命名空间全部清空
                    if (prevChild._rootNodeID) {
                        $(document).undelegate("." + prevChild._rootNodeID);
                    }
                }
            }

            //新增加的节点，也组装差异对象放到队列里
            //添加差异对象，类型：INSERT_MARKUP
            diffQueue.push({
                parentId: self._rootNodeID,
                parentNode: $('[data-reactid=' + self._rootNodeID + ']'),
                type: UPATE_TYPES.INSERT_MARKUP,
                fromIndex: null,
                toIndex: nextIndex,
                markup: nextChild.mountComponent() //新增的节点，多一个此属性，表示新节点的dom内容
            });
        }

        nextChild._mountIndex = nextIndex;
        nextIndex++;

        for (name in prevChildren) {
            if (prevChildren.hasOwnProperty(name) && !(nextChildren && nextChildren.hasOwnProperty(name))) {
                diffQueue.push({
                    parentId: this._rootNodeID,
                    parentNode: $("[data-reactid='" + this._rootNodeID + "']"),
                    type: UPATE_TYPES.REMOVE_NODE,
                    fromIndex: prevChild._mountIndex,
                    toIndex: null
                });

                if (prevChildren[name]._rootNodeID) {
                    $(document).undelegate("." + prevChildren[name]._rootNodeID);
                }
            }
        }
    },


    _patch: function(updates) {

    }
};

function ReactCompositeComponent(element) {
    //  存放元素的element对象
    this._currentElement = element;

    //  组件唯一标识
    this._rootNodeID = null;

    //  存放对应的ReactClass实例
    this._instance = null;
}

ReactCompositeComponent.prototype = {
    constructor: ReactCompositeComponent,

    //  返回当前自定义元素渲染时应该返回的内容
    mountComponent: function(rootNodeID) {
        var publicProps, ReactClass, inst, renderedElement, renderedComponentInstance, renderedMarkup;
        this._rootNodeID = rootNodeID;

        //  拿到当前元素对应的属性值
        publicProps = this._currentElement.props;

        //  拿到对应的ReactClass
        ReactClass = this._currentElement.type;

        //  实例化ReactClass
        inst = new ReactClass(publicProps);

        this._instance = inst;

        //  保留对当前comonent的引用,下面更新会用到
        inst._reactInternalInstance = this;

        //  在componentWillMount中调用this.setState不会触发render
        if (typeof inst.componentWillMount === "function") {
            inst.componentWillMount();
        }

        //  调用实例的render方法,返回一个文本节点或者element
        renderedElement = inst.render();

        //  得到renderedElement对应的component类实例
        renderedComponentInstance = instantiateReactComponent(renderedElement);

        //  存起来留作后用
        this._renderedComponent = renderedComponentInstance;

        //  拿到渲染之后的字符串内容,将当前的_rootNodeID传给render出的节点
        renderedMarkup = renderedComponentInstance.mountComponent(this._rootNodeID);

        $(document).on("mountReady", function() {
            //调用inst.componentDidMount
            inst.componentDidMount && inst.componentDidMount();
        });

        return renderedMarkup;
    },

    //  组件更新
    receiveComponent: function(nextElement, newState) {
        var inst, nextState, nextProps, prevComponentInstance, prevRenderedElement, nextRenderedElement, nextMarkup;

        //  如果nextElement传入了, 就保留最新的
        this._currentElement = nextElement || this._currentElement;

        //  合并state
        nextState = $.extend(inst.state, newState);

        nextProps = this._currentElement.props;

        //  更新state
        inst.state = nextState;

        //  组件有shouldComponentUpdate生命周期并且返回false直接不更新
        if (typeof inst.shouldComponentUpdate === "function" && !inst.shouldComponentUpdate(nextProps, nextState)) {
            return;
        }

        //  组件有componentWillUpdate的生命周期方法
        //  调用componentWillUpdate并且传入props和state
        if (typeof inst.componentWillUpdate === "function") {
            inst.componentWillUpdate(nextProps, nextState);
        }

        prevComponentInstance = this._renderedComponent;
        prevRenderedElement = prevComponentInstance._currentElement;

        //  调用组件的render方法获取对应的新element
        nextRenderedElement = this._instance.render();

        //  判断是否需要更新, 如果需要直接重新渲染
        if (_shouldUpdateReactComponent(prevRenderedElement, nextRenderedElement)) {
            prevComponentInstance.receiveComponent(nextRenderedElement);
            if (typeof inst.componentDidMount === "function") {
                inst.componentDidMount();
            }
        } else {
            this._renderedComponent = this._instantiateReactComponent(nextRenderedElement);
            nextMarkup = this._renderedComponent.mountComponent(thisID);
            $("[data-reactid='" + this._rootNodeID + "']").replaceWith(nextMarkup);
        }

    }
};

//  将childNode插入到具体下标的位置
function insertChildAt(parentNode, childNode, index) {
    var beforeChild = parentNode.children().get(index);
    if (beforeChild !== null) {
        childNode.insertBefore(beforeChild)
    } else {
        childNode.appendTo(parentNode);
    }
    return childNode;
}

//  把子组件转换成一个map返回
function flattenChildren(componentChildren) {
    var childrenMap = {},
        name, child, i, len;
    for (i = 0, len = componentChildren.length; i < len; i++) {
        name = child && child._currentelement && child._currentelement.key ? child._currentelement.key : i.toString(36);
        child = componentChildren[i];
        childrenMap[name] = child;
    }
    return childrenMap;
}

function generateComponentChildren(prevChildren, nextChildrenElements) {
    var nextChildren = {},
        name, prevChild, prevElement, nextElement, nextChildInstance;
    nextChildrenElements = nextChildrenElements || [];
    $.each(nextChildrenElements, function(index, element) {
        prevChild = null;
        prevElement = null;

        name = element.key ? element.key : index;
        if (prevChildren) {
            prevChild = prevChildren[name];
        }

        if (prevChild) {
            prevElement = prevChild._currentElement;
        }

        nextElement = element;

        //  调用_shouldUpdateReactComponent判断是否是更新
        if (_shouldUpdateReactComponent(prevElement, nextElement)) {
            //  更新的话直接递归调用子节点的receiveComponent
            prevChild.receiveComponent(nextElement);

            // 然后继续使用老的component
            nextChildren[name] = prevChild;
        } else {
            //  没有老的, 重新实例化一个Component
            nextChildInstance = instantiateReactComponent(nextElement, null);

            //  使用实例化出来的Component实例
            nextChildren[name] = nextChildInstance;
        }
    });
    return nextChildren;
}

//  用来判断两个element是否需要更新
function _shouldUpdateReactComponent(prevElement, nextElement) {
    //  两个element都是null的情况
    if (prevElement === null && nextElement === null) {
        return false;
    }

    var prevType = typeof prevElement,
        nextType = typeof nextElement;

    if (prevType === "string" || prevType === "number") {
        return nextType === "string" || nextType === "number";
    } else {
        return nextType === "object" && ((prevElement.type === nextElement.type) && (prevElement.key === nextElement.key));
    }
}