/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 1);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

class Observer{
    constructor(data) {
        this.observe(data);
    }

    //数据劫持
    observe(data){
        if (!data || typeof data !== 'object'){
            return;
        }
        Object.keys(data).forEach(key=>{
            //劫持
            this.defineReactive(data, key, data[key]);
            this.observe(data[key]); //递归劫持
        })

    }

    //定义响应式
    defineReactive(obj, key, value){
        let that = this;
        let dep = new Dep();
        Object.defineProperty(obj, key, {
            enumerable: true,
            configurable: true,
            get(){
                Dep.target && dep.addSub(Dep.target);
                return value;
            },
            set(newValue){
                if (newValue!==value){
                    that.observe(newValue);//如果是对象，继续劫持
                    value = newValue;
                    dep.notify();//通知所有人数据更新
                }
            }
        })
    }
}

//发布订阅
class Dep{
    constructor() {
        //订阅的数组
        this.subs = [];
    }
    //添加订阅
    addSub(watcher){
        this.subs.push(watcher);
    }
    //通知所有订阅者
    notify(){
        this.subs.forEach(watcher=>watcher.update());
    }
}

module.exports = {Observer, Dep};


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

const Observer = __webpack_require__(0).Observer;
const Compile = __webpack_require__(2).Compile;

class MVVM{
    constructor(options) {
        //将数据挂载在实例上
        this.$el = options.el;
        this.$data = options.data;

        if (this.$el){
            //数据劫持
            new Observer(this.$data);

            //数据代理
            this.proxyData(this.$data);

            //用数据和元素进行编译
            new Compile(this.$el, this);
        }
    }

    //数据代理实现
    proxyData(data){
        Object.keys(data).forEach(key=>{
            Object.defineProperty(this, key, {
                get(){
                    return data[key];
                },
                set(v) {
                  data[key] = v;
                }
            })
        })
    }
}

window.MVVM = MVVM;

module.exports = MVVM;



/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

const Watcher = __webpack_require__(3);

class Compile{
    constructor(el, vm) {
        this.el = this.isElementNode(el)?el:document.querySelector(el);
        this.vm = vm;
        //开始编译
        if (this.el){
            //将dom移到内存中
            let fragment = this.node2fragment(this.el);

            //编译：提取需要的元素节点和文本节点
            this.compile(fragment);

            //将编译后的fragment放回页面
            this.el.appendChild(fragment);

        }
    }

    //辅助方法

    //是否是元素节点
    isElementNode(node){
        //判断传入的el类型
        return node.nodeType === 1;
    }

    //是否是指令
    isDirective(name){
        return name.includes('v-');
    }

    //核心方法
    node2fragment(el){
        //将el中的内容放到内存中

        //文档碎片，内存中的dom节点
        let fragment = document.createDocumentFragment();
        let firstChild;
        while(firstChild = el.firstChild){
            fragment.appendChild(firstChild);
        }
        return fragment;
    }

    compile(fragment){
        let childNodes = fragment.childNodes;
        Array.from(childNodes).forEach(node=>{
            if (this.isElementNode(node)){
                //元素节点
                //编译元素
                this.compileElement(node);
                //递归获取子层
                this.compile(node);
            }else{
                //文本节点
                this.compileText(node);
            }
        })
    }

    //编译元素
    compileElement(node){
        //v-model

        //取出当前节点的属性
        let attrs = node.attributes;
        Array.from(attrs).forEach(attr=>{
            //判断属性名是否包含v-
            let attrName = attr.name;
            if (this.isDirective(attrName)){
                //取对应的值放到节点的值上
                let expr = attr.value;
                //根据属性不同调用不同的方法
                CompileUtil[attrName.slice(2)](node, this.vm, expr);
            }
        })
    }

    //编译文本
    compileText(node){
        //{{}}
        let expr = node.textContent;
        //正则匹配文本中中的内容
        let reg = /\{\{([^}]+)}}/g;
        if (reg.test(expr)){
            //根据属性不同取不同的方法
            CompileUtil['text'](node, this.vm, expr);
        }
    }
}

//编译的工具方法
CompileUtil = {
    //获取实例上的数据
    getVal(vm, expr){
        expr = expr.split('.'); //a.b.c
        return expr.reduce((prev, next)=>{
            return prev[next];
        }, vm.$data);
    },

    setVal(vm, expr, value){
        expr = expr.split('.');
        return expr.reduce((prev, next, currentIndex)=>{
            if (currentIndex === expr.length-1){
                return prev[next] = value;
            }
            return prev[next];
        }, vm.$data)
    },

    //获取文本的值
    getTextValue(vm, expr){
        return expr.replace(/\{\{([^}]+)}}/g, (...args)=>{
            return this.getVal(vm, args[1]);
        });
    },

    text(node, vm, expr){//文本处理
        let updateFn = this.updater['textUpdater'];
        let value = this.getTextValue(vm, expr);
        expr.replace(/\{\{([^}]+)}}/g, (...args)=>{
            new Watcher(vm, args[1], (newValue)=>{
                updateFn && updateFn(node, this.getTextValue(vm, expr));
            })
        });
        updateFn && updateFn(node, value);
    },
    model(node, vm, expr){//输入框处理
        let updateFn = this.updater['modelUpdater'];
        //添加监控
        new Watcher(vm, expr, (newValue)=>{
            updateFn && updateFn(node, this.getVal(vm, expr));
        })
        node.addEventListener('input', (e)=>{
            let newValue = e.target.value;
            this.setVal(vm, expr, newValue);
        })
        updateFn && updateFn(node, this.getVal(vm, expr));
    },
    //...
    updater: {
        textUpdater(node, value){//文本更新
            node.textContent = value;
        },
        modelUpdater(node, value){//输入框更新
            node.value = value;
        }
    }
}

module.exports = {Compile, CompileUtil};


/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

const Dep = __webpack_require__(0).Dep;

class Watcher{
    constructor(vm, expr, cb) {
        this.vm = vm;
        this.expr = expr;
        this.cb = cb;
        //旧值
        this.value = this.get();
    }

    //获取值
    get(){
        Dep.target = this;
        let expr = this.expr.toString();
        let value = this.getVal(this.vm, expr);
        Dep.target = null;
        return value;
    }

    //更新（对外暴露的方法）
    update(){
        let newValue = this.getVal(this.vm, this.expr);
        let oldValue = this.value;
        if (newValue !== oldValue){
            this.cb(newValue); //调用watch的callback
        }
        this.value = newValue;
    }

    getVal(vm, expr){
        expr = expr.split('.'); //a.b.c
        return expr.reduce((prev, next)=>{
            return prev[next];
        }, vm.$data);
    }
}

module.exports = Watcher;


/***/ })
/******/ ]);