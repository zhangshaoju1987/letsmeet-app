import React from 'react';
import { PersistGate } from 'redux-persist/lib/integration/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Notifications from "./components/Notifications";
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { Provider } from 'react-redux';
import appScreen from './navigator/appScreen';  //界面
import navigatorConfig from './navigator/navigatorConfig'; //跳转配置
import * as userAction from './actions/userAction';
import * as settingsActions from "./actions/settingsActions";
import { createAppContainer } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';
import { registerGlobals } from '@zhumi/react-native-webrtc';
import { store, persistor } from './store';
import { Platform,NativeModules } from 'react-native';
import NavigationService from './navigator/NavigationService';
import VIForegroundService from '@voximplant/react-native-foreground-service';
import { LinkRegistCenterClient } from './utils/LinkRegistCenterClient';


registerGlobals();
Platform.OS === "ios" && NativeModules.InCallManager.addListener('Proximity');
Platform.OS === "ios" && NativeModules.InCallManager.addListener('WiredHeadset');

startAndroidForegroundService();
global.linkRegistCenterClient = new LinkRegistCenterClient(); // 将链路注册中心客户端添加到全局（全局只要有一个就行了）

/**
    initialRouteName: 设置默认的页面组件，必须是上面已注册的页面组件
    initialRouteParams: 初始路由的参数
    navigationOptions: 屏幕导航的默认选项
    initialRouteKey: 初始路由的可选标识符
    paths: 用来设置支持schema跳转时使用
 */
const AppNavigator = createStackNavigator(appScreen, navigatorConfig);
const AppContainer = createAppContainer(AppNavigator);



/**
   * 仅用于安卓，作用是让通话在用户切换app到后台后仍然能够保持
   */
async function startAndroidForegroundService() {
  if (Platform.OS !== 'android') {
    return;
  }
  if (Platform.Version >= 26) {
    const channelConfig = {
      id: 'ForegroundServiceChannel',
      name: 'Notification Channel',
      description: 'Notification Channel for Foreground Service',
      enableVibration: false,
      importance: 2
  };
  await VIForegroundService.createNotificationChannel(channelConfig);
}
  const notificationConfig = {
    id: 3456,
    title: 'Foreground Service',
    text: 'Foreground service is running',
    icon: 'ic_notification',
    priority: 0
  };
  if (Platform.Version >= 26) {
    notificationConfig.channelId = 'ForegroundServiceChannel';
  }
  await VIForegroundService.startService(notificationConfig);
  console.log("Android申请后台服务成功(通话保持服务)");
}
const getStateForActionScreensStack = AppNavigator.router.getStateForAction;
AppNavigator.router = {
  ...AppNavigator.router,
  getStateForAction(action, state) {

    // if ((action.type == 'Navigation/BACK' || action.type == 'Navigation/NAVIGATE') && state && state.routes) {
    //   console.log("action.type=" + action.type + ";路由栈：" + JSON.stringify(state.routes));
    // }
    if (action.type == 'Navigation/BACK') {

      const len = state.routes.length;
      const last = len - 1; // 最后一个路由
      if (len >= 2) {
        console.log('检测到返回：从', state.routes[last].routeName, "返回到 ", state.routes[last - 1].routeName);
        if (Platform.OS === "android") {
          routerdefend(state.routes[last].routeName);
        }
      } else { // 路由栈只有一个的时候，一般是回到首页了
        routerdefend(state.routes[len - 1].routeName)
      }

    } else if (action.type == 'Navigation/NAVIGATE') {
      //console.log("检测到进入页面：", action.routeName);
      routerdefend(action.routeName)
    }
    return getStateForActionScreensStack(action, state);
  },
};

const routerdefend = (routeName) => {
  switch (routeName) {
    case 'Home':
      // ！！！对于监听的store的属性，一定要和store保持一致(一定要dispatch出去)，不能仅仅通过this.setState在当前组件内进行更改，否则容易造成全局数据共享不一致的问题，而且很难排查
      store.dispatch(settingsActions.setShowHomeFabGroup(true));
      break;

    default:
      break;
  }
  store.dispatch(userAction.setCurrentPage(routeName))
}


// 解决文本框莫名其妙白屏的问题
const theme = {
  ...DefaultTheme,
  roundness: 2,
  colors: {
    ...DefaultTheme.colors,
    primary: '#3498db',
    accent: '#f1c40f',
  },
  webThemes: [
    {
      color: '#5AA4AE',
      name: '天水碧'
    },
    {
      color: '#4F794A',
      name: '芰荷'
    },
    {
      color: '#B37745',
      name: '琵琶荷'
    },
    {
      color: '#2775B6',
      name: '景泰蓝'
    },
    {
      color: '#87C0CA',
      name: '西子'
    },
    {
      color: '#EAE5E3',
      name: '玉瓶子'
    },
    {
      color: '#F8BC31',
      name: '杏黄'
    },
    {
      color: '#E2C2CF',
      name: '藕荷'
    },
    {
      color: '#71779B',
      name: '花青'
    }
  ]

};

export default class App extends React.Component {
  render() {
    return (
      <Provider store={store}>
        <PersistGate persistor={persistor} >
          <PaperProvider theme={theme}>
            <Notifications />
            <SafeAreaProvider>
              <AppContainer ref={navigatorRef => {NavigationService.setTopLevelNavigator(navigatorRef)}} />
            </SafeAreaProvider>
          </PaperProvider>
        </PersistGate>
      </Provider>
    );
  }
}