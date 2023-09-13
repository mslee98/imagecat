function Data(){
	this.atlasCount =null;
	this.textureCount =null;
	this.layouts =[];
	this.cells = [];
	this.textures  =[];
	this.textureProgress ={};
	this.loadedTextures = 0;
	this.boundingBox = {
			x:{min: Number.POSITIVE_INFINITY, max:Number.NEGATIVE_INFINITY},
			z:{min: Number.POSITIVE_INFINITY,max:Number.NEGATIVE_INFINITY},
	}
	this.backgroundtex = null
	this.playtex =null
	agicsworld.getHeightMap(this.load.bind(this));
	
}
//json 좌표및 이미지 데이터 가져오기
Data.prototype.load = function(){
				var dataApiUrl = `${config.data.url}/main/selectMainDataList.do`;
				dataApiUrl += (paramObj.toLocal != undefined) ? "?local=Y" : (paramObj.toDev != undefined) ? "?dev=Y" : "";  
				
				getloadJson(dataApiUrl,function(json){
					const url = JSON.parse(json);	
					this.imgHost = url.resultMap.imgHost
					this.uuid = url.resultMap.uuid
					const resultuuid = this.uuid+"/results/"
					const urlJsonMap = [];
					
					 const configJsonData =[
				            "atlas_position.json",
				            "atlas_dataUris.json",
				            "mosaics.json",
				            "layout_location.json",
				            "centroids.json",
				            "fileUuidInfo.json"];
					
					getloadJson(this.imgHost+resultuuid+configJsonData[0],function(position){
						getloadJson(this.imgHost+resultuuid+configJsonData[1],function(atlas_dataUris){
							getloadJson(this.imgHost+resultuuid+configJsonData[2],function(mosaics){
								getloadJson(this.imgHost+resultuuid+configJsonData[3],function(layout_location){
									getloadJson(this.imgHost+resultuuid+configJsonData[4],function(centroids){
										getloadJson(this.imgHost+resultuuid+configJsonData[5],function(uuidinfo){
											this.parseManifest(position,atlas_dataUris,mosaics,layout_location,centroids,uuidinfo)
										}.bind(this));
									}.bind(this))
								}.bind(this))
							}.bind(this))
						}.bind(this))
					}.bind(this))
					
	}.bind(this))

}

Data.prototype.getBackgroundImage = function(){
	this.backgroundtex = new THREE.TextureLoader().load( "assets/images/background.jpg" ,function(texture){
		
		texture.needsUpdate = true;
	});
	/*
	this.playtex = new THREE.TextureLoader().load("/images/mvs/adm/art/start.png",function(texture){
		texture.needsUpdate = true;
	})
	
	this.playtex1 = new Image()
	this.playtex1.src = '/images/mvs/adm/art/start.png';
	*/
}
/*
	좌표값 셋팅 함수
*/
Data.prototype.parseManifest = function(position,atlas_dataUris,mosaics,layout_location,centroids,uuidinfo){
	const position_ = JSON.parse(position)
	const mosaics_ = JSON.parse(mosaics);
	const atlasSet_ = JSON.parse(atlas_dataUris);
	const centroids_ = JSON.parse(centroids);
	const replaceuuid = uuidinfo.replaceAll('\'','\"');
	
	
	
	this.pointsize = position_.point_sizes;
	this.atlasSet = atlasSet_.url
	this.atlasloc = position_.position
	this.uuidinfo = JSON.parse(replaceuuid);
	this.atlasIdxLength = position_.idx_length
	this.layoutloc = JSON.parse(layout_location);
	this.centroids = centroids_
	this.mosaic = mosaics_.mosaics_0
	
	
	console.log("this.pointsize",this.pointsize);
	console.log("this.atlasSet",this.atlasSet);
	console.log("this.atlasloc",this.atlasloc);

	agicsworld.elems.pointSize = this.pointsize.initial;

	

	this.getBackgroundImage()
	// atlas및 텍스처 갯수
	this.atlasCount = this.atlasSet.length;

	this.textureCount = Math.ceil(this.atlasSet.length/config.atlasesPerTex);
	
	this.adventure = new Adventure();

	layoutinfo.init(this.layouts);
	//검색
	search.init();
	

	//이 데이터 세트에 대한 각 텍스처를로드
	for (var i=0; i<this.textureCount;i++){
		this.textures.push(new Texture({
			idx:i,
			onProgress: this.onTextureProgress.bind(this),
			onLoad : this.onTextureLoad.bind(this),
		}))
	};
	
	//cell 추가
	this.addCells();


}
/*
	cell data 생성 함수
*/
Data.prototype.addCells =function(){
	var drawcall ={
			idx :0,
			textures: [],
			vertices: 0 ,
	}
	
	var idx =0; 

	
	var count =0;
	//좌표값 각각의 셀에 설정

	for (var i=0;i<this.atlasIdxLength.length;i++){
		for(var j=0;j<this.atlasIdxLength[i];j++){

			drawcall.vertices++;
	
			var texIdx = Math.floor(i/config.atlasesPerTex),
			//worldPos = this.layoutloc.umap,
			worldPos = this.layoutloc.jitter,
			//worldPos = this.mosaic,
			atlasPos = this.atlasloc[idx],
			atlasOffset = getAtlasOffset(i),
			size = this.atlasloc[idx]
			layoutinfo.selected = "logo";
			
			this.cells.push(new Cell({
				idx:idx,
				w: size.w,
				h: size.h,
				x:worldPos[idx][0],
				y:worldPos[idx][2]|| null,
				z:worldPos[idx][1],
				dx:atlasPos.x+atlasOffset.x,
				dy:atlasPos.y+atlasOffset.y,
			}))
		
		idx++;
		}
		
	}

	lod.indexCells();
	

	
}
Data.prototype.onTextureProgress = function(texIdx,progress){
	this.textureProgress[texIdx] = progress / this.textures[texIdx].getAtlasCount(texIdx);
	//수정 업데이트
	welcome.updateProgress();
}

Data.prototype.onTextureLoad = function(texIdx){
	this.loadedTextures +=1;
	//수정 업데이트
	welcome.updateProgress();
}