import { hasOwnProperty, makeArray } from "./util";
import Event from "./event";

const doc = document,
	createFragment = doc.createDocumentFragment;

export function $ (selector) {
	return doc.querySelector(selector);
}

export function $$(selector) {
	return makeArray(doc.querySelectorAll(selector));
}
