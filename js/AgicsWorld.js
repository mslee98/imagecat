function lerp(t, a, b) {
    return a + t * ( b - a );
}
function norm(t, a, b) {
    return ( t - a ) / ( b - a );
}
function map(t, a0, b0, a1, b1) {
    return lerp(norm(t, a0, b0), a1, b1);
}


function AgicsWorld(){
	this.canvas = document.querySelector('#agicsplot-canvas');
	this.scene = this.getScene();
	this.camera = this.getCamera();
	this.renderer = this.getRenderer();
	this.controls = this.getControls();
	this.statsFps = this.getStats(0);
	this.statsMs = this.getStats(1);
	this.color = new THREE.Color();
	this.center = {};
	this.group = new THREE.Group();
	this.linegroup = new THREE.Group();
	this.spherical = new THREE.Spherical();
	this.box = {}
	this.sphere = {};
	this.composer = null;
	this.bloomComposer = null;
	this.clock = new THREE.Clock();

	//fps 측정을 위한 변수들임
	this.totalYn = false;
	this.fpsTestYn = false

	this.initialFpsYn = false
	this.startTime = 0;
	this.endTime = 0;
	this.frameCount = 0
	this.timer = 0;

	this.layoutCheck = false;
	this.gridCheck = false;

	this.scenarioIndex;
	this.categoryUseYn = false;

	this.result = new Map()
	this.reset_btn = document.querySelector('#reset_btn');
	this.reset_btn.addEventListener('click', () => {
		if(this.fpsTestYn) {
			this.fpsTestYn = false;
		} else {
			this.fpsTestYn = true
		}
	})
	
	//vr button
	this.isVrButton = false;
	
	this.state = {
		flying: false,
		transitioning: false,
		displayed: false,
		mode: 'pan',
		colortransition: false,
		initcameraposition: false,
	};
	this.elems = {
		pointSize: 0,
	};
	
	this.raycaster = new THREE.Raycaster();
	this.pointer = new THREE.Vector2()

	// 수정사항
	// this.canvas.addEventListener('pointermove', this.onPointerMove.bind(this))/

	this.tempMatrix = new THREE.Matrix4();
	this.addEventListeners();
	
	// 초기 버튼 내용
	this.setMode("pan");
	
	this.leapYn = false;

	this.index = -1;
	this.controlsIndex = -1;
	this.lastControlsIndex = -1

	this.objects = [];
	
	this.leapController = new Leap.Controller(); // controller연결했는데 on() 메서드가 동작하는지를 모르겠음 이거 잘 살펴봐야할듯
	
	this.leapController.connect();
	
	const leapConnectionEvent = () => {

		this.cameraControls = new THREE.LeapCameraControls(this.camera);

		this.cameraControls.rotateEnabled  = true;
		this.cameraControls.rotateSpeed    = 3;
		this.cameraControls.rotateHands    = 1;
		this.cameraControls.rotateFingers  = [2, 3];
		
		this.cameraControls.zoomEnabled    = true;
		this.cameraControls.zoomSpeed      = 10;
		this.cameraControls.zoomHands      = 1;
		this.cameraControls.zoomFingers    = [4, 5];
		this.cameraControls.zoomMin        = 0;
		this.cameraControls.zoomMax        = 3000;
		
		this.cameraControls.panEnabled     = true;
		this.cameraControls.panSpeed       = 2;
		this.cameraControls.panHands       = 2;
		this.cameraControls.panFingers     = [6, 12];
		this.cameraControls.panRightHanded = false; // for left-handed person


		//분기처리 확실하게 해야 함.... 비동기 처리?해야할듯한데?
		this.renderer.setAnimationLoop(
			Leap.loop(this.leapRender.bind(this))
		);



		//이게 된다고!? 일단 모르겠다 진행ㄱㄱ
		this.renderer.setAnimationLoop(this.render.bind(this));
	}

	leapConnectionEvent()

	this.leapCellIdx = -1;

	// this.renderer.setAnimationLoop(this.branchRender.bind(this))

	//document.body.appendChild(window._vrbutton.createButton(this.renderer));
	//this.renderer.xr.enabled=true;

	// this.renderBranch()



}


AgicsWorld.prototype.onPointerMove = function(e) {

	this.pointer.x = ( e.clientX / window.innerWidth ) * 2 - 1;
	this.pointer.y = - ( e.clientY / window.innerHeight ) * 2 + 1;

	this.raycaster.setFromCamera(this.pointer, agicsworld.camera);

	// this.updateRayVisualization()

	//console.log(this.group.children[0].geometry.attributes.position.array);

	if(this.group) {
	
		this.raycaster.setFromCamera( this.pointer, agicsworld.camera );
	
		const intersects = this.raycaster.intersectObjects( this.scene.children);

		// console.log(intersects)
	}


}

AgicsWorld.prototype.reporting = function(event) {

	const popup_report = document.querySelector('#report_pop');
	const tbody = document.querySelector('#report_tbody');

	let labelArr = [], fpsArr = [], msArr = [];

	for( [key, value] of popup.result) {
		labelArr.push(key+1)

		let [a, b, ...resultFps] = value.fps
		let [c, d, ...resultMs] = value.ms
		
		fpsArr.push(Math.round(resultFps.reduce((a,b) => a + b) / resultFps.length))
		msArr.push(Math.round(resultMs.reduce((a,b) => a + b) / resultMs.length))
	}

	for(let i=0; i < fpsArr.length; i++) {
		var tr = document.createElement('tr');
		var td1 = document.createElement('td');
		td1.textContent = i+1;
		var td2 = document.createElement('td');
		td2.textContent = Math.round(fpsArr[i]);
		var td3 = document.createElement('td')
		td3.textContent = Math.round(msArr[i]);
		tr.appendChild(td1);
		tr.appendChild(td2);
		tr.appendChild(td3)
		tbody.append(tr)
	}

	const ctx = document.querySelector('#report_chart');

	let fpsAvg = document.querySelector('#fps_avg')
	let msAvg = document.querySelector('#ms_avg');

	fpsAvg.innerText= Math.round(fpsArr.reduce((a,b) => (a+b)) / fpsArr.length);
	msAvg.innerText= Math.round(msArr.reduce((a,b) => (a+b)) / msArr.length)

	new Chart(ctx, {
		type: 'line',
		data: {
			labels: labelArr,
			datasets: [
				{
					label: 'FPS',
					data: fpsArr,
					borderWidth: 2
				},
				{
					label: 'MS',
					data: msArr,
					borderWidth: 2
				},
			]
		},
		legend: {
			position: 'right'
		},
		options: {
			scales: {
				x: {
					grid: {
						color: '#9091AE'
					}
				},
				y: {
					beginAtZero: true,
					grid: {
						color: '#9091AE'
					}
				},
			},
			plugins: {
				legend: {
					position:'top',
					align: 'end'
				}
			},
		}
	});
}

