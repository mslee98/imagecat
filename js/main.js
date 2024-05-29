/**
 * tsne 화면
 * 
 * @author AI융합기술개발팀
 * @since 2020.05.19
 * @version 1.0
 * @see
 *  << 개정이력(Modification Information) >>
 * 
 * 수정일 수정자 수정내용 ---------- -------- --------------------------- 2020.05.19 김동완
 * 최초 생성
 * 
 */

var testtextures = [];
function Config(){
	if (paramObj.toLocal != undefined) {
		this.data = {url : apiUrlObj.local} 
	} else if (paramObj.toDev != undefined) {
		this.data = {url : apiUrlObj.dev} 
	} else {
		this.data = {url : apiUrlObj.oper} 
	}
	
	this.size = {
			cell:32, //atlas cell 크기
			lodCell:128, // load된 이미지 크기
			atlas:2048,
			texture: webgl.limits.textureSize,
			lodTexture: webgl.limits.textureSize,
			points:{
				min:0,
				max:0,
				initial: 0,
				grid:0,
				scatter:0,
				data:0
			},
			
	}
	this.transitions = {
			duration:3.0,
			delay:1.0,
	}
	this.transitions.ease ={
			value : 1.0+this.transitions.delay,
			ease : Power3.easeOut,
	}
	this.pickerMaxZ = 0.4;
	this.atlasesPerTex = (this.size.texture/this.size.atlas)**2;
	
}



function Texture(obj){
	this.idx = obj.idx
	//atlas 정보
	this.atlases = [];
	this.atlasProgress = {};
	this.loadedAtlases = 0;
	this.onProgress = obj.onProgress;
	this.onLoad = obj.onLoad;
	this.canvas = null;
	this.ctx = null;
	this.load();
}

Texture.prototype.setCanvas = function(){
	this.canvas = getElem('canvas',{
		width:config.size.texture,
		height: config.size.texture,
		id: 'texture-' +this.idx,
	})
	//2d로 만들다?
	this.ctx = this.canvas.getContext('2d');

}

Texture.prototype.load = function(){
	this.setCanvas();
	//이 텍스처에 포함될 각 아틀라스를로드하십시오.
	for (var i=0;i<this.getAtlasCount();i++){
		this.atlases.push(new Atlas({
			idx : (config.atlasesPerTex * this.idx)+i, //모든지도 책 중지도 책 색인
			onProgress:this.onAtlasProgress.bind(this),
			onLoad : this.onAtlasLoad.bind(this),
		}))
	}
	
}

Texture.prototype.getAtlasCount = function(){
	return (data.atlasCount/config.atlasesPerTex)>(this.idx + 1)
	? config.atlasesPerTex
	: data.atlasCount% config.atlasesPerTex;
}

Texture.prototype.onAtlasProgress = function(atlasIdx,progress){
	this.atlasProgress[atlasIdx] = progress;
	var textureProgress = getValueSum(this.atlasProgress);
	this.onProgress(this.idx,textureProgress);
}

Texture.prototype.onAtlasLoad = function(atlas){
	var atlasSize = config.size.atlas,
		textureSize = config.size.texture,
		idx = atlas.idx % config.atlasesPerTex,
		d = getAtlasOffset(idx),
		w = config.size.atlas,
		h = config.size.atlas

	this.ctx.drawImage(atlas.image,d.x,d.y,w,h);
	
	if(++this.loadedAtlases == this.getAtlasCount()) this.onLoad(this.idx);
	
}

function getAtlasOffset(idx){

	var atlasSize = config.size.atlas,
	textureSize = config.size.texture;
	return{
		x: (idx*atlasSize)%textureSize,
		y: (Math.floor((idx*atlasSize)/textureSize)*atlasSize) %textureSize,
	}
}


function Atlas(obj){
	this.idx = obj.idx;
	this.progress =0;
	this.onProgress = obj.onProgress;
	this.onLoad = obj.onLoad;
	this.image = null;
	this.url = data.atlasSet[this.idx]

	//this.url = '/output/static/jsm'+'/atlas-'+this.idx+'.jpg';
	
	this.load();
}

Atlas.prototype.load = function(){
	this.image = new Image;
	this.image.onload = function(){
		this.onLoad(this);
	}.bind(this);
	this.image.crossOrigin = "Anonymous";
	

	
	
	var xhr = new XMLHttpRequest();
	xhr.onprogress = function(e){
		var progress = parseInt((e.loaded/e.total)*100);
		this.onProgress(this.idx,progress);
	}.bind(this);
	xhr.onload = function(e){
		this.image.src =window.URL.createObjectURL(e.target.response);
		
	}.bind(this);
	xhr.open('GET',this.url,true);
	xhr.responseType = 'blob';
	xhr.send();
	
}


function Webgl(){
	this.gl = this.getGl();
	this.limits = this.getLimits();
}

Webgl.prototype.getGl = function(){
	var gl = getElem('canvas').getContext('webgl');
	if(!gl) getqs('#webgl-not-avaliable').style.display='block';
	return gl;
}


