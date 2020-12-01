const SyncFunction = require('../SyncFunction')

function SyncQueue(){
    const sync = SyncFunction(2)
    let queue = []
    let currentPromise

    async function handleQueue (){
        const localQueue = queue
        queue = []
        for(const q of localQueue){
            await q()
        }
    }

    return async function(fnIn){
        let ret
        const fn = async()=>{
            ret = await fnIn()
        }
        queue.push(fn)

        let localPromise = currentPromise
        if(!currentPromise){
            currentPromise = sync(handleQueue)
            await currentPromise
            return ret
        }

        await localPromise

        while(queue.includes(fn)){
            if(localPromise == currentPromise){
                currentPromise = sync(handleQueue)
                await currentPromise
            }
        }

        return ret
    }
}
module.exports = SyncQueue