AgicsWorld.prototype.onSelectStart = function(event){
	const controller = event.target;

				const intersections = this.getIntersections( controller );
				/*
				if ( intersections.length > 0 ) {

					const intersection = intersections[ 0 ];

					const object = intersection.object;
					object.material.emissive.b = 1;
					controller.attach( object );

					controller.userData.selected = object;

				}

				*/
}

AgicsWorld.prototype.getIntersections = function( controller ) {

	this.tempMatrix.identity().extractRotation( controller.matrixWorld );

	this.raycaster.ray.origin.setFromMatrixPosition( controller.matrixWorld );
	this.raycaster.ray.direction.set( 0, 0, - 1 ).applyMatrix4( this.tempMatrix );

	return this.raycaster.intersectObjects( group.children );

}

AgicsWorld.prototype.onSelectEnd = function(e){
	console.log(e);
}
AgicsWorld.prototype.xrControllerInit = function(){
	this.controller1 = this.renderer.xr.getController( 0 );
	this.controller1.addEventListener( 'selectstart', this.onSelectStart.bind(this) );
	this.controller1.addEventListener( 'selectend11', this.onSelectEnd );

	this.scene.add( this.controller1 );

	this.controller2 = this.renderer.xr.getController( 1 );
	this.controller2.addEventListener( 'selectstart', this.onSelectStart.bind(this) );
	this.controller2.addEventListener( 'selectend', this.onSelectEnd );

	this.scene.add( this.controller2 );

	const controllerModelFactory = window._controllerModelFactory;

	this.controllerGrip1 = this.renderer.xr.getControllerGrip( 0 );
	this.controllerGrip1.add( controllerModelFactory.createControllerModel( this.controllerGrip1 ) );
	this.scene.add( this.controllerGrip1 );

	this.controllerGrip2 = this.renderer.xr.getControllerGrip( 1 );
	this.controllerGrip2.add( controllerModelFactory.createControllerModel( this.controllerGrip2 ) );
	this.scene.add( this.controllerGrip2 );

	const geometry = new THREE.BufferGeometry().setFromPoints( [ new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, - 1 ) ] );

				const line = new THREE.Line( geometry );
				line.name = 'line';
				line.scale.z = 5;

				this.controller1.add( line.clone() );
				this.controller2.add( line.clone() );

}
AgicsWorld.prototype.addEventListeners = function(){
	this.addResizeListener();
	this.addLostContextListner();
	this.addModeChangListners();

}

AgicsWorld.prototype.addResizeListener = function(){
	window.addEventListener('resize',this.handleResize.bind(this),false);
}

AgicsWorld.prototype.addScalarChangeListener = function(){
	
}
AgicsWorld.prototype.addLostContextListner = function(){
	 this.canvas.addEventListener('webglcontextlost', function(e) {
		    e.preventDefault();
		    window.location.reload();
		  });
}

AgicsWorld.prototype.addTabChangeListeners = function(){
	  window.addEventListener('visibilitychange', function() {
		    this.canvas.width = this.canvas.width + 1;
		    setTimeout(function() {
		      this.canvas.width = this.canvas.width - 1;
		    }.bind(this), 50);
		  }.bind(this))
}


AgicsWorld.prototype.getScene = function(){
	var scene = new THREE.Scene();
	//scene background 설정을 하면 bloom 효과가 사라짐. 
	//scene.background = new THREE.Color(0x111111);
	return scene
}

AgicsWorld.prototype.getCamera = function(){

	
	var canvasSize = getCanvasSize();
	var aspectRatio = canvasSize.w/canvasSize.h;
	
    return new THREE.PerspectiveCamera(75, aspectRatio, 0.001, 3000);;
}

AgicsWorld.prototype.getRenderer = function(){
	var renderer = new THREE.WebGLRenderer({antialias:true, canvas:this.canvas,});
	renderer.setSize(window.innerWidth, window.innerHeight);
	
	return renderer
}

AgicsWorld.prototype.getControls = function(){

	let controls;

	//3d
	if(!this.leapYn) {
		controls = new THREE.OrbitControls(this.camera,this.canvas);
		controls.rotateSpeed = 0.25;
		controls.enableZoom = true;
		controls.dampingFactor = 0.05;
		controls.enableDamping = true;
		controls.maxPolarAngle = 0.5 * Math.PI;
		controls.panSpeed = .5;
		controls.zoomSpeed = 1.4;
		controls.minDistance= 0.005;
		controls.maxDistance= 2;
		controls.noRotate = true;

		this.controls = controls;
		  
	} else {
		// controls = new THREE.LeapCameraControls(this.camera);

		// controls.rotateEnabled  = true;
        // controls.rotateSpeed    = 3;
        // controls.rotateHands    = 1;
        // controls.rotateFingers  = [2, 3];
        
        // controls.zoomEnabled    = true;
        // controls.zoomSpeed      = 6;
        // controls.zoomHands      = 1;
        // controls.zoomFingers    = [4, 5];
        // controls.zoomMin        = 50;
        // controls.zoomMax        = 2000;
        
        // controls.panEnabled     = true;
        // controls.panSpeed       = 2;
        // controls.panHands       = 2;
        // controls.panFingers     = [6, 12];
        // controls.panRightHanded = false;
		
		// this.camereaControls = controls;
	}

	return controls;
}



/**
 * 이미지 클릭하면 확대하는 카메라 움직임을 정의
 */
AgicsWorld.prototype.moveTo = function(obj){
	if (this.state.flying) return;
	//초기 화면 카메라 전환중일때는 moveTo 불가
	if (welcome.worldtransition) return;
	
	this.state.flying = true;
	
	var vecobj = new THREE.Vector3(obj.x,obj.y,obj.z);

	var pos,tar;
	var cameraOrigin = new THREE.Vector3();
	var targetOrigin = new THREE.Vector3();
	var target = new THREE.Object3D();
	target.position.set(this.controls.target.x,this.controls.target.y,this.controls.target.z)
	cameraOrigin.copy(this.camera.position);
	targetOrigin.copy(target.position);
    var camDist = this.controls.minDistance;//16 *3;//
    var delta = this.camera.position.clone().sub(vecobj).normalize().multiplyScalar( camDist );
    var upVec = new THREE.Vector3(0,-0.0001,0);
    pos = vecobj.clone().add(delta).add(upVec);   
	tar = vecobj.clone().add(upVec);

	var exports = {
			time : 0
	}
	var delay = 0;
	 TweenLite.to(exports, 1.5 , {
         time: 1,
         ease: Power3.easeOut,
         delay:delay,
         onUpdate: function () {

             this.camera.position.x = lerp(exports.time, cameraOrigin.x, pos.x);
             this.camera.position.y = lerp(exports.time, cameraOrigin.y, pos.y);
             this.camera.position.z = lerp(exports.time, cameraOrigin.z, pos.z);
             
             target.position.x = lerp(exports.time, targetOrigin.x, tar.x);
             target.position.y = lerp(exports.time, targetOrigin.y, tar.y);
             target.position.z = lerp(exports.time, targetOrigin.z, tar.z);
//
			//this.controls.update();
             this.camera.lookAt(target.position);
             	
         }.bind(this),
         onComplete: function () {
        	 this.controls.target = new THREE.Vector3(tar.x,tar.y,tar.z)
        	 this.controls.update();
        	 //this.camera.lookAt(pos);
        	 this.state.flying = false;
         }.bind(this)
     });
	
	
}



