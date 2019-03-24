class Po {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class Pa {
    constructor(l, r) {
        this.l = l;
        this.r = r;
    }
}

class In {
    constructor(l, r, s) {
        this.l = l;
        this.r = r;
        this.s = s;
    }

    isEqual(i) {
        return this.l === i.l && this.r === i.r && this.s === i.s;
    }
}

class Bo {
    constructor(t, r, b, l) {
        this.t = t;
        this.r = r;
        this.b = b;
        this.l = l;
    }

    getPair(h) {
        if (h) {
            return new Pa(this.l, this.r);
        } else {
            return new Pa(this.b, this.t);
        }
    }
}

class U {

    static getMiddleInterval(pI, nI, r) {
        return new In(
            pI.l + (nI.l - pI.l) * r,
            pI.r + (nI.r - pI.r) * r,
            pI.s + (nI.s - pI.s) * r
        );
    }

    static getYBorderPair(yAD, yIds, yIdsK) {
        const yBP = new Pa(Number.MAX_VALUE, Number.MIN_VALUE);
        yAD.forEach((cD, i) => {
            if (yIds[yIdsK[i]].inUse) {
                yBP.l = Math.min(Math.min(...cD), yBP.l);
                yBP.r = Math.max(Math.max(...cD), yBP.r);
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
        return Math.abs(cB.r - cB.l) / Math.abs(dB.r - dB.l);
    }

    static isPointInFrame(p, f) {
        return p.x >= f.l && p.x <= f.r && p.y >= f.b && p.y <= f.t;
    }

    static getInterval(cF, sC) {
        const range = cF.r - cF.l;

        const rS = range / (sC - 1);
        const gS = [1, 1.5, 2, 2.5, 5, 7.5, 10];

        const sP = Math.pow(10, -Math.floor(Math.log10(Math.abs(rS))));
        const nS = rS * sP;
        const gNS = gS.find(n => n >= nS);
        const st = Number.parseInt((gNS / sP).toFixed());

        const sM = Math.ceil(cF.r / st) * st;
        const sMi = Math.floor(cF.l / st) * st;

        return new In(sMi, sM, st);
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
        this.yAD = [];
        this.limD = new Po([], []);
        this.yIds = {};
        this.yIdsKeys = [];
        this.lbN = new Po(7, 7);
        this.yPrINT = new In(0, 0, 1);
        this.yNIn = new In(0, 0, 1);
        this.axBI = new Po(new In(0, 0, 1), new In(0, 0, 1));
        this.crSc = new Po(1, 1);
        this.anFc = new Po(1, 1);
        this.cAn = new Po(null, null);
        this.prAn = null;
        this.xPredStep = 0;
        this.yCurScale = 0;
        this.yPredScale = 0;

        this.frDT = '';
        this.chFrAll = false;
        this.mFrWd = this.width / 100;
        this.prMP = new Po(0, 0);

        this.cMar = new Bo(30, 0, 0, 0);

        this.fBdWd = new Po(this.width / 100, this.height / 250);

        this.chTt = t;

        this.prepareData(d);

        this.initCanvas();

        this.setMode(m);
    }

    prepareData(chartData) {
        chartData.columns.forEach(cData => {
            const colK = cData.slice(0, 1);
            const colD = cData.slice(1);
            if (chartData.types[colK] === 'x') {
                this.xD = colD;
            } else if (chartData.types[colK] === 'line') {
                this.yIdsKeys.push(colK);
                this.yIds[colK] = {
                    inUse: true,
                    alpha: 0,
                    name: chartData.names[colK],
                    color: chartData.colors[colK]
                };
                this.yAD.push(colD);
            }
        });
    }

    initCanvas() {
        this.addBoard();
        this.canvas.onmouseup = this.onMouseUp.bind(this);
        this.canvas.onmousedown = this.onMouseDown.bind(this);
        this.canvas.onmousemove = this.onMouseMove.bind(this);
        this.canvas.onmouseleave = this.onMouseLeave.bind(this);

        this.addMob();

        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.cx = this.canvas.getContext('2d');
        this.cx.transform(1, 0, 0, -1, 0, this.canvas.height);

        const smallChartHeight = this.canvas.height * 0.15;
        this.bigChartBoundaries = new Bo(
            this.canvas.height - this.cMar.t,
            this.canvas.width - this.cMar.r,
            this.cMar.b + smallChartHeight + 30,
            this.cMar.l
        );
        this.smCB = new Bo(
            smallChartHeight + this.cMar.b,
            this.canvas.width - this.cMar.r,
            this.cMar.b,
            this.cMar.l
        );
        this.smallChartWidth = this.smCB.r - this.smCB.l;
        this.frB = new Bo(
            this.smCB.t,
            this.smCB.l + this.canvas.width * 0.2,
            this.smCB.b,
            this.smCB.l
        );
    }

    addBoard() {
        this.prompt = document.getElementById('pr');
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
        p.id = this.chTt;
        p.innerHTML = this.chTt;
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
        this.lTF1 = 'lighter 9pt Helvetica';
        this.lTF2 = 'lighter 18pt Helvetica';
        this.lbTCl = m ? '#96A2AA' : '#96A2AA';
        this.frCl = m ? '#DDEAF3' : '#40566B';
        this.oFrCl = m ? '#F5F9FB' : '#1F2A38';
        this.bkCl = m ? '#FFFFFF' : '#242F3E';
        this.txCl = m ? '#000000' : '#FFFFFF';
        this.axTC = m ? '#96A2AA' : '#546778';
        this.hrLC = m ? '#ECF0F3' : '#313D4D';
        this.vrLC = m ? '#DFE6EB' : '#3B4A5A';
        document.body.style.backgroundColor = this.bkCl;
        this.prompt.style.background = m ? '#FFFFFF' : '#253241';
        this.prompt.style.borderColor = m ? '#DFE6EB' : '#202a37';
        this.prompt.style.boxShadow = m ? '2px 2px 1px #DFE6EB' : '2px 2px 1px #202a37';
        this.pDate.style.color = this.txCl;

        document.getElementById(this.chTt).style.color = this.txCl;

        this.bc.childNodes.forEach(l => {
            l.style.color = this.txCl;
            l.style.borderColor = this.vrLC;
        });

        this.refreshView(true);
    }

    refreshView(recalculate, forceAnim) {
        if (recalculate || forceAnim) {
            this.calculateDataAndBoundaries(forceAnim);
        }
        this.cx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawBigChart();
        this.cx.clearRect(0, 0, this.smCB.r, this.smCB.t);
        this.drawSmallChart();
    }

    calculateDataAndBoundaries(yForceAnim) {
        const frameBorderRate = new Pa(
            this.frB.l / this.smallChartWidth,
            this.frB.r / this.smallChartWidth
        );
        const dataSection = this.xD[this.xD.length - 1] - this.xD[0];
        this.axBI.x.l = dataSection * frameBorderRate.l + this.xD[0];
        this.axBI.x.r = dataSection * frameBorderRate.r + this.xD[0];
        let left = 0;
        let right = 0;
        this.xD.forEach((xData, index) => {
            if (xData < this.axBI.x.l) {
                left = index + 1;
            } else if (xData <= this.axBI.x.r) {
                right = index;
            }
        });
        const first = this.xPredStep === 0;
        while (Math.ceil((right - left + 1) / this.axBI.x.s) > 9) {
            this.xPredStep = this.axBI.x.s;
            this.axBI.x.s *= 2;
            !first && this.checkAndRunXAnimation();
        }
        while (Math.ceil((right - left + 1) / this.axBI.x.s) < 5) {
            this.xPredStep = this.axBI.x.s;
            this.axBI.x.s /= 2;
            !first && this.checkAndRunXAnimation();
        }
        left = Math.max(left - 1, 0);
        right = Math.min(right + 1, this.xD.length - 1) + 1;
        this.limD.x = this.xD.slice(left, right);
        this.limD.y = this.yAD.map(yData => yData.slice(left, right));
        this.crSc.x = U.getScale(this.axBI.x, this.bigChartBoundaries.getPair(true));
        const yBorderPair = U.getYBorderPair(this.limD.y, this.yIds, this.yIdsKeys);
        let yNIn = U.getInterval(yBorderPair, this.lbN.y);
        if (yBorderPair.r < yBorderPair.l) yNIn = new In(10, 10, 1);
        if (!yForceAnim && yNIn.isEqual(this.yNIn)) return;
        if (this.cAn.y !== null) {
            clearTimeout(this.cAn.y);
            this.yPrINT = this.yNIn;
        }
        this.yNIn = yNIn;
        this.runYAnimation(0, this);
    }

    runYAnimation(rate, scope) {
        rate += 0.1;
        if (rate <= 1) {
            scope.yCalculateMiddleIntervalAndRefrash(rate);
            scope.cAn.y = setTimeout(scope.runYAnimation, 15, rate, scope);
        } else {
            scope.yCalculateMiddleIntervalAndRefrash(1);
            clearTimeout(scope.cAn.y);
            scope.cAn.y = null;
        }
    }

    yCalculateMiddleIntervalAndRefrash(rate) {
        this.yIdsKeys.forEach(yId => {
            if (this.yIds[yId].inUse && this.yIds[yId].alpha < 1) this.yIds[yId].alpha = rate;
            if (!this.yIds[yId].inUse && this.yIds[yId].alpha > 0) this.yIds[yId].alpha = 1 - rate;
        });
        if (rate === 1) {
            this.yPrINT = this.yNIn;
            this.axBI.y = this.yNIn;
        } else {
            this.axBI.y = U.getMiddleInterval(this.yPrINT, this.yNIn, rate);
        }
        this.anFc.y = rate;
        this.crSc.y = U.getScale(this.axBI.y, this.bigChartBoundaries.getPair(false));
        this.refreshView(false);
    }

    checkAndRunXAnimation() {
        if (this.cAn.x !== null) clearTimeout(this.cAn.x);
        this.runXAnimation(0);
    }

    runXAnimation(rate) {
        rate += 0.1;
        this.anFc.x = Math.min(rate, 1);
        if (rate <= 1) {
            if (this.cAn.y === null) this.refreshView(false);
            this.cAn.x = setTimeout(this.runXAnimation.bind(this), 15, rate);
        } else {
            this.anFc.x = 1;
            this.xPredStep = this.axBI.x.s;
            clearTimeout(this.cAn.x);
            this.cAn.x = null;
            if (this.cAn.y === null) this.refreshView(false);
        }
    }

    drawBigChart() {
        if (this.yNIn.l === this.yNIn.r) {
            this.drawNoDataText();
            return;
        }
        if (this.anFc.y !== 1) {
            this.drawHorizontalLines(this.yPrINT, 1 - this.anFc.y);
        }
        this.drawHorizontalLines(this.yNIn, this.anFc.y);
        const scaledXData = this.limD.x.map(d =>
            (d - this.axBI.x.l) * this.crSc.x + this.bigChartBoundaries.l);
        const vLineIndex = this.drawVerticalLine(scaledXData);
        this.limD.y.forEach((yData, index) => {
            U.drawChartLine(
                this.cx,
                scaledXData,
                yData.map(d => (d - this.axBI.y.l) * this.crSc.y + this.bigChartBoundaries.b),
                this.bkCl,
                this.yIds[this.yIdsKeys[index]].color,
                3,
                this.yIds[this.yIdsKeys[index]].alpha,
                vLineIndex
            );
        });
        if (this.anFc.y !== 1) {
            this.drawYScaleLabelsText(this.yPrINT, 1 - this.anFc.y);
        }
        this.drawYScaleLabelsText(this.yNIn, this.anFc.y);
        this.drawXScaleLabelsText();
    }

    drawNoDataText() {
        const height = this.canvas.height;
        this.cx.transform(1, 0, 0, -1, 0, height);
        this.cx.globalAlpha = this.anFc.y;
        this.cx.fillStyle = this.lbTCl;
        this.cx.font = this.lTF2;
        this.cx.fillText('No data available', this.canvas.width / 2 - this.canvas.width / 10, this.canvas.height / 2);
        this.cx.transform(1, 0, 0, -1, 0, height);
        this.cx.fill();
        this.cx.stroke();
        this.cx.globalAlpha = 1;
    }

    drawHorizontalLines(interval, rate) {
        this.cx.beginPath();
        this.cx.strokeStyle = this.hrLC;
        this.cx.globalAlpha = rate;
        this.cx.lineWidth = 1;
        let currentY = 0;
        while (currentY <= interval.r - interval.l && interval.s > 0) {
            const yCoordinate = currentY * this.crSc.y + this.bigChartBoundaries.b;
            this.cx.moveTo(this.bigChartBoundaries.l, yCoordinate);
            this.cx.lineTo(this.bigChartBoundaries.r, yCoordinate);
            currentY += interval.s;
        }
        this.cx.stroke();
        this.cx.globalAlpha = 1;
    }

    drawVerticalLine(scaledXData) {
        if (!this.chFrAll && U.isPointInFrame(this.prMP, this.bigChartBoundaries)) {
            let i = 0;
            while ((Math.abs(scaledXData[i + 1] - this.prMP.x) < Math.abs(scaledXData[i] - this.prMP.x)
                || this.bigChartBoundaries.l > scaledXData[i] && this.bigChartBoundaries.r >= scaledXData[i])) {
                i++;
            }
            this.cx.beginPath();
            this.cx.strokeStyle = this.vrLC;
            this.cx.lineWidth = 1;
            this.cx.moveTo(scaledXData[i], this.bigChartBoundaries.t);
            this.cx.lineTo(scaledXData[i], this.bigChartBoundaries.b);
            this.cx.stroke();
            const f = (scaledXData[i] - this.bigChartBoundaries.l) / (this.bigChartBoundaries.r - this.bigChartBoundaries.l);
            const newPromptLeft = Math.round(this.canvas.offsetLeft + scaledXData[i] - this.prompt.offsetWidth * f) + 'px';
            if (newPromptLeft !== this.prompt.style.left || this.prompt.style.opacity <= 0) {
                clearTimeout(this.prAn);
                this.setPrompt(i);
                this.rPrAn(0, 0.06);
            }
            this.prompt.style.left = newPromptLeft;
            this.prompt.style.top = (this.canvas.offsetTop + this.canvas.height / 20) + 'px';
            return i;
        }
        if (this.prompt.style.opacity > 0) {
            clearTimeout(this.prAn);
            this.prompt.style.opacity = '0';
        }

        return null;
    }

    setPrompt(i) {
        this.pDate.innerText = U.formatDate(new Date(this.limD.x[i]), 1);
        while (this.pBody.firstChild) {
            this.pBody.removeChild(this.pBody.firstChild);
        }
        this.yIdsKeys.forEach((key, ind) => {
            if (this.yIds[key].inUse) {
                const info = document.createElement('div');
                info.style.color = this.yIds[key].color;
                info.innerText = this.yIds[key].name + ':  ' + this.limD.y[ind][i];
                this.pBody.appendChild(info);
            }
        });
    }

    rPrAn(rate, dir) {
        rate += dir;
        this.prompt.style.opacity = rate + '';
        if (rate > 0 && rate < 1) {
            this.prAn = setTimeout(this.rPrAn.bind(this), 30, rate, dir);
        }
    }

    drawYScaleLabelsText(interval, rate) {
        const height = this.canvas.height;
        this.cx.transform(1, 0, 0, -1, 0, height);
        this.cx.fillStyle = this.axTC;
        this.cx.lineWidth = 0.2;
        this.cx.globalAlpha = rate;
        this.cx.strokeStyle = this.axTC;
        this.cx.font = this.lTF1;
        let currentY = 0;
        while (currentY <= interval.r - interval.l && interval.s > 0) {
            const yCoordinate = currentY * this.crSc.y + this.bigChartBoundaries.b;
            this.cx.fillText('' + (interval.l + currentY),
                this.bigChartBoundaries.l, height - yCoordinate - 0.015 * height);
            this.cx.strokeText('' + (interval.l + currentY),
                this.bigChartBoundaries.l, height - yCoordinate - 0.015 * height);
            currentY += interval.s;
        }
        this.cx.stroke();
        this.cx.globalAlpha = 1;
        this.cx.transform(1, 0, 0, -1, 0, height);
    }

    drawXScaleLabelsText() {
        const height = this.canvas.height;
        this.cx.transform(1, 0, 0, -1, 0, height);
        this.cx.fillStyle = this.axTC;
        this.cx.strokeStyle = this.axTC;
        this.cx.lineWidth = 0.2;
        let factor = this.xPredStep < this.axBI.x.s ? 1 - this.anFc.x : this.anFc.x;
        const step = Math.min(this.xPredStep, this.axBI.x.s);
        for (let i = 0; i <= this.xD.length; i += step) {
            this.cx.globalAlpha = (i / step) % 2 === 0 ? 1 : factor;
            const xValue = this.xD[i];
            const coord = (xValue - this.axBI.x.l) * this.crSc.x + this.bigChartBoundaries.l;
            this.cx.strokeText(
                '' + U.formatDate(new Date(xValue)), coord,
                height - this.bigChartBoundaries.b + 20
            );
            this.cx.fillText(
                '' + U.formatDate(new Date(xValue)), coord,
                height - this.bigChartBoundaries.b + 20
            );
        }
        this.cx.stroke();
        this.cx.globalAlpha = 1;
        this.cx.transform(1, 0, 0, -1, 0, height);
    }

    drawSmallChart() {
        const bottomIndent = this.smCB.b + 5;
        const yBorderPair = U.getYBorderPair(this.yAD, this.yIds, this.yIdsKeys);
        let yScale = U.getScale(yBorderPair, new Pa(bottomIndent, this.smCB.t - 5));
        if (this.yCurScale !== yScale || this.yPredScale === 0) this.yPredScale = this.yCurScale;
        this.yCurScale = yScale;
        const scaleX = U.getScale(new Pa(this.xD[0], this.xD[this.xD.length - 1]), this.smCB);
        const scaledXData = this.xD.map(d => (d - this.xD[0]) * scaleX + this.smCB.l);

        if (this.yNIn.l !== this.yNIn.r) {
            this.yAD.forEach((yData, index) => {
                let sc = yScale;
                if (!this.yIds[this.yIdsKeys[index]].inUse && this.yIds[this.yIdsKeys[index]].alpha < 1)
                    sc = this.yPredScale;
                U.drawChartLine(
                    this.cx,
                    scaledXData,
                    yData.map(d => (d - yBorderPair.l) * sc + bottomIndent),
                    this.bkCl,
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
        const xWidth = this.fBdWd.x;
        const yWidth = this.fBdWd.y;
        this.cx.strokeStyle = this.frCl;
        this.cx.globalAlpha = 0.6;
        this.cx.beginPath();
        this.cx.lineCap = 'butt';
        this.cx.lineWidth = yWidth;
        this.cx.moveTo(this.frB.l, this.frB.t - yWidth / 2);
        this.cx.lineTo(this.frB.r, this.frB.t - yWidth / 2);
        this.cx.moveTo(this.frB.r, this.frB.b + yWidth / 2);
        this.cx.lineTo(this.frB.l, this.frB.b + yWidth / 2);
        this.cx.stroke();
        this.cx.beginPath();
        this.cx.lineWidth = xWidth;
        this.cx.moveTo(this.frB.l + xWidth / 2, this.frB.b + yWidth);
        this.cx.lineTo(this.frB.l + xWidth / 2, this.frB.t - yWidth);
        this.cx.moveTo(this.frB.r - xWidth / 2, this.frB.t - yWidth);
        this.cx.lineTo(this.frB.r - xWidth / 2, this.frB.b + yWidth);
        this.cx.stroke();
        this.cx.fillStyle = this.oFrCl;
        this.cx.fillRect(
            this.smCB.l,
            this.smCB.b,
            this.frB.l - this.smCB.l,
            this.frB.t - this.smCB.b);
        this.cx.fillRect(
            this.frB.r,
            this.frB.b,
            this.smCB.r - this.frB.r,
            this.frB.t - this.smCB.b
        );
        this.cx.globalAlpha = 1;
    }

    clickOnButton(l, yId) {
        this.yIds[yId].inUse = !this.yIds[yId].inUse;
        l.childNodes[0].style.backgroundColor = this.yIds[yId].inUse ? this.yIds[yId].color : this.bkCl;
        this.refreshView(true, true);
    }

    onMouseUp(event) {
        this.chFrAll = false;
    }

    onMouseDown(event) {
        const cRect = event.target.getBoundingClientRect();
        const cMP = new Po(event.clientX - cRect.left, cRect.bottom - event.clientY);
        if (!U.isPointInFrame(cMP, this.smCB)) {
            this.chFrAll = false;
            return;
        }
        this.chFrAll = true;
        this.prMP = cMP;
        if (cMP.x < this.frB.l + this.fBdWd.x) {
            this.frDT = 'left';
        } else if (cMP.x > this.frB.r - this.fBdWd.x) {
            this.frDT = 'right';
        } else {
            this.frDT = 'center';
        }
    }

    onMouseMove(event) {
        const cRect = event.target.getBoundingClientRect();
        const cMP = new Po(event.clientX - cRect.left, cRect.bottom - event.clientY);
        if (cMP.x === this.prMP.x) return;
        if (U.isPointInFrame(cMP, this.smCB)) {
            this.canvas.style.cursor = 'col-resize';
        } else {
            this.canvas.style.cursor = 'default';
        }
        if (this.chFrAll) {
            const xOffset = cMP.x - this.prMP.x;
            if (this.frDT === 'left') {
                const newLeft = Math.min(
                    this.frB.l + xOffset,
                    this.frB.r - this.fBdWd.x * 2 - this.mFrWd
                );
                this.frB.l = Math.max(this.smCB.l, newLeft);
            } else if (this.frDT === 'right') {
                const newRight = Math.max(
                    this.frB.r + xOffset,
                    this.frB.l + this.fBdWd.x * 2 + this.mFrWd
                );
                this.frB.r = Math.min(this.smCB.r, newRight);
            } else if (this.frDT === 'center') {
                if (this.frB.l + xOffset >= this.smCB.l
                    && this.frB.r + xOffset <= this.smCB.r) {
                    this.frB.l += xOffset;
                    this.frB.r += xOffset;
                }
            }
        }
        this.prMP = cMP;
        this.refreshView(true);
    }

    onMouseLeave(event) {
        const cRect = event.target.getBoundingClientRect();
        this.prMP = new Po(event.clientX - cRect.left, cRect.bottom - event.clientY);
        this.chFrAll = false;
        this.refreshView(true);
    }

    addMob() {
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
