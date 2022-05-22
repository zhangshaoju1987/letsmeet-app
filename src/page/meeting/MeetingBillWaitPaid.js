import React from 'react';
import { StyleSheet, ScrollView, Platform,Linking,AppState} from 'react-native';
import { Button } from 'react-native-paper';
import NoData from '../../components/NoData';
import { store } from "../../store";
import { notify } from "../../actions/requestActions";
import * as settingsActions from "../../actions/settingsActions";
import { Card, Paragraph,Avatar } from 'react-native-paper';
import http from '../../services/axios';
import Alipay from '@uiw/react-native-alipay';



const LeftContent = props => <Avatar.Icon {...props} icon="cash-plus" />

/**
 * 未支付的会议账单
 */
export default class MeetingBillWaitPaid extends React.Component {

    constructor(props){
        super();
        this.state = {
            theme: store.getState().setting.theme,
            billList:[],
            loading:false
        }
        this.alipayAppId = "2021002148651172"; // 公司账号
        this.alipayGateway = `https://service.joemeet.com:12321/alipay/${this.alipayAppId}`;
    }

    async goPay(billId,amount,remark) {
        this.setState({loading:true});
        console.info("清理上一次状态数据");
        this.payStatus = "init";
        this.out_trade_no = "";
        this.billId = billId;
        const body = remark;
        const {phone} = store.getState().user;
        try {
          const params0 = `totalAmount=${amount}&subject=subject002&body=${body}&mobile=${phone}&osType=${Platform.OS}`;
          const url = `${this.alipayGateway}/pay_order?${params0}`;
          const data = await http.getWithParams(url);
          if(!data.code || data.code.startsWith("E")){
            this.setState({loading:false});
            store.dispatch(notify({ type:"error",text: data.message}));
            return;
          }
          this.out_trade_no = data.out_trade_no; // 商户后台返回的交易号
          const payInfo = data.order_info;       // 商户后台返回的订单信息，用于调用支付宝的支付功能
          //console.log("生成的订单：",payInfo);
          
          // 开始调用支付宝（异步）
          Alipay.alipay(payInfo).then((result) => {
            let seller_id = "";
            let trade_no = "";
            if(result.resultStatus === "9000"){
              this.payStatus = "success";
              store.dispatch(notify({text: "支付成功"}));
              const response = JSON.parse(result.result); // 注意：这是一个json字符串，要特殊处理
              seller_id = response.alipay_trade_app_pay_response.seller_id;
              trade_no =  response.alipay_trade_app_pay_response.trade_no;
              // 支付成功了更新业务数据
              this.paySuccessCallback(billId,"alipay");
            }else{
              this.payStatus = "fail";
              store.dispatch(notify({text: result.memo}));
            }
            // 将支付结果同步给商户后台
            const params = `outTradeNo=${this.out_trade_no}&status=${result.resultStatus}&message=${result.memo}&sellerId=${seller_id}&tradeNo=${trade_no}`;
            http.getWithParams(`${this.alipayGateway}/sync_pay_status?${params}`);
            this.setState({loading:false});
          });// 支付宝调用结束
  
        } catch (error) {
          this.setState({loading:false});
          store.dispatch(notify({type:"error",text: error.message}));
          console.log('alipay:error-->>>', error);
        }
    }
    /**
     * 支付成功后调用，处理业务逻辑
     */
     paySuccessCallback(billId,payChannel){
        console.log("会议账单："+billId+"支付成功，重新初始化界面");
        http.get("/meeting/user/set",
        {
            setType:"pay_success",
            setParams:JSON.stringify({
                token:store.getState().user.token,
                billId,
                payChannel,
                outTradeNo:this.out_trade_no
            })
        },"meeting").then((res) => {
          this.queryPageData();
          this.setState({loading:false});
        });
      }

    componentWillUnmount() {
        this.setState = ()=>{}
        this.sub1?.remove();
    }

