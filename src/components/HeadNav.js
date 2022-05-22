import React from 'react';
import { StyleSheet } from 'react-native';
import { Appbar } from 'react-native-paper';
import { HEADERHEIGHT } from '../configs/index'
import { store } from "../store";
export default class MeetingItem extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            title: '',
            theme:{}
        }

        this.props.title && (this.state.title = this.props.title)
    }
    getThemeColor(){
        const { theme } = store.getState().setting;
        this.setState({
            theme
        })
    }
    componentDidMount() {
        this.getThemeColor()
        this.unsubscribe = store.subscribe(() => {
            this.getThemeColor()
        })
        
    }
    componentWillUnmount() {
        this.unsubscribe();
    }
    render() {
        return (
            <Appbar.Header style={[{ backgroundColor: this.state.theme.color,  height: HEADERHEIGHT }]}>
                <Appbar.BackAction onPress={() => { this.props.leftPrass() }} color='#fff' />
                <Appbar.Content title={this.state.title} subtitle="" titleStyle={{ fontSize: 16, fontWeight: 'normal', color: '#fff' }} />
            </Appbar.Header>

        );
    }
}

const styles = StyleSheet.create({

})