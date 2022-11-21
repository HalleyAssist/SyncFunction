const Q = require("@halleyassist/q-lite")
function ThroatFunction(n = 5){
    const running = new Set()
    let resolve, promise
    const ResolveSet = res => resolve = res
    function preparePromise(){
        if(!resolve) promise = new Promise(ResolveSet)
        return promise
    }
    const ret = async function(what){
        function releasePromise(r){
            running.delete(r)
            if(resolve) {
                const r = resolve
                resolve = null
                r()
            }
        }

        if(what === null){
            if(running.size === 0) return
            await Promise.all(running)
            return
        }

        // This shouldn't happen if we correctly await on the throat
        while(running.size >= n){
            await preparePromise()
        }

        // call fn
        const rP = Q.defer()
        const rFn = async ()=>{
            try {
                if(typeof what === 'function'){
                    what = what()  
                }
                return await what
            } finally {
                const f = await rP.promise
                releasePromise(f[0])
            }
        }
        const r = rFn()
        rP.resolve([r])
        running.add(r)

        if(running.size >= n){
            await preparePromise()
        }
    }

    ret.running = running

    return ret
}

module.exports = ThroatFunction