import * as lodash from "lodash";
import { hasOwnProperty, makeArray } from "./util";
import Event from "./event";

const doc = document;

/**
 *  代理document.querySelector
 *  @param   {String}  selector  [css选择器]
 *  @return  {Element}           [HTMLElement对象]
 */
export function $ (selector) {
	return doc.querySelector(selector);
}

/**
 *  代理document.querySelectorAll
 *  @param   {String}  selector  [css选择器]
 *  @return  {Element}           [HTMLElement对象集合]
 */
export function $$(selector) {
	return makeArray(doc.querySelectorAll(selector));
}

/**
 *  将子元素插入到相应下标的位置
 *  @param   {Element}  parentNode  [父元素容器]
 *  @param   {Element}  childNode   [要被插入的元素]
 *  @param   {Number}   index       [要被插到哪里]
 *  @return  {ELement}              [被插入的元素]
 */
export function insertChildAt(parentNode, childNode, index) {
	let fragement = childNode;
	if (lodash.isString(childNode)) {
		fragement = doc.createDocumentFragment();
		fragement.innerHTML = childNode;
	}
    const beforeChild = parentNode.children[index];
    beforeChild ? parentNode.insertBefore(fragement, beforeChild) : parentNode.appendChild(fragement);
    return childNode;
}