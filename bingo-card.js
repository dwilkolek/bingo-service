const RandomNumberProvider = require('./random-number-provider');
const BingoCell = require('./bingo-cell');
const { v4: uuidv4 } = require('uuid');

module.exports = class BingoCard {

    id = '';
    numbers = [];

    constructor(playerId) {
        this.id = uuidv4();
        this.playerId = playerId;

        for (var i = 0; i < 5; i++) {
            var gen = new RandomNumberProvider(i * 15 + 1, (i + 1) * 15);
            for (var j = 0; j < 5; j++) {
                if (!this.numbers[j]) {
                    this.numbers[j] = [];
                }
                this.numbers[j][i] = (i == 2 && j == 2) ? new BingoCell(null) : new BingoCell(gen.getRandomNumber());
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