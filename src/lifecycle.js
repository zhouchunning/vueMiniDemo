import { patch } from "./vdom/patch";
import Watcher from "./observer/watcher";
export function lifecycleMixin(Vue) {
    Vue.prototype._update = function (vnode) {
        const vm = this;
        // 虚拟节点渲染成真实节点
        vm.$el = patch(vm.$el, vnode);
    };
}

export function mountComponent(vm, el) {
    vm.$el = el;
    // 更新函数，数据变化后会再次调用此函数
    const updateComponent = () => {
        // 调用 render 函数，生成虚拟 dom
        // 将虚拟节点，渲染到页面上
        // 后续更新可以调用updateComponent方法
        vm._update(vm._render());
        // 用虚拟dom 生成真实dom
    }

    // 观察者模式：属性是“被观察者” 刷新页面：“观察者”
    new Watcher(vm, updateComponent, () => {
        console.log("更新视图了")
    }, true);  // 它是一个渲染watcher  后续有其他的watcher
}

/**
 * 调用生命周期
 * @param vm vue
 * @param hook 调用名
 */
export function callHook(vm, hook) {
    const handlers = vm.$options[hook];
    if (handlers) {
        for (let i = 0; i < handlers.length; i++) {
            handlers[i].call(vm);
        }
    }
}
