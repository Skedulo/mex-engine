import React from 'react';
import { StyleSheet } from 'react-native';
import Modal, { ModalProps } from './Modal';
import SlideAnimation from '../animations/SlideAnimation';

const styles = StyleSheet.create({
    container: {
        justifyContent: 'flex-end',
        backgroundColor: 'transparent'
    },
    modal: {
        borderBottomRightRadius: 0,
        borderBottomLeftRadius: 0,
    },
});

const BottomModal = ({style = {}, modalStyle = {}, ...restProps} : ModalProps) => {
    const slideAnimation:SlideAnimation = new SlideAnimation({slideFrom: 'bottom'});

    return (
        <Modal
            {...restProps}
            modalAnimation={slideAnimation}
            style={StyleSheet.flatten([styles.container, style])}
            modalStyle={StyleSheet.flatten([styles.modal, modalStyle])}/>
    );
};

export default BottomModal;
