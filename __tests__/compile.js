/**
 * @jest-environment jsdom
 */

jest.mock('../watcher.js');
const Watcher = require('../watcher');
const Compile = require('../compile').Compile;

test('构造函数测试', ()=>{
    expect.assertions(1)

    document.body.innerHTML =
        '<div id="app">' +
        '  <input type="text" v-model="message"><input>' +
        '  {{message}}' +
        '<p id="test">{{message}}<p>'+
        '</div>';
    let el = document.getElementById('app');
    let vm = {
        $el: this.el,
        $data: {
            message: 1
        }
    };
    new Compile(el, vm);
    expect(document.getElementById('test').innerHTML).toBe('1');
})

test('构造函数测试', ()=>{
    expect.assertions(1)
    let vm = {
        $el: '#notExist',
        $data: {
            message: 1
        }
    };
    new Compile('#notExist', vm);
    expect(true).toBe(true);
})
