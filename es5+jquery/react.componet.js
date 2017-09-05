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
            tagOpen, tagClose, propKey, eventType, content, childrenInstances, curRootId, childMarkup, propsArr;
        this._rootNodeID = rootNodeID;
        tagOpen = "<" + type + " data-reactid=" + this._rootNodeID;
        tagClose = "</" + type + ">";
        propsArr = [];

        for (propKey in props) {
            if (/^on[a-z]+/i.test(propKey)) {
                eventType = propKey.replace("on", "").toLowerCase();
                $(document).delegate("[data-reactid='" + this._rootNodeID + "']", eventType + "." + this._rootNodeID, props[propKey]);
            } else if (props[propKey] && propKey !== "children") {
                if (propKey === "className") {
                    propsArr.push("class=" + props[propKey]);
                } else {
                    propsArr.push(propKey + "=" + props[propKey]);
                }
            }
        }

        tagOpen += " " + propsArr.join(" ");
        propsArr = [];

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
        var lastProps = this._currentElement.props;
        var nextProps = nextElement.props;

        this._currentElement = nextElement;
        //需要单独的更新属性
        this._updateDOMProperties(lastProps, nextProps);
        //再更新子节点
        this._updateDOMChildren(nextElement.props.children);
    },

    _updateDOMProperties: function(lastProps, nextProps) {
        var propKey;
        //遍历，当一个老的属性不在新的属性集合里时，需要删除掉。

        for (propKey in lastProps) {
            //新的属性里有，或者propKey是在原型上的直接跳过。这样剩下的都是不在新属性集合里的。需要删除
            if (nextProps.hasOwnProperty(propKey) || !lastProps.hasOwnProperty(propKey)) {
                continue;
            }
            //对于那种特殊的，比如这里的事件监听的属性我们需要去掉监听
            if (/^on[A-Za-z]/.test(propKey)) {
                var eventType = propKey.replace('on', '');
                //针对当前的节点取消事件代理
                $(document).undelegate('[data-reactid="' + this._rootNodeID + '"]', eventType, lastProps[propKey]);
                continue;
            }

            //从dom上删除不需要的属性
            $('[data-reactid="' + this._rootNodeID + '"]').removeAttr(propKey)
        }

        //对于新的属性，需要写到dom节点上
        for (propKey in nextProps) {
            //对于事件监听的属性我们需要特殊处理
            if (/^on[A-Za-z]/.test(propKey)) {
                var eventType = propKey.replace('on', '');
                //以前如果已经有，说明有了监听，需要先去掉
                lastProps[propKey] && $(document).undelegate('[data-reactid="' + this._rootNodeID + '"]', eventType, lastProps[propKey]);
                //针对当前的节点添加事件代理,以_rootNodeID为命名空间
                $(document).delegate('[data-reactid="' + this._rootNodeID + '"]', eventType + '.' + this._rootNodeID, nextProps[propKey]);
                continue;
            }

            if (propKey == 'children') continue;

            //添加新的属性，或者是更新老的同名属性
            $('[data-reactid="' + this._rootNodeID + '"]').prop(propKey, nextProps[propKey])
        }
    },

    _updateDOMChildren: function(nextChildrenElements) {
        updateDepth++
        //_diff用来递归找出差别,组装差异对象,添加到更新队列diffQueue。
        this._diff(diffQueue, nextChildrenElements);
        updateDepth--
        if (updateDepth == 0) {
            //在需要的时候调用patch，执行具体的dom操作
            this._patch(diffQueue);
            diffQueue = [];
        }
    },

    //  _diff用来递归找出差别,组装差异对象,添加到更新队列diffQueue
    _diff: function(diffQueue, nextChildrenElements) {
        var self = this;
        //拿到之前的子节点的 component类型对象的集合,这个是在刚开始渲染时赋值的，记不得的可以翻上面
        //_renderedChildren 本来是数组，我们搞成map
        var prevChildren = flattenChildren(self._renderedChildren);
        //生成新的子节点的component对象集合，这里注意，会复用老的component对象
        var nextChildren = generateComponentChildren(prevChildren, nextChildrenElements);
        //重新赋值_renderedChildren，使用最新的。
        self._renderedChildren = []
        $.each(nextChildren, function(key, instance) {
            self._renderedChildren.push(instance);
        })


        var nextIndex = 0; //代表到达的新的节点的index
        //通过对比两个集合的差异，组装差异节点添加到队列中
        for (name in nextChildren) {
            if (!nextChildren.hasOwnProperty(name)) {
                continue;
            }
            var prevChild = prevChildren && prevChildren[name];
            var nextChild = nextChildren[name];
            //相同的话，说明是使用的同一个component,所以我们需要做移动的操作
            if (prevChild === nextChild) {
                //添加差异对象，类型：MOVE_EXISTING
                diffQueue.push({
                    parentId: self._rootNodeID,
                    parentNode: $('[data-reactid=' + self._rootNodeID + ']'),
                    type: UPDATE_TYPES.MOVE_EXISTING,
                    fromIndex: prevChild._mountIndex,
                    toIndex: nextIndex
                })
            } else { //如果不相同，说明是新增加的节点
                //但是如果老的还存在，就是element不同，但是component一样。我们需要把它对应的老的element删除。
                if (prevChild) {
                    //添加差异对象，类型：REMOVE_NODE
                    diffQueue.push({
                        parentId: self._rootNodeID,
                        parentNode: $('[data-reactid=' + self._rootNodeID + ']'),
                        type: UPDATE_TYPES.REMOVE_NODE,
                        fromIndex: prevChild._mountIndex,
                        toIndex: null
                    })

                    //如果以前已经渲染过了，记得先去掉以前所有的事件监听，通过命名空间全部清空
                    if (prevChild._rootNodeID) {
                        $(document).undelegate('.' + prevChild._rootNodeID);
                    }

                }
                //新增加的节点，也组装差异对象放到队列里
                //添加差异对象，类型：INSERT_MARKUP
                diffQueue.push({
                    parentId: self._rootNodeID,
                    parentNode: $('[data-reactid="' + self._rootNodeID + '"]'),
                    type: UPDATE_TYPES.INSERT_MARKUP,
                    fromIndex: null,
                    toIndex: nextIndex,
                    markup: nextChild.mountComponent() //新增的节点，多一个此属性，表示新节点的dom内容
                })
            }
            //更新mount的index
            nextChild._mountIndex = nextIndex;
            nextIndex++;
        }
    },

    _patch: function(updates) {
        var update;
        var initialChildren = {};
        var deleteChildren = [];
        for (var i = 0; i < updates.length; i++) {
            update = updates[i];
            if (update.type === UPDATE_TYPES.MOVE_EXISTING || update.type === UPDATE_TYPES.REMOVE_NODE) {
                var updatedIndex = update.fromIndex;
                var updatedChild = $(update.parentNode.children().get(updatedIndex));
                var parentID = update.parentID;

                //所有需要更新的节点都保存下来，方便后面使用
                initialChildren[parentID] = initialChildren[parentID] || [];
                //使用parentID作为简易命名空间
                initialChildren[parentID][updatedIndex] = updatedChild;


                //所有需要修改的节点先删除,对于move的，后面再重新插入到正确的位置即可
                deleteChildren.push(updatedChild)
            }

        }

        //删除所有需要先删除的
        $.each(deleteChildren, function(index, child) {
            $(child).remove();
        })


        //再遍历一次，这次处理新增的节点，还有修改的节点这里也要重新插入
        for (var k = 0; k < updates.length; k++) {
            update = updates[k];
            switch (update.type) {
                case UPDATE_TYPES.INSERT_MARKUP:
                    insertChildAt(update.parentNode, $(update.markup), update.toIndex);
                    break;
                case UPDATE_TYPES.MOVE_EXISTING:
                    insertChildAt(update.parentNode, initialChildren[update.parentID][update.fromIndex], update.toIndex);
                    break;
                case UPDATE_TYPES.REMOVE_NODE:
                    // 什么都不需要做，因为上面已经帮忙删除掉了
                    break;
            }
        }
    }
}

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
        //如果接受了新的，就使用最新的element
        this._currentElement = nextElement || this._currentElement

        var inst = this._instance;
        //合并state
        var nextState = $.extend(inst.state, newState);
        var nextProps = this._currentElement.props;


        //改写state
        inst.state = nextState;


        //如果inst有shouldComponentUpdate并且返回false。说明组件本身判断不要更新，就直接返回。
        if (inst.shouldComponentUpdate && (inst.shouldComponentUpdate(nextProps, nextState) === false)) return;

        //生命周期管理，如果有componentWillUpdate，就调用，表示开始要更新了。
        if (inst.componentWillUpdate) inst.componentWillUpdate(nextProps, nextState);


        var prevComponentInstance = this._renderedComponent;
        var prevRenderedElement = prevComponentInstance._currentElement;
        //重新执行render拿到对应的新element;
        var nextRenderedElement = this._instance.render();


        //判断是需要更新还是直接就重新渲染
        //注意这里的_shouldUpdateReactComponent跟上面的不同哦 这个是全局的方法
        if (_shouldUpdateReactComponent(prevRenderedElement, nextRenderedElement)) {
            //如果需要更新，就继续调用子节点的receiveComponent的方法，传入新的element更新子节点。
            prevComponentInstance.receiveComponent(nextRenderedElement);
            //调用componentDidUpdate表示更新完成了
            inst.componentDidUpdate && inst.componentDidUpdate();

        } else {
            //如果发现完全是不同的两种element，那就干脆重新渲染了
            var thisID = this._rootNodeID;
            //重新new一个对应的component，
            this._renderedComponent = this._instantiateReactComponent(nextRenderedElement);
            //重新生成对应的元素内容
            var nextMarkup = _renderedComponent.mountComponent(thisID);
            //替换整个节点
            $('[data-reactid="' + this._rootNodeID + '"]').replaceWith(nextMarkup);

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
    var child;
    var name;
    var childrenMap = {};
    for (var i = 0; i < componentChildren.length; i++) {
        child = componentChildren[i];
        name = child && child._currentelement && child._currentelement.key ? child._currentelement.key : i.toString(36);
        childrenMap[name] = child;
    }
    return childrenMap;
}

