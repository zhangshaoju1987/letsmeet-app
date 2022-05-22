import * as React from 'react';
import {
  StyleSheet,
  Animated,
  SafeAreaView,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import color from 'color';
import {FAB,Text,Card,withTheme } from 'react-native-paper';


const BigBrainFabGroup = ({
    actions,
    icon,
    open,
    onPress,
    accessibilityLabel,
    theme,
    style,
    fabStyle,
    visible,
    testID,
    onStateChange,
    color: colorProp,
  }) => {
    const { current: backdrop } = React.useRef(
      new Animated.Value(0)
    );
    const animations = React.useRef(
      actions.map(() => new Animated.Value(open ? 1 : 0))
    );
    console.log("animations=",animations);
    const [prevActions, setPrevActions] = React.useState(null);
  
    const { scale } = theme.animation;
  
    React.useEffect(() => {
      if (open) {
        Animated.parallel([
          Animated.timing(backdrop, {
            toValue: 1,
            duration: 250 * scale,
            useNativeDriver: true,
          }),
          Animated.stagger(
            50 * scale,
            animations.current
              .map((animation) =>
                Animated.timing(animation, {
                  toValue: 1,
                  duration: 150 * scale,
                  useNativeDriver: true,
                })
              )
              .reverse()
          ),
        ]).start();
      } else {
        Animated.parallel([
          Animated.timing(backdrop, {
            toValue: 0,
            duration: 200 * scale,
            useNativeDriver: true,
          }),
          ...animations.current.map((animation) =>
            Animated.timing(animation, {
              toValue: 0,
              duration: 150 * scale,
              useNativeDriver: true,
            })
          ),
        ]).start();
      }
    }, [open, actions, backdrop, scale]);
  
    const close = () => onStateChange({ open: false });
  
    const toggle = () => onStateChange({ open: !open });
  
    const { colors } = theme;
  
    const labelColor = theme.dark
      ? colors.text
      : color(colors.text).fade(0.54).rgb().string();
    const backdropOpacity = open
      ? backdrop.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, 1, 1],
        })
      : backdrop;
  
    const opacities = animations.current;
    const scales = opacities.map((opacity) =>
      open
        ? opacity.interpolate({
            inputRange: [0, 1],
            outputRange: [0.8, 1],
          })
        : 1
    );
  
    if (actions.length !== prevActions?.length) {
      animations.current = actions.map(
        (_, i) => animations.current[i] || new Animated.Value(open ? 1 : 0)
      );
      setPrevActions(actions);
    }
  
    return (
      <View pointerEvents="box-none" style={[styles.container, style]}>
        <TouchableWithoutFeedback onPress={close}>
          <Animated.View
            pointerEvents={open ? 'auto' : 'none'}
            style={[
              styles.backdrop,
              {
                opacity: backdropOpacity,
                backgroundColor: colors.backdrop,
              },
            ]}
          />
        </TouchableWithoutFeedback>
        <SafeAreaView pointerEvents="box-none" style={styles.safeArea}>
          <View pointerEvents={open ? 'box-none' : 'none'}>
            {actions.map((it, i) => (
              <View
                key={i}
                style={[
                  styles.item,
                  {
                    marginHorizontal:
                      typeof it.small === 'undefined' || it.small ? 24 : 16,
                  },
                ]}
                pointerEvents={open ? 'box-none' : 'none'}
              >
                {it.label && (
                  <View>
                    <Card
                      style={
                        [
                          styles.label,
                          {
                            transform: [{ scale: scales[i] }],
                            opacity: opacities[i],
                          },
                        ]
                      }
                      onPress={() => {
                        it.onPress();
                        close();
                      }}
                      accessibilityLabel={
                        it.accessibilityLabel !== 'undefined'
                          ? it.accessibilityLabel
                          : it.label
                      }
                      accessibilityTraits="button"
                      accessibilityComponentType="button"
                      accessibilityRole="button"
                    >
                      <Text style={{ color: labelColor }}>{it.label}</Text>
                    </Card>
                  </View>
                )}
                <FAB
                  small={typeof it.small !== 'undefined' ? it.small : true}
                  icon={it.icon}
                  color={it.color}
                  style={
                    [
                      {
                        transform: [{ scale: scales[i] }],
                        opacity: opacities[i],
                        backgroundColor: theme.colors.surface,
                      },
                      it.style,
                    ]
                  }
                  onPress={() => {
                    it.onPress();
                    close();
                  }}
                  accessibilityLabel={
                    typeof it.accessibilityLabel !== 'undefined'
                      ? it.accessibilityLabel
                      : it.label
                  }
                  accessibilityTraits="button"
                  accessibilityComponentType="button"
                  accessibilityRole="button"
                  testID={it.testID}
                  visible={open}
                />
              </View>
            ))}
          </View>
          <FAB
            onPress={() => {
              onPress?.();
              toggle();
            }}
            icon={icon}
            color={colorProp}
            accessibilityLabel={accessibilityLabel}
            accessibilityTraits="button"
            accessibilityComponentType="button"
            accessibilityRole="button"
            accessibilityState={{ expanded: open }}
            style={[styles.fab, fabStyle]}
            visible={visible}
            testID={testID}
          />
        </SafeAreaView>
      </View>
    );
  };
  
  BigBrainFabGroup.displayName = 'BigBrainFabGroup';
  
  export default withTheme(BigBrainFabGroup);
  
  // @component-docs ignore-next-line
  const FABGroupWithTheme = withTheme(BigBrainFabGroup);
  // @component-docs ignore-next-line
  export { FABGroupWithTheme as BigBrainFabGroup };
  
  const styles = StyleSheet.create({
    safeArea: {
      alignItems: 'flex-end',
    },
    container: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'flex-end',
    },
    fab: {
      marginHorizontal: 16,
      marginBottom: 16,
      marginTop: 0,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    label: {
      borderRadius: 5,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginVertical: 8,
      marginHorizontal: 16,
      elevation: 2,
    },
    item: {
      marginBottom: 16,
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
  });