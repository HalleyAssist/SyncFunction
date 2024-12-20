const Q = require('@halleyassist/q-lite')

class TimerFunction {
    constructor(fn, defaultDelay = 30*1000, timeout = 2*60*1000){
        this._fn = fn
        this._defaultDelay = defaultDelay
        this._timeout = timeout
        this._boundWork = this._doWork.bind(this)
        this._logger = TimerFunction.logger
        this._timer = null
    }

    async _doWork(){
        const timer = this._timer

        let delay
        try {
            const p = this._fn()
            if (p?.then !== undefined) {
                if(this._timeout > 0){
                    delay = await Q.timeout(p, this._timeout)
                } else if(this._timeout < 0) {
                    delay = await Q.timewarn(p, this._timeout, ()=>this._logger(`Work timed out after ${this._timeout}ms`))
                } else {
                    delay = await p
                }
            }
            else delay = p
        } catch(ex) {
            if (ex.code === 'ETIMEDOUT') this._logger(`Work timed out after ${this._timeout}ms`)
            else this._logger(`Unhandled exception ${ex}`, ex)
        }

        if(delay === undefined || delay === null) delay = this._defaultDelay

        if(this._timer === timer) {
            if(delay === timer.delay) this._timer.refresh()
            else {
                this._timer = setTimeout(this._boundWork, delay)
                this._timer.delay = delay
            }
        }
    }
    start(timeout = null){
        if(this._timer) {
            clearTimeout(this._timer)
            this._timer = null
        }
        if(timeout === null) timeout = this._defaultDelay
        this._timer = setTimeout(this._boundWork, timeout)
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

TimerFunction.logger = (msg, _ex) => console.log(msg)

module.exports = TimerFunction