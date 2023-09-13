
function LOD(){
	var r = 1 ; //활성화할 그리드 반경 찾기
	this.tex = this.getCanvas(config.size.lodTexture);
	this.cell = this.getCanvas(config.size.lodCell);
	this.cellIdxToImage = {};
	this.cellIdxToplayImage = {};
	this.grid = {}; //indexCells()를 통한 set
	this.xhr = new XMLHttpRequest();
	this.minY = 0.09; // 텍스처에대한 최대 ZOOM 레벨
	this.initialRadius =r; //lod처음 시작 radius
	
	this.state = {
			openCoords: this.getAllTexCoords(),
			camPos : {x: null,y:null},
			neighborsRequested:0,
			gridPosToCoords: {},//x.y 그리드 위치에서 해당 그리드 위치의 셀 인덱스 및 텍스 오프셋으로 매핑
			cellIdxToCoords:{},// 셀 idx에서 해당 셀의 x, y 오프셋으로 매핑		
			cellsToActivate:[], // this.cellIdxToImage에 캐싱되어 lod 텍스처에 추가 될 수있는 셀 목록
			fetchQueue :[], //  가져와야 할 이미지 목록
			radius : r, // 현재 lod에 radius
			run:true //lod 매커니즘을 사용할지 아닌지 bool값
	}
	
}

LOD.prototype.getCanvas = function(size) {
	  var canvas = getElem('canvas', {width: size, height: size, id: 'lod-canvas'});
	  return {
	    canvas: canvas,
	    ctx: canvas.getContext('2d'),
	    texture: agicsworld.getTexture(canvas),
	  }
	}

LOD.prototype.getAllTexCoords = function(){
	var coords = [];
	for (var y=0;y<config.size.lodTexture/config.size.lodCell;y++){
		for(var x=0;x<config.size.lodTexture/config.size.lodCell;x++){
			coords.push({x:x*config.size.lodCell,y:y*config.size.lodCell});
		}
	}
	return coords;
}
//분리된 lod 그리드에 모든셀 추가
LOD.prototype.indexCells = function(){
	var coords = {};
	data.cells.forEach(function(cell){
		cell.gridCoords = this.toGridCoords(cell);
		var x = cell.gridCoords.x,
			z = cell.gridCoords.z;
		if(!coords[x]) coords[x] = {};
		if(!coords[x][z]) coords[x][z] =[];
		coords[x][z].push(cell.idx);
	}.bind(this))
	this.grid=coords;
}

LOD.prototype.update = function() {

	  if (!this.state.run || agicsworld.state.flying 
			  || agicsworld.state.transitioning 
			  || layoutinfo.state.jittertransition
	  		  ) return;
	  this.updateGridPosition();
	  this.fetchNextImage();
	  

	  if(agicsworld.camera.position.y < this.minY){
		  this.addCellsToLodTexture()
	  }else{
		  this.clear();
	  }
	
	}


LOD.prototype.updateGridPosition = function() {
	  // 사용자 / 카메라의 현재 그리드 위치 결정
	  var camPos = this.toGridCoords(agicsworld.camera.position);
	  // 사용자가 새로운 그리드 위치에있는 경우 오래된 이미지를 언로드하고 새로로드
	  if (this.state.camPos.x !== camPos.x || this.state.camPos.z !== camPos.z) {
		  
	    if (this.state.radius > 0.5) {
	    	//radius에 따라서 화면이 돌아갈때 unload반경이 달라짐
	      this.state.radius = Math.ceil(this.state.radius*0.6);
	    }
	    //현재 카메라 위치
	    this.state.camPos = camPos;
	    this.state.neighborsRequested = 0;
	    this.unload();
	    if (agicsworld.camera.position.y < this.minY ) {
	      this.state.fetchQueue = getNested(this.grid, [camPos.x, camPos.z], []);
	    }
	  }
	}

LOD.prototype.addCellsToLodTexture = function(){
	var textureNeedsUpdate =false;
	
	for (var i=0; i<this.state.cellsToActivate.length;i++){
		var cellIdx =this.state.cellsToActivate[0],
		cell = data.cells[cellIdx];
		
		this.state.cellsToActivate = this.state.cellsToActivate.slice(1);
		
		if (this.state.cellIdxToCoords[cellIdx] || !this.inRadius(cell.gridCoords)) continue;
		
		var coords =this.state.openCoords[0];
		this.state.openCoords = this.state.openCoords.slice(1);
		
		if(coords){
			textureNeedsUpdate =true;
			var gridKey = cell.gridCoords.x + '.' + cell.gridCoords.z;
		
			if(!this.state.gridPosToCoords[gridKey]) this.state.gridPosToCoords[gridKey] = [];
			
			this.state.gridPosToCoords[gridKey].push(Object.assign({},coords,{cellIdx: cell.idx}));
			this.state.cellIdxToCoords[cell.idx] = coords;
			
			this.cell.ctx.clearRect(0,0,config.size.lodCell,config.size.lodCell);
			this.cell.ctx.drawImage(this.cellIdxToImage[cell.idx],0,0);
			if(cell.isVideo === 1){
				this.cell.ctx.drawImage(data.playtex1,0,0);
			}
			
			
			
			this.cell.texture.needsUpdate = true;
			var tex = agicsworld.getTexture(this.cell.canvas);
			agicsworld.renderer.copyTextureToTexture(coords,tex,this.tex.texture);
			
			cell.activate();
		}
	}
	
	if(textureNeedsUpdate){
		agicsworld.attrsNeedUpdate(['textureIndex','offset']);
	}
}

