let oldArrayProtoMethods = Array.prototype;
export let arrayMethods = Object.create(oldArrayProtoMethods);

const methods = [
    "push",
    "pop",
    "shift",
    "unshift",
    "reverse",
    "sort",
    "splice"
];
methods.forEach(method => {
    // 用户调用的如果是以上7个方法，会用我自己重写的，否则用原来的数组方法
    // args 是参数列表，arr.push(1, 2,33)
    arrayMethods[method] = function (...args) {
        oldArrayProtoMethods[method].call(this, ...args);
        let inserted;
        // 根据当前数组获取到 observer 实例
        const ob = this.__ob__;
        switch (method) {
            case "push":
            case "unshift":
                // 就是新增的内容
                inserted = args;
                break;
            case "splice":
                inserted = args.slice(2);
                break;
            default:
                break;
        }
        // 如果有新增的内容要进行继续劫持，我需要观测的数组里的每一项，而不是数组
        // 更新操作 todo...
        if (inserted) ob.observeArray(inserted);

        // 数组的 observer.dep 属性
        ob.dep.depend();
    }
})
