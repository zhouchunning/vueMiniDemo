import { createElement, createTextElement } from "./vdom/index";
export function renderMixin(Vue) {
    // 创建文本
    Vue.prototype._v = function (text){
        return createTextElement(this, text);
    }
    // 创建元素
    Vue.prototype._c = function () {
        return createElement(this, ...arguments);
    }

    Vue.prototype._s = function (val) {
        if (typeof val === "object") return JSON.stringify(val);
        return val;
    }

    Vue.prototype._render = function (){
        const vm = this;
        const { render } = vm.$options;
        return render.call(vm);
    }
}
