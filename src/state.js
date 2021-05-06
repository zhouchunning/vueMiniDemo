import { observe } from "./observer/index";
import { isFunction } from "./utils";

// 状态的初始化
export function initState(vm) {
    const opts = vm.$options;

    if (opts.props) initProps(vm);
    if (opts.methods) initMethod(vm);
    if (opts.data) {
        initData(vm);
    }

    if (opts.computed) initComputed(vm);
    if (opts.watch) initWatch(vm);
}

function initProps(){}
function initMethod(){}
// 数据代理
function proxy(vm, source, key) {
    Object.defineProperty(vm, key, {
        get() {
            return vm[source][key];
        },
        set(newValue) {
            vm[source][key] = newValue;
        }
    })
}
// 初始化数据
function initData(vm) {
    // vm.$el
    // vue 内部会对属性检测如果是已 $ 开头 不会进行代理
    let data = vm.$options.data;
    // vue2中会将data中的所有数据 进行数据劫持 Object.defineProperty

    // 这个时候 vm 和 data 没有任何关系，通过_data进行关联
    data = vm._data = isFunction(data) ? data.call(vm) : data;
    // 将 _data 上的属性全部代理给 vm 实例
    // 用户去掉 vm.xxx => vm._data.xxx
    for (let key in data) { // vm.name = "xxx" vm._data.name = "xxx"
        proxy(vm, "_data", key);
    }
    observe(data);
}
function initComputed(){}
function initWatch(){}
