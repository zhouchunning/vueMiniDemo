import { compileToFunction } from "./compiler/index";
import { mountComponent, callHook } from "./lifecycle";
import { initState } from "./state";
import { mergeOptions } from "util/index";

// 初始化 vue 状态

// 表示在 vue 的基础上做一次混合操作
export function initMixin(Vue) {
    Vue.prototype._init = function (options) {
        // el, data
        const vm = this;
        // 后面会对 options 进行扩展操作
        // 合并参数
        vm.$options = mergeOptions(vm.constructor.options, options);
        // 初始化生命周期
        callHook(vm, "beforeCreate");
        // 对数据进行初始化 watch computed props data ...
        // vm.$options.data 数据劫持
        initState(vm);
        callHook(vm, "created");

        if (vm.$options.el) {
            // 将数据挂载到这个模板上
            vm.$mount(vm.$options.el);
        }
    }

    // 挂载
    Vue.prototype.$mount = function (el) {
        const vm = this;
        const options = vm.$options;
        el = document.querySelector(el);
        vm.$el = el;
        // 把模板转换成对应的渲染函数 => 虚拟dom概念 vnode => diff算法 更新虚拟dom => 产生真实节点，更新
        // 没有 render 用template，目前没有 render

        if (!options.render) {
            let template = options.template;
            // 用户也没有传递 template 就取 el 的内容作为模板
            if (!template && el) {
                template = el.outerHTML;
            }
            options.render = compileToFunction(template);
        }

        // options.render 就是渲染函数
        // 调用 render 方法 渲染成真实 dom 替换掉页面的内容
        mountComponent(vm, el); // 组件的挂载流程
    }
}
