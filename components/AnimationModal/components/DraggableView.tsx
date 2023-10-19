import React, {useRef} from 'react';
import {Animated, LayoutChangeEvent, StyleProp} from 'react-native';

type DraggableViewProps = {
    style?: StyleProp<any>,
    children?:any
};

const DraggableView = (props: DraggableViewProps) => {
    const { style, children: renderContent } = props;
    const layout = useRef<any>({});

    const onLayout = (event: LayoutChangeEvent) => {
        layout.current = event.nativeEvent.layout;
    }

    const content = renderContent({
        onLayout: onLayout,
    });

    return (
        <Animated.View style={style}>
            {content}
        </Animated.View>
    );
}

export default DraggableView;
