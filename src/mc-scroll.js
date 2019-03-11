class McScroll {
    constructor(mainId, option) {
        this.cfg = {
            pullDown: {
                enabled: false,
                height: 36,
                html: {
                    enabled: true,
                    before: 'pull to refresh',
                    active: 'release to refresh',
                    after: 'refreshing...'
                },
                handler: null
            },
            pullUp: {
                enabled: false,
                height: 36,
                html: {
                    enabled: true,
                    before: 'pull to load',
                    active: 'release to load',
                    after: 'loading...'
                },
                handler: null
            },
            onScroll: null,
            onScrollEnd: null,
            onInit: null
        }

        this.elWrap = null;
        this.elContainer = null;
        this.pullDown = null;
        this.pullUp = null;

        this.startPosY = 0;
        this.currentPosY = 0;
        this.maxTop = 0;
        this.pullStatus = 0;
        this.player = null;
        this.inertiaTarget = null;
        this.iframe = null;
        this.moveInfo = {
            hasDrag: false,
            hasMove: false,
            startY: 0,
            preLastTime: 0,
            preLastPosition: 0,
            lastTime: 0,
            lastPosition: 0,
            overflowHalf: null
        };
        this.scrollBar = {
            track: null,
            main: null,
            ratio: 0
        };

        this.init(mainId, option);
    }

    __extend(target, source) {
        for (var i in source) {
            if (typeof source[i] === 'object' && Object.prototype.toString.call(source[i]).toLowerCase() == '[object object]') {
                this.__extend(target[i], source[i]);
            } else {
                target[i] = source[i];
            }
        }

        return target;
    }

    init(mainId, option) {
        this.elContainer = document.getElementById(mainId);

        if (this.elContainer) {
            const CFG = this.cfg;

            if (option) {
                this.__extend(CFG, option);
            }

            this.elWrap = this.elContainer.parentNode;
            this.__getMaxTop();
            this.__setScrollBarDOM();
            this.__bindEvent();

            if (CFG.pullDown.enabled && CFG.pullDown.height > 0) {
                this.__setPullDOM('pullDown');
            }

            if (CFG.pullUp.enabled && CFG.pullUp.height > 0) {
                this.__setPullDOM('pullUp');
            }

            typeof CFG.onInit === 'function' && CFG.onInit(this);

            return this;
        }
    }

    pullSuccess() {
        if (this.pullStatus === 0) return;

        this.pullStatus = 0;
        if (this.currentPosY >= 0) {
            this.scrollTo(0);
            this.__pullHTML('pullDown', 'before');
        } else {
            const oldMaxTop = this.maxTop;
            setTimeout(() => {
                if (oldMaxTop <= this.maxTop) {
                    this.scrollTo(this.maxTop);
                }
                this.__pullHTML('pullUp', 'before');
            }, 100)
        }
    }

    pullOff(type, html='') {
        const CFG = this.cfg;

        if (this.__checkPullType(type) && CFG[type].enabled) {
            CFG[type].enabled = false;
            this[type].innerHTML = html;
        }

        return this;
    }

    pullOn(type) {
        const CFG = this.cfg;

        if (this.__checkPullType(type) && !CFG[type].enabled) {
            CFG[type].enabled = true;
            this[type] ? this.__pullHTML(type, 'before') : this.__setPullDOM(type);
        }

        return this;
    }

    pullHTML(type, html='') {
        if (this.__checkPullType(type) && this.cfg[type].enabled) {
            this[type].innerHTML = html;
        }
    }

    scrollTo(posY, animate=true) {
        if (typeof posY == 'number') {
            this.currentPosY = posY;
        }

        if (animate) {
            this.elContainer.style.transition = '300ms';
            this.scrollBar.main.style.transition = '300ms';
        }
        this.elContainer.style.transform = `translateZ(0px) translateY(${this.currentPosY}px)`;
        this.scrollBar.main.style.transform = `translateZ(0px) translateY(${this.currentPosY / -this.scrollBar.ratio}px)`;

        typeof this.cfg.onScroll === 'function' && this.cfg.onScroll(this.currentPosY, this);

        if ((this.inertiaTarget === null || this.inertiaTarget === this.currentPosY) && !this.moveInfo.hasDrag) {
            this.__scrollEnd();
        }

        return this;
    }

    triggerHandler(type) {
        const CFG = this.cfg;

        if (this.__checkPullType(type)) {
            if (type === 'pullDown' && this.currentPosY <= 0) {
                this.scrollTo(CFG.pullDown.height, false);
            }
            this.pullStatus = 1;
            this.__pullHTML(type, 'after');
            typeof CFG[type].handler === 'function' && CFG[type].handler(this.pullSuccess.bind(this), this);
        }

        return this;
    }

    __pullHTML(type, status) {
        const CFG = this.cfg;

        if (CFG[type].enabled && CFG[type].html.enabled) {
            this[type].innerHTML = CFG[type].html[status];
        }
    }

    __scrollEnd() {
        this.scrollBar.main.className = 'McScroll-bar-main';
        typeof this.cfg.onScrollEnd === 'function' && this.cfg.onScrollEnd(this.currentPosY, this);
    }

    __changePullStatus(type, status) {
        if (this.__checkPullType(type)) {
            if (!isNaN(status) && this.pullStatus !== status) {
                this.pullStatus = status;
                this.__pullHTML(type, status ? 'active' : 'before');
            }
        }
    }

    __getMaxTop() {
        const iframeResize = () => {
            this.maxTop = this.elWrap.offsetHeight - this.elContainer.offsetHeight;
            if (this.maxTop > 0) { this.maxTop = 0; }
        }

        this.iframe = document.createElement('IFRAME');
        this.iframe.setAttribute('style', 'position:absolute; top:0; left:0; z-index:-99; width:100%; height:100%; border:none; pointer-events:none; visibility:hidden;');
        this.elContainer.appendChild(this.iframe);
        this.iframe.contentWindow.onresize = () => {
            iframeResize()
            this.__setScrollBarStyle();
        }

        iframeResize();
    }

    __setScrollBarDOM() {
        this.scrollBar.track = document.createElement('DIV');
        this.scrollBar.track.className = 'McScroll-bar-track';
        this.scrollBar.main = document.createElement('DIV');
        this.scrollBar.main.className = 'McScroll-bar-main';
        this.scrollBar.track.appendChild(this.scrollBar.main);
        this.elWrap.appendChild(this.scrollBar.track);

        this.__setScrollBarStyle();
    }

    __setScrollBarStyle() {
        const wrapHeight = this.elWrap.offsetHeight,
              trackHeight = this.scrollBar.track.offsetHeight,
              heightRatio = this.elContainer.offsetHeight / wrapHeight;

        this.scrollBar.ratio = wrapHeight / trackHeight * heightRatio;
        this.scrollBar.main.style.height = Math.round(trackHeight / heightRatio) + 'px';
        this.scrollBar.main.style.transform = `translateZ(0px) translateY(${this.currentPosY / -this.scrollBar.ratio}px)`;
    }

    __setPullDOM(type) {
        this[type] = document.createElement('DIV');
        this[type].className = 'McScroll-pull McScroll-' + type;
        this.__pullHTML(type, 'before');
        this.elContainer.appendChild(this[type]);
    }

    __checkPullType(type) {
        return (type === 'pullDown' || type === 'pullUp');
    }

    __inertia() {
        if (this.inertiaTarget !== this.currentPosY) {
            const step = (this.inertiaTarget - this.currentPosY) / 10;
            this.currentPosY = parseInt(this.currentPosY + (step > 0 ? Math.ceil(step) : Math.floor(step)));

            if (this.moveInfo.overflowHalf !== null) {
                if (this.moveInfo.overflowHalf > 0 && this.currentPosY > this.moveInfo.overflowHalf) {
                    this.moveInfo.overflowHalf = null;
                    this.inertiaTarget = 0;
                } else if (this.moveInfo.overflowHalf < 0 && this.currentPosY < this.moveInfo.overflowHalf) {
                    this.moveInfo.overflowHalf = null;
                    this.inertiaTarget = this.maxTop;
                }
            }

            this.scrollTo(null, false);
            this.player = requestAnimationFrame(this.__inertia.bind(this));
        } else {
            cancelAnimationFrame(this.player);
            this.inertiaTarget = null;
        }
    }

    __eventTouchStart(event) {
        if (event.touches.length === 1 && this.pullStatus === 0) {
            cancelAnimationFrame(this.player);
            this.startPosY = this.currentPosY;
            this.moveInfo.hasDrag = true;
            this.moveInfo.startY = event.touches[0].pageY;
            this.moveInfo.lastTime = 0;
            this.moveInfo.lastPosition = null;

            this.elContainer.style.transition = '0ms';
            this.scrollBar.main.style.transition = '0ms';
            this.scrollBar.main.className = 'McScroll-bar-main active';
        }
    }

    __eventTouchMove(event) {
        if (!this.moveInfo.hasDrag) return;

        event.preventDefault();
        this.moveInfo.hasMove = true;

        //更新最后拖动信息
        const now = Date.now();
        if (this.moveInfo.lastPosition === null || now - this.moveInfo.lastTime > 50) {
            this.moveInfo.preLastTime = this.moveInfo.lastTime;
            this.moveInfo.preLastPosition = this.moveInfo.lastPosition;
            this.moveInfo.lastTime = now;
            this.moveInfo.lastPosition = event.changedTouches[0].pageY;
        }

        this.currentPosY = this.startPosY - (this.moveInfo.startY - event.changedTouches[0].pageY);

        // 上拉 || 下拉 拖动到边缘触发相关事件
        const CFG = this.cfg;
        if (this.currentPosY > 0) {
            this.currentPosY /= 4;
            if (CFG.pullDown.enabled && CFG.pullDown.height > 0) {
                this.__changePullStatus('pullDown', this.currentPosY >= CFG.pullDown.height ? 1 : 0)
            }
        } else if (this.currentPosY < this.maxTop) {
            this.currentPosY = this.maxTop + ((this.currentPosY - this.maxTop) / 4);
            if (CFG.pullUp.enabled && CFG.pullUp.height > 0) {
                this.__changePullStatus('pullUp', Math.abs(this.currentPosY - this.maxTop) >= CFG.pullUp.height ? 1 : 0)
            }
        }                

        this.scrollTo(null, false);
    }

    __eventTouchEnd(event) {
        if (!this.moveInfo.hasDrag) return;

        this.moveInfo.hasDrag = false;

        if (this.currentPosY > 0) { //下拉溢出

            if (this.pullStatus === 1) {
                this.currentPosY = this.cfg.pullDown.height;
                this.__pullHTML('pullDown', 'after');
                this.triggerHandler('pullDown');
            } else {
                this.currentPosY = 0;
            }
            this.scrollTo();

        } else if (this.currentPosY < this.maxTop) { //上拉溢出

            if (this.pullStatus === 1) {
                this.currentPosY = this.maxTop - this.cfg.pullUp.height;
                this.__pullHTML('pullUp', 'after');
                this.triggerHandler('pullUp');
            } else {
                this.currentPosY = this.maxTop;
            }
            this.scrollTo();

        } else { //惯性滑动
            if (this.moveInfo.hasMove) { //是否有拖动

                //防止更新最后拖动信息时刚好touchend
                let lastTime, lastPosition;
                if (event.changedTouches[0].pageY == this.moveInfo.lastPosition) {
                    lastTime = this.moveInfo.preLastTime;
                    lastPosition = this.moveInfo.preLastPosition;
                } else {
                    lastTime = this.moveInfo.lastTime;
                    lastPosition = this.moveInfo.lastPosition;
                }

                //求拖动每秒平均速度
                const velocity = (event.changedTouches[0].pageY - lastPosition) / (Date.now() - lastTime) * 100;

                if (Math.abs(velocity) > 30) {
                    //惯性滑动目标点
                    this.inertiaTarget = velocity * 4 + this.currentPosY;

                    //惯性滑动溢出情况
                    if (this.inertiaTarget > 0) {
                        this.inertiaTarget /= 4;
                        this.moveInfo.overflowHalf = (this.inertiaTarget / 2);
                    } else if (this.inertiaTarget < this.maxTop) {
                        this.inertiaTarget = this.maxTop + (this.inertiaTarget - this.maxTop) / 4;
                        this.moveInfo.overflowHalf = this.maxTop + (this.inertiaTarget - this.maxTop) / 2;
                    } else {
                        this.moveInfo.overflowHalf = null;
                    }

                    this.inertiaTarget = parseInt(this.inertiaTarget);

                    this.player = requestAnimationFrame(this.__inertia.bind(this));
                } else {
                    this.__scrollEnd();
                }
            }
        }

        this.moveInfo.hasMove = false;
    }

    __bindEvent() {
        this.elWrap.addEventListener('touchstart', this.__eventTouchStart.bind(this), {capture: false})

        document.addEventListener('touchmove', this.__eventTouchMove.bind(this), {passive: false})

        document.addEventListener('touchend', this.__eventTouchEnd.bind(this), {capture: false})
    }

}