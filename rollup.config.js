import babel from "rollup-plugin-babel";
import serve from "rollup-plugin-serve";

export default {
    input: "./src/index.js",
    output: {
        // 支持amd 和 commonjs规范 window.Vue
        format: "umd", // 模块化类型
        file: "dist/vue.js",
        name: "Vue", // 打包后的全局变量的名字
        sourcemap: true,
    },
    plugins: [
        // 使用babel进行转化 但是拍出node_modules 文件
        babel({
            exclude: "node_modules/**",
        }),
        // process.env.ENV === "development" ? serve({
        //     open: true,
        //     openPage: "/public/index.html",
        //     port: 3000,
        //     contentBase: ""
        // }) : null
    ],
};
