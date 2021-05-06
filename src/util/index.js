import { isObject } from "../utils";
/**
 * 合并生命周期
 */
export const LIFECYCLE_HOOKS = [
    "beforeCreate",
    "created",
    "beforeMount",
    "mounted",
    "beforeUpdate",
    "updated",
    "beforeDestroy",
    "destroyed"
]
// 存放各种策略
//   {}     {beforeCreate:Fn} => {beforeCreate:[fn]}
//   {beforeCreate:[fn]}    {beforeCreate:fn}   => {beforeCreate:[fn,fn]}
const strats = {};

LIFECYCLE_HOOKS.forEach(hook => {
    strats[hook] = mergeHook;
})
// 合并
function mergeHook(parentVal, childValue) {
    if (childValue) {
        if (parentVal) {
            // 后续
            return parentVal.concat(childValue);
        } else {
            // 第一次
            return [childValue];
        }
    } else {
        return parentVal;
    }
}

export function mergeOptions(parent, child) {
    function mergeField(key) {
        const parentVal = parent[key];
        const childVal = child[key];
        // 策略模式
        if (strats[key]) { // 如果有对应的策略就调用对应的策略即可
            options[key] = strats[key](parentVal, childVal);
        } else {
            if (isObject(parentVal) && isObject(childVal)) {
                options[key] = { ...parentVal, ...childVal };
            } else {
                // 父亲中有，儿子中没有
                options[key] = child[key] || parent[key];
            }
        }
    }
    const options = {};
    for (let key in parent) {
        mergeField(key);
    }
    for (let key in child) {
        if (!parent.hasOwnProperty(key)) {
            mergeField(key)
        }
    }
    return options;
}
