import ExpoModulesCore
import ExpoScreenOrientation

@objc(EXScreenOrientationReactDelegateHandler)
public class ScreenOrientationReactDelegateHandler: ExpoReactDelegateHandler {
  public override func createRootViewController() -> UIViewController? {
    // Passing `nil` lets ScreenOrientationViewController fetch the default value from Info.plist
    return ScreenOrientationViewController(defaultScreenOrientationFromPlist: nil)
  }
}