const assert = require('assert')

let debug = false
let debugTimeout = 10000
const StartingPromise = Promise.resolve(null)

function SfIsLocked(){
    return !!this.processing
}

function SyncFunction(limit = 15, id = null){
    // Primary state (private)
    let sync = StartingPromise
    let count = 0

    const sf = async (fn, ...args) => {
        assert(typeof fn === 'function')
        const oldSync = sync
        let resolve, reject
        sync = new Promise((_resolve)=>resolve = _resolve)
        const d2 =  new Promise((_, _reject)=>reject = _reject)
        if(++count > limit){
            sf.debugLog(`${sf.name}: Backlog of ${count} over limit`, "overlimit")
        }
        
        await oldSync

        let e
        if(debug){
            // capture stack and convert it to string
            e = sf.processing || {}
            Error.captureStackTrace(e)
            e = {stack: e.stack.toString()}
            sf.processing = e

            if(debugTimeout > 0){
                e.timeout = setTimeout(function(debugTimeout, sf){
                    let msg = `${sf.name}: Possible timeout after ${debugTimeout}ms `
                    if(sf.processing) msg +=  `with ${count} waiting on ${sf.id} due to ${e.stack}\n`
                    else msg += `lock requested at:\n${e}\n`
                    
                    sf.debugLog(msg, "timeout")
                }, debugTimeout, debugTimeout, sf)
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
    if(sf.id === null) sf.id = '0x'+Math.floor(Math.random() * 0xFFFFFFFF).toString(16)
    Object.defineProperty(sf, "name", { value: `SyncFunction(${sf.id})` });


    sf.awaiter = async() => {
        let currentSync
        do {
            currentSync = sync
            await currentSync
        } while(currentSync !== sync)
    }
    sf.toString = () => {
        let r = `[${sf.name} count:${count}/${limit}]`
        if(!debug || !sf.processing) return r
        r += "\n"+sf.processing
        return r
    }
    sf.isLocked = SfIsLocked
    sf.debugLog = SyncFunction.debugLog

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

SyncFunction.debugLog = msg=>console.log(msg)

module.exports = SyncFunction