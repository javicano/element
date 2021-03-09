import Vue from 'vue';
import { on } from 'element-ui/src/utils/dom';

const nodeList = [];
const ctx = '@@clickoutsideContext';

let startClick;
let seed = 0;

!Vue.prototype.$isServer && on(document, 'mousedown', e => (startClick = e));

!Vue.prototype.$isServer && on(document, 'mouseup', e => {
  nodeList.forEach(node => node[ctx].documentHandler(e, startClick));
});

/**
 * z-element: Get Element from Event method "composedPath"
 * Additional Information:
 *   event.target return the DOM host element where shadow-dom is injected
 *   instead of target element where event was generated.
 * @param {Event} event
 */
function getElementFromComposedPath(event) {
  // Firefox, Edge
  if (event.composedPath && event.composedPath().length > 0) {
    return event.composedPath()[0];
  }
  // Chrome
  if (event.path && event.path.length > 0) {
    return event.path[0];
  }
}

function createDocumentHandler(el, binding, vnode) {
  return function(mouseup = {}, mousedown = {}) {
    if (!vnode ||
      !vnode.context ||
      !mouseup.target ||
      !mousedown.target ||
      el.contains(mouseup.target) ||
      el.contains(mousedown.target) ||
      // z-element: Add custom condition for shadow-dom
      el.contains(getElementFromComposedPath(mouseup)) ||
      el.contains(getElementFromComposedPath(mousedown)) ||
      el === mouseup.target ||
      // z-element: Add custom condition for shadow-dom
      el === getElementFromComposedPath(mouseup) ||
      (vnode.context.popperElm &&
        (vnode.context.popperElm.contains(mouseup.target) ||
          vnode.context.popperElm.contains(mousedown.target))) ||
      // z-element: Add custom condition for shadow-dom
      (vnode.context.popperElm &&
        (vnode.context.popperElm.contains(getElementFromComposedPath(mouseup)) ||
          vnode.context.popperElm.contains(getElementFromComposedPath(mousedown))))) {
      return;
    }

    if (binding.expression &&
      el[ctx].methodName &&
      vnode.context[el[ctx].methodName]) {
      vnode.context[el[ctx].methodName]();
    } else {
      el[ctx].bindingFn && el[ctx].bindingFn();
    }
  };
}

/**
 * v-clickoutside
 * @desc 点击元素外面才会触发的事件
 * @example
 * ```vue
 * <div v-element-clickoutside="handleClose">
 * ```
 */
export default {
  bind(el, binding, vnode) {
    nodeList.push(el);
    const id = seed++;
    el[ctx] = {
      id,
      documentHandler: createDocumentHandler(el, binding, vnode),
      methodName: binding.expression,
      bindingFn: binding.value
    };
  },

  update(el, binding, vnode) {
    el[ctx].documentHandler = createDocumentHandler(el, binding, vnode);
    el[ctx].methodName = binding.expression;
    el[ctx].bindingFn = binding.value;
  },

  unbind(el) {
    let len = nodeList.length;

    for (let i = 0; i < len; i++) {
      if (nodeList[i][ctx].id === el[ctx].id) {
        nodeList.splice(i, 1);
        break;
      }
    }
    delete el[ctx];
  }
};
