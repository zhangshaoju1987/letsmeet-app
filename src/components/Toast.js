import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Snackbar } from 'react-native-paper';

export default class Scan extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            visible: true,
            text: '测试toast'
        }
    }
    onDismissSnackBar() {
        this.setState({ visible: false, text: '' })
    }
    render() {
        return (
            <View style={styles.container}>
                <Snackbar
                    visible={this.state.visible}
                    onDismiss={this.onDismissSnackBar.bind(this)}
                    duration={1000}
                    wrapperStyle={{position:'absolute',bottom:0}}
                    action={{
                        label:'关闭',
                        onPress: () => {
                            // Do something
                        },
                    }}>
                    Hey there! I'm a Snackbar.
            </Snackbar>
            </View>
        )
    }
}

const styles = StyleSheet.create({

})