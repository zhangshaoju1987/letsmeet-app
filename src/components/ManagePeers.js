import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { VIEWPADDING } from '../configs/index';
import { FlatList } from 'react-native-gesture-handler';
import { store } from "../store";
import { notify } from "../actions/requestActions";
import ManagePeersItem from '../components/ManagePeersItem';
import ManagePeersItemSwipeableRow from '../components/ManagePeersItemSwipeableRow';
import { Touchable } from './Touchable';
const SwipeableRow = ({ item, index, room,roomId }) => {
    return (
        <ManagePeersItemSwipeableRow item={item} index={index} room={room} roomId={roomId}>
            <ManagePeersItem item={item} index={index} room={room} roomId={roomId} />
        </ManagePeersItemSwipeableRow>
    );
};
export default class ManagePeers extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selectPeer: "",
            peers: [],
            muteAll: false,
            peersChange:false
        }
        const { peers, muteAll } = store.getState().room;

        this.state.peers = JSON.parse(JSON.stringify(peers));

        this.state.muteAll = muteAll;

        this.$room = this.props.room;
    }

    /**
     * 用来减少组件的不必要刷新，做的按需刷新
     * @param {*} nextProps 
     * @param {*} nextState 
     */
    shouldComponentUpdate(nextProps, nextState) {
        return true
    }


    muteAllPeers() {
        this.$room.muteAllPeers();
        store.dispatch(notify({ text: "操作成功" }));
    }

    componentWillUnmount() {
        this.setState = ()=>{};
        this.unsubscribe();
    }
    componentDidMount() {
        this.unsubscribe = store.subscribe(() => {
            this.setState({
                muteAll: store.getState().room.muteAll,
                peers: JSON.parse(JSON.stringify(store.getState().room.peers)),
            })
        })
    }

    render() {
        const showPeers =  this.state.peers;
        return (
            
            <View style={[styles.managePeers]}>
                <View style={styles.managePeersHead}>
                    <Text style={styles.managePeersHeadText}>其他参会人员({this.state.peers && this.state.peers.length}人)</Text>
                </View>
                <View style={[styles.managePeersList]}>
                    <FlatList
                        data={showPeers}
                        room={this.$room}
                        renderItem={({ item, index }) => (
                            <SwipeableRow roomId={this.props.roomId} item={item} index={index} room={this.$room} />
                        )}
                        keyExtractor={(item, index) => `message ${index}`}
                    />
                </View>
                {
                    this.props.roomId == store.getState().user.meetingNo &&
                    <View style={styles.managePeersAllBtn}>
                        <Touchable onPress={this.muteAllPeers.bind(this)}>
                            <Text style={styles.managePeersAllBtnText}>全体静音</Text>
                        </Touchable>
                    </View>
                }
            </View>
        )
    }
}

const styles = StyleSheet.create({

    managePeersAllBtnTextOff: {
        textDecorationLine: 'line-through'
    },
    managePeersAllBtnText: {
        color: '#8BC53D',
        fontSize: 16
    },
    managePeersAllBtn: {
        paddingLeft: 15,
        paddingRight: 15,
        paddingBottom: 30,
        flexDirection: 'row',
        justifyContent: 'space-between',
        bottom: 10,
        backgroundColor: '#fff'
    },
    managePeersList: {
        height: 515,
        paddingBottom: 20
    },
    
    managePeersHeadClose: {
        position: 'absolute',
        top: 20,
        right: 0,
    },
    managePeersHeadText: {
        textAlign: 'center',
        fontSize: 18,
    },
    managePeersHead: {
        height:60,
        paddingTop: 20,
        paddingBottom: 10,
        position: 'relative'
    },
    managePeers: {
        width: '100%',
        backgroundColor: '#fff',
        bottom: 0,
        left: 0,
        paddingLeft: VIEWPADDING,
        paddingRight: VIEWPADDING,
    },
})