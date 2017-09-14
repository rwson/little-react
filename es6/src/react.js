import * as lodash from "lodash";
import StackTrace from "stacktrace-js";

import { instantiateReactComponent } from "./react.componet";
import { hasOwnProperty, uuid, makeArray, noop } from "./helper/util";

//  Element.prototype.matches兼容, 事件代理中使用css选择器
import "./helper/polyfill";

    //  无用的一些属性
const uselessProp = ["key", "ref", "__self", "__source"],

    //  匹配这种app.render
    RENDER_REG = /\.render/gi;

/**
 *  用于转换jsx
 */
class ReactElement {
    constructor(type, key, props, ref) {
        this.type = type;
        this.key = key;
        this.props = props || {};
        this.refs = ref || {};
        this.context = {};
    }
}

/**
 *  所有子类的超级父类
 */
export class Component {

    constructor() {}

    setState(newState, callback) {
        const stacks = StackTrace.getSync();
        for(let {functionName, source} of stacks) {
            if(RENDER_REG.test(functionName) && RENDER_REG.test(source)) {
                throw new Error("callStack Error: you can't call setState in render method!");
            }
        }
        this._reactInternalInstance.receiveComponent(null, newState);

        if (lodash.isFunction(callback)) {
            callback();
        }
    }

    /**
     *  组件即将被挂载到DOM上
     */
    componentWillMount() {}

    /**
     *  组件已经被挂载到DOM上
     */
    componentDidMount() {}

    /**
     *  组件即将收到新的props
     *  @param   {Object}  nextProps  [新的props]
     *  @param   {Object}  nextState  [新的state]
     */
    componentWillReceiveProps(nextProps, nextState) {}

    /**
     *  组件是否应该更新
     *  @param   {Object}  nextProps  [新的props]
     *  @param   {Object}  nextState  [新的state]
     *  @return  {Boolean}            [标记组件是否应该更新]
     */
    shouldComponentUpdate(nextProps, nextState) {
        return lodash.isEqual(this.state, nextState) || lodash.isEqual(this.props, nextProps);
    }

    /**
     *  组件即将更新
     */
    componentWillUpdate() {}

    /**
     *  组件已经更新
     */
    componentDidUpdate() {}

    /**
     *  组件即将被卸载
     */
    componentWillUnmount() {}

    /**
     *  返回组件内部的jsx
     *  @return  {JSX}  [组件布局]
     */
    render() {}
}

/**
 *  解析JSX
 */
function createElement(type, config) {
    let argus = makeArray(arguments),
        props = {},
        key = null,
        ref = null;
    if (config !== null) {
        ref = lodash.isUndefined(config.ref) ? null : config.ref;
        key = lodash.isUndefined(config.key) ? null : "" + config.key;
        for (let propsName in config) {
            if (uselessProp.indexOf(propsName) === -1 && hasOwnProperty(config, propsName)) {
                props[propsName] = config[propsName];
            }
        }
    }

    if (argus.length > 2) {
        //  子组件
        props.children = [];
        props.children = makeArray(props.children.concat([].slice.call(argus, 2)), true);
    }

    return new ReactElement(type, key, props, ref);
}

//  渲染函数
function render(componnet, container, callback = noop) {
    const componentInstance = instantiateReactComponent(componnet),
        markup = componentInstance.mountComponent(React.nextReactRootIndex ++);
    container.innerHTML = markup;

    if (lodash.isFunction(callback)) {
        callback.call(componentInstance);
    }
}

const React = {
    nextReactRootIndex: 0,
    createElement,
    render
};

window["React"] = React;

export default React;