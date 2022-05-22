import React from 'react';
import { StyleSheet, Animated, Easing, View, Text } from 'react-native';
import { RNCamera } from 'react-native-camera';
import utils from '../utils/utils';
import { store } from '../store';
import { notify } from "../actions/requestActions";
import { Colors, IconButton } from 'react-native-paper';


export default class Scan extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            moveAnim: new Animated.Value(0)
        }
    }
    componentDidMount() {
        //console.log("scan 加载成功");
        this.startAnimation();
    }
    close() {
        //console.log("scan=========close")
        this.props.close();
    }
    startAnimation = () => {
        this.state.moveAnim.setValue(0);
        Animated.timing(
            this.state.moveAnim,
            {
                toValue: -200,
                duration: 1500,
                easing: Easing.linear,
                useNativeDriver: false
            }
        ).start(() => this.startAnimation());
    };

    //  识别二维码
    onBarCodeRead = (result) => {
        const { data } = result;
        //console.log("onBarCodeRead",data);
        const roomId = utils.extractMeetingNo(data);
        if (roomId) {  //如果是会议id
            this.props.navigation.navigate('JoinMeeting', {
                roomId,
                isshare:true
            })
            this.close()
        } else {
            store.dispatch(notify({ text: data }));
            this.close();
        }
    };

    componentWillUnmount() {
        //console.log("Scan.js->unmount");
        this.setState = ()=>{};
    }
    render() {
        return (
            <View style={styles.container}>
                <RNCamera
                    ref={ref => {
                        this.camera = ref;
                    }}
                    style={styles.preview}
                    type={RNCamera.Constants.Type.back}
                    flashMode={RNCamera.Constants.FlashMode.on}
                    captureAudio={false}
                    androidCameraPermissionOptions={{
                        title: '授权访问相机',
                        message: '扫描功能需要您允许访问相机',
                        buttonPositive: '同意',
                        buttonNegative: '拒绝',
                    }}
                    onBarCodeRead={this.onBarCodeRead}
                >
                    <View style={styles.rectangleContainer}>
                        <View style={styles.rectangle} />
                        <Animated.View style={[
                            styles.border,
                            { transform: [{ translateY: this.state.moveAnim }] }]} />
                        <Text style={styles.rectangleText}>将二维码放入框内，即可自动扫描</Text>
                    </View>
                    <IconButton icon={"close"} color={Colors.green400} size={30} onPress={this.close.bind(this)} style={{marginBottom:50}}></IconButton>
                </RNCamera>
            </View>

        )
    }
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 999,
        height: '100%',
        width: '100%',
    },
    preview: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center'
    },
    rectangleContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent'
    },
    rectangle: {
        height: 200,
        width: 200,
        borderWidth: 1,
        borderColor: '#00FF00',
        backgroundColor: 'transparent',
    },
    rectangleText: {
        flex: 0,
        color: '#fff',
        marginTop: 10
    },
    border: {
        flex: 0,
        width: 200,
        height: 2,
        backgroundColor: '#00FF00',
    },
    closeImg: {
        width: 40,
        height: 40,
        marginBottom: 50,
    }
})