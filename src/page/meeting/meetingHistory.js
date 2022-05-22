import React from 'react';
import {StyleSheet, View, Text, FlatList} from 'react-native';
// import { FlatList } from 'react-native-gesture-handler';
import MeetingItem from '../../components/MeetingItem';
import MeetingItemSwipeableRow from '../../components/MeetingItemSwipeableRow';

import http from '../../services/axios';
import { store } from "../../store";
import * as settingsActions from "../../actions/settingsActions";
import HeadNav from '../../components/HeadNav';
import { HEADERHEIGHT } from '../../configs/index';
const SwipeableRow = ({ item, index, navigation }) => {
    return (
        <MeetingItemSwipeableRow item={item}>
            <MeetingItem item={item} navigation={navigation} />
        </MeetingItemSwipeableRow>
    );
};

export default class MeetingHistory extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            pickedOption: "",
            meetingList: [],
            // 下拉刷新
            isRefresh: false,
        }

        this.getMeetingList();
    }
    async getMeetingList() {
        //console.log('-----------------')
        const { token } = store.getState().user;
        let data = {
            queryType: "meeting_history_joined",
            queryParams: JSON.stringify({ token: encodeURI(token) })
        }
        const res = await http.get('/meeting/user/query', data, "meeting");
        if (res.code && res.code.startsWith("S")) {  //成功
            let list = res.result.list;
            this.setState({
                meetingList: list
            })
        }
    }
    pickOption(index) {
        this.setState({
            pickedOption: index,
        });
    }
    toHome() {
        store.dispatch(settingsActions.setShowHomeFabGroup(true));
        this.props.navigation.navigate('Home')
    }
    componentWillUnmount() {
        //console.log("meetingHistory.js->unmount");
    }
    

    /**
     * 空布局
     */
    _createEmptyView() {
        return (
            <View style={{ height: '100%', alignItems: 'center', justifyContent: 'center' ,paddingTop:50}}>
                <Text style={{ fontSize: 14 }}>
                    暂无数据
                </Text>
            </View>
        );
    }

    render() {
        return (
            <View>
                <HeadNav title='最近的会议' leftPrass={() => this.toHome()} />

                <FlatList
                    data={this.state.meetingList}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    renderItem={({ item, index }) => (
                        <SwipeableRow item={item} index={index} navigation={this.props.navigation} />
                    )}
                    keyExtractor={(item, index) => `message ${index}`}
                    style={{ marginBottom: HEADERHEIGHT }}
                    // 空布局
                    ListEmptyComponent={this._createEmptyView}
                    //下拉刷新相关
                    onRefresh={() => this.getMeetingList()}
                    refreshing={this.state.isRefresh}
                />

            </View >
        )
    }

}

const styles = StyleSheet.create({
    separator: {
        backgroundColor: 'rgb(200, 199, 204)',
        height: StyleSheet.hairlineWidth,
    }

})

