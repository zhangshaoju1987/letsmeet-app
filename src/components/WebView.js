import React, { Component } from 'react';
import { WebView } from 'react-native-webview';
import { Dimensions, View, StyleSheet, Text } from 'react-native';
import { VIEWPADDING } from '../configs/index'
const { height, width } = Dimensions.get('window');
import Orientation from '@zhumi/react-native-orientation';
import { TouchableNativeFeedback } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function HookTopComponent() {
    const insets = useSafeAreaInsets();
  
    return <View style={{ paddingBottom: insets.top, backgroundColor: "#fff" }} />;
  }

export default class MyWebView extends Component {
    constructor(props) {
        super(props);
        this.state = {
            LANDSCAPEStyle: {},
            orientation: "",
        }
        console.log('MyWebView', this.props)
    }
    componentWillUnmount() {
        this.close()
        this.setState = (state, callback) => {
            return;
        }
    }
    _orientationDidChange = (orientation) => {
        let LANDSCAPEStyle = {};
        if (orientation === 'LANDSCAPE') {  //横屏
            LANDSCAPEStyle.width = Dimensions.get("window").width;
            LANDSCAPEStyle.height = Dimensions.get("window").height;
        } else {   //竖屏
        }
        this.setState({ orientation, LANDSCAPEStyle })
    }
    componentDidMount() {
        //Orientation.lockToLandscape();  //横屏
        Orientation.addOrientationListener(this._orientationDidChange);
    }
    close() {
        //Orientation.lockToPortrait() //竖屏
        console.log("WebView-close")
        this.props.close()
    }
    render() {
        let url = this.props.url;
        let title = this.props.title?this.props.title:"";
        let closeText = this.props.title?this.props.closeText:"";
        return (
            <View style={[styles.box, this.state.LANDSCAPEStyle]}>
                <HookTopComponent />
                <View style={styles.nav}>
                    <Text></Text>
                    <Text style={styles.text}>{title}</Text>
                    <TouchableNativeFeedback onPress={this.close.bind(this)}>
                        <Text style={styles.text}>{closeText}</Text>
                    </TouchableNativeFeedback>
                </View>
                <WebView source={{ uri: url }} style={{ width: '100%', height: '100%' }} />
            </View>
        );
    }
}
const styles = StyleSheet.create({
    box: {
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 9
    },
    nav: {
        paddingTop:VIEWPADDING/2,
        paddingBottom:VIEWPADDING/2,
        paddingLeft:VIEWPADDING,
        paddingRight:VIEWPADDING,
        backgroundColor:'#fff',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    text:{
        fontSize:15,
    }
});