import { mergeOptions } from "../util/index";
export function initGlobalAPI(Vue) {
    // 用来存放全局的配置，每个组件初始化的时候都会和options选项进行合并
    Vue.options = {};
    Vue.mixin = function (mixin) {
        // 将属性合并到 Vue.options上
        this.options = mergeOptions(this.options, mixin);
        return this;
    }
}
