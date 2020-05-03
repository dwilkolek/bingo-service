module.exports = class RandomNumberProvider {

    
    constructor(from, to) {
        this.numbers = [];
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

    getRandomNumbers(n) {
        var nums = [];
        for (var i = 0; i < n; i++) {
            nums.push(this.getRandomNumber());
        }
        return nums.sort();
    }

}