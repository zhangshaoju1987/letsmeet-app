import React from 'react';
import { StyleSheet, Dimensions, ScrollView, View, Text,  } from 'react-native';
import { VIEWPADDING } from '../../configs/index';

import http from '../../services/axios'
import { store } from "../../store";
import {notify} from "../../actions/requestActions";
import HeadNav from '../../components/HeadNav'
const { height, } = Dimensions.get('window');

export default class MeetingUsers extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            pickedOption: '',
            showCustom: false,
            meeintId: "",
            pageDate: [],
            isShowPeers: false
        }
        this.state.meeintId = this.props.navigation.state.params.meeintId;
        if (this.state.meeintId) {
            this.getInfo()
        } else {
            store.dispatch(notify({text : "未获取到会议号"}));
        }

    }
    toHome() {
        this.props.navigation.navigate('MeetingDetails', {
            meeintId: this.state.meeintId
        })
    }

    async getInfo() {
        const { token } = store.getState().user;
        let data = {
            queryType: "peers_in_lobby",
            queryParams: JSON.stringify({ token: encodeURI(token), meetingRecordId: this.state.meeintId })
        }
        const res = await http.get('/meeting/user/query', data, "meeting");

        //console.log("res=", res, "data=", data)
        if (res.success) {  //成功
            let pageDate = res.result.list;
            //console.log("list", pageDate)
            this.setState({pageDate});
        }
    }
    componentWillUnmount() {
        //console.log("meeetingUsers.js->unmount");
    }

    render() {
        return (
            <View style={styles.main}>
                <HeadNav title='参会人员' leftPrass={() => this.toHome()} />
                <ScrollView >
                    <View style={styles.section}>
                        {
                            this.state.pageDate.map((item, idx) => {
                                return (
                                    <View style={styles.list} key={idx}>
                                        <Text>{item.user_display_name}</Text>
                                        <Text style={styles.listRight}>{item.join_time}</Text>
                                    </View>
                                )
                            })
                        }


                    </View>
                </ScrollView>

            </View >
        )
    }

}
const styles = StyleSheet.create({

    rightIcon: {
        width: 20,
        height: 20
    },
    main: {
        backgroundColor: '#f5f5f5',
        height: height,
    },
    listRight: {
        color: '#a2a2a2'
    },
    list: {
        paddingTop: 12,
        paddingBottom: 12,
        paddingLeft: VIEWPADDING,
        paddingRight: VIEWPADDING,
        borderBottomWidth: 0.5,
        borderStyle: "solid",
        borderBottomColor: "#eee",
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#fff'
    },
    section: {
        marginBottom: 10,
    }
})

