class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class Pair {
    constructor(left, right) {
        this.left = left;
        this.right = right;
    }
}

class Interval {
    constructor(left, right, step) {
        this.left = left;
        this.right = right;
        this.step = step;
    }

    isEqual(interval) {
        return this.left === interval.left && this.right === interval.right && this.step === interval.step;
    }
}


class Boundaries {
    constructor(top, right, bottom, left) {
        this.top = top;
        this.right = right;
        this.bottom = bottom;
        this.left = left;
    }

    getPair(horizontal) {
        if (horizontal) {
            return new Pair(this.left, this.right);
        } else {
            return new Pair(this.bottom, this.top);
        }
    }
}

class Utils {

    static getMiddleInterval(predInterval, newInterval, rate) {
        return new Interval(
            predInterval.left + (newInterval.left - predInterval.left) * rate,
            predInterval.right + (newInterval.right - predInterval.right) * rate,
            predInterval.step + (newInterval.step - predInterval.step) * rate
        );
    }

    static getYBorderPair(yAllData, yIds) {
        const yBorderPair = new Pair(Number.MAX_VALUE, Number.MIN_VALUE);
        yAllData.forEach((colomnData, index) => {
            if (yIds[Utils.getKeys(yIds)[index]]) {
                yBorderPair.left = Math.min(Math.min(...colomnData), yBorderPair.left);
                yBorderPair.right = Math.max(Math.max(...colomnData), yBorderPair.right);
            }
        });
        if (yBorderPair.left === Number.MAX_VALUE) {
            yBorderPair.left = Math.min(...yAllData[0]);
        }
        if (yBorderPair.right === Number.MIN_VALUE) {
            yBorderPair.right = Math.max(...yAllData[0]);
        }
        return yBorderPair;
    }

    static getLimits(xfData, yAllData, yIds) {
        const limits = new Boundaries(Number.MIN_VALUE, Math.max(...xfData), Number.MAX_VALUE, Math.min(...xfData));
        yAllData.forEach((colomnData, index) => {
            if (yIds[Utils.getKeys(yIds)[index]]) {
                limits.bottom = Math.min(Math.min(...colomnData), limits.bottom);
                limits.top = Math.max(Math.max(...colomnData), limits.top);
            }
        });
        if (limits.bottom === Number.MAX_VALUE) {
            limits.bottom = Math.min(...yAllData[0]);
        }
        if (limits.top === Number.MIN_VALUE) {
            limits.top = Math.max(...yAllData[0]);
        }
        return limits;
    }

    static calculateCanvasBoundaries(canvas, marginBoundaries) {
        return new Boundaries(
            canvas.height - marginBoundaries.top,
            canvas.width - marginBoundaries.right,
            marginBoundaries.bottom,
            marginBoundaries.left
        );
    }

    static drawChartLine(canvasContext, xCanvasData, yCanvasdData, lineColor, lineWidth, vLineIndex) {
        canvasContext.lineWidth = lineWidth;
        canvasContext.lineCap = 'round';
        canvasContext.strokeStyle = lineColor;
        canvasContext.beginPath();
        xCanvasData.forEach((dX, index) => {
            if (yCanvasdData.length > index) {
                canvasContext.lineTo(dX, yCanvasdData[index]);
            }
        });
        canvasContext.stroke();
        if (!isNullOrUndefined(vLineIndex)) {
            canvasContext.beginPath();
            canvasContext.fillStyle = '#FFFFFF';
            // canvasContext.lineWidth = 1;
            canvasContext.arc(xCanvasData[vLineIndex], yCanvasdData[vLineIndex], 5, 0, 2 * Math.PI);
            canvasContext.fill();
            canvasContext.arc(xCanvasData[vLineIndex], yCanvasdData[vLineIndex], 5, 0, 2 * Math.PI);
            canvasContext.stroke();
        }
    }

    static formatDate(date) {
        const monthsShort = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];

        const day = date.getDate();
        const monthIndex = date.getMonth();
        return monthsShort[monthIndex] + ' ' + day;
    }

    static getScale(dataBoundaries, canvasBoundaries) {
        return Math.abs(canvasBoundaries.right - canvasBoundaries.left) / Math.abs(dataBoundaries.right - dataBoundaries.left);
    }

    static getKeys(object) {
        return Object.keys(object);
    }

    static getInterval(chartFrame, stepCount) {
        const epsilon = (chartFrame.right - chartFrame.left) / Math.pow(10, 6);
        chartFrame.right += epsilon;
        chartFrame.left -= epsilon;
        const range = chartFrame.right - chartFrame.left;

        const roughStep = range / (stepCount - 1);
        const goodNormalizedSteps = [1, 1.5, 2, 2.5, 5, 7.5, 10];
        // const goodNormalizedSteps = [1, 2, 5, 10];

        // Normalize rough step to find the normalized one that fits best
        const stepPower = Math.pow(10, -Math.floor(Math.log10(Math.abs(roughStep))));
        const normalizedStep = roughStep * stepPower;
        const goodNormalizedStep = goodNormalizedSteps.find(n => n >= normalizedStep);
        const step = Number.parseInt((goodNormalizedStep / stepPower).toFixed());

        // Determine the scale limits based on the chosen step.
        const scaleMax = Math.ceil(chartFrame.right / step) * step;
        const scaleMin = Math.floor(chartFrame.left / step) * step;

        return new Interval(scaleMin, scaleMax, step);
    }
}



class TelegramChart {

    constructor() {
        this.canvasContext = null;
        this.canvas = null;


        this._width = 1000;
        this._height = 500;
        this._needInit = false;

        this._bigCanvasMargin = new Boundaries(20, 0, 40, 0);
        this._drawingBoundaries = new Boundaries(0, 0, 0, 0);
        //get data
        this.initCanvas('constructor');
    }

    initCanvas() {
        this._needInit = false;
        this.canvas = document.getElementById('chartCanvas');
        this.canvas.width = this._width;
        this.canvas.height = this._height;
        this.canvasContext = this.canvas.getContext('2d');
        this.canvasContext.transform(1, 0, 0, -1, 0, this.canvas.height);
        this._drawingBoundaries = Utils.calculateCanvasBoundaries(this.canvas, this._bigCanvasMargin);
        this.drawHorizontalLines(new Interval(0, 100, 10));
    }

    drawHorizontalLines(interval) {
        this.canvasContext.beginPath();
        this.canvasContext.strokeStyle = 'rgba(223, 230, 235)';
        this.canvasContext.lineWidth = 1;
        let currentY = 0;
        while (currentY <= interval.right - interval.left && interval.step > 0) {
            const yCoordinate = currentY + this._drawingBoundaries.bottom;
            this.canvasContext.moveTo(this._drawingBoundaries.left, yCoordinate);
            this.canvasContext.lineTo(this._drawingBoundaries.right, yCoordinate);
            currentY += interval.step;
        }
        this.canvasContext.stroke();
    }
}

new TelegramChart();