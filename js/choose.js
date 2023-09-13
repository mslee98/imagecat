
// GPU 선택을 사용하는 마우스 이벤트 핸들러
function Choose(){
	this.scene = new THREE.Scene();
	this.scene.background = new THREE.Color(0x000000);
	this.mouseDown = new THREE.Vector2();
	this.tex = this.getTexture()
}


//캔버스에 mousedown은 사용자가 마우스를 눌렀을 때의 좌표를 저장합니다 .
Choose.prototype.onMouseDown = function(e){

	if(welcome.worldtransition) return;
	

	var click = this.getClickPoint(e)
	this.mouseDown.x = click.x;
	this.mouseDown.y = click.y;
	

}

Choose.prototype.onMouseUpLeap = function(cellIdx){

	console.log("prevCellIdx : ",agicsworld.prevItem);
	console.log("cellIdx : ",cellIdx);
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

	if(click.x !== this.mouseDown.x || click.y !== this.mouseDown.y || cellIdx == -1|| e.target.id !== 'agicsplot-canvas'){
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



Choose.prototype.init = function(){
	agicsworld.canvas.addEventListener('mousedown',this.onMouseDown.bind(this));
	document.body.addEventListener('mouseup',this.onMouseUp.bind(this));
	
	
	
	var group = new THREE.Group();
	for (var i=0; i<agicsworld.group.children.length;i++){
		var mesh = agicsworld.group.children[i].clone();
		mesh.material = agicsworld.getShaderMaterial({useColor: true});
		group.add(mesh);
	}
	this.scene.add(group);
	
}