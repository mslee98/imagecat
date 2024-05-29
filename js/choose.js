
/**
 * 
 * 전반적으로 Three.js환경에서 마우스 핸들러 이벤트들을 정의함
 * 
 * GPU 선택을 사용하는 마우스 이벤트 핸들러
 */

// 
function Choose(){
	this.scene = new THREE.Scene();
	this.scene.background = new THREE.Color(0x000000);
	this.mouseDownYn = new THREE.Vector2();
	this.tex = this.getTexture()



	// 마우스 hober (pointermove, mousemve) 이벤트 시에 이미지 확대 기능 테스트
	// 테스트 용 코드 
	this.mousedownYn = false;
	this.prevWidth = 0;
	this.prevHeight = 0
}


//캔버스에 mousedown은 사용자가 마우스를 눌렀을 때의 좌표를 저장합니다 .
Choose.prototype.onMouseDown = function(e){

	// this.mousedownYn = true;

	// agicsworld.group.children[0].geometry.attributes.position.array[Math.floor(Math.random() * 98508)] = -0.4;
	// agicsworld.group.children[0].geometry.attributes.position.needsUpdate = true;

	// for(let i=0; i<agicsworld.group.children[0].geometry.attributes.highlight.count; i++) {
	// 	//아니 이거 먹히네?
	// 	agicsworld.group.children[0].geometry.attributes.highlight.array[i] = 1;
	// }

	if(welcome.worldtransition) return;

	var click = this.getClickPoint(e)
	this.mouseDownYn.x = click.x;
	this.mouseDownYn.y = click.y;
	

}

Choose.prototype.onMouseUpLeap = function(cellIdx){

	if(agicsworld.prevItem == cellIdx) {
		if(cellIdx > -1 ) {
			var l = new THREE.Vector3(data.cells[cellIdx].x,data.cells[cellIdx].y,data.cells[cellIdx].z);
			
			if((l.distanceTo(agicsworld.camera.position) < 0.03)&&(agicsworld.camera.position.y<0.3)){
				return popup.showimage([],cellIdx);
			}
		}
	}
}


// 캔버스 클릭시 클릭 한 이미지로 자세한 모달 표시
Choose.prototype.onMouseUp = function(e){

	if(welcome.worldtransition) return;

	if (e.target.className== 'modal-top'){
		
		if(youtubeapi.player){
			youtubeapi.stopVideo()
		}
		
		return popup.close();
	}


	var click = this.getClickPoint(e);
	
	var cellIdx = this.select({x:click.x,y:click.y});

	if(click.x !== this.mouseDownYn.x || click.y !== this.mouseDownYn.y || cellIdx == -1|| e.target.id !== 'agicsplot-canvas'){
		return;
	}
	//모드 설정

	if(false){
		
	}else if(true){


		var l = new THREE.Vector3(data.cells[cellIdx].x,data.cells[cellIdx].y,data.cells[cellIdx].z);
		
		if((l.distanceTo(agicsworld.camera.position) > 0.03)){
			return agicsworld.moveCellIdx(cellIdx,false)
		}else if((l.distanceTo(agicsworld.camera.position) < 0.03)&&(agicsworld.camera.position.y<0.3)){

			return popup.showimage([],cellIdx)
		}
	}

}




//오프 스크린 월드를 그린 다음 렌더 대상을 재설정하여 월드가 업데이트되도록
Choose.prototype.render = function(){

	agicsworld.renderer.setRenderTarget(this.tex);

	agicsworld.renderer.render(this.scene,agicsworld.camera);

	agicsworld.renderer.setRenderTarget(null);

}

//gpu 픽셀 값을 읽어 idx를 구함
Choose.prototype.select = function(obj){

	if(!agicsworld || !obj) return;

	this.render();
	
	//현재 마우스 픽셀에서 텍스처 색상을 읽습니다.
	var pixelBuffer = new Uint8Array(4),
		x = obj.x * window.devicePixelRatio,
		y = this.tex.height - obj.y * window.devicePixelRatio;

	agicsworld.renderer.readRenderTargetPixels(this.tex,x,y,1,1,pixelBuffer);

	var id = (pixelBuffer[0] << 16 ) | (pixelBuffer[1]<<8) | (pixelBuffer[2]),
		cellIdx = id-1;

	return cellIdx;
		
}




//캔버스 내에서 클릭의 x, y 오프셋을 얻습니다.
Choose.prototype.getClickPoint = function(e){
	var rect = e.target.getBoundingClientRect();

	return {
		x: e.clientX - rect.left,
		y: e.clientY - rect.top,
	}
}

//오프 스크린 렌더링이 일어날 텍스처를 얻는다
Choose.prototype.getTexture = function(){
	var canvasSize = getCanvasSize();
	var tex = new THREE.WebGLRenderTarget(canvasSize.w,canvasSize.h);
	tex.texture.minFilter = THREE.LinearFilter;
	return tex;
}



// 이미지 확대 기능 테스트
Choose.prototype.onPointerMove = function(e) {
	if(!this.mousedownYn) {
		var click = this.getClickPoint(e);
		

		// console.log(agicsworld.scene)

		// cellIdx는 mouse 좌표를 GPU픽셀값으로 변환하거임
		var cellIdx = this.select({x:click.x,y:click.y});

		// 문제는 cellIdx가 어떻게 나온건지 정의를 알아야함;;;
		// position.array()안에서 해당 cellIdx가 몇번째인지 모름
		// 이걸 어떻게 알아야할까  알려면 cellIdx가 어디서 나온애인지부터찾아봐야한다.

		if(cellIdx !== -1) {

			let scale = 4;

			agicsworld.group.children[0].geometry.attributes.position.array[cellIdx+1] = -0.4
			agicsworld.group.children[0].geometry.attributes.position.needsUpdate = true;

			console.log(agicsworld.group.children[0].geometry.attributes.highlight.array)
		} 
	}

}

Choose.prototype.init = function(){
	agicsworld.canvas.addEventListener('mousedown',this.onMouseDown.bind(this));
	// agicsworld.canvas.addEventListener('mousemove',this.onPointerMove.bind(this));

	document.body.addEventListener('mouseup',this.onMouseUp.bind(this));
	
	
	
	var group = new THREE.Group();
	for (var i=0; i<agicsworld.group.children.length;i++){
		var mesh = agicsworld.group.children[i].clone();
		mesh.material = agicsworld.getShaderMaterial({useColor: true});
		group.add(mesh);
	}
	this.scene.add(group);
	
}