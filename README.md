<h1>简易的MVVM实现<h1/>

[TOC]



## 1.简介

![image-20220720220336710](.\pics\image-20220720220336710.png)

本项目实现了数据劫持和发布订阅模式，同时通过模拟vue中的v-model和{{}}插值语法，简易地实现了数据的双向绑定和单项绑定。通过本项目，我们可以了解vue中数据绑定的原理和机制。本项目只是对vue中少数语法（v-model、{{}}，可扩展）的简单实现，并简单地处理了数据嵌套等问题，也难免可能存在一些问题，欢迎大家批评指正~



## 2.环境要求

单元测试的运行需要安装node、jest以及jsdom环境。

为了同时保证测试用例的运行和浏览器的正常显示，本项目使用了webpack将多个模块打包成了bundle.js，并在index.html中引入。若对模块进行了更改，请使用webpack指令重新打包。



## 3.效果演示

相信大家对mvvm中的双向绑定和单向绑定已经不陌生了，话不多说，直接上代码。

```html
<div id="app">
        <input type="text" v-model="message">
        <div>{{message}} {{test}}</div>
        <ul><li></li></ul>
        {{message}}
</div>
<script src="bundle.js"></script>
<script>
        let vm = new MVVM({
            el:'#app',
            data:{
                message:'hello',
                test:'world'
            }
        })
</script>
```

双向绑定：

![](.\pics\tutieshi_640x329_3s.gif)

单向绑定：

![](.\pics\ezgif-2-a6fdbab845.gif)



## 4.功能点描述

### 4.1 数据劫持

本实验使用observer.js中的Observer类来实现数据劫持：

```javascript
new Observer(this.$data);
```

通过创建一个Observer对象，Observer的构造方法便会处理传入的参数，对参数的data进行数据劫持。

具体实现如下：

```javascript
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
```

此处，构造方法会调用observe方法，若data存在且为object则对data进行劫持。这里进行递归以处理嵌套的对象。

然后，defineReactive会对data添加响应式，即使用defineProperty为data中的属性添加get和set方法，具体实现如下：

```javascript
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
```

至此，我们便实现了数据劫持，之后所有对data中数据的获取与修改都会通过此处定义的get和set方法来实现。



### 4.2 发布订阅模式与数据绑定

我们在observe.js下添加了Dep类，用于管理所有的订阅者以及发布通知。

```javascript
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
```

同时，在watcher.js中定义了Watcher类，用于观察业务逻辑层数据的变化。若数据变化，则通知对应的元素，对元素同步更新。

Watcher中的update方法：

```javascript
update(){
        let newValue = this.getVal(this.vm, this.expr);
        let oldValue = this.value;
        if (newValue !== oldValue){
            this.cb(newValue); //调用watch的callback
        }
        this.value = newValue;
    }
```

该方法在数据变化时会调用watcher的回调方法，即更新元素节点中的内容，使视图页面元素显示的内容与数据一致。



每个元素在compile时，就会创建对应的watcher对象（若一个文本节点中包含多个{{}}，则可能创建多个对象）。此时定义了watcher的对视图层进行更新的回调函数。watcher持有所有的数据以及该元素对应的表达式。在watcher对象创建的时会将该元素添加入defineReactive的dep对象的订阅者列表中。

当任何数据发生变化时（即调用set方法时），会调用dep.notify方法，通知所有的订阅者更新其数据。notify会调用每一个watcher的update方法，回调cb方法对视图层进行更新。

至此，我们实现了数据的单项绑定，即当业务逻辑层数据变化时，视图层会同步更新。

我们为输入框加入了eventListener，实现了当视图层数据修改时同步更新数据。实现如下：

```javascript
node.addEventListener('input', (e)=>{
            let newValue = e.target.value;
            this.setVal(vm, expr, newValue);
        })
```

setVal方法实现如下：

```javascript
    setVal(vm, expr, value){
        expr = expr.split('.');
        return expr.reduce((prev, next, currentIndex)=>{
            if (currentIndex === expr.length-1){
                return prev[next] = value;
            }
            return prev[next];
        }, vm.$data)
    }
```

其中，我们使用 . 号来分割表达式，并对其使用收敛函数取值，以处理可能出现的多层取值表达式（如data.a.b.c)。

