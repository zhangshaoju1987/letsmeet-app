import React from 'react'
import {StyleSheet,View } from 'react-native'

import { VIEWPADDING } from '../../configs/index';

import { store } from "../../store";
import {notify} from "../../actions/requestActions";


export default class ReserveMeeting extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            userName: '秦浩智',
            meetNumber: "",
            value3:false
        }
    }
    toHome() {
        this.props.navigation.navigate('Home')
    }
    save() {
        store.dispatch(notify({text:"预约成功"}));
    }
    componentWillUnmount() {
        //console.log("reserveMeeting.js->unmount");
    }
    render() {
        return (
            <View style={styles.main}>
               

            </View>
        )
    }

}
const styles = StyleSheet.create({
    main: {
        height: 1000,
        backgroundColor: '#fff'
    },
    content: {
        paddingLeft: VIEWPADDING,
        paddingRight: VIEWPADDING,
        paddingTop: 15,
        backgroundColor: '#fff'
    },
    list: {
        height: 50,
        borderBottomWidth: 0.5,
        borderStyle: "solid",
        borderBottomColor: "#dedede",
        paddingTop:5,
        paddingBottom:5,
        backgroundColor:'#fff',
        paddingRight:VIEWPADDING,
        paddingLeft:VIEWPADDING,
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
