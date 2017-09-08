import * as lodash from "lodash";
import * as toStyle from "to-style";
import mixin from "mixin-decorator";
import StackTrace from "stacktrace-js";

import { hasOwnProperty, noop } from "./helper/util";
import { $, $$ } from "./helper/dom";
import { shouldUpdateReactComponent, update } from "./update";
import Event from "./helper/event";

//  事件名正则
const EVENT_REG = /^on[a-z]+/i,

    //  单标签正则
    SINGLE_TAG_REG = /br|hr|img|input|param/,

    //  缓存document
    doc = document;

function mapToInstance(obj, inst, keys = []) {
    const { length } = keys;
    Object.keys(obj).forEach((key) => {
        if (hasOwnProperty(obj, key)) {
            if (length === 0) {
                inst[key] = obj[key];
            } else if (keys.indexOf(key) > -1) {
                inst[key] = obj[key];
            }
        }
    });
    return inst;
}

export function instantiateReactComponent(node) {
    //  文本节点的情况
    if (typeof node === "string" || typeof node === "number") {
        return new ReactDOMTextComponent(node);
    }

    //  浏览器默认节点的情况
    if (typeof node === "object" && typeof node.type === "string") {
        return new ReactDOMComponent(node);
    }

    //  自定义的元素节点
    if (typeof node === "object" && typeof node.type === "function") {
        return new ReactCompositeComponent(node);
    }
}

//  文本组件
export class ReactDOMTextComponent {
    constructor(text) {
        this.type = "ReactDOMTextComponent";

        //  存下当前的字符串
        this._currentElement = ("" + text);
        //  组件唯一id
        this._rootNodeID = null;
    }

    /**
     *  component渲染时生成的dom结构
     *  @param   {String}  rootID  [组件唯一id]
     *  @return  {String}          [HTML字符串]
     */
    mountComponent(rootID) {
        this._rootNodeID = rootID;
        return `<span data-reactid="${this._rootNodeID}">${this._currentElement}</span>`;
    }

    /**
     *  接收到新组件
     *  @param   {String}  text  [接收到的新组件]
     */
    receiveComponent(text) {
        const nextStringText = ("" + text);
        if (nextStringText !== this._currentElement) {
            this._currentElement = nextStringText;
            $(`[data-reactid='${this._rootNodeID}']`).textContent = nextStringText;
        }
    }
}

//  DOM标签组件
export class ReactDOMComponent {
    constructor(element) {
        this.type = "ReactDOMComponent";

        //  存下当前元素引用
        this._currentElement = element;
        //  组件唯一id
        this._rootNodeID = null;
        //  子组件集合
        this._renderedChildren = null;
    }

    /**
     *  component渲染时生成的dom结构
     *  @param   {String}  rootID  [组件唯一id]
     *  @return  {String}          [HTML字符串]
     */
    mountComponent(rootID) {
        this._rootNodeID = rootID;
        const { props, type } = this._currentElement, { children } = props,
            isSingleTag = SINGLE_TAG_REG.test(type);
        let tagOpen, tagClose, propKey, propValue, eventType, childrenInstances, childComponentInstance, childrenMarkups, curRootId;
        tagOpen = [];
        tagOpen.push(`<${type}`, `data-reactid='${this._rootNodeID}'`);

        for (propKey in props) {
            if (hasOwnProperty(props, propKey) && propKey !== "children") {

                propValue = props[propKey];
                if (EVENT_REG.test(propKey)) {
                    /**
                     *  handleClick() {
                     *      alert(111);
                     *  }
                     *  
                     *  render() {
                     *      return (
                     *          <div onClick={this.handleClick}>click me</div>
                     *      );
                     *  }
                     */
                    eventType = propKey.replace("on", "").toLowerCase();
                    Event.delegate({
                        element: doc,
                        type: eventType,
                        selector: `[data-reactid="${this._rootNodeID}"]`,
                        handler: propValue,
                        context: null
                    });

                    //  TODO: 实现对当前元素进行事件代理
                } else if (propKey === "style") {

                    /**
                     *  render() {
                     *      return (
                     *          <div style={"background: red;"}></div>
                     *      );
                     *  }
                     *
                     *  -----------------------
                     *
                     *  render() {
                     *      return (
                     *          <div style={{background: 'red'}}>
                     *          </div>
                     *      );
                     *  }
                     */
                    if (lodash.isObject(propValue)) {
                        propValue = toStyle.string(propValue);
                    }

                    tagOpen.push(`style='${propValue}'`);
                } else if (propKey === "className") {
                    tagOpen.push(`class='${propValue}'`);
                } else {
                    tagOpen.push(`${propKey}='${propValue}'`);
                }
            }
        }

        if (isSingleTag) {
            tagOpen.push("/>");
            tagClose = "";
        } else {
            tagOpen.push(">");
            tagClose = `</${type}>`;
        }

        childrenMarkups = [];
        childrenInstances = [];

        if (children && children.length) {
            children.forEach((child, key) => {
                childComponentInstance = instantiateReactComponent(child);
                childrenInstances.push(childComponentInstance);
                childComponentInstance._mountIndex = key;
                curRootId = `${this._rootNodeID}.${key}`;
                childrenMarkups.push(childComponentInstance.mountComponent(curRootId));
            });
        }

        this._renderedChildren = childrenInstances;
        return `${tagOpen.join(" ")} ${childrenMarkups.join("")} ${tagClose}`;
    }

