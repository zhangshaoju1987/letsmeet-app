import React from 'react';
import { StyleSheet, View, Keyboard, Text, Dimensions } from 'react-native';
import { VIEWPADDING } from '../../configs/index';
import { Switch, Button, TextInput, Chip,HelperText } from 'react-native-paper';
import UserLogo from '../../components/UserLogo';
import utils from '../../utils/utils';
import { store } from "../../store";
import { notify } from "../../actions/requestActions";
import * as settingsActions from "../../actions/settingsActions";
import HeadNav from '../../components/HeadNav'
import http from '../../services/axios';
import TextInputMask from 'react-native-text-input-mask';


export default class JoinMeeting extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            userName: '',
            meetNumber: "",
            opneAudio: false,
            opneVideo: false,
            speakerFlag: false,
            roomHistory: [],
            roomHistorySts: false,
            joinMeeingInProgress: false,
            meetNumberChange: false,
            theme: {}
        }
        const { userName } = store.getState().user;

        const scale = Dimensions.get('window').scale;
        console.log("屏幕分辨率：", scale * Dimensions.get('screen').width, "*", scale * Dimensions.get('screen').height);
        this.state.userName = userName;
        try {
            this.state.meetNumber = this.props.navigation.state.params.roomId || ''
        } catch (e) {

        }


    }

    toHome() {
        store.dispatch(settingsActions.setShowHomeFabGroup(true));
        this.props.navigation.navigate('Home');
    }
    async join() {

        Keyboard.dismiss();
        if (!this.state.meetNumber) {
            store.dispatch(notify({ text: "请输入会议号" }));
            return;
        }
        if (!utils.checkRoomId(this.state.meetNumber)) {
            store.dispatch(notify({ text: "请输入正确的会议号；如 xxx-xxxx-xxxx" }));
            return;
        }
        if (!this.state.userName) {
            store.dispatch(notify({ text: "请输入您的参会名称" }));
            return;
        }
        if (!utils.checkRoomName(this.state.userName)) {
            store.dispatch(notify({ text: "请输入合法的参会名称，只允许字母，数字，下划线，中文" }));
            return;
        }
        const { token } = store.getState().user;

        // 入会前检查
        const data00 = {
            queryType: "start_meeting_check",
            queryParams: JSON.stringify({ token })
        }
        const res00 = await http.get("/meeting/user/query",data00,"meeting");
        if(res00 && res00.code.startsWith("E")){
            store.dispatch(notify({ type:"error",text: "存在未支付的会议账单，请回到首页，通过右下角的悬浮+号按钮进入支付"}));
            return;
        }


        this.setState({ joinMeeingInProgress: true, meetNumberChange: false });
        //需要先查询信令服务器地址
        const data0 = {
            queryType: "meeting_running_record",
            queryParams: JSON.stringify({ token: encodeURI(token), roomId: this.state.meetNumber })
        };
        const querySingleServer = await http.get('/meeting/user/query', data0, "meeting");
        //console.log(querySingleServer)
        if (querySingleServer.code.startsWith("S") && querySingleServer.data?.object) {  //成功
            store.dispatch(settingsActions.setSingleServerInfo(querySingleServer.data.object))
        } else {
            let msg = querySingleServer.message || '获取信令服务器地址失败';
            store.dispatch(notify({ text: msg }));
            this.setState({ joinMeeingInProgress: false });
            return
        }
        const data1 = {
            roomId: this.state.meetNumber,
            queryType: "meeting_status",
            queryParams: JSON.stringify({ roomId: this.state.meetNumber, token: encodeURI(token) })
        };
        const res = await http.get('/meeting/user/query', data1, "meeting");
        this.setState({ joinMeeingInProgress: false, meetNumberChange: false });
        if (res.success) {  //成功

            if (res.result.meetingStatus == 'on_going') {
                let data = {
                    isOpenAudio: this.state.opneAudio,
                    isOpenVideo: this.state.opneVideo,
                    speakerFlag: this.state.speakerFlag,
                    roomId: this.state.meetNumber,
                    type: 'JOIN',
                }
                this.props.navigation.navigate('Meeting', data)
            } else {
                let msg = res.msg;
                if (res.result && res.result.meetingStatus) {
                    msg = res.result.message;
                }
                store.dispatch(notify({ text: msg }));
            }
        } else if (!res.success) {
            let msg = res.message;
            store.dispatch(notify({ text: msg }));
        } else {
            store.dispatch(notify({ text: "通信出现中断" }));
        }

    }
    inputFocus() {
        let { roomHistory } = store.getState().room;
        //console.log('roomHistory', roomHistory)
        if (!roomHistory) {
            return
        }
        //去重
        var obj = {};
        roomHistory = roomHistory.reduce(function (item, next) {
            if (!obj[next.roomId]) {
                obj[next.roomId] = true;
                item.push(next)
            }
            return item;
        }, []);
        //去掉自己
        const { meetingNo } = store.getState().user;
        let newRoomHistory = roomHistory.filter((item) => { return item.roomId != meetingNo })
        this.setState({
            roomHistory: newRoomHistory,
            roomHistorySts: true
        })
    }

    selectRoomId(item) {
        this.setState({
            meetNumber: item.roomId,
            meetNumberChange: false
        })
    }
    shouldComponentUpdate(nextProps, nextState) {
        //console.log('shouldComponentUpdate',nextState)
        if (nextState.meetNumber && nextState.meetNumberChange && (nextState.meetNumber == this.state.meetNumber)) {
            let mn = this.state.meetNumber.toString();
            this.setState({
                meetNumber: mn.substr(0, mn.length - 1)
            })
        }
        return true;
    }
    componentWillUnmount() {
        //console.log("joinMeing.js->unmount");
        this.unsubscribe();
    }
    getThemeColor() {
        const { theme } = store.getState().setting;
        this.setState({
            theme
        })
    }
    componentDidMount() {
        store.dispatch(settingsActions.setShowHomeFabGroup(false));
        this.inputFocus()
        this.getThemeColor()
        this.unsubscribe = store.subscribe((state) => {
            this.setState(state);
            this.getThemeColor()
        });
    }
    meetNumberChange(val) {
        if (val && (val.length == 3 || val.length == 8)) {
            this.setState({ meetNumber: val + '-' })
        } else {
            this.setState({ meetNumber: val })
        }
        this.setState({
            meetNumberChange: true
        })
    }
    isRoomIdEmptyOrIlleal() {
		if (!this.state.meetNumber || !utils.checkRoomId(this.state.meetNumber)) {
			return true;
		}
		return false;
	}
	isDisplaynameEmpty() {
		if (!this.state.userName || this.state.userName.length < 2) {
			return true;
		}
		return false;
	}
	isDisplaynameContainsIllegalChar() {
		if (this.state.userName && !utils.checkRoomName(this.state.userName)) {
			return true;
		}
		return false;
	}
    render() {
        return (
            <View style={styles.main}>
                <HeadNav title='加入会议' leftPrass={() => this.toHome()} />
                <View style={styles.content}>
                    <View style={{ position: 'relative' }}>
                    <TextInput
                            ref={this.roomIdRef}
                            placeholder='请输入会议号,xxx-xxxx-xxxx'
                            label='会议号'
                            maxLength={13}
                            mode="flat"
                            keyboardType='numeric'
                            render={props =>
                                <TextInputMask
                                    {...props}
                                    mask="[000]-[0000]-[0000]"
                                />
                            }
                            value={this.state.meetNumber}
                            style={{ backgroundColor: '#fff', paddingLeft: 10 }}
                            right={
                                this.state.meetNumber && this.state.meetNumber.length > 0 &&
                                <TextInput.Icon color={"#ccc"} name="close-circle" onPress={() => { this.setState({ meetNumber: "" }); }} />
                            }
                            onChangeText={val => {
                                // 这里拿到的是格式化之后的数据，如果想获取格式化之前的数据，需要在TextInputMask里进行事件监听
                                this.setState({ meetNumber: val });
                                if (val.length == 13) {
                                    Keyboard.dismiss();
                                }
                            }}
						/>
                        <HelperText type='error' visible={this.isRoomIdEmptyOrIlleal()}>
								必填 (推荐使用复制粘贴代替手工输入)
						</HelperText>
                    </View>
                    <View style={styles.roomHistory}>
                        {
                            this.state.roomHistorySts && this.state.roomHistory.map((item, idx) => {
                                if (idx < 10 && item.roomName && item.roomName != "undefined") {
                                    return (
                                        <Chip key={idx} avatar={<UserLogo size={25} userName={item.roomName} />} style={styles.ChipStyle} onPress={() => this.selectRoomId(item)}>
                                            {item.roomName.replace("的个人会议", "")}
                                        </Chip>
                                    )
                                }

                            })
                        }
                    </View>

                    <View>
                        <TextInput
                            placeholder='请输入您的名称'
                            label='您的名称'
                            value={this.state.userName}
                            style={{ backgroundColor: '#fff', paddingLeft: 10 }}
                            right={
                                this.state.userName && this.state.userName.length > 0 &&
                                <TextInput.Icon color={"#ccc"} name="close-circle" onPress={() => { this.setState({ userName: "" }); }} />
                            }
                            onChangeText={(val) => { this.setState({ userName: val }); this.setState({ meetNumberChange: false }) }}
                        />
                        <HelperText type='error' visible={this.isDisplaynameEmpty()}>
                            参会名称不能为空且至少两个字符
                        </HelperText>
                        <HelperText type='error' visible={this.isDisplaynameContainsIllegalChar()}>
                            参会名称不能包含特殊字符
                        </HelperText>
                    </View>
                    
                    <View style={{ marginTop: 20, paddingRight: VIEWPADDING, paddingLeft: VIEWPADDING, }}>
                        <Button mode="contained"
                            style={{ zIndex: 10 }} labelStyle={{ color: '#fff' }}
                            disabled={this.state.joinMeeingInProgress}
                            color={this.state.theme.color} onPress={this.join.bind(this)}>加入会议</Button>
                    </View>
                    <Text style={styles.info}>入会选项</Text>
                </View>

                <View style={styles.list}>
                    <View style={styles.listBox}>
                        <View style={styles.listBoxText}>
                            <Text>开启麦克风</Text>
                        </View>
                        <Switch
                            color={this.state.theme.color}
                            value={this.state.opneAudio}
                            onValueChange={(opneAudio) => this.setState({ opneAudio, meetNumberChange: false })}
                            style={{ marginTop: 8 }}
                        />
                    </View>
                </View>
                <View style={styles.list}>
                    <View style={styles.listBox}>
                        <View style={styles.listBoxText}>
                            <Text>耳机/听筒模式</Text>
                        </View>
                        <Switch
                            color={store.getState().setting.theme.color}
                            value={this.state.speakerFlag}
                            onValueChange={(speakerFlag) => this.setState({ speakerFlag })}
                            style={{ marginTop: 8 }}
                        />
                    </View>
                </View>

                <View style={styles.list}>
                    <View style={styles.listBox}>
                        <View style={styles.listBoxText}>
                            <Text>开启摄像头</Text>
                        </View>
                        <Switch
                            color={this.state.theme.color}
                            value={this.state.opneVideo}
                            onValueChange={(opneVideo) => this.setState({ opneVideo, meetNumberChange: false })}
                            style={{ marginTop: 8 }}
                        />
                    </View>
                </View>

            </View>
        )
    }

}
const styles = StyleSheet.create({
    ChipStyle: {
        marginTop: 5,
        marginRight: 3
    },

    roomHistory: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 12,

    },
    main: {
        backgroundColor: '#fff'
    },
    content: {
        paddingTop: 15,
        backgroundColor: '#fff'
    },
    info: {
        paddingTop: 20,
        paddingLeft: VIEWPADDING
    },
    list: {
        height: 50,
        borderBottomWidth: 0.5,
        borderStyle: "solid",
        borderBottomColor: "#dedede",
        paddingTop: 5,
        paddingBottom: 5,
        backgroundColor: '#fff',
        paddingLeft: VIEWPADDING,
        paddingRight: VIEWPADDING
    },
    listBox: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',

    },
    listBoxText: {
        marginTop: 10,
    }
})
