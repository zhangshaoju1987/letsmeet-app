import React from 'react';
import { View,StyleSheet,ScrollView} from 'react-native';
import { Card, Paragraph,Avatar,Button,Portal,Modal,ActivityIndicator,Text } from 'react-native-paper';
import { store } from "../../store";
import HeadNav from '../../components/HeadNav'
import http from '../../services/axios';
import * as settingsActions from "../../actions/settingsActions";
import { notify } from "../../actions/requestActions";
import RNIap, {purchaseErrorListener,purchaseUpdatedListener} from 'react-native-iap';
import APP from "../../../app.json";
const LeftContent = props => <Avatar.Icon {...props} icon="cash-plus" />
/**
 * 竹米充值页面（ios必须使用app内支付）
 */
export default class ChageJoemCoinIOS extends  React.Component{
    constructor(props){
        super(props);
        this.state = {
          loading:false,
          products:[],
          connected:false,
          transactionStarting:false,
          fetchingProducts:false,
          loadingText:"",
        };
        this.itemSKUs = [
          "joemeet_6_coins",
          "joemeet_25_coins",
          "joemeet_50_coins",
        ]
        // 当前选择的产品
        this.selectedProductId = null;

    }

    /**
     * 将凭证信息传给服务器
     * @param {String} productId 
     * @param {String} transactionId 
     * @param {String} receipt 
     * @returns 
     */
    async paySuccess(productId,transactionId,receipt){

      const amount = parseFloat(productId.replace("joemeet_","").replace("_coins",""));
      return new Promise((resolve,reject)=>{
        http.get("/main/account/charge",
        {
          token:store.getState().user.token,
          outTradeNo:transactionId,
          amount,
          payChannel:"joemeet",
          receipt
        },"joemeet_client")
        .then((res) => {
            resolve(res);
        });
      });
    }

    componentWillUnmount(){
      // 一定要取消监听，否则会重复消费
      if (this.purchaseUpdateSubscription) {
        this.purchaseUpdateSubscription.remove();
        this.purchaseUpdateSubscription = null;
      }
      if (this.purchaseErrorSubscription) {
        this.purchaseErrorSubscription.remove();
        this.purchaseErrorSubscription = null;
      }
    }
    async componentDidMount(){

      console.log("从appStore加载商品列表");
      this.setState({loadingText:"正在获取商品列表...",fetchingProducts:true});
      products = await RNIap.getProducts(this.itemSKUs);
      products.sort((a1,a2)=>{ // 由于appstore上面顺序不好定制，这里手动按价格排下序
        return parseFloat(a1.price) > parseFloat(a2.price)
      });
      console.log("缓存到本地",APP.version);
      store.dispatch(settingsActions.setIosJoemProducts(APP.version,products));
      this.setState({products,fetchingProducts:false});
      //console.log("获取到的商品信息",products);
      RNIap.initConnection().then(() => { // 绑定交易监听器
        
        this.setState({connected:true}); // 和applePay成功建立连接
        // 绑定一个正常监听器
        this.purchaseUpdateSubscription = purchaseUpdatedListener((purchase) => {
          //console.log('交易监听器', purchase);
          const receipt = purchase.transactionReceipt; // apple 的票据
          if (receipt) { // receipt 是一大串加密的代码，需要基于这个进行校验
            // 同步票据到服务器（一定要同步成功，整笔交易才算完成）
            // 一般获取到票据，说明apple端已经交易成功了
            this.paySuccess(purchase.productId,purchase.transactionId,purchase.transactionReceipt).then( async (res) => {
              if (res.code.startsWith("S")) {
                console.log("通知appleStore交易完成");
                await RNIap.finishTransactionIOS(purchase.transactionId);
              } else {
                // 重试或者判断是否有欺诈行为
              }
              this.setState({transactionStarting:false});
            });
          }
        });
        // 绑定一个错误监听器
        this.purchaseErrorSubscription = purchaseErrorListener((error) => {
          console.log("purchaseErrorSubscription",error);
          store.dispatch(notify({text:error.message}));
        });
      })
    }

    toHome() {

      if(this.state.transactionStarting){
        store.dispatch(notify({text:"正在等待交易结果,请勿退出",type:"error"}));
        return;
      }
      store.dispatch(settingsActions.setShowHomeFabGroup(true));
      this.props.navigation.navigate('Home');
    }
    async goPay(productId){
      if(!this.state.connected){
        store.dispatch(notify({text:"applePay 还未初始化成功，请稍后再试",type:"error"}));
        return;
      }
      this.selectedProductId = productId;
      this.setState({transactionStarting:true,loadingText:"正在等待交易结果..."});
      RNIap.requestPurchase(productId).catch((err)=>{
        console.log("applePay请求支付出现错误",err,productId);
        this.setState({transactionStarting:false});
      });
      
    }
    render(){
  
        return (
  
            <View style={styles.container}>
              {// Portal 是一种独立于当前视图的布局，位置不会受前后的元素的影响
                (this.state.fetchingProducts || this.state.transactionStarting) &&
                <Portal>
                  <Modal visible={this.state.fetchingProducts || this.state.transactionStarting}>
                      <ActivityIndicator animating={true} size="large"></ActivityIndicator>
                  </Modal>
                </Portal>
              }
              <HeadNav title='充值购买' leftPrass={() => this.toHome()} />
              <ScrollView style={styles.container}>
                {
                    this.state.products && this.state.products.map((item, idx) => {
                      return (
                          <Card style={styles.card} key={idx} onPress={()=>{this.goPay(item.productId);}}> 
                              <Card.Title title="购买竹米" subtitle="在线充值" left={LeftContent} />
                              <Card.Content>
                                  <Paragraph>购买 {item.title}</Paragraph>
                                  <Paragraph>{item.localizedPrice}</Paragraph>
                                  <Paragraph>{item.description}</Paragraph>
                              </Card.Content>
                              <Card.Actions>
                                <Button onPress={()=>{this.goPay(item.productId);}}>点击支付:{item.localizedPrice}</Button>
                              </Card.Actions>
                          </Card>
                      )
                  })
                }
              </ScrollView>
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
        padding: 0,
    },
    card: {
        margin: 6,
        borderRadius:12,
        borderBottomWidth:1,
        borderBottomColor:store.getState().setting.theme.color
    }
  });