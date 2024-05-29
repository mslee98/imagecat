

function ItemSelect(){
	this.clock = new THREE.Clock();
	this.time = 0;
	this.mesh ={};
	this.mouseDown = {};
	this.pos0=null;
	this.pos1 = null;
	this.frozen = false; //마우스 추적하고있나?
	this.renderBox = true; //박스가 렌더링 되고있나?
	this.selected ={}; // cell선택 공간
	this.elems = {}; // domelements 집합
	this.downloadFiletype = 'csv' //다운로드 파일 확장명
	this.displayed = false;
	this.run =true; // 만약에 false라면  선택액션을 허용하지 않음
}

ItemSelect.prototype.init =function (){
	
	this.elems ={
			modalButton: document.querySelector('#view-selected'),
			modalTarget: document.querySelector('#selected-images-target'),
			modalgrid: document.querySelector('#selected-images-grid'),
			modalContainer: document.querySelector('#selected-images-modal'),
			modalTemplate: document.querySelector('#selected-images-template'),
			selectedImagesCount: document.querySelector('#selected-images-count'),
			countTarget: document.querySelector('#count-target'),
			filetypeButtons: document.querySelectorAll('.filetype'),
			downloadLink: document.querySelector('#download-link'),
			downloadInput: document.querySelector('#download-filename'),
	}
	
	this.initmesh();
	this.addMouseEventListeners();
	this.addModalEventListeners();
	this.start();
	
}

ItemSelect.prototype.initmesh = function(){
	var points = [
	    new THREE.Vector3(0, 0, 0), // bottom left
	    new THREE.Vector3(0, 0, 0), // bottom right
	    new THREE.Vector3(0, 0, 0), // top right
	    new THREE.Vector3(0, 0, 0), // top left
	    new THREE.Vector3(0, 0, 0), // bottom left
	]
	
	var lengths = this.getLineLengths(points); //벡터 사이에 길이?
	var geometry = new THREE.BufferGeometry().setFromPoints(points);
	var lengthAttr = new THREE.BufferAttribute(new Float32Array(lengths),1);
	geometry.setAttribute('length',lengthAttr);
	var material = new THREE.ShaderMaterial({
		uniforms:{
			time:{
				type:'float',
				value:0,
			},
			render:{
				type:'bool',
				value:'false',
			}
		},
		vertexShader: lassoVertexShader,
	    fragmentShader: lassoFragmentShader,
		
	})
	this.mesh = new THREE.Line(geometry,material);
	this.mesh.frustumCulled =false;
	agicsworld.scene.add(this.mesh);


	// console.log(agicsworld.scene);
	
	
	
}

//이벤트 리스너 바인드
ItemSelect.prototype.addMouseEventListeners = function(){

	agicsworld.canvas.addEventListener('mousedown',function(e){

		
		if (agicsworld.mode !='select') return;
		
		// 마우스가 마우스 다운 위치에서 움직일 때까지 상자 렌더링 방지
		this.renderBox =false;
		
		// 마지막 position 초기화
		this.pos1 = null;
		// position 추가
		this.pos0 = this.getCoords(e);
		// 마우스 다운 위치 저장
		this.mouseDown ={x:e.clientX,y:e.clientY}

		console.log("mouse down",this.mouseDown);
		
		this.frozen =false;
		

	}.bind(this));
	
	agicsworld.canvas.addEventListener('mousemove',function(e){
		if(agicsworld.mode !='select' || this.frozen || !this.pos0) return;
		
		console.log("SSSSSSSSSSSSSSSSSSSSSSSS")
		
		this.pos1 = this.getCoords(e);
		this.updateSelected();
		this.renderBox =true;

	}.bind(this))
	
	agicsworld.canvas.addEventListener('mouseup',function(e){
		
		
		this.frozen = true;
		this.renderBox = false;
		if(keyboard.shiftPressed() || keyboard.commandPressed()) return;
		
		if(!this.hasSelection()) this.clear();
		
		// 사용자가 적절한 '클릭'이벤트를 만들었습니다-같은 위치에서 mousedown 및 up
		
		if((e.clientX == this.mouseDown.x) && (e.clientY == this.mouseDown.y)){
			// 클릭이 선택 범위를 벗어난 경우 선택을 지우십시오.
			if(!this.insideBox(this.getCoords(e))) this.clear();
		}
	
	
	}.bind(this))
	
	
	
}

