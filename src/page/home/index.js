import React from 'react';
import {View, StyleSheet, Image, Dimensions, ScrollView, Platform } from 'react-native';
import { TouchableNativeFeedback, FlatList } from 'react-native-gesture-handler';
import { VIEWPADDING } from '../../configs/index';
import UserLogo from '../../components/UserLogo';
import Scan from '../../components/Scan';
import MeetingItem from '../../components/MeetingItem';
import OnGoingMeetingItemSwipeableRow from '../../components/OnGoingMeetingItemSwipeableRow';
import SplashScreen from 'react-native-splash-screen';
import { FAB, Portal, IconButton, List, RadioButton, withTheme,Text } from 'react-native-paper';
import NoData from '../../components/NoData';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as settingsActions from "../../actions/settingsActions";
import servers from '../../utils/servers'
import { store } from "../../store";
import { notify } from "../../actions/requestActions";
import http from '../../services/axios';
import DrawerLayout, { } from 'react-native-gesture-handler/DrawerLayout';
import { Colors } from 'react-native/Libraries/NewAppScreen';
const { width } = Dimensions.get('window');

const SwipeableRow = ({ item, index, navigation }) => {
    return (
        <OnGoingMeetingItemSwipeableRow item={item}>
            <MeetingItem item={item} navigation={navigation} />
        </OnGoingMeetingItemSwipeableRow>
    );
};
function HookComponent() {
    const insets = useSafeAreaInsets();
    return <View style={{ paddingBottom: insets.top }} />;
}

