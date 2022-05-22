import React from 'react';
import { StyleSheet, Image,View } from 'react-native';

export default class MicIcon extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            size: '20',
        }
        this.props.size && (this.state.size = this.props.size);

    }

    componentWillUnmount() {
        //console.log("MicIcon.js->unmount");
    }
    render() {
        const size = this.state.size;
        return (
            <View style={[{
                width: size,
                height: size
            },styles.micBox]}>
                <Image
                    style={styles.mic}
                    source={require('../assets/images/6.png')}
                />
            </View>
        )
    }
}

const styles = StyleSheet.create({
    mic: {
        width: '100%',
        height: '100%',
    },
    micBox:{
        // backgroundColor:'red'
    }
})