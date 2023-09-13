
function Cell(obj){
	this.idx = obj.idx;
	this.texIdx = this.getIndexOfTexture();
	this.gridCoords = {};
	this.x=obj.x;
	//2d
//	this.y=obj.y;
//	this.z =obj.z || this.getZ(obj.x,obj.y);
	//3d
	//this.y=obj.y || this.getY(obj.x,obj.z);
	this.y=obj.y || Math.random() * (1.4-1.0)+1.0;
	//this.y = obj.y || 0;
	this.z =obj.z;
	
	this.tx = this.x;
	this.ty = this.y;
	this.tz = this.z;
	//dx dy uvOffset
	this.dx = obj.dx;
	this.dy = obj.dy;
	this.w = obj.w;
	this.h = obj.h;
	this.highlight = obj.idx%10 == 0 ? Math.round(Math.random(),2) : 0;
	this.updateParentBoudingBox();
	this.isVideo = 0;
	this.action_state=0.0;
}

Cell.prototype.updateParentBoudingBox = function(){
	var bb = data.boundingBox;
	['x','z'].forEach(function(p){
		bb[p].max = Math.max(bb[p].max,this[p]);
		bb[p].min = Math.min(bb[p].min,this[p]);
	}.bind(this))
}
//2d
Cell.prototype.getZ = function(x,y){
	return agicsworld.getHeightAt(x, y) || 0;
}
//3d
Cell.prototype.getY = function(x,z){
	return agicsworld.getHeightAt(x, z) || 0;
}

Cell.prototype.getIndexOfAtlas =function(){
	
	var i=0;
	for (var j=0 ; j<data.atlasIdxLength.length ; j++){
		i += data.atlasIdxLength[j];
		if(i>this.idx) return j;
	}
	
	return j;
}

Cell.prototype.getIndexInAtlas = function(){
	var atlasIdx = this.getIndexOfAtlas();
	var i =0;
	for (var j=0; j<atlasIdx; j++){
		i += data.atlasIdxLength[j];
	}
	return this.idx - i;
}
//추후 변경 예정
Cell.prototype.getIndexOfTexture = function(){
	return Math.floor(this.getIndexOfAtlas()/config.atlasesPerTex)
}
//모든 드로우 콜 중이 셀의 드로우 콜 색인을 반환
Cell.prototype.getIndexOfDrawCall = function(){
	return Math.floor(this.idx/webgl.limits.indexedElements);
}

//그리기 호출 내 에서이 셀의 인덱스를 반환
Cell.prototype.getIndexInDrawCall = function(){
	return this.idx % webgl.limits.indexedElements;
}
Cell.prototype.activate = function(){
	this.dx = lod.state.cellIdxToCoords[this.idx].x;
	this.dy = lod.state.cellIdxToCoords[this.idx].y;
	this.texIdx = -1;
	['textureIndex','offset'].forEach(this.setBuffer.bind(this));
}
Cell.prototype.deactivate = function(){
	var atlasIndex = this.getIndexOfAtlas(),
		indexInAtlas = this.getIndexInAtlas(),
		atlasOffset = getAtlasOffset(atlasIndex),
		d = data.atlasloc[this.idx];
	
	this.dx = d.x+atlasOffset.x;
	this.dy = d.y+atlasOffset.y;
	this.texIdx = this.getIndexOfTexture();
	['textureIndex','offset'].forEach(this.setBuffer.bind(this));
	
}

//  바인딩 된 속성 'attr' 에 대한이 셀의 버퍼 값 업데이트
Cell.prototype.setBuffer = function(attr){
	var meshes = agicsworld.group

	var	attrs = meshes.children[this.getIndexOfDrawCall()].geometry.attributes,
	idxInDrawCall = this.getIndexInDrawCall();
	
	switch(attr){
	case 'textureIndex':

		attrs.textureIndex.array[idxInDrawCall] = this.texIdx;
		return;
	
	case 'offset':
		var texSize = this.texIdx ==-1 ?  config.size.lodTexture : config.size.texture;
		
		attrs.offset.array[(idxInDrawCall *2)] = this.dx;
		attrs.offset.array[(idxInDrawCall *2) +1] =this.dy;
		return;
	
	
	case 'position':
		
		attrs.position.array[(idxInDrawCall *3)] = this.x;
		attrs.position.array[(idxInDrawCall *3)+1] = this.y;
		attrs.position.array[(idxInDrawCall *3)+2] =this.z;
		return;
	
	
	case 'pos1':
		attrs.pos1.array[(idxInDrawCall *3)] = this.tx;
		attrs.pos1.array[(idxInDrawCall *3) +1] =this.ty;
		attrs.pos1.array[(idxInDrawCall *3) +2] =this.tz;
		return;
	}
}
