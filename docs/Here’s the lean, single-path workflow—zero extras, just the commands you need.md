Here’s the lean, single-path workflow—zero extras, just the commands you need.

1. Terminal – prep & start Metro

yarn

cd ios && pod install && cd ..

yarn start | cat

1. Terminal – open the Xcode workspace

open ios/HarmonyTi.xcworkspace

1. Xcode GUI

 • Select any simulator (e.g., “iPad Pro 11-inch”).

 • Hit ⌘-R to build & run.

That’s it—the app will compile, connect to the Metro bundler you already started, and load in the simulator.