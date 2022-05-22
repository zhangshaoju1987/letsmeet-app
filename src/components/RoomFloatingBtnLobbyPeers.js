import React from 'react';
import { StyleSheet, View, Text, Dimensions, Animated, Easing } from 'react-native';
import { TouchableNativeFeedback } from 'react-native-gesture-handler';
import Icon from "react-native-vector-icons/MaterialIcons";
import UserLogo from '../components/UserLogo';
const { width, height } = Dimensions.get('window');
import * as roomAction from '../actions/roomAction';
import { store } from "../store";
import { Badge } from 'react-native-paper';
import { RoomClient } from '../utils/RoomClient'
import { notify } from '../actions/requestActions';

export default class RoomFloatingBtnLobbyPeers extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            lobbyPeer: [],
            roomBtnStatus: true,
            backdrop: new Animated.Value(0),
            open: false,
            scale: 1,
        }

    }
    componentWillUnmount() {
        this.hide()
        this.unsubscribe();
    }
    shouldComponentUpdate(nextProps, nextState) {
        return true;
    }
    componentDidMount() {
        this.unsubscribe = store.subscribe(() => {
            const { lobbyPeer, roomBtnStatus } = store.getState().room;
            try {
                this.setState({ lobbyPeer: [...lobbyPeer.values()], roomBtnStatus });
                
            } catch (e) {

            }
        });
    }
    hide() {
        store.dispatch(roomAction.roomBtnStatus(true))
        store.dispatch(roomAction.roomMyStreamStatus(true))
        this.animatedAction(false, this.state.scale)
    }
    show() {
        this.setState({ open: true, })
        store.dispatch(roomAction.roomBtnStatus(false))
        store.dispatch(roomAction.roomMyStreamStatus(false))
        this.animatedAction(true, this.state.scale)
    }
    animatedAction(open, scale) {
        this.state.lobbyPeer.map((item, index) => {
            this['AnimateList' + index] = new Animated.Value(open ? 0 : 1);
        });
        if (open) {
            Animated.parallel([
                Animated.timing(this.state.backdrop, {
                    toValue: 1,
                    duration: 250 * scale,
                    useNativeDriver: true,
                }),
                Animated.stagger(
                    200 * scale,
                    this.state.lobbyPeer.map((item, index) =>
                        Animated.timing(this['AnimateList' + index], {
                            toValue: 1,
                            duration: 200 * scale,
                            useNativeDriver: true,
                        })
                    )
                ),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(this.state.backdrop, {
                    toValue: 0,
                    duration: 150 * scale,
                    useNativeDriver: true,
                }),
            ]).start(() => { this.setState({ open: false, }) });
        }
    }
    addPeer(item) {
        console.log('addPeer', item)
        RoomClient.promoteLobbyPeer(item.peerId)
    }
    removePeer(item) {
        console.log('removePeer', item)
        store.dispatch(notify({ text: "敬请期待" }))
    }
    allOut(){
        store.dispatch(notify({ text: "敬请期待" }))
    }
    allPromote(){
        RoomClient.promoteAllLobbyPeers()
    }
    render() {
        const showMore = this.state.open;
        const lobbyPeer = this.state.lobbyPeer;
        // console.log('render -- RoomFloatingBtn', lobbyPeer)
        const backdropOpacity = showMore ? this.state.backdrop.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 1, 1],
        }) : this.state.backdrop;

        return (
            <View style={styles.all}>
                {
                    !showMore && this.state.roomBtnStatus && lobbyPeer.length > 0 ?
                        <View style={[styles.btnsBox, { height: 80 }]}>
                            <View style={[styles.btns,]}>
                                <TouchableNativeFeedback onPress={this.show.bind(this)}>
                                    <Icon
                                        name={'group-add'}
                                        size={30}
                                        color='#767678'
                                        style={{ marginLeft: 8, marginTop: 8 }}

                                    />
                                </TouchableNativeFeedback>
                            </View>
                            <Badge style={styles.badgeStyle}>{lobbyPeer.length}</Badge>
                        </View> : <View></View>
                }
                {
                    showMore && lobbyPeer.length > 0 ? <Animated.View style={[styles.more, { opacity: backdropOpacity }]}>

                        <View style={{ width: '100%', height: '100%', justifyContent: 'center', }}>
                            <View>
                                {
                                    lobbyPeer && lobbyPeer.length > 0 && lobbyPeer.map((item, idx) => {
                                        return (
                                            <Animated.View style={[styles.list, { opacity: this['AnimateList' + idx] }]} key={idx}>
                                                <View style={styles.listPart}>
                                                    <UserLogo size={32} userName={item.displayName} />
                                                    <Text style={styles.listText}>{item.displayName}</Text>
                                                </View>
                                                <View style={styles.listPart}>
                                                    <TouchableNativeFeedback onPress={this.addPeer.bind(this, item)}>
                                                        <Icon
                                                            name={'person-add'}
                                                            size={25}
                                                            color='#767678'
                                                        />
                                                    </TouchableNativeFeedback>
                                                    <TouchableNativeFeedback onPress={this.removePeer.bind(this, item)}>
                                                        <Icon
                                                            name={'person-remove'}
                                                            size={25}
                                                            color='#767678'
                                                            style={{ marginLeft: 15, marginRight: 5 }}
                                                        />
                                                    </TouchableNativeFeedback>
                                                </View>

                                            </Animated.View>
                                        )
                                    })
                                }
                            </View>
                            <View style={styles.bottomBtn}>
                                <TouchableNativeFeedback onPress={this.allOut.bind(this)}>
                                    <Text>全部踢出</Text>
                                </TouchableNativeFeedback>
                                <TouchableNativeFeedback onPress={this.allPromote.bind(this)}>
                                    <Text>全部允许加入会议</Text>
                                </TouchableNativeFeedback>
                                <TouchableNativeFeedback onPress={this.hide.bind(this)}>
                                    <Text>关闭</Text>
                                </TouchableNativeFeedback>
                            </View>
                        </View>

                    </Animated.View> : <View></View>
                }

            </View>
        );
    }
}

const styles = StyleSheet.create({
    badgeStyle: {
        position: 'absolute',
        top: 0,
        right: 0,
        zIndex: 10
    },
    listText: {
        marginLeft: 10,
        lineHeight: 32,
    },
    bottomBtn: {
        width: '100%',
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        position: 'absolute',
        bottom: 0,
        left: 0,
        zIndex: 100
    },
    listPart: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
    },
    list: {
        height: 50,
        width: width * 3 / 5,
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        borderWidth: 0.5,
        borderColor: '#dedede',
        borderTopRightRadius: 20,
        borderBottomRightRadius: 20,
        alignItems: 'center',
        paddingLeft: 10,
        marginTop: 5,
        overflow: 'hidden',
    },
    all: {
        width: 1,
        height: '100%',
        position: 'absolute',
        left: 0,
        top: 0,
        zIndex: 1
    },
    btns: {
        width: 50,
        height: 50,
        position: 'absolute',
        top: 5,
        left: 0,
        zIndex: 9,
        backgroundColor: '#F6F6F6',
        borderTopRightRadius: 20,
        borderBottomRightRadius: 20,
    },
    btnsBox: {
        width: 55,
        position: 'absolute',
        top: '46%',
        left: 0,
        zIndex: 9,
    },
    more: {
        width: width,
        height: height,
        backgroundColor: '#EBEBEA',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 99,
    }

})