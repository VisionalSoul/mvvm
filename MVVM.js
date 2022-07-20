const Observer = require('./observer').Observer;
const Compile = require('./compile').Compile;

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

module.exports = MVVM;

vm = new MVVM({
    el:'#app',
    data:{
        message:'hello',
        test:'world'
    }
})
