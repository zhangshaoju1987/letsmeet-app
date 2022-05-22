import React from 'react';
import { StyleSheet,Text } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';

export default class MeetingItem extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            item: {}
        }

        this.props.item && (this.state.item = this.props.item)
    }
    toMeetingDetails(item) {
        //console.log("选中的会议=", item);
        if(!this.props.navigation){
            console.log("导航信息缺失");
            return;
        }
        this.props.navigation.navigate('MeetingDetails', {
            meeintId: item.uuid_meeting
        });
    }
    componentWillUnmount() {
        //console.log("MeetingItem.js->unmount");
    }
    render() {
        const item = this.state.item;
        return (
            <RectButton style={styles.rectButton} onPress={() => {this.toMeetingDetails(item);}}>
                <Text style={styles.listInfo}>会议号：{item.meeting_no}</Text>
                <Text style={styles.listInfo}>会议名：{item.meeting_name}</Text>
                <Text style={styles.listInfo}>入会时间：{item.join_time}    发起人：{item.sponsor}</Text>
           </RectButton>

        );
    }
}

const styles = StyleSheet.create({
    rectButton: {
        flex: 1,
        height: 80,
        paddingVertical: 10,
        paddingHorizontal: 20,
        justifyContent: 'space-between',
        flexDirection: 'column',
        backgroundColor: 'white',
      },
    listTitle: {
        paddingTop: 4,
        paddingBottom: 4
    },
    listInfo: {
        fontSize: 13,
        color: '#a2a2a2'
    }
})