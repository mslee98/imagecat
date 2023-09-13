function LayoutInFo(){
	//정렬
	this.jitterElem =null;
	this.selected =null;
	this.selectedtemp = null;
	this.options =[];
	this.minZ = 0.20;

	this.state ={
		timezone : true,
		jittertransition : false,
		icontransition : false
	}
}


LayoutInFo.prototype.update = function(){
	
	if(this.selected === 'rasterfairy' || this.selected ==='grid') return ;
	
	if((agicsworld.camera.position.z < this.minZ && agicsworld.camera.position.z > -this.minZ)
			|| (agicsworld.camera.position.x < this.minZ && agicsworld.camera.position.x > -this.minZ)
			|| (agicsworld.camera.position.y < this.minZ && agicsworld.camera.position.y > -this.minZ)
			&& this.state.timezone 
			&& !agicsworld.state.flying 
			&& !this.state.jittertransition
			&& !this.state.icontransition){
		
			this.state.timezone = false;
		
			this.selected = 'jitter';		
			this.transitiontype();

	}else if(agicsworld.camera.position.z-0.5 > this.minZ && agicsworld.camera.position.z+0.5 < this.minZ
			&& !this.state.timezone 
			&& !agicsworld.state.flying
			&& !this.state.jittertransition
			&& !this.state.icontransition){
		this.state.timezone = true;
		
		this.selected = 'umap';
		this.transitiontype();
		
	}
	
	
	
}

LayoutInFo.prototype.transitiontype = function(){
	this.state.jittertransition = true;
	welcome.ringElem.style.display = 'block';
	
	//bloom 제거
	if(bloom.particles!==null){
		bloom.delete();
	}
	var duration = config.transitions.duration;
	setTimeout(function(){

		label.removelabel();
		var position =null;
		
		if(this.selected === undefined) return;
		// search 했을경우 x표시 삭제
		search.cancelelem.style.display = "none";
		if(this.selected === 'umap'){
			this.state.icontransition === false;
			position = data.layoutloc.jitter;
			
		}else if(this.selected === 'jitter'){
			position = data.layoutloc.jitter;
		}else if(this.selected === 'rasterfairy'){
			this.state.icontransition === true;
			position = data.layoutloc.rasterfairy;
			
		}else if(this.selected === 'grid'){
			position = data.layoutloc.grid;
		}else if(this.selected === 'video'){
			//video.init();
			
			
			welcome.ringElem.style.display = 'none';
			this.state.jittertransition = false;
			agicsworld.state.transitioning =false;
			search.state.serching = false;
			return
		}else if(this.selected ==="logo"){
			duration = 17.0;
			position = data.mosaic;
		}
		this.setPointScalar();
	
		for (var i=0 ; i<data.cells.length; i++){
			data.cells[i].tx = position[i][0];
			//처음 시작시 높이는 0으로 고정
			data.cells[i].ty = this.selected ==="logo" ? 0 : position[i][2]|| data.cells[i].getY(position[i][0],position[i][1]);
			data.cells[i].tz = position[i][1] 
			data.cells[i].setBuffer('pos1');
		}
		
		for ( var i=0;i<agicsworld.group.children.length; i++){
			if(agicsworld.group.children[i].name ==="atlaspoint"){
				agicsworld.group.children[i].geometry.attributes.pos1.needsUpdate = true;
				TweenLite.to(agicsworld.group.children[i].material.uniforms.transitionPercent,
						duration,config.transitions.ease);
			}
			
			
		}
		
		setTimeout(this.transition.bind(this),config.transitions.duration*3000);
		

	}.bind(this),500)
	
}

LayoutInFo.prototype.init = function(options){
	this.options  = options;
	//추후 수정이 요망됨
	this.selected = "umap"
	//여러가지 변형 좌표 아이콘 설정	
		
		
	this.elems ={
			  input: document.querySelector('#label-input'),
			    container: document.querySelector('#label-container'),
			    icons: document.querySelector('#icons'),
	}
	
	this.selectActiveIcon();
	this.addEventListeners();
}

