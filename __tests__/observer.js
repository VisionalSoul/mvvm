jest.mock('../watcher.js')
const Observer = require('../observer').Observer;
const Dep = require('../observer').Dep;
const Watcher = require('../watcher');

test('test', ()=>{
    expect.assertions(1);
    let data = {
        message: '123'
    }
    Dep.target = new Watcher();
    new Observer(data);
    data.message = '123';
    data.message = '456';
    expect(data.message).toBe('456');
})