ItemSelect.prototype.addModalEventListeners = function(){
	// 래퍼 클릭시 모달 닫기
	this.elems.modalContainer.addEventListener('click',function(e){
		if(e.target.className == 'multi-modal-top'){
			this.elems.modalContainer.style.display = 'none';
			this.displayed = false;
		}
		if(e.target.className == 'background-image'){
			var index = e.target.getAttribute('data-index');
			console.log("1번째 호출")
			popup.showimage(this.getSelectedImage(),index);
		}
	}.bind(this))
	
	//사용자가 선택한 이미지 목록을 보여줍니다
	this.elems.modalButton.addEventListener('click',function(e){

		console.log("?!!!");

		var template = document.querySelector('#selected-images-template').textContent;
		var clonetemplate = "";
		var images = this.getSelectedImage()

		images.forEach(function(image,idx){
			var l = template.replace("{dataindex}",image.i_idx);
			l = l.replace("{dataimage}",idx);
			var json = image.iuo
			var re = /\\/gi;
			json = json.replace(re,'/');
			l = l.replace("{imageurl}",json);
			clonetemplate += l;
		})
		this.elems.modalgrid.innerHTML = clonetemplate;
		
		this.elems.modalContainer.style.display = 'block';
		this.displayed = true;
	}.bind(this))
	
	//선택에 셀 포함을 토글
//	this.elems.modalContainer.addEventListener('click',function(e){
//		if(e.target.className.includes('toggle-selection')){
//			e.preventDefault();
//			var sibling = e.target.parentNode.querySelector('.background-image'),
//			image = sibling.getAttribute('data-image');
//		}
//	})
}

ItemSelect.prototype.getSelectedImageIndices = function(){
	var l =[];
	//선택된 이미지들을 확인한후 배열에 인덱스 값을 추가
	for (var i=0;i<data.atlasloc.length; i++){
		if (this.selected[i]) l.push(i);
	}
	return l;
}


ItemSelect.prototype.clear = function(){
	//저장된 마우스 포지션 제거
	this.pos0 =null;
	this.pos1 =null;
	
	this.mesh.material.uniforms.render.value = false;
	// 마우스 무브 리스너 얼림 해제
	this.frozen = false;
	// 셀들에 투명도를 복구
	this.setSelected([]);
	//선택된 셀들의 리스트를 업데이트
	this.updateSelected();
	//모델 display 트리거된 버튼을 제거
	this.elems.modalButton.style.display = 'none';
	//선택된 이미지가 없음을 나타냅니다
	//this.elems.selectedImagesCount.style.display = 'none';
}


//사용자가 셀을 선택했는지 여부를 나타내는 부울을 반환합니다.
ItemSelect.prototype.hasSelection = function(){
	return this.getSelectedImage().length> 0;
}

//유저가 선택한 list를 가져온다
ItemSelect.prototype.getSelectedImage = function(){
	return data.atlasloc.filter(function(i,idx){
		return this.selected[idx];
	}.bind(this))
}

// 마지막 마우스 위치의 월드 좌표를 찾습니다
ItemSelect.prototype.getCoords = function(e){
	var vector = new THREE.Vector3(),
	camera = agicsworld.camera,
	mouse = new THREE.Vector2(),
	canvasSize = getCanvasSize(),
	rect = e.target.getBoundingClientRect(),
	dx = e.clientX - rect.left,
	dy = e.clientY - rect.top,
	
	x = (dx/canvasSize.w) *2 -1,
	y = -(dy/canvasSize.h) *2 +1;
	
	// 이벤트 위치를 화면 좌표로 투영
	
	vector.set(x,y,0.5);
	vector.unproject(camera);
	var direction = vector.sub(camera.position).normalize(),
	distance = -camera.position.z / direction.z,
	scaled = direction.multiplyScalar(distance),
	coords = camera.position.clone().add(scaled);

	console.log("getCoords");
	
	return coords;
	
}

