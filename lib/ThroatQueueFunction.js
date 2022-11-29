const Q = require ('@halleyassist/q-lite')

const NextTickPromise = Q()

function ThroatQueueFunction(n = 5){
    const running = []
    let ret = async function(cancellationState, what){
        if(what === null){
            if(running.length === 0) return running
            await Promise.all(running)
            return running
        }

        // This shouldn't happen if we correctly await on the throat
        while(running.length >= n){
            await cancellationState.promiseWrap(Q.cancelledRace(running))
        }

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

        const idObj = {}
        const r = rFn()
        r.id = idObj
        r.fn = what
        r.cancel = ()=>{
            cancellationState.cancel()
        }
        running.push(r)
        await r

        while(running.length >= n){
            await cancellationState.promiseWrap(Q.cancelledRace(running))
        }
    }

    ret = Q.canceller(ret)

    ret.running = running

    return ret
}

module.exports = ThroatQueueFunction