Webgl.prototype.getLimits = function(){
	 var extensions = this.gl.getSupportedExtensions().reduce(function(obj, i) {
		    obj[i] = true; return obj;
		  }, {})
		  // assess support for 32-bit indices in gl.drawElements calls
		  var maxIndex = 2**16 - 1;
		  ['', 'MOZ_', 'WEBKIT_'].forEach(function(ext) {
		    if (extensions[ext + 'OES_element_index_uint']) maxIndex = 2**32 - 1;
		  })
		  // for stats see e.g. https://webglstats.com/webgl/parameter/MAX_TEXTURE_SIZE
		  return {
		    // max h,w of textures in px
		    textureSize: Math.min(this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE), 2**13),
		    // max textures that can be used in fragment shader
		    textureCount: this.gl.getParameter(this.gl.MAX_TEXTURE_IMAGE_UNITS),
		    // max textures that can be used in vertex shader
		    vShaderTextures: this.gl.getParameter(this.gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS),
		    // max number of indexed elements
		    indexedElements: maxIndex,
		  }
}

function WelCome(){
	this.progressElem = getqs('#progress');
	this.loaderTextElem = getqs('#loader-text');
	this.loaderSceneElem = getqs('#loader-scene');
	this.buttonElem = getqs('#enter');
	this.ringElem = getqs('.lds-ring'); // 로딩 엘리먼트 ".ids-ring"임
	this.hotspotdiv = getqs('#mySidenav');
	this.worldtransition = true;
	this.start = true;

	this.buttonElem.addEventListener('click',this.onButtonClick.bind(this));
	this.hotspotdiv.addEventListener('scroll',this.onScroll.bind(this));
}
WelCome.prototype.onScroll = function(e){
	var c = document.querySelector('.closebtn')
	c.style.top = (e.target.scrollTop)+"px"
}


/**
 * 이미지캣 초기화면 Strat버튼 이벤트
 * @function() AgicsWorld.prototype.startWorld() 호출한다.
 */
WelCome.prototype.onButtonClick = function(e){
	if(e.target.className.indexOf('active') > -1){
		requestAnimationFrame(function(){
			this.removeLoader(function(){
				this.startWorld();
			}.bind(this));
		}.bind(this));
	}
}

WelCome.prototype.removeLoader = function(onSuccess){
	//로딩 박스 삭제 (추후 변경 예정)
	setTimeout(function(){
		onSuccess();
	},1111)
	
		document.querySelector('#progress').style.opacity = 0;

	
}

WelCome.prototype.updateProgress = function () {
	var progress = getValueSum(data.textureProgress) / data.textureCount;
  
	progress = progress.toString();
	var index = progress.indexOf(".");
	if (index > -1) progress = progress.substring(0, index);
  
	this.progressElem.textContent = progress + "%";
	//data.textureCount 뒤에 heightmap 완료 변수도 넣을예정
	if (progress == 100 && data.loadedTextures == data.textureCount) {
	  var enterBtn = document.querySelector("#enter");
  
	  this.buttonElem.className += " active";
	  enterBtn.style.cursor = "pointer";
	  enterBtn.classList.add("on");
	  enterBtn.style.backgroundImage =
		"linear-gradient(to bottom, #017bfd 0%, #20bfe1 100%)";
	}
  };

WelCome.prototype.startWorld = function(){
	if(this.start){
		this.start = false;
		requestAnimationFrame(function(){
			agicsworld.init();
			choose.init();
			
			setTimeout(function() {
			      requestAnimationFrame(function() {
			        document.querySelector('#loader-scene').classList += 'hidden';

					// FPS 측정을 위한 변수임
				    agicsworld.startTime = performance.now();
					
					// 어딘가에서 애니메이션 동작하는것 같음
					// new TimelineMax().to(
					// 	".popup_container", 0, {y: "-110%"}
					// )

			      }.bind(this))
			
				  //그룹화 하기 위한 투명값 낮추기
				  //actioneffect.setActionState();
				  //actioneffect.render();


				  // 이 부분이 처음 파티클 지정하는곳
				  layoutinfo.selected="logo";
			      layoutinfo.transitiontype();
			    }.bind(this), 1500)
		}.bind(this))
	}
}




function Adventure(){
	this.template = getqs('#hotspot-template');
	this.target = getqs('#hotspots');
	this.init();
	
}

Adventure.prototype.init = function(){
	
	var inner = ""

	for (i =0 ; i<data.centroids.centroids.length;i++){
		inner += ` <div id='hotspot' class=${i+1} class=><a> ${i+1} `+data.centroids.centroids[i].label+"</a></div>"
	}
	this.target.innerHTML = inner;
	var hotspots = getqsall('#hotspot')

	for (var i=0;i<hotspots.length ; i++){

		hotspots[i].addEventListener('click',function(idx){
			agicsworld.scenarioIndex = idx+1;
			//search가 진행중일때 worldtour할경우

			if(search.state.serching){
				agicsworld.moveCellIdx(-7,false);
				layoutinfo.transitiontype();
			}else{
				agicsworld.layoutCheck = true;
				const popup_container = document.querySelector(".popup_container");
				
				popup_container.style.display = 'none';
				popup.slideClear();

				agicsworld.moveCellIdx(data.centroids.centroids[idx].idx,true);
				agicsworld.layoutCheck = false;
			}
			
		}.bind(this,i))
	}
}