AgicsWorld.prototype.gotoLandmark = function(obj){

	if(this.state.flying) return;
	if(obj ===undefined) return;
	
	const lodingdiv = document.querySelector('.overlay_search_popup_main');
	// lodingdiv.style.display = "table";
	// // lodingdiv.style.display = "block";
	// lodingdiv.children[0].children[0].style.fill="#fff";
	
	// welcome.ringElem.style.display = 'block';
	
	var vecobj = new THREE.Vector3(obj.x,obj.y,obj.z);
	this.state.flying = true;

	var pos,tar;
	var cameraOrigin = new THREE.Vector3();
	var targetOrigin = new THREE.Vector3();
	var target = new THREE.Object3D();
	target.position.set(this.controls.target.x,this.controls.target.y,this.controls.target.z)
	cameraOrigin.copy(this.camera.position);
	targetOrigin.copy(target.position);
	var camDist = this.controls.minDistance;//16 *3;//
    var delta = this.camera.position.clone().sub(vecobj).normalize().multiplyScalar( camDist );
    var upVec = new THREE.Vector3(0,-0.0001,0);
    pos = vecobj.clone().add(delta).add(upVec);   
	tar = vecobj.clone().add(upVec);
	
	// if(this.camera.position.distanceTo(pos)<0.03 &&!this.state.initcameraposition){
	// 	this.state.flying = false;
	// 	welcome.ringElem.style.display = 'none';
	// 	agicsworld.moveTo(obj);
	// 	lodingdiv.style.display = "none";
	// 	this.layoutCheck = false;
	// 	return;
	// }else if(this.camera.position.distanceTo(pos)<0.03&&this.state.initcameraposition){
	// 	this.state.flying = false;
	// 	welcome.ringElem.style.display = 'none';
	// 	lodingdiv.style.display = "none";
	// 	this.layoutCheck = false;

	// 	return
	// }


	// var speed = 0.1;
	// var duration = Math.min(8,Math.max(2,tar.distanceTo(this.controls.target)/speed));
	
	
	// var elevation = 0.05;
	// var cameras = this.gethotspot(this.camera.position,pos,elevation);
	// var targets = this.gethotspot(this.controls.target,tar,elevation);
	
	// var exports = {
	// 		time : 0
	// }
	// var delay = 0;
	// 	TweenLite.to(exports, duration , {
	// 		time: 1,
	// 		ease: Cubic.easeOut,
	// 		onUpdate: function(){
	// 		lodingdiv.style.display = "table";
	// 		// lodingdiv.style.display = "block";
	// 		lodingdiv.children[0].children[0].style.fill="#fff";
			
	// 		welcome.ringElem.style.display = 'block';	
			
	// 		if(this.state.initcameraposition){

	// 				this.camera.position.x = lerp(exports.time, cameraOrigin.x, pos.x);
	// 				this.camera.position.y = lerp(exports.time, cameraOrigin.y, pos.y);
	// 				this.camera.position.z = lerp(exports.time, cameraOrigin.z, pos.z);
					
	// 				target.position.x = lerp(exports.time, targetOrigin.x, tar.x);
	// 				target.position.y = lerp(exports.time, targetOrigin.y, tar.y);
	// 				target.position.z = lerp(exports.time, targetOrigin.z, tar.z);
					
	// 				this.camera.lookAt(0,0,0);
	// 			}else{
	// 				this.camera.position.copy(bilinearLerp(exports.time,cameras))
	// 				this.controls.target.copy(bilinearLerp(exports.time,targets))
	// 			}
	// 		}.bind(this),
	// 	onComplete:function(){
	// 			exports.time = 1;
	// 				this.camera.position.copy(bilinearLerp(exports.time,cameras))
	// 				if(this.state.initcameraposition){
	// 					this.camera.lookAt(0,0,0);
	// 					this.controls.target.copy(new THREE.Vector3(0,0,0));
	// 				}else{
	// 					this.controls.target.copy(bilinearLerp(exports.time,targets))
	// 				}
				
	// 				this.state.flying = false;
	// 				this.state.initcameraposition = false;
	// 				welcome.ringElem.style.display = 'none';
	// 				lodingdiv.style.display = "none";

	// 				console.log("animation end...")
	// 	}.bind(this),
			
	// 	})

	if(!this.layoutCheck) {
		if(this.camera.position.distanceTo(pos)<0.03 &&!this.state.initcameraposition){
			this.state.flying = false;
			welcome.ringElem.style.display = 'none';
			agicsworld.moveTo(obj);
			lodingdiv.style.display = "none";
			this.layoutCheck = false;
			return;
		}else if(this.camera.position.distanceTo(pos)<0.03&&this.state.initcameraposition){
			this.state.flying = false;
			welcome.ringElem.style.display = 'none';
			lodingdiv.style.display = "none";
			this.layoutCheck = false;

			return
		}
	} else {
		var speed = 0.1;
		var duration = Math.min(8,Math.max(2,tar.distanceTo(this.controls.target)/speed));
		
		
		var elevation = 0.05;
		var cameras = this.gethotspot(this.camera.position,pos,elevation);
		var targets = this.gethotspot(this.controls.target,tar,elevation);
		
		var exports = {
				time : 0
		}
		var delay = 0;
		 TweenLite.to(exports, duration , {
			 time: 1,
			 ease: Cubic.easeOut,
			 onUpdate: function(){
				lodingdiv.style.display = "table";
				// lodingdiv.style.display = "block";
				lodingdiv.children[0].children[0].style.fill="#fff";
				
				welcome.ringElem.style.display = 'block';	
				
				if(this.state.initcameraposition){
	
					 this.camera.position.x = lerp(exports.time, cameraOrigin.x, pos.x);
					 this.camera.position.y = lerp(exports.time, cameraOrigin.y, pos.y);
					 this.camera.position.z = lerp(exports.time, cameraOrigin.z, pos.z);
					 
					 target.position.x = lerp(exports.time, targetOrigin.x, tar.x);
					 target.position.y = lerp(exports.time, targetOrigin.y, tar.y);
					 target.position.z = lerp(exports.time, targetOrigin.z, tar.z);
					 
					 this.camera.lookAt(0,0,0);
					}else{
					 this.camera.position.copy(bilinearLerp(exports.time,cameras))
					 this.controls.target.copy(bilinearLerp(exports.time,targets))
					}
				}.bind(this),
			onComplete:function(){
				   exports.time = 1;
					 this.camera.position.copy(bilinearLerp(exports.time,cameras))
					 if(this.state.initcameraposition){
						 this.camera.lookAt(0,0,0);
						 this.controls.target.copy(new THREE.Vector3(0,0,0));
					 }else{
						 this.controls.target.copy(bilinearLerp(exports.time,targets))
					 }
					
					 this.state.flying = false;
					 this.state.initcameraposition = false;
					 welcome.ringElem.style.display = 'none';
					 lodingdiv.style.display = "none";
	
					 console.log("animation end...")
//					 const index = this.getScenarioJsonData(this.scenarioIndex);

					 if(!this.gridCheck) {
						 const resIndex = this.getScenarioJsonData(this.scenarioIndex)
							 .then(result => {
								popup.showimage([], result)	
							})
					 } else {
						this.gridCheck = false;
					 }

					// this.getScenarioJsonData(this.scenarioIndex)
			}.bind(this),
				
			})

	}
	
}