function generateComponentChildren(prevChildren, nextChildrenElements) {
    var nextChildren = {};
    nextChildrenElements = nextChildrenElements || [];
    $.each(nextChildrenElements, function(index, element) {
        var name = element.key ? element.key : index;
        var prevChild = prevChildren && prevChildren[name];
        var prevElement = prevChild && prevChild._currentElement;
        var nextElement = element;

        //调用_shouldUpdateReactComponent判断是否是更新
        if (_shouldUpdateReactComponent(prevElement, nextElement)) {
            //更新的话直接递归调用子节点的receiveComponent就好了
            prevChild.receiveComponent(nextElement);
            //然后继续使用老的component
            nextChildren[name] = prevChild;
        } else {
            //对于没有老的，那就重新新增一个，重新生成一个component
            var nextChildInstance = instantiateReactComponent(nextElement, null);
            //使用新的component
            nextChildren[name] = nextChildInstance;
        }
    })

    return nextChildren;
}

//  用来判断两个element是否需要更新
function _shouldUpdateReactComponent(prevElement, nextElement) {
    if (prevElement != null && nextElement != null) {
        var prevType = typeof prevElement;
        var nextType = typeof nextElement;
        if (prevType === 'string' || prevType === 'number') {
            return nextType === 'string' || nextType === 'number';
        } else {
            return nextType === 'object' && prevElement.type === nextElement.type && prevElement.key === nextElement.key;
        }
    }
    return false;
}