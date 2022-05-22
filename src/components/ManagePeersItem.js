import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import UserLogo from '../components/UserLogo'
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { store } from "../store";
import { notify } from "../actions/requestActions";
import { TouchableRipple } from 'react-native-paper';


export default class ManagePeersItem extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            item: {},
            consumerScreenStreams: null,
            consumerAudioStreams: null,
            theme:{}
        }

        this.props.item && (this.state.item = this.props.item)
    }
    async consumerClick(consumer,type) {
        consumer = (consumer && consumer[0] ? consumer[0].consumer : '');
        let str = (type=='audio') ? '音频' : '视频'
        if (!consumer) {
            store.dispatch(notify({ text: "对方未开启" + str }));
            return;
        }
        if (consumer.appData.source == 'webcam') {
            store.dispatch(notify({ text: "暂不支持，敬请期待" }));
            return
        }

        if(!consumer.locallyPaused && !consumer.remotelyPaused){
            this.props.room.consumerPause(consumer)
        }else if(!consumer.locallyPaused && consumer.remotelyPaused){
            store.dispatch(notify({ text: "对方未开启" + str }));
        }else{
            this.props.room.consumerResume(consumer);
        }
        
    }
    shouldComponentUpdate(nextProps, nextState){

        return true
    }
    getThemeColor(){
        const { theme } = store.getState().setting;
        this.setState({
            theme
        })
    }
    componentDidMount() {
        this.getThemeColor()
        this.unsubscribe = store.subscribe(() => {
            const { consumerVideoStreams, consumerAudioStreams } = store.getState().room;
            try {
                this.setState({ consumerVideoStreams: consumerVideoStreams ? [...consumerVideoStreams.values()] : [] });
                this.setState({ consumerAudioStreams: consumerAudioStreams ? [...consumerAudioStreams.values()] : [] });
            } catch (e) {

            }
            this.getThemeColor()

        })
    }
    componentWillUnmount() {
        this.unsubscribe();
    }
    render() {
        const item = this.state.item;
        let volumes = (this.state.consumerAudioStreams && this.state.consumerAudioStreams.filter((item1, index) => { return item1.consumer._appData.peerId == item.id }));
        let videos = (this.state.consumerVideoStreams && this.state.consumerVideoStreams.filter((item1, index) => { return item1.consumer._appData.peerId == item.id }));
        const PRESENTER = this.props.room ? this.props.room._hasPermission(item.id, 'PRESENTER') : false;
        const My = this.props.room ? this.props.room.isMy(item.id) : false;
        return (
            <View style={styles.rectButton}>
                <View style={styles.managePeersListBox} >
                    <UserLogo size={35} userName={item.displayName} />
                    <View style={styles.managePeersListUserInfo}>
                        <View style={styles.managePeersListUserInfoLeft}>
                            <Text style={[styles.managePeersListUserInfoText, { lineHeight: PRESENTER || My ? 17 : 35 }]}>{item.displayName}</Text>
                            {
                                PRESENTER ? <Text style={[styles.managePeersListUserInfoText, styles.textGray]}>发起者</Text> :
                                    (My ? <Text style={[styles.managePeersListUserInfoText, styles.textGray]}>我自己</Text> : <Text></Text>)
                            }

                        </View>
                        {
                            !My && 
                            <View style={styles.managePeersListUserInfoAction}>
                                <TouchableRipple style={{height:25,marginRight: 20}} onPress={this.consumerClick.bind(this, volumes,'audio')} rippleColor="rgba(95,155,45,0.4)">
                                    <Icon
                                        name={(volumes && volumes[0] && !volumes[0].consumer.locallyPaused && !volumes[0].consumer.remotelyPaused) ? 'volume-high' : 'volume-off'}
                                        size={25}
                                        color={this.state.theme.color}
                                    />
                                </TouchableRipple>
                                <TouchableRipple style={{height:25}} onPress={this.consumerClick.bind(this, videos,'video')} rippleColor="rgba(95,155,45,0.4)">
                                    <Icon
                                        name={(videos && videos[0] && !videos[0].consumer.locallyPaused && !videos[0].consumer.remotelyPaused) ? 'video' : 'video-off'}
                                        size={25}
                                        color={this.state.theme.color}
                                    />
                                </TouchableRipple>
                            </View>
                        }
                        

                    </View>

                </View>
            </View>

        );
    }
}

const styles = StyleSheet.create({
    rectButton: {
        flex: 1,
    },
    managePeersListBox: {
        width: '100%',
        flexWrap: "wrap",
        flexDirection: 'row',
        justifyContent: 'flex-start',
        backgroundColor: '#fff',
        paddingTop: 15,
    },
    managePeersListUserInfoText: {
        fontSize: 13,
    },
    managePeersListUserInfoAction: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
    },
    managePeersListUserInfoLeft: {
        height: 35,
        marginLeft: 10
    },

    managePeersListUserInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flex: 1,
        borderBottomColor: '#dedede',
        borderBottomWidth: 0.5,
    },
    textGray: {
        color: '#b5b5b5',
        fontSize: 12
    },
})