AgicsWorld.prototype.getScenarioJsonData = function(index) {

	return new Promise((resolve, reject) => {
		var xhr = new XMLHttpRequest();
		xhr.open('GET', '/js/scenario.json', true);
		xhr.responseType = 'json';
		xhr.onload = function() {
			if (xhr.status === 200) {
				var data = xhr.response;
				const dataArr = Object.values(data);
				let scenarioIdx = 0;
	
				dataArr.forEach((item, idx) => {
					if(idx+1 === index) {
						scenarioIdx = item.index
					}
				})

				resolve(scenarioIdx);
	
			} else {
				console.error('Error fetching data:', xhr.status, xhr.statusText);
			}
		};
		xhr.onerror = function() {
			console.error('Network Error');
		};
		xhr.send();

	})
}

AgicsWorld.prototype.gethotspot = function(a,b,elevation){
	   elevation = elevation || 0.035;
       var points = [a];
 

       var mid = new THREE.Vector3(    lerp( .5, a.x, b.x ),
                                       elevation,
                                       lerp( .5, a.z, b.z ) );

       points.push( mid );
       points.push( b );


       return points;
}


// 인덱스 위치`idx`에서 셀로 이동
AgicsWorld.prototype.moveCellIdx =function(idx,randmark){
	
	var cell = data.cells[idx];

	console.error(idx, "   /   ",cell)

//3d
	//그리드 형태 변환할때 카메라 경로
	if(idx === -7){
		this.state.initcameraposition = true;

		this.gridCheck = true;

		agicsworld.gotoLandmark({
			x: 0.0,
			y: 1.7,
			z: 0.9,
		})
	}else if(idx === "search"){
		this.state.initcameraposition = true;
		agicsworld.gotoLandmark({
			x: 0.0,
			y: 0.2,
			z: 0.1,
		})
	}
	else if(randmark){

		agicsworld.gotoLandmark({
			x: cell.x,
			y: cell.y,
			z: cell.z,
		})
	}else{
		agicsworld.moveTo({
			x: cell.x,
			y: cell.y,
			z: cell.z,
		})
	}

}
AgicsWorld.prototype.getStats = function(modeNumber){
	//if(!window.location.href.includes('stats=true')) return null;

	let stats;

	switch(modeNumber) {
		case 0: {
			stats = new Stats()
			stats.setMode(0);
			break;
		}
		case 1: {
			stats = new Stats()
			stats.setMode(1);
			break;
		}
		default: {
			stats = new Stats()
			stats.setMode(0);
		}
	} 

	var thisParaent = document.getElementById("stats-output");
	thisParaent.appendChild(stats.domElement);

	return stats;

}

AgicsWorld.prototype.setCenter = function(){
	this.center ={
			x:(data.boundingBox.x.min + data.boundingBox.x.max)/2,
			z:(data.boundingBox.z.min + data.boundingBox.z.max)/2,
			
	}
	

}


//추후 개발(각종 모드)
AgicsWorld.prototype.addModeChangListners = function(){
	document.querySelector('#pan').addEventListener('click',this.handleModeIconClick.bind(this));
	document.querySelector('#move').addEventListener('click',this.handleModeIconClick.bind(this));
}

AgicsWorld.prototype.handleModeIconClick = function(e){
	this.setMode(e.target.id);
}

AgicsWorld.prototype.setMode = function(mode){
	
	this.mode = mode;
	
	var elems = document.querySelector('.view_control')
	
	for (var i=0 ; i<elems.children.length;i++){
		elems.children[i].classList.remove('active');
	}
	
	if(this.mode === 'pan'){
		document.querySelector('.lz').classList.add("active");

		this.controls.enablePan = false;
		this.controls.enableRotate = true;
		this.controls.mouseButtons.LEFT = 0;
		this.controls.mouseButtons.RIGHT = 2;

		this.canvas.classList.remove('move');
		this.canvas.classList.add('pan');

	}else if(this.mode ==='move'){
		document.querySelector('.lxy').classList.add("active");

		this.controls.enablePan = true;
		this.controls.enableRotate = false;
		this.controls.mouseButtons.LEFT = 2;
		this.controls.mouseButtons.RIGHT = 0;

		this.canvas.classList.remove('pan');
		this.canvas.classList.add('move');

		/**
		 * 아이템을 선택하면 값을 초기화 시킴 
		 * 클릭 좌표를 저장한 이유는 무엇?
		 * 
		 * ItemSelect.pos0 = null;
		 * ItemSelect.pos1 = null;
		 * ItemSelect.frozen = false;
		 */
		itemselect.start();
	}
}



/**
*  `attrs`의 각 속성에서 needsUpdate 플래그를 true로 설정하십시오
**/


AgicsWorld.prototype.attrsNeedUpdate = function(attrs){
	this.group.children.forEach(function(mesh){
		if(mesh.name === "atlaspoint") {
		attrs.forEach(function(attr){
			mesh.geometry.attributes[attr].needsUpdate = true;
 		}.bind(this))
		}
 		
	}.bind(this))
}


AgicsWorld.prototype.getHeightMap = function(callback){
	var img = new Image();
	img.onload = function(){
		var canvas = document.createElement('canvas'),
		ctx = canvas.getContext('2d');
		canvas.width = img.width;
		canvas.height = img.height;
		ctx.drawImage(img,0,0);
		this.heightmap = ctx.getImageData(0,0,img.width,img.height);
		callback();
	}.bind(this);
	img.crossOrigin = "Anonymous";
	img.src = this.heightmap|| '/assets/images/heightmap.png';
}



//좌표 x, y에서 하이트 맵의 높이를 결정
AgicsWorld.prototype.getHeightAt = function(x,y){
	var x=(x+1)/2,
		y=(y+1)/2,
		row = Math.floor(y*(this.heightmap.height-1)),
		col = Math.floor(x*(this.heightmap.width-1)),
		idx = (row * this.heightmap.width*4)+(col*4),
		z = this.heightmap.data[idx] * (1/3000 || 0.0);
	return z;
	
	
}


