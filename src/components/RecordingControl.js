import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { TouchableNativeFeedback } from 'react-native-gesture-handler';
import { RoomClient } from '../utils/RoomClient'
import { HEADERHEIGHT, VIEWPADDING ,IS_IOS} from '../configs/index'
import { FAB } from 'react-native-paper';
const TOP = IS_IOS ? HEADERHEIGHT + 30 : HEADERHEIGHT

export default class RecordingControl extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            recordingStatus: false,
            btnStatus: false,
            time: '00:00:00',
            isStoped: false,
        }
        this.intervalTime = null;

    }
    componentWillUnmount() {
        clearInterval(this.intervalTime)
        this.setState = (state, callback) => {
            return;
        }
    }
    shouldComponentUpdate(nextProps, nextState) {
        return true;
    }
    componentDidMount() {
        this.setRecordingTime()
    }

    setRecordingTime(time) {
        var h = 0;
        var m = 0;
        var s = 0;
        if (time) {
            let arr = time.split(':');
            h = parseInt(arr[0] * 1);
            m = parseInt(arr[1] * 1);
            s = parseInt(arr[2] * 1);
        }
        this.intervalTime = setInterval(() => {
            s = s + 1;
            if (s >= 60) {
                s = 0;
                m = m + 1
            }
            if (m >= 60) {
                m = 0;
                h = h + 1;
            }
            const time = (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
            //console.info("设置时间："+time);
            this.setState({ time })
        }, 1000)
    }
    recordingControlBtnsStatus() {
        this.setState({
            btnStatus: !this.state.btnStatus
        })
    }
    stopRecording() {
        RoomClient.recordingPause();
    }
    stopAndPauseTime() {
        if (this.state.isStoped) { //继续录制
            this.setRecordingTime(this.state.time)
            this.setState({ isStoped: false })
        } else {   //暂停录制
            clearInterval(this.intervalTime);
            this.setState({ isStoped: true })
        }
        //this.recordingControlBtnsStatus()
    }
    render() {
        return (
            <View style={styles.recordingControl}>
                <TouchableNativeFeedback onPress={this.recordingControlBtnsStatus.bind(this)}>
                    <View style={styles.status}>
                        <FAB
                            icon={!this.state.isStoped ? 'cloud' : 'cloud-off-outline'}
                            style={[styles.fabstyle,]}
                            color={'#fff'}
                            animated={true}
                        />
                        <Text style={{ color: '#fff', lineHeight: 30, marginLeft: 5 }}>{this.state.time}</Text>
                    </View>
                </TouchableNativeFeedback>
                <View style={[styles.recordingControlBtns, { height: this.state.btnStatus ? 60 : 0 }]}>
                    {/* <FAB
                            icon={!this.state.isStoped ? 'pause-circle' : 'play-circle'}
                            style={[styles.fabstyle,]}
                            color={'#fff'}
                            animated={true}
                            onPress={this.stopAndPauseTime.bind(this)}
                        /> */}
                    <FAB
                        icon={true ? 'stop-circle' : 'stop-circle-outline'}
                        style={[styles.fabstyle, { width: 45, height: 45 }]}
                        color={'#fff'}
                        animated={true}
                        visible={this.state.btnStatus}
                        onPress={this.stopRecording.bind(this)}
                    />
                </View>

            </View>
        );
    }
}

const styles = StyleSheet.create({
    fabstyle: {
        width: 30,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#767678'
    },
    status: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingLeft: 4,
        paddingRight: 4,
        paddingTop: 6,
        paddingBottom: 6
    },
    recordingControl: {
        width: 100,
        backgroundColor: '#242529',
        position: 'absolute',
        top: TOP + 20,
        left: VIEWPADDING,
        borderRadius: 4
    },
    recordingControlBtns: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        paddingLeft: 10,
        paddingRight: 10,
        paddingTop: 5
    }

})