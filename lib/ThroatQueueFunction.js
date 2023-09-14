const Q = require ('@halleyassist/q-lite')

const NextTickPromise = Q()
const EmptyArray = []

function ThroatQueueFunction(n = 5){
    const running = new Set()
    const executing = new Set()

    async function race(cancellationState, running){
        const deferred = Q.defer()
        cancellationState.deferredWrap(deferred)
        running[0] = deferred.promise
        try {
            await Q.cancelledRace(running, false)
        } finally {
            deferred.resolve(null)
        }
    }
    
     async function rFn(cancellationState, what, idObj){
        await NextTickPromise
        let ret
        try {
            if(typeof what === 'function'){
                what = what()  
            }
            ret = await cancellationState.promiseWrap(what)
        } catch(ex){    
            running.delete(idObj)
            executing.delete(idObj)
            throw ex
        }

        running.delete(idObj)
        executing.delete(idObj)
        return ret
    }

    let ret = async function(cancellationState, what, backpressure = false){
        if(what === null){
            if(running.size === 0) return EmptyArray
            await Promise.all(running)
            if(running.size === 0) return EmptyArray

            // while we waited new jobs were added
            return [...running]
        }

        
        const dTrack = Q.defer()

        // will be used as an id
        dTrack.promise.fn = what
        dTrack.promise.cancel = ()=>{ cancellationState.cancel() }

        // we are now running
        running.add(dTrack.promise)


        // Wait on a slot to be allowed to execute
        try {
            do{
                if(executing.size < n) break
                const e = [null, ...executing]
                await race(cancellationState, e)
            // eslint-disable-next-line no-constant-condition
            } while(true)
        } catch(ex){
            dTrack.resolve()
            running.delete(dTrack.promise)
            throw ex
        }
        
        // we are now executing
        executing.add(dTrack.promise)

        // call the function on the next tick
        const r = rFn(cancellationState, what, dTrack.promise)

        // wait for this to be done]
        let fnResult
        try {
            fnResult = await r
        } catch(ex) {
            dTrack.resolve()
            throw ex
        }
        dTrack.resolve()

        // if we are running too many, wait for one to finish
        if(backpressure) {
            try {
                do{
                    if(executing.size < n) break
                    const e = [null, ...executing]
                    await race(cancellationState, e)
                // eslint-disable-next-line no-constant-condition
                } while(true)
            } catch(ex){
                // ignore
            }
        }

        return fnResult
    }

    ret = Q.canceller(ret)

    Object.defineProperty(ret, 'running', {
        get: function(){
            return [...running]
        },        
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(ret, 'executing', {
        get: function(){
            return [...executing]
        },        
        enumerable: true,
        configurable: true
    });

    return ret
}

module.exports = ThroatQueueFunction