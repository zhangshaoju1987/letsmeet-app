import React from 'react';
import { StyleSheet, ScrollView, View, } from 'react-native';
import { Button } from 'react-native-paper';
import { store } from "../../store";
import { notify } from "../../actions/requestActions";
import * as settingsActions from "../../actions/settingsActions";
import { Card, Paragraph,Avatar } from 'react-native-paper';
import http from '../../services/axios';


const LeftContent = props => <Avatar.Icon {...props} icon="remote-desktop" />

/**
 * 远程桌面功能页面
 */
export default class RemoteDesktop extends React.Component {

    constructor(props){
        super();
        this.state = {
            theme: {},
            myDesktops:null
        }
        this.file_open_url = `https://service.joemeet.com:12321/dfs/api/view?fileId=`;
    }

    componentWillUnmount() {
        
    }

    queryPageData(){

        console.log('开始获取设备信息')
        const { token } = store.getState().user;
        http.get('/remotedesktop/account/query?token='+token,{},"remote_desktop")
            .then((res)=>{
                //console.log("查询结果：",res);
                if (res.code && res.code.startsWith("S")) {  //成功
                    let list = res.result.list;
                    //console.log(list);
                    this.setState({
                        myDesktops: list
                    });
                }
            });  
    }

    componentDidMount() {
        store.dispatch(settingsActions.setShowHomeFabGroup(false));
        const { theme } = store.getState().setting;
        this.setState({
            theme
        });
        this.queryPageData();
    }

    access(){
        store.dispatch(notify({ text: "访问电脑" }));
    }

    modify(){
        store.dispatch(notify({ text: "修改" }));
    }

    render() {

        return (
                <ScrollView style={styles.container}  contentContainerStyle={styles.content}>

                {
                    this.state.myDesktops && this.state.myDesktops.map((item, idx) => {
                            return (
                                <Card style={styles.card} key={idx}>
                                    <Card.Title title={item.desktop_name} subtitle="在线" left={LeftContent} />
                                {
                                    item.snapshot && 
                                    <Card.Cover source={{ uri: this.file_open_url+item.snapshot }} />
                                }
                                    <Card.Content>
                                        <Paragraph>访问密码 : {item.auth_code}</Paragraph>
                                        <Paragraph>上次在线 : {item.live_time}</Paragraph>
                                    </Card.Content>
                                </Card>
                            )
                        })
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
        borderBottomColor:store.getState().setting.theme.color
    }
})