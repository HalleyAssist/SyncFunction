const EmptyFn = ()=>{}

function ThroatFunction(n = 5){
    const queue = new Set()
    let resolve, promise
    const ResolveSet = res => resolve = res
    return async function(what){
        if(what === null){
            if(queue.length === 0) return
            await Promise.all(queue)
            return
        }

        // This shouldnt happen if we correctly await on the throat
        while(queue.size >= n){
            if(!resolve) promise = new Promise(ResolveSet)
            await promise
        }

        // call fn
        queue.add(what)
        if(typeof what === 'function'){
            what = what()
        }
        what.catch(EmptyFn).then(()=>{
            queue.delete(what)
            if(deferred) {
                if(resolve) resolve()
                deferred = resolve = null
            }
        })


        if(queue.size >= n){
            if(!resolve) promise = new Promise(ResolveSet)
            await promise
        }
    }
}

module.exports = ThroatFunction