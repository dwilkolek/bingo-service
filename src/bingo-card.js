const RandomNumberProvider = require('./random-number-provider');
const BingoCell = require('./bingo-cell');
var short = require('short-uuid');

module.exports = class BingoCard {

    constructor(playerId, availablePatterns) {
        this.id = short.generate();
        this.playerId = playerId;
        this.numbers = [];
        this.points = 0;
        this.patternsChecked = [];
        
        this.availablePatterns = availablePatterns;

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

    checkPattern(pattern, calledNumbers) {
        console.log(pattern.name, this.patternsChecked.indexOf(pattern.name), this.availablePatterns)
        if (this.patternsChecked.indexOf(pattern.name) === -1 && this.availablePatterns.indexOf(pattern.name) > -1) {
            const result = pattern.validator(this.numbers, calledNumbers);
            console.log(result)
            if (result) {
                this.patternsChecked.push(pattern.name);
                this.points += pattern.points;
                return true;
            }
        }
        return false;
    }

    mark(row, col) {
        this.numbers[row][col].marked = !this.numbers[row][col].marked;
    }

}