至此，我们实现了双向绑定，当视图层的数据修改时，同样会通知到业务逻辑层，使得数据更新。



### 4.3 数据代理（扩展）

在控制台请求业务逻辑层的数据时，需要使用vm.$data.message，较为麻烦且反直觉，因此添加数据代理，实现如下：

```javascript
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
```

之后，在浏览器的控制台中，即可直接使用vm.message访问数据。



## 5.项目结构

### 5.1 MVVM.js

mvvm框架总体的实现，进行了数据的劫持和编译。

依赖于observer.js，compile.js。

### 5.2 observer.js

数据劫持的实现。其中的Dep类实现了管理所有发布订阅。

Observer中的defineReactive方法依赖于Dep类，实现发布订阅。

### 5.3 compile.js

数据编译的实现。

创建元素对应的watcher。

依赖于watcher.js。

### 5.4 watcher.js

发布订阅模式的实现，对应视图层的元素。

创建时添加到Dep的订阅者中。

依赖于observer.js中的Dep类。

### 5.5 \_\_tests\_\_

包含了所有jest单元测试文件。



## 6.实现流程

### 6.1 页面打开时

当页面被打开时，会按照一下流程，实现mvvm：

1.创建一个MVVM对象，传入的参数包括el和data，即将数据绑定在实例上。

2.在MVVM对象的构造函数中，对data进行数据劫持，即为data的属性添加get和set方法。

3.为MVVM对象中的数据添加数据代理。

4.对数据进行编译。即将网页上的dom元素转换为文档碎片，然后从中查找匹配的语法（这里包含v-model和 {{}} ），将元素中的表达式转换为对应的值。并将元素与数据进行绑定，即订阅数据的变化。

5.将编译后的文档碎片放回页面。



### 6.2 逻辑层数据变化时

当MVVM对象中数据变化时：

1.改变MVVM的数据时会调用对应的get方法

2.get方法调用dep的notify，通知所有的订阅者

3.所有订阅者更新自身的数据，即将新的数据更新在视图层。



### 6.3 当视图层变化时

当输入框中的数据变化时：

1.eventListener中的update方法被调用

2.update方法将新的值更新到MVVM的数据中，此处调用了set方法。

3.set方法将视图层页面上所有与该数据绑定的元素更新。



## 7.单元测试

这里使用了jest来进行单元测试。并利用了jest中的jsdom环境和mock等特性，使单元测试能够愉快地完成。

我们分别对MVVM.js、observer.js、compile.js、watcher.js进行了单元测试。测试的结果如下：

<img src=".\pics\image-20220721001011852.png" alt="image-20220721001011852" style="zoom: 67%;" />

![image-20220721001130508](.\pics\image-20220721001130508.png)

如图，语句覆盖达到91.74%，分支覆盖达到81.25%，方法覆盖达到88.37%，行覆盖达到91.66%。



## 8.可扩展性

本项目中仅实现了 {{}} 和v-model。为了便于新的功能的添加，我们对项目中功能的可扩展性进行了优化。具体如下：

在compile.js中，我们将所有的元素节点统一交由compileElement来处理（即所有包含v-开头属性名的元素节点）。在该方法中，我们取出属性名的v-后的字符串，并据此来调用CompileUtil中的方法。

CompileUtil中包含了以属性名来命名的方法。CompileElement便可直接根据属性名来调用其中的方法。若需要添加新的功能，只需在CompileUtil中添加相应的方法及其实现，而不需要更改上层的代码，从而提高了代码的可扩展性。

```javascript
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
```



调用其中的方法只需：

```javascript
CompileUtil[attrName.slice(2)](node, this.vm, expr);
```



## 9.总结

本项目到此就告一段落。项目围绕数据劫持、发布订阅、数据绑定，简单地模拟了MVVM的部分功能。通过这个项目，我们也更深入地了解了MVVM的实现原理。在实践的过程中也不免遇到了许多困难。在解决的过程中也能增加我们的理解。本文只对实现的流程进行了大体的介绍，具体的实现可参看代码。若有不够严谨的实现，欢迎大家提出批评建议。非常感谢老师助教以及同学的帮助与支持。





By.张越