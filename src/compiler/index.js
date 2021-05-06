import { generate } from "./generate";
import { parserHTML } from "./parser";

export function compileToFunction(template) {
    console.log("template",template)
    const root = parserHTML(template);

    // 生成代码
    const code = generate(root);
    console.log("root", root, code)
    // code 中会用到数据 数据再 vm 上
    return new Function(`with(this){return ${code}}`);
    // render(){
    //     return
    // }
    // html=> ast（只能描述语法 语法不存在的属性无法描述） => render函数 + (with + new Function) => 虚拟dom （增加额外的属性） => 生成真实dom
}
