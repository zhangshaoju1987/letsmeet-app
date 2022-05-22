import React from 'react';
import { StyleSheet, Image, Dimensions ,View, Text,} from 'react-native';
import { TouchableNativeFeedback } from 'react-native-gesture-handler';
import { VIEWPADDING } from '../../configs/index';
import utils from '../../utils/utils';
import http from '../../services/axios';
import { store } from "../../store";
import { notify } from "../../actions/requestActions";
import HeadNav from '../../components/HeadNav';
import * as settingsActions from "../../actions/settingsActions";

const { height } = Dimensions.get('window');

export default class MeetingDetails extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            pickedOption: '',
            showCustom: false,
            meeintId: "",
            pageDate: {},
            isShowPeers: false
        }
        this.state.meeintId = this.props.navigation.state.params.meeintId;
        if (this.state.meeintId) {
            this.getInfo();
        } else {
            store.dispatch(notify({text : "未获取到会议号"}));
        }

    }
    toHome() {
        store.dispatch(settingsActions.setShowHomeFabGroup(true));
        this.props.navigation.goBack()
    }
    pickOption(index) {
        // this.setState({
        //     pickedOption: index,
        // });
        if (index != 'cancel') {
            store.dispatch(notify({text : "敬请期待"}));
        }

    }
    async getInfo() {
        const { token } = store.getState().user;
        let data = {
            queryType: "meeting_detail",
            queryParams: JSON.stringify({ token: encodeURI(token), meetingRecordId: this.state.meeintId })
        }
        const res = await http.get('/meeting/user/query', data, "meeting");

        //console.log("res=", res, "data=", data)
        if (res.code && res.code.startsWith("S")) {  //成功
            // 处理会议时长
            let pageDate = res.result.object;
            if (pageDate.start_time && pageDate.end_time) {
                pageDate.meeting_times = utils.getDateDiff(pageDate.start_time, pageDate.end_time, 'minute') + '分钟'
            }

            this.setState({
                pageDate
            })
        }
    }
    hideShowPeers = () => {
        this.setState({ showDialog: false });
    };
    async toMeetingPeers() {
        this.props.navigation.navigate('meetingUsers', {
            meeintId: this.state.meeintId 
        })
        
    }
    async test() {
        store.dispatch(notify({text : "敬请期待"}));
    }

    componentDidMount() {
        store.dispatch(settingsActions.setShowHomeFabGroup(false));
    }

    componentWillUnmount() {
       
        //console.log("joinDetail.js->unmount");
    }
    render() {
        return (
            <View style={styles.main}>
                <HeadNav title='会议详情' leftPrass={() => this.toHome()} />
                <View style={styles.section}>
                    <View style={styles.list}>
                        <Text>{this.state.pageDate.meeting_name}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.list}>
                        <Text>会议开始时间</Text>
                        <Text style={styles.listRight}>{this.state.pageDate.start_time}</Text>
                    </View>
                    <View style={styles.list}>
                        <Text>会议结束时间</Text>
                        <Text style={styles.listRight}>{this.state.pageDate.end_time || '会议进行中'}</Text>
                    </View>
                    {
                        this.state.pageDate.meeting_times && (
                            <View style={styles.list}>
                                <Text>累计参会时长</Text>
                                <Text style={styles.listRight}>{this.state.pageDate.meeting_times}</Text>
                            </View>
                        )
                    }

                    <View style={styles.list}>
                        <Text>会议号</Text>
                        <Text style={styles.listRight}>{this.state.pageDate.meeting_no}</Text>
                    </View>
                    <View style={styles.list}>
                        <Text>发起人</Text>
                        <Text style={styles.listRight}>{this.state.pageDate.sponsor}</Text>
                    </View>
                    <TouchableNativeFeedback onPress={this.toMeetingPeers.bind(this)}>
                        <View style={styles.list}>
                            <Text>参会人员</Text>
                            <Image
                                style={styles.rightIcon}
                                source={require('../../assets/images/right2.png')}
                            />
                        </View>
                    </TouchableNativeFeedback>
                    <TouchableNativeFeedback onPress={this.test.bind(this)}>
                        <View style={styles.list}>
                            <Text>云录制</Text>
                            <Image
                                style={styles.rightIcon}
                                source={require('../../assets/images/right2.png')}
                            />
                        </View>
                    </TouchableNativeFeedback>
                    <TouchableNativeFeedback onPress={this.test.bind(this)}>
                        <View style={styles.list}>
                            <Text>会议文档</Text>
                            <Image
                                style={styles.rightIcon}
                                source={require('../../assets/images/right2.png')}
                            />
                        </View>
                    </TouchableNativeFeedback>
                </View>

            </View >
        )
    }

}
const styles = StyleSheet.create({
    peersScrollView: {
        width: '100%',
        height: '100%',
    },
    peers: {
        width: '100%',
        height: '100%',
        backgroundColor: '#fff',
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        overflow: 'hidden'
    },
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