AgicsWorld.prototype.handleResize = function() {

	var elem = document.querySelector('#agicsplot-canvas')

	//이 함수 확인 필요함
	// function getCanvasSize(){
	// 	var elem = document.querySelector('#agicsplot-canvas');
	
	// 	return {
	// 		w: elem.clientWidth,
	// 		h: elem.clientHeight,
	// 	}
	// }

	  var canvasSize = getCanvasSize()
	      w = canvasSize.w * window.devicePixelRatio,
	      h = canvasSize.h * window.devicePixelRatio;

	// let w = window.innerWidth;
	// let h = window.innerHeight;

	  this.camera.aspect = w / h;
	  this.camera.up.set(0,1,0);
	  this.camera.updateProjectionMatrix();
	  this.renderer.setSize(w, h, false);
	  //this.controls.handleResize();
	  choose.tex.setSize(w, h);
	  this.setPointScalar();
	}


AgicsWorld.prototype.setPointScalar = function() {
	  // handle case of drag before scene renders
	  if (!this.state.displayed) return;
	  // update the displayed and selector meshes
	  this.setUniform('scale', this.getPointScale())
	}



AgicsWorld.prototype.plot = function(){
	
	var drawCallToCells = this.getDrawCallToCells();
	
	for (var drawCallIdx in drawCallToCells){
		var meshCells = drawCallToCells[drawCallIdx],
			attrs = this.getGroupAttributes(meshCells),//vertect 속성 생성
			geometry = new THREE.BufferGeometry();

		
		geometry.setAttribute('position',attrs.pos0);
		geometry.setAttribute('pos1',attrs.pos1);
		geometry.setAttribute('color',attrs.color);
		geometry.setAttribute('width',attrs.width);
		geometry.setAttribute('height',attrs.height);
		geometry.setAttribute('offset',attrs.offset);
		geometry.setAttribute('opacity',attrs.opacity);
		geometry.setAttribute('selected',attrs.selected);
		geometry.setAttribute('textureIndex',attrs.textureIndex);
		geometry.setAttribute('highlight',attrs.highlight);
		geometry.setAttribute('isvideo',attrs.isvideo);
		geometry.setAttribute('actionstate',attrs.actionstate);

		 // 드로우 범위를 지정하지 않으면 점이 렌더링되지 않습니다
		geometry.setDrawRange(0,meshCells.length);
		
		
		 var material = this.getShaderMaterial({
		      firstTex: attrs.texStartIdx,
		      textures: attrs.textures,
		      useColor: false,
		    });

		 material.transparent = true;
		
		// var particles = new THREE.Points( geometry, material );
		var particles = new THREE.Points( geometry, material );
		console.log(particles)
		

		particles.frustumCulled = false;
		particles.name = "atlaspoint";
 		this.group.add(particles);
 		
	 }
	//배경이 되는 구를 만듬
	//this.sphereinit();
	
	this.scene.add(this.group);


	
}
AgicsWorld.prototype.setBuffer = function(key, arr) {
	  var drawCallToCells = agicsworld.getDrawCallToCells();
	  for (var i in drawCallToCells) {
	    var cells = drawCallToCells[i];
	    if(this.group.children[i].type==="atlaspoint"){

	    	  var attr = agicsworld.group.children[i].geometry.attributes[key];
	  	    attr.array = arr.slice(cells[0].idx, cells[cells.length-1].idx+1);
	  	    attr.needsUpdate = true;
	    }
	  
	  }
	}
AgicsWorld.prototype.setColor = function(){
	
	if(this.state.colortransition) return;
	
	this.state.colortransition = true;
	
	var material =null;
	for(var i =0 ; i<this.group.children.length ; i++){
		if(this.group.children[i].name=="atlaspoint"){

			material = agicsworld.group.children[i].material.uniforms.borderColor
			    
		  }
	}
	
	var color = new Float32Array([33/255, 255/255, 52/255])
	
	var exports = {
			time : 0
	}
	var delay = 0;
	 TweenLite.to(exports, 1.5 , {
         time: 1,
         ease: Power3.easeOut,
         delay:delay,
         onUpdate: function () {
        	 
        	 material.value[0] = lerp(exports.time,  material.value[0], color[0]);
        	 material.value[1] = lerp(exports.time, material.value[1],color[1]);
        	 material.value[2] = lerp(exports.time, material.value[2],color[2]);
        	 
        	 
             	
         }.bind(this),
         onComplete: function () {

        	 material.value = new Float32Array([255/255, 255/255, 255/255])
        	 this.state.colortransition = false;
         }.bind(this)
     });
	
	
	
}



AgicsWorld.prototype.getShaderMaterial = function(obj){
	var uniforms = 
	    {
			textures: { type: "t" 
				,value: obj.textures
				},
			render:{
				type:'f',
				value:0,
			},
			lodTexture: {
		        type: 't',
		        value: lod.tex.texture,
		      },
		    playTexture: {
			        type: 't',
			        value: data.playtex,
			      },
		    transitionPercent: {
		        type: 'f',
		        value: 0,
		      },
		    scale: {
		        type: 'f',
		        value: this.getPointScale(),
		      },
		    scaleTarget: {
		        type: 'f',
		        value: this.getPointScale(),
		      },
			 useColor: {
			        type: 'f',
			        value: obj.useColor ? 1.0 : 0.0,
			      },
			      cellAtlasPxPerSide: {
			        type: 'f',
			        value: config.size.texture,
			      },
			      lodAtlasPxPerSide: {
			        type: 'f',
			        value: config.size.lodTexture,
			      },
			      cellPxHeight: {
			        type: 'f',
			        value: config.size.cell,
			      },
			      lodPxHeight: {
			        type: 'f',
			        value: config.size.lodCell,
			      },
			      borderWidth: {
			        type: 'f',
			        value: 0.30,
			      },
			      borderColor: {
			        type: 'vec3',
			        value: new Float32Array([33/255, 255/255, 52/255]),
			      }, 
			      delay: {
			          type: 'f',
			          value: config.transitions.delay,
			        },
			      time:{
			    	  type: 'f',
			    	  value:Date.now(),
				  },
				  actionstart:{
					  type:'f',
					  value:0.0,
				  },
			  
			      
		};

	
	 
	
		var Rfragmentshader = this.getFragmentShader(obj);
	  // set the uniforms and the shaders to use
	  return new THREE.ShaderMaterial( {
			uniforms: uniforms,
			vertexShader: VertexShader,
			fragmentShader: Rfragmentshader,
			transparent: true,

		} );
	
}


AgicsWorld.prototype.getPointScale = function(){
	var size = parseFloat(this.elems.pointSize),
    canvasSize = getCanvasSize();
	return size * window.devicePixelRatio * canvasSize.h 
}


/**
* 
	`obj.startIdx`에서`obj.endIdx` 인덱스로 텍스처 반환
**/

AgicsWorld.prototype.getTextures = function(obj){
	var textures =[];
	for (var i=obj.startIdx; i<=obj.endIdx;i++){
		var tex = this.getTexture(data.textures[i].canvas);
		textures.push(tex);
	}
	return textures;
}


AgicsWorld.prototype.getTexture = function(canvas){
	var tex = new THREE.Texture(canvas);
	tex.needsUpdate = true;
	tex.flipY = false;
	tex.generateMipmaps =false;
	
	tex.magFilter = THREE.LinearFilter;
	tex.minFilter = THREE.LinearFilter;
	return tex;
}

