import { Animated } from 'react-native';

export default class Animation {
    animate: Animated.Value
    useNativeDriver: boolean
    constructor({
                    initialValue = 0,
                    useNativeDriver = true,
                }) {
        this.animate = new Animated.Value(initialValue);
        this.useNativeDriver = useNativeDriver;
    }
}
