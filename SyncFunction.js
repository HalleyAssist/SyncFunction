function timeout(promise, ms){
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
    const sf = async (fn) => {
        const oldSync = sync
        let resolve, reject
        sync = new Promise((_resolve)=>resolve = _resolve)
        let e
        const d2 =  new Promise((_,_reject)=>reject = _reject)
        if(++count > limit){
            console.log(`SyncFunction backlog of ${count} over limit`)
        }
        if(process.env.NODE_ENV !== 'production'){
            e = (new Error).stack
            timeout(oldSync, 5000).catch(ex=>{
                if(ex.code==='ETIMEDOUT') {
                    if(sf.processing) console.log(`Possible timeout on ${sf.id} due to ${sf.processing}\nlock requested at:\n${e}\n`)
                    else  console.log("Possible timeout - lock requested at:\n"+e+"\n")
                }
            })
        }
        await oldSync
        if(process.env.NODE_ENV !== 'production'){
            sf.processing = e
        }
        try {
            const ret = await fn()
            count --
            resolve()
            
            if(process.env.NODE_ENV !== 'production'){
                if(e === sf.processing) delete sf.processing
            }
            return ret
        }catch(ex){
            //Don't use finally, resolve deferred as soon as possible
            count --
            resolve()
            reject(ex)
            if(process.env.NODE_ENV !== 'production'){
                if(e === sf.processing) delete sf.processing
            }
        }
        return await d2
    }
    if(process.env.NODE_ENV !== 'production'){
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
        if(process.env.NODE_ENV === 'production'){
            return `[SyncFunction count:${count}/${limit}]`
        } else {
            let r = `[SyncFunction(${sf.id}) count:${count}/${limit}]`
            if(sf.processing){
                r += "\n"+sf.processing
            }
            return r
        }
    }
    if(process.env.NODE_ENV !== 'production'){
        sf.isLocked = function(){
            return !!sf.processing
        }
    }
    return sf
}
module.exports = SyncFunction