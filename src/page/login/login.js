import React from 'react';
import { StyleSheet, View, Keyboard, Platform } from 'react-native';
import { Button, Text, TextInput,Paragraph } from 'react-native-paper';
import { VIEWPADDING, TIME } from '../../configs/index';
import BouncyCheckbox from "react-native-bouncy-checkbox";
import { TouchableNativeFeedback } from 'react-native-gesture-handler';
import { setUserLoginSts, setUserPhone, setUserName, setUserToken, setUserMeetingNo, setUserId, setUserInfo } from '../../actions/userAction';

import http from '../../services/axios';
import { store } from "../../store";
import * as requestActions from "../../actions/requestActions";
import * as settingsActions from "../../actions/settingsActions";
import HeadNav from '../../components/HeadNav';

export default class Login extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            phone: "",
            username: "",
            code: "",
            isSendMsg: false,
            msgBtnText: '获取',
            timeInterval: null,
            registerInProgress: false,
            theme: {},
            lic_status :false, // 协议同意状态
        }
        this.smsCodeInputTextRef = React.createRef();
    }
    getThemeColor() {
        const { theme } = store.getState().setting;
        this.setState({
            theme
        })
    }
    componentDidMount() {
        this.getThemeColor()
        this.unsubscribe = store.subscribe(() => {
            this.getThemeColor()

        })

    }
    toHome() {
        //console.log("登录成功，跳转到首页："+store.getState().user.token);
        store.dispatch(settingsActions.setShowHomeFabGroup(true));
        this.props.navigation.navigate('Home');

    }
    timeDown() {
        var time = TIME;
        this.state.timeInterval = setInterval(() => {
            if (time == 1) {
                clearInterval(this.state.timeInterval);
                this.setState({ msgBtnText: '获取' })
                return
            }
            time--;
            this.setState({ msgBtnText: time + 'S' })
        }, 1000);
    }
    async login() {
        Keyboard.dismiss();
        if(!this.state.lic_status){
            store.dispatch(requestActions.notify({ type:"error",text: "请先同意隐私政策协议" }));
            return
        }
        if (!this.state.username) {
            store.dispatch(requestActions.notify({ type:"error",text: "需要设置一个参会名称" }));
            return
        }
        if (!this.state.phone) {
            store.dispatch(requestActions.notify({ type:"error",text: "请输入手机号码" }));
            return
        }
        if (this.state.phone.length != 11) {
            store.dispatch(requestActions.notify({ type:"error",text: "请输入正确的手机号码" }));
            return
        }
        if (this.state.code.length != 6) {
            store.dispatch(requestActions.notify({ type:"error",text: "请输入短信验证码" }));
            return
        }
        let data = {
            mobile: this.state.phone,
            codeType: "register",
            displayName: this.state.username,
            code: this.state.code
        }

        this.setState({ registerInProgress: true });
        const res = await http.get('/account/auth/mobile', data, "meeting");
        this.setState({ registerInProgress: false });
        if (res.success) {  //成功

            store.dispatch(setUserLoginSts(true));
            store.dispatch(setUserPhone(data.mobile));
            store.dispatch(setUserName(this.state.username));
            store.dispatch(setUserToken(res.result.token));
            store.dispatch(setUserId(res.result.userid));
            store.dispatch(setUserMeetingNo(res.result.meetingNo));
            store.dispatch(setUserInfo(res.result));
            this.toHome();
        } else {
            store.dispatch(requestActions.notify({ text: res.message }));
        }
    }
    async sendMsg() {
        Keyboard.dismiss();
        if(!this.state.lic_status){
            store.dispatch(requestActions.notify({ type:"error",text: "请先同意隐私政策协议" }));
            return
        }
        if (this.state.msgBtnText != '获取') {
            return;
        }
        if (!this.state.phone) {
            store.dispatch(requestActions.notify({ type:"error",text: "请输入手机号" }));
            return;
        }
        if (this.state.phone.length != 11) {
            store.dispatch(requestActions.notify({type:"error", text: "请输入正确的手机号" }));
            return;
        }
        this.setState({ isSendMsg: true });
        this.timeDown();
        const data = { mobile: this.state.phone, codeType: "register" };
        http.get('/sms/code/send', data, "meeting");
        this.smsCodeInputTextRef.current.focus();
    }
    componentWillUnmount() {
       // console.log("login.js->unmount");
        if (this.state.timeInterval) {
            clearInterval(this.state.timeInterval);
        }
        this.unsubscribe();
    }
    showLic() {
        this.props.navigation.navigate('License');
        //this.props.navigation.navigate('Home');

    }
    render() {
        return (
            <View style={styles.main}>
                <HeadNav title='登录/注册' leftPrass={() => this.toHome()} />
                <View style={styles.content}>
                    <Text style={styles.topTip} onPress={()=>{Keyboard.dismiss();}}>欢迎使用竹米</Text>
                    <TextInput
                        placeholder='请输入手机号'
                        label='手机号'
                        value={this.state.phone}
                        keyboardType='numeric'
                        style={{ backgroundColor: '#fff', paddingLeft: 10 }}
                        onChangeText={(val) => { this.setState({ phone: val }) }}
                    />
                    <View style={styles.codeBox}>
                        <View style={styles.codeBoxInput}>
                            <TextInput
                                ref = {this.smsCodeInputTextRef}
                                placeholder='请输入短信验证码'
                                label='短信验证码'
                                keyboardType='numeric'
                                style={{ backgroundColor: '#fff', paddingLeft: 10 }}
                                value={this.state.code}
                                onChangeText={(val) => { this.setState({ code: val }) }}
                            />
                        </View>

                        <Button
                            mode="contained"
                            color={this.state.msgBtnText == '获取' ? this.state.theme.color : '#dedede'}
                            onPress={this.sendMsg.bind(this)}
                            style={styles.codeBoxBtn}
                            labelStyle={{ color: '#fff' }}
                        >
                            {this.state.msgBtnText}
                        </Button>
                    </View>
                    <TextInput
                        placeholder='可随意设置（推荐使用姓名）'
                        label='昵称（可随意设置，推荐使用姓名）'
                        value={this.state.username}
                        style={{ backgroundColor: '#fff', paddingLeft: 10 }}
                        onBlur={()=>{Keyboard.dismiss();}}
                        onChangeText={(val) => { this.setState({ username: val }) }}
                    />
                    <View style={styles.row}>
                    <BouncyCheckbox
                        size={18}
                        fillColor={this.state.theme.color}
                        text='阅读并同意'
                        textStyle={{textDecorationLine: "none",}}
                        unfillColor="#FFFFFF"
                        iconStyle={{ borderColor: this.state.theme.color }}
                        onPress={(isChecked)=>{
                            this.setState({lic_status:isChecked});
                            if(this.state.phone && this.state.code && this.state.username){
                                Keyboard.dismiss();
                            }
                        }}
                    />
                    <Paragraph style={{fontSize:17,paddingLeft:15}}>
                        <Text onPress={()=>{this.showLic();}} style={{color:"blue"}}>《隐私政策》</Text>
                    </Paragraph>
                </View>
                    <View style={styles.btns}>
                        <Button labelStyle={{ color: '#fff' }}
                            disabled={this.state.registerInProgress}
                            mode="contained"
                            color={this.state.theme.color}
                            onPress={this.login.bind(this)}>登录/注册</Button>
                    </View>
                </View>
                
            </View >
        )
    }

}
const styles = StyleSheet.create({
    codeBox: {
        position: "relative"
    },
    topTip: {
        paddingTop: 20,
        paddingBottom: 50,
        paddingLeft: 20,
        fontSize: 30
    },
    codeBoxBtn: {
        width: 50,
        position: 'absolute',
        right: 20,
        top: 15,
    },
    main: {
        backgroundColor: '#fff',
        height: '100%',
    },
    content: {
        marginTop: 20
    },
    btns: {
        paddingRight: VIEWPADDING,
        paddingLeft: VIEWPADDING,
    },
    row: {
        marginTop:25,
        marginBottom:15,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
      },
})
