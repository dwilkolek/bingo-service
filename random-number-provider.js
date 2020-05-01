module.exports = class RandomNumberProvider {

    numbers = [];
    constructor(from, to) {
        for (let i=from; i<= to; i++) {
            this.numbers.push(i);
        }
    }

    getRandomNumber() {
        this.numbers = this.numbers.sort((a, b) => {
            return Math.random() >= 0.5 ? 1 : -1;
        });
        return this.numbers.pop();
    }

}