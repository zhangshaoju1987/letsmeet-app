import React from 'react';
import { StyleSheet, View, Text, Dimensions, Animated } from 'react-native';
import Icon from "react-native-vector-icons/MaterialIcons";
import UserLogo from '../components/UserLogo';
const { width } = Dimensions.get('window');
import * as roomAction from '../actions/roomAction';
import { store } from "../store";
import { Badge } from 'react-native-paper';
import utils from "../utils/utils";
import { Touchable } from './Touchable';

export default class RoomFloatingBtnVideos extends React.Component {
    constructor(props) {
        super(props);
        this.state = { // 初始值的设置一定要正确一致，subscribe 只是发生变化的时候通知到监听的宿主，变化后注册的监听宿主是感知不到数值的，所以subscribe并不能代替初始值的设置
            consumerVideoStreams: this.props.consumerVideoStreams,
            roomBtnStatus: true,
            fullScreeenStream: null,
            open: false,
            scale: 1,
        }
        this._roomClient = props.roomClient;
    }
    componentWillUnmount() {
        // 重写setState防止状态在卸载后变化；这种方式最靠谱，存在各种无法预览的情况会使用setState在卸载后继续更改状态
        this.setState = ()=>{};
        this.unsubscribe();
        store.dispatch(roomAction.roomBtnStatus(true));

    }
    componentDidMount() {
        this.unsubscribe = store.subscribe(() => {
            const { consumerVideoStreams, roomBtnStatus, fullScreeenStream } = store.getState().room;
            this.setState({ consumerVideoStreams: utils.object2Array(consumerVideoStreams), roomBtnStatus, fullScreeenStream });
        });
    }
    hide() {
        if (!this.state.fullScreeenStream) {
            store.dispatch(roomAction.roomBtnStatus(true))
            store.dispatch(roomAction.roomMyStreamStatus(true))
        }
        this.setState({ open: false, });
    }
    show() {
        this.setState({ open: true, });
        store.dispatch(roomAction.roomBtnStatus(false))
        store.dispatch(roomAction.roomMyStreamStatus(false))
    }
    async screen(item) {
        item.videoType = 'video';
        this._roomClient.requestConsumerKeyFrame(item.consumer).catch(()=>{});
        store.dispatch(roomAction.setFullScreenStream(item));
        store.dispatch(roomAction.roomBtnStatus(false));
    }
    render() {
        const consumerVideoStreams = this.state.consumerVideoStreams;
        return (
            <View style={styles.all}>
                {
                !this.state.open && this.state.roomBtnStatus && consumerVideoStreams.length > 0 &&
                <View style={[styles.btnsBox]}>
                    <View style={[styles.btns,]}>
                        <Touchable onPress={this.show.bind(this)}>
                            <Icon
                                name={'videocam'}
                                size={30}
                                color='#767678'
                                style={{ margin: 8, margin: 8 }}

                            />
                        </Touchable>
                    </View>
                    <Badge style={styles.badgeStyle}>{consumerVideoStreams.length}</Badge>
                </View>
                }
                {
                this.state.open && consumerVideoStreams.length > 0 && 
                <View style={[styles.more]}>
                    <Touchable onPress={this.hide.bind(this)}>
                        <View style={{ width: '100%', height: '100%', justifyContent: 'center', }}></View>
                    </Touchable>
                    {
                    consumerVideoStreams && consumerVideoStreams.length > 0 && consumerVideoStreams.map((item, idx) => {
                        const displayName = item.consumer.appData.displayName
                        return (
                            <View style={{position:"absolute",top:240+idx*80,left:0}} key={idx}>
                                <Touchable onPress={this.screen.bind(this, item)}>
                                    <View style={[styles.listItem]}>
                                        <UserLogo size={32} userName={displayName} />
                                        <Text style={styles.listText}>{displayName}的视频</Text>
                                    </View>
                                </Touchable>
                        </View>
                        )
                    })
                    }
                </View>
                }
            </View>
        );
    }
}

const styles = StyleSheet.create({

    all: {
        height: '100%',
        position: 'absolute',
        left: 0,
        top: 0,
    },
    badgeStyle: {
        position: 'absolute',
        top: 0,
        right: 0
    },
    listText: {
        marginLeft: 10
    },
    listItem: {
        height: 50,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        backgroundColor: '#fff',
        borderWidth: 0.5,
        borderColor: '#dedede',
        borderTopRightRadius: 20,
        borderBottomRightRadius: 20,
        alignItems: 'center',
        paddingLeft: 10,
        marginTop: 5,
        overflow: 'hidden',
        width: width * 3 / 5,
    },
    more: {
        width: width,
        height: '100%',
        backgroundColor: '#EBEBEA',
        position: 'absolute',
        top: 0,
        left: 0,
    },
    
    btnsBox: {
        width: 50,
        position: 'absolute',
        top: '58%',
        left: 0,
    },
    btns: {
        width: 50,
        height: 50,
        position: 'absolute',
        top: 5,
        left: 0,
        backgroundColor: '#F6F6F6',
        borderTopRightRadius: 20,
        borderBottomRightRadius: 20,
    }
});