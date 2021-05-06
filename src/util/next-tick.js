const callbacks = [];
let waiting = false;

function flushCallbacks() {
    callbacks.forEach(cb => cb());
    waiting = false;
}

function timer(flushCallbacks) {
    let timerFn = () => {};
    if (Promise) {
        timerFn = () => {
            Promise.resolve().then(flushCallbacks);
        }
    } else if (MutationObserver) {
        const textNode = document.createTextNode("1");
        const observe = new MutationObserver(flushCallbacks);
        observe.observe(textNode, {
            characterData: true
        })

        timerFn = () => {
            textNode.textContent = "3";
        }
        // 微任务
    } else if (setImmediate) {
        timerFn = () => {
            setImmediate(flushCallbacks);
        }
    } else {
        timerFn = () => {
            setTimeout(flushCallbacks);
        }
    }
}

// 微任务是在页面渲染前执行 我取的是内存中的 dom ，不关心你渲染完毕没有
export function nextTick(cb) {
    // flushSchedulerQueue / userCallback
    callbacks.push(cb);
    if (!waiting) {
        // vue2 中考虑了兼容性问题 vue3 里面不在考虑兼容性问题
        timer(flushCallbacks);
        waiting = true;
    }
}
