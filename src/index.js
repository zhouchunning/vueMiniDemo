import { initMixin } from "./init";
import { lifecycleMixin } from "./lifecycle";
import { renderMixin } from "./render";
import { initGlobalAPI } from "./global-api/index";

function Vue(options) {
    // options 为用户传入的选项

    // 初始化操作，组件
    this._init(options);
}

// 扩展原型的
initMixin(Vue); // 给原型上新增_init方法
renderMixin(Vue); // _render
lifecycleMixin(Vue); // _update

// 在类上扩展的 Vue.mixin
initGlobalAPI(Vue);
export default Vue;


/**
 * init 主要做了状态的初始化（数据劫持 对象、数组）
 * $mount 找render方法（template -> render函数 ast -> codegen -> 字符串）
 * render = with + new Function(codegen)产生虚拟dom的方法
 * 虚拟dom -> 真实dom
 * vm._update(vm._render()); 先生成虚拟 dom -> 生成真实的dom元素
 * 初次渲染
 *
 */
