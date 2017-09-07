import * as lodash from "lodash";
import * as toStyle from "to-style";

import { hasOwnProperty, noop } from "./helper/util";
import { $, $$ } from "./helper/dom";
import Event from "./helper/event";

    //  事件名正则
const EVENT_REG = /^on[a-z]+/i,

    //  单标签正则
    SINGLE_TAG_REG = /br|hr|img|input|param/,

    //  缓存document
    doc = document;

export function instantiateReactComponent(node) {
    //  文本节点的情况
    if (typeof node === "string" || typeof node === "number") {
        return new ReactDOMTextComponent(node);
    }

    //  浏览器默认节点的情况
    if (typeof node === "object" && typeof node.type === "string") {
        console.log("浏览器默认节点的情况");
        console.log(new ReactDOMComponent(node));
        return new ReactDOMComponent(node);
    }

    //  自定义的元素节点
    if (typeof node === "object" && typeof node.type === "function") {
        // console.log("自定义的元素节点");
        // console.log(node);
        return new ReactCompositeComponent(node);
    }
}

//  文本组件
export class ReactDOMTextComponent {
    constructor(text) {
        //  存下当前的字符串
        this._currentElement =  ("" + text);
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
        return `<!-- react-text: ${this._rootNodeID} -->${this._currentElement}<!-- /react-text -->`;
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

export class ReactDOMComponent {
    constructor(element) {
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

        const { props, type } = this._currentElement,
            { children } = props,
            isSingleTag = SINGLE_TAG_REG.test(type);
        let tagOpen, tagClose, propKey, propValue, eventType, childrenInstances, childComponentInstance, childrenMarkups, curRootId;

        tagOpen = [];
        tagOpen.push(`<${type}`, `data-reactid="${this._rootNodeID}"`);

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

                    tagOpen.push(`style="${propValue}"`);
                } else if (propValue === "className") {
                    tagOpen.push(`class="${propValue}"`);
                } else {
                    tagOpen.push(`${propKey}="${propValue}"`);
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
                childrenMarkups.push(childComponentInstance.mountComponent.call(childComponentInstance, curRootId));
            });
        }

        this._renderedChildren = childrenInstances;
        return `${tagOpen.join(" ")} ${childrenMarkups.join(" ")} ${tagClose}`;
    }

    receiveComponent(nextElement) {}

    _updateDOMProperties(lastProps, nextProps) {}

    _updateDOMChildren(nextChildrenElements) {}
}

export class ReactCompositeComponent {
    constructor(element) {
        //  存放元素element对象
        this._currentElement = element;
        //  存放唯一标识
        this._rootNodeID = null;
        //  存放对应的ReactClass的实例
        this._instance = null;
    }

    mountComponent(rootID, hostContainerInfo, context) {
        this._rootNodeID = rootID;
        const { props, type} = this._currentElement,
            ReactClass = type,
            inst = new ReactClass(props);
        let renderedElement, renderedComponentInstance, renderedMarkup;

        this._instance = inst;
        inst._reactInternalInstance = this;

    if (lodash.isFunction(inst.componentWillMount)) {
        inst.componentWillMount();
    }

    renderedElement = this._instance.render();
    renderedComponentInstance = instantiateReactComponent(renderedElement);
    this._renderedComponent = renderedComponentInstance;
    renderedMarkup = renderedComponentInstance.mountComponent(this._rootNodeID);

    return renderedMarkup;

    // var publicProps = this._currentElement.props;
    // //拿到对应的ReactClass
    // var ReactClass = this._currentElement.type;
    // // Initialize the public class
    // var inst = new ReactClass(publicProps);
    // this._instance = inst;
    // //保留对当前comonent的引用，下面更新会用到
    // inst._reactInternalInstance = this;

    // if (inst.componentWillMount) {
    //     inst.componentWillMount();
    //     //这里在原始的reactjs其实还有一层处理，就是  componentWillMount调用setstate，不会触发rerender而是自动提前合并，这里为了保持简单，就略去了
    // }
    // //调用ReactClass的实例的render方法,返回一个element或者一个文本节点
    // var renderedElement = this._instance.render();
    // //得到renderedElement对应的component类实例
    // var renderedComponentInstance = instantiateReactComponent(renderedElement);
    // this._renderedComponent = renderedComponentInstance; //存起来留作后用

    // //拿到渲染之后的字符串内容，将当前的_rootNodeID传给render出的节点
    // var renderedMarkup = renderedComponentInstance.mountComponent(this._rootNodeID);

    // //之前我们在React.render方法最后触发了mountReady事件，所以这里可以监听，在渲染完成后会触发。
    // $(document).on('mountReady', function() {
    //     //调用inst.componentDidMount
    //     inst.componentDidMount && inst.componentDidMount();
    // });

    // return renderedMarkup;
    }

    receiveComponent(nextElement, newState) {}
}
