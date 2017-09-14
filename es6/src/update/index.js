import * as lodash from "lodash";
import { hasOwnProperty, makeArray } from "../helper/util";
import { $, $$, insertChildAt } from "../helper/dom";
import Event from "../helper/event";
import { instantiateReactComponent } from "../react.componet";

//  更新类型
const UPDATE_TYPES = {
    MOVE_EXISTING: 1,
    REMOVE_NODE: 2,
    INSERT_MARKUP: 3
};

//  事件名称正则
const EVENT_REG = /^on[a-z]+/i;

//  缓存document对象
const doc = document;

/**
 *  把原来是数组的子组件集合转换成Map返回
 *  @param   {Array}  componentChildren     [子组件集合]
 *  @return  {Object}                       [输出的Map, 每个子组件的key或者一个随机数做key]
 */
function flattenChildren(componentChildren) {
    let childrenMap = {},
        child, name, i, len;

    for (i = 0, len = componentChildren.length; i < len; i++) {
        child = componentChildren[i];
        name = child && child._currentelement && child._currentelement.key ? child._currentelement.key : i.toString(36);
        childrenMap[name] = child;
    }
    return childrenMap;
}

/**
 *  生成子节点elements的component集合
 *  @param   {Object}  prevChildren          [flattenChildren返回的Map]
 *  @param   {Array}   nextChildrenElements  [即将要渲染的节点]
 *  @return  {Object}                        [子节点elements的component集合]
 */
function generateComponentChildren(prevChildren, nextChildrenElements, log) {

    if (log) {
        console.log(prevChildren);
        console.log(nextChildrenElements);
    }

    let nextChildren = {},
        index, len, name, prevChild, prevElement, nextElement, nextChildInstance, element;
    nextChildrenElements = nextChildrenElements || [];

    for (index = 0, len = nextChildrenElements.length; index < len; index++) {
        element = nextChildrenElements[index];
        name = (element && element.key) ? element.key : index;
        prevChild = prevChildren && prevChildren[name];
        prevElement = prevChild && prevChild._currentElement;
        nextElement = element;

        //  组件有更新, 调用当前组件下的reciveComponent去更新组件
        if (shouldUpdateReactComponent(prevElement, nextElement)) {
            prevChild.receiveComponent(nextElement);
            nextChildren[name] = prevChild;
        } else {
            //  新节点, 实例化新组件
            nextChildInstance = instantiateReactComponent(nextElement);
            nextChildren[name] = nextChildInstance;
        }
    }

    return nextChildren;
}

/**
 *  判断组件是否需要更新
 *  @param   {Object}  prevElement  [老的vnode]
 *  @param   {Object}  nextElement  [新的vnode]
 *  @return  {Boolean}              [标识组件是否需要更新]
 */
export function shouldUpdateReactComponent(prevElement, nextElement) {
    //  排除两者都为空的情况
    if (!lodash.isNull(prevElement) && !lodash.isNull(nextElement) && !lodash.isUndefined(prevElement) && !lodash.isUndefined(nextElement)) {
        const prevType = typeof prevElement,
            nextType = typeof nextElement;

        //  纯文本组件
        if (prevType === "number" || prevType === "string") {
            return (nextType === "number" || nextType === "number");
        } else {
            let prevChildren = [],
                nextChildren = [],
                childEqual = true;

            if(prevElement && prevElement.props) {
                prevChildren = prevElement.props.children || [];
            }

            if (nextElement && nextElement.props) {
                nextChildren = nextElement.props.children || [];
            }

            childEqual = prevChildren.length === nextChildren.length;

            return (nextType === "object" &&
                (prevElement.type === nextElement.type) &&
                (prevElement.key === nextElement.key) &&
                childEqual);
        }
    }

    return false;
}

