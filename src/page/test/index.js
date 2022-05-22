import React, { Component } from "react";
import { StyleSheet,Image } from "react-native";
import { Banner } from 'react-native-paper';


export default class App extends Component {

    constructor(props){
        super(props);
        this.state = {
            visible:true,
            
        }
    }
    setVisible(visible){
        this.setState({visible});
    }
    onPress = () => {
        this.setState({
            zone: "I got touched with a parent pan responder",
        });
    };

    render() {
        return (
            <Banner
                visible={this.state.visible}
                actions={[
                {
                    label: 'Fix it',
                    onPress: () => this.setVisible(false),
                },
                {
                    label: 'Learn more',
                    onPress: () => this.setVisible(false),
                },
                ]}
                icon={({size}) => (
                <Image
                    source={{
                    uri: 'https://avatars3.githubusercontent.com/u/17571969?s=400&v=4',
                    }}
                    style={{
                    width: size,
                    height: size,
                    }}
                />
                )}>
                There was a problem processing a transaction on your credit card.
            </Banner>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor:'red'
    },
   
});