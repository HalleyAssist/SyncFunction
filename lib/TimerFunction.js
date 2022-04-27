const Q = require('q-lite')

class TimerFunction {
    constructor(fn, defaultDelay = 30*1000, timeout = 2*60*1000){
        this._fn = fn
        this._defaultDelay = defaultDelay
        this._timeout = timeout
        this._boundWork = this._doWork.bind(this)
        this._logger = TimerFunction.logger
    }

    async _doWork(){
        const timer = this._timer

        let delay
        try {
            const p = this._fn()
            if (p?.then !== undefined) {
                if(timeout > 0){
                    delay = await Q.timeout(p, this._timeout)
                } else if(timeout < 0) {
                    Q.timeout(p, this._timeout).catch((ex)=>{
                        if (ex.code === 'ETIMEDOUT') this._logger(`Work timed out after ${this._timeout}ms`)
                    })
                    delay = await p
                } else {
                    delay = await p
                }
            }
            else delay = p
        } catch(ex) {
            if (ex.code === 'ETIMEDOUT') this._logger(`Work timed out after ${this._timeout}ms`)
            else this._logger(`Unhandled exception ${ex}`)
        }

        if(delay === undefined || delay === null) delay = this._defaultDelay

        if(this._timer === timer) this._timer = setTimeout(this._boundWork, delay)
    }
    start(timeout = null){
        if(this._timer) {
            clearTimeout(this._timer)
            this._timer = null
        }
        this._timer = setTimeout(this._boundWork, timeout || this._defaultDelay)
    }
    stop(){
        if(this._timer){
            clearTimeout(this._timer)
            this._timer = null
        }
    }

    get started(){
        return !!this._timer
    }
}

TimerFunction.logger = console.log

module.exports = TimerFunction