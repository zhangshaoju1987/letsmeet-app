import * as React from 'react';
import { StyleSheet, Dimensions,View } from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import RemoteDesktop from "./RemoteDesktop";
import HeadNav from '../../components/HeadNav';
import RemoteDesktopChargeBill from "./RemoteDesktopChargeBill";
import * as settingsActions from "../../actions/settingsActions";
import { store } from "../../store";

const FirstRoute = () => (<RemoteDesktop></RemoteDesktop>);
const SecondRoute = () => (<RemoteDesktopChargeBill></RemoteDesktopChargeBill>);

const renderScene = SceneMap({
    first: FirstRoute,
    second: SecondRoute,
});
const initialLayout = { width: Dimensions.get('window').width };

/**
 *  远程桌面付费页面
 */
export default class RemoteDesktopManager extends React.Component {

    constructor(props){
        super();
    }
    toHome() {
        store.dispatch(settingsActions.setShowHomeFabGroup(true));
        this.props.navigation.navigate('Home');
    }
    render(){

        return (
            <View style={styles.main}>
                <HeadNav title='远程桌面' leftPrass={() => this.toHome()} />
                <TabView
                    tabBarPosition="bottom"
                    renderTabBar={
                        (props)=> (
                                <TabBar
                                    {...props}
                                    indicatorStyle={{ backgroundColor: 'green' }}
                                    style={{ backgroundColor: store.getState().setting.theme.color}}
                                />
                            )
                    }
                    navigationState={{ index:0, routes:[
                        { key: 'first', title: '我的桌面设备' },
                        { key: 'second', title: '服务升级' },
                    ] }}
                    renderScene={renderScene}
                    onIndexChange={(idx)=>{
                        this.setState({index:idx});
                    }}
                    initialLayout={initialLayout}
                />
            </View>
        );
    }
}

const styles = StyleSheet.create({
    main: {
        backgroundColor: '#fff',
        height: '100%',
        flex: 1,
        paddingTop: 0
    },
    scene: {
      flex: 1,
    },
  });