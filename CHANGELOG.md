# Change Log

## 2.1.0 (2025-07-02)

### BREAKING CHANGES

- The `then` property and method have been renamed to `after` throughout the codebase and documentation for improved clarity and consistency. You must now use `after` instead of `then` in all `MotionProps` and when handling animation completion callbacks.
- The animation function signature in `MotionProps` has changed: it now receives a single `AnimationFrame` object containing `{ progress, progressMs, state }`. Previous only `progress, state?` was supplied

### Added

- New `before` property: an optional function that runs once before the animation starts (on fresh starts, not when resuming from pause).
- The animation function now receives both the eased progress (`progress`) and the linear progress (`progressMs`), allowing for more complex animation effects.
- TypeScript generics are now used for state in `Motion` and `MotionChain`. This is to allow for string typing when accessing the `state` property either from the `Motion` instance or from the `state` value from the `animation` function.

### Changed

- Refactored the `then` method/property to `after` in the `Motion` class, types, and documentation.
- The animation function now takes an `AnimationFrame` object, providing both eased and linear progress values, and the current state.
- Improved TypeScript types: `Motion`, `MotionChain`, and `MotionProps` are now generic over state, and the default state type is an object.
- Updated documentation and usage examples to reflect the new API and type changes.
- Improved clarity in comments and documentation regarding animation callbacks and state.
- Minor typo and formatting fixes in comments and documentation.

---

## 2.0.0 (2022-11-12)

Version 2 :tada:

In this release comes a complete TypeScript rewrite, more efficient engine, simplified codebase & documentation and a few new features.

### BREAKING CHANGES

- **Codebase:** The codebase has been re-written in TypeScript and all main functions have been turned into classes.

- **MotionProps:** The following keys have been removed:

  - `ele` - This value is can be stored outside of the `Motion` class
  - `stop` - This value is now controlled entirely by the `Motion` class
  - `playCount` - Is now built into the `Motion` class
  - `reverseAfter` - This has been dropped in favour of manually toggling the `reverse` key of the animation instance using `.then()`, or using the `LoopType.ALTERNATE` feature of the `loop` key

- **Motion:** The following features have been removed from the `Motion` class (formally function):

  - `.delay` - Animations don't play immediately when they are initiated any more and can now be started using the `.play()` method
  - `.stop` - This value was poorly implemented to begin with, and has now been turned into a method which will reset an animation to its original state
  - `.eleBase`, `.eleBaseUpdate`, `.resetRect()` - These 3 were used when the animation needed to deal with the `.getBoundingClientRect()` API, however if needed they can just be stored outside the `Motion` object
  - `.toggleReverse()` - This can be done by just toggling the `.reverse` value
  - `.reset()` - See new `.stop()` method

- **MotionChain:** The following features have been removed from the `MotionChain` class:
  - `.playReverse()` - This is now an optional boolean that can be passed into the `.play()` method

### NEW FEATURES

**MotionProps:**

- `state` [Optional] - Added state object variable for custom persistent data
  - Example, initialize an animation once, but then dynamically change the element that it plays on
- `loop` [Optional] - Loop has changed from taking a `boolean` to now taking a `LoopType` enum which has 3 options:
  - `NONE` - Default
  - `LOOP` - Loops the animation
  - `ALTERNATE` - Loops and transitions to the opposite position after each run instead of always starting at the beginning.

**Motion:**

- static `.preform(props: MotionProps)` - A factory builder function for instant initialisation and playback
- `.stop()` - Will stop the animation and return it to its original state
- `.pause()` - Can be called to pause an animation in its current position. Calling `.play()` again would then resume the animation from its current state
- `.rewind()` - Will rewind the animation from its current position back to the beginning
- `.reset()` - By default, will call the first frame of the animation. However it can be set as a lambda on initialisation
- Getters for some instance values:
  - `.id` - The instance ID
  - `.isPaused` - If the instance is paused
  - `.stopped` - If the instance has stopped (automatically or manually)

**MotionChain:**

- `.play()` - Now has an optional boolean parameter which will play the chain in reverse
- `.togglePause()` - Will pause and resume whatever animation in the chain is currently playing

### Bug Fixes

- **Engine:** Fixed a bug where if you had multiple animations running and one of them finished, the animation that was registered immediately after the one that finished would skip 1 frame.
- **Motion:** Fixed a bug where you could trigger and animation start while it was already running causing some interesting results

---

## 1.0.0 (2020-09-09)

- Initial Release
