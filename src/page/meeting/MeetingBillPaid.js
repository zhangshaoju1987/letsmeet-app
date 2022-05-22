import React from 'react';
import { StyleSheet, ScrollView,RefreshControl} from 'react-native';
import NoData from '../../components/NoData';
import { store } from "../../store";
import { notify } from "../../actions/requestActions";
import Icon from "react-native-vector-icons/MaterialIcons";
import * as settingsActions from "../../actions/settingsActions";
import { Card, Paragraph,Avatar } from 'react-native-paper';
import http from '../../services/axios';


const LeftContent = props => <Avatar.Icon {...props} icon="cash-plus" />

/**
 * 未支付的会议账单
 */
export default class MeetingBillPaid extends React.Component {

    constructor(props){
        super();
        this.state = {
            theme: store.getState().setting.theme,
            billList:[]        }
    }


    componentWillUnmount() {
        
    }

    queryPageData(){
        const { token } = store.getState().user;
        let data = {
            queryType: "my_meeting_bills",
            queryParams: JSON.stringify({ token: encodeURI(token),billStatus:"paid" })
        }

        http.get('/meeting/user/query', data,"meeting")
            .then((res)=>{
                if (res.code && res.code.startsWith("S")) {  //成功
                    let list = res.result.list;
                    this.setState({
                        billList: list,
                    });
                }
            });  
    }
    componentDidMount() {
        store.dispatch(settingsActions.setShowHomeFabGroup(false));
        this.queryPageData();
    }
    copyFlowNo(flowNo){

    }
    render() {

        return (
                <ScrollView style={styles.container}  contentContainerStyle={styles.content}>
                    {
                        this.state.billList && this.state.billList.map((item, idx) => {
                            return (
                                <Card style={styles.card} key={idx}>
                                    <Card.Title title={item.bill_remark} subtitle="已支付" left={LeftContent} />
                                    <Card.Content>
                                        <Paragraph>账单时间 : {item.create_time}</Paragraph>
                                        <Paragraph>账单金额 : {item.amount}元</Paragraph>
                                        <Paragraph>支付通道 : {item.pay_channel === "alipay"?"支付宝":item.pay_channel === "joemeet"?"竹米":"微信"}</Paragraph>
                                        <Paragraph>支付时间 : {item.paid_time}</Paragraph>
                                        <Paragraph>
                                            交易流水 : {item.pay_flow}  
                                        </Paragraph>
                                    </Card.Content>
                                </Card>
                            )
                        })
                    }
                    {
                        !this.state.billList && <NoData size="60" text="没有历史账单" top='180' />
                    }
                    
                </ScrollView>
        )
    }
}

const styles = StyleSheet.create({
    main: {
        backgroundColor: '#fff'
    },
    cardItem:{
        marginTop:'2em'
    },
    container: {
        padding: 1,
    },
    content: {
        padding: 4,
    },
    card: {
        margin: 6,
        borderRadius:12,
        borderBottomWidth:1,
        borderTopWidth:1,
        borderBottomColor:store.getState().setting.theme.color,
        borderTopColor:store.getState().setting.theme.color
    }
})