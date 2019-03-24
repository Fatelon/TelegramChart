class Po {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class Pa {
    constructor(left, right) {
        this.left = left;
        this.right = right;
    }
}

class In {
    constructor(left, right, step) {
        this.left = left;
        this.right = right;
        this.step = step;
    }

    isEqual(interval) {
        return this.left === interval.left && this.right === interval.right && this.step === interval.step;
    }
}

class Bo {
    constructor(t, r, b, l) {
        this.top = t;
        this.right = r;
        this.bottom = b;
        this.left = l;
    }

    getPair(h) {
        if (h) {
            return new Pa(this.left, this.right);
        } else {
            return new Pa(this.bottom, this.top);
        }
    }
}

class U {

    static getMiddleInterval(pI, nI, r) {
        return new In(
            pI.left + (nI.left - pI.left) * r,
            pI.right + (nI.right - pI.right) * r,
            pI.step + (nI.step - pI.step) * r
        );
    }

    static getYBorderPair(yAD, yIds, yIdsK) {
        const yBP = new Pa(Number.MAX_VALUE, Number.MIN_VALUE);
        yAD.forEach((cD, index) => {
            if (yIds[yIdsK[index]].inUse) {
                yBP.left = Math.min(Math.min(...cD), yBP.left);
                yBP.right = Math.max(Math.max(...cD), yBP.right);
            }
        });
        return yBP;
    }

    static drawChartLine(cx, xCD, yCD, bC, lC, lW, lA, vLI) {
        if (lA === 0) return;
        cx.lineWidth = lW;
        cx.lineCap = 'round';
        cx.strokeStyle = lC;
        cx.beginPath();
        cx.globalAlpha = lA;
        xCD.forEach((dX, index) => {
            if (yCD.length > index) {
                cx.lineTo(dX, yCD[index]);
            }
        });
        cx.stroke();
        if (vLI !== null) {
            cx.beginPath();
            cx.fillStyle = bC;
            cx.arc(xCD[vLI], yCD[vLI], 5, 0, 2 * Math.PI);
            cx.fill();
            cx.arc(xCD[vLI], yCD[vLI], 5, 0, 2 * Math.PI);
            cx.fill();
            cx.stroke();
        }
        cx.globalAlpha = 1;
    }

    static formatDate(dt, t) {
        const ms = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const ws = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const d = dt.getDate();
        const m = dt.getMonth();
        let s = ms[m] + ' ' + d;
        if (t === 1) {
            const wd = dt.getDay();
            s = ws[wd] + ', ' + s;
        }
        return s;
    }

    static getScale(dB, cB) {
        return Math.abs(cB.right - cB.left) / Math.abs(dB.right - dB.left);
    }

    static isPointInFrame(p, f) {
        return p.x >= f.left && p.x <= f.right && p.y >= f.bottom && p.y <= f.top;
    }

    static getInterval(cF, sC) {
        const range = cF.right - cF.left;

        const rS = range / (sC - 1);
        const gS = [1, 1.5, 2, 2.5, 5, 7.5, 10];

        const sP = Math.pow(10, -Math.floor(Math.log10(Math.abs(rS))));
        const nS = rS * sP;
        const gNS = gS.find(n => n >= nS);
        const step = Number.parseInt((gNS / sP).toFixed());

        const sM = Math.ceil(cF.right / step) * step;
        const sMi = Math.floor(cF.left / step) * step;

        return new In(sMi, sM, step);
    }
}

class TC {

    constructor(d, t, m) {
        this.init(d, t, m);
    }

    init(d, t, m) {
        this.cx = null;
        this.canvas = null;

        this.width = Math.max(window.innerWidth * 2 / 3, 300);
        this.height = Math.max(window.innerHeight * 3 / 5, 200);

        this.xD = [];
        this.yAllData = [];
        this.limitedData = new Po([], []);
        this.yIds = {};
        this.yIdsKeys = [];
        this.lablesNumber = new Po(7, 7);
        this.yPredInterval = new In(0, 0, 1);
        this.yNewInterval = new In(0, 0, 1);
        this.axeBoundInterval = new Po(new In(0, 0, 1), new In(0, 0, 1));
        this.currentScale = new Po(1, 1);
        this.animationFactor = new Po(1, 1);
        this.currentAnimation = new Po(null, null);
        this.promptAnimation = null;
        this.xPredStep = 0;
        this.yCurScale = 0;
        this.yPredScale = 0;

        this.frameDragType = '';
        this.changeFrameAllowed = false;
        this.minFrameWidth = this.width / 100;
        this.predMousePoint = new Po(0, 0);

        this.canvasMargin = new Bo(30, 0, 0, 0);

        this.fBorderWidth = new Po(this.width / 100, this.height / 250);

        this.chartTitle = t;

        this.prepareData(d);

        this.initCanvas();

        this.setMode(m);
    }

    prepareData(chartData) {
        chartData.columns.forEach(cData => {
            const columnKey = cData.slice(0, 1);
            const columnData = cData.slice(1);
            if (chartData.types[columnKey] === 'x') {
                this.xD = columnData;
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
        this.cx = this.canvas.getContext('2d');
        this.cx.transform(1, 0, 0, -1, 0, this.canvas.height);

        const smallChartHeight = this.canvas.height * 0.15;
        this.bigChartBoundaries = new Bo(
            this.canvas.height - this.canvasMargin.top,
            this.canvas.width - this.canvasMargin.right,
            this.canvasMargin.bottom + smallChartHeight + 30,
            this.canvasMargin.left
        );
        this.smallChartBoundaries = new Bo(
            smallChartHeight + this.canvasMargin.bottom,
            this.canvas.width - this.canvasMargin.right,
            this.canvasMargin.bottom,
            this.canvasMargin.left
        );
        this.smallChartWidth = this.smallChartBoundaries.right - this.smallChartBoundaries.left;
        this.frameBoundaries = new Bo(
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
            i.style.backgroundColor = this.yIds[yId].color;
            i.style.borderColor = this.yIds[yId].color;
            i.setAttribute('checked', 'true');
            l.appendChild(i);
            l.innerHTML += this.yIds[yId].name;
            this.bc.appendChild(l);
            l.onchange = this.clickOnButton.bind(this, l, yId);
            l.onselectstart = () => false;
        });
        const p = document.createElement('h3');
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
        });

        this.refreshView(true);
    }

    refreshView(recalculate, forceAnim) {
        if (recalculate || forceAnim) {
            this.calculateDataAndBoundaries(forceAnim);
        }
        this.cx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawBigChart();
        this.cx.clearRect(0, 0, this.smallChartBoundaries.right, this.smallChartBoundaries.top);
        this.drawSmallChart();
    }

    calculateDataAndBoundaries(yForceAnim) {
        const frameBorderRate = new Pa(
            this.frameBoundaries.left / this.smallChartWidth,
            this.frameBoundaries.right / this.smallChartWidth
        );
        const dataSection = this.xD[this.xD.length - 1] - this.xD[0];
        this.axeBoundInterval.x.left = dataSection * frameBorderRate.left + this.xD[0];
        this.axeBoundInterval.x.right = dataSection * frameBorderRate.right + this.xD[0];
        let left = 0;
        let right = 0;
        this.xD.forEach((xData, index) => {
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
        right = Math.min(right + 1, this.xD.length - 1) + 1;
        this.limitedData.x = this.xD.slice(left, right);
        this.limitedData.y = this.yAllData.map(yData => yData.slice(left, right));
        this.currentScale.x = U.getScale(this.axeBoundInterval.x, this.bigChartBoundaries.getPair(true));
        const yBorderPair = U.getYBorderPair(this.limitedData.y, this.yIds, this.yIdsKeys);
        let yNewInterval = U.getInterval(yBorderPair, this.lablesNumber.y);
        if (yBorderPair.right < yBorderPair.left) yNewInterval = new In(10, 10, 1);
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
            this.axeBoundInterval.y = U.getMiddleInterval(this.yPredInterval, this.yNewInterval, rate);
        }
        this.animationFactor.y = rate;
        this.currentScale.y = U.getScale(this.axeBoundInterval.y, this.bigChartBoundaries.getPair(false));
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
            U.drawChartLine(
                this.cx,
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
        this.cx.transform(1, 0, 0, -1, 0, height);
        this.cx.globalAlpha = this.animationFactor.y;
        this.cx.fillStyle = this.labelsTextColor;
        this.cx.font = this.labelsTextFont2;
        this.cx.fillText('No data available', this.canvas.width / 2 - this.canvas.width / 10, this.canvas.height / 2);
        this.cx.transform(1, 0, 0, -1, 0, height);
        this.cx.fill();
        this.cx.stroke();
        this.cx.globalAlpha = 1;
    }

    drawHorizontalLines(interval, rate) {
        this.cx.beginPath();
        this.cx.strokeStyle = this.horizontalLinesColor;
        this.cx.globalAlpha = rate;
        this.cx.lineWidth = 1;
        let currentY = 0;
        while (currentY <= interval.right - interval.left && interval.step > 0) {
            const yCoordinate = currentY * this.currentScale.y + this.bigChartBoundaries.bottom;
            this.cx.moveTo(this.bigChartBoundaries.left, yCoordinate);
            this.cx.lineTo(this.bigChartBoundaries.right, yCoordinate);
            currentY += interval.step;
        }
        this.cx.stroke();
        this.cx.globalAlpha = 1;
    }

    drawVerticalLine(scaledXData) {
        if (!this.changeFrameAllowed && U.isPointInFrame(this.predMousePoint, this.bigChartBoundaries)) {
            let i = 0;
            while ((Math.abs(scaledXData[i + 1] - this.predMousePoint.x) < Math.abs(scaledXData[i] - this.predMousePoint.x)
                || this.bigChartBoundaries.left > scaledXData[i] && this.bigChartBoundaries.right >= scaledXData[i])) {
                i++;
            }
            this.cx.beginPath();
            this.cx.strokeStyle = this.verticalLinesColor;
            this.cx.lineWidth = 1;
            this.cx.moveTo(scaledXData[i], this.bigChartBoundaries.top);
            this.cx.lineTo(scaledXData[i], this.bigChartBoundaries.bottom);
            this.cx.stroke();
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
        this.pDate.innerText = U.formatDate(new Date(this.limitedData.x[i]), 1);
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
        this.cx.transform(1, 0, 0, -1, 0, height);
        this.cx.fillStyle = this.axesTextColor;
        this.cx.lineWidth = 0.2;
        this.cx.strokeStyle = this.axesTextColor;
        this.cx.font = this.labelsTextFont1;
        let currentY = 0;
        while (currentY <= interval.right - interval.left && interval.step > 0) {
            const yCoordinate = currentY * this.currentScale.y + this.bigChartBoundaries.bottom;
            this.cx.fillText('' + (interval.left + currentY),
                this.bigChartBoundaries.left, height - yCoordinate - 0.015 * height);
            this.cx.strokeText('' + (interval.left + currentY),
                this.bigChartBoundaries.left, height - yCoordinate - 0.015 * height);
            currentY += interval.step;
        }
        this.cx.stroke();
        this.cx.transform(1, 0, 0, -1, 0, height);
    }

    drawXScaleLabelsText() {
        const height = this.canvas.height;
        this.cx.transform(1, 0, 0, -1, 0, height);
        this.cx.fillStyle = this.axesTextColor;
        this.cx.strokeStyle = this.axesTextColor;
        this.cx.lineWidth = 0.2;
        let factor = this.xPredStep < this.axeBoundInterval.x.step ? 1 - this.animationFactor.x : this.animationFactor.x;
        const step = Math.min(this.xPredStep, this.axeBoundInterval.x.step);
        for (let i = 0; i <= this.xD.length; i += step) {
            this.cx.globalAlpha = (i / step) % 2 === 0 ? 1 : factor;
            const xValue = this.xD[i];
            const coord = (xValue - this.axeBoundInterval.x.left) * this.currentScale.x + this.bigChartBoundaries.left;
            this.cx.strokeText(
                '' + U.formatDate(new Date(xValue)), coord,
                height - this.bigChartBoundaries.bottom + 20
            );
            this.cx.fillText(
                '' + U.formatDate(new Date(xValue)), coord,
                height - this.bigChartBoundaries.bottom + 20
            );
        }
        this.cx.stroke();
        this.cx.globalAlpha = 1;
        this.cx.transform(1, 0, 0, -1, 0, height);
    }

    drawSmallChart() {
        const bottomIndent = this.smallChartBoundaries.bottom + 5;
        const yBorderPair = U.getYBorderPair(this.yAllData, this.yIds, this.yIdsKeys);
        let yScale = U.getScale(yBorderPair, new Pa(bottomIndent, this.smallChartBoundaries.top - 5));
        if (this.yCurScale !== yScale || this.yPredScale === 0) this.yPredScale = this.yCurScale;
        this.yCurScale = yScale;
        const scaleX = U.getScale(new Pa(this.xD[0], this.xD[this.xD.length - 1]), this.smallChartBoundaries);
        const scaledXData = this.xD.map(d => (d - this.xD[0]) * scaleX + this.smallChartBoundaries.left);

        if (this.yNewInterval.left !== this.yNewInterval.right) {
            this.yAllData.forEach((yData, index) => {
                let sc = yScale;
                if (!this.yIds[this.yIdsKeys[index]].inUse && this.yIds[this.yIdsKeys[index]].alpha < 1)
                    sc = this.yPredScale;
                U.drawChartLine(
                    this.cx,
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
        this.cx.strokeStyle = this._frameColor;
        this.cx.globalAlpha = 0.6;
        this.cx.beginPath();
        this.cx.lineCap = 'butt';
        this.cx.lineWidth = yWidth;
        this.cx.moveTo(this.frameBoundaries.left, this.frameBoundaries.top - yWidth / 2);
        this.cx.lineTo(this.frameBoundaries.right, this.frameBoundaries.top - yWidth / 2);
        this.cx.moveTo(this.frameBoundaries.right, this.frameBoundaries.bottom + yWidth / 2);
        this.cx.lineTo(this.frameBoundaries.left, this.frameBoundaries.bottom + yWidth / 2);
        this.cx.stroke();
        this.cx.beginPath();
        this.cx.lineWidth = xWidth;
        this.cx.moveTo(this.frameBoundaries.left + xWidth / 2, this.frameBoundaries.bottom + yWidth);
        this.cx.lineTo(this.frameBoundaries.left + xWidth / 2, this.frameBoundaries.top - yWidth);
        this.cx.moveTo(this.frameBoundaries.right - xWidth / 2, this.frameBoundaries.top - yWidth);
        this.cx.lineTo(this.frameBoundaries.right - xWidth / 2, this.frameBoundaries.bottom + yWidth);
        this.cx.stroke();
        this.cx.fillStyle = this._outFrameColor;
        this.cx.fillRect(
            this.smallChartBoundaries.left,
            this.smallChartBoundaries.bottom,
            this.frameBoundaries.left - this.smallChartBoundaries.left,
            this.frameBoundaries.top - this.smallChartBoundaries.bottom);
        this.cx.fillRect(
            this.frameBoundaries.right,
            this.frameBoundaries.bottom,
            this.smallChartBoundaries.right - this.frameBoundaries.right,
            this.frameBoundaries.top - this.smallChartBoundaries.bottom
        );
        this.cx.globalAlpha = 1;
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
        const currentMousePoint = new Po(event.clientX - cRect.left, cRect.bottom - event.clientY);
        if (!U.isPointInFrame(currentMousePoint, this.smallChartBoundaries)) {
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
        const currentMousePoint = new Po(event.clientX - cRect.left, cRect.bottom - event.clientY);
        if (currentMousePoint.x === this.predMousePoint.x) return;
        if (U.isPointInFrame(currentMousePoint, this.smallChartBoundaries)) {
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
        this.predMousePoint = new Po(event.clientX - cRect.left, cRect.bottom - event.clientY);
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
        jsonData.forEach((data, i) => charts.push(new TC(data, 'Followers #' + (i + 1), mode)));
    }
};
xhr.send();

resize = (e) => {
    const myNode = document.getElementById('cc');
    while (myNode.firstChild) {
        myNode.removeChild(myNode.firstChild);
    }
    charts = [];
    jsonData.forEach((data, i) => charts.push(new TC(data, 'Followers #' + (i + 1), mode)));
};

window.addEventListener('resize', resize);
