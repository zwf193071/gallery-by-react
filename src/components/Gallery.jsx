import React from 'react';
import { Swipeable } from 'react-swipeable';
import PropTypes from 'prop-types';

export default class Gallery extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentIndex: props.startIndex,
            isPlaying: false // 是否正在自动放映
        }
        if (props.lazyLoad) {
            this._lazyLoaded = [];
        }
    }
    static propTypes = {
        autoPlay: PropTypes.bool,
        startIndex: PropTypes.number,
        slideDuration: PropTypes.number,
        slideInterval: PropTypes.number,
        renderLeftNav: PropTypes.func,
        renderRightNav: PropTypes.func,
        useTranslate3D: PropTypes.bool,
        lazyLoad: PropTypes.bool,
        infinite: PropTypes.bool,
        onPause: PropTypes.func,
        showBullets: PropTypes.bool
    }
    static defaultProps = {
        autoPlay: false,
        items: [],
        startIndex: 0,
        slideDuration: 450,
        slideInterval: 3000,
        useTranslate3D: true,
        lazyLoad: false,
        infinite: true,
        showBullets: false,
        renderLeftNav: (onClick, disabled) => {
            return (
                <button
                    type='button'
                    className="gallery-left-nav"
                    disabled={disabled}
                    onClick={onClick}
                    aria-label='Previous Slide'
                />
            )
        },
        renderRightNav: (onClick, disabled) => {
            return (
                <button
                    type='button'
                    className="gallery-right-nav"
                    disabled={disabled}
                    onClick={onClick}
                    aria-label='Next Slide'
                />
            )
        }
    }
    componentDidUpdate(prevProps, prevState) {
        const startIndexUpdated = prevProps.startIndex !== this.props.startIndex;
        const itemsChanged = JSON.stringify(prevProps.items) !== JSON.stringify(this.props.items);
        if (this.props.lazyLoad && (!prevProps.lazyLoad || itemsChanged)) {
            this._lazyLoaded = [];
        }
        if (startIndexUpdated) {
            this.setState({ currentIndex: this.props.startIndex });
        }
    }
    componentDidMount() {
        if (this.props.autoPlay) {
            this.play();
        }
        window.addEventListener('keydown', this._handleKeyDown);
    }
    componentWillUnmount() {
        window.removeEventListener('keydown', this._handleKeyDown);
        if (this._transitionTimer) {
            window.clearTimeout(this._transitionTimer);
        }
        if (this._intervalId) {
            window.clearInterval(this._intervalId);
            this._intervalId = null;
        }
    }
    play(callback = true) {
        if (!this._intervalId) {
            const { slideInterval, slideDuration } = this.props;
            this.setState({ isPlaying: true });
            this._intervalId = window.setInterval(() => {
                if (!this.props.infinite && !this._canSlideRight()) {
                    this.pause();
                } else {
                    this.slideToIndex(this.state.currentIndex + 1);
                }
            }, Math.max(slideInterval, slideDuration));

            if (this.props.onPlay && callback) {
                this.props.onPlay(this.state.currentIndex);
            }
        }

    }

    pause(callback = true) {
        if (this._intervalId) {
            window.clearInterval(this._intervalId);
            this._intervalId = null;
            this.setState({ isPlaying: false });

            if (this.props.onPause && callback) {
                this.props.onPause(this.state.currentIndex);
            }
        }
    }
    slideToIndex = (index, event) => {
        const { currentIndex, isTransitioning } = this.state;
        if (!isTransitioning) {
            let slideCount = this.props.items.length - 1;
            let nextIndex = index;
            if (index < 0) {
                nextIndex = slideCount;
            } else if (index > slideCount) {
                nextIndex = 0;
            }
            this.setState({
                previousIndex: currentIndex,
                currentIndex: nextIndex,
                isTransitioning: nextIndex !== currentIndex,
                style: {
                    transition: `all ${this.props.slideDuration}ms ease-out`
                }
            }, this._onSliding);
        }
    }
    _onSliding = () => {
        const { isTransitioning } = this.state;
        this._transitionTimer = window.setTimeout(() => {
            if (isTransitioning) {
                this.setState({ isTransitioning: !isTransitioning });
            }
        }, this.props.slideDuration + 50);
    }
    _handleKeyDown = (event) => {
        const LEFT_ARROW = 37;
        const RIGHT_ARROW = 39;
        const ESC_KEY = 27;
        const key = parseInt(event.keyCode || event.which || 0);

        switch (key) {
            case LEFT_ARROW:
                this._slideLeft();
                break;
            case RIGHT_ARROW:
                this._slideRight();
        }
    }
    _slideLeft = (event) => {
        this.slideToIndex(this.state.currentIndex - 1, event);
    }
    _slideRight = (event) => {
        this.slideToIndex(this.state.currentIndex + 1, event);
    }
    _getAlignmentClassName(index) {
        let { currentIndex } = this.state;
        let alignment = '';
        const leftClassName = 'left';
        const centerClassName = 'center';
        const rightClassName = 'right';

        switch (index) {
            case (currentIndex - 1):
                alignment = ` ${leftClassName}`;
                break;
            case (currentIndex):
                alignment = ` ${centerClassName}`;
                break;
            case (currentIndex + 1):
                alignment = ` ${rightClassName}`;
                break;
        }
        if (this.props.items.length >= 3 && this.props.infinite) {
            if (index === 0 && currentIndex === this.props.items.length - 1) {
                alignment = ` ${rightClassName}`;
            } else if (index === this.props.items.length - 1 && currentIndex === 0) {
                alignment = ` ${leftClassName}`;
            }
        }
        return alignment;
    }
    _getSlideStyle(index) {
        const { currentIndex } = this.state;
        const { infinite, items, useTranslate3D } = this.props;
        const baseTranslateX = -100 * currentIndex;
        const totalSlides = items.length - 1;

        let translateX = (baseTranslateX + (index * 100));

        if (infinite && items.length > 2) {
            if (currentIndex === 0 && index === totalSlides) {
                translateX = -100;
            } else if (currentIndex === totalSlides && index === 0) {
                translateX = 100;
            }
        }
        let translate = `translate(${translateX}%, 0)`;
        if (useTranslate3D) {
            translate = `translate3d(${translateX}%, 0, 0)`;
        }
        return {
            WebkitTransform: translate,
            MozTransform: translate,
            msTransform: translate,
            OTransform: translate,
            transform: translate,
        };
    }
    _shouldPushSlideOnInfiniteMode(index) {
        return !this._slideIsTransitioning(index) ||
            (this._ignoreIsTransitioning() && !this._isFirstOrLastSlide(index));
    }

    _slideIsTransitioning(index) {
        const { isTransitioning, previousIndex, currentIndex } = this.state;
        const indexIsNotPreviousOrNextSlide = !(index === previousIndex || index === currentIndex);
        return isTransitioning && indexIsNotPreviousOrNextSlide;
    }

    _isFirstOrLastSlide(index) {
        const totalSlides = this.props.items.length - 1;
        const isLastSlide = index === totalSlides;
        const isFirstSlide = index === 0;
        return isLastSlide || isFirstSlide;
    }

    _ignoreIsTransitioning() {
        const { previousIndex, currentIndex } = this.state;
        const totalSlides = this.props.items.length - 1;
        const slidingMoreThanOneSlideLeftOrRight = Math.abs(previousIndex - currentIndex) > 1;
        const notGoingFromFirstToLast = !(previousIndex === 0 && currentIndex === totalSlides);
        const notGoingFromLastToFirst = !(previousIndex === totalSlides && currentIndex === 0);

        return slidingMoreThanOneSlideLeftOrRight &&
            notGoingFromFirstToLast &&
            notGoingFromLastToFirst;
    }

    _canNavigate() {
        return this.props.items.length >= 2;
    }
    _renderItem = (item) => {
        return (
            <div className="gallery-image">
                <img
                    src={item.original}
                    alt={item.originalAlt}
                    srcSet={item.srcSet}
                    sizes={item.sizes}
                    title={item.originalTitle}
                />
                {
                    item.description &&
                    <span className='gallery-description'>{item.description}</span>
                }
            </div>
        )
    }
    render() {
        const {
            currentIndex
        } = this.state;
        const {
            infinite,
            lazyLoad
        } = this.props;

        const slideLeft = this._slideLeft;
        const slideRight = this._slideRight;

        let slides = [];
        let bullets = [];

        this.props.items.forEach((item, index) => {
            const alignment = this._getAlignmentClassName(index);

            const renderItem = item.renderItem || this.props.renderItem || this._renderItem;

            const showItem = !lazyLoad || alignment || this._lazyLoaded[index];
            if (showItem && lazyLoad && !this._lazyLoaded[index]) {
                this._lazyLoaded[index] = true;
            }

            let slideStyle = this._getSlideStyle(index);
            const slide = (
                <div
                    key={index}
                    className={'gallery-slide' + alignment}
                    style={Object.assign(slideStyle, this.state.style)}
                    role='button'
                >
                    {showItem ? renderItem(item) : <div style={{ height: '100%' }}></div>}
                </div>
            );
            if (infinite) {
                if (this._shouldPushSlideOnInfiniteMode(index)) {
                    slides.push(slide);
                }
            } else {
                slides.push(slide);
            }

            if (this.props.showBullets) {
                const bulletOnClick = event => {
                    if (item.bulletOnClick) {
                        item.bulletOnClick({item, itemIndex: index, currentIndex});
                    }
                    return this.slideToIndex.call(this, index, event);
                }
                bullets.push(
                    <button
                        key={index}
                        type='button'
                        className={[
                            'gallery-bullet',
                            currentIndex === index ? 'active' : '',
                            item.bulletClass || ''
                        ].join(' ')}
                        onClick={bulletOnClick}
                        aria-pressed={currentIndex === index ? 'true' : 'false'}
                        aria-label={`Go to Slide ${index + 1}`}
                    ></button>
                )
            }
        });
        const slideWrapper = (
            <div className="gallery-slide-wrapper">
                {
                    this._canNavigate() ?
                        [
                            <span key='navigation'>
                                {this.props.renderLeftNav(slideLeft, false)}
                                {this.props.renderRightNav(slideRight, false)}
                            </span>,
                            <Swipeable
                                className='gallery-swipe'
                                key='swipeable'
                                delta={0}
                            >
                                <div className='gallery-slides'>
                                    {slides}
                                </div>
                            </Swipeable>
                        ]
                        :
                        <div className='gallery-slides'>
                            {slides}
                        </div>
                }
                {
                    this.props.showBullets &&
                    <div className='gallery-bullets'>
                        <div
                            className='gallery-bullets-container'
                            role='navigation'
                            aria-label='Bullet Navigation'
                        >
                            {bullets}
                        </div>
                    </div>
                }
            </div>
        );
        return (
            <div className="gallery" aria-live="polite">
                <div className="gallery-content">
                    {slideWrapper}
                </div>
            </div>
        );
    }
}