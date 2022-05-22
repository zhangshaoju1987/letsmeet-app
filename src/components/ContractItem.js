import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Chip,Card,Paragraph,Avatar } from 'react-native-paper';
import UserLogo from './UserLogo';

export default class ContractItem extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            item: {}
        }

        this.props.item && (this.state.item = this.props.item)
    }
    toChatPage(item) {
        //console.log("选中的会议=", item);
        if(!this.props.navigation){
            console.log("导航信息缺失");
            return;
        }
        console.log("和",item.mobile,"聊天");
    }
    componentDidMount(){

    }
    componentWillUnmount() {
        
    }
    render() {
        const item = this.state.item;
        return (
            <Card onPress={()=>this.toChatPage(item)}>
                <Card.Title title={item.remark} subtitle="公民" left={()=>{
                    return (<UserLogo userName={item.remark}></UserLogo>);
                }} />
                <Card.Content>
                    <Paragraph>手机号码:{item.mobile}</Paragraph>
                    <View style={{marginTop:10,flexDirection: 'row',flexWrap: 'wrap',paddingHorizontal: 6,}}>
                        <Chip style={{marginRight:5}} onClose={()=>{console.log("删除标签")}} icon="information">{item.label}</Chip>
                    </View>
                </Card.Content>
            </Card>
        );
    }
}

const styles = StyleSheet.create({
    rectButton: {
        flex: 1,
        height: 80,
        paddingVertical: 10,
        paddingHorizontal: 20,
        justifyContent: 'space-between',
        flexDirection: 'column',
        backgroundColor: 'white',
      },
    listTitle: {
        paddingTop: 4,
        paddingBottom: 4
    },
    listInfo: {
        fontSize: 13,
        color: '#a2a2a2'
    }
})