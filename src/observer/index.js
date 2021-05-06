import { arrayMethods } from "./array";
import Dep from "./dep";

/**
 * 1.如果数据是对象，会将对象不停的递归进行劫持
 * 2.如果是数组，会劫持数组的方法，并对数组中不是基本数据类型的进行检测
 *
 * 检测数据变化 类有类型，对象无类型
 */

// 观察值
/**
 * 如果给对象新增一个属性不会触发视图更新
 * （给对象本身也增加一个 dep，dep 中存 watcher，如果增加一个属性后，我就手动的触发watcher的更新）
 */
class Observer {
    constructor(value) { // 对对象中的所有属性进行劫持

        // 数据可能是数组或者对象
        this.dep = new Dep();

        // 给所有响应式数据增加标识，并且可以在响应式上获取 Observer 实例上的方法
        Object.defineProperty(value, "__ob__", {
            enumerable: false, // 不可枚举的
            configurable: false,
            value: this
        });
        // value.__ob__ = this; // 所有被劫持过的属性都有__ob__
        if (Array.isArray(value)) { // 我希望数组的变化可以触发视图更新？
            // 数组挟持的逻辑
            // 对数组原来的方法进行改写，切片编程 高阶函数
            value.__proto__ = arrayMethods;
            // 如果数组中的数据是对象类型，需要监控对象的变化
            this.observeArray(value);
        } else {
            // 对象劫持的逻辑
            this.walk(value);
        }
    }

    // 对我们数组的数组和数组中的对象再次劫持，递归了
    observeArray(value) {
        // 如果数组里放的是对象类型，也做了观测，JSON.stringify() 也做了收集起来了
        value.forEach(item => observe(item));
    }

    // 让对象上的所有属性依次进行观测
    walk(data) {
        Object.keys(data).forEach(key => {
            defineReactive(data, key, data[key]);
        })
    }
}

// vue2 会对对象进行遍历，将每个属性用 defineProperty 重新定义，性能差
function dependArray(value) {
    for (let i = 0; i < value.length; i++) {
        // current 是数组里面的数组 [[[[]]]]
        const current = value[i];
        current.__ob__ && current.__ob__.dep.depend();
        if (Array.isArray(current)) {
            dependArray(current);
        }
    }
}


function defineReactive(data, key, value) {// value 有可能是对象
    // 本身用户默认值是对象套对象，需要递归处理
    const childOb = observe(value);
    // 每个属性都有一个 dep 属性
    const dep = new Dep();
    // 获取到了数组对应 ob
    // 对象依赖收集
    Object.defineProperty(data, key, {
        get() {
            // 取值时我希望将 watcher 和 dep 对应起来
            if (Dep.target) { // 此值是在模板中取值的
                // 让 dep 记住 watcher
                dep.depend();
                // 可能是数组 可能是对象，对象也要收集依赖，后续写 $set 方法时需要触发他自己的更新操作
                if (childOb) {
                    // 就是让数组和对象也记录 watcher
                    childOb.dep.depend();

                    // 取外层数组要将数组里面的也进行依赖收集
                    if (Array.isArray(value)) {
                        // 递归收集数组依赖
                        dependArray(value);
                    }
                }
            }
            return value;
        },
        set(newValue) {
            // todo... 更新视图
            if (newValue !== value) {
                // 如果用户赋值一个新对象，需要将这个对象进行挟持
                observe(newValue);
                value = newValue;
                // 告诉当前的属性存放的 watcher 执行更新视图
                dep.notify();
            }
        }
    })

}

export function observe(data) {
    // 如果是对象才观测
    if (typeof data !== "object" || data === null) {
        return;
    }
    // 默认最外层的 data 必须是一个对象
    return new Observer(data);
}
