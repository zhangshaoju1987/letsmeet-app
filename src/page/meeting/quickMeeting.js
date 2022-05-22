import React from 'react'
import { StyleSheet, View, Keyboard } from 'react-native';
import { VIEWPADDING,SECURE} from '../../configs/index';
import { Text, Switch, Button, TextInput ,HelperText,Card, Paragraph,Avatar,Title, IconButton,Colors} from 'react-native-paper';
import utils from '../../utils/utils';
import Clipboard from '@react-native-community/clipboard';
import { store } from "../../store";
import { notify } from "../../actions/requestActions";
import * as settingsActions from "../../actions/settingsActions";
import * as roomAction from "../../actions/roomAction";
import HeadNav from '../../components/HeadNav';
import http from '../../services/axios';

const LeftContentDesc = props => <Avatar.Icon {...props} icon="cash-plus" />
export default class QuickMeeting extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isVideoMeeting: false,
            meetingNo: '',
            roomName: "", //会议名称
            speakerFlag: false,
            theme: {},
            showDesc:true
        }
        const { meetingNo, userName } = store.getState().user;
        this.state.roomName = userName + '的个人会议';
        this.state.meetingNo = meetingNo;
    }
    toHome() {
        store.dispatch(settingsActions.setShowHomeFabGroup(true));
        this.props.navigation.navigate('Home')
    }
    _handleClipboardContent = async () => {
        Clipboard.setString(this.state.meetingNo);
        store.dispatch(notify({ text: "复制成功" }));
    }
    toMeeting = async () => {
        Keyboard.dismiss();
        if (!this.state.roomName) {
            store.dispatch(notify({ text: "请输入会议名称" }));
            return
        }
        if (!utils.checkRoomName(this.state.roomName)) {
            store.dispatch(notify({ text: "请输入合法的参会名称，只允许字母，数字，下划线，中文" }));
            return;
        }
        // 入会前检查
        const data0 = {
            queryType: "start_meeting_check",
            queryParams: JSON.stringify({ token: encodeURI(store.getState().user.token)})
        }
        const res = await http.get("/meeting/user/query",data0,"meeting");
        if(res && res.code.startsWith("E")){
            store.dispatch(notify({ type:"error",text: "存在未支付的会议账单，请回到首页，通过右下角的悬浮+号按钮进入支付"}));
            return;
        }

        // 发起会议时，随机挑选一个
		const protocol = SECURE ? "wss" : "ws";
		const meetingSignalingServer = utils.getRandomSignalingServerUrl(protocol, "meeting");
		const { userName } = store.getState().user;
		let data = {
			isOpenVideo: this.state.isVideoMeeting,
			isOpenAudio: true,
			speakerFlag: !this.state.speakerFlag,
			roomId: this.state.meetingNo,
			type: 'OPEN',
			meetingSignalingServer,
			displayName:userName,
			roomName: this.state.roomName,
			autoPause:this.state.autoPause
		}
		//console.log("meeting data", data);
		store.dispatch(roomAction.addMeetingSubject(this.state.roomName));
		this.props.navigation.navigate('Meeting', data)
    }
    componentWillUnmount() {
        //console.log("quickMeeting.js->unmount");
    }

    isMeetingNameIllegal(){
		if(!this.state.roomName || this.state.roomName.trim().length < 2 ||!utils.checkRoomName(this.state.roomName)){
			return true;
		}
		return false;
	}
    getThemeColor() {
        const { theme } = store.getState().setting;
        this.setState({
            theme
        })
    }
    componentDidMount() {
        this.getThemeColor()
        store.dispatch(settingsActions.setShowHomeFabGroup(false));
    }
    render() {
        return (
            <View style={styles.main}>
                <HeadNav title='发起会议' leftPrass={() => this.toHome()} />
                <View style={styles.inputBox}>
                    <TextInput
						ref={this.roomNameRef}
						placeholder='请输入会议主题'
						mode="flat"
						label="会议主题"
						value={this.state.roomName}
						style={{ backgroundColor: '#fff', paddingLeft: 10 }}
						right={
							this.state.roomName && this.state.roomName.length > 0 &&
							<TextInput.Icon color={"#ccc"} name="close-circle" onPress={() => { this.setState({ roomName: "" }); }} />
						}
						onChangeText={val => { this.setState({ roomName: val }) }}
					/>
					<HelperText type='error' visible={this.isMeetingNameIllegal()}>
						设置一个合适的会议主题
					</HelperText>
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
                <View style={styles.list2}>
					<View style={styles.listBox}>
						<View style={styles.listBoxText}>
							<Text>使用个人会议号</Text>
							<Text style={styles.number}>{this.state.meetingNo}
                                <IconButton color={Colors.green400} onPress={this._handleClipboardContent.bind(this)} icon={"content-copy"} size={15}/>
							</Text>
						</View>
					</View>
				</View>

                <View style={styles.btns}>
                    <Button color={this.state.theme.color} labelStyle={{ color: '#fff' }} mode="contained" onPress={this.toMeeting.bind(this)}>发起会议</Button>
                </View>
                {this.state.showDesc && 
                <Card style={{marginTop:20}}>
                    <Card.Title title="会议服务说明" subtitle="服务条款" left={LeftContentDesc} />
                    <Card.Content>
                    <Title>服务说明</Title>
                    <Paragraph>
                        1. 发起会议将可能产生费用
                    </Paragraph>
                    <Paragraph>
                        2. 您目前享有：{store.getState().user.userInfo.creditTime}分钟免费会议
                    </Paragraph>
                    <Paragraph>
                        3. 超过{store.getState().user.userInfo.creditTime}分钟的会议，在会议结束后，会根据消耗的服务负载，进行计费，会有账单生成
                    </Paragraph>
                    <Paragraph>
                        4. 1小时左右的2地屏幕分享会议，预计费用在：6毛～8毛 之间
                    </Paragraph>
                    </Card.Content>
                </Card>
              }
            </View >
        )
    }

}
const styles = StyleSheet.create({
    inputBox: {

    },
    info: {
        paddingTop: 10,
        flexDirection: "row",
    },
    info_text: {
        color: '#a2a2a2',
        flex: 1
    },
    main: {
        height: '100%',
        backgroundColor: '#fff',
    },
    list: {
        height: 50,
        borderBottomWidth: 0.5,
        borderStyle: "solid",
        borderBottomColor: "#dedede",
        paddingTop: 5,
        paddingBottom: 5,
        backgroundColor: '#fff',
        paddingRight: VIEWPADDING,
        paddingLeft: VIEWPADDING,
    },
    list2: {
        height: 70,
        borderBottomWidth: 0.5,
        borderStyle: "solid",
        borderBottomColor: "#dedede",
        paddingTop: 5,
        paddingBottom: 5,
        backgroundColor: '#fff',
        paddingRight: VIEWPADDING,
        paddingLeft: VIEWPADDING,
    },
    listBox: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',

    },
    listBoxImg: {
        width: 25,
        height: 25
    },
    listBoxText: {
        paddingTop: 5,
        position: "relative"
    },
    btns: {
        paddingTop: 40,
        paddingRight: VIEWPADDING,
        paddingLeft: VIEWPADDING,
    },
    number: {
        color: '#a2a2a2',
    },

})
