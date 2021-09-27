const start = Date.now()

const SyncFunction = require('../index'),
      assert = require('assert')

SyncFunction.timeout = 100000

const syncs = []
for(let i = 0; i<200; i++){
    syncs.push(SyncFunction(2000))
}


for(let i = 0; i < 500; i++){
    for(const s of syncs){
        s(async()=>{
            await new Promise(function(resolve){
                for(let f = 0; f<100; f++){
                    assert(true)
                }
                setTimeout(resolve, 10)
            })
        })
    }
}


syncs[0](function(){
    console.log('completed in ', Date.now() - start)
})