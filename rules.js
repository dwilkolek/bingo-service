module.exports = {
    ONE_LINE: (nums, calledNumbers) => {
        for (let i = 0; i < nums.length; i++) {
            const row = nums[i];
            if (row.map(cell => cell.marked && (cell.value == null || calledNumbers.indexOf(cell.value) > -1)).reduce((a, b) => a && b, true)) {
                return true;
            }
        }
        return false;
    }
}