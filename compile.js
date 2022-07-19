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
        return expr.replace(/\{\{([^}]+)}}/g, (...arguments)=>{
            return this.getVal(vm, arguments[1]);
        });
    },

    text(node, vm, expr){//文本处理
        let updateFn = this.updater['textUpdater'];
        let value = this.getTextValue(vm, expr);
        expr.replace(/\{\{([^}]+)}}/g, (...arguments)=>{
            new Watcher(vm, arguments[1], (newValue)=>{
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
