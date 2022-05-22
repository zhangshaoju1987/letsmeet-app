import HomeScreen from '../page/home/index';   //首页
import JoinMeetingScreen from '../page/meeting/joinMeeting';  //加入会议
import QuickMeetingScreen from '../page/meeting/quickMeeting';  //快速会议
import ReserveMeetingScreen from '../page/meeting/reserveMeeting';  //预约会议
import RemoteDesktopManagerScreen from '../page/remotedesktop/RemoteDesktopManager';  //远程桌面
import MeetingBillScreen from '../page/meeting/MeetingBill';  //会议账单页面
import MeetingScreen from '../page/meeting/meeting';  //开会中
import MeetingDetailsScreen from '../page/meeting/meetingDetails';  //会议详情
import MeetingHistoryScreen from '../page/meeting/meetingHistory';  //历史会议
import LoginScreen from '../page/login/login';  //登录
import UserIndexcreen from '../page/user/index';  //我的账户
import LicenseScreen from '../page/License';  //隐私协议
import ChargeJoemCoinScreen from '../page/user/ChargeJoemCoin';  //虚拟币充值页面
import ChargeJoemCoinIOSScreen from '../page/user/ChargeJoemCoinIOS';  //虚拟币充值页面

import MeetingUsersScreen from '../page/meeting/meetingUsers';  //参会人员
import SettingScreen from '../page/setting/index';  //设置

import NavigationService from './NavigationService';

export default {
    Home: {
        screen: HomeScreen,
        navigationOptions: {
            header:({navigation}) =>{
                let {state:{routes}} = navigation;
                console.log('===',routes)
                NavigationService.setRouters(routes, navigation);
                return null;
            }
        }  
    },
    MeetingBill:{
        screen: MeetingBillScreen
    },
    ChargeJoemCoin:{
        screen: ChargeJoemCoinScreen
    },
    ChargeJoemCoinIOS:{
        screen: ChargeJoemCoinIOSScreen
    },
    JoinMeeting: {
        screen: JoinMeetingScreen,
    },
    RemoteDesktopManager: {
        screen: RemoteDesktopManagerScreen,
    },
    QuickMeeting: {
        screen: QuickMeetingScreen,
    },
    ReserveMeeting: {
        screen: ReserveMeetingScreen,
    },
    Meeting: {
        screen: MeetingScreen,
    },
    License:{
        screen:LicenseScreen
    },
    MeetingDetails: {
        screen: MeetingDetailsScreen,
    },
    MeetingHistory: {
        screen: MeetingHistoryScreen,
    },
    Login: {
        screen: LoginScreen,
    },
    User: {
        screen: UserIndexcreen,
    },
    meetingUsers: {
        screen: MeetingUsersScreen,
    },
    Setting: {
        screen:SettingScreen
    }

}