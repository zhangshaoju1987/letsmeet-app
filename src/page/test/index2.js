import React from 'react';
import { Animated, StyleSheet } from 'react-native';

import {
    PanGestureHandler,
    PinchGestureHandler,
    TouchableNativeFeedback,
    State,
} from 'react-native-gesture-handler';

const USE_NATIVE_DRIVER = true

export class App extends React.Component {

    pinchRef = React.createRef();
    constructor(props) {
        super(props);

        /* Pinching */
        this._baseScale = new Animated.Value(1);
        this._pinchScale = new Animated.Value(1);
        this._scale = Animated.multiply(this._baseScale, this._pinchScale);
        this._lastScale = 1;
        this._onPinchGestureEvent = Animated.event(
            [{ nativeEvent: { scale: this._pinchScale } }],
            { useNativeDriver: USE_NATIVE_DRIVER }
        );

    }
    _onPinchHandlerStateChange = event => {
        if (event.nativeEvent.oldState === State.ACTIVE) {
            this._lastScale *= event.nativeEvent.scale;
            this._baseScale.setValue(this._lastScale);
            this._pinchScale.setValue(1);
        }
    };

    render() {
        console.log('----', this._scale)
        return (


            <PinchGestureHandler
                ref={this.pinchRef}
                onGestureEvent={this._onPinchGestureEvent}
                onHandlerStateChange={this._onPinchHandlerStateChange}>
                <Animated.View style={styles.container} collapsable={false}>
                    <Animated.View style={[
                            styles.pinchableImage,
                            {
                                transform: [
                        
                                    { scale: this._scale },
                                ],
                            },
                        ]}>
                        
                    </Animated.View>
                    

                </Animated.View>
            </PinchGestureHandler>


        );
    }
}

export default App;

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'black',
        overflow: 'hidden',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    pinchableImage: {
        width: 250,
        height: 250,
        backgroundColor:'red'
    },
    wrapper: {
        flex: 1,
    },
});