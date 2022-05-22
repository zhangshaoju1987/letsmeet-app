import React from 'react';
import { Dimensions,ScrollView,StyleSheet,Platform,Linking,AppState} from 'react-native';
import { Card, Paragraph,Avatar,Title,ActivityIndicator,Button,IconButton,Colors } from 'react-native-paper';
import Slider from '@react-native-community/slider';
import { store } from "../../store";
import { notify } from "../../actions/requestActions";
import moment from "moment";
import Alipay from '@uiw/react-native-alipay';
import http from '../../services/axios';




const LeftContentDesc = props => <Avatar.Icon {...props} icon="remote-desktop" />
const LeftContentPay = props => <Avatar.Icon {...props} icon="cash-plus" />

/**
 *  远程桌面付费页面
 */
 export default class RemoteDesktopChargeBill extends React.Component {

    constructor(props){
        super();
        this.state = {
          payDays:1,
          price:2.4,
          nowValidDate:null,
          willValidDate:null,
          showDesc:false,
          loading:false
        };
        //this.alipayAppId = "2021002142612513";
        this.alipayAppId = "2021002148651172"; // 公司账号
        this.alipayGateway = `https://service.joemeet.com:12321/alipay/${this.alipayAppId}`;
        this.payStatus = "init";
        this.out_trade_no = null;
    }
    async goPay() {
      this.setState({loading:true});
      console.info("清理上一次状态数据");
      this.payStatus = "init";
      this.out_trade_no = "";
      const totalAmount = (this.state.payDays*this.state.price).toFixed(2);
      const body = this.state.payDays+"天远程桌面服务";
      const {phone} = store.getState().user;
      try {
        const params0 = `totalAmount=${totalAmount}&subject=subject001&body=${body}&mobile=${phone}&osType=${Platform.OS}`;
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
      http.get("/remotedesktop/account/touch",
      {
        token:store.getState().user.token,
        expireDay:this.state.willValidDate.format("YYYY-MM-DD HH:mm:ss"),
        outTradeNo:this.out_trade_no
      },"remote_desktop").then((res) => {
        this.queryService();
        this.setState({loading:false});
      });
    }

    /**
     * 查询服务状态
     * 1. 界面初始化查询
     * 2. 支付成功查询
     */
    queryService(){
      http.get("/remotedesktop/account/service",
                  {
                    token:store.getState().user.token,
                  },"remote_desktop").then((res)=>{
                      const nowDay  = moment(res.result.object.expire_date,"YYYY-MM-DD");
                      const willDay = moment(res.result.object.expire_date,"YYYY-MM-DD").add(this.state.payDays,"d");
                      this.setState({
                        nowValidDate:nowDay,
                        willValidDate:willDay
                      });
                  });
    }
    componentDidMount() {
      Alipay.setAlipayScheme('alipay'+this.alipayAppId);
      this.sub1 = AppState.addEventListener('change', this._handleAppStateChange);
      // 查询当前的套餐情况
      console.log("查询当前的远程桌面套餐情况");
      this.queryService();
    }
    componentWillUnmount(){
      // 绑定的监听器！！！一定要取消！！！，否则会出现很多重复监听
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
    /**
     * 使用竹米支付
     */
    async goPayWithJoem(){
      // 判断余额是否足够
      const amount = this.state.payDays*this.state.price;
      const res = await http.get("/user/account/info",{token:store.getState().user.token},"meeting");
      const currentCoinNumber  = res.result.accountInfo.balance;
      if(currentCoinNumber < parseFloat(amount)){
        store.dispatch(notify({type:"error",text: "竹米数量["+currentCoinNumber+"]不足以支付该订单\n请回到首页，点击右下方的 + 号悬浮按钮完成充值"})); // 处理业务逻辑
        return;
      }
      console.log("使用竹米进行支付");
      http.get("/remotedesktop/account/touchByJome",
      {
        token:store.getState().user.token,
        expireDay:this.state.willValidDate.format("YYYY-MM-DD HH:mm:ss"),
        amount
      },"remote_desktop").then((res) => {
        store.dispatch(notify({type:"info",text: "支付成功，感谢您的支持"})); // 处理业务逻辑
        this.queryService();
        this.setState({loading:false});
      });
    }
    render(){

        return (

          <ScrollView style={styles.container}  contentContainerStyle={styles.content}>
              
              <Card>
                <Card.Title title="支付订单" subtitle="创建支付订单" left={LeftContentPay} />
                <Card.Content>
                  <Title>创建支付订单</Title>
                  <Paragraph>
                    滑动设置天数（默认1天）
                  </Paragraph>
                  <Slider
                    style={{width: Dimensions.get('window').width*0.8, height: 60}}
                    minimumValue={1}
                    step={1}
                    maximumValue={15}
                    minimumTrackTintColor="#79b7a5"
                    maximumTrackTintColor="#daa9a9"
                    onValueChange={value =>{
                      const days = parseInt(value);
                      const nowDay = this.state.nowValidDate.clone();// 复制一个出来（否则原始数据会被修改）
                      const willDay = nowDay.add(days,"d");
                      this.setState({payDays: days,willValidDate:willDay});
                    }}
                  />
                  <Paragraph>
                    单天价格（元）：{this.state.price}
                  </Paragraph>
                  <Paragraph>
                    续期天数（天）：{this.state.payDays}
                  </Paragraph>
                  <Paragraph>
                    订单金额（元）：{(this.state.payDays*this.state.price).toFixed(2)}
                  </Paragraph>
                  <Paragraph>
                    当前时效（截）：{this.state.nowValidDate && this.state.nowValidDate.format("YYYY-MM-DD")}
                  </Paragraph>
                  <Paragraph>
                    续期时效（截）：{this.state.willValidDate && this.state.willValidDate.format("YYYY-MM-DD")}
                  </Paragraph>
                </Card.Content>
                <Card.Actions style={{marginTop:10}}>

                {
                  Platform.OS === "android" &&
                  <Button icon="cash-plus" mode="contained" onPress={() => this.goPay()}>使用支付宝支付：{(this.state.payDays*this.state.price).toFixed(2)}元</Button>
                }
                {
                  Platform.OS === "ios" &&
                  <Button icon="cash-plus" mode="contained" onPress={() => this.goPayWithJoem()}>使用竹米购买：{(this.state.payDays*this.state.price).toFixed(2)}</Button>
                }
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
              {this.state.showDesc && <Card style={{marginTop:20}}>
                <Card.Title title="桌面服务说明" subtitle="服务条款" left={LeftContentDesc} />
                <Card.Content>
                  <Title>服务说明</Title>
                  <Paragraph>
                    1. 桌面访问服务需要付费。1 粒竹米=1元RMB
                  </Paragraph>
                  <Paragraph>
                    2. 付费方式：{this.state.price}元/天（视运营成本，可能会有波动）
                  </Paragraph>
                  <Paragraph>
                    3. 建议使用时再按需付费，不要过度充值
                  </Paragraph>
                  <Paragraph>
                    4. 过度充值，即便不使用，也不会退款
                  </Paragraph>
                  <Paragraph>
                    5. 付款成功后，在服务有效期内，无任何限制
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
            </ScrollView>
            
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
      padding: 1,
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
})