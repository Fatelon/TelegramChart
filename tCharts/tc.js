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

    static getYBorderPair(yAllData) {
        const yBorderPair = new Pair(Number.MAX_VALUE, Number.MIN_VALUE);
        yAllData.forEach((colomnData) => {
            yBorderPair.left = Math.min(Math.min(...colomnData), yBorderPair.left);
            yBorderPair.right = Math.max(Math.max(...colomnData), yBorderPair.right);
        });
        // if (yBorderPair.left === Number.MAX_VALUE) {
        //     yBorderPair.left = Math.min(...yAllData[0]);
        // }
        // if (yBorderPair.right === Number.MIN_VALUE) {
        //     yBorderPair.right = Math.max(...yAllData[0]);
        // }
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

    static calculateCanvasBoundaries(width, height, marginBoundaries) {
        return new Boundaries(
            height - marginBoundaries.top,
            width - marginBoundaries.right,
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
        if (vLineIndex !== null) {
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
        const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
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

    static isPointInFrame(point, frame) {
        return point.x >= frame.left && point.x <= frame.right && point.y >= frame.bottom && point.y <= frame.top;
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

    constructor(data) {
        this.init(data);
    }

    init(data) {
        this.canvasContext = null;
        this.canvas = null;

        // this.width = 1000;
        this.width = window.innerWidth * 2 / 3;
        // this.height = 500;
        this.height = window.innerHeight * 2 / 3;

        this.xData = [];
        this.yAllData = [];
        this.limitedData = new Point([], []);
        this.linesColors = [];
        this.yIds = {};
        this.lablesNumber = new Point(7, 7);
        this.yPredInterval = new Interval(0, 0, 1);
        this.yNewInterval = new Interval(0, 0, 1);
        this.axeBoundInterval = new Point(new Interval(0, 0, 1), new Interval(0, 0, 1));
        this.currentScale = new Point(1, 1);
        this.animationFactor = new Point(1, 1);
        this.currentAnimation = null;

        this.frameDragType = '';
        this.changeFrameAllowed = false;
        this.minFrameWidth = this.width / 100;
        // this.minFrameWidth = 0;
        this.predMousePoint = new Point(0, 0);

        this.canvasMargin = new Boundaries(50, 0, 0, 0);

        this.fBorderWidth = new Point(this.width / 100, this.height / 250);

        this.setColors(false);

        this.initCanvas();

        this.prepareData(data);

        this.refreshView(true);
    }

    initCanvas() {
        this.canvas = document.createElement('canvas');
        document.getElementById('cc').appendChild(this.canvas);
        this.canvas.onmouseup = this.onMouseUp.bind(this);
        this.canvas.onmousedown = this.onMouseDown.bind(this);
        this.canvas.onmousemove = this.onMouseMove.bind(this);
        this.canvas.onmouseleave = this.onMouseLeave.bind(this);

        this.addMobile();

        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.canvasContext = this.canvas.getContext('2d');
        this.canvasContext.transform(1, 0, 0, -1, 0, this.canvas.height);

        const smallChartHeight = this.canvas.height * 0.15;
        this.bigChartBoundaries = new Boundaries(
            this.canvas.height - this.canvasMargin.top,
            this.canvas.width - this.canvasMargin.right,
            this.canvasMargin.bottom + smallChartHeight + 30,
            this.canvasMargin.left
        );
        this.smallChartBoundaries = new Boundaries(
            smallChartHeight + this.canvasMargin.bottom,
            this.canvas.width - this.canvasMargin.right,
            this.canvasMargin.bottom,
            this.canvasMargin.left
        );
        this.smallChartWidth = this.smallChartBoundaries.right - this.smallChartBoundaries.left;
        this.frameBoundaries = new Boundaries(
            this.smallChartBoundaries.top,
            this.smallChartBoundaries.left + this.canvas.width * 0.2,
            this.smallChartBoundaries.bottom,
            this.smallChartBoundaries.left
        );
        // this.frameBoundaries = this.smallChartBoundaries;
    }

    prepareData(chartData) {
        chartData.columns.forEach(colomnData => {
            const columnKey = colomnData.slice(0, 1);
            const columnData = colomnData.slice(1);
            if (chartData.types[columnKey] === 'x') {
                this.xData = columnData;
            } else if (chartData.types[columnKey] === 'line') {
                this.yIds[columnKey] = true;
                this.yAllData.push(columnData);
                this.linesColors.push(chartData.colors[columnKey]);
            }
        });
    }

    refreshView(recalculate) {
        if (recalculate) {
            this.calculateDataAndBoundaries();
        }
        this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // this.canvasContext.transform(1, 0, 0, -1, 0, this.canvas.height);
        this.drawBigChart();
        this.drawSmallChart();
        // this.canvasContext.transform(1, 0, 0, -1, 0, this.canvas.height);
    }

    calculateDataAndBoundaries() {
        const frameBorderRate = new Pair(
            this.frameBoundaries.left / this.smallChartWidth,
            this.frameBoundaries.right / this.smallChartWidth
        );
        const dataSection = this.xData[this.xData.length - 1] - this.xData[0];
        this.axeBoundInterval.x.left = dataSection * frameBorderRate.left + this.xData[0];
        this.axeBoundInterval.x.right = dataSection * frameBorderRate.right + this.xData[0];
        let left = 0;
        let right = 0;
        this.xData.forEach((xData, index) => {
            if (xData < this.axeBoundInterval.x.left) {
                left = index + 1;
            } else if (xData <= this.axeBoundInterval.x.right) {
                right = index;
            }
        });
        // const textNum = Math.ceil((right - left + 1) / this.axeBoundInterval.x.step);
        // if (textNum > 9) {
        //     this.axeBoundInterval.x.step *= 2;
        // }
        // if (textNum < 5) {
        //     this.axeBoundInterval.x.step /= 2;
        // }
        while (Math.ceil((right - left + 1) / this.axeBoundInterval.x.step) > 9) {
            this.axeBoundInterval.x.step *= 2;
        }
        while (Math.ceil((right - left + 1) / this.axeBoundInterval.x.step) < 5) {
            this.axeBoundInterval.x.step /= 2;
        }
        left = Math.max(left - 1, 0);
        right = Math.min(right + 1, this.xData.length - 1) + 1;
        this.limitedData.x = this.xData.slice(left, right);
        this.limitedData.y = [];
        this.yAllData.forEach((yData, index) => {
            if (this.yIds[Utils.getKeys(this.yIds)[index]]) this.limitedData.y.push(yData.slice(left, right));
        });
        // if (this.yAllData.length === 0) NO AVAILABLE DATA!!!
        this.currentScale.x = Utils.getScale(this.axeBoundInterval.x, this.bigChartBoundaries.getPair(true));
        const yNewInterval = Utils.getInterval(Utils.getYBorderPair(this.limitedData.y), this.lablesNumber.y);
        if (yNewInterval.isEqual(this.yPredInterval) || yNewInterval.isEqual(this.yNewInterval)) {
            this.refreshView(false);
            return;
        }
        if (this.currentAnimation !== null) {
            clearTimeout(this.currentAnimation);
            console.log('CANCELED!!!');
        }
        this.axeBoundInterval.y = yNewInterval;
        this.yNewInterval = yNewInterval;
        console.log('GO ANIMATION');
        this.runAnimation(0, this);
    }

    runAnimation(rate, scope) {
        rate += 0.06;
        if (rate <= 1) {
            scope.yCalculateMiddleIntervalAndRefrash(rate);
            // scope.refreshView(false);
            scope.currentAnimation = setTimeout(scope.runAnimation, 15, rate, scope);
        } else {
            scope.yCalculateMiddleIntervalAndRefrash(1);
            clearTimeout(scope.currentAnimation);
            scope.currentAnimation = null;
            // scope.refreshView(false);
        }
    }

    yCalculateMiddleIntervalAndRefrash(rate) {
        if (rate === 1) {
            this.yPredInterval = this.yNewInterval;
            this.axeBoundInterval.y = this.yNewInterval;
        } else {
            this.axeBoundInterval.y = Utils.getMiddleInterval(this.yPredInterval, this.yNewInterval, rate);
        }
        this.animationFactor.y = rate;
        this.currentScale.y = Utils.getScale(this.axeBoundInterval.y, this.bigChartBoundaries.getPair(false));
        this.refreshView(false);
    }

    drawBigChart() {
        if (this.animationFactor.y !== 1) {
            this.drawHorizontalLines(this.yPredInterval, 1 - this.animationFactor.y);
        }
        this.drawHorizontalLines(this.yNewInterval, this.animationFactor.y);
        const scaledXData = this.limitedData.x.map(d => (d - this.axeBoundInterval.x.left) * this.currentScale.x + this.bigChartBoundaries.left);
        const vLineIndex = this.drawVerticalLine(scaledXData);
        this.limitedData.y.forEach((yData, index) => {
            Utils.drawChartLine(
                this.canvasContext,
                scaledXData,
                yData.map(d => (d - this.axeBoundInterval.y.left) * this.currentScale.y + this.bigChartBoundaries.bottom),
                this.linesColors[index],
                3,
                vLineIndex
            );
        });
        if (this.animationFactor.y !== 1) {
            this.drawYScaleLabelsText(this.yPredInterval, 1 - this.animationFactor.y);
        }
        this.drawYScaleLabelsText(this.yNewInterval, this.animationFactor.y);
        this.drawXScaleLabelsText();
    }

    drawHorizontalLines(interval, rate) {
        this.canvasContext.beginPath();
        this.canvasContext.strokeStyle = 'rgba(223, 230, 235, ' + rate + ')';
        this.canvasContext.lineWidth = 1;
        let currentY = 0;
        while (currentY <= interval.right - interval.left && interval.step > 0) {
            const yCoordinate = currentY * this.currentScale.y + this.bigChartBoundaries.bottom;
            this.canvasContext.moveTo(this.bigChartBoundaries.left, yCoordinate);
            this.canvasContext.lineTo(this.bigChartBoundaries.right, yCoordinate);
            currentY += interval.step;
        }
        this.canvasContext.stroke();
    }

    drawVerticalLine(scaledXData) {
        if (Utils.isPointInFrame(this.predMousePoint, this.bigChartBoundaries)) {
            let i = 0;
            while ((Math.abs(scaledXData[i + 1] - this.predMousePoint.x) < Math.abs(scaledXData[i] - this.predMousePoint.x)
                || this.bigChartBoundaries.left > scaledXData[i] && this.bigChartBoundaries.right >= scaledXData[i])) {
                i++;
            }
            this.canvasContext.beginPath();
            // this.canvasContext.strokeStyle = this._myColor;
            this.canvasContext.strokeStyle = '#B6C2CA';
            this.canvasContext.lineWidth = 1;
            this.canvasContext.moveTo(scaledXData[i], this.bigChartBoundaries.top);
            this.canvasContext.lineTo(scaledXData[i], this.bigChartBoundaries.bottom);
            this.canvasContext.stroke();
            return i;
        }
    }

    drawYScaleLabelsText(interval, rate) {
        const height = this.canvas.height;
        this.canvasContext.transform(1, 0, 0, -1, 0, height);
        this.canvasContext.fillStyle = 'rgba(150, 162, 170, ' + rate + ')';
        this.canvasContext.font = this.labelsTextFont;
        let currentY = 0;
        while (currentY <= interval.right - interval.left && interval.step > 0) {
            const yCoordinate = currentY * this.currentScale.y + this.bigChartBoundaries.bottom;
            this.canvasContext.fillText('' + (interval.left + currentY),
                this.bigChartBoundaries.left, height - yCoordinate - 0.015 * height);
            currentY += interval.step;
        }
        this.canvasContext.transform(1, 0, 0, -1, 0, height);
    }

    drawXScaleLabelsText() {
        const height = this.canvas.height;
        this.canvasContext.transform(1, 0, 0, -1, 0, height);
        this.canvasContext.fillStyle = 'rgba(150, 162, 170, 1)';
        for (let i = 0; i <= this.xData.length; i += this.axeBoundInterval.x.step) {
            this.canvasContext.fillStyle = 'rgba(150, 162, 170, 1)';
            const xValue = this.xData[i];
            const coord = (xValue - this.axeBoundInterval.x.left) * this.currentScale.x + this.bigChartBoundaries.left;
            this.canvasContext.fillText(
                '' + Utils.formatDate(new Date(xValue)), coord,
                height - this.bigChartBoundaries.bottom + 20
            );
        }
        this.canvasContext.transform(1, 0, 0, -1, 0, height);
    }

    drawSmallChart() {
        // this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const bottomIndent = this.smallChartBoundaries.bottom + 5;
        const yBorderPair = Utils.getYBorderPair(this.yAllData, this.yIds);
        const yScale = Utils.getScale(yBorderPair, new Pair(bottomIndent, this.smallChartBoundaries.top - 5));
        const scaleX = Utils.getScale(new Pair(this.xData[0], this.xData[this.xData.length - 1]), this.smallChartBoundaries);
        const scaledXData = this.xData.map(d => (d - this.xData[0]) * scaleX + this.smallChartBoundaries.left);
        this.yAllData.forEach((yData, index) => {
            if (this.yIds[Utils.getKeys(this.yIds)[index]]) {
                Utils.drawChartLine(
                    this.canvasContext,
                    scaledXData,
                    yData.map(d => (d - yBorderPair.left) * yScale + bottomIndent),
                    this.linesColors[index],
                    1,
                    null
                );
            }
        });
        this.drawFrame();
    }

    drawFrame() {
        const xWidth = this.fBorderWidth.x;
        const yWidth = this.fBorderWidth.y;
        this.canvasContext.strokeStyle = this._frameColor;
        this.canvasContext.beginPath();
        this.canvasContext.lineCap = 'butt';
        this.canvasContext.lineWidth = yWidth;
        this.canvasContext.moveTo(this.frameBoundaries.left, this.frameBoundaries.top - yWidth / 2);
        this.canvasContext.lineTo(this.frameBoundaries.right, this.frameBoundaries.top - yWidth / 2);
        this.canvasContext.moveTo(this.frameBoundaries.right, this.frameBoundaries.bottom + yWidth / 2);
        this.canvasContext.lineTo(this.frameBoundaries.left, this.frameBoundaries.bottom + yWidth / 2);
        this.canvasContext.stroke();
        this.canvasContext.beginPath();
        this.canvasContext.lineWidth = xWidth;
        this.canvasContext.moveTo(this.frameBoundaries.left + xWidth / 2, this.frameBoundaries.bottom + yWidth);
        this.canvasContext.lineTo(this.frameBoundaries.left + xWidth / 2, this.frameBoundaries.top - yWidth);
        this.canvasContext.moveTo(this.frameBoundaries.right - xWidth / 2, this.frameBoundaries.top - yWidth);
        this.canvasContext.lineTo(this.frameBoundaries.right - xWidth / 2, this.frameBoundaries.bottom + yWidth);
        this.canvasContext.stroke();
        this.canvasContext.fillStyle = this._outFrameColor;
        this.canvasContext.fillRect(
            this.smallChartBoundaries.left,
            this.smallChartBoundaries.bottom,
            this.frameBoundaries.left - this.smallChartBoundaries.left,
            this.frameBoundaries.top - this.smallChartBoundaries.bottom);
        this.canvasContext.fillRect(
            this.frameBoundaries.right,
            this.frameBoundaries.bottom,
            this.smallChartBoundaries.right - this.frameBoundaries.right,
            this.frameBoundaries.top - this.smallChartBoundaries.bottom
        );
    }

    setColors(m) {
        this.labelsTextFont = 'lighter 9pt Helvetica';
        this._frameColor = m ? 'rgba(221, 234, 243, 0.7)' : 'rgba(221, 234, 243, 0.7)';
        this._outFrameColor = m ? 'rgba(245, 249, 251, 0.7)' : 'rgba(245, 249, 251, 0.7)';
    }

    onMouseUp(event) {
        this.changeFrameAllowed = false;
    }

    onMouseDown(event) {
        const cRect = event.target.getBoundingClientRect();
        const currentMousePoint = new Point(event.clientX - cRect.left, cRect.bottom - event.clientY);
        if (!Utils.isPointInFrame(currentMousePoint, this.smallChartBoundaries)) {
            this.changeFrameAllowed = false;
            return;
        }
        this.changeFrameAllowed = true;
        this.predMousePoint = currentMousePoint;
        if (currentMousePoint.x < this.frameBoundaries.left + this.fBorderWidth.x) {
            this.frameDragType = 'left';
        } else if (currentMousePoint.x > this.frameBoundaries.right - this.fBorderWidth.x) {
            this.frameDragType = 'right';
        } else {
            this.frameDragType = 'center';
        }
    }

    onMouseMove(event) {
        const cRect = event.target.getBoundingClientRect();
        const currentMousePoint = new Point(event.clientX - cRect.left, cRect.bottom - event.clientY);
        if (currentMousePoint.x === this.predMousePoint.x) return;
        if (!Utils.isPointInFrame(currentMousePoint, this.smallChartBoundaries)) this.changeFrameAllowed = false;
        if (this.changeFrameAllowed) {
            const xOffset = currentMousePoint.x - this.predMousePoint.x;
            if (this.frameDragType === 'left') {
                const newLeft = Math.min(
                    this.frameBoundaries.left + xOffset,
                    this.frameBoundaries.right - this.fBorderWidth.x * 2 - this.minFrameWidth
                );
                this.frameBoundaries.left = Math.max(this.smallChartBoundaries.left, newLeft);
            } else if (this.frameDragType === 'right') {
                const newRight = Math.max(
                    this.frameBoundaries.right + xOffset,
                    this.frameBoundaries.left + this.fBorderWidth.x * 2 + this.minFrameWidth
                );
                this.frameBoundaries.right = Math.min(this.smallChartBoundaries.right, newRight);
            } else if (this.frameDragType === 'center') {
                if (this.frameBoundaries.left + xOffset >= this.smallChartBoundaries.left
                    && this.frameBoundaries.right + xOffset <= this.smallChartBoundaries.right) {
                    this.frameBoundaries.left += xOffset;
                    this.frameBoundaries.right += xOffset;
                }
            }
        }
        this.predMousePoint = currentMousePoint;
        this.refreshView(this.changeFrameAllowed);
    }

    onMouseLeave(event) {
        this.changeFrameAllowed = false;
        this.refreshView(false);
    }

    addMobile() {
        this.canvas.addEventListener('touchstart', function (e) {
            const touch = e.touches[0];
            this.canvas.dispatchEvent(new MouseEvent("mousedown", {
                clientX: touch.clientX,
                clientY: touch.clientY
            }));
        }.bind(this));
        this.canvas.addEventListener('touchend', function (e) {
            this.canvas.dispatchEvent(new MouseEvent('mouseup', {}));
        }.bind(this));
        this.canvas.addEventListener('touchmove', function (e) {
            this.canvas.dispatchEvent(new MouseEvent('mousemove', {
                clientX: e.touches[0].clientX,
                clientY: e.touches[0].clientY
            }));
        }.bind(this));
    }

}

let jsonData = [];
const xhr = new XMLHttpRequest();
xhr.open('GET', '/chart_data.json');
xhr.onreadystatechange = (e) => {
    if(xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
        jsonData = JSON.parse(xhr.responseText);
        jsonData.forEach(data => new TelegramChart(data));
        // JSON.parse(xhr.responseText).forEach(data => new TelegramChart(data));
        // new TelegramChart(JSON.parse(xhr.responseText)[0])
    }
};
xhr.send();

resize = () => {
    const myNode = document.getElementById('cc');
    while (myNode.firstChild) {
        myNode.removeChild(myNode.firstChild);
    }
    jsonData.forEach(data => new TelegramChart(data));
};

window.addEventListener('resize', resize);