    receiveComponent(nextElement) {
        const lastProps = this._currentElement.props,
            nextProps = nextElement.props;

        this._currentElement = nextElement;

        //  需要单独的更新属性
        this._updateDOMProperties(lastProps, nextProps);

        //  再更新子节点
        this._updateDOMChildren(nextElement.props.children);
    }

    /**
     *  更新组件中相关DOM的属性
     *  @param    {Object}  lastProps  [旧属性]
     *  @param    {Object}  nextProps  [新属性]
     *  @private
     */
    _updateDOMProperties(lastProps, nextProps) {
        const { _rootNodeID } = this,
        element = $(`[data-reactid="${_rootNodeID}"]`);
        let propKey, propValue, eventType, removed;

        for (propKey in lastProps) {
            //  只删除老属性中有但是新属性中没有的
            if (hasOwnProperty(lastProps, propKey) && !hasOwnProperty(nextProps, propKey)) {
                propValue = lastProps[propKey];

                //  之前的事件代理需要解除
                if (EVENT_REG.test(propKey)) {

                    //  TODO: 解除事件代理
                    continue;
                } else if (propKey === "className") {
                    removed = "class";
                } else {
                    removed = propKey;
                }

                //  删除相关属性
                element.removeAttribute(removed);
            }
        }

        //  开始遍历新属性集合
        for (propKey in nextProps) {
            if (hasOwnProperty(nextProps, propKey) && propKey !== "children") {
                propValue = lastProps[propKey];

                if (EVENT_REG.test(propKey)) {

                    //  TODO: 重新事件代理
                    continue;
                } else if (propKey === "className") {
                    element.setAttribute("class", propValue);
                } else if(propKey === "style") {
                    if (lodash.isObject(propValue)) {
                        propValue = toStyle.string(propValue);
                    }
                    element.setAttribute(propKey, propValue);
                } else {
                    element.setAttribute(propKey, propValue);
                }
            }
        }
    }

    /**
     *  更新子元素
     *  @param    {Array}  nextChildrenElements  [被更新的组件队列]
     */
    _updateDOMChildren(nextChildrenElements) {
        update.updateDepth ++;

        //  递归找出差别, 组装差异对象
        update.diff(update.diffQueue, nextChildrenElements, this);
        update.updateDepth --;
        //  应用更新
        if (update.updateDepth === 0) {
            update.patch(update.diffQueue);
        }
    }
}

//  自定义标签组件
export class ReactCompositeComponent {
    constructor(element) {
        this.type = "ReactCompositeComponent";

        //  存放元素element对象
        this._currentElement = element;
        //  存放唯一标识
        this._rootNodeID = null;
        //  存放对应的ReactClass的实例
        this._instance = null;
    }

    //  启动组件
    mountComponent(rootID) {
        this._rootNodeID = rootID;
        const { props, type } = this._currentElement,
            ReactClass = type,
            inst = new ReactClass(props);
        let props2 = lodash.clone(props),
            element2 = lodash.clone(this._currentElement),
            renderedElement, renderedComponentInstance, renderedMarkup;

        //  把相关属性拷贝到实例上
        this._instance = mapToInstance(Object.assign(element2, {
            props: props2
        }, {
            state: inst.state || null
        }), inst);

        inst._reactInternalInstance = this;

        delete props2.children;
        delete element2.key;

        //  生命周期componentWillMount
        inst.componentWillMount();

        renderedElement = this._instance.render();
        renderedComponentInstance = instantiateReactComponent(renderedElement);
        this._renderedComponent = renderedComponentInstance;
        renderedMarkup = renderedComponentInstance.mountComponent(this._rootNodeID);

        //  生命周期componentDidMount
        inst.componentDidMount();
        return renderedMarkup;
    }


    receiveComponent(nextElement, newState) {
        //  如果接受了新的, 就使用最新的element
        this._currentElement = nextElement || this._currentElement;

        const { _rootNodeID } = this;

        let inst = this._instance,

            //  nextState和nextProps的处理
            nextState = Object.assign(inst.state, newState),
            nextProps = lodash.clone(this._currentElement.props),
            prevComponentInstance,
            prevRenderedElement,
            nextRenderedElement,
            nextMarkup;

        //  修改组件的state
        inst.state = nextState;

        //  声明周期shouldComponentUpdate
        if (!inst.shouldComponentUpdate(nextProps, nextState)) {
            return;
        }

        //  声明周期componentWillUpdate
        inst.componentWillUpdate(nextProps, nextState);

        //  之前的组件组件实例
        prevComponentInstance = this._renderedComponent;

        //  之前的组件元素
        prevRenderedElement = prevComponentInstance._currentElement;

        //  即将被渲染的新组件元素
        nextRenderedElement = this._instance.render();

        //  判断是需要更新还是直接就重新渲染
        if ((!lodash.isNull(prevRenderedElement) && !lodash.isNull(nextRenderedElement)) && shouldUpdateReactComponent(prevRenderedElement, nextRenderedElement)) {
            prevComponentInstance.receiveComponent(nextRenderedElement);
            inst.componentDidUpdate();
        } else {
            //  重新new一个对应的component
            this._renderedComponent = this.instantiateReactComponent(nextRenderedElement);

            //  重新生成对应的元素内容
            nextMarkup = this._renderedComponent.mountComponent(_rootNodeID);

            //  替换整个节点
            $(`[data-reactid="${_rootNodeID}"]`).innerHTML = nextMarkup;
        }
    }
}