ItemSelect.prototype.updateSelected = function() {
	  for (var i=0; i<data.cells.length; i++) {
		    if (keyboard.shiftPressed() || keyboard.commandPressed()) {
		      if (this.insideBox(data.cells[i])) this.selected[i] = true;
		    } else {
		      this.selected[i] = this.insideBox(data.cells[i]);
		    }
		  }
}
// 점이 선택 상자 안에 있는지를 나타내는 부울을 반환합니다.
ItemSelect.prototype.insideBox = function(i){
	 var box = this.getBoxDomain();
	  if (!box) return false;
	  return i.x >= box.x.min &&
	         i.x <= box.x.max &&
	         i.y >= box.y.min &&
	         i.y <= box.y.max;
}
// 복원 셀의 선택된 속성이 셀에서 0.0opacities 인 경우 1.0으로 설정
ItemSelect.prototype.setSelected = function(arr){
	var vals = new Uint8Array(data.cells.length);

	for (var i=0; i<arr.length;i++) vals[arr[i]]=1.0;
	
	// 각 드로우셀들의 버퍼를 업데이트

	agicsworld.setBuffer('selected',vals);
}


// 선택 상자의 도메인을 얻는다
ItemSelect.prototype.getBoxDomain = function(){
	  var pos0 = this.pos0 || {};
	  var pos1 = this.pos1 || {};
	  return {
	    x: {
	      min: Math.min(pos0.x, pos1.x),
	      max: Math.max(pos0.x, pos1.x),
	    },
	    y: {
	      min: Math.min(pos0.y, pos1.y),
	      max: Math.max(pos0.y, pos1.y),
	    },
	  }
}



ItemSelect.prototype.getLineLengths = function(points){
	var lengths = [];
	var sum =0;
	for (var i=0; i<points.length;i++){
		if(i>0) sum +=points[i].distanceTo(points[i-1]);
		lengths[i]=sum;
	};
	
	return lengths
}

ItemSelect.prototype.start = function(){
	this.pos0 = null;
	this.pos1 = null;
	this.frozen = false;
}

ItemSelect.prototype.update =function(){
	
	if (!this.run){
		return;
	}
	
	if(!this.mesh){
		return;
	}
	
	var selected = this.getSelectedImageIndices();
	var elem = document.querySelector('#n-images-selected');
	if (elem) elem.textContent = selected.length;
	if(!selected.length){
		return;
	}
	
	this.elems.modalButton.style.display = 'block';
	
	this.setSelected(selected);
	
	this.elems.countTarget.textContent = selected.length
	this.elems.selectedImagesCount.style.display = 'block';
	if(!this.renderBox){
		this.mesh.material.uniforms.render.value = false;
		return;
	}
	
	if(!this.pos0 || !this.pos1){
		return;
	}
	
	this.time += this.clock.getDelta() /10;
	this.mesh.material.uniforms.time.value = this.time;
	
	var box = this.getBoxDomain(),
	z = 0.001,
	points = [
		  new THREE.Vector3(box.x.min, box.y.min, z),
		  new THREE.Vector3(box.x.max, box.y.min, z),
		  new THREE.Vector3(box.x.max, box.y.max, z),
		  new THREE.Vector3(box.x.min, box.y.max, z),
		  new THREE.Vector3(box.x.min, box.y.min, z),
	];
	

	
	 // find the cumulative length of the line up to each point
	  var geometry = new THREE.BufferGeometry().setFromPoints(points);
	  var lengths = new THREE.BufferAttribute(new Float32Array(this.getLineLengths(points)), 1);
	  this.mesh.geometry.attributes.position.array = geometry.attributes.position.array;
	  this.mesh.geometry.attributes.position.needsUpdate = true;
	  this.mesh.geometry.attributes.length.array = lengths.array;
	  this.mesh.geometry.attributes.length.needsUpdate = true;
	  this.mesh.material.uniforms.render.value = true;
}

