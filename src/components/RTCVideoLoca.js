import React from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import { RTCView } from '@zhumi/react-native-webrtc';
import { TouchableNativeFeedback, PanGestureHandler,State } from 'react-native-gesture-handler';



export default class RTCVideo extends React.Component {
    panRef = React.createRef();
    constructor(props) {
        super(props);
        this.state = {

        }
        this._translateX = new Animated.Value(0);
        this._translateY = new Animated.Value(0);
        this._lastOffset = { x: 0, y: 0 };
        this._onGestureEvent = Animated.event(
            [
                {
                    nativeEvent: {
                        translationX: this._translateX,
                        translationY: this._translateY,
                    },
                },
            ],
            { useNativeDriver: true }
        );
    }

    componentWillUnmount() {

        this.setState = (state, callback) => {
            return;
        }
    }
    shouldComponentUpdate(nextProps, nextState) {
        let next = nextProps.stream ? nextProps.stream : {};
        let now = this.props.stream ? this.props.stream : {};
        if ((next.id != now.id)) {
            return true;
        }
        return false
    }

    componentDidMount() {

    }


    streamControlAnimate() {

    }
    _onHandlerStateChange = event => {
        if (event.nativeEvent.oldState === State.ACTIVE) {
            this._lastOffset.x += event.nativeEvent.translationX;
            this._lastOffset.y += event.nativeEvent.translationY;
            this._translateX.setOffset(this._lastOffset.x);
            this._translateX.setValue(0);
            this._translateY.setOffset(this._lastOffset.y);
            this._translateY.setValue(0);
        }
    };
    render() {
        const stream = this.props.stream;
        const style = this.props.style || {};
        return (
            <PanGestureHandler
                ref={this.panRef}
                onGestureEvent={this._onGestureEvent}
                onHandlerStateChange={this._onHandlerStateChange}
                minPointers={1}
            >
                <Animated.View style={[styles.box, style,{ transform: [{ translateX: this._translateX }, { translateY: this._translateY },] }]}>
                    <TouchableNativeFeedback onPress={this.streamControlAnimate.bind(this)}>
                        <View>
                            {
                                stream ? <RTCView objectFit="cover" streamURL={stream.toURL()} style={[styles.localVideo]} /> : <View></View>
                            }

                        </View>
                    </TouchableNativeFeedback>

                </Animated.View>
            </PanGestureHandler>
        );
    }
}

const styles = StyleSheet.create({
    box: {
        width: '100%',
        height: '100%',
    },
    localVideo: {
        width: '100%',
        height: '100%',
    },
    streamControl: {
        width: '100%',
        height: '100%',
        position: 'absolute',
        left: 0,
        bottom: 0,
        alignItems: 'center',
        backgroundColor: '#000',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    iconsStyle: {
        width: 35,
        height: 35,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        marginLeft: 5,
        marginRight: 5
    }
})