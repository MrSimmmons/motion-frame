# Motion Frame

A Typescript lambda animation / easing engine built on top of requestAnimationFrame

## About

Motion Frame is an animation engine that is run off the concept of lambda animation functions. The way that these functions work is that you define the end state of an animation that you want in JS, and then multiply any values with the provided easing variable `x` (value between 0 and 1) and then let the engine work its magic :)

### Usage

To use Motion Frame, run `npm install motion-frame` and import `Motion` and / or `MotionChain` into your project. `Motion` is the main class to use to initiated your animations, while `MotionChain` allows you to chain animations together to then play in order. To use them, you need to provide an `MotionProps` object in the constructor (in the the `MotionChain`'s case, an array of `MotionProps`)

| Key                    | Type                           | Default         | Description                                                                     |
| --------------         | ------------------------------ | --------------- | ------------------------------------------------------------------------------- |
| `animation` (required) | Function (AnimationFrame)      | `void`          | The lambda animation that will run                                              |
| `easing`               | Function (x)                   | `(x) => x`      | The easing function that the animation will take                                |
| `duration`             | Number                         | `1000`          | The duration of the animation in milliseconds                                   |
| `reverse`              | Boolean                        | `false`         | If the animation should play in reverse                                         |
| `loop`                 | LoopType                       | `LoopType.NONE` | If the animation should loop after it finishes                                  |
| `then`                 | Function (state)               | `(state) => {}` | A function that will trigger once the animation has finished each run           |
| `state`                | Object                         | `{}`            | Persistent state that can be accessed within the `animation` and `then` lambdas |
| `reset`                | Function                       | `void`          | Gets called immediately after the animation gets reset to its original position |

### Example

```ts
import { Motion } from "motion-frame";

const boxElement = document.getElementById("box");
const boxRect = boxElement.getBoundingClientRect();

const boxAnimation = new Motion({
  duration: 2000,
  loop: LoopType.ALTERNATE,
  easing: (x) => x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2, // easeInOutQuart
  animation: (frame) => {
    let destX = (window.innerWidth - boxRect.width) / 2;
    let amountX = (destX - boxRect.left) * frame.progress;

    boxElement.style.left = `${amountX}px`;
  },
  then: () => {
    boxElement.innerHTML = boxAnimation.playCount;
  }
});

boxAnimation.play();
```

<img src="docs/example.gif">

### AnimationFrame

The animation function receives an object containing three parameters:

- `progress` (number): The eased progress value (0-1) after the easing function has been applied
- `progressMs` (number): (number): The unmodified progress value (0-1) before easing is applied
- `state` (TState): The persistent state object

This allows you to use different progression values for different aspects of your animation:

```ts
import { Motion } from "motion-frame";

const complexAnimation = new Motion({
  duration: 1000,
  easing: (x) => x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2, // easeInOutQuart
  animation: (frame) => {
    const { progress, progressMs } = frame;

    // Use eased value for position (accelerated movement)
    element.style.left = `${progress * 100}px`;
   
    // Use linear value for opacity (steady fade)
    element.style.opacity = progressMs;
  }
});
```

#### TODO - Future enhancements / additions

1. Make some pre-build easing functions available
1. Create a bunch of examples for all the different features
1. Build out extra documentation and examples around `MotionChain`
1. Unit tests
