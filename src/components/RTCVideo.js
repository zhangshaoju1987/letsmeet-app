import React from 'react';
import { StyleSheet, View, Animated, Dimensions, StatusBar } from 'react-native';
import { RTCView } from '@zhumi/react-native-webrtc';
import { store } from "../store";
import * as roomAction from '../actions/roomAction';
import Orientation from '@zhumi/react-native-orientation';
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { RoomClient } from '../utils/RoomClient';
import {
    PinchGestureHandler,
    TouchableNativeFeedback,
    State,
    PanGestureHandler,
} from 'react-native-gesture-handler';
const STATUS_BAR_HEIGHT = StatusBar.currentHeight; //手机自带头部的高度
const USE_NATIVE_DRIVER = true

export default class RTCVideo extends React.Component {
    pinchRef = React.createRef();
    panRef = React.createRef();
    constructor(props) {
        super(props);
        this.state = {
            streamControlOpacity: 0,
            orientation: "PORTRAIT",   //PORTRAIT竖屏,LANDSCAPE竖屏
            streamControlHeight: new Animated.Value(0),
            LANDSCAPEStyle: {},
            hideControl: true,
            bestStyle: {},
            bestOrientation: 'PORTRAIT',
        }
        this._baseScale = new Animated.Value(1);
        this._pinchScale = new Animated.Value(1);
        this._scale = Animated.multiply(this._baseScale, this._pinchScale);
        this._lastScale = 1;
        this._onPinchGestureEvent = Animated.event(
            [{ nativeEvent: { scale: this._pinchScale } }],
            { useNativeDriver: USE_NATIVE_DRIVER }
        );
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
            { useNativeDriver: USE_NATIVE_DRIVER }
        );
    }

    componentWillUnmount() {
        //console.log('RTCVideo----componentWillUnmount')
        store.dispatch(roomAction.roomBtnStatus(true))
        store.dispatch(roomAction.roomMyStreamStatus(true))
        Orientation.lockToPortrait() //竖屏
        Orientation.removeOrientationListener(this._orientationDidChange);
        try {
            RoomClient.smallFullScreenRequest(this.props.stream.consumer)
        } catch (error) {

        }
    }
    PORTRAITCallback(bestStyle) {
        //console.log('PORTRAITCallback', bestStyle)
        Orientation.lockToPortrait() //竖屏
        if (this.props.stream.videoType == 'screen') {
            store.dispatch(roomAction.roomMyStreamStatus(false))
        } else {
            store.dispatch(roomAction.roomMyStreamStatus(true))
        }
        this.setState({
            orientation: 'PORTRAIT',
            LANDSCAPEStyle: {
                width: bestStyle.width,
                height: bestStyle.height,
            }
        })
    }
    LANDSCAPECallback(bestStyle) {
        //console.log('LANDSCAPECallback', bestStyle)
        Orientation.lockToLandscape();  //横屏
        store.dispatch(roomAction.roomMyStreamStatus(false));
        this.setState({
            orientation: 'LANDSCAPE',
            LANDSCAPEStyle: {
                width: bestStyle.width,
                height: bestStyle.height,
            }
        })
    }
    getBestStyle() {
        let bestStyle = {};
        let bestOrientation = ''
        const { height, width } = Dimensions.get('window');
        let videoAspectRatio = ((this.props.stream && this.props.stream.consumer && this.props.stream.consumer.appData.videoAspectRatio) ? this.props.stream.consumer.appData.videoAspectRatio : 1);
        //console.log('getBestStyle', height, width, videoAspectRatio, STATUS_BAR_HEIGHT)
        if (this.props.stream && this.props.stream.consumer && videoAspectRatio) {
            if (videoAspectRatio - 1 < 0) {  //竖屏
                bestStyle.width = width;
                bestStyle.height = (bestStyle.width - STATUS_BAR_HEIGHT) / videoAspectRatio;
                bestOrientation = 'PORTRAIT'
                this.PORTRAITCallback(bestStyle)
            } else {   //横屏
                bestStyle.height = width - STATUS_BAR_HEIGHT;
                bestStyle.width = bestStyle.height * videoAspectRatio;
                bestOrientation = 'LANDSCAPE'
                this.LANDSCAPECallback(bestStyle)
            }
        } else {
            bestStyle.width = width;
            bestStyle.height = (bestStyle.width - STATUS_BAR_HEIGHT) / videoAspectRatio;
            bestOrientation = 'PORTRAIT'
            this.PORTRAITCallback(bestStyle)
        }
        this.setState({ bestStyle, bestOrientation })
    }
    componentDidMount() {
        console.log('RTCVideo --- componentDidMount', this.props.stream.videoType)
        Orientation.addOrientationListener(this._orientationDidChange);
        this.getBestStyle();

    }
    _orientationDidChange = (orientation) => {

    }

    fullscreen(stream) {
        console.log("RTCVideo.fullscreen", this.props.full)
        if (this.props.full) {
            store.dispatch(roomAction.removeFullScreenStream())
            Orientation.lockToPortrait() //竖屏
        } else {
            store.dispatch(roomAction.setFullScreenStream(stream))
        }

    }
    rotate() {
        //console.log("旋转前的宽高", this.state.bestStyle, this.state.LANDSCAPEStyle)
        Orientation.getOrientation((err, orientation) => {
            if (orientation == 'LANDSCAPE') {
                //console.log('竖屏', this.state.bestOrientation)
                Orientation.lockToPortrait() //竖屏
                if (this.props.stream.videoType == 'screen') {
                    store.dispatch(roomAction.roomMyStreamStatus(false))
                } else {
                    store.dispatch(roomAction.roomMyStreamStatus(true))
                }
                let LANDSCAPEStyle = {};
                if (this.state.bestOrientation == 'PORTRAIT') {
                    LANDSCAPEStyle = this.state.bestStyle
                } else {
                    LANDSCAPEStyle.width = this.state.bestStyle.height + STATUS_BAR_HEIGHT;
                    LANDSCAPEStyle.height = this.state.bestStyle.width - STATUS_BAR_HEIGHT;
                }

                this.setState({
                    orientation: 'PORTRAIT',
                    LANDSCAPEStyle
                })
            } else {
                //console.log('横屏', this.state.bestOrientation)
                Orientation.lockToLandscape();  //横屏
                store.dispatch(roomAction.roomMyStreamStatus(false));
                let LANDSCAPEStyle = {};
                if (this.state.bestOrientation == 'LANDSCAPE') {
                    LANDSCAPEStyle = this.state.bestStyle
                } else {
                    LANDSCAPEStyle.width = this.state.bestStyle.height + STATUS_BAR_HEIGHT;
                    LANDSCAPEStyle.height = this.state.bestStyle.width - STATUS_BAR_HEIGHT;
                }
                this.setState({
                    orientation: 'LANDSCAPE',
                    LANDSCAPEStyle
                })
            }
            //console.log("旋转后的宽高", this.state.bestStyle, this.state.LANDSCAPEStyle)
        });
    }
    animateStreamControl(open) {
        if (open) {
            Animated.timing(this.state.streamControlHeight, {
                toValue: 1,
                duration: 250,
                useNativeDriver: true,
            }).start()
        } else {
            Animated.timing(this.state.streamControlHeight, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }).start()
        }

    }

    troggleControl() {
        const hideControl = this.state.hideControl;
        this.setState({ hideControl: !hideControl });
    }
    _onPinchHandlerStateChange = event => {
        //console.log("_onPinchHandlerStateChange", State.ACTIVE)
        if (event.nativeEvent.oldState === State.ACTIVE) {
            this._lastScale *= event.nativeEvent.scale;
            this._baseScale.setValue(this._lastScale);
            this._pinchScale.setValue(1);
        }
    };
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
        const stream = this.props.stream.stream;
        const full = this.props.full;
        const LANDSCAPEStyle = this.state.LANDSCAPEStyle || {};

        return (
            <PanGestureHandler
                ref={this.panRef}
                onGestureEvent={this._onGestureEvent}
                onHandlerStateChange={this._onHandlerStateChange}
                minPointers={1}
                >
                <Animated.View style={[styles.box,]} >
                    <TouchableNativeFeedback onPress={this.troggleControl.bind(this)}>
                        <View style={[styles.canMoveBox, this.state.orientation == 'LANDSCAPE' ? { width: this.props.style.height, height: LANDSCAPEStyle.height } : {}]}>
                            <PinchGestureHandler
                                ref={this.pinchRef}
                                simultaneousHandlers={this.panRef}
                                onGestureEvent={this._onPinchGestureEvent}
                                onHandlerStateChange={this._onPinchHandlerStateChange}>
                                <Animated.View style={[LANDSCAPEStyle, { transform: [{ scale: this._scale },] }]}>
                                    {
                                        stream &&

                                        <Animated.View style={[LANDSCAPEStyle, { transform: [{ translateX: this._translateX }, { translateY: this._translateY },] }]}>
                                            <RTCView
                                                objectFit={(this.state.orientation === "PORTRAIT" && this.state.bestOrientation == 'LANDSCAPE') ? "contain" : "cover"}
                                                streamURL={stream.toURL()}
                                                style={[LANDSCAPEStyle,]} />
                                        </Animated.View>
                                    }
                                    {
                                        this.state.hideControl == false &&
                                        <View style={[styles.streamControl,]} >
                                            <TouchableNativeFeedback onPress={this.fullscreen.bind(this, stream)}>
                                                <Icon
                                                    name={!full ? 'fullscreen' : 'fullscreen-exit'}
                                                    size={45}
                                                    color="#fff"
                                                    style={styles.iconsStyle}
                                                />
                                            </TouchableNativeFeedback>
                                            <TouchableNativeFeedback onPress={this.rotate.bind(this)}>
                                                <Icon
                                                    name={this.state.orientation == "PORTRAIT" ? 'phone-rotate-landscape' : 'phone-rotate-portrait'}
                                                    size={40}
                                                    color="#fff"
                                                    style={styles.iconsStyle}
                                                />
                                            </TouchableNativeFeedback>
                                        </View>
                                    }
                                </Animated.View>
                            </PinchGestureHandler>
                        </View>
                    </TouchableNativeFeedback>
                </Animated.View >
            </PanGestureHandler>
        );
    }
}

const styles = StyleSheet.create({
    box: {
        width: '100%',
        height: '100%',
        backgroundColor: '#293129',
        ...StyleSheet.absoluteFillObject,
        top: 0,
        left: 0,
        zIndex: 9,
        alignItems: 'center',
        justifyContent: 'center',
    },
    canMoveBox: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    streamControl: {
        width: '100%',
        height: '100%',
        position: 'absolute',
        left: 0,
        bottom: 0,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    iconsStyle: {
        width: 35,
        height: 35,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 50,
        marginRight: 50,
    }
})