class Home extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            meetingList: [],
            token: '',
            userName: '您好',
            isShowScan: false,
            isShowMore: false,
            showHomeFabGroup: false,
            colors: '',
            webThemes: [],
            theme: {},
            currentPage: '',
            isVip: false,
            appInfo :null,  // 从服务器端获取的app的信息
            videoCodec:"h264",
            videoSettings:store.getState().setting.videoSettings || {cameraCodec:"h264",screenCodec:"h264"},
            actions:[
                {
                    icon: 'microsoft-sharepoint',
                    label: '最近的会议',
                    onPress: () => { this.toMeetingHistoryScreen(); },

                },
                {
                    icon: 'billiards',
                    label: '会议账单',
                    hide:true,
                    onPress: () => { this.toMeetingBill(); }
                },
                {
                    icon: 'cash-plus',
                    label: '充值',
                    onPress: () => {
                        this.toBuyJoemCoinPage();
                    }
                },
                {
                    icon: 'cog',
                    label: '设置',
                    onPress: () => {
                        this.handleDrawer();
                    }
                },
            ],
        }
        const { token, userName } = store.getState().user;
        this._login = token;
        this.userName = userName || '您好'
        const { webThemes } = props.theme;
        this.state.webThemes = webThemes

    }

    /**
     * 是否使用ios应用内支付
     * @returns 
     */
    async useIosIAP(){
        if(Platform.OS !== "ios"){
            return false;
        }
        // ios 手机未登录，使用ios应用内支付
        if(Platform.OS === "ios" && !store.getState().user.token){
            return true;
        }
        try{
            const data = await http.post("/main/account/useIosIap",{
                token:store.getState().user.token,
                osType:Platform.OS
            },"joemeet_client");
            //console.log("是否使用iosIAP",data);  
            return data.result.useIosIAP;
        }catch(e){
            return true;
        }
    }
    /**
     * 跳转竹米币充值界面
     */
    async toBuyJoemCoinPage(){

        store.dispatch(settingsActions.setShowHomeFabGroup(false));
        const useIosIAP = await this.useIosIAP();
        if(Platform.OS === "ios" && useIosIAP){  // 跳转ios充值界面
            console.log("ios充值");
           this.checkLogin() && this.props.navigation.navigate('ChargeJoemCoinIOS'); 
           //this.checkLogin() && this.props.navigation.navigate('ChargeJoemCoin');

        }else{// 跳转android充值界面
            this.checkLogin() && this.props.navigation.navigate('ChargeJoemCoin');
        }
    }

    async getMeetingList() {
        //console.log('首页开始获取会议数据')
        const { token } = store.getState().user;
        try {
            let data = {
                queryType: "meeting_ongoing",
                queryParams: JSON.stringify({ token: encodeURI(token) })
            }
            const res = await http.get('/meeting/user/query', data,"meeting");
            //console.log('首页完成获取会议数据', res)
            if (res.success) {  //成功
                let list = res.result.list;
                this.setState({
                    meetingList: list
                })
            }
        } catch (error) {

        }


    }

    checkLogin() {
        const token = store.getState().user.token;
        //console.log("在首页获取用户token=" + token);
        if (!token) {
            this.props.navigation.navigate('Login');
            return false;

        } else {
            return true;
        }
    }
    joinMeeting() {

        store.dispatch(settingsActions.setShowHomeFabGroup(false));
        this.checkLogin() && this.props.navigation.navigate('JoinMeeting');
    }
    quickMeeting() {
        // ！！！对于监听的store的属性，一定要和store保持一致(一定要dispatch出去)，不能仅仅通过this.setState在当前组件内进行更改，否则容易造成全局数据共享不一致的问题，而且很难排查
        store.dispatch(settingsActions.setShowHomeFabGroup(false));
        this.checkLogin() && this.props.navigation.navigate('QuickMeeting');
    }
    toMeetingDetails(id) {
        store.dispatch(settingsActions.setShowHomeFabGroup(false));
        this.checkLogin() && this.props.navigation.navigate('MeetingDetails', {meeintId: id});
    }
    toMeetingHistoryScreen() {
        // ！！！对于监听的store的属性，一定要和store保持一致(一定要dispatch出去)，不能仅仅通过this.setState在当前组件内进行更改，否则容易造成全局数据共享不一致的问题，而且很难排查
        store.dispatch(settingsActions.setShowHomeFabGroup(false));
        this.checkLogin() && this.props.navigation.navigate('MeetingHistory');
    }
    toUser() {
        // ！！！对于监听的store的属性，一定要和store保持一致(一定要dispatch出去)，不能仅仅通过this.setState在当前组件内进行更改，否则容易造成全局数据共享不一致的问题，而且很难排查
        store.dispatch(settingsActions.setShowHomeFabGroup(false));
        this.checkLogin() && this.props.navigation.navigate('User');
    }
    toMeetingBill(){
        store.dispatch(settingsActions.setShowHomeFabGroup(false));
        this.checkLogin() && this.props.navigation.navigate('MeetingBill');
    }
    shouldComponentUpdate(nextProps, nextState) {
        if (nextState.currentPage != this.state.currentPage && nextState.currentPage == 'Home') {
            servers.updateLocalSignalingServers();
            this.getMeetingList();
        }
        return true;
    }
    componentDidMount() {
        // 隐藏启动页
        //console.log("index mount");
        SplashScreen.hide();
        this.getThemeColor();
        // 订阅的属性，状态，一定要在卸载是取消订阅否则会有潜在的风险
        // 以后应该改成connect的方式，就不需要这样订阅，取消订阅非常小心了
        this.unsubscribe = store.subscribe(() => {
            const { currentPage, isVip, currentUserType } = store.getState().user;
            this.setState({
                userName: store.getState().user.userName,
                showHomeFabGroup: store.getState().setting.showHomeFabGroup,
                currentPage,
                isVip,
                currentUserType,
                videoSettings:store.getState().setting.videoSettings
            });

            this.getThemeColor()
        });
        store.dispatch(settingsActions.setShowHomeFabGroup(true));
        this.appCheck();
    }
    /**
     * 进行app 版本检查
     */
    async appCheck(){
        try {
            const res = await http.get('/app/version/check', {},"meeting");
            //console.log(res);
        } catch (error) {
            console.log("从服务器端获取数据出现异常",error);
            this.setState({appInfo:null});
        }
    }
    getThemeColor() {
        const { theme } = store.getState().setting;
        this.setState({
            colors: theme.color,
            theme
        })
    }
    componentWillUnmount() {
        //console.log("Home -> unmount");
        this.unsubscribe();
    }
    showScan() {

        if (this.state.isShowScan) {
            this.setState({
                isShowScan: false
            });
        } else {
            store.dispatch(settingsActions.setShowHomeFabGroup(false));
            this.setState({
                isShowScan: true
            });
        }

    }
    hideScan() {
        this.setState({
            isShowScan: false
        });
        store.dispatch(settingsActions.setShowHomeFabGroup(true));
    }

    handleDrawer() {

        this.drawer.openDrawer()
        //this.drawer.closeDrawer()

    }
    setThemeColors(color) {
        //console.log('选中的color为', color)
        this.setState({ colors: color.color });
        store.dispatch(settingsActions.setTheme(color))
    }
    test(){
        store.dispatch(settingsActions.setShowHomeFabGroup(false));
        this.props.navigation.navigate('Test');
    }
    renderDrawer = () => {
        const webThemes = this.state.webThemes;
        return (
            <ScrollView>
                <HookComponent />
                <View style={styles.drawerBox}>
                    <Text style={styles.drawerTitle}>我的设置</Text>
                    <List.AccordionGroup>
                        <List.Accordion title="主题色" id="1">
                            <View>
                                {
                                    webThemes && webThemes.map((item, idx) => {
                                        return (
                                            <RadioButton.Item
                                                key={idx}
                                                value={item.color}
                                                label={item.name}
                                                color={'#fff'}
                                                uncheckedColor={'#dedede'}
                                                labelStyle={{ color: '#fff' }}
                                                status={this.state.colors === item.color ? 'checked' : 'unchecked'}
                                                onPress={() => this.setThemeColors(item)}
                                                style={{ height: 35, backgroundColor: item.color }}
                                            />
                                        )
                                    })
                                }

                            </View>
                        </List.Accordion>
                        <List.Accordion title="摄像头采集编解码" id="2">
                            <RadioButton.Group onValueChange={(cameraCodec)=>{
                                let {videoSettings} = store.getState().setting;
                                if(!videoSettings){
                                    videoSettings = {}
                                }
                                videoSettings.cameraCodec = cameraCodec;
                                store.dispatch(settingsActions.changeVideoSettings(videoSettings));
                            }} value={this.state.videoSettings?.cameraCodec}> 
                                <RadioButton.Item style={{height:50}} label="av1"  value="av1" />
                                <RadioButton.Item style={{height:50}} label="vp9"  value="vp9" />
                                <RadioButton.Item style={{height:50}} label="vp8"  value="vp8" />
                                <RadioButton.Item style={{height:50}} label="h264" value="h264" />
                            </RadioButton.Group>
                        </List.Accordion>
                        <List.Accordion title="屏幕采集编解码" id="4">
                            <RadioButton.Group onValueChange={(screenCodec)=>{
                                let {videoSettings} = store.getState().setting;
                                if(!videoSettings){
                                    videoSettings = {}
                                }
                                videoSettings.screenCodec = screenCodec;
                                store.dispatch(settingsActions.changeVideoSettings(videoSettings));
                            
                            }} value={this.state.videoSettings?.screenCodec}> 
                                <RadioButton.Item style={{height:50}} label="av1"  value="av1" />
                                <RadioButton.Item style={{height:50}} label="vp9"  value="vp9" />
                                <RadioButton.Item style={{height:50}} label="vp8"  value="vp8" />
                                <RadioButton.Item style={{height:50}} label="h264" value="h264" />
                            </RadioButton.Group>
                        </List.Accordion>
                        <List.Accordion title="会议管理设置" id="5">
                            <View>
                                

                            </View>
                        </List.Accordion>
                    </List.AccordionGroup>
                </View>
            </ScrollView>
        );
    };
    render() {
        return (
            <DrawerLayout
                ref={drawer => {
                    this.drawer = drawer;
                }}
                drawerWidth={270}
                keyboardDismissMode="on-drag"
                drawerPosition={DrawerLayout.positions.Left}
                drawerBackgroundColor="#fff"
                // overlayColor={'#fff'}
                renderNavigationView={this.renderDrawer}
                drawerType={'back'}
            >
                <View style={styles.main}>
                    <HookComponent />
                    <View style={styles.header}>
                        <View style={styles.headerLeftBox}>
                            <TouchableNativeFeedback
                                onPress={this.toUser.bind(this)}>
                                <View style={styles.headerLeft}>
                                    <UserLogo size={40} />
                                    <Text style={styles.userName}>{this.state.userName ? this.state.userName: '您好'}</Text>
                                </View>
                            </TouchableNativeFeedback>
                        </View>

                        <IconButton
                            icon="line-scan"
                            color={Colors.green300}
                            size={20}
                            onPress={this.showScan.bind(this)}
						/>
                    </View>

                    <View>
                        <View style={styles.list}>
                            <View style={styles.listBox}>
                                <IconButton
                                    onPress={this.joinMeeting.bind(this)}
                                    icon="alpha-j-circle-outline"
                                    size={50}
                                    color="#87C0CA"
                                    style={styles.listBoxImg}
                                />
                                <Text style={styles.listBoxText}>加入会议</Text>
                            </View>

                            <View style={styles.listBox}>
                                <IconButton
                                    onPress={this.quickMeeting.bind(this)}
                                    icon="alpha-o-box-outline"
                                    size={50}
                                    color="#C12C1f"
                                    style={styles.listBoxImg}
                                />
                                <Text style={styles.listBoxText}>发起会议</Text>
                            </View>

                        </View>
                    </View>
                    {
                        this.state.meetingList && this.state.meetingList.length > 0 ? <FlatList
                            data={this.state.meetingList}
                            ItemSeparatorComponent={() => <View style={styles.separator} />}
                            renderItem={({ item, index }) => (
                                <SwipeableRow item={item} index={index} navigation={this.props.navigation} />
                            )}
                            keyExtractor={(item, index) => `message ${index}`}
                        /> : <NoData size="60" text="工程齿轮..." top='180' />

                    }

                    <Portal>
                        <FAB.Group
                            style={styles.fabGroupStyle}
                            fabStyle={{ backgroundColor: this.state.theme.color }}
                            open={this.state.isShowMore}
                            icon={this.state.isShowMore ? 'axis-arrow' : 'plus'}
                            visible={this.state.showHomeFabGroup}
                            color={'#FFF'}
                            actions={this.state.actions}
                            onStateChange={({ open }) => {
                                this.setState({ isShowMore: open })
                            }}
                        />
                    </Portal>
                    {
                        this.state.isShowScan && <Scan close={() => this.hideScan()} navigation={this.props.navigation} />
                    }

                </View >
            </DrawerLayout>
        )
    }

}

