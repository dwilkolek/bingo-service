module.exports = {
    STATUS: {
        WAITING_FOR_PLAYERS: 'WAITING_FOR_PLAYERS',
        STARTED: 'STARTED',
        FINISHED: 'FINISHED'
    },
    WINNER_RESOLUTION: {
        POINTS: 'POINTS',
        PATTERN: 'PATTERN',
    },
    PATTERN_NAMES: {
        ONE_LINE: 'ONE_LINE',
        TWO_LINE: 'TWO_LINE',
        FULL_HOUSE: 'FULL_HOUSE',
    },
    AVAILABLE_BINGO_PATTERNS: {
        POINTS: {
            FULL_HOUSE: ['ONE_LINE', 'TWO_LINE', 'FULL_HOUSE'],
            TWO_LINE: ['ONE_LINE', 'TWO_LINE'],
            ONE_LINE: ['ONE_LINE']
        },
        PATTERN: {
            FULL_HOUSE: ['FULL_HOUSE'],
            TWO_LINE: ['TWO_LINE'],
            ONE_LINE: ['ONE_LINE']
        }
    },
    PATTERN: {
        ONE_LINE: {
            name: 'ONE_LINE',
            points: 1,
            validator: (nums, calledNumbers) => {
                console.log(calledNumbers);
                for (let i = 0; i < nums.length; i++) {
                    const row = nums[i];
                    console.log(row);
                    if (row.map(cell => cell.marked && (cell.value == null || calledNumbers.indexOf(cell.value) > -1)).reduce((a, b) => a && b, true)) {
                        return true;
                    }
                }
                return false;
            }
        },
        TWO_LINE: {
            name: 'TWO_LINE',
            points: 2,
            validator: (nums, calledNumbers) => {
                let lines = 0;
                for (let i = 0; i < nums.length; i++) {
                    const row = nums[i];
                    if (row.map(cell => cell.marked && (cell.value == null || calledNumbers.indexOf(cell.value) > -1)).reduce((a, b) => a && b, true)) {
                        lines++;
                        if (lines == 2) {
                            return true;
                        }
                    }
                }
                return false;
            },
        },
        FULL_HOUSE: {
            name: 'FULL_HOUSE',
            points: 4,
            validator: (nums, calledNumbers) => {
                return nums.map(
                    row => row
                        .map(cell => cell.marked && (cell.value == null || calledNumbers.indexOf(cell.value) > -1))
                        .reduce((a, b) => a && b, true)
                ).reduce((a, b) => a && b, true);
            }
        }
    }
}