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
