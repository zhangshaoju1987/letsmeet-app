import React from 'react';
import { StyleSheet, Text, View, ActivityIndicator} from 'react-native';
import { store } from "../store";
import { Avatar } from 'react-native-paper';


export default class RoomStatus extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            roomStatus: ''
        }
    }

    componentWillUnmount() {
        console.log('componentWillUnmount.RoomStatus')
        this.unsubscribe();
    }
    shouldComponentUpdate(nextProps, nextState) {
        if ((nextState.roomStatus != this.state.roomStatus)) {
            return true;
        }
        return false
    }

    componentDidMount() {
        this.unsubscribe = store.subscribe(() => {
            const { roomStatus } = store.getState().room;
            this.setState({
                roomStatus
            })
        })
    }


    streamControlAnimate() {

    }

    render() {
        let roomStatusMap = {
            text:'',
            color:''
        }; 
        const roomStatus = this.state.roomStatus;
        if (roomStatus === 'connecting') {
            roomStatusMap.text = '连接中'
            roomStatusMap.color = '#ce1f1f'
        } else if (roomStatus === 'reconnecting') {
            roomStatusMap.text = '断开重连中'
            roomStatusMap.color = '#ce1f1f'
        } else if (roomStatus === 'meeting') {
            roomStatusMap.text = '会议中'
            roomStatusMap.color = '#30bd18'
        } else if (roomStatus === 'finished') {
            roomStatusMap.text = '已结束'
            roomStatusMap.color = '#ce1f1f'
        } else {
            roomStatusMap.text = '未开始'
            roomStatusMap.color = '#b7e20a'
        }
        console.log('render',roomStatusMap)
        return (
            <View style={styles.roomStatusBox}>
                {
                  (roomStatus == 'connecting'  || roomStatus == 'reconnecting' )? 
                  <ActivityIndicator color={roomStatusMap.color} /> :
                  <Avatar.Text size={15} label="" style={[{ backgroundColor: roomStatusMap.color}]} />
                  
                }
    
                
                <Text style={styles.textContent}>{roomStatusMap.text}</Text>
            </View>

        );
    }
}

const styles = StyleSheet.create({
    roomStatusBox: {
        width: 80,
        flexDirection: 'row',
        alignItems: 'center',
        marginTop:5
    },
    textContent: {
        color: '#fff',
        fontSize: 15,
        marginLeft: 5
    }
})