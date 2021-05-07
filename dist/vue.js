(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
}(this, (function () { 'use strict';

    // {{aaa}}
    var defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g; // html字符串 => 字符串 => _c('div', {id: 'app', a: 1}, 'hello')
    // [{ name: "xxx", value: "xxx" }, { name: "xxx", value: "xxx" }]

    function genProps(attrs) {
      var str = "";

      for (var i = 0; i < attrs.length; i++) {
        var attr = attrs[i]; // color: red; background: blue

        if (attr.name === "style") {
          (function () {
            var styleObj = {};
            attr.value.replace(/([^;:]+)\:([^;:]+)/g, function () {
              styleObj[arguments[1]] = arguments[2];
            });
            attr.value = styleObj;
          })();
        }

        str += "".concat(attr.name, ":").concat(JSON.stringify(attr.value), ",");
      }

      return "{".concat(str.slice(0, -1), "}");
    }

    function gen(el) {
      // element = 1 text = 3
      if (el.type == 1) {
        return genProps(el);
      } else {
        var text = el.text;

        if (!defaultTagRE.test(text)) {
          return "_v('".concat(text, "')");
        } else {
          // 'hello' + arr + 'world'
          // hello {{arr}} {{aa}} world
          var tokens = [];
          var match; // css-loader 原理一样

          var lastIndex = defaultTagRE.lastIndex = 0; // 看有没有匹配到

          while (match = defaultTagRE.exec(text)) {
            // 开始索引
            var index = match.index;

            if (index > lastIndex) {
              tokens.push(JSON.stringify(text.slice(lastIndex, index)));
            }

            tokens.push("_s(".concat(match[1].trim(), ")"));
            lastIndex = index + match[0].length;
          }

          if (lastIndex < text.length) {
            tokens.push(JSON.stringify(text.slice(lastIndex)));
          }

          return "_v(".concat(tokens.join("+"), ")");
        }
      }
    }

    function genChildren(el) {
      // 获取儿子
      var children = el.children;

      if (children) {
        return children.map(function (c) {
          return gen(c);
        }).join(",");
      }

      return false;
    } //  _c('div',{id:'app',a:1},_c('span',{},'world'),_v())


    function generate(el) {
      // 遍历树 将树拼接成字符串
      var children = genChildren(el);
      var code = "_c('".concat(el.tag, "',").concat(el.attrs.length ? genProps(el.attrs) : 'undefined').concat(children ? ",".concat(children) : '', ")");
      return code;
    }

    // 标签名
    var ncname = "[a-zA-Z_][\\-\\.0-9_a-zA-Z]*"; // 用来获取的标签名的 match 后的索引为1的

    var qnameCapture = "((?:".concat(ncname, "\\:)?").concat(ncname, ")"); // 匹配开始标签的

    var startTagOpen = new RegExp("^<".concat(qnameCapture)); // 匹配闭合标签的

    var endTag = new RegExp("^<\\/".concat(qnameCapture, "[^>]*>")); // a=b  a="b"  a='b'

    var attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/; // />   <div/>

    var startTagClose = /^\s*(\/?)>/; // {{aaaaa}}
    // html字符串解析成 对应的脚本来触发 tokens <div id="app">{{ name }}</div>
    // 将解析后的结果，组装成一个树结构 栈

    function createAstElement(tagName, attrs) {
      return {
        tag: tagName,
        type: 1,
        children: [],
        parent: null,
        attrs: attrs
      };
    }

    var root = null;
    var stack = [];

    function start(tagName, attributes) {
      var parent = stack[stack.length - 1];
      var element = createAstElement(tagName, attributes);

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
      var last = stack.pop();

      if (last.tag !== tagName) {
        throw new Error("标签有误");
      }
    } // 字符处理


    function chars(text) {
      text = text.replace(/\s/g, "");
      var parent = stack[stack.length - 1];

      if (text) {
        parent.children.push({
          type: 3,
          text: text
        });
      }
    } // 解析HTML


    function parserHTML(html) {
      function advance(len) {
        // 截取字符串
        html = html.substring(len);
      } // 解析开始标签


      function parseStartTag() {
        var start = html.match(startTagOpen);

        if (start) {
          var match = {
            tagName: start[1],
            attrs: []
          };
          advance(start[0].length);

          var _end; // 如果没有遇到标签结尾就不停的解析


          var attr;

          while (!(_end = html.match(startTagClose)) && (attr = html.match(attribute))) {
            match.attrs.push({
              name: attr[1],
              value: attr[3] || attr[4] || attr[5]
            });
            advance(attr[0].length);
          }

          if (_end) {
            advance(_end[0].length);
          }

          return match;
        } // 不是开始标签


        return false;
      } // 看要解析的内容是否存在，如果存在就不停的解析


      while (html) {
        // 当前解析的开头
        var textEnd = html.indexOf("<");

        if (textEnd == 0) {
          // 解析开始标签
          var startTagMath = parseStartTag();

          if (startTagMath) {
            start(startTagMath.tagName, startTagMath.attrs);
            continue;
          }

          var endTagMath = html.match(endTag);

          if (endTagMath) {
            end(endTagMath[1]);
            advance(endTagMath[0].length);
            continue;
          }
        } // // </div>


        var text = void 0;

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

    function compileToFunction(template) {
      console.log("template", template);
      var root = parserHTML(template); // 生成代码

      var code = generate(root);
      console.log("root", root, code); // code 中会用到数据 数据再 vm 上

      return new Function("with(this){return ".concat(code, "}")); // render(){
      //     return
      // }
      // html=> ast（只能描述语法 语法不存在的属性无法描述） => render函数 + (with + new Function) => 虚拟dom （增加额外的属性） => 生成真实dom
    }

    /**
     * 将虚拟节点渲染成真实节点
     */
    function patch(oldVNode, vnode) {
      // 是否是真实元素
      var isRealElement = oldVNode.nodeType;

      if (isRealElement) {
        var oldElm = oldVNode;
        var parentElm = oldElm.parentNode;
        var el = createElm(vnode);
        parentElm.insertBefore(el, oldElm.nextSibling);
        parentElm.removeChild(oldVNode);
        return el;
      }
    }

    function createElm(vnode) {
      var tag = vnode.tag,
          children = vnode.children,
          text = vnode.text;

      if (typeof tag === "string") {
        // 虚拟节点会有一个el属性，对应真实节点
        vnode.el = document.createElement(tag);
        updateProperties(vnode);
        children.forEach(function (child) {
          vnode.el.appendChild(createElm(child));
        });
      } else {
        vnode.el = document.createTextNode(text);
      }

      return vnode.el;
    }

    function updateProperties(vnode) {
      // 获取当前老节点中的属性
      var newProps = vnode.data || {}; // 获取当前的真实节点

      var el = vnode.el;

      for (var key in newProps) {
        if (key === "style") {
          for (var styleName in newProps.style) {
            el.style[styleName] = newProps.style[styleName];
          }
        } else if (key === "class") {
          el.className = newProps["class"];
        } else {
          el.setAttribute(key, newProps[key]);
        }
      }
    }

    function _typeof(obj) {
      "@babel/helpers - typeof";

      if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
        _typeof = function (obj) {
          return typeof obj;
        };
      } else {
        _typeof = function (obj) {
          return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
        };
      }

      return _typeof(obj);
    }

    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
      }
    }

    function _defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    function _createClass(Constructor, protoProps, staticProps) {
      if (protoProps) _defineProperties(Constructor.prototype, protoProps);
      if (staticProps) _defineProperties(Constructor, staticProps);
      return Constructor;
    }

    function _defineProperty(obj, key, value) {
      if (key in obj) {
        Object.defineProperty(obj, key, {
          value: value,
          enumerable: true,
          configurable: true,
          writable: true
        });
      } else {
        obj[key] = value;
      }

      return obj;
    }

    function ownKeys(object, enumerableOnly) {
      var keys = Object.keys(object);

      if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        if (enumerableOnly) symbols = symbols.filter(function (sym) {
          return Object.getOwnPropertyDescriptor(object, sym).enumerable;
        });
        keys.push.apply(keys, symbols);
      }

      return keys;
    }

    function _objectSpread2(target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i] != null ? arguments[i] : {};

        if (i % 2) {
          ownKeys(Object(source), true).forEach(function (key) {
            _defineProperty(target, key, source[key]);
          });
        } else if (Object.getOwnPropertyDescriptors) {
          Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
        } else {
          ownKeys(Object(source)).forEach(function (key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
          });
        }
      }

      return target;
    }

    // 依赖收集
    var id$1 = 0;
    /**
     * 每个属性我都给他分配一个 dep，dep 可以来存放 watcher
     * watcher 中还要存放这个 dep
     */

    var Dep = /*#__PURE__*/function () {
      function Dep() {
        _classCallCheck(this, Dep);

        this.id = id$1++; // 用来存放 watcher的

        this.subs = [];
      }

      _createClass(Dep, [{
        key: "depend",
        value: function depend() {
          // Dep.target dep里要存放这个 watcher，watcher要存放dep 多对多的关系
          if (Dep.target) {
            Dep.target.addDep(this);
          }
        }
      }, {
        key: "addSub",
        value: function addSub(watcher) {
          this.subs.push(watcher);
        } // 通知更新

      }, {
        key: "notify",
        value: function notify() {
          this.subs.forEach(function (watcher) {
            return watcher.update();
          });
        }
      }]);

      return Dep;
    }(); // 当前正在评估的目标观察者。
    // 这是全局唯一的，因为只有一个观察者
    // 可以一次求值。


    Dep.target = null;
    var targetStack = [];
    function pushTarget(watcher) {
      targetStack.push(watcher);
      Dep.target = watcher;
    }
    function popTarget() {
      targetStack.pop();
      Dep.target = targetStack[targetStack.length - 1];
    }

    var callbacks = [];
    var waiting = false;

    function flushCallbacks() {
      callbacks.forEach(function (cb) {
        return cb();
      });
      waiting = false;
    }

    function timer(flushCallbacks) {

      if (Promise) ; else if (MutationObserver) {
        var textNode = document.createTextNode("1");
        var observe = new MutationObserver(flushCallbacks);
        observe.observe(textNode, {
          characterData: true
        });

      } else if (setImmediate) ; else ;
    } // 微任务是在页面渲染前执行 我取的是内存中的 dom ，不关心你渲染完毕没有


    function nextTick(cb) {
      // flushSchedulerQueue / userCallback
      callbacks.push(cb);

      if (!waiting) {
        // vue2 中考虑了兼容性问题 vue3 里面不在考虑兼容性问题
        timer(flushCallbacks);
        waiting = true;
      }
    }

    var queue = [];
    var has = {}; // 做列表的，列表维护存放了哪些 watcher

    var pending = false; // 动画 滚动的频率高，节流 requestFrameAnimation

    function flushSchedulerQueue() {
      for (var i = 0; i < queue.length; i++) {
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


    function queueWatcher(watcher) {
      // name 和 age的id是同一个
      var id = watcher.id;

      if (has[id] == null) {
        queue.push(watcher);
        has[id] = true; // 开启一次更新操作 批处理（防抖）

        if (!pending) {
          nextTick(flushSchedulerQueue);
          pending = true;
        }
      }
    }

    var id = 0;

    var Watcher = /*#__PURE__*/function () {
      function Watcher(vm, exprOrFn, cb, options) {
        _classCallCheck(this, Watcher);

        this.vm = vm;
        this.exprOrFn = exprOrFn;

        if (typeof exprOrFn === "function") {
          this.getter = exprOrFn;
        }

        this.cb = cb;
        this.options = options;
        this.id = id++; // 默认应该让exprOrFn执行  exprOrFn 方法做了什么是？ render （去vm上了取值）

        this.deps = [];
        this.depsId = new Set();
        this.get(); // 默认初始化 要取值
      } // 稍后用户更新时，可以重新调用 getter 方法


      _createClass(Watcher, [{
        key: "get",
        value: function get() {
          // defineProperty.get, 每个属性都可以收集自己的watcher
          // 我希望一个属性可以对应多个watcher，同时一个 watcher 可以对应多个属性
          pushTarget(this); // Dep.target = watcher

          this.getter(); // render() 方法会去 vm 上取值 vm._update(vm._render)

          popTarget(); // Dep.target = 上一个 watcher 如果Dep.target有值说明这个变量在模板中使用了
        } // vue 中的更新操作是异步的

      }, {
        key: "update",
        value: function update() {
          // 每次更新时 this
          // 多次调用 update 我希望先将 watcher 缓存下来，等一会一起更新
          queueWatcher(this);
        } // 后续要有其他功能

      }, {
        key: "run",
        value: function run() {
          this.get();
        } // 添加 dep

      }, {
        key: "addDep",
        value: function addDep(dep) {
          var id = dep.id; // 不存在就添加

          if (!this.depsId.has(id)) {
            this.depsId.add(id);
            this.deps.push(dep); // 调用 dep 的addSub方法添加 watcher

            dep.addSub(this);
          }
        }
      }]);

      return Watcher;
    }();

    function lifecycleMixin(Vue) {
      Vue.prototype._update = function (vnode) {
        var vm = this; // 虚拟节点渲染成真实节点

        vm.$el = patch(vm.$el, vnode);
      };
    }
    function mountComponent(vm, el) {
      vm.$el = el; // 更新函数，数据变化后会再次调用此函数

      var updateComponent = function updateComponent() {
        // 调用 render 函数，生成虚拟 dom
        // 将虚拟节点，渲染到页面上
        // 后续更新可以调用updateComponent方法
        vm._update(vm._render()); // 用虚拟dom 生成真实dom

      }; // 观察者模式：属性是“被观察者” 刷新页面：“观察者”


      new Watcher(vm, updateComponent, function () {
        console.log("更新视图了");
      }, true); // 它是一个渲染watcher  后续有其他的watcher
    }
    /**
     * 调用生命周期
     * @param vm vue
     * @param hook 调用名
     */

    function callHook(vm, hook) {
      var handlers = vm.$options[hook];

      if (handlers) {
        for (var i = 0; i < handlers.length; i++) {
          handlers[i].call(vm);
        }
      }
    }

    var oldArrayProtoMethods = Array.prototype;
    var arrayMethods = Object.create(oldArrayProtoMethods);
    var methods = ["push", "pop", "shift", "unshift", "reverse", "sort", "splice"];
    methods.forEach(function (method) {
      // 用户调用的如果是以上7个方法，会用我自己重写的，否则用原来的数组方法
      // args 是参数列表，arr.push(1, 2,33)
      arrayMethods[method] = function () {
        var _oldArrayProtoMethods;

        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        (_oldArrayProtoMethods = oldArrayProtoMethods[method]).call.apply(_oldArrayProtoMethods, [this].concat(args));

        var inserted; // 根据当前数组获取到 observer 实例

        var ob = this.__ob__;

        switch (method) {
          case "push":
          case "unshift":
            // 就是新增的内容
            inserted = args;
            break;

          case "splice":
            inserted = args.slice(2);
            break;
        } // 如果有新增的内容要进行继续劫持，我需要观测的数组里的每一项，而不是数组
        // 更新操作 todo...


        if (inserted) ob.observeArray(inserted); // 数组的 observer.dep 属性

        ob.dep.depend();
      };
    });

    /**
     * 1.如果数据是对象，会将对象不停的递归进行劫持
     * 2.如果是数组，会劫持数组的方法，并对数组中不是基本数据类型的进行检测
     *
     * 检测数据变化 类有类型，对象无类型
     */
    // 观察值

    /**
     * 如果给对象新增一个属性不会触发视图更新
     * （给对象本身也增加一个 dep，dep 中存 watcher，如果增加一个属性后，我就手动的触发watcher的更新）
     */

    var Observer = /*#__PURE__*/function () {
      function Observer(value) {
        _classCallCheck(this, Observer);

        // 对对象中的所有属性进行劫持
        // 数据可能是数组或者对象
        this.dep = new Dep(); // 给所有响应式数据增加标识，并且可以在响应式上获取 Observer 实例上的方法

        Object.defineProperty(value, "__ob__", {
          enumerable: false,
          // 不可枚举的
          configurable: false,
          value: this
        }); // value.__ob__ = this; // 所有被劫持过的属性都有__ob__

        if (Array.isArray(value)) {
          // 我希望数组的变化可以触发视图更新？
          // 数组挟持的逻辑
          // 对数组原来的方法进行改写，切片编程 高阶函数
          value.__proto__ = arrayMethods; // 如果数组中的数据是对象类型，需要监控对象的变化

          this.observeArray(value);
        } else {
          // 对象劫持的逻辑
          this.walk(value);
        }
      } // 对我们数组的数组和数组中的对象再次劫持，递归了


      _createClass(Observer, [{
        key: "observeArray",
        value: function observeArray(value) {
          // 如果数组里放的是对象类型，也做了观测，JSON.stringify() 也做了收集起来了
          value.forEach(function (item) {
            return observe(item);
          });
        } // 让对象上的所有属性依次进行观测

      }, {
        key: "walk",
        value: function walk(data) {
          Object.keys(data).forEach(function (key) {
            defineReactive(data, key, data[key]);
          });
        }
      }]);

      return Observer;
    }(); // vue2 会对对象进行遍历，将每个属性用 defineProperty 重新定义，性能差


    function dependArray(value) {
      for (var i = 0; i < value.length; i++) {
        // current 是数组里面的数组 [[[[]]]]
        var current = value[i];
        current.__ob__ && current.__ob__.dep.depend();

        if (Array.isArray(current)) {
          dependArray(current);
        }
      }
    }

    function defineReactive(data, key, value) {
      // value 有可能是对象
      // 本身用户默认值是对象套对象，需要递归处理
      var childOb = observe(value); // 每个属性都有一个 dep 属性

      var dep = new Dep(); // 获取到了数组对应 ob
      // 对象依赖收集

      Object.defineProperty(data, key, {
        get: function get() {
          // 取值时我希望将 watcher 和 dep 对应起来
          if (Dep.target) {
            // 此值是在模板中取值的
            // 让 dep 记住 watcher
            dep.depend(); // 可能是数组 可能是对象，对象也要收集依赖，后续写 $set 方法时需要触发他自己的更新操作

            if (childOb) {
              // 就是让数组和对象也记录 watcher
              childOb.dep.depend(); // 取外层数组要将数组里面的也进行依赖收集

              if (Array.isArray(value)) {
                // 递归收集数组依赖
                dependArray(value);
              }
            }
          }

          return value;
        },
        set: function set(newValue) {
          // todo... 更新视图
          if (newValue !== value) {
            // 如果用户赋值一个新对象，需要将这个对象进行挟持
            observe(newValue);
            value = newValue; // 告诉当前的属性存放的 watcher 执行更新视图

            dep.notify();
          }
        }
      });
    }

    function observe(data) {
      // 如果是对象才观测
      if (_typeof(data) !== "object" || data === null) {
        return;
      } // 默认最外层的 data 必须是一个对象


      return new Observer(data);
    }

    function isFunction(val) {
      return typeof val === "function";
    }
    function isObject(val) {
      return _typeof(val) === "object" && val !== null;
    }

    function initState(vm) {
      var opts = vm.$options;
      if (opts.props) ;
      if (opts.methods) ;

      if (opts.data) {
        initData(vm);
      }

      if (opts.computed) ;
      if (opts.watch) ;
    }


    function proxy(vm, source, key) {
      Object.defineProperty(vm, key, {
        get: function get() {
          return vm[source][key];
        },
        set: function set(newValue) {
          vm[source][key] = newValue;
        }
      });
    } // 初始化数据


    function initData(vm) {
      // vm.$el
      // vue 内部会对属性检测如果是已 $ 开头 不会进行代理
      var data = vm.$options.data; // vue2中会将data中的所有数据 进行数据劫持 Object.defineProperty
      // 这个时候 vm 和 data 没有任何关系，通过_data进行关联

      data = vm._data = isFunction(data) ? data.call(vm) : data; // 将 _data 上的属性全部代理给 vm 实例
      // 用户去掉 vm.xxx => vm._data.xxx

      for (var key in data) {
        // vm.name = "xxx" vm._data.name = "xxx"
        proxy(vm, "_data", key);
      }

      observe(data);
    }

    /**
     * 合并生命周期
     */

    var LIFECYCLE_HOOKS = ["beforeCreate", "created", "beforeMount", "mounted", "beforeUpdate", "updated", "beforeDestroy", "destroyed"]; // 存放各种策略
    //   {}     {beforeCreate:Fn} => {beforeCreate:[fn]}
    //   {beforeCreate:[fn]}    {beforeCreate:fn}   => {beforeCreate:[fn,fn]}

    var strats = {};
    LIFECYCLE_HOOKS.forEach(function (hook) {
      strats[hook] = mergeHook;
    }); // 合并

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

    function mergeOptions(parent, child) {
      function mergeField(key) {
        var parentVal = parent[key];
        var childVal = child[key]; // 策略模式

        if (strats[key]) {
          // 如果有对应的策略就调用对应的策略即可
          options[key] = strats[key](parentVal, childVal);
        } else {
          if (isObject(parentVal) && isObject(childVal)) {
            options[key] = _objectSpread2(_objectSpread2({}, parentVal), childVal);
          } else {
            // 父亲中有，儿子中没有
            options[key] = child[key] || parent[key];
          }
        }
      }

      var options = {};

      for (var key in parent) {
        mergeField(key);
      }

      for (var _key in child) {
        if (!parent.hasOwnProperty(_key)) {
          mergeField(_key);
        }
      }

      return options;
    }

    // 表示在 vue 的基础上做一次混合操作

    function initMixin(Vue) {
      Vue.prototype._init = function (options) {
        // el, data
        var vm = this; // 后面会对 options 进行扩展操作
        // 合并参数

        vm.$options = mergeOptions(vm.constructor.options, options); // 初始化生命周期

        callHook(vm, "beforeCreate"); // 对数据进行初始化 watch computed props data ...
        // vm.$options.data 数据劫持

        initState(vm);
        callHook(vm, "created");

        if (vm.$options.el) {
          // 将数据挂载到这个模板上
          vm.$mount(vm.$options.el);
        }
      }; // 挂载


      Vue.prototype.$mount = function (el) {
        var vm = this;
        var options = vm.$options;
        el = document.querySelector(el);
        vm.$el = el; // 把模板转换成对应的渲染函数 => 虚拟dom概念 vnode => diff算法 更新虚拟dom => 产生真实节点，更新
        // 没有 render 用template，目前没有 render

        if (!options.render) {
          var template = options.template; // 用户也没有传递 template 就取 el 的内容作为模板

          if (!template && el) {
            template = el.outerHTML;
          }

          options.render = compileToFunction(template);
        } // options.render 就是渲染函数
        // 调用 render 方法 渲染成真实 dom 替换掉页面的内容


        mountComponent(vm, el); // 组件的挂载流程
      };
    }

    function createElement(vm, tag) {
      var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      for (var _len = arguments.length, children = new Array(_len > 3 ? _len - 3 : 0), _key = 3; _key < _len; _key++) {
        children[_key - 3] = arguments[_key];
      }

      return vnode(vm, tag, data, data.key, children, undefined);
    }
    function createTextElement(vm, text) {
      return vnode(vm, undefined, undefined, undefined, undefined, text);
    }

    function vnode(vm, tag, data, key, children, text) {
      return {
        vm: vm,
        tag: tag,
        data: data,
        key: key,
        children: children,
        text: text
      };
    }

    function renderMixin(Vue) {
      // 创建文本
      Vue.prototype._v = function (text) {
        return createTextElement(this, text);
      }; // 创建元素


      Vue.prototype._c = function () {
        return createElement.apply(void 0, [this].concat(Array.prototype.slice.call(arguments)));
      };

      Vue.prototype._s = function (val) {
        if (_typeof(val) === "object") return JSON.stringify(val);
        return val;
      };

      Vue.prototype._render = function () {
        var vm = this;
        var render = vm.$options.render;
        return render.call(vm);
      };
    }

    function initGlobalAPI(Vue) {
      // 用来存放全局的配置，每个组件初始化的时候都会和options选项进行合并
      Vue.options = {};

      Vue.mixin = function (mixin) {
        // 将属性合并到 Vue.options上
        this.options = mergeOptions(this.options, mixin);
        return this;
      };
    }

    function Vue(options) {
      // options 为用户传入的选项
      // 初始化操作，组件
      this._init(options);
    } // 扩展原型的


    initMixin(Vue); // 给原型上新增_init方法

    renderMixin(Vue); // _render

    lifecycleMixin(Vue); // _update
    // 在类上扩展的 Vue.mixin

    initGlobalAPI(Vue);
    /**
     * init 主要做了状态的初始化（数据劫持 对象、数组）
     * $mount 找render方法（template -> render函数 ast -> codegen -> 字符串）
     * render = with + new Function(codegen)产生虚拟dom的方法
     * 虚拟dom -> 真实dom
     * vm._update(vm._render()); 先生成虚拟 dom -> 生成真实的dom元素
     * 初次渲染
     *
     */

    return Vue;

})));
//# sourceMappingURL=vue.js.map