/**
* 
메시의 초기 드로우 콜에 대한 속성 데이터를 반환
**/
AgicsWorld.prototype.getGroupAttributes = function(cells){
	
	var t = this.getCellIterators(cells.length);
	
	for (var i=0;i<cells.length;i++){
		var cell = cells[i];
		var rgb = this.color.setHex(cells[i].idx+1);
		t.texIndex[t.texindexItor++] = cell.texIdx;
		t.pos0[t.pos0Itor++] = cell.x; //현재 position.x
		t.pos0[t.pos0Itor++] = cell.y; //현재 position.z (추후 변경예정)
		t.pos0[t.pos0Itor++] = cell.z; //현재 position.y 
		t.pos1[t.pos1Itor++] = cell.tx;
		t.pos1[t.pos1Itor++] = cell.ty;
		t.pos1[t.pos1Itor++] = cell.tz;
		t.color[t.colorItor++] = rgb.r;
		t.color[t.colorItor++] = rgb.g;
		t.color[t.colorItor++] = rgb.b;
		t.opacity[t.opacitryItor++] = 1.0; // cell 불투명도 값
		t.selected[t.selectedItor++] = 0.0 // cell이 선택되어있으면 1.0 아닐경우 0.0
		t.width[t.widthItor++] = cell.w; //lod 아틀라스 너비
		t.height[t.heightItor++] = cell.h; // lod 아틀라스 높이
		t.offset[t.offsetItor++] = cell.dx; // tex의 왼쪽에서 셀의 px오프셋 (uv오프셋)
		t.offset[t.offsetItor++] = cell.dy;
		t.highlight[t.highlightItor++] = cell.highlight; // highlight;
		t.isvideo[t.isvideoItor++] = cell.isVideo;
		t.actionstate[t.actionstate++] = cell.actionstate;
	}
	var pos0 = new THREE.BufferAttribute(t.pos0,3,true,1),
		pos1 = new THREE.BufferAttribute(t.pos1,3,true,1),
		color = new THREE.BufferAttribute(t.color,3,true,1),
		opacity = new THREE.BufferAttribute(t.opacity,1,true,1),
		selected = new THREE.Uint8BufferAttribute(t.selected,1,false,1),
		texIndex = new THREE.Int8BufferAttribute(t.texIndex, 1, false,1),
		width = new THREE.Uint8BufferAttribute(t.width,1,false,1),
		height = new THREE.Uint8BufferAttribute(t.height,1,false,1),
		offset = new THREE.Uint16BufferAttribute(t.offset,2,false,1);
		highlight = new THREE.Uint8BufferAttribute(t.highlight,1,false,1),
		isvideo =  new THREE.Uint8BufferAttribute(t.isvideo,1,false,1);
		actionstate = new THREE.Uint8BufferAttribute(t.actionstate,1,false,1);
		
		
	texIndex.usage = THREE.DynamicDrawUsage;
	pos0.usage = THREE.DynamicDrawUsage;
	pos1.usage = THREE.DynamicDrawUsage;
	opacity.usage = THREE.DynamicDrawUsage;
	selected.usage = THREE.DynamicDrawUsage;
	offset.usage = THREE.DynamicDrawUsage;
	highlight.usage = THREE.DynamicDrawUsage;
	isvideo.usage = THREE.DynamicDrawUsage;
	actionstate.usage = THREE.DynamicDrawUsage;
	var texIndices = this.getTexIndex(cells);

	return {
		pos0: pos0,
		pos1: pos1,
		color: color,
		width: width,
		height : height,
		offset: offset,
		opacity : opacity,
		selected: selected,
		highlight : highlight,
		textureIndex : texIndex,
		isvideo : isvideo,
		actionstate:actionstate,
		textures : this.getTextures({
			startIdx : texIndices.first,
			endIdx : texIndices.last,
		}),
		texStartIdx : texIndices.first,
		texEndIdx: texIndices.last,
	}

}

AgicsWorld.prototype.getFragmentShader = function(obj){
	 var useColor = obj.useColor,
     firstTex = obj.firstTex,
     textures = obj.textures,
     fragShader = FragmentShader

 // the calling agent requested the color shader, used for selecting
 if (useColor) {
   fragShader = fragShader.replace('uniform sampler2D textures[N_TEXTURES];', '');
   fragShader = fragShader.replace('TEXTURE_LOOKUP_TREE', '');
   return fragShader;
 // the calling agent requested the textured shader
 } else {
   // get the texture lookup tree
   var tree = this.getFragLeaf(-1, 'lodTexture');
   
   
   for (var i=firstTex; i<firstTex + textures.length; i++) {
     tree += ' else ' + this.getFragLeaf(i, 'textures[' + i + ']');
   }
   // replace the text in the fragment shader
   fragShader = fragShader.replace('#define SELECTING\n', '');
   fragShader = fragShader.replace('N_TEXTURES', textures.length);
   fragShader = fragShader.replace('TEXTURE_LOOKUP_TREE', tree);
   return fragShader;
 }
}

/**
* Get the leaf component of a texture lookup tree (whitespace is aesthetic)
**/



AgicsWorld.prototype.getFragLeaf = function(texIdx,tex){
	return 'if (textureIndex == '+texIdx +') {\n       '+
		'gl_FragColor = texture2D('+tex+', scaledUv);\n        }';
	
}

AgicsWorld.prototype.getCellIterators = function(n){
	return {
		pos0 : new Float32Array(n*3),
		pos1 : new Float32Array(n*3),
		color : new Float32Array(n*3),
		width: new Uint8Array(n),
		height:new Uint8Array(n),
		offset: new Uint16Array(n*2),
		opacity : new Float32Array(n),
		selected : new Uint8Array(n),
		texIndex : new Int8Array(n),
		highlight : new Uint8Array(n),
		isvideo : new Uint8Array(n),
		actionstate : new Uint8Array(n),
		pos0Itor:0,
		pos1Itor:0,
		colorItor:0,
		widthItor:0,
		heightItor:0,
		offsetItor:0,
		opacitryItor:0,
		selectedItor:0,
		texindexItor:0,
		highlightItor:0,
		isvideoItor:0,
		actionstate:0
	}
}


/**
* 셀 목록에서 첫 번째와 마지막이 아닌 "-1" tex 인덱스 찾기
**/

AgicsWorld.prototype.getTexIndex = function(cells){
	// -1이 아닌 첫 번째 index을 찾습니다
	var f=0; while (cells[f].texIdx ==-1) f++;
	// -1이 아닌 마지막 index을 찾습니다.
	var l =cells.length-1; while (cells[l].texIdx ==-1) l--;
	
	return { 
		first: cells[f].texIdx,
		last: cells[l].texIdx,		
	}
}

/**
* 각 셀의 드로우 콜 인덱스 찾기
**/
AgicsWorld.prototype.getDrawCallToCells = function(){
	var drawCallToCells ={};
	for (var i=0; i<data.cells.length;i++){
		var cell = data.cells[i],
			drawCall = cell.getIndexOfDrawCall();
		if(!(drawCall in drawCallToCells)) drawCallToCells[drawCall] =[cell]
		else drawCallToCells[drawCall].push(cell);
		
	}
	return drawCallToCells;
}






