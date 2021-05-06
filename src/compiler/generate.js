// {{aaa}}
const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g;

// html字符串 => 字符串 => _c('div', {id: 'app', a: 1}, 'hello')
// [{ name: "xxx", value: "xxx" }, { name: "xxx", value: "xxx" }]
function genProps(attrs) {
    let str = "";
    for (let i = 0; i < attrs.length; i++) {
        const attr = attrs[i];
        // color: red; background: blue
        if (attr.name === "style") {
            let styleObj = {};
            attr.value.replace(/([^;:]+)\:([^;:]+)/g, function () {
                styleObj[arguments[1]] = arguments[2]
            })
            attr.value = styleObj;
        }
        str += `${attr.name}:${JSON.stringify(attr.value)},`;
    }
    return `{${str.slice(0, -1)}}`
}

function gen(el) {
    // element = 1 text = 3
    if (el.type == 1) {
        return genProps(el);
    } else {
        const text = el.text;
        if (!defaultTagRE.test(text)) {
            return `_v('${text}')`
        } else {
            // 'hello' + arr + 'world'
            // hello {{arr}} {{aa}} world
            let tokens = [];
            let match;
            // css-loader 原理一样
            let lastIndex = defaultTagRE.lastIndex = 0;
            // 看有没有匹配到
            while (match = defaultTagRE.exec(text)) {
                // 开始索引
                const index = match.index;
                if (index > lastIndex) {
                    tokens.push(JSON.stringify(text.slice(lastIndex, index)));
                }
                tokens.push(`_s(${match[1].trim()})`);
                lastIndex = index + match[0].length;
            }
            if (lastIndex < text.length) {
                tokens.push(JSON.stringify(text.slice(lastIndex)));
            }
            return `_v(${tokens.join("+")})`
        }
    }
}

function genChildren(el) {
    // 获取儿子
    const children = el.children;
    if (children) {
        return children.map(c => gen(c)).join(",")
    }
    return false;
}

//  _c('div',{id:'app',a:1},_c('span',{},'world'),_v())
export function generate(el) {
    // 遍历树 将树拼接成字符串
    const children = genChildren(el);
    const code = `_c('${el.tag}',${
        el.attrs.length? genProps(el.attrs): 'undefined'
    }${
        children? `,${children}`:''
    })`;

    return code;
}
