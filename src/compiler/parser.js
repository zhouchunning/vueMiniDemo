// 标签名
const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`;
// 用来获取的标签名的 match 后的索引为1的
const qnameCapture = `((?:${ncname}\\:)?${ncname})`;
// 匹配开始标签的
const startTagOpen = new RegExp(`^<${qnameCapture}`);
// 匹配闭合标签的
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`);
// a=b  a="b"  a='b'
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
// />   <div/>
const startTagClose = /^\s*(\/?)>/;
// {{aaaaa}}
const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g;

// ast（语法层面的描述 js css html）vdom（dom 节点）

// html字符串解析成 对应的脚本来触发 tokens <div id="app">{{ name }}</div>
// 将解析后的结果，组装成一个树结构 栈
function createAstElement(tagName, attrs) {
    return {
        tag: tagName,
        type: 1,
        children: [],
        parent: null,
        attrs
    }
}

let root = null;
let stack = [];
function start(tagName, attributes) {
    const parent = stack[stack.length - 1];
    const element = createAstElement(tagName, attributes);
    if (!root) {
        root = element;
    }
    if (parent) {
        // 当放入栈中时，继续父亲是谁
        element.parent = parent;
        parent.children.push(element);
    }
    stack.push(element);
}

function end(tagName) {
    // 获取数组最后一项并且删除
    const last = stack.pop();
    if (last.tag !== tagName) {
        throw new Error("标签有误")
    }
}
// 字符处理
function chars(text) {
    text = text.replace(/\s/g, "");
    const parent = stack[stack.length -  1];
    if (text) {
        parent.children.push({
            type: 3,
            text
        })
    }
}
// 解析HTML
export function parserHTML(html) {
    function advance(len) {
        // 截取字符串
        html = html.substring(len);
    }
    // 解析开始标签
    function parseStartTag() {
        const start = html.match(startTagOpen);
        if (start) {
            const match = {
                tagName: start[1],
                attrs: []
            }
            advance(start[0].length);
            let end;
            // 如果没有遇到标签结尾就不停的解析
            let attr;

            while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
                match.attrs.push({
                    name: attr[1],
                    value: attr[3] || attr[4] || attr[5]
                })
                advance(attr[0].length);
            }
            if (end) {
                advance(end[0].length);
            }
            return match;
        }
        // 不是开始标签
        return false;
    }

    // 看要解析的内容是否存在，如果存在就不停的解析
    while (html) {
        // 当前解析的开头
        const textEnd = html.indexOf("<");
        if (textEnd == 0) {
            // 解析开始标签
            const startTagMath = parseStartTag(html);
            if (startTagMath) {
                start(startTagMath.tagName, startTagMath.attrs);
                continue;
            }
            const endTagMath = html.match(endTag);
            if (endTagMath) {
                end(endTagMath[1]);
                advance(endTagMath[0].length);
                continue;
            }
        }
        // // </div>
        let text;
        if (textEnd > 0) {
            text = html.substring(0, textEnd);
        }
        if (text) {
            chars(text);
            advance(text.length);
        }
    }
    return root;
}

/**
 * 看下用户是否传入了，没有传入可能传入的是 template，template如果也没有传递
 * 将我们的 html => 词法解析（开始标签，结束标签，属性，文本）
 * => ast语法数 用来描述 html 语法的 stack = []
 *
 * codegen   <div>hello</div> => _c("div", {}, "hello") => 让字符串执行
 * 字符串如果转成代码 eval 好性能 会有作用域问题
 *
 * 模板引擎 new Function + width 来实现
 */