LOD.prototype.fetchNextImage = function(){
	//선택 모달이 표시되면 추가 이미지를 가져 오지 않습니다.
	if (itemselect.displayed) return;

	//다음에로드 할 이미지를 식별
	var cellIdx = this.state.fetchQueue[0];
	this.state.fetchQueue = this.state.fetchQueue.slice(1);

	//로드 큐에 셀 인덱스가있는 경우 다음 이미지를로드.
	if (Number.isInteger(cellIdx)){
		//이 이미지가 캐시에있는 경우

		if(this.cellIdxToImage[cellIdx]){

			//이 이미지가 아직 활성화되지 않은 경우 목록에 추가하여 활성화하십시오
			if(!this.state.cellIdxToCoords[cellIdx]){
				this.state.cellsToActivate = this.state.cellsToActivate.concat(cellIdx);
			}

		//이 이미지는 캐시에 없으므로로드 및 캐시			
		}else{
			var image = new Image();

			
			image.onload = function(cellIdx){
	
				this.cellIdxToImage[cellIdx] = image;
				if(!this.state.cellIdxToCoords[cellIdx]){

					this.state.cellsToActivate = this.state.cellsToActivate.concat(cellIdx);
				}
			}.bind(this,cellIdx);
			
			image.crossOrigin = "Anonymous";
		
			//image.src = '/images/mvs/adm/art/start.png';
			image.src = data.imgHost+data.uuid+'/thumbs/'+data.atlasloc[cellIdx].sub_path;
			//image.src = '/images/mvs/adm/art/logo.PNG'
		}
	// 가져올 이미지가 없으므로 가능한 경우 가져 오기 대기열에 이웃을 추가하십시오.
	}else if (this.state.neighborsRequested < this.state.radius){
		this.state.neighborsRequested = this.state.radius;
		for (var x=Math.floor(-this.state.radius*1.5); x<=Math.ceil(this.state.radius*1.5); x++){
			for(var z=-this.state.radius ; z <= this.state.radius ; z++){
				var coords = [this.state.camPos.x+x, this.state.camPos.z+z],
				cellIndices = getNested(this.grid,coords,[]).filter(function(cellIdx){
					return !this.state.cellIdxToCoords[cellIdx];
				}.bind(this))
				this.state.fetchQueue = this.state.fetchQueue.concat(cellIndices);
			}
		}
		if (this.state.openCoords && this.state.radius < 30){
			this.state.radius++;
		}
	}
}
// {x,y,z} 속성을 가진 객체가 주어지면 객체의 좌표를 그리드로 반환
LOD.prototype.toGridCoords = function(pos){
	var domain = data.boundingBox;
	
	//각 축 크기의 백분율로 포인트 위치 결정 0:1
	var percent ={
			x:(pos.x-domain.x.min)/(domain.x.max-domain.x.min),
			z:(pos.z-domain.z.min)/(domain.z.max-domain.z.min),
	}
	//각 축을 축당 n 버킷으로 자로고 점의 버킷 인덱스를 결정.
	var bucketSize ={
			//실제 이미지 총개수 (data.atlasloc.length)
			//request 관련 내용
			x:1/Math.max(100,Math.ceil(data.atlasloc.length/100)),
			z:1/Math.max(100,Math.ceil(data.atlasloc.length/100)),
	};
	
	return{
		x:Math.floor(percent.x/bucketSize.x),
		z:Math.floor(percent.z/bucketSize.z),
	}
}

LOD.prototype.inRadius = function(obj){
	var xDelta = Math.floor(Math.abs(obj.x - this.state.camPos.x));
	var zDelta = Math.ceil(Math.abs(obj.z - this.state.camPos.z));
	// 카메라에서 셀이 너무 멀면 셀을로드하지 마십시오
	return (xDelta <= (this.state.radius *1.5)) && (zDelta<(this.state.radius));
}


// 카메라에서 멀리 떨어진 이미지의 고해상도 텍스처를 비 웁니다.
LOD.prototype.unload = function(){
	Object.keys(this.state.gridPosToCoords).forEach(function(gridPos){
		var split = gridPos.split('.');
		if(!this.inRadius({x: parseInt(split[0]),z:parseInt(split[1])})){
			this.unloadGridPos(gridPos);
		}
	}.bind(this))
}

LOD.prototype.unloadGridPos = function(gridPos){
	//그리드 키가 삭제 될 텍스처 좌표 캐시
	var toUnload = this.state.gridPosToCoords[gridPos];
	//cellIdxToCoords 맵에서로드되지 않은 셀 키 삭제
	toUnload.forEach(function(coords){
		try{

			// 버퍼를 업데이트하기 위해 셀을 비활성화하고이 셀의 자리를 비 웁니다.
			data.cells[coords.cellIdx].deactivate();
			delete this.state.cellIdxToCoords[coords.cellIdx];
		}catch(err){}
	}.bind(this))
	
	delete this.state.gridPosToCoords[gridPos];
	
	this.state.openCoords = this.state.openCoords.concat(toUnload);
	

}

LOD.prototype.clear = function(){
	Object.keys(this.state.gridPosToCoords).forEach(this.unloadGridPos.bind(this));
	this.state.camPos = {x: Number.POSITIVE_INFINITY,z:Number.POSITIVE_INFINITY};
	agicsworld.attrsNeedUpdate(['offset','textureIndex']);
	this.state.radius = this.initialRadius;
}

