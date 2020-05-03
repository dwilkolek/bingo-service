const RandomNumberProvider = require('./random-number-provider');
const BingoCell = require('./bingo-cell');
var short = require('short-uuid');

module.exports = class BingoCard {

    constructor(playerId) {
        this.id = short.generate();
        this.playerId = playerId;
        this.numbers = [];
        for (var i = 0; i < 5; i++) {
            var gen = new RandomNumberProvider(i * 15 + 1, (i + 1) * 15).getRandomNumbers(5);
            for (var j = 0; j < 5; j++) {
                if (!this.numbers[j]) {
                    this.numbers[j] = [];
                }
                this.numbers[j][i] = (i == 2 && j == 2) ? new BingoCell(null) : new BingoCell(gen.pop());
            }
        }
    }

    checkBingo(rule, calledNumbers) {
        return rule(this.numbers, calledNumbers);
    }

    mark(row, col) {
        this.numbers[row][col].marked = !this.numbers[row][col].marked;
    }

}