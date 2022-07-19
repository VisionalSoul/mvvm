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
        let value = CompileUtil.getVal(this.vm, this.expr);
        Dep.target = null;
        return value;
    }

    //更新（对外暴露的方法）
    update(){
        let newValue = CompileUtil.getVal(this.vm, this.expr);
        let oldValue = this.value;
        if (newValue !== oldValue){
            this.cb(newValue); //调用watch的callback
        }
    }
}
