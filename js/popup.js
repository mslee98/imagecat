const SLIDEPAGE = 5;
const IMAGEWIDTH = 150;
const IMAGEMARGIN = 5;

function Popup() {
	this.canvas ;
	this.ctx ;
	this.cellIdx = null;
	this.cellIndices = [];
	this.initCanvas();
	this.toggleevent = null;
	this.selectedindex= 0;


	//이미지 기준 index
	this.cluster_group;
	this.cluster_group_length;

	this.transitionrotation=7.425;
	this.slideelem = document.querySelector('.slide_');
	this.pos = {
			drawable:false,
			x:-1,
			y:-1
	}
	this.addEventlisteners();
}

Popup.prototype.showimage = function(cellarray,cellIdx){
	


	this.cellIdx = cellIdx;

	var loaddata = data.atlasloc[cellIdx]
	
	//서브이미지 정보 로드
	const issubloaddata = (elem) => elem==cellIdx;

	for(var i = 0;i<data.centroids.centroids.length;i++){
		this.index=data.centroids.centroids[i].cluster_group.findIndex(issubloaddata)
		
		if(this.index!==-1){
			this.cluster_group = data.centroids.centroids[i].cluster_group
			this.cluster_group_length = this.cluster_group.length;


			//현재 선택된 인덱스
			this.selectedindex = this.index;		
		
			
			let createCount = 0;
			for(let i=this.index;i<this.cluster_group.length;i++){
				this.createImagSubElem(this.cluster_group[i]);
				++createCount;
				if(createCount>100){
					break;
				}
			}
			
			this.setSlideShow();
			
			break;
		}
	}
	
	

		
	if(data.cells[cellIdx].isVideo ===1){
		this.showModal({isVideo:true});
		
	}else{
		this.showDetail(loaddata);
		var image =  new Image();
		image.id = 'selected-image';
		image.onload = function(){
			this.showModal({image:image , imagename : loaddata.in ,isVideo:false})
			this.animation();
		}.bind(this);
		image.crossOrigin = "Anonymous";	
		image.src = data.imgHost+data.uuid+'/originals/'+loaddata.sub_path;

		this.showopacity();

	}
	
	
}
Popup.prototype.createImagSubElem=function(cellIdx){
	var li = document.createElement('li');
	li.className="ui-thumbnail"
	let subimage = new Image();
	subimage.className="detail-image num_"+cellIdx;
	
	li.appendChild(subimage);
	
	imagedata=data.atlasloc[cellIdx];
	subimage.crossOrigin = "Anonymous";
	subimage.src = data.imgHost+data.uuid+'/thumbs/'+imagedata.sub_path;
	
	this.slideelem.appendChild(li);

}



Popup.prototype.animation = function(){
	
		document.querySelector('.circle').removeEventListener('click',function(){});
		
		var overlayTl1 = new TimelineMax();

		const overlays = [];
		const overlayElems = [...document.querySelectorAll('.overlay1_popup')];
		const overlaysTotal = overlayElems.length;
		overlayElems.forEach((overlay,i) => overlays.push(new Revealer(overlay, {angle: i % 2 === 0 ? -10 : 10})));

		
		this.toggleevent =  new TimelineMax().to("#canvasWrap",1.5,{y:"110%",ease:Expo.easeInOut},0);
		document.querySelector('.circle').addEventListener('click',function(e){
			this.toggleevent.reverse();
			
			this.slideClear();
			document.getElementById("cb2").checked=false;
			document.querySelector('.selected_content').style.display="block";
			this.canvas.style.display="none";
		}.bind(this));
		
		
		
		let t = 0;
        for (let i = 0; i <= overlaysTotal-1; ++i) {
			t = 0.2*i+0.2
            this.toggleevent
            .to(overlays[overlaysTotal-1-i].DOM.inner, 1.2, {
                ease: Expo.easeInOut,
                y: '110%'
            }, t);
		}
		
        
	
}

Popup.prototype.slideClear = function(){
	let elems = document.querySelector('.slide_');
	while(elems.children.length!==0){
		elems.children[0].remove();
	}
}

Popup.prototype.onPlayerReady =function(event){
	  event.target.playVideo();//자동재생
}
Popup.prototype.onPlayerStateChange = function(event){
	   if (event.data == YT.PlayerState.PLAYING) {
	        //플레이어가 재생중일때 작성한 동작이 실행된다.
	    }
}

