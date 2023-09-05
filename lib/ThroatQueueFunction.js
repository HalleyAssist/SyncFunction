const Q = require ('@halleyassist/q-lite')

const NextTickPromise = Q()

function ThroatQueueFunction(n = 5){
    const running = []
    async function race(cancellationState, running){
        const deferred = Q.defer()
        cancellationState.deferredWrap(deferred)
        running = [...running, deferred.promise]
        try {
            await Q.safeRace(running)
        } finally {
            deferred.resolve(null)
        }
    }
    let ret = async function(cancellationState, what){
        if(what === null){
            if(running.length === 0) return running
            await Promise.all(running)
            return running
        }

        // This shouldn't happen if we correctly await on the throat
        while(running.length >= n){
            await race(cancellationState, running)
        }
        
        const idObj = {}

        // call fn
        const rFn = async ()=>{
            await NextTickPromise
            try {
                if(typeof what === 'function'){
                    what = what()  
                }
                return await cancellationState.promiseWrap(what)
            } finally {
                for(let i = 0 ; i < running.length; i++){
                    if(running[i].id === idObj){
                        running.splice(i, 1)
                        break
                    }
                }
            }
        }

        const r = rFn()
        const d = Q.defer()
        const dTrack = Q.defer()
        const rr = d.promise
        dTrack.promise.id = rr.id = idObj
        dTrack.promise.fn = rr.fn = what
        dTrack.promise.cancel = rr.cancel = ()=>{
            cancellationState.cancel()
        }
        running.push(dTrack.promise)
        try {
            const fnResult = await r
            dTrack.resolve()
            d.resolve(fnResult)
        } catch(ex) {
            dTrack.resolve()
            d.reject(ex)
        }
        
        while(running.length >= n){
            await race(cancellationState, running)
        }

        return await d.promise
    }

    ret = Q.canceller(ret)

    ret.running = running

    return ret
}

module.exports = ThroatQueueFunction