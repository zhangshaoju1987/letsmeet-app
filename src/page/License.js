
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import HeadNav from '../components/HeadNav';

export default class License extends React.Component {

    constructor(props){
        super(props);
    }

    loginPage(){
        this.props.navigation.navigate('Login');
    }
    render(){

        return (<View style={styles.main}>
            <HeadNav title='隐私协议' leftPrass={() => this.loginPage()} />
            <WebView source={{ uri: "https://www.joemeet.com/privacy/privacy.html" }} style={{ width: '100%', height: '100%' }} />
        </View>);
        
    }
}
const styles = StyleSheet.create({
    main: {
        backgroundColor: '#fff',
        height: '100%'
    }
})