function getCanvasSize(){
	var elem = document.querySelector('#agicsplot-canvas');

	return {
		w: elem.clientWidth,
		h: elem.clientHeight,
	}
}

function getElem(tag,obj){
	var obj = obj || {};
	var elem = document.createElement(tag);
	Object.keys(obj).forEach(function(attr){
		
		elem[attr]=obj[attr];
	})
	return elem;
}



function Genesis(){}

Genesis.prototype.init = function(){
	if(!data.atlasloc) return;
	this.count = 1000; //표시 할 최대 문자 수
	this.point = 128.0; //아틀라스 텍스처의 각 문자의 px
	this.scale = 0;//
	this.kerning = 0// y 축 문자 간격을 지정하는 스칼라
}

/**
* Keyboard
**/

function Keyboard() {
  this.pressed = {};
  window.addEventListener('keydown', function(e) {
    this.pressed[e.keyCode] = true;
  }.bind(this))
  window.addEventListener('keyup', function(e) {
    this.pressed[e.keyCode] = false;
  }.bind(this))
}

Keyboard.prototype.shiftPressed = function() {
  return this.pressed[16];
}

Keyboard.prototype.commandPressed = function() {
  return this.pressed[91];
}



new params(); 



var welcome = new WelCome();
var webgl = new Webgl();
var config = new Config();
var choose = new Choose();
var itemselect = new ItemSelect();
var layoutinfo = new LayoutInFo();
var popup = new Popup();
var keyboard = new Keyboard();
var agicsworld = new AgicsWorld();
var label = new Label();
var lod = new LOD();
var data = new Data();
var search = new Search();
var youtubeapi = new youtubeAPI();
var bloom = new Bloom();
var actioneffect = new ActionEffect();
//var video = new Video();





    
function getloadJson(url,callback){
        var xhr = new XMLHttpRequest();
        xhr.overrideMimeType("json");
      
        xhr.open("GET", url, true);
        
        xhr.crossOrigin = "Anonymous";
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status == "200") {
                callback(xhr.responseText);
            }
        }

        xhr.send(null);
    }






function getValueSum(obj){
	return Object.keys(obj).reduce(function(a,b){
		a+= obj[b]; return a;
	},0)
}


function getqs(selector){
	return document.querySelector(selector);
}

function getqsall(selector){
	return document.querySelectorAll(selector);
}

function getMinCellZ(){
	var min = Number.POSITIVE_INFINITY;
	for (var i=0;i<data.cells.length;i++){
		min = Math.min(data.cells[i].z,min);
	}
	
	return min;
}

function getMinCellY(){
	var min = Number.POSITIVE_INFINITY;
	for (var i=0;i<data.cells.length;i++){
		min = Math.min(data.cells[i].y,min);
	}
	
	return min;
}

/**
* 
dict에서 중첩 키에 지정된 값을 가져옴.
**/

function getNested(obj, keyArr, ifEmpty) {
	  var result = keyArr.reduce(function(o, key) {
	    return o[key] ? o[key] : {};
	  }, obj);
	  return result.length ? result : ifEmpty;
	}

function bilinearLerp( t, hotspot ){

    if( t == 0 )return hotspot[0];
    if( t == 1 )return hotspot[2];

    var x0 = lerp( t, hotspot[0].x, hotspot[1].x );
    var y0 = lerp( t, hotspot[0].y, hotspot[1].y );
    var z0 = lerp( t, hotspot[0].z, hotspot[1].z );

    var x1 = lerp( t, hotspot[1].x, hotspot[2].x );
    var y1 = lerp( t, hotspot[1].y, hotspot[2].y );
    var z1 = lerp( t, hotspot[1].z, hotspot[2].z );

    return new THREE.Vector3( lerp( t, x0, x1 ),
                              lerp( t, y0, y1 ),
                              lerp( t, z0, z1 ) );

}

function getradian(degree){
	return (degree *(Math.PI/180))
}



// function for drawing rounded rectangles
function roundRect(ctx, x, y, w, h, r) 
{
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.lineTo(x+w-r, y);
    ctx.quadraticCurveTo(x+w, y, x+w, y+r);
    ctx.lineTo(x+w, y+h-r);
    ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    ctx.lineTo(x+r, y+h);
    ctx.quadraticCurveTo(x, y+h, x, y+h-r);
    ctx.lineTo(x, y+r);
    ctx.quadraticCurveTo(x, y, x+r, y);
    ctx.closePath();
    ctx.fill();
	ctx.stroke();   
}