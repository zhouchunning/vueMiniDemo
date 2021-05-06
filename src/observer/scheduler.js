import { nextTick } from "../util/next-tick";

let queue = [];
let has = {}; // 做列表的，列表维护存放了哪些 watcher
let pending = false;

// 动画 滚动的频率高，节流 requestFrameAnimation
function flushSchedulerQueue() {
    for (let i = 0; i < queue.length; i++) {
        // vm.name = 123?
        queue[i].run();
    }
    queue = [];
    has = {};
    pending = false;
}

/**
 * 要等待同步代码执行完毕后才执行异步逻辑
 * 当前执行栈中代码执行完毕后，会先清空微任务，在清空宏任务，我希望尽早更新页面
 */
export function queueWatcher(watcher) {
    // name 和 age的id是同一个
    const id = watcher.id;
    if (has[id] == null) {
        queue.push(watcher);
        has[id] = true;
        // 开启一次更新操作 批处理（防抖）
        if (!pending) {
            nextTick(flushSchedulerQueue, 0);
            pending = true;
        }
    }
}