AgicsWorld.prototype.setUniform = function(key,val){
	var meshes = this.group.children.concat(choose.scene.children[0].children);
	for(var i=0;i<meshes.length;i++){
		if(meshes[i].name ==="atlaspoint") meshes[i].material.uniforms[key].value=val;
		
	}
}


AgicsWorld.prototype.sphereinit = function(){
		var geom = new THREE.IcosahedronGeometry(2,4);
		var material = this.getsphereShaderMaterial();
		var mesh = new THREE.Mesh(geom,material);
		this.sphere = mesh;
		this.group.add(this.sphere);
}


AgicsWorld.prototype.getsphereShaderMaterial = function(){
	var tex = data.backgroundtex;
	tex.needsUpdate = true;
	tex.generateMipmaps =true;
	tex.wrapS = THREE.RepeatWrapping;
	tex.wrapT = THREE.RepeatWrapping;
	tex.magFilter = THREE.LinearFilter;
	tex.minFilter = THREE.LinearMipMapLinearFilter;
	
	var grey = .75;
	var material = new THREE.ShaderMaterial({
		uniforms:{
			top:{type :"v3",value:new THREE.Vector3(1,1,1)},
			bottom:{type:"v3",value:new THREE.Vector3(grey,grey,grey)},
			threshold: {type: "f",value:.075},
			sphereTexture:{type:"t",value:tex}
		},
		vertexShader : sphereVertexShader,
		fragmentShader: sphereFragmentShader,
		//side:THREE.BackSide,

	})
	
	return material
}

// AgicsWorld.prototype.updateRayVisualization = function() {
// 	this.rayStart.copy(this.camera.position);
//     this.rayEnd.copy(this.raycaster.ray.direction).multiplyScalar(1000).add(this.rayStart);
//     this.rayGeometry.verticesNeedUpdate = true; // 버텍스 업데이트
// }

AgicsWorld.prototype.init = function(){
	
	var axes = new THREE.AxesHelper(30000);
    var helper = new THREE.CameraHelper(agicsworld.camera);
    
    // //개발할때 필요한 3D 헬퍼
    // this.scene.add(helper);
    // this.scene.add(axes);

	// 추후 3d 코드 (개발예정 )
    var light = new THREE.PointLight( 0xffffff, 1 );
    this.camera.add( light );
    

	// 여기서 설정하면 뭐하냐고 이미 다른곳에 설정하는구만;;;
    this.camera.position.set(0, 0.8, 0.0);
    // this.camera.rotation.y = Math.PI
    //this.camera.layers.enable(1);
	this.setCenter();





	
	// 레이캐스터 시각화를 위한 머티리얼 생성
	// this.rayMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });

	// // 광선 시각화를 위한 시작점과 끝점 설정
	// this.rayStart = this.camera.position.clone();
	// this.rayDirection = new THREE.Vector3(0, 0, -1); // 카메라가 바라보는 방향으로 설정 (카메라의 -Z 방향)
	// this.rayEnd = this.rayStart.clone().add(this.rayDirection.multiplyScalar(1000)); // 광선의 최대 길이를 설정하여 끝점 계산

	// // 광선 시각화를 위한 기하 객체 생성
	// this.rayGeometry = new THREE.Geometry();
	// this.rayGeometry.vertices.push(this.rayStart, this.rayEnd);

	// // 레이캐스터 시각화를 위한 라인 생성
	// this.rayLine = new THREE.Line(this.rayGeometry, this.rayMaterial);
	// this.scene.add(this.rayLine);

	// 각 그리기 호출에 대한 셀을 추가
	itemselect.init();

	// 점을 그리고 렌더 루프를 시작합니다
	this.plot();

	//캔버스 크기 조정 및 렌더링 된 자산 크기 조정
	this.handleResize();
	
	this.render();
	
	this.setMode('pan');
	agicsworld.state.displayed = true;

	this.renderer.xr.setReferenceSpaceType( 'local' );

	
}

let boxMesh;


var lastFrame = Date.now();
var thisFrame;

var time = 0.0;
AgicsWorld.prototype.render = function() {
	  //requestAnimationFrame(this.render.bind(this));
	  

	// this.group.position.set(Math.random()*5-5, Math.random()*5-5,Math.random()*5-5)

	  if (!this.state.displayed) return;

	  if(window._vrbutton && window._controllerModelFactory&& !this.isVrButton){
		  document.body.appendChild(window._vrbutton.createButton(this.renderer));
		  this.raycaster = new THREE.Raycaster();
		  this.renderer.xr.enabled=true;
		  this.renderer.outputEncoding = THREE.sRGBEncoding;
		  this.renderer.shadowMap.enabled = true;
		  this.xrControllerInit();

		  const light = new THREE.DirectionalLight( 0xffffff );
				light.position.set( 0, 6, 0 );
				light.castShadow = true;
				light.shadow.camera.top = 2;
				light.shadow.camera.bottom = - 2;
				light.shadow.camera.right = 2;
				light.shadow.camera.left = - 2;
				light.shadow.mapSize.set( 4096, 4096 );
				this.scene.add( light );

		  this.isVrButton = true;


	  }
	  //this.setColor();

	
	//   this.stats.update(); 2개 있어서 주석 처리
	this.statsFps.update();
	// console.log(this.statsFps)
	this.statsMs.update();

	  if(popup.frameCheck) {
		popup.frameCount++;
		let currentTime = performance.now();
		let elapsedTime = currentTime - popup.startTime;
		
		if(elapsedTime >= 100) {
			var fps = popup.frameCount/ (elapsedTime / 1000);
			var ms = elapsedTime / popup.frameCount;

			popup.fpsArr.push(fps);
			popup.msArr.push(ms);

			popup.startTime = currentTime;
			popup.frameCount = 0;
		}

	  }

	// if(popup.frameCheck) {
	// 	popup.frameCount++;

	// 	var currentTime = performance.now();
	// 	var elapsedTime = currentTime - popup.startTime;

	// 	// console.log(`ss ${popup.frameCount} / ${elapsedTime} = ${currentTime}- ${popup.startTime}`)

	// 	console.log(`elapsedTime : ${elapsedTime}`)
		

	// 	if( elapsedTime > 1000) {
	// 		popup.startTime = performance.now();
	// 		popup.frameCount = 0;
	// 	}

	// 	if(elapsedTime >= 100) {
	// 		var fps = popup.frameCount/ (elapsedTime / 1000);
	// 		var ms = elapsedTime / popup.frameCount;
			
	// 		console.log(`fps : ${fps} / ms : ${ms}`)

	// 		popup.startTime = currentTime;
	// 		popup.frameCount = 0;
	// 	}
	// }

	// if(popup.frameCheck) {
	// 	popup.frameCount++;

	// 	var currentTime = performance.now();
	// 	var elapsedTime = currentTime - popup.startTime;
		
	// 	console.log(`ss ${popup.frameCount} / ${elapsedTime} = ${currentTime}- ${popup.startTime}`)

	// 	let msArr = [];
	// 	let fpsArr = [];

	// 	if(elapsedTime >= 100) {
	// 		popup.timer += 0.1;
			
	// 		var fps = popup.frameCount/ (elapsedTime / 1000);
	// 		var ms = elapsedTime / popup.frameCount;

	// 		fpsArr.push(fps);
	// 		msArr.push(ms);

	// 		// console.log(`${popup.timer} / ${fps} / ${ms}`)
	// 		console.log(`elapsedTime / ${elapsedTime}`)
	// 		console.log(`${popup.timer.toFixed(1)} s / ${fps.toFixed(2)} FPS / ${ms.toFixed(2)} ms per frame`);
	
	// 		// if(!popup.has(popup.timer)) {
	// 		// 	popup.set(popup.timer, `${fps}-${ms}`);
	// 		// }
	
	// 		popup.frameCount = 0;
	// 		popup.startTime = currentTime;
	// 	}
	// }



	  if(!search.state.serching &&bloom.bloomrender&&agicsworld.camera.position.y<0.5){
		  bloom.bloomPass.strength = (3.2*(1+Math.abs(Math.sin(time))));
		  bloom.render();

		  
	  }
	  
	  this.renderer.render(this.scene, this.camera);
	  this.controls.update();

	  thisFrame = Date.now();
	  time += (thisFrame - lastFrame)/1000;	
	  lastFrame = thisFrame;
	  

	  // update the level of detail mechanism
	  lod.update();

	  // update the dragged selection
	  itemselect.update();
}


