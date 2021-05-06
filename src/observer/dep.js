// 依赖收集
let id = 0;
/**
 * 每个属性我都给他分配一个 dep，dep 可以来存放 watcher
 * watcher 中还要存放这个 dep
 */
class Dep {
    constructor() {
        this.id = id++;
        // 用来存放 watcher的
        this.subs = [];
    }
    depend() {
        // Dep.target dep里要存放这个 watcher，watcher要存放dep 多对多的关系
        if (Dep.target) {
            Dep.target.addDep(this);
        }
    }
    addSub(watcher) {
        this.subs.push(watcher);
    }
    // 通知更新
    notify() {
        this.subs.forEach(watcher => watcher.update());
    }
}
// 当前正在评估的目标观察者。
// 这是全局唯一的，因为只有一个观察者
// 可以一次求值。
Dep.target = null
const targetStack = []
export function pushTarget(watcher) {
    targetStack.push(watcher);
    Dep.target = watcher
}
export function popTarget() {
    targetStack.pop();
    Dep.target = targetStack[targetStack.length - 1];
}

export default Dep;