Popup.prototype.addEventlisteners = function(){
	//원본클릭
	document.body.addEventListener('click',this.onClick.bind(this));
	document.getElementById("cb2").addEventListener('change',this.onChnage.bind(this))
	document.querySelector(".popup_button").addEventListener('click',this.imagetransfer.bind(this));
	document.getElementById("bt_clear").addEventListener('click',this.clearCanvas.bind(this));
	this.canvas.addEventListener("mousedown",this.listener.bind(this));
	this.canvas.addEventListener("mousemove",this.listener.bind(this));
	this.canvas.addEventListener("mouseup",this.listener.bind(this));
	this.canvas.addEventListener("mouseout",this.listener.bind(this));
	this.canvas.addEventListener("touchstart",this.listener.bind(this));
	this.canvas.addEventListener("touchmove",this.listener.bind(this));
	this.canvas.addEventListener("touchend",this.listener.bind(this));
	
}
//canvas 전송하기
Popup.prototype.imagetransfer = function(){
	var dataurl = this.canvas.toDataURL("image/png");
	var xhr = new XMLHttpRequest();
	var data = {
		searchimage: dataurl
	};
	const lodingdiv = document.querySelector('.overlay_search_popup');
	lodingdiv.style.display = "table";
	try {
		xhr.crossOrigin = "Anonymous";
		let _this = window;
		xhr.onload = function() {
		  if (xhr.status === 200 || xhr.status === 201) {
			
			let label=JSON.parse(xhr.responseText)[0].label.split('#')[1];
			this.popup.cluster_group =[];
			for(let i=0;i<this.data.atlasloc.length;i++){
				if(label ===this.data.atlasloc[i].sub_path.split('@')[1].split('/')[0]){
					this.popup.cluster_group.push(i);
				}
			}
			
			this.popup.cluster_group_length = this.popup.cluster_group.length;
			this.popup.cellIdx=this.popup.cluster_group[0];
			//현재 슬라이드 페이지 초기화
			var loaddata = this.data.atlasloc[this.popup.cluster_group[0]]
			this.popup.index=0;
			this.popup.selectedindex = 0;
			this.popup.slideClear();
			
			for(let i=0;i<this.popup.cluster_group.length;i++){
				this.popup.createImagSubElem(this.popup.cluster_group[i]);
				if(i>150){
					
					break;
				}
			}
			this.popup.setSlideShow();
	
			var image =  new Image();
			image.id = 'selected-image';
			image.onload = function(){
				this.popup.showModal({image:image , imagename : loaddata.in ,isVideo:false})
			}.bind(this);
			image.crossOrigin = "Anonymous";	
			image.src = this.data.imgHost+this.data.uuid+'/originals/'+loaddata.sub_path;
			
			
			this.popup.showopacity();
			
	
			lodingdiv.style.display = "none";
			
		  } else {
			lodingdiv.style.display = "none";
			console.error(xhr.responseText);
		  }
		}.bind(_this);
		xhr.open('POST', 'http://192.168.0.23:4488/search');
		xhr.setRequestHeader('Content-Type', 'application/json'); // 컨텐츠타입을 json으로
		xhr.send(JSON.stringify(data)); // 데이터를 stringify해서 보냄
	} catch (error) {
		lodingdiv.style.display = "none";
		alert(error);
	}
	
	
	
}


//캔버스 리스너
Popup.prototype.listener=function(e){
	switch(e.type){
	case "mousedown": 
	case "touchstart":
		this.initDraw(e);
		break;
	case "mousemove": 
	case "touchmove":
		if(this.pos.drawable)
			this.draw(e);
		break;
	case "mouseout":
	case "mouseup" : 
	case "touchend":
		this.finishDraw();
		break;
	}
	
	
}


Popup.prototype.initCanvas=function(){
	this.canvas = document.getElementById('popup_canvas');
	this.ctx = this.canvas.getContext("2d");

	
}
Popup.prototype.clearCanvas=function(){
	this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
}

Popup.prototype.initDraw=function(e){
	this.ctx.beginPath();
	this.pos.drawable=true;
	var coors = this.getPosition(e);
	this.pos.X=coors.X;
	this.pos.Y =coors.Y;
	this.ctx.moveTo(this.pos.X,this.pos.Y);
}

Popup.prototype.draw = function(e){
	var coors = this.getPosition(e);
	this.ctx.lineTo(coors.X,coors.Y);
	this.pos.X=coors.X;
	this.pos.Y=coors.Y;
	this.ctx.strokeStyle="#BFFF00"
	this.ctx.stroke();
}

Popup.prototype.finishDraw=function(){
	this.pos.drawable=false;
	this.pos.X=-1;
	this.pos.Y=-1;
}

Popup.prototype.getPosition=function(e){
	var rect = this.canvas.getBoundingClientRect();
	var scaleX = this.canvas.width/rect.width;
	var scaleY = this.canvas.height/rect.height;
	var x,y;
	if(e.type==="touchstart" || e.type=== "touchend" ||e.type=== "touchmove"){
		x = (e.touches[0].pageX-rect.left)*scaleX;
		y = (e.touches[0].pageY-rect.top)*scaleY;
	}else{
		x = (e.clientX-rect.left)*scaleX;
		y = (e.clientY-rect.top)*scaleY;
	}
	
	return {X:x,Y:y};
}


