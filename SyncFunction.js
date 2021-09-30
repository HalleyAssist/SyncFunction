const assert = require('assert')

let debug = false
let debugTimeout = 10000
function SyncFunction(limit = 15, id = null){
    let sync = new Promise(r=>r(null))
    let count = 0
    const sf = async (fn, ...args) => {
        assert(typeof fn === 'function')
        const oldSync = sync
        let resolve, reject
        sync = new Promise((_resolve)=>resolve = _resolve)
        let e
        const d2 =  new Promise((_,_reject)=>reject = _reject)
        if(++count > limit){
            if(debug) sf.debugLog(`${sf.name} backlog of ${count} over limit`)
            else sf.debugLog(`${sf.name} backlog of ${count} over limit`)
        }
        
        await oldSync

        if(debug){
            // capture stack and convert it to string
            e = sf.processing || {}
            Error.captureStackTrace(e)
            e = {stack: e.stack.toString()}
            sf.processing = e

            if(debugTimeout > 0){
                e.timeout = setTimeout(()=>{
                    if(sf.processing) sf.debugLog(`Possible timeout with ${count} waiting on ${sf.id} due to ${e.stack}\n`)
                    else  sf.debugLog("Possible timeout - lock requested at:\n"+e+"\n")
                }, debugTimeout)
            }
        }

        try {
            const ret = await fn(...args)
            if(e) clearTimeout(e.timeout)
            count --
            resolve()
            
            if(debug){
                if(e === sf.processing) sf.processing = null
            }
            return ret
        }catch(ex){
            if(e) clearTimeout(e.timeout)
            //Don't use finally, resolve deferred as soon as possible
            count --
            resolve()
            reject(ex)
            if(debug){
                if(e === sf.processing) sf.processing = null
            }
        }
        return await d2
    }
    
    sf.id = id
    if(sf.id === null) sf.id = Math.floor(Math.random() * 100000).toString(16)
    Object.defineProperty(sf, "name", { value: `SyncFunction(${sf.id})` });


    sf.awaiter = async() => {
        let currentSync
        do {
            currentSync = sync
            await currentSync
        } while(currentSync !== sync)
    }
    sf.toString = () => {
        if(debug){
            let r = `[SyncFunction(${sf.id}) count:${count}/${limit}]`
            if(sf.processing){
                r += "\n"+sf.processing
            }
            return r
        } else {
            return `[SyncFunction count:${count}/${limit}]`
        }
    }
    sf.isLocked = function(){
        return !!sf.processing
    }
    sf.debugLog = console.log

    return sf
}

Object.defineProperty(SyncFunction, 'debug', {
    get() { return debug },
    set(newValue) { debug = newValue },
    enumerable: true,
    configurable: false
});

Object.defineProperty(SyncFunction, 'timeout', {
    get() { return debugTimeout },
    set(newValue) { debugTimeout = newValue },
    enumerable: true,
    configurable: false
});

if(process.env.NODE_ENV !== 'production'){
    SyncFunction.debug = true
}


module.exports = SyncFunction