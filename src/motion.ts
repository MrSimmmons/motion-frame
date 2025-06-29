/**
 * The Motion class handles all the information required to set up and run animations.
 * @author Simon Watson
 */

export class Motion {
	private static NEXT_ID = 0;

	// Animation instance information
	public readonly id: number;

	private _playCount = 0;
	get playCount() {
		return this._playCount;
	}

	// State to allow for dynamic animation changing
	// eg. Make a single animation instance, but apply it to a dynamic DOM element on the fly
	public state: AnyState = {};

	private animation: (x: number, state: AnyState) => void;

	// Timing variables in ms
	private duration = 1000;
	private progress = 0;
	private startTime = 0;
	private currentFrame = 0;

	// Extra custom functions for functionality
	private easing: EasingFunction = (x) => x;
	private before: (state: AnyState) => void = (state) => {};
	private then: (state: AnyState) => void = (state) => {};
	private chainAfter: () => void = () => {};
	private _reset: () => void = () => () => {};

	// Flag to track if before method has been called for current animation cycle
	private beforeCalled = false;

	// Controlling variables
	private _stopped = true;
	get stopped() {
		return this._stopped;
	}

	private _paused = false;
	get isPaused() {
		return this._paused;
	}

	public reverse = false;

	public loop: LoopType = LoopType.NONE;

	/**
	 * @param {MotionProps} props - Animation instance information.
	 */
	constructor(props: MotionProps) {
		this.id = ++Motion.NEXT_ID;

		if (props.easing != undefined) this.easing = props.easing;
		if (props.duration != undefined) this.duration = props.duration;
		if (props.reverse != undefined) this.reverse = props.reverse;
		if (props.loop != undefined) this.loop = props.loop;
		if (props.before != undefined) this.before = props.before;
		if (props.then != undefined) this.then = props.then;
		if (props.state != undefined) this.state = props.state;
		if (props.reset != undefined) this._reset = props.reset;

		this.animation = props.animation;
	}

	/**
	 * Creates a new Motion instance and plays it
	 * Mainly used in one off cases where the animation you want to make gets played immediately
	 * @param {MotionProps} p - The properties required to make an animation
	 * @returns {Motion} A `Motion` instance
	 */
	public static preform(p: MotionProps): Motion {
		let x = new Motion(p);
		x.play();
		return x;
	}

	/**
	 * Plays the instance's animation
	 */
	public play() {
		this._paused = false;
		this._stopped = false;

		for (let i of Engine.activeInstances) if (i.id == this.id) return;

		Engine.activeInstances.push(this);
		if (!Engine.frameID) Engine.run();
	}

	/**
	 * Plays a single frame of the instance's animation.
	 * This method is used by the `Engine` and should be ignored by the developer
	 *
	 * @param {number} time - The time in ms that is given from the `requestAnimationFrame()` API
	 */
	public tick(time: number) {
		this.currentFrame = time;

		if (!this.startTime) this.startTime = time;

		// Call before method once at the start of a fresh animation
		if (!this.beforeCalled && this.progress === 0) {
			this.before(this.state);
			this.beforeCalled = true;
		}

		// If the animation has completed
		if (time - this.startTime + this.progress >= this.duration) {
			// Trigger the animation in its final state
			this.animation(this.reverse ? 0 : 1, this.state);
			this._playCount++;

			this.then(this.state);

			// If the animation loops, reset it otherwise stop the animation
			if (this.loop != LoopType.NONE) {
				this.startTime = 0;
				this.progress = 0;
				this.beforeCalled = false;
				if (this.loop == LoopType.ALTERNATE) this.reverse = !this.reverse;
			} else {
				this.stop();
				this.chainAfter();
			}
		}
		// Else continue the animation
		else {
			let percentage = (time - this.startTime + this.progress) / this.duration;
			let mappedX = this.easing(percentage);
			this.animation(this.reverse ? 1 - mappedX : mappedX, this.state);
		}
	}

	/**
	 * Pauses the current animation
	 */
	public pause() {
		if (!this._stopped) {
			// Use the start time with the frame time to set the progress
			this.progress += this.currentFrame - this.startTime;
			this.startTime = 0;

			this._paused = true;
		}
	}

	/**
	 * Stops the current animation and cant be resumed
	 */
	public stop() {
		this._stopped = true;
		this._paused = false;
		this.startTime = 0;
		this.progress = 0;
		this.beforeCalled = false;
	}

	/**
	 * Rewinds the animation from its current position back to its original position.
	 */
	public rewind() {
		if (!this._stopped) {
			this.reverse = !this.reverse;
			this.progress = this.duration - (this.currentFrame - this.startTime);
			this.startTime = 0;
		}
	}

	/**
	 * Resets the element by calling the 0 state of the animation
	 */
	public reset() {
		this.stop();
		this.animation(0, this.state);
		this._reset();
	}

	/**
	 * Sets the `chainAfter()` function.
	 * This method is designed to be used by the `MotionChain` class and can be ignored by the developer. See `.then` for a purpose built solution
	 */
	public setChain(func: () => void) {
		this.chainAfter = func;
	}
}

/**
 * The animation Engine runs all the animations efficiently and only stores static values and methods.
 * It is not designed to be called upon by the developer and can be ignored.
 */
class Engine {
	public static frameID: number = null;

	public static activeInstances: Motion[] = [];

	public static run() {
		// If there are any queued up animations, run each one in the same frame
		if (Engine.activeInstances.length) Engine.frameID = requestAnimationFrame(Engine.tick);
		else {
			cancelAnimationFrame(Engine.frameID);
			Engine.frameID = null;
		}
	}

	private static tick(time: number) {
		// We loop through the instances backwards so if we have to remove an instance, we dont have to
		for (let i = Engine.activeInstances.length - 1; i >= 0; i--) {
			// If the animation is paused or has stopped, remove it from the queue
			let instance = Engine.activeInstances[i];
			if (instance.stopped || instance.isPaused) Engine.activeInstances.splice(i, 1);
			// Otherwise trigger the lambda
			else instance.tick(time);
		}

		// Run again
		Engine.run();
	}
}

/**
 * The MotionChain class allows you to chain multiple animations to play one after the other in order.
 *
 * To do this it uses a separate system than the `.then()` so it still allows for custom `.then()` functions to be called after each separate animation completion.
 *
 * It is also possible to play an MotionChain in reverse by passing `true` into the `.play()` function.
 * This will play all animations from end to start.
 */
export class MotionChain {
	private animationInstances: Motion[] = [];
	private runningInstances: Motion[] = [];

	private runningIndex: number = 0;

	/**
	 * @param {MotionProps[]} instances - An array of animation instance information. The same kind that goes into the `Motion` class
	 */
	constructor(instances: MotionProps[]) {
		for (let instance of instances) {
			this.animationInstances.push(new Motion(instance));
		}
	}

	/**
	 * Starts the chain of animations
	 *
	 * @param {boolean} [reverse=false] - Play the animation in reverse
	 */
	public play(reverse: boolean = false) {
		this.runningInstances = this.animationInstances.slice();
		if (reverse) this.runningInstances.reverse();
		for (let i of this.runningInstances) i.reverse = reverse;
		this.run();
	}

	/**
	 * Toggles pausing the current animation in the chain
	 */
	public togglePause() {
		if (this.runningInstances.length > 0) {
			if (this.runningInstances[this.runningIndex].isPaused) this.runningInstances[this.runningIndex].play();
			else this.runningInstances[this.runningIndex].pause();
		}
	}

	private run() {
		for (let i = 0; i < this.runningInstances.length; i++) {
			// Set the chainAfter method of the current running instances to play the next instance in the chain
			if (i < this.runningInstances.length - 1)
				this.runningInstances[i].setChain(() => {
					this.runningInstances[i + 1].play();
					this.runningIndex++;
				});
			// Else we are at the end of the chain so we need to dispose
			else
				this.runningInstances[i].setChain(() => {
					this.runningInstances = [];
					this.runningIndex = 0;
				});
		}

		this.runningInstances[0].play();
	}
}

/**
 * Defines the different loop options
 */
enum LoopType {
	NONE,
	LOOP,
	ALTERNATE
}

/**
 * Any object used for `Motion` state
 */
interface AnyState {
	[key: string]: any;
}

/**
 * The properties used to make an animation instance
 */
interface MotionProps {
	/**
	 * The lambda function that runs every frame
	 */
	animation: (x: number) => void;
	/**
	 * [Optional] The easing function that maps the progress of the animation
	 */
	easing?: EasingFunction;
	/**
	 * [Optional] The duration of the animation in ms
	 */
	duration?: number;
	/**
	 * [Optional] Whether the animation plays in reverse
	 */
	reverse?: boolean;
	/**
	 * [Optional] Whether the animation loops once it completes
	 */
	loop?: LoopType;
	/**
	 * [Optional] A custom function that runs once before the animation starts
	 * (Only runs on fresh starts, not when resuming from pause)
	 */
	before?: (state: AnyState) => void;
	/**
	 * [Optional] A custom function that runs after an animation completes
	 * (If `loop` is true, then it will run after each loop completion)
	 */
	then?: () => void;
	/**
	 * [Optional] A state object that persists and can be accessed within the lambdas
	 */
	state?: AnyState;
	/**
	 * [Optional] A custom reset function that will replace the default which calls the first frame of the animation
	 */
	reset?: () => void;
}

type EasingFunction = (x: number) => number;
