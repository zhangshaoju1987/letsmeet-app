#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

extern NSNotificationName const kBroadcastStartedNotification;
extern NSNotificationName const kBroadcastStoppedNotification;

@interface DarwinNotificationCenter: NSObject

+ (instancetype)sharedInstance;
- (void)postNotificationWithName:(NSNotificationName)name;

@end

NS_ASSUME_NONNULL_END
