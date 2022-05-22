import React from 'react';
import { Dimensions,StyleSheet,Platform,Linking,AppState,View} from 'react-native';
import { Card, Paragraph,Avatar,Title,ActivityIndicator,Button,IconButton,Colors } from 'react-native-paper';
import Slider from '@react-native-community/slider';
import { store } from "../../store";
import { notify } from "../../actions/requestActions";
import HeadNav from '../../components/HeadNav'
import Alipay from '@uiw/react-native-alipay';
import http from '../../services/axios';
import * as settingsActions from "../../actions/settingsActions";


const LeftContentDesc = props => <Avatar.Icon {...props} icon="remote-desktop" />
const LeftContentPay = props => <Avatar.Icon {...props} icon="cash-plus" />
/**
 * 竹米充值页面
 */
export default class ChageJoemCoin extends  React.Component{
    constructor(props){
        super(props);
        this.state = {
          coinNumber:50,
          currentCoinNumber:0,
          price:1,
          showDesc:true,
          loading:false
        };
        //this.alipayAppId = "2021002142612513";
        this.alipayAppId = "2021002148651172"; // 公司账号
        this.alipayGateway = `https://service.zhumi.space:12321/alipay/${this.alipayAppId}`;
        this.payStatus = "init";
        this.out_trade_no = null;
        this.subject = "subject003";
    }

    toHome() {
        store.dispatch(settingsActions.setShowHomeFabGroup(true));
        this.props.navigation.navigate('Home');
    }
    /**
     * 查询服务状态
     * 1. 界面初始化查询
     * 2. 支付成功查询
     */
     queryService(){
        http.get("/user/account/info",
          {
              token:store.getState().user.token,
          },"meeting").then((res)=>{
              const currentCoinNumber  = res.result.accountInfo.balance;
              this.setState({
                  currentCoinNumber
              });
          });
    }
    async goPay() {
        
        if(this.state.coinNumber <= 1){
            store.dispatch(notify({text:"购买数量不能为0"}));
            return;
        }
        this.setState({loading:true});
        console.info("清理上一次状态数据");
        this.payStatus = "init";
        this.out_trade_no = "";
        this.payAmount = 0;

        // 
        const totalAmount = (this.state.coinNumber*this.state.price).toFixed(2);
        this.payAmount = totalAmount;
        const body = this.state.coinNumber+"粒竹米";
        const {phone} = store.getState().user;
        try {
            
            const params0 = `totalAmount=${totalAmount}&subject=${this.subject}&body=${body}&mobile=${phone}&osType=${Platform.OS}`;
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
                    this.paySuccessCallback();
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
     * 支付成功后调用
    */
    paySuccessCallback(){
        console.log("支付成功，重新初始化界面");
        http.get("/main/account/charge",
        {
          token:store.getState().user.token,
          outTradeNo:this.out_trade_no,
          amount: this.payAmount
        },"joemeet_client").then((res) => {
            this.queryService();
            this.setState({loading:false});
        });
      }
      componentDidMount() {
        Alipay.setAlipayScheme('alipay'+this.alipayAppId);
        this.sub1 = AppState.addEventListener('change', this._handleAppStateChange);
        this.queryService();
      }
      componentWillUnmount(){
        // 绑定的监听器！！！一定要取消！！！，否则会出现很多重复监听
        this.setState = ()=>{};
        this.sub1?.remove();
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
                  this.paySuccessCallback();
                }else{
                  this.setState({loading:false});
                  store.dispatch(notify({text: "支付未成功，如有疑问请联系官方客服"})); // 处理业务逻辑
                }
              }
            },500);
            
          });
        }
      }
      render(){
  
          return (
  
            <View style={styles.container}  contentContainerStyle={styles.content}>
                <HeadNav title='充值购买' leftPrass={() => this.toHome()} />
                <Card>
                  <Card.Title title="充值购买" subtitle="购买竹米" left={LeftContentPay} />
                  <Card.Content>
                    <Title>购买竹米</Title>
                    <Paragraph>
                      滑动设置购买数量（粒）
                    </Paragraph>
                    <Slider
                      style={{width: Dimensions.get('window').width*0.8, height: 60}}
                      value={this.state.coinNumber}
                      step={20}
                      minimumValue={0}
                      maximumValue={200}
                      minimumTrackTintColor="#79b7a5"
                      maximumTrackTintColor="#daa9a9"
                      onValueChange={value =>{
                        this.setState({coinNumber: parseInt(value)});
                      }}
                    />
                    <Paragraph>
                      购买数量（粒）：{this.state.coinNumber}
                    </Paragraph>
                    <Paragraph>
                      当前数量（粒）：{this.state.currentCoinNumber}
                    </Paragraph>
                    <Paragraph>
                      订单金额（元）：{(this.state.coinNumber*this.state.price).toFixed(2)}
                    </Paragraph>
                  </Card.Content>
                  <Card.Actions style={{marginTop:10}}>
                    <Button icon="cash-plus" mode="contained" onPress={() => this.goPay()}>
                      使用支付宝支付：{(this.state.coinNumber*this.state.price).toFixed(2)}元
                    </Button>
                    <IconButton
                        style={{marginLeft:30}}
                        icon="cloud-question"
                        color={Colors.green100}
                        size={20}
                        onPress={() => {
                          this.setState({showDesc:!this.state.showDesc})
                        }}
                      />
                  </Card.Actions>
                </Card>
                {this.state.loading && <ActivityIndicator animating={true} size='large' color='#F8BC31' />}
                {this.state.showDesc && <Card style={{marginTop:30}}>
                  <Card.Title title="服务申明" subtitle="服务条款" left={LeftContentDesc} />
                  <Card.Content>
                    <Paragraph>
                      1. 1 粒竹米大概等效于 1 RMB
                    </Paragraph>
                    <Paragraph>
                      2. 目前竹米主要用于抵扣会议产生的账单费用和远程桌面费用
                    </Paragraph>
                    <Paragraph>
                      3. 建议个人用户一次购买花费不要超过50元；因为退款，提现等流程还不完善
                    </Paragraph>
                    <Paragraph>
                      4. 可以通过微信公众号joe_fertile_land，联系我们
                    </Paragraph>
                    <Paragraph>
                      5. 可以通过邮件joemeet.12@gmail.com，联系我们
                    </Paragraph>
                  </Card.Content>
                  <Card.Content>
                    <Title>服务最终解释权</Title>
                    <Paragraph>
                      深圳余亩荞麦数字科技有限公司
                    </Paragraph>
                  </Card.Content>
                </Card>
                }
              </View>
              
          );
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
        padding: 0,
    },
    content: {
        padding: 4,
    },
    card: {
        margin: 6,
        borderRadius:12,
        borderBottomWidth:1,
        borderBottomColor:store.getState().setting.theme.color
    }
  });