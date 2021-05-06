import { pushTarget, popTarget } from "./dep";
import { queueWatcher } from "./scheduler";
let id = 0;
class Watcher {
    constructor(vm, exprOrFn, cb, options) {
        this.vm = vm;
        this.exprOrFn = exprOrFn;
        if (typeof exprOrFn === "function") {
            this.getter = exprOrFn;
        }
        this.cb = cb;
        this.options = options;
        this.id = id++;

        // 默认应该让exprOrFn执行  exprOrFn 方法做了什么是？ render （去vm上了取值）
        this.deps = [];
        this.depsId = new Set();
        this.get(); // 默认初始化 要取值
    }
    // 稍后用户更新时，可以重新调用 getter 方法
    get() {
        // defineProperty.get, 每个属性都可以收集自己的watcher
        // 我希望一个属性可以对应多个watcher，同时一个 watcher 可以对应多个属性
        pushTarget(this); // Dep.target = watcher
        this.getter();  // render() 方法会去 vm 上取值 vm._update(vm._render)
        popTarget();   // Dep.target = 上一个 watcher 如果Dep.target有值说明这个变量在模板中使用了
    }
    // vue 中的更新操作是异步的
    update() {
        // 每次更新时 this
        // 多次调用 update 我希望先将 watcher 缓存下来，等一会一起更新
        queueWatcher(this);
    }
    // 后续要有其他功能
    run() {
        this.get();
    }
    // 添加 dep
    addDep(dep) {
        const id = dep.id;
        // 不存在就添加
        if (!this.depsId.has(id)) {
            this.depsId.add(id);
            this.deps.push(dep);
            // 调用 dep 的addSub方法添加 watcher
            dep.addSub(this);
        }
    }
}

/**
 * watcher 和 dep
 * 我们将更新的功能封装了一个 watcher
 * 渲染页面前，会将当前 watcher 放到 Dep 类上
 * 在 vue 中页面渲染时使用的属性，需要进行依赖收集，收集对象的渲染 watcher
 * 取值时，给每个属性都加了个 dep 属性，用于存储这个渲染 watcher （同一个 watcher 会对应多个 dep）
 * 每个属性可能对应多个视图（多个视图肯定是多个 watcher）一个属性要对应多个 watcher
 * dep.depend() => 通知 dep 存放 watcher => Dep.target.addDep() => 通知 watcher 存放 dep
 * 双向存储
 */

export default Watcher;