Popup.prototype.onChnage = function(e){
	if(e.target.checked){
		document.querySelector('.selected_content').style.display="none";
		this.canvas.style.display="block";
	}else{
		document.querySelector('.selected_content').style.display="block";
		this.canvas.style.display="none";
	}

}



Popup.prototype.close = function(){
	window.location.href = '#';
	document.querySelector('#selected-image-target').style.display = 'none';
	//이미지 제거
	this.sliderelem.style.transform = 'translate(0vh)';

	this.cellIndices = [];
	this.cellIdx = null;
	this.displayed =false
}

Popup.prototype.reverse = function(e,toggleevent){
	togleevent.reverse()

}


Popup.prototype.setSlideShow = function(){
	const width = IMAGEWIDTH;
	const margin = IMAGEMARGIN;
	//let calindex = Math.round(index/2)
	let cal = -((width+10)*(this.selectedindex-this.index-2)) 
	//let cal = -(width+10)
	document.querySelector(".slide_").style.transform = 'translateX('+cal+'px)'
	
	
}

Popup.prototype.updateSlideWidth = function(){
	var currentSlides = document.querySelectorAll(".slide_ li");
	var newSlideCount = currentSlides.length;
	
	let width = document.querySelector('.ui-thumbnail').clientWidth;
	let slidecount = document.querySelectorAll('.ui-thumbnail').length;
	
	var newWidth = (width+5)*newSlideCount-5+'px';
	
	document.querySelector('.slide_').style.width = newWidth;
	
}



Popup.prototype.showopacity= function(){
	try{
	let ths = document.querySelectorAll('.ui-thumbnail');
	ths.forEach((th)=>{
		th.style.opacity = "50%";
		
	})
	
	let subimage = document.querySelector('.num_'+this.cellIdx);
	subimage.parentNode.style.opacity = "100%";
	}catch(error){
		console.log(`Error : Num ${this.cellIdx}`)
	}
}

Popup.prototype.onClick = function(e){

	if(e.target.className === 'multi_next'){
		this.nextSlider();

	}else if(e.target.className ==='multi_prev'){
		this.prevSlider();
		

	}
}

Popup.prototype.nextSlider= function(){
	
	this.selectedindex = this.selectedindex+1;
	if(this.cluster_group_length<=this.selectedindex){
		this.selectedindex=this.cluster_group_length-1;
		return;
	}
	this.setSlideShow();
	this.getSelectImage();

	
}

Popup.prototype.prevSlider= function(){
	

	this.selectedindex = this.selectedindex -1;
	if(this.selectedindex<0){
		this.selectedindex = 0;
		return;
	}
	this.setSlideShow();
	this.getSelectImage();
	
}



Popup.prototype.getSelectImage = function(){
	this.cellIdx=this.cluster_group[this.selectedindex];

	let image = document.getElementById('selected-image');
	let loaddata = data.atlasloc[this.cellIdx];
	
	image.src= data.imgHost+data.uuid+'/originals/'+loaddata.sub_path;
	image.onload=function(){
		this.showModal({image:image});
	}.bind(this);
	this.showDetail(loaddata);
	this.showopacity();
	
}



Popup.prototype.showModal = function(json){

		var image_elem = document.querySelector('.image_data');
		image_elem.children.length == 1 ? image_elem.children[0].remove() :false; 
		image_elem.appendChild(json.image);
		//opacity 초기화

	
}


/* 
 * 상세내용 출력 
 */

Popup.prototype.showDetail = function(loaddata){
	
	let uuidinfo = data.uuidinfo;
	let uuiddata = null;
	let keys = "\\"+loaddata.sub_path.replace("\/","");
	
	uuiddata=uuidinfo[keys]



	
	var xhr = new XMLHttpRequest();
	var formData = new FormData();
	formData.append('dataUuid', uuiddata);

	xhr.onload = function() {
	  if (xhr.status === 200 || xhr.status === 201) {

	    this.setDetail(JSON.parse(xhr.responseText))
	  } else {
	    console.error(xhr.responseText);
	  }
	}.bind(this);
	xhr.open('POST', `${config.data.url}/main/selectDetailInfo.do`);
	xhr.send(formData); 
	
	
	
	
	return false;
}
Popup.prototype.setDetail = function(fileinfodata){
	const detailInfo = fileinfodata.detailInfo
	if(detailInfo===undefined || detailInfo===null){
		return;
	}
	if(detailInfo.dataMovieUrl===""){
		document.querySelector('.detail_p').innerText=detailInfo.dataDetail;
		document.querySelector('.t2').innerText=detailInfo.dataCategory;
		document.querySelector('.tag').innerHTML = detailInfo.dataHashtag;
		document.querySelector('.t4').innerHTML = detailInfo.dataDesc+fileinfodata.detailInfo.dataSubpathName;
	}else{
		youtubeapi.onYouTubeIframeAPIReady(detailInfo.dataMovieUrl.split('v=')[1]);
	}
	

	
}