    queryPageData(){
        //console.log('首页开始获取会议数据')
        const { token } = store.getState().user;
        //console.log(token);
        let data = {
            queryType: "my_meeting_bills",
            queryParams: JSON.stringify({ token: encodeURI(token),billStatus:"init" })
        }

        http.get('/meeting/user/query', data,"meeting")
            .then((res)=>{
                if (res.code && res.code.startsWith("S")) {  //成功
                    let list = res.result.list;
                    //console.log(list);
                    this.setState({
                        billList: list
                    });
                }
            });  
    }
    componentDidMount() {
        store.dispatch(settingsActions.setShowHomeFabGroup(false));
        Alipay.setAlipayScheme('alipay'+this.alipayAppId);
        this.sub1 = AppState.addEventListener('change', this._handleAppStateChange);
        this.queryPageData();
    }
    // 切换app，一般ios上app状态会从active->inactive->background
    _handleAppStateChange = (nextAppState) => {
      //console.log('nextAppState:', nextAppState)
      if(nextAppState === 'active'){
        Linking.getInitialURL().then(res => {
          setTimeout(async () => {
            if(this.out_trade_no && this.payStatus === "init"){ // ios用户使用了系统切换，导致常规方式获取不到支付结果，需要借助于查询

              console.log("由于使用了系统切换，没能收到支付结果，需要进行查询：",this.out_trade_no);
              const params = `outTradeNo=${this.out_trade_no}`;
              const data = await http.getWithParams(`${this.alipayGateway}/trade_query?${params}`);
              if(data.code === "SQ0001" && data.tradeStatus === "success"){
                this.payStatus = "success";
                store.dispatch(notify({text: "支付成功"})); // TODO 处理业务逻辑
                this.paySuccessCallback(this.billId,"alipay");
              }else{
                this.setState({loading:false});
                store.dispatch(notify({text: "支付未成功，如有疑问请联系官方客服"})); // 处理业务逻辑
              }
            }
          },500);
          
        });
      }
    }

    /**
     * 使用竹米支付
     */
    async goPayWithJoem(billId,amount,remark){
      // 判断余额是否足够
      const res = await http.get("/user/account/info",{token:store.getState().user.token},"meeting");
      const currentCoinNumber  = res.result.accountInfo.balance;
      if(currentCoinNumber < parseFloat(amount)){
        store.dispatch(notify({type:"error",text: "竹米数量["+currentCoinNumber+"]不足以支付该订单\n请回到首页，点击右下方的+号悬浮按钮完成充值"})); // 处理业务逻辑
        return;
      }
      store.dispatch(notify({text: "支付成功"}));
      this.paySuccessCallback(billId,"joemeet");
    }

    access(){
        store.dispatch(notify({ text: "访问电脑" }));
    }
    render() {

        return (
                <ScrollView style={styles.container}  contentContainerStyle={styles.content}>
                    {
                        this.state.billList && this.state.billList.map((item, idx) => {
                            return (
                                <Card style={styles.card} key={idx}>
                                    <Card.Title title={item.bill_remark} subtitle="待支付" left={LeftContent} />
                                    <Card.Content>
                                        <Paragraph>账单时间 : {item.create_time}</Paragraph>
                                        <Paragraph>账单金额 : {item.amount}元</Paragraph>
                                    </Card.Content>
                                    <Card.Actions>
                                        {
                                          Platform.OS === "android" &&
                                          <Button onPress={()=>{this.goPay(item.id,item.amount,item.bill_remark);}}>支付宝支付:{item.amount}元</Button>
                                        }
                                        {
                                          Platform.OS === "ios" &&
                                          <Button onPress={()=>{this.goPayWithJoem(item.id,item.amount,item.bill_remark);}}>使用竹米购买:{item.amount}</Button>
                                        }
                                    </Card.Actions>
                                </Card>
                            )
                        })
                    }
                    {
                        !this.state.billList && <NoData size="60" text="没有要支付的账单..." top='180' />
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
        borderBottomColor:"#EA5514",
        borderTopColor:"#B2B6B6"
    }
})