export const update = {
    //  更新深度标识
    updateDepth: 0,

    //  更新队列
    diffQueue: [],

    /**
     *  递归找出差别, 组装差异对象, 添加到更新队列diffQueue
     *  @param   {Array}  diffQueue             [更新队列]
     *  @param   {Array}  nextChildrenElements  [新的子组件集合]
     *  @param   {Object} component             [被diff的组件]
     *  @return  {Array}                        [需要更新的内容]
     */
    diff(diffQueue, nextChildrenElements, component) {
        //  获取到当前组件下已经渲染的组件集合
        const prevChildren = flattenChildren(component._renderedChildren),

            //  生成新的子节点的component对象集合(如果是组件有更新, 就复用原来的, 如果是新增就是新的组件实例)
            nextChildren = generateComponentChildren(prevChildren, nextChildrenElements);

        // if(component._rootNodeID === "0.1") {
        //     console.log(makeArray(component._renderedChildren));
        //     console.log(nextChildrenElements);
        // }

        let lastIndex = 0,
            nextIndex = 0,
            prevChild = null,
            nextChild = null,
            name, props, propKey, eventType;

        //  枚举nextChildren
        for (name in nextChildren) {
            if (!hasOwnProperty(nextChildren, name)) {
                continue;
            }

            prevChild = prevChildren && prevChildren[name];
            nextChild = nextChildren[name];

            //  两个相同说明是使用的同一个component,所以我们需要做移动的操作
            if (lodash.isEqual(prevChild, nextChild)) {
                if (prevChild._mountIndex < lastIndex) {
                    this.diffQueue.push({
                        parentId: component._rootNodeID,
                        parentNode: $(`[data-reactid="${component._rootNodeID}"]`),
                        type: UPDATE_TYPES.MOVE_EXISTING,
                        fromIndex: prevChild._mountIndex,
                        toIndex: nextIndex
                    });
                }
                lastIndex = Math.max(prevChild._mountIndex, lastIndex);
            } else {
                //  之前存在子节点, 需要先将子节点移除
                if (prevChild) {
                    this.diffQueue.push({
                        parentId: component._rootNodeID,
                        parentNode: $(`[data-reactid="${component._rootNodeID}"]`),
                        type: UPDATE_TYPES.REMOVE_NODE,
                        fromIndex: prevChild._mountIndex,
                        toIndex: null
                    });
                    lastIndex = Math.max(prevChild._mountIndex, lastIndex);

                    props = (prevChild._currentElement && prevChild._currentElement.props) ? prevChild._currentElement.props : {};

                    for (propKey in props) {
                        if (hasOwnProperty(props, propKey) && EVENT_REG.test(propKey)) {
                            eventType = propKey.replace("on", "");
                            Event.undelegate({
                                element: doc,
                                type: eventType,
                                selector: `[data-reactid="${prevChild._rootNodeID}"]`
                            });
                        }
                    }
                    //  TODO: 如果有事件代理要移除相应事件代理
                }

                //  新增的节点, 需要push到diffQueue
                if (nextChild) {
                    this.diffQueue.push({
                        parentId: component._rootNodeID,
                        parentNode: $(`[data-reactid="${component._rootNodeID}"]`),
                        type: UPDATE_TYPES.INSERT_MARKUP,
                        fromIndex: null,
                        toIndex: nextIndex,
                        markup: nextChild.mountComponent(`${component._rootNodeID}.${name}`)
                    });
                }
            }

            //  更新_mountIndex和nextIndex
            nextChild._mountIndex = nextIndex;
            nextIndex++;

            //  把nextChildren克隆一份给_renderedChildren
            component._renderedChildren = makeArray(nextChildren);
        }
    },

    /**
     *  应用更新, 执行DOM操作
     *  @param   {Array}  updates  [差异对象集合]
     */
    patch(updates) {
        let initialChildren = {},
            deleteChildren = [],
            updatedIndex, updatedChild, parentID;
        for (let update of updates) {
            updatedIndex = update.fromIndex;
            updatedChild = update.parentNode.children[updatedIndex];
            parentID = update.parentID;

            //  把所有需要更新的节点都保存下来
            initialChildren[parentID] = initialChildren[parentID] || [];

            //  使用parentID作为简易命名空间
            initialChildren[parentID][updatedIndex] = updatedChild;

            //  所有需要修改的节点先删除,对于move的,后面再重新插入到正确的位置即可
            if (!lodash.isNull(updatedChild) && !lodash.isUndefined(updatedChild)) {
                deleteChildren.push(updatedChild);
            }
        }

        //  删除需要删除的节点
        for (let child of deleteChildren) {
            child.parentNode.removeChild(child);
        }

        for (let updateItem of updates) {
            switch (updateItem.type) {
                //  插入新元素
                case UPDATE_TYPES.INSERT_MARKUP:
                    insertChildAt(updateItem.parentNode, updateItem.markup, updateItem.toIndex);
                    break;

                    //  元素位置发生改变    
                case UPDATE_TYPES.MOVE_EXISTING:
                    insertChildAt(updateItem.parentNode, initialChildren[updateItem.parentID][updateItem.fromIndex], updateItem.toIndex);
                    break;

                    //  上面已经删除, 所以不需要处理
                case UPDATE_TYPES.REMOVE_NODE:
                    break;

                default:
                    break;
            }
        }

        //  重置相关变量
        this.reset();
    },

    /**
     *  重置相关变量
     */
    reset() {
        this.updateDepth = 0;
        this.diffQueue = [];
    }
};