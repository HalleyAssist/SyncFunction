const SyncFunction = require('./SyncFunction')

function SyncQueue(){
    const sync = SyncFunction(2)
    let queue = []
    let currentPromise

    async function handleQueue (){
        running ++
        const localQueue = queue
        queue = []
        for(const q of localQueue) {
            await q()
        }
        currentPromise = null
    }

    return async function(fnIn, ...args){
        let ret

        // add our new fn to the queue
        const fn = async()=>{
            try {
                ret = await fnIn(...args)
            } catch(ex){
                ret = Promise.reject(ex)
            }
        }
        queue.push(fn)

        // wait on current execution
        let localPromise = currentPromise
        while(queue.includes(fn)){
            if(localPromise) await localPromise

            if(!localPromise){
                currentPromise = sync(handleQueue)
                await currentPromise
            }
            localPromise = currentPromise
        }

        if(localPromise) await localPromise

        return ret
    }
}
module.exports = SyncQueue