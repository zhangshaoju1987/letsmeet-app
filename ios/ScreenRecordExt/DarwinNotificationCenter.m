#import "DarwinNotificationCenter.h"

NSNotificationName const kBroadcastStartedNotification = @"iOS_BroadcastStarted";
NSNotificationName const kBroadcastStoppedNotification = @"iOS_BroadcastStopped";

@implementation DarwinNotificationCenter {
  CFNotificationCenterRef _notificationCenter;
}

+ (instancetype)sharedInstance {
  static DarwinNotificationCenter *sharedInstance = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
      sharedInstance = [[self alloc] init];
  });
  
  return sharedInstance;
}

- (instancetype)init {
  self = [super init];
  if (self) {
    _notificationCenter = CFNotificationCenterGetDarwinNotifyCenter();
  }
  
  return self;
}

- (void)postNotificationWithName:(NSString*)name {
  CFNotificationCenterPostNotification(_notificationCenter, (__bridge CFStringRef)name, NULL, NULL, true);
}

@end