const styles = StyleSheet.create({
    drawerBox: {
        padding: 10,
        paddingLeft: 0,
        paddingRight: 0
    },
    drawerTitle: {
        fontSize: 16,
        paddingLeft: 20,
    },

    listTitle: {
        paddingTop: 4,
        paddingBottom: 4
    },
    separator: {
        backgroundColor: 'rgb(200, 199, 204)',
        height: StyleSheet.hairlineWidth,
    },
    fabGroupStyle: {
        paddingLeft: 50,
    },
    rectButton: {
        flex: 1,
        height: 80,
        paddingVertical: 10,
        paddingHorizontal: 20,
        justifyContent: 'space-between',
        flexDirection: 'column',
        backgroundColor: 'white',
    },

    list: {
        flexWrap: 'wrap',
        flexDirection: 'row',
        marginTop: 50,
        paddingLeft: VIEWPADDING,
        paddingRight: VIEWPADDING,
        borderBottomWidth: 0.5,
        borderStyle: "solid",
        borderBottomColor: "#dedede",
        paddingBottom: VIEWPADDING
    },
    listBox: {
        width: (width - VIEWPADDING * 2 - 40) / 4,
        marginRight: 10,
        marginBottom: 10,
        alignItems: 'center',
    },
    listBoxImg: {
        width: 50,
        height: 50,
    },

    listBoxText: {
        fontSize: 13,
        paddingTop: 0,
        textAlign: 'center'
    },
    headerLeftUser: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden'
    },
    headPortrait: {
        width: 40,
        height: 40,
    },
    userName: {
        height: 20,
        marginTop: 10,
        marginLeft: 10,
    },
    changeBtn: {
        height: 20,
        marginTop: 10,
        marginLeft: 10,
    },
    headerLeftBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingLeft: VIEWPADDING,
        paddingRight: VIEWPADDING,
        paddingTop: 20,
    },
    headerLeft: {
        flexDirection: 'row',
    },
    main: {
        backgroundColor: '#fff',
        height: '100%',
        flex: 1,
        paddingTop: 0
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 16,
      },

})

export default withTheme(Home)