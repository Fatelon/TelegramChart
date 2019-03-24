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

    static getYBorderPair(yAllData, yIds, yIdsKeys) {
        const yBorderPair = new Pair(Number.MAX_VALUE, Number.MIN_VALUE);
        yAllData.forEach((columnData, index) => {
            if (yIds[yIdsKeys[index]].inUse) {
                yBorderPair.left = Math.min(Math.min(...columnData), yBorderPair.left);
                yBorderPair.right = Math.max(Math.max(...columnData), yBorderPair.right);
            }
        });
        return yBorderPair;
    }

    static drawChartLine(canvasContext, xCanvasData, yCanvasdData, backgroundColor, lineColor, lineWidth, lineAlpha, vLineIndex) {
        if (lineAlpha === 0) return;
        canvasContext.lineWidth = lineWidth;
        canvasContext.lineCap = 'round';
        canvasContext.strokeStyle = lineColor;
        canvasContext.beginPath();
        canvasContext.globalAlpha = lineAlpha;
        xCanvasData.forEach((dX, index) => {
            if (yCanvasdData.length > index) {
                canvasContext.lineTo(dX, yCanvasdData[index]);
            }
        });
        canvasContext.stroke();
        if (vLineIndex !== null) {
            canvasContext.beginPath();
            canvasContext.fillStyle = backgroundColor;
            canvasContext.arc(xCanvasData[vLineIndex], yCanvasdData[vLineIndex], 5, 0, 2 * Math.PI);
            canvasContext.fill();
            canvasContext.arc(xCanvasData[vLineIndex], yCanvasdData[vLineIndex], 5, 0, 2 * Math.PI);
            canvasContext.fill();
            canvasContext.stroke();
        }
        canvasContext.globalAlpha = 1;
    }

    static ms = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    static ws = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    static formatDate(date, type) {
        const d = date.getDate();
        const m = date.getMonth();
        let str = this.ms[m] + ' ' + d;
        if (type === 1) {
            const wd = date.getDay();
            str = this.ws[wd] + ', ' + str;
        }
        return str;
    }

    static getScale(dataBoundaries, canvasBoundaries) {
        return Math.abs(canvasBoundaries.right - canvasBoundaries.left) / Math.abs(dataBoundaries.right - dataBoundaries.left);
    }

    static isPointInFrame(point, frame) {
        return point.x >= frame.left && point.x <= frame.right && point.y >= frame.bottom && point.y <= frame.top;
    }

    static getInterval(chartFrame, stepCount) {
        // const epsilon = (chartFrame.right - chartFrame.left) / Math.pow(10, 6);
        // chartFrame.right += epsilon;
        // chartFrame.left -= epsilon;
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

    constructor(data, title) {
        this.init(data, title);
    }

    init(data, chartTitle) {
        this.canvasContext = null;
        this.canvas = null;

        this.width = Math.max(window.innerWidth * 2 / 3, 300);
        this.height = Math.max(window.innerHeight * 3 / 5, 200);

        this.xData = [];
        this.yAllData = [];
        this.limitedData = new Point([], []);
        this.yIds = {};
        this.yIdsKeys = [];
        this.lablesNumber = new Point(7, 7);
        this.yPredInterval = new Interval(0, 0, 1);
        this.yNewInterval = new Interval(0, 0, 1);
        this.axeBoundInterval = new Point(new Interval(0, 0, 1), new Interval(0, 0, 1));
        this.currentScale = new Point(1, 1);
        this.animationFactor = new Point(1, 1);
        this.currentAnimation = new Point(null, null);
        this.promptAnimation = null;
        this.xPredStep = 0;
        this.yCurScale = 0;
        this.yPredScale = 0;

        this.frameDragType = '';
        this.changeFrameAllowed = false;
        this.minFrameWidth = this.width / 100;
        this.predMousePoint = new Point(0, 0);

        this.canvasMargin = new Boundaries(30, 0, 0, 0);

        this.fBorderWidth = new Point(this.width / 100, this.height / 250);

        this.chartTitle = chartTitle;

        this.prepareData(data);

        this.initCanvas();

        this.setMode(true);
    }

    prepareData(chartData) {
        chartData.columns.forEach(cData => {
            const columnKey = cData.slice(0, 1);
            const columnData = cData.slice(1);
            if (chartData.types[columnKey] === 'x') {
                this.xData = columnData;
            } else if (chartData.types[columnKey] === 'line') {
                this.yIdsKeys.push(columnKey);
                this.yIds[columnKey] = {
                    inUse: true,
                    alpha: 0,
                    name: chartData.names[columnKey],
                    color: chartData.colors[columnKey]
                };
                this.yAllData.push(columnData);
            }
        });
    }

    initCanvas() {
        this.addBoard();
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
    }

    addBoard() {
        this.prompt = document.getElementById('prompt');
        this.pDate = document.getElementById('date');
        this.pBody = document.getElementById('body');
        const cc = document.getElementById('cc');
        const cBox = document.createElement('div');
        this.canvas = document.createElement('canvas');
        this.bc = document.createElement('div');
        this.bc.className = 'bp';
        cBox.style.width = this.width + 'px';
        this.yIdsKeys.forEach(yId => {
            const l = document.createElement('label');
            const i = document.createElement('input');
            i.type = 'checkbox';
            // i.checked.style.backgroundColor = this.yIds[yId].color;
            i.style.backgroundColor = this.yIds[yId].color;
            i.style.borderColor = this.yIds[yId].color;
            i.setAttribute('checked', 'true');
            l.appendChild(i);
            l.innerHTML += this.yIds[yId].name;
            this.bc.appendChild(l);
            l.onchange = this.clickOnButton.bind(this, l, yId);
            l.onselectstart = () => false;
        });
        const p = document.createElement('h4');
        p.id = this.chartTitle;
        p.innerHTML = this.chartTitle;
        p.onselectstart = () => {
            return false;
        };
        p.style.textAlign = 'left';
        cBox.appendChild(p);
        cBox.appendChild(this.canvas);
        cBox.appendChild(this.bc);
        cc.appendChild(cBox);
    }

    setMode(m) {
        this.labelsTextFont1 = 'lighter 9pt Helvetica';
        this.labelsTextFont2 = 'lighter 18pt Helvetica';
        this.labelsTextColor = m ? '#96A2AA' : '#96A2AA';
        this._frameColor = m ? '#DDEAF3' : '#40566B';
        this._outFrameColor = m ? '#F5F9FB' : '#1F2A38';
        this.backgroundColor = m ? '#FFFFFF' : '#242F3E';
        this.textColor = m ? '#000000' : '#FFFFFF';
        this.axesTextColor = m ? '#96A2AA' : '#546778';
        this.horizontalLinesColor = m ? '#ECF0F3' : '#313D4D';
        this.verticalLinesColor = m ? '#DFE6EB' : '#3B4A5A';
        document.body.style.backgroundColor = this.backgroundColor;
        this.prompt.style.background = m ? '#FFFFFF' : '#253241';
        this.prompt.style.borderColor = m ? '#DFE6EB' : '#202a37';
        this.prompt.style.boxShadow = m ? '2px 2px 1px #DFE6EB' : '2px 2px 1px #202a37';
        this.pDate.style.color = this.textColor;

        document.getElementById(this.chartTitle).style.color = this.textColor;

        this.bc.childNodes.forEach(l => {
            l.style.color = this.textColor;
            l.style.borderColor = this.verticalLinesColor;
            l.childNodes[0].style.color = this.backgroundColor;
        });

        this.refreshView(true);
    }

    refreshView(recalculate, forceAnim) {
        if (recalculate || forceAnim) {
            this.calculateDataAndBoundaries(forceAnim);
        }
        this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawBigChart();
        this.canvasContext.clearRect(0, 0, this.smallChartBoundaries.right, this.smallChartBoundaries.top);
        this.drawSmallChart();
    }

    calculateDataAndBoundaries(yForceAnim) {
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
        const first = this.xPredStep === 0;
        while (Math.ceil((right - left + 1) / this.axeBoundInterval.x.step) > 9) {
            this.xPredStep = this.axeBoundInterval.x.step;
            this.axeBoundInterval.x.step *= 2;
            !first && this.checkAndRunXAnimation();
        }
        while (Math.ceil((right - left + 1) / this.axeBoundInterval.x.step) < 5) {
            this.xPredStep = this.axeBoundInterval.x.step;
            this.axeBoundInterval.x.step /= 2;
            !first && this.checkAndRunXAnimation();
        }
        left = Math.max(left - 1, 0);
        right = Math.min(right + 1, this.xData.length - 1) + 1;
        this.limitedData.x = this.xData.slice(left, right);
        this.limitedData.y = this.yAllData.map(yData => yData.slice(left, right));
        this.currentScale.x = Utils.getScale(this.axeBoundInterval.x, this.bigChartBoundaries.getPair(true));
        const yBorderPair = Utils.getYBorderPair(this.limitedData.y, this.yIds, this.yIdsKeys);
        let yNewInterval = Utils.getInterval(yBorderPair, this.lablesNumber.y);
        if (yBorderPair.right < yBorderPair.left) yNewInterval = new Interval(10, 10, 1);
        if (!yForceAnim && yNewInterval.isEqual(this.yNewInterval)) return;
        if (this.currentAnimation.y !== null) {
            clearTimeout(this.currentAnimation.y);
            this.yPredInterval = this.yNewInterval;
        }
        this.yNewInterval = yNewInterval;
        this.runYAnimation(0, this);
    }

    runYAnimation(rate, scope) {
        rate += 0.1;
        if (rate <= 1) {
            scope.yCalculateMiddleIntervalAndRefrash(rate);
            scope.currentAnimation.y = setTimeout(scope.runYAnimation, 15, rate, scope);
        } else {
            scope.yCalculateMiddleIntervalAndRefrash(1);
            clearTimeout(scope.currentAnimation.y);
            scope.currentAnimation.y = null;
        }
    }

    yCalculateMiddleIntervalAndRefrash(rate) {
        this.yIdsKeys.forEach(yId => {
            if (this.yIds[yId].inUse && this.yIds[yId].alpha < 1) this.yIds[yId].alpha = rate;
            if (!this.yIds[yId].inUse && this.yIds[yId].alpha > 0) this.yIds[yId].alpha = 1 - rate;
        });
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

    checkAndRunXAnimation() {
        if (this.currentAnimation.x !== null) clearTimeout(this.currentAnimation.x);
        this.runXAnimation(0);
    }

    runXAnimation(rate) {
        rate += 0.1;
        this.animationFactor.x = Math.min(rate, 1);
        if (rate <= 1) {
            if (this.currentAnimation.y === null) this.refreshView(false);
            this.currentAnimation.x = setTimeout(this.runXAnimation.bind(this), 15, rate);
        } else {
            this.animationFactor.x = 1;
            this.xPredStep = this.axeBoundInterval.x.step;
            clearTimeout(this.currentAnimation.x);
            this.currentAnimation.x = null;
            if (this.currentAnimation.y === null) this.refreshView(false);
        }
    }

    drawBigChart() {
        if (this.yNewInterval.left === this.yNewInterval.right) {
            this.drawNoDataText();
            return;
        }
        if (this.animationFactor.y !== 1) {
            this.drawHorizontalLines(this.yPredInterval, 1 - this.animationFactor.y);
        }
        this.drawHorizontalLines(this.yNewInterval, this.animationFactor.y);
        const scaledXData = this.limitedData.x.map(d =>
            (d - this.axeBoundInterval.x.left) * this.currentScale.x + this.bigChartBoundaries.left);
        const vLineIndex = this.drawVerticalLine(scaledXData);
        this.limitedData.y.forEach((yData, index) => {
            Utils.drawChartLine(
                this.canvasContext,
                scaledXData,
                yData.map(d => (d - this.axeBoundInterval.y.left) * this.currentScale.y + this.bigChartBoundaries.bottom),
                this.backgroundColor,
                this.yIds[this.yIdsKeys[index]].color,
                3,
                this.yIds[this.yIdsKeys[index]].alpha,
                vLineIndex
            );
        });
        if (this.animationFactor.y !== 1) {
            this.drawYScaleLabelsText(this.yPredInterval, 1 - this.animationFactor.y);
        }
        this.drawYScaleLabelsText(this.yNewInterval, this.animationFactor.y);
        this.drawXScaleLabelsText();
    }

    drawNoDataText() {
        const height = this.canvas.height;
        this.canvasContext.transform(1, 0, 0, -1, 0, height);
        this.canvasContext.globalAlpha = this.animationFactor.y;
        this.canvasContext.fillStyle = this.labelsTextColor;
        this.canvasContext.font = this.labelsTextFont2;
        this.canvasContext.fillText('No data available', this.canvas.width / 2 - this.canvas.width / 10, this.canvas.height / 2);
        this.canvasContext.transform(1, 0, 0, -1, 0, height);
        this.canvasContext.fill();
        this.canvasContext.stroke();
        this.canvasContext.globalAlpha = 1;
    }

    drawHorizontalLines(interval, rate) {
        this.canvasContext.beginPath();
        this.canvasContext.strokeStyle = this.horizontalLinesColor;
        this.canvasContext.globalAlpha = rate;
        this.canvasContext.lineWidth = 1;
        let currentY = 0;
        while (currentY <= interval.right - interval.left && interval.step > 0) {
            const yCoordinate = currentY * this.currentScale.y + this.bigChartBoundaries.bottom;
            this.canvasContext.moveTo(this.bigChartBoundaries.left, yCoordinate);
            this.canvasContext.lineTo(this.bigChartBoundaries.right, yCoordinate);
            currentY += interval.step;
        }
        this.canvasContext.stroke();
        this.canvasContext.globalAlpha = 1;
    }

    drawVerticalLine(scaledXData) {
        if (!this.changeFrameAllowed && Utils.isPointInFrame(this.predMousePoint, this.bigChartBoundaries)) {
            let i = 0;
            while ((Math.abs(scaledXData[i + 1] - this.predMousePoint.x) < Math.abs(scaledXData[i] - this.predMousePoint.x)
                || this.bigChartBoundaries.left > scaledXData[i] && this.bigChartBoundaries.right >= scaledXData[i])) {
                i++;
            }
            this.canvasContext.beginPath();
            this.canvasContext.strokeStyle = this.verticalLinesColor;
            this.canvasContext.lineWidth = 1;
            this.canvasContext.moveTo(scaledXData[i], this.bigChartBoundaries.top);
            this.canvasContext.lineTo(scaledXData[i], this.bigChartBoundaries.bottom);
            this.canvasContext.stroke();
            const f = (scaledXData[i] - this.bigChartBoundaries.left) / (this.bigChartBoundaries.right - this.bigChartBoundaries.left);
            const newPromptLeft = Math.round(this.canvas.offsetLeft + scaledXData[i] - this.prompt.offsetWidth * f) + 'px';
            if (newPromptLeft !== this.prompt.style.left || this.prompt.style.opacity <= 0) {
                clearTimeout(this.promptAnimation);
                this.setPrompt(i);
                this.runPromptAnimation(0, 0.06);
            }
            this.prompt.style.left = newPromptLeft;
            this.prompt.style.top = (this.canvas.offsetTop + this.canvas.height / 20) + 'px';
            return i;
        }
        if (this.prompt.style.opacity > 0) {
            clearTimeout(this.promptAnimation);
            this.prompt.style.opacity = '0';
        }

        return null;
    }

    setPrompt(i) {
        this.pDate.innerText = Utils.formatDate(new Date(this.limitedData.x[i]), 1);
        while (this.pBody.firstChild) {
            this.pBody.removeChild(this.pBody.firstChild);
        }
        this.yIdsKeys.forEach((key, ind) => {
            if (this.yIds[key].inUse) {
                const info = document.createElement('div');
                info.style.color = this.yIds[key].color;
                info.innerText = this.yIds[key].name + ':  ' + this.limitedData.y[ind][i];
                this.pBody.appendChild(info);
            }
        });
    }

    runPromptAnimation(rate, dir) {
        rate += dir;
        this.prompt.style.opacity = rate + '';
        if (rate > 0 && rate < 1) {
            this.promptAnimation = setTimeout(this.runPromptAnimation.bind(this), 30, rate, dir);
        }
    }

    drawYScaleLabelsText(interval, rate) {
        const height = this.canvas.height;
        this.canvasContext.transform(1, 0, 0, -1, 0, height);
        // this.canvasContext.fillStyle = 'rgba(150, 162, 170, ' + rate + ')';
        this.canvasContext.fillStyle = this.axesTextColor;
        this.canvasContext.lineWidth = 0.2;
        this.canvasContext.strokeStyle = this.axesTextColor;
        this.canvasContext.font = this.labelsTextFont1;
        let currentY = 0;
        while (currentY <= interval.right - interval.left && interval.step > 0) {
            const yCoordinate = currentY * this.currentScale.y + this.bigChartBoundaries.bottom;
            this.canvasContext.fillText('' + (interval.left + currentY),
                this.bigChartBoundaries.left, height - yCoordinate - 0.015 * height);
            this.canvasContext.strokeText('' + (interval.left + currentY),
                this.bigChartBoundaries.left, height - yCoordinate - 0.015 * height);
            currentY += interval.step;
        }
        // this.canvasContext.fill();
        this.canvasContext.stroke();
        this.canvasContext.transform(1, 0, 0, -1, 0, height);
    }

    drawXScaleLabelsText() {
        const height = this.canvas.height;
        this.canvasContext.transform(1, 0, 0, -1, 0, height);
        this.canvasContext.fillStyle = this.axesTextColor;
        this.canvasContext.strokeStyle = this.axesTextColor;
        this.canvasContext.lineWidth = 0.2;
        let factor = this.xPredStep < this.axeBoundInterval.x.step ? 1 - this.animationFactor.x : this.animationFactor.x;
        const step = Math.min(this.xPredStep, this.axeBoundInterval.x.step);
        for (let i = 0; i <= this.xData.length; i += step) {
            this.canvasContext.globalAlpha = (i / step) % 2 === 0 ? 1 : factor;
            const xValue = this.xData[i];
            const coord = (xValue - this.axeBoundInterval.x.left) * this.currentScale.x + this.bigChartBoundaries.left;
            this.canvasContext.strokeText(
                '' + Utils.formatDate(new Date(xValue)), coord,
                height - this.bigChartBoundaries.bottom + 20
            );
            this.canvasContext.fillText(
                '' + Utils.formatDate(new Date(xValue)), coord,
                height - this.bigChartBoundaries.bottom + 20
            );
        }
        this.canvasContext.stroke();
        this.canvasContext.globalAlpha = 1;
        this.canvasContext.transform(1, 0, 0, -1, 0, height);
    }

    drawSmallChart() {
        const bottomIndent = this.smallChartBoundaries.bottom + 5;
        const yBorderPair = Utils.getYBorderPair(this.yAllData, this.yIds, this.yIdsKeys);
        let yScale = Utils.getScale(yBorderPair, new Pair(bottomIndent, this.smallChartBoundaries.top - 5));
        if (this.yCurScale !== yScale || this.yPredScale === 0) this.yPredScale = this.yCurScale;
        this.yCurScale = yScale;
        const scaleX = Utils.getScale(new Pair(this.xData[0], this.xData[this.xData.length - 1]), this.smallChartBoundaries);
        const scaledXData = this.xData.map(d => (d - this.xData[0]) * scaleX + this.smallChartBoundaries.left);

        if (this.yNewInterval.left !== this.yNewInterval.right) {
            this.yAllData.forEach((yData, index) => {
                let sc = yScale;
                if (!this.yIds[this.yIdsKeys[index]].inUse && this.yIds[this.yIdsKeys[index]].alpha < 1)
                    sc = this.yPredScale;
                Utils.drawChartLine(
                    this.canvasContext,
                    scaledXData,
                    yData.map(d => (d - yBorderPair.left) * sc + bottomIndent),
                    this.backgroundColor,
                    this.yIds[this.yIdsKeys[index]].color,
                    1,
                    this.yIds[this.yIdsKeys[index]].alpha,
                    null
                );
            });
        }
        this.drawFrame();
    }

    drawFrame() {
        const xWidth = this.fBorderWidth.x;
        const yWidth = this.fBorderWidth.y;
        this.canvasContext.strokeStyle = this._frameColor;
        this.canvasContext.globalAlpha = 0.6;
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
        this.canvasContext.globalAlpha = 1;
    }

    clickOnButton(l, yId) {
        this.yIds[yId].inUse = !this.yIds[yId].inUse;
        l.childNodes[0].style.backgroundColor = this.yIds[yId].inUse ? this.yIds[yId].color : this.backgroundColor;
        this.refreshView(true, true);
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
        if (Utils.isPointInFrame(currentMousePoint, this.smallChartBoundaries)) {
            this.canvas.style.cursor = 'col-resize';
            // this.changeFrameAllowed = false;
        } else {
            this.canvas.style.cursor = 'default';
        }
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
        this.refreshView(true);
    }

    onMouseLeave(event) {
        const cRect = event.target.getBoundingClientRect();
        this.predMousePoint = new Point(event.clientX - cRect.left, cRect.bottom - event.clientY);
        this.changeFrameAllowed = false;
        this.refreshView(true);
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

let mode = true;
let charts = [];

changeMode = () => {
    mode = !mode;
    const title = document.getElementById('title');
    const hb = document.getElementById('hb');
    const swMode = document.getElementById('swMode');

    if (mode) {
        title.style.color = '#000000';
        swMode.innerText = 'To Night Mode';
        hb.classList.remove('night');
        hb.classList.add('day');
    } else {
        title.style.color = '#FFFFFF';
        swMode.innerText = 'To Day Mode';
        hb.classList.remove('day');
        hb.classList.add('night');
    }
    charts.forEach(ch => ch.setMode(mode));
};

let jsonData = [];
const xhr = new XMLHttpRequest();
xhr.open('GET', '/chart_data.json');
xhr.onreadystatechange = (e) => {
    if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
        charts = [];
        jsonData = JSON.parse(xhr.responseText);
        // jsonData.forEach((data, i) => new TelegramChart(data, 'Chart #' + (i + 1)));
        jsonData.forEach((data, i) => charts.push(new TelegramChart(data, 'Followers #' + (i + 1))));
        // new TelegramChart(JSON.parse(xhr.responseText)[0], 'Followers #' + 1);
    }
};
xhr.send();

// let gWidth = window.innerWidth;
// let gHeight = window.innerHeight;


resize = (e) => {
    const myNode = document.getElementById('cc');
    while (myNode.firstChild) {
        myNode.removeChild(myNode.firstChild);
    }
    jsonData.forEach((data, i) => new TelegramChart(data, 'Followers #' + (i + 1)));
};

window.addEventListener('resize', resize);
