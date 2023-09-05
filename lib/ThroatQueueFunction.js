const Q = require ('@halleyassist/q-lite')

const NextTickPromise = Q()
const EmptyArray = []

function ThroatQueueFunction(n = 5){
    const running = new Set()

    async function race(cancellationState, running){
        const deferred = Q.defer()
        cancellationState.deferredWrap(deferred)
        running = [deferred.promise, ...running]
        try {
            await Q.safeRace(running)
        } finally {
            deferred.resolve(null)
        }
    }
    
     async function rFn(cancellationState, what, idObj){
        await NextTickPromise
        try {
            if(typeof what === 'function'){
                what = what()  
            }
            return await cancellationState.promiseWrap(what)
        } finally {
            running.delete(idObj)
        }
    }

    let ret = async function(cancellationState, what){
        if(what === null){
            if(running.size === 0) return EmptyArray
            await Promise.all(running)
            if(running.size === 0) return EmptyArray

            // while we waited new jobs were added
            return [...running]
        }

        // This shouldn't happen if we correctly await on the throat
        while(running.size >= n){
            await race(cancellationState, running)
        }

        // will be used as an id
        const dTrack = Q.defer()
        dTrack.promise.fn = what
        dTrack.promise.cancel = ()=>{
            cancellationState.cancel()
        }

        // call the function on the next tick
        const r = rFn(cancellationState, what, dTrack.promise)

        // we are now running
        running.add(dTrack.promise)

        // wait for this to be done
        const d = Q.defer()
        try {
            const fnResult = await r
            dTrack.resolve()
            d.resolve(fnResult)
        } catch(ex) {
            dTrack.resolve()
            d.reject(ex)
        }
        
        // if we are running too many, wait for one to finish
        while(running.size >= n){
            await race(cancellationState, running)
        }

        return await d.promise
    }

    ret = Q.canceller(ret)

    Object.defineProperty(ret, 'running', {
        get: function(){
            return [...running]
        },        
        enumerable: true,
        configurable: true
    });

    return ret
}

module.exports = ThroatQueueFunction