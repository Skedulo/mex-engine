
import { Animated, Dimensions } from 'react-native';
import Animation from './Animation';

const {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
} = Dimensions.get('window');

enum FROM_FROM {
    SLIDE_FROM_TOP= 'top',
    SLIDE_FROM_BOTTOM = 'bottom',
    SLIDE_FROM_LEFT = 'left',
    SLIDE_FROM_RIGHT = 'right',
}
type SlideForm = 'top' | 'bottom' | 'left' | 'right'

type SlideAnimationType = {
    initialValue?: number
    useNativeDriver?: boolean
    slideFrom: SlideForm
}
export default class SlideAnimation extends Animation {
    slideFrom: SlideForm

    constructor({
                    initialValue = 0,
                    useNativeDriver = true,
                    slideFrom = FROM_FROM.SLIDE_FROM_BOTTOM,
                }: SlideAnimationType) {
        super({ initialValue, useNativeDriver });
        this.slideFrom = slideFrom;
    }

    in(onFinished = () => {}) {
        Animated.spring(this.animate, {
            toValue: 1,
            velocity: 0,
            tension: 65,
            friction: 11,
            useNativeDriver: this.useNativeDriver,
        }).start(onFinished);
    }

    out(onFinished = () => {}) {
        Animated.spring(this.animate, {
            toValue: 0,
            velocity: 0,
            tension: 65,
            friction: 11,
            useNativeDriver: this.useNativeDriver,
        }).start(onFinished);
    }

    getAnimations() {
        const transform = [];
        if (this.slideFrom === FROM_FROM.SLIDE_FROM_TOP) {
            transform.push({
                translateY: this.animate.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-SCREEN_HEIGHT, 0],
                }),
            });
        } else if (this.slideFrom === FROM_FROM.SLIDE_FROM_BOTTOM) {
            transform.push({
                translateY: this.animate.interpolate({
                    inputRange: [0, 1],
                    outputRange: [SCREEN_HEIGHT, 0],
                }),
            });
        } else if (this.slideFrom === FROM_FROM.SLIDE_FROM_LEFT) {
            transform.push({
                translateX: this.animate.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-SCREEN_WIDTH, 0],
                }),
            });
        } else if (this.slideFrom === FROM_FROM.SLIDE_FROM_RIGHT) {
            transform.push({
                translateX: this.animate.interpolate({
                    inputRange: [0, 1],
                    outputRange: [SCREEN_WIDTH, 0],
                }),
            });
        } else {
            throw new Error(`
        slideFrom: ${this.slideFrom} not supported. 'slideFrom' must be 'top' | 'bottom' | 'left' | 'right'
      `);
        }
        return {
            transform,
        };
    }
}