/**
 * Frame data가 올 때만 실행
 */
AgicsWorld.prototype.leapRender = function(frame){
	
	if (!this.state.displayed) return;

	if(frame) {
		this.showCursor(frame);
	
		this.controlsIndex = this.focusObject(frame);
	
		if(this.index == -1) {
			this.cameraControls.update(frame)
		}
	}


	// setInterval(this.changeControlsIndex, 250);
	// setIntercal(this.cellChangeControlsIndex, 250);

	  if(window._vrbutton && window._controllerModelFactory&& !this.isVrButton){
		  document.body.appendChild(window._vrbutton.createButton(this.renderer));
		  this.raycaster = new THREE.Raycaster();
		  this.renderer.xr.enabled=true;
		  this.renderer.outputEncoding = THREE.sRGBEncoding;
		  this.renderer.shadowMap.enabled = true;
		  this.xrControllerInit();

		  const light = new THREE.DirectionalLight( 0xffffff );
				light.position.set( 0, 6, 0 );
				light.castShadow = true;
				light.shadow.camera.top = 2;
				light.shadow.camera.bottom = - 2;
				light.shadow.camera.right = 2;
				light.shadow.camera.left = - 2;
				light.shadow.mapSize.set( 4096, 4096 );
				this.scene.add( light );

		  this.isVrButton = true;

	  }
		//this.setColor();
	
		this.statsFps.update();
		this.statsMs.update();



		if(!search.state.serching &&bloom.bloomrender&&agicsworld.camera.position.y<0.5){
			bloom.bloomPass.strength = (3.2*(1+Math.abs(Math.sin(time))));
			bloom.render();
		}
		
		this.renderer.render(this.scene, this.camera);
		this.controls.update();

		thisFrame = Date.now();
		time += (thisFrame - lastFrame)/1000;	
		lastFrame = thisFrame;

		// update the level of detail mechanism
		lod.update();

		// update the dragged selection
		itemselect.update();
}


AgicsWorld.prototype.showCursor = function(frame) {
	const hl = frame.hands.length;  // 손 개수
	const fl = frame.pointables.length; //가리키는 손가락 개수

	if(hl == 1 && fl == 1) { 
		const f = frame.pointables[0];
		// console.log(f.tipPosition) // 손가락이 가리키는 위치(단위 방향 벡터를 나타내는 3개 요소 배열)인데 x(가로), z(세로), y(높이) 인듯

		const rect = this.renderer.domElement.getBoundingClientRect();
		
		const offset = {
				top: rect.top + window.scrollY,
				left: rect.left + window.scrollX
			}

		const coords = this.transform(f.tipPosition, rect.width, rect.height);//conf.width(): canvas 가로 / conf.height(): canvas 세로

		const cursor = document.querySelector('#cursor');
		
		cursor.style.left = `${offset.left + coords[0] - ((cursor.offsetWidth -1)/2 + 1)}px`;
		cursor.style.top = `${offset.top + coords[1] - ((cursor.offsetHeight -1)/2 + 1)}px`;
	} else {
		cursor.style.left = "-1000px";
		cursor.style.top = "-1000px";
	}
};

AgicsWorld.prototype.transform = function(tipPosition, w, h) {
	const width = 150;
	const height = 150;
	const minHeight = 100;

	let ftx = tipPosition[0];
	let fty = tipPosition[1];

	ftx = (ftx > width ? width - 1 : (ftx < -width ? -width + 1 : ftx));
	fty = (fty > 2*height ? 2*height - 1 : (fty < minHeight ? minHeight + 1 : fty));
	let x = THREE.Math.mapLinear(ftx, -width, width, 0, w);
	let y = THREE.Math.mapLinear(fty, 2*height, minHeight, 0, h);

	return [x, y];
};

AgicsWorld.prototype.focusObject = function(frame) {

	if(this.camera.position.y > 0.15) return;

	var hl = frame.hands.length;
	var fl = frame.pointables.length;

	if (hl == 1 && fl == 1) {
		var f = frame.pointables[0];

		var cont = this.renderer.domElement;

		const rect = this.renderer.domElement.getBoundingClientRect();

		var coords = this.transform(f.tipPosition, rect.width, rect.height);

		var vpx = (coords[0]/rect.width)*2 - 1;
		var vpy = -(coords[1]/rect.height)*2 + 1;
		
		var vector = new THREE.Vector2(vpx, vpy);

		this.prevItem = choose.select({x:Math.floor(coords[0]),y:Math.floor(coords[1])});
		
		if(this.prevItem > -1) {
			setTimeout(() => {
				if(this.prevItem == choose.select({x:Math.floor(coords[0]),y:Math.floor(coords[1])})) {
					choose.onMouseUpLeap(this.prevItem);
				}
			},2000);
		}
	};

	return -2;
}

AgicsWorld.prototype.changeControlsIndex = function() {
	if (this.lastControlsIndex == this.controlsIndex) {
		if (this.index != this.controlsIndex && this.controlsIndex > -2) {
			// new object or camera to control
			if (this.controlsIndex > -2) {
				if (this.index > -1) this.objects[this.index].material.color.setHex(0xefefef);

				this.index = this.controlsIndex;

				if (this.index > -1) this.objects[this.index].material.color.setHex(0xff0000);
			}
		};
	}; 
	this.lastControlsIndex = this.controlsIndex;
}

AgicsWorld.prototype.cellChangeControlsIndex = function() {
	// if(this.)
}
