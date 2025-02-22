/**
 * @author Mugen87 / https://github.com/Mugen87
 */

import { EventDispatcher, Vector3, Logger } from 'yuka';

const PI05 = Math.PI / 2;
const direction = new Vector3();
const velocity = new Vector3();

let currentSign = 1;
let elapsedTime = 0;

class FirstPersonControls extends EventDispatcher {

	constructor( owner = null ) {

		super();

		this.owner = owner;

		this.movementX = 0; // mouse left/right
		this.movementY = 0; // mouse up/down

		this.acceleration = 40;
		this.brakingPower = 10;
		this.lookingSpeed = 1;
		this.headMovement = 1.5;

		this.input = {
			forward: false,
			backward: false,
			right: false,
			left: false
		};

		this.sounds = new Map();

		this._mouseMoveHandler = onMouseMove.bind( this );
		this._pointerlockChangeHandler = onPointerlockChange.bind( this );
		this._pointerlockErrorHandler = onPointerlockError.bind( this );
		this._keyDownHandler = onKeyDown.bind( this );
		this._keyUpHandler = onKeyUp.bind( this );

	}

	connect() {

		document.addEventListener( 'mousemove', this._mouseMoveHandler, false );
		document.addEventListener( 'pointerlockchange', this._pointerlockChangeHandler, false );
		document.addEventListener( 'pointerlockerror', this._pointerlockErrorHandler, false );
		document.addEventListener( 'keydown', this._keyDownHandler, false );
		document.addEventListener( 'keyup', this._keyUpHandler, false );

		document.body.requestPointerLock();

	}

	disconnect() {

		document.removeEventListener( 'mousemove', this._mouseMoveHandler, false );
		document.removeEventListener( 'pointerlockchange', this._pointerlockChangeHandler, false );
		document.removeEventListener( 'pointerlockerror', this._pointerlockErrorHandler, false );
		document.removeEventListener( 'keydown', this._keyDownHandler, false );
		document.removeEventListener( 'keyup', this._keyUpHandler, false );

	}

	update( delta ) {

		const input = this.input;
		const owner = this.owner;

		velocity.x -= velocity.x * this.brakingPower * delta;
		velocity.z -= velocity.z * this.brakingPower * delta;

		direction.z = Number( input.forward ) - Number( input.backward );
		direction.x = Number( input.left ) - Number( input.right );
		direction.normalize();

		if ( input.forward || input.backward ) velocity.z -= direction.z * this.acceleration * delta;
		if ( input.left || input.right ) velocity.x -= direction.x * this.acceleration * delta;

		owner.velocity.copy( velocity ).applyRotation( owner.rotation );

		//

		this._updateHead( delta );

	}

	setRotation( yaw, pitch ) {

		this.movementX = yaw;
		this.movementY = pitch;

		this.owner.rotation.fromEuler( 0, this.movementX, 0 );
		this.owner.head.rotation.fromEuler( this.movementY, 0, 0 );

	}

	_updateHead( delta ) {

		const owner = this.owner;
		const head = owner.head;

		// some simple head bobbing

		const speed = owner.getSpeed();

		elapsedTime += delta * speed; // scale delta with movement speed

		const motion = Math.sin( elapsedTime * this.headMovement );

		head.position.y = Math.abs( motion ) * 0.06;
		head.position.x = motion * 0.08;

		//

		head.position.y += owner.height;

		//

		const sign = Math.sign( Math.cos( elapsedTime * this.headMovement ) );

		if ( sign < currentSign ) {

			currentSign = sign;

			const audio = this.sounds.get( 'rightStep' );
			audio.play();

		}

		if ( sign > currentSign ) {

			currentSign = sign;

			const audio = this.sounds.get( 'leftStep' );
			audio.play();

		}

	}

}

// handler

function onMouseMove( event ) {

	this.movementX -= event.movementX * 0.001 * this.lookingSpeed;
	this.movementY -= event.movementY * 0.001 * this.lookingSpeed;

	this.movementY = Math.max( - PI05, Math.min( PI05, this.movementY ) );

	this.owner.rotation.fromEuler( 0, this.movementX, 0 ); // yaw
	this.owner.head.rotation.fromEuler( this.movementY, 0, 0 ); // pitch

}

function onPointerlockChange() {

	if ( document.pointerLockElement === document.body ) {

		this.dispatchEvent( { type: 'lock' } );

	} else {

		this.disconnect();

		this.dispatchEvent( { type: 'unlock' } );

	}

}

function onPointerlockError() {

	Logger.warn( 'YUKA.Player: Unable to use Pointer Lock API.' );

}

function onKeyDown( event ) {

	switch ( event.keyCode ) {

		case 38: // up
		case 87: // w
			this.input.forward = true;
			break;

		case 37: // left
		case 65: // a
			this.input.left = true;
			break;

		case 40: // down
		case 83: // s
			this.input.backward = true;
			break;

		case 39: // right
		case 68: // d
			this.input.right = true;
			break;

	}

}

function onKeyUp( event ) {

	switch ( event.keyCode ) {

		case 38: // up
		case 87: // w
			this.input.forward = false;
			break;

		case 37: // left
		case 65: // a
			this.input.left = false;
			break;

		case 40: // down
		case 83: // s
			this.input.backward = false;
			break;

		case 39: // right
		case 68: // d
			this.input.right = false;
			break;

	}

}

export { FirstPersonControls };