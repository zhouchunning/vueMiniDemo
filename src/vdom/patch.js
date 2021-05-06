/**
 * 将虚拟节点渲染成真实节点
 */
export function patch(oldVNode, vnode) {
    // 是否是真实元素
    const isRealElement = oldVNode.nodeType;

    if (isRealElement) {
        const oldElm = oldVNode;
        const parentElm = oldElm.parentNode;

        let el = createElm(vnode);
        parentElm.insertBefore(el, oldElm.nextSibling);
        parentElm.removeChild(oldVNode);
        return el;
    }
}

function createElm(vnode) {
    const { tag, children, text } = vnode;
    if (typeof tag === "string") {
        // 虚拟节点会有一个el属性，对应真实节点
        vnode.el = document.createElement(tag);
        updateProperties(vnode);
        children.forEach(child => {
            vnode.el.appendChild(createElm(child));
        });
    } else {
        vnode.el = document.createTextNode(text);
    }
    return vnode.el;
}

function updateProperties(vnode) {
    // 获取当前老节点中的属性
    const newProps = vnode.data || {};
    // 获取当前的真实节点
    const el = vnode.el;
    for (let key in newProps) {
        if (key === "style") {
            for (let styleName in newProps.style) {
                el.style[styleName] = newProps.style[styleName];
            }
        } else if (key === "class") {
            el.className = newProps.class;
        } else {
            el.setAttribute(key, newProps[key]);
        }
    }

}
