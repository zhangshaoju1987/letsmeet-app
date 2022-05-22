import React from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import Icon from "react-native-vector-icons/MaterialIcons";
import UserLogo from '../components/UserLogo';
import * as roomAction from '../actions/roomAction';
import { store } from "../store";
import { Badge } from 'react-native-paper';
import utils from "../utils/utils";
import { Touchable } from './Touchable';

const { width } = Dimensions.get('window');
export default class RoomFloatingBtnScreenShare extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            consumerScreenStreams: this.props.consumerScreenStreams,
            roomBtnStatus: true,
            fullScreeenStream: null,
            open: false
        }
        this._roomClient = props.roomClient;
    }
    componentWillUnmount() {
        // 重写setState防止状态在卸载后变化
		//console.log('RoomFloatingBtnScreenShare----componentWillUnmount');
        this.setState = ()=>{};
        this.unsubscribe();
        store.dispatch(roomAction.roomBtnStatus(true));

    }
    componentDidMount() {
        //console.log('RoomFloatingBtnScreenShare----componentDidMount');
        this.unsubscribe = store.subscribe(() => {
            const { consumerScreenStreams, roomBtnStatus, fullScreeenStream } = store.getState().room;
            this.setState({ consumerScreenStreams: utils.object2Array(consumerScreenStreams), roomBtnStatus, fullScreeenStream });
        });
    }
    /**
     * 注意ios,android对于事件穿透的默认处理不一样，最好从设计层面进行避免
     */
    hide() {
        if (!this.state.fullScreeenStream) {
            store.dispatch(roomAction.roomBtnStatus(true));
            store.dispatch(roomAction.roomMyStreamStatus(true));
        }
        this.setState({ open: false, });
    }
    /**
     * 展开显示多个屏幕分享列表
     */
    show() {
        this.setState({ open: true});
        store.dispatch(roomAction.roomBtnStatus(false));
        store.dispatch(roomAction.roomMyStreamStatus(false));
    }
    /**
     * 显示某一个用户的屏幕分享
     * @param {*} item 
     */
    screen(item) {
        item.videoType = 'screen';
        item.isAutoRotate = true;
        this._roomClient.requestConsumerKeyFrame(item.consumer).catch(()=>{});
        store.dispatch(roomAction.setFullScreenStream(item));
        store.dispatch(roomAction.roomBtnStatus(false));
    }

    render() {
        const consumerScreenStreams = this.state.consumerScreenStreams;
        return (
            <View style={styles.all}>
                {/* 屏幕共享内容 */}
                {
                !this.state.open && this.state.roomBtnStatus && consumerScreenStreams.length > 0 &&
                <View style={[styles.btnsBox]}>
                    <View style={[styles.btns,]}>
                        <Touchable onPress={this.show.bind(this)}>
                            <Icon
                                name={'laptop'}
                                size={30}
                                color='#767678'
                                style={{ margin:8 }}
                            />
                        </Touchable>
                    </View>
                    <Badge style={styles.badgeStyle}>{consumerScreenStreams.length}</Badge>
                </View>
                }
                {
                this.state.open && consumerScreenStreams.length > 0 && 
                <View style={[styles.more]} >
                    <Touchable onPress={this.hide.bind(this)}>
                        <View style={{ width: '100%', height: '100%', justifyContent: 'center', }}></View>
                    </Touchable>
                    {
                    consumerScreenStreams && consumerScreenStreams.length > 0 && consumerScreenStreams.map((item, idx) => {
                        const displayName = item.consumer.appData.displayName
                        return (
                            <View style={{position:"absolute",top:340+idx*80,left:0}} key={idx}>
                                <Touchable onPress={this.screen.bind(this, item)}>
                                    <View style={[styles.listItem]}>
                                        <UserLogo size={32} userName={displayName} />
                                        <Text style={styles.listText}>{displayName}的屏幕分享</Text>
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
        top: '68%',
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
})