function timeout(promise, ms, message = null){
    return new Promise((resolve, reject)=>{
        const e = new Error(message ? message : ("Timed out after " + ms + " ms"))
        e.code = 'ETIMEDOUT'

        const timeout = setTimeout(function(){
            reject(e)
        }, ms)
        
        promise.catch(reject).then(function(r){
            clearTimeout(timeout)
            resolve(r)
        })
    })
}
function SyncFunction(limit = 100){
    let sync = new Promise(r=>r(null))
    let count = 0
    const sf = async (fn, ...args) => {
        const oldSync = sync
        let resolve, reject
        sync = new Promise((_resolve)=>resolve = _resolve)
        let e
        const d2 =  new Promise((_,_reject)=>reject = _reject)
        if(++count > limit){
            console.log(`SyncFunction backlog of ${count} over limit`)
        }
        if(SyncFunction.debug){
            e = {}
            Error.captureStackTrace(e)
            timeout(oldSync, 5000).catch(ex=>{
                if(ex.code==='ETIMEDOUT') {
                    if(sf.processing) console.log(`Possible timeout on ${sf.id} due to ${sf.processing}\nlock requested at:\n${e.stack}\n`)
                    else  console.log("Possible timeout - lock requested at:\n"+e+"\n")
                }
            })
        }
        await oldSync
        if(SyncFunction.debug){
            sf.processing = e
        }
        try {
            const ret = await fn(...args)
            count --
            resolve()
            
            if(SyncFunction.debug){
                if(e === sf.processing) delete sf.processing
            }
            return ret
        }catch(ex){
            //Don't use finally, resolve deferred as soon as possible
            count --
            resolve()
            reject(ex)
            if(SyncFunction.debug){
                if(e === sf.processing) delete sf.processing
            }
        }
        return await d2
    }
    if(SyncFunction.debug){
        sf.id = Math.floor(Math.random() * 100000).toString(16)
        Object.defineProperty(sf, "name", { value: "sf["+sf.id+"]" });
    }
    sf.awaiter = async() => {
        let currentSync
        do {
            currentSync = sync
            await currentSync
        } while(currentSync !== sync)
    }
    sf.toString = () => {
        if(SyncFunction.debug){
            let r = `[SyncFunction(${sf.id}) count:${count}/${limit}]`
            if(sf.processing){
                r += "\n"+sf.processing
            }
            return r
        } else {
            return `[SyncFunction count:${count}/${limit}]`
        }
    }
    if(SyncFunction.debug){
        sf.isLocked = function(){
            return !!sf.processing
        }
    }
    return sf
}
SyncFunction.debug = process.env.NODE_ENV !== 'production'
module.exports = SyncFunction