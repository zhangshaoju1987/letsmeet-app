import React from 'react';
import { StyleSheet, View, Image, Text } from 'react-native';

export default class NoData extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            size: '',
            text:"",
            top:0
        }

        this.props.size && (this.state.size = this.props.size*1)
        this.props.text && (this.state.text = this.props.text)
        this.props.top && (this.state.top = this.props.top*1)
    }

    componentWillUnmount() {

    }
    render() {
        return (
            <View style={[styles.noData, {paddingTop:this.state.top}]}>
                <Image
                    style={[styles.img,{width:this.state.size,height:this.state.size}]}
                    source={require('../assets/images/joemeet_256.png')}
                />
                <Text style={styles.text}>{this.state.text}</Text>
            </View>

        );
    }
}

const styles = StyleSheet.create({
    img:{
        
    },
    noData: {
        width: '100%',
        flexDirection: 'column',
        alignItems: 'center',
    },
    text: {
        paddingTop: 10,
        color:"#ccc"
    }
})