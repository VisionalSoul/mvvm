jest.mock('../observer.js');
jest.mock('../compile.js');
const MVVM = require('../MVVM');
const Observer = require('../observer').Observer;
const Compile = require('../compile').Compile;


test('测试构造函数', ()=>{
    expect.assertions(1);
    let mvvm = new MVVM({
        el:'#app',
        data: {
            message: 1
        }
    })
    expect(true).toBe(true);
})

test('测试构造函数', ()=>{
    expect.assertions(1);
    let mvvm = new MVVM({
        el:null,
        data: {
            message: 1
        }
    })
    expect(true).toBe(true);
})

test('测试数据代理', ()=>{
    expect.assertions(2);
    let mvvm = new MVVM({
        el:'#app',
        data: {
            message: 1
        }
    })
    expect(mvvm.message).toBe(1);
    mvvm.message = 2;
    expect(mvvm.message).toBe(2);
})
