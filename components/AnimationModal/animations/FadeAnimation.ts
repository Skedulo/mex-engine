
import { Animated } from 'react-native';
import Animation from './Animation';

export default class FadeAnimation extends Animation {
    animationDuration:number
    constructor({
                    initialValue = 0,
                    useNativeDriver = false,
                    animationDuration = 200,
                }) {
        super({ initialValue, useNativeDriver });
        this.animationDuration = animationDuration;
    }

    in(onFinished = () => {}) {
        Animated.timing(this.animate, {
            toValue: 1,
            duration: this.animationDuration,
            useNativeDriver: this.useNativeDriver,
        }).start(onFinished);
    }

    out(onFinished = () => {}) {
        Animated.timing(this.animate, {
            toValue: 0,
            duration: this.animationDuration,
            useNativeDriver: this.useNativeDriver,
        }).start(onFinished);
    }

    getAnimations() {
        return { opacity: this.animate };
    }
}
