const Dep = require('./observer').Dep;

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
