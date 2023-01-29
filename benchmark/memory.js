const start = Date.now()

const {SyncFunction, SyncLite} = require('../index'),
      assert = require('assert'),
      Q = require('@halleyassist/q-lite')

SyncFunction.timeout = 100000

async function main(){
    global.gc()


    let used = process.memoryUsage();
    for (let key in used) {
    console.log(`${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
    }


    const syncs = []
    for(let i = 0; i<2000; i++){
        const sf = SyncLite.init()
        for(let i = 0; i < 100; i++){
            SyncLite.fn(sf, async()=>{})
        }
        syncs.push(sf)
        await Q.delay(1)
    }

    global.gc()

    used = process.memoryUsage();
    for (let key in used) {
    console.log(`${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
    }
}
main()