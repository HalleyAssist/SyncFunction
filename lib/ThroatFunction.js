function ThroatFunction(n = 5){
    const running = new Set()
    let resolve, promise
    function releasePromise(r){
        running.delete(r)
        if(promise) {
            if(resolve) {
                resolve()
                promise = resolve = null
            }
        }
    }

    const ResolveSet = res => resolve = res
    const ret = async function(what){
        if(what === null){
            if(running.size === 0) return
            await Promise.all(running)
            return
        }

        // This shouldn't happen if we correctly await on the throat
        while(running.size >= n){
            if(!resolve) promise = new Promise(ResolveSet)
            await promise
        }

        // call fn
        const rFn = async ()=>{
            try {
                if(typeof what === 'function'){
                    what = what()  
                }
                return await what
            } finally {
                releasePromise(r)
            }

        }
        const r = rFn()
        running.add(r)

        if(running.size >= n){
            if(!resolve) promise = new Promise(ResolveSet)
            await promise
        }
    }

    ret.running = running

    return ret
}

module.exports = ThroatFunction