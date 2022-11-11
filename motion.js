/**
* Cool little lambda based animation engine
* @author Simon Watson
*
* @API motion();
*
* @usage
* Use this API to animate DOM elements
*
* @params
* Required:
*  - ele: {HTMLElement} A DOM element
*  - animation: {Function} A lambda function which takes in the instance of the animation and the progress value based off the easing function
*     - Tages these parameters
*        - instance: {Object} The animation instance
*        - x: {Number} The progress of the animation based off the easing function
*
* Optional:
*  - duration: {Number} The length of time you want the animation to play in milliseconds
*  - delay: {Number} The delay of time you want before the animation starts
*  - reverse: {Boolean} If you want the animation to play in reverse
*  - loop: {Boolean} If you want the animation to loop once its has finished playing
*  - reverseAfter: {Boolean} If you want the animation to play in reverse during a loop
*  - easing: {Function} A custom function to determine the easing
*  - then: {Function} A custom function that runs once the animation has completed a run
*
*
* @example 
* This example will move an element to the vertical centre of the page, then back again because it is looping. It then updates the `count` element after each run with the total amount of times the animation has played.

motion({
	ele: document.getElementById("foo"),
	duration: 2000,
	loop: true,
	reverseAfter: true,
	easing: (x)=> {
		return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
	},
	animation: (instance, x)=> {
		let destY = (window.innerHeight - instance.eleBase.height) / 2;
		let destX = (window.innerWidth - instance.eleBase.width) / 2;
		
		let amountY = (destY - instance.eleBase.top) * x;
		let amountX = (destX - instance.eleBase.left) * x;
		
		instance.ele.style.top = `${amountY}px`;
		instance.ele.style.left = `${amountX}px`;
	},
	then: (x)=> {
		document.getElementById("count").innerHTML = x.playCount;
	}
});

* @API new MotionChain();
*
* @usage
*
*
* @example
* The API also has a chain wrapper that can be used to chain multiple animations together that play after one another, or even play them in reverse.

*/

let activeInstances = [];
let frameID;
let instanceId = 0;

/**
 * The function to call when you want to make an animation
 * @param {JSON} props The properties used to make an animation
 * @return {JSON} Optional. Returns a `.then()` function which gets called after every run of the animation
 */
function motion(props = {}) {
	let chainAfter = () => {};

	let startTime = 0,
		now = 0;

	let instance = createNewInstance(props);

	instance.tick = (time) => {
		now = time;
		if (!startTime) startTime = now;
		if (now - startTime >= instance.duration) {
			instance.animation(instance, instance.reverse ? 0 : 1);
			instance.playCount++;
			if (instance.loop) startTime = 0;
			else instance.stop = true;
			if (instance.reverseAfter) instance.toggleReverse();
			instance.then(instance);
			chainAfter();
		} else {
			let percentage = (now - startTime) / instance.duration;
			let calculatedVal = instance.easing(percentage);
			if (calculatedVal) instance.animation(instance, instance.reverse ? 1 - calculatedVal : calculatedVal);
		}
	};

	instance.resetRect = () => {
		instance.eleBaseUpdate = instance.ele.getBoundingClientRect();
	};

	instance.chainAfter = (afterFunc) => {
		chainAfter = afterFunc;
	};

	instance.toggleReverse = () => {
		instance.reverse = !instance.reverse;
	};

	instance.play = () => {
		instance.resetRect();
		activeInstances.push(instance);
		if (!frameID) engine();
	};

	instance.reset = (fromPosition = false) => {
		if (!fromPosition) instance.ele.style = "";
		instance.stop = false;
		startTime = 0;
		instance.play();
	};

	setTimeout(() => {
		instance.play();
	}, instance.delay);

	return {
		get: instance
	};
}

function createNewInstance(props) {
	return {
		id: ++instanceId,
		playCount: 0,
		ele: props.ele,
		eleBase: props.ele.getBoundingClientRect(),
		eleBaseUpdate: props.ele.getBoundingClientRect(),
		duration: props.duration || 1000,
		delay: props.delay || 0,
		reverse: props.reverse || false,
		reverseAfter: props.reverseAfter || false,
		loop: props.loop || false,
		easing: props.easing || ((x) => x),
		stop: props.stop || false,
		animation: props.animation,
		cssOptions: props.cssOptions || {},
		then: props.then || (() => {})
	};
}

function engine() {
	function play() {
		frameID = requestAnimationFrame(step);
	}

	function step(time) {
		let activeInstancesLength = activeInstances.length;
		if (activeInstancesLength) {
			for (let instance of activeInstances) {
				if (!instance.stop) instance.tick(time);
				else {
					let instanceIndex = activeInstances.indexOf(instance);
					if (instanceIndex > -1) {
						activeInstances.splice(instanceIndex, 1);
						activeInstancesLength = activeInstances.length;
					}
				}
			}
			play();
		} else frameID = cancelAnimationFrame(frameID);
	}

	return play();
}

class MotionChain {
	constructor(animationInfo) {
		this.animationInfo = animationInfo;
		this.animationInstances = [];
		this.runningInstances = [];

		for (let ani of this.animationInfo) {
			ani.stop = true;
			this.animationInstances.push(motion(ani).get);
		}
	}

	play() {
		this.runningInstances = this.animationInstances.slice();
		for (let x of this.runningInstances) x.reverse = false;
		this.run();
	}

	playReverse() {
		this.runningInstances = this.animationInstances.slice();
		this.runningInstances.reverse();
		for (let x of this.runningInstances) x.reverse = true;
		this.run();
	}

	run() {
		for (let i = 0; i < this.runningInstances.length; i++) {
			if (i < this.runningInstances.length - 1) {
				this.runningInstances[i].chainAfter(() => this.runningInstances[i + 1].reset(true));
			} else {
				this.runningInstances[i].chainAfter(() => (this.runningInstances = []));
			}
		}
		this.runningInstances[0].reset(true);
	}
}

const easings = {
	easeInOutQuart: (x) => {
		return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
	},
	easeOutQuart: (x) => {
		return 1 - Math.pow(1 - x, 4);
	},
	easeInQuart: (x) => {
		return x * x * x * x;
	}
};