LayoutInFo.prototype.selectActiveIcon = function(){
	var icons = this.elems.icons.querySelectorAll('img');

	//활성화된 아이콘들 제거
	for (var i=0 ; i<icons.length; i++){

		icons[i].classList.remove('active');
	}
	try {
		document.querySelector('#layout-'+this.selected).classList.add('active');
	}catch(err){
		console.warn(' no icon',this.selected);
	}
}

LayoutInFo.prototype.addEventListeners = function(){
	this.elems.icons.addEventListener('click',function(e){
		if(!e.target || !e.target.id || e.target.id == 'icons') return;
	
		this.set(e.target.id.replace('layout-',''))
	}.bind(this));
	//라벨을 체크박스를 클릭할경우에 라벨 삭제 및 생성
	this.elems.container.addEventListener('click',function(e){
		if(this.elems.input.checked){
			label.removelabel();
		}else{
			label.createlabel();
		}
	}.bind(this));
	
	
}

LayoutInFo.prototype.set = function(layout){
	if (agicsworld.state.transitioning || welcome.worldtransition) return;
	if (agicsworld.state.flying) return;
	//초기 카메라 셋팅
	
	agicsworld.state.transitioning =true;
	//카메라 위치 변경
	agicsworld.moveCellIdx(-7,true)
	
	
	this.selected= layout;
	//Point에 맞게 이미지 크기 설정
	this.setPointScalar()
	this.selectActiveIcon();
	this.transitiontype();
	
	
}

LayoutInFo.prototype.transition = function(){
	
	
	//각 셀의 상태 및 버퍼 업데이트
	data.cells.forEach(function(cell){
		cell.x = cell.tx;
		cell.y = cell.ty;
		cell.z = cell.tz;
		cell.setBuffer('position');
	})
	//Set label position 
	data.centroids.centroids.forEach(function(k,idx){
		var position = data.cells[k.idx];
		
		agicsworld.scene.children.forEach(function(child){
			
			if(child.name ==="textpoint"){
				child.geometry.attributes.position.array[(idx*3)] = position.x;
				child.geometry.attributes.position.array[(idx*3)+1] = position.y+0.01;
				child.geometry.attributes.position.array[(idx*3)+2] = position.z;			
			}
		})
	})
	

	
	for (var i=0;i<agicsworld.group.children.length;i++){
		if(agicsworld.group.children[i].type !=="Mesh"){
			agicsworld.group.children[i].geometry.attributes.position.needsUpdate = true;
			agicsworld.group.children[i].material.uniforms.transitionPercent = {type:'f',value:0};
		}
	
	}
	
	
	agicsworld.setUniform('scale',agicsworld.getPointScale());
	
	
	this.state.jittertransition = false;
	
	
	
	agicsworld.state.transitioning =false;
	// search 중이면 true를 false로 변경
	search.state.serching = false;
	
	welcome.ringElem.style.display = 'none';
	lod.indexCells();

		
	if(this.selected==='logo'){
		bloom.init();
		bloom.create();
		welcome.worldtransition = false;
		//처음 로고 실행후 grid형태로 변경
		/*
			setTimeout(function(){

			welcome.worldtransition = false;
			this.selected='umap';
			//카메라 위치 변경
			agicsworld.moveCellIdx(-7,true);
			this.transitiontype();

			label.init();

		

		}.bind(this),1000);
		*/
	}else{
		if(!this.elems.input.checked){
		label.createlabel();
		}
		bloom.reposition();
		bloom.visible();
	}

	

}

//LayoutInFo.prototype.recenterCamera = function(enableDelay){
//	var initialCameraPosition = agicsworld.getInitialLocation();
//	if((agicsworld.camera.positions.z < initialCameraPosition.z)&& enableDelay){
//		agicsworld.moveTo(initialCameraPosition);
//		return config.transitions.duration*1000;
//	}
//	return 0;
//}

LayoutInFo.prototype.setPointScalar = function(){
		var size = false, // size for points
	    l = this.selected; // selected layout
		if (l == 'tsne' || l == 'umap' || l=='logo') size = data.pointsize.scatter;
		if (l == 'grid' || l == 'rasterfairy') size = data.pointsize.grid;
		
		if(size){
			agicsworld.elems.pointSize = size;
			agicsworld.setUniform('scaleTarget',agicsworld.getPointScale())
		}
		  
		//agicsworld.setUniform('scaleTarget',agicsworld.getPointScale())

}

