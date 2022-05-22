import color from 'color';
import * as React from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import {ActivityIndicator, Surface,TouchableRipple,withTheme,Text } from 'react-native-paper';

export const black = '#000000';
export const white = '#ffffff';
const BigBrainFab = ({
  small,
  icon,
  label,
  accessibilityLabel = label,
  accessibilityState,
  animated = true,
  color: customColor,
  disabled,
  onPress,
  onLongPress,
  theme,
  style,
  visible = true,
  uppercase = true,
  loading,
  testID,
  ...rest
}) => {
  const { current: visibility } = React.useRef(
    new Animated.Value(visible ? 1 : 0)
  );
  const { scale } = theme.animation;

  React.useEffect(() => {
    if (visible) {
      Animated.timing(visibility, {
        toValue: 1,
        duration: 200 * scale,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(visibility, {
        toValue: 0,
        duration: 150 * scale,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, scale, visibility]);

  const IconComponent = Icon;

  const disabledColor = color(theme.dark ? white : black)
    .alpha(0.12)
    .rgb()
    .string();

  const { backgroundColor = disabled ? disabledColor : theme.colors.accent } =
    StyleSheet.flatten(style) || {};

  let foregroundColor;

  if (typeof customColor !== 'undefined') {
    foregroundColor = customColor;
  } else if (disabled) {
    foregroundColor = color(theme.dark ? white : black)
      .alpha(0.32)
      .rgb()
      .string();
  } else {
    foregroundColor = !color(backgroundColor).isLight()
      ? white
      : 'rgba(0, 0, 0, .54)';
  }

  const rippleColor = color(foregroundColor).alpha(0.32).rgb().string();

  return (
    <Surface
      {...rest}
      style={
        [
          {
            backgroundColor:"#fff",
            opacity: 1,
            transform: [
              {
                scale: 1,
              },
            ],
          },
          styles.container,
          disabled && styles.disabled,
          style,
        ]
      }
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <TouchableRipple
        borderless
        onPress={onPress}
        onLongPress={onLongPress}
        rippleColor={rippleColor}
        disabled={disabled}
        accessibilityLabel={accessibilityLabel}
        accessibilityTraits={disabled ? ['button', 'disabled'] : 'button'}
        accessibilityComponentType="button"
        accessibilityRole="button"
        accessibilityState={{ ...accessibilityState, disabled }}
        style={styles.touchable}
        testID={testID}
      >
        <View
          style={[
            styles.content,
            label ? styles.extended : small ? styles.small : styles.standard,
          ]}
          pointerEvents="none"
        >
          {icon && loading !== true ? (
            <IconComponent source={icon} size={24} color={foregroundColor} />
          ) : null}
          {loading ? (
            <ActivityIndicator size={18} color={foregroundColor} />
          ) : null}
          {label ? (
            <Text
              selectable={false}
              style={[
                styles.label,
                uppercase && styles.uppercaseLabel,
                { color: foregroundColor, ...theme.fonts.medium },
              ]}
            >
              {label}
            </Text>
          ) : null}
        </View>
      </TouchableRipple>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 28,
    elevation: 2,
  },
  touchable: {
    borderRadius: 28,
  },
  standard: {
    height: 56,
    width: 56,
  },
  small: {
    height: 40,
    width: 40,
  },
  extended: {
    height: 48,
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginHorizontal: 8,
  },
  uppercaseLabel: {
    textTransform: 'uppercase',
  },
  disabled: {
    elevation: 0,
  },
});

export default withTheme(BigBrainFab);

// @component-docs ignore-next-line
const FABWithTheme = withTheme(BigBrainFab);
// @component-docs ignore-next-line
export { FABWithTheme as BigBrainFab };