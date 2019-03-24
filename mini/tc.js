class Po{constructor(t,i){this.x=t,this.y=i}}class Pa{constructor(t,i){this.l=t,this.r=i}}class In{constructor(t,i,s){this.l=t,this.r=i,this.s=s}isEqual(t){return this.l===t.l&&this.r===t.r&&this.s===t.s}}class Bo{constructor(t,i,s,h){this.t=t,this.r=i,this.b=s,this.l=h}getPair(t){return t?new Pa(this.l,this.r):new Pa(this.b,this.t)}}class U{static getMiddleInterval(t,i,s){return new In(t.l+(i.l-t.l)*s,t.r+(i.r-t.r)*s,t.s+(i.s-t.s)*s)}static getYBorderPair(t,i,s){const h=new Pa(Number.MAX_VALUE,Number.MIN_VALUE);return t.forEach((t,e)=>{i[s[e]].inUse&&(h.l=Math.min(Math.min(...t),h.l),h.r=Math.max(Math.max(...t),h.r))}),h}static drawChartLine(t,i,s,h,e,n,a,r){0!==a&&(t.lineWidth=n,t.lineCap="round",t.strokeStyle=e,t.beginPath(),t.globalAlpha=a,i.forEach((i,h)=>{s.length>h&&t.lineTo(i,s[h])}),t.stroke(),null!==r&&(t.beginPath(),t.fillStyle=h,t.arc(i[r],s[r],5,0,2*Math.PI),t.fill(),t.arc(i[r],s[r],5,0,2*Math.PI),t.fill(),t.stroke()),t.globalAlpha=1)}static formatDate(t,i){const s=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],h=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],e=t.getDate();let n=s[t.getMonth()]+" "+e;if(1===i){const i=t.getDay();n=h[i]+", "+n}return n}static getScale(t,i){return Math.abs(i.r-i.l)/Math.abs(t.r-t.l)}static isPointInFrame(t,i){return!(t.x<i.l||t.x>i.r||t.y<i.b||t.y>i.t)}static getInterval(t,i){const s=(t.r-t.l)/(i-1),h=[1,1.5,2,2.5,5,7.5,10],e=Math.pow(10,-Math.floor(Math.log10(Math.abs(s)))),n=s*e,a=h.find(t=>t>=n),r=Number.parseInt((a/e).toFixed()),o=Math.ceil(t.r/r)*r,c=Math.floor(t.l/r)*r;return new In(c,o,r)}}class TC{constructor(t,i,s){this.init(t,i,s)}init(t,i,s){this.cx=null,this.canvas=null,this.width=Math.max(2*window.innerWidth/3,300),this.height=Math.max(3*window.innerHeight/5,200),this.xD=[],this.yAD=[],this.limD=new Po([],[]),this.yIds={},this.yIdsKeys=[],this.lbN=new Po(7,7),this.yPrINT=new In(0,0,1),this.yNIn=new In(0,0,1),this.axBI=new Po(new In(0,0,1),new In(0,0,1)),this.crSc=new Po(1,1),this.anFc=new Po(1,1),this.cAn=new Po(null,null),this.prAn=null,this.xPredStep=0,this.yCurScale=0,this.yPredScale=0,this.frDT="",this.chFrAll=!1,this.mFrWd=this.width/100,this.prMP=new Po(0,0),this.cMar=new Bo(30,0,0,0),this.fBdWd=new Po(this.width/100,this.height/250),this.chTt=i,this.prepareData(t),this.initCanvas(),this.setMode(s)}prepareData(t){t.columns.forEach(i=>{const s=i.slice(0,1);const h=i.slice(1);"x"===t.types[s]?this.xD=h:"line"===t.types[s]&&(this.yIdsKeys.push(s),this.yIds[s]={inUse:!0,alpha:0,name:t.names[s],color:t.colors[s]},this.yAD.push(h))})}initCanvas(){this.addBoard(),this.canvas.onmouseup=this.onMouseUp.bind(this),this.canvas.onmousedown=this.onMouseDown.bind(this),this.canvas.onmousemove=this.onMouseMove.bind(this),this.canvas.onmouseleave=this.onMouseLeave.bind(this),this.addMob(),this.canvas.width=this.width,this.canvas.height=this.height,this.cx=this.canvas.getContext("2d"),this.cx.transform(1,0,0,-1,0,this.canvas.height);const t=.15*this.canvas.height;this.bigChartBoundaries=new Bo(this.canvas.height-this.cMar.t,this.canvas.width-this.cMar.r,this.cMar.b+t+30,this.cMar.l),this.smCB=new Bo(t+this.cMar.b,this.canvas.width-this.cMar.r,this.cMar.b,this.cMar.l),this.smallChartWidth=this.smCB.r-this.smCB.l,this.frB=new Bo(this.smCB.t,this.smCB.l+.2*this.canvas.width,this.smCB.b,this.smCB.l)}addBoard(){this.prompt=document.getElementById("pr"),this.pDate=document.getElementById("date"),this.pBody=document.getElementById("body");const t=document.getElementById("cc"),i=document.createElement("div");this.canvas=document.createElement("canvas"),this.bc=document.createElement("div"),this.bc.className="bp",i.style.width=this.width+"px",this.yIdsKeys.forEach(t=>{const i=document.createElement("label");const s=document.createElement("input");s.type="checkbox";s.style.backgroundColor=this.yIds[t].color;s.style.borderColor=this.yIds[t].color;s.setAttribute("checked","true");i.appendChild(s);i.innerHTML+=this.yIds[t].name;this.bc.appendChild(i);i.onchange=this.clickOnButton.bind(this,i,t);i.onselectstart=(()=>!1)});const s=document.createElement("h3");s.id=this.chTt,s.innerHTML=this.chTt,s.onselectstart=(()=>!1),s.style.textAlign="left",i.appendChild(s),i.appendChild(this.canvas),i.appendChild(this.bc),t.appendChild(i)}setMode(t){this.lTF1="lighter 9pt Helvetica",this.lTF2="lighter 18pt Helvetica",this.lbTCl="#96A2AA",this.frCl=t?"#DDEAF3":"#40566B",this.oFrCl=t?"#F5F9FB":"#1F2A38",this.bkCl=t?"#FFFFFF":"#242F3E",this.txCl=t?"#000000":"#FFFFFF",this.axTC=t?"#96A2AA":"#546778",this.hrLC=t?"#ECF0F3":"#313D4D",this.vrLC=t?"#DFE6EB":"#3B4A5A",document.body.style.backgroundColor=this.bkCl,this.prompt.style.background=t?"#FFFFFF":"#253241",this.prompt.style.borderColor=t?"#DFE6EB":"#202a37",this.prompt.style.boxShadow=t?"2px 2px 1px #DFE6EB":"2px 2px 1px #202a37",this.pDate.style.color=this.txCl,document.getElementById(this.chTt).style.color=this.txCl,this.bc.childNodes.forEach(t=>{t.style.color=this.txCl;t.style.borderColor=this.vrLC}),this.refreshView(!0)}refreshView(t,i){(t||i)&&this.calculateDataAndBoundaries(i),this.cx.clearRect(0,0,this.canvas.width,this.canvas.height),this.drawBigChart(),this.cx.clearRect(0,0,this.smCB.r,this.smCB.t),this.drawSmallChart()}calculateDataAndBoundaries(t){const i=new Pa(this.frB.l/this.smallChartWidth,this.frB.r/this.smallChartWidth),s=this.xD[this.xD.length-1]-this.xD[0];this.axBI.x.l=s*i.l+this.xD[0],this.axBI.x.r=s*i.r+this.xD[0];let h=0,e=0;this.xD.forEach((t,i)=>{t<this.axBI.x.l?h=i+1:t>this.axBI.x.r||(e=i)});const n=0===this.xPredStep;for(;Math.ceil((e-h+1)/this.axBI.x.s)>9;)this.xPredStep=this.axBI.x.s,this.axBI.x.s*=2,!n&&this.checkAndRunXAnimation();for(;5>Math.ceil((e-h+1)/this.axBI.x.s);)this.xPredStep=this.axBI.x.s,this.axBI.x.s/=2,!n&&this.checkAndRunXAnimation();h=Math.max(h-1,0),e=Math.min(e+1,this.xD.length-1)+1,this.limD.x=this.xD.slice(h,e),this.limD.y=this.yAD.map(t=>t.slice(h,e)),this.crSc.x=U.getScale(this.axBI.x,this.bigChartBoundaries.getPair(!0));const a=U.getYBorderPair(this.limD.y,this.yIds,this.yIdsKeys);let r=U.getInterval(a,this.lbN.y);a.r<a.l&&(r=new In(10,10,1)),!t&&r.isEqual(this.yNIn)||(null!==this.cAn.y&&(clearTimeout(this.cAn.y),this.yPrINT=this.yNIn),this.yNIn=r,this.runYAnimation(0,this))}runYAnimation(t,i){(t+=.1)>1?(i.yCalculateMiddleIntervalAndRefrash(1),clearTimeout(i.cAn.y),i.cAn.y=null):(i.yCalculateMiddleIntervalAndRefrash(t),i.cAn.y=setTimeout(i.runYAnimation,15,t,i))}yCalculateMiddleIntervalAndRefrash(t){this.yIdsKeys.forEach(i=>{this.yIds[i].inUse&&1>this.yIds[i].alpha&&(this.yIds[i].alpha=t);!this.yIds[i].inUse&&this.yIds[i].alpha>0&&(this.yIds[i].alpha=1-t)}),1===t?(this.yPrINT=this.yNIn,this.axBI.y=this.yNIn):this.axBI.y=U.getMiddleInterval(this.yPrINT,this.yNIn,t),this.anFc.y=t,this.crSc.y=U.getScale(this.axBI.y,this.bigChartBoundaries.getPair(!1)),this.refreshView(!1)}checkAndRunXAnimation(){null!==this.cAn.x&&clearTimeout(this.cAn.x),this.runXAnimation(0)}runXAnimation(t){t+=.1,this.anFc.x=Math.min(t,1),t>1?(this.anFc.x=1,this.xPredStep=this.axBI.x.s,clearTimeout(this.cAn.x),this.cAn.x=null,null===this.cAn.y&&this.refreshView(!1)):(null===this.cAn.y&&this.refreshView(!1),this.cAn.x=setTimeout(this.runXAnimation.bind(this),15,t))}drawBigChart(){if(this.yNIn.l===this.yNIn.r)return void this.drawNoDataText();1!==this.anFc.y&&this.drawHorizontalLines(this.yPrINT,1-this.anFc.y),this.drawHorizontalLines(this.yNIn,this.anFc.y);const t=this.limD.x.map(t=>(t-this.axBI.x.l)*this.crSc.x+this.bigChartBoundaries.l),i=this.drawVerticalLine(t);this.limD.y.forEach((s,h)=>{U.drawChartLine(this.cx,t,s.map(t=>(t-this.axBI.y.l)*this.crSc.y+this.bigChartBoundaries.b),this.bkCl,this.yIds[this.yIdsKeys[h]].color,3,this.yIds[this.yIdsKeys[h]].alpha,i)}),1!==this.anFc.y&&this.drawYScaleLabelsText(this.yPrINT,1-this.anFc.y),this.drawYScaleLabelsText(this.yNIn,this.anFc.y),this.drawXScaleLabelsText()}drawNoDataText(){const t=this.canvas.height;this.cx.transform(1,0,0,-1,0,t),this.cx.globalAlpha=this.anFc.y,this.cx.fillStyle=this.lbTCl,this.cx.font=this.lTF2,this.cx.fillText("No data available",this.canvas.width/2-this.canvas.width/10,this.canvas.height/2),this.cx.transform(1,0,0,-1,0,t),this.cx.fill(),this.cx.stroke(),this.cx.globalAlpha=1}drawHorizontalLines(t,i){this.cx.beginPath(),this.cx.strokeStyle=this.hrLC,this.cx.globalAlpha=i,this.cx.lineWidth=1;let s=0;for(;s<=t.r-t.l&&t.s>0;){const i=s*this.crSc.y+this.bigChartBoundaries.b;this.cx.moveTo(this.bigChartBoundaries.l,i),this.cx.lineTo(this.bigChartBoundaries.r,i),s+=t.s}this.cx.stroke(),this.cx.globalAlpha=1}drawVerticalLine(t){if(!this.chFrAll&&U.isPointInFrame(this.prMP,this.bigChartBoundaries)){let i=0;for(;Math.abs(t[i+1]-this.prMP.x)<Math.abs(t[i]-this.prMP.x)||this.bigChartBoundaries.l>t[i]&&this.bigChartBoundaries.r>=t[i];)i++;this.cx.beginPath(),this.cx.strokeStyle=this.vrLC,this.cx.lineWidth=1,this.cx.moveTo(t[i],this.bigChartBoundaries.t),this.cx.lineTo(t[i],this.bigChartBoundaries.b),this.cx.stroke();const s=(t[i]-this.bigChartBoundaries.l)/(this.bigChartBoundaries.r-this.bigChartBoundaries.l),h=Math.round(this.canvas.offsetLeft+t[i]-this.prompt.offsetWidth*s)+"px";return h===this.prompt.style.left&&this.prompt.style.opacity>0||(clearTimeout(this.prAn),this.setPrompt(i),this.rPrAn(0,.06)),this.prompt.style.left=h,this.prompt.style.top=this.canvas.offsetTop+this.canvas.height/20+"px",i}return this.prompt.style.opacity>0&&(clearTimeout(this.prAn),this.prompt.style.opacity="0"),null}setPrompt(t){for(this.pDate.innerText=U.formatDate(new Date(this.limD.x[t]),1);this.pBody.firstChild;)this.pBody.removeChild(this.pBody.firstChild);this.yIdsKeys.forEach((i,s)=>{if(this.yIds[i].inUse){const h=document.createElement("div");h.style.color=this.yIds[i].color,h.innerText=this.yIds[i].name+":  "+this.limD.y[s][t],this.pBody.appendChild(h)}})}rPrAn(t,i){t+=i,this.prompt.style.opacity=t+"",t>0&&1>t&&(this.prAn=setTimeout(this.rPrAn.bind(this),30,t,i))}drawYScaleLabelsText(t,i){const s=this.canvas.height;this.cx.transform(1,0,0,-1,0,s),this.cx.fillStyle=this.axTC,this.cx.lineWidth=.2,this.cx.globalAlpha=i,this.cx.strokeStyle=this.axTC,this.cx.font=this.lTF1;let h=0;for(;h<=t.r-t.l&&t.s>0;){const i=h*this.crSc.y+this.bigChartBoundaries.b;this.cx.fillText(""+(t.l+h),this.bigChartBoundaries.l,s-i-.015*s),this.cx.strokeText(""+(t.l+h),this.bigChartBoundaries.l,s-i-.015*s),h+=t.s}this.cx.stroke(),this.cx.globalAlpha=1,this.cx.transform(1,0,0,-1,0,s)}drawXScaleLabelsText(){const t=this.canvas.height;this.cx.transform(1,0,0,-1,0,t),this.cx.fillStyle=this.axTC,this.cx.strokeStyle=this.axTC,this.cx.lineWidth=.2;let i=this.xPredStep<this.axBI.x.s?1-this.anFc.x:this.anFc.x;const s=Math.min(this.xPredStep,this.axBI.x.s);for(let h=0;h<=this.xD.length;h+=s){this.cx.globalAlpha=h/s%2==0?1:i;const e=this.xD[h],n=(e-this.axBI.x.l)*this.crSc.x+this.bigChartBoundaries.l;this.cx.strokeText(""+U.formatDate(new Date(e)),n,t-this.bigChartBoundaries.b+20),this.cx.fillText(""+U.formatDate(new Date(e)),n,t-this.bigChartBoundaries.b+20)}this.cx.stroke(),this.cx.globalAlpha=1,this.cx.transform(1,0,0,-1,0,t)}drawSmallChart(){const t=this.smCB.b+5,i=U.getYBorderPair(this.yAD,this.yIds,this.yIdsKeys);let s=U.getScale(i,new Pa(t,this.smCB.t-5));this.yCurScale===s&&0!==this.yPredScale||(this.yPredScale=this.yCurScale),this.yCurScale=s;const h=U.getScale(new Pa(this.xD[0],this.xD[this.xD.length-1]),this.smCB),e=this.xD.map(t=>(t-this.xD[0])*h+this.smCB.l);this.yNIn.l!==this.yNIn.r&&this.yAD.forEach((h,n)=>{let a=s;!this.yIds[this.yIdsKeys[n]].inUse&&1>this.yIds[this.yIdsKeys[n]].alpha&&(a=this.yPredScale);U.drawChartLine(this.cx,e,h.map(s=>(s-i.l)*a+t),this.bkCl,this.yIds[this.yIdsKeys[n]].color,1,this.yIds[this.yIdsKeys[n]].alpha,null)}),this.drawFrame()}drawFrame(){const t=this.fBdWd.x,i=this.fBdWd.y;this.cx.strokeStyle=this.frCl,this.cx.globalAlpha=.6,this.cx.beginPath(),this.cx.lineCap="butt",this.cx.lineWidth=i,this.cx.moveTo(this.frB.l,this.frB.t-i/2),this.cx.lineTo(this.frB.r,this.frB.t-i/2),this.cx.moveTo(this.frB.r,this.frB.b+i/2),this.cx.lineTo(this.frB.l,this.frB.b+i/2),this.cx.stroke(),this.cx.beginPath(),this.cx.lineWidth=t,this.cx.moveTo(this.frB.l+t/2,this.frB.b+i),this.cx.lineTo(this.frB.l+t/2,this.frB.t-i),this.cx.moveTo(this.frB.r-t/2,this.frB.t-i),this.cx.lineTo(this.frB.r-t/2,this.frB.b+i),this.cx.stroke(),this.cx.fillStyle=this.oFrCl,this.cx.fillRect(this.smCB.l,this.smCB.b,this.frB.l-this.smCB.l,this.frB.t-this.smCB.b),this.cx.fillRect(this.frB.r,this.frB.b,this.smCB.r-this.frB.r,this.frB.t-this.smCB.b),this.cx.globalAlpha=1}clickOnButton(t,i){this.yIds[i].inUse=!this.yIds[i].inUse,t.childNodes[0].style.backgroundColor=this.yIds[i].inUse?this.yIds[i].color:this.bkCl,this.refreshView(!0,!0)}onMouseUp(t){this.chFrAll=!1}onMouseDown(t){const i=t.target.getBoundingClientRect(),s=new Po(t.clientX-i.left,i.bottom-t.clientY);U.isPointInFrame(s,this.smCB)?(this.chFrAll=!0,this.prMP=s,s.x<this.frB.l+this.fBdWd.x?this.frDT="left":s.x>this.frB.r-this.fBdWd.x?this.frDT="right":this.frDT="center"):this.chFrAll=!1}onMouseMove(t){const i=t.target.getBoundingClientRect(),s=new Po(t.clientX-i.left,i.bottom-t.clientY);if(s.x!==this.prMP.x){if(U.isPointInFrame(s,this.smCB)?this.canvas.style.cursor="col-resize":this.canvas.style.cursor="default",this.chFrAll){const t=s.x-this.prMP.x;if("left"===this.frDT){const i=Math.min(this.frB.l+t,this.frB.r-2*this.fBdWd.x-this.mFrWd);this.frB.l=Math.max(this.smCB.l,i)}else if("right"===this.frDT){const i=Math.max(this.frB.r+t,this.frB.l+2*this.fBdWd.x+this.mFrWd);this.frB.r=Math.min(this.smCB.r,i)}else"center"===this.frDT&&(this.frB.l+t<this.smCB.l||this.frB.r+t>this.smCB.r||(this.frB.l+=t,this.frB.r+=t))}this.prMP=s,this.refreshView(!0)}}onMouseLeave(t){const i=t.target.getBoundingClientRect();this.prMP=new Po(t.clientX-i.left,i.bottom-t.clientY),this.chFrAll=!1,this.refreshView(!0)}addMob(){this.canvas.addEventListener("touchstart",function(t){const i=t.touches[0];this.canvas.dispatchEvent(new MouseEvent("mousedown",{clientX:i.clientX,clientY:i.clientY}))}.bind(this)),this.canvas.addEventListener("touchend",function(t){this.canvas.dispatchEvent(new MouseEvent("mouseup",{}))}.bind(this)),this.canvas.addEventListener("touchmove",function(t){this.canvas.dispatchEvent(new MouseEvent("mousemove",{clientX:t.touches[0].clientX,clientY:t.touches[0].clientY}))}.bind(this))}}let mode=!0,charts=[];changeMode=(()=>{mode=!mode;const t=document.getElementById("title");const i=document.getElementById("hb");const s=document.getElementById("swMode");mode?(t.style.color="#000000",s.innerText="To Night Mode",i.classList.remove("night"),i.classList.add("day")):(t.style.color="#FFFFFF",s.innerText="To Day Mode",i.classList.remove("day"),i.classList.add("night"));charts.forEach(t=>t.setMode(mode))});let jsonData=[];const xhr=new XMLHttpRequest;xhr.open("GET","/chart_data.json"),xhr.onreadystatechange=(t=>{xhr.readyState===XMLHttpRequest.DONE&&200===xhr.status&&(charts=[],(jsonData=JSON.parse(xhr.responseText)).forEach((t,i)=>charts.push(new TC(t,"Followers #"+(i+1),mode))))}),xhr.send(),resize=(t=>{const i=document.getElementById("cc");for(;i.firstChild;)i.removeChild(i.firstChild);charts=[];jsonData.forEach((t,i)=>charts.push(new TC(t,"Followers #"+(i+1),mode)))}),window.addEventListener("resize",resize);