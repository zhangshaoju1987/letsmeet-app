#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface SocketConnection : NSObject

@property (nonatomic, copy, nullable) void (^didOpen)(void);
@property (nonatomic, copy, nullable) void (^didClose)(NSError*);
@property (nonatomic, copy, nullable) void (^streamHasSpaceAvailable)(void);

- (instancetype)initWithFilePath:(nonnull NSString *)filePath;
- (BOOL)open;
- (void)close;
- (NSInteger)writeBufferToStream:(const uint8_t*)buffer maxLength:(NSInteger)length;

@end

NS_ASSUME_NONNULL_END
