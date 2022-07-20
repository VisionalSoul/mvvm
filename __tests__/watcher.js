jest.mock('../observer.js');
const Watcher = require('../watcher');
const Dep = require('../observer');

test('构造函数测试', ()=>{
    let vm = {
        $el: '#test',
        $data: {
            message: 1
        }
    }
    let expr = 'message';
    let cb = () => 0;
    new Watcher(vm, expr, cb);
})

test('update测试（数据更新）', ()=>{
    expect.assertions(1)
    let vm = {
        $el: '#test',
        $data: {
            message: 1
        }
    }
    let expr = 'message';
    let cb = () => 0;
    let obj = new Watcher(vm, expr, cb);
    obj.vm.$data.message = 2;
    obj.update();
    expect(vm.$data.message).toBe(2);
})

test('update测试（数据未更新）', ()=>{
    expect.assertions(1);
    let vm = {
        $el: '#test',
        $data: {
            message: 1
        }
    }
    let expr = 'message';
    let cb = () => 0;
    let obj = new Watcher(vm, expr, cb);
    obj.vm.$data.message = 1;
    obj.update();
    expect(vm.$data.message).toBe(1);
})
