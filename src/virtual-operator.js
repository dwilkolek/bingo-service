module.exports = class VirtualOperator {

    constructor(start, call, callInterval) {

        this.timeout = setTimeout(() => {
            start();
            this.interval = setInterval(call, callInterval);
        }, 2 * 60 * 1000);

    }

    stop() {
        this.timeout && clearTimeout(this.timeout);
        this.interval && clearInterval(this.interval);
    }
}