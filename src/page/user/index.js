import React from 'react';
import { StyleSheet, Image, ScrollView, View, Text, } from 'react-native';
import { TouchableNativeFeedback } from 'react-native-gesture-handler';
import { Button } from 'react-native-paper';
import { VIEWPADDING } from '../../configs/index';
import Clipboard from '@react-native-community/clipboard';
import UserLogo from '../../components/UserLogo';

import { store } from "../../store";
import { notify } from "../../actions/requestActions";
import * as settingsActions from "../../actions/settingsActions";
import { setUserPhone, setUserName, setUserToken, setUserMeetingNo, setUserLoginSts } from '../../actions/userAction';
import HeadNav from '../../components/HeadNav'
import APP from "../../../app.json";
import http from '../../services/axios';


export default class UserIndex extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            phone: "",
            userName: "",
            meetingNo: '',
            theme:{},
            currentCoinNumber:0
        }

    }
    componentWillUnmount() {
        
    }
    getThemeColor(){
        const { theme } = store.getState().setting;
        this.setState({
            theme
        })
    }
    componentDidMount() {
        const { meetingNo, userName, phone, token,userInfo } = store.getState().user;
       this.getThemeColor()
        if (!token) {
            console.error("用户详情页面token不存在：token=" + token);
            this.props.navigation.navigate('Login');
            return;
        }
        this.setState({ userName })
        this.setState({ phone })
        this.setState({ meetingNo })
        this.setState({ userInfo })

        http.get("/user/account/info",{token:store.getState().user.token},"meeting")
        .then((res)=>{
            const currentCoinNumber  = res.result.accountInfo.balance;
            this.setState({
                currentCoinNumber
            });
        });
    }
    loginout() {
        //console.log("退出登录前：token=" + store.getState().user.token);
        store.dispatch(setUserPhone(''));
        store.dispatch(setUserName(''));
        store.dispatch(setUserToken(''));
        store.dispatch(setUserMeetingNo(''));
        store.dispatch(setUserLoginSts(false));
        this.props.navigation.navigate('Login');
        //console.log("退出登录后：token=" + store.getState().user.token);
    }
    test() {
        store.dispatch(notify({ text: "敬请期待" }));
    }
    _handleClipboardContent = async () => {
        Clipboard.setString(this.state.meetingNo);
        Clipboard.getString().then((content) => {
            store.dispatch(notify({ text: "复制成功" }));
        }, (error) => {
            console.log('error:' + error);
        })
    }
    toHome() {
        store.dispatch(settingsActions.setShowHomeFabGroup(true));
        this.props.navigation.navigate('Home');
    }
    toSetting(){
        this.props.navigation.navigate('Setting');
    }
    _showTips(message){
        store.dispatch(notify({ text: message,timeout:8000 }));
    }
    render() {

        return (

            <View style={styles.main}>
                <HeadNav title='我的账号' leftPrass={() => this.toHome()} />
                <ScrollView>
                    <View style={styles.headerLeft}>
                        <UserLogo size={50}/>
                        <Text style={styles.userName}>{this.state.userName}</Text>
                    </View>
                    <View style={styles.section}>
                        <View style={styles.list}>
                            <Text style={styles.listLeft}>个人会议号</Text>
                            <TouchableNativeFeedback onPress={this._handleClipboardContent.bind(this)}>
                                <Text style={styles.listRight}>{this.state.meetingNo}
                                    <Image
                                        style={styles.copyImg}
                                        source={require('../../assets/images/copy.png')}
                                    />
                                </Text>
                            </TouchableNativeFeedback>
                        </View>

                    </View>

                    <View style={styles.section}>
                        <View style={styles.list}>
                            <Text style={styles.listLeft}>手机号</Text>
                            <Text style={styles.listRight}>{this.state.phone}</Text>
                        </View>
                        <View style={styles.list}>
                            <Text style={styles.listLeft}>会议免费时长</Text>
                            <TouchableNativeFeedback onPress={this._showTips.bind(this,'在该时间范围内，可以免费使用会议')}>
                                <Text style={styles.listRight}>
                                    {this.state.userInfo && this.state.userInfo.creditTime}分钟
                                    <Image
                                        style={styles.copyImg}
                                        source={require('../../assets/images/copy.png')}
                                    />
                                </Text>
                            </TouchableNativeFeedback>
                        </View>
                        <View style={styles.list}>
                            <Text style={styles.listLeft}>竹米</Text>
                            <TouchableNativeFeedback onPress={this._showTips.bind(this,'1 粒竹米 等于 1RMB，用于抵扣应用内服务费用')}>
                                <Text style={styles.listRight}>
                                    {this.state.userInfo && this.state.currentCoinNumber} 粒
                                    <Image
                                        style={styles.copyImg}
                                        source={require('../../assets/images/copy.png')}
                                    />
                                </Text>
                            </TouchableNativeFeedback>
                        </View>
                        <View style={styles.list}>
                            <Text style={styles.listLeft}>负载单价</Text>
                            <TouchableNativeFeedback onPress={this._showTips.bind(this,'您发起的每一次会议，系统都要消耗一定的负载去支撑，会议结束将会统计消耗的负载系数，基于负载系数和负载单价生成会议账单')}>
                                <Text style={styles.listRight}>
                                    {this.state.userInfo && this.state.userInfo.loadPrice}元
                                    <Image
                                        style={styles.copyImg}
                                        source={require('../../assets/images/copy.png')}
                                    />
                                </Text>
                            </TouchableNativeFeedback>
                        </View>
                        <View style={styles.list}>
                            <Text style={styles.listLeft}>版本</Text>
                            <Text style={styles.listRight}>{APP.version}</Text>
                        </View>
                        <View style={styles.list}>
                            <Text style={styles.listLeft}>官方网站</Text>
                            <Text style={styles.listRight}>https://www.joemeet.com</Text>
                        </View>
                        <View style={styles.list}>
                            <Text style={styles.listLeft}>技术支持</Text>
                            <Text style={styles.listRight}>深圳余亩荞麦数字科技有限公司</Text>
                        </View>
                        <View style={styles.list}>
                            <Text style={styles.listLeft}>官方微信公众号</Text>
                            <TouchableNativeFeedback onPress={()=>{
                                this._showTips('已复制\n如果您有疑问或者想给我们提意见，可以通过该微信公众号发送消息给我们');
                                Clipboard.setString("joe_fertile_land");
                            }}>
                                <Text style={styles.listRight}>
                                    joe_fertile_land
                                    <Image
                                        style={styles.copyImg}
                                        source={require('../../assets/images/copy.png')}
                                    />
                                </Text>
                            </TouchableNativeFeedback>
                        </View>
                    </View>

                    <View style={styles.btns}>
                        <Button mode="contained" labelStyle={{color:'#fff'}} color={this.state.theme.color} onPress={this.loginout.bind(this)}>退出登录</Button>
                    </View>
                </ScrollView>

            </View >
        )
    }

}
const styles = StyleSheet.create({
    copyImg: {
        width: 20,
        height: 20,
    },
    main: {
        backgroundColor: '#fff'
    },
    section: {
        marginBottom: 20
    },
    list: {
        borderBottomWidth: 0.5,
        borderStyle: "solid",
        borderBottomColor: "#dedede",
        paddingTop: 12,
        paddingBottom: 12,
        backgroundColor: '#fff',
        paddingRight: VIEWPADDING,
        paddingLeft: VIEWPADDING,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    btns: {
        paddingRight: VIEWPADDING,
        paddingLeft: VIEWPADDING,
        marginTop: 30,
    },
    headerLeft: {
        paddingRight: VIEWPADDING,
        paddingLeft: VIEWPADDING,
        flexDirection: 'row',
        marginBottom: 30,
        marginTop: 15,
    },
    listRight: {
        color: "#989898"
    },
    headerLeftUser: {
        width: 50,
        height: 50,
        borderRadius: 25,
        overflow: 'hidden',
    },
    headPortrait: {
        width: '100%',
        height: "100%",
    },
    userName: {
        marginTop: 15,
        marginLeft: 10
    },
    listImg: {
        width: 18,
        height: 18,
    }
})
