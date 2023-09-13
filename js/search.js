function Search(){
	this.autocomplete = getqs("#search-autocomplete");
	this.input = getqs(".textfield_input");
	this.textdiv = getqs(".textfield_holder");
	
	this.cancelelem = getqs(".searchcancel");
	this.searchlist = [];
	this.currentFocus = -1;
	//이미지 사이 거리 
	this.rangegrid = 1;
	//이미지 행 갯수
	this.grindcount = 25;
	this.radius = 2.1;
	this.taransitionduration = 10.0;
	this.state = {
			serching : false,
	}
}


Search.prototype.init = function(){

	
	for(var i = 0 ;i<data.centroids.centroids.length;i++){
		this.searchlist.push(data.centroids.centroids[i].label);
	}
	this.input.addEventListener('input',this.onInput.bind(this));

	this.input.addEventListener('keydown',this.onKeydown.bind(this));
	
}

Search.prototype.closeAllList = function(elmnt){
	var x = document.getElementsByClassName("autocomplete-items");
	for(var i=0;i<x.length; i++){
		if(elmnt != x[i]){
			x[i].parentNode.removeChild(x[i]);
		}
	}
}

Search.prototype.onKeydown = function(e){
	var index = 0;
	var query = document.querySelector("#autocomplete-list");



	if(e.keyCode === 40){
		
		if(this.currentFocus === query.children.length-1) return;
		
		if(this.currentFocus !==-1 ){
			query.children[this.currentFocus].className ="";
		}
		this.currentFocus++;
		
		query.children[this.currentFocus].className = "autocomplete-active"
	}else if(e.keyCode === 38){
		
		if(this.currentFocus ===-1) {			
			return
		}
		query.children[this.currentFocus].className ="";
		

		this.currentFocus--;
		if(this.currentFocus ===-1) return;

		query.children[this.currentFocus].className = "autocomplete-active"
	}else if(e.keyCode === 13){
		
		
		var selectinput = document.querySelector(".autocomplete-active input");
		var selectquery = document.querySelector(".autocomplete-active");
		
		if(selectquery){
			this.input.value = selectquery.innerText;
			
			
			this.searchtrantition(selectinput.value);
			
		}else{
			var selectvalue = document.querySelector(".textfield_input");
	
			
			
			var index = undefined;
			for(i=0;i<this.searchlist.length;i++){
				if(this.searchlist[i]===selectvalue.value){
					index = i;
				}
			}
			
			if(index===undefined){
				return
			}else{
				this.searchtrantition(index);
				
			}
			
			
			
		}
		this.closeAllList();
		
	}else if(e.keyCode === 27){
		this.searchcancel();
	}
}
Search.prototype.addActive = function(x){
	if (!x) return false;
	
}

Search.prototype.onInput = function(e){

	this.closeAllList();
	
	this.currentFocus = -1;
	
	if(!document.querySelector("#autocomplete-list")){
		this.listdiv = document.createElement("DIV");
		
		this.listdiv.setAttribute("id","autocomplete-list");
		
		this.listdiv.setAttribute("class","autocomplete-items");
		
		this.autocomplete.appendChild(this.listdiv);
	}
	var targetlength = (e.target.value).replace(/\s/gi,"").length;
	

	for(i=0; i<this.searchlist.length ; i++){
		
		
		if(!(e.target.selectionEnd===0)&&this.searchlist[i].replace(/\s/gi,"").substr(0,targetlength).toUpperCase() === (e.target.value).replace(/\s/gi,"").toUpperCase()){
			var count = 0;
			var blankcount = this.searchlist[i].substr(0,e.target.selectionEnd);

			var b = document.createElement('DIV');
			
			for(g=0;g<blankcount.length;g++){
				if(blankcount[g] === " "){
					count++;

				}
			}
			
			
			b.innerHTML = "<strong>"+this.searchlist[i].substr(0,e.target.selectionEnd+count)+"</strong>";
			b.innerHTML += this.searchlist[i].substr(e.target.selectionEnd+count);
			b.innerHTML += "<input type='hidden' value='" + i +"'>";
	
			b.addEventListener("click",function(e){
				//html tag input value 값
				var input = e.target.childNodes[2];
				this.state.serching = true;
				this.input.value  = this.searchlist[input.value];
				
				
				
				this.closeAllList();
				this.searchtrantition(input.value);
			}.bind(this))
			
			this.listdiv.appendChild(b);
		}
	}
	
	
	
}
Search.prototype.searchcancel = function(){
	

	this.cancelelem.style.display = "none";
	this.state.serching =false;
	layoutinfo.selected = layoutinfo.selectedtemp;
	layoutinfo.transitiontype();
	agicsworld.moveCellIdx(-7,true);
}

Search.prototype.searchtrantition = function(index){
	this.state.serching = true;
	label.removelabel();
	layoutinfo.selectedtemp = layoutinfo.selected;
	layoutinfo.selected= "umap";
	layoutinfo.setPointScalar()
	this.cancelelem.style.display = "block";
	
	//search 취소할경우 event발생
	this.cancelelem.addEventListener("click",this.searchcancel.bind(this));
	
	agicsworld.moveCellIdx("search", false);
	
	var searchlist = data.centroids.centroids[index].cluster_group;
	
	setTimeout(function(){
	var size = data.pointsize.scatter
	var initx = -(size/this.rangegrid)* ((searchlist.length >this.grindcount) ? this.grindcount-1 : searchlist.length-1)
	var initz = -(size/this.rangegrid)*(Math.floor((searchlist.length-1)/this.grindcount));
	
	
	var degreeratio = 360/(data.cells.length-searchlist.length);
	
	var index = 0;
	var degreex = 0;
	var degreez = 0;
	
	for (var i =0;i<data.cells.length;i++){
		
		if(searchlist[index]===i){
			x = initx + ((size*2)/this.rangegrid)*(index%this.grindcount);
			if(index!==0 && index%this.grindcount===0){
				
				initz = initz + ((size*2)/this.rangegrid);
				x = initx;

			}
			
			
			data.cells[i].tx = x;
			data.cells[i].ty = 0;
			data.cells[i].tz = initz;
			
	
			index++
		}else{
			degreex += degreeratio;
			degreez += degreeratio;
			
			data.cells[i].tx = this.radius*Math.cos(getradian(degreex));
			data.cells[i].ty = 0;
			data.cells[i].tz = this.radius*Math.sin(getradian(degreez));
		}
		data.cells[i].setBuffer('pos1');
		
	}
	
	for ( var i=0;i<agicsworld.group.children.length; i++){
		if(agicsworld.group.children[i].type !=="Mesh"){
			
			
			agicsworld.group.children[i].geometry.attributes.pos1.needsUpdate = true;
			TweenLite.to(agicsworld.group.children[i].material.uniforms.transitionPercent,
					this.taransitionduration,config.transitions.ease);
			
			
			
		}
		
		
	}
	
	setTimeout(this.transition.bind(this),config.transitions.duration*1000);

}.bind(this),500)
	
	
	
}

Search.prototype.transition = function(){
	
	
	data.cells.forEach(function(cell){
		cell.x = cell.tx;
		cell.y = cell.ty;
		cell.z = cell.tz;
		cell.setBuffer('position');
	})
	
	for (var i=0;i<agicsworld.group.children.length;i++){
		if(agicsworld.group.children[i].type !=="Mesh"){
			agicsworld.group.children[i].geometry.attributes.position.needsUpdate = true;
			agicsworld.group.children[i].material.uniforms.transitionPercent = {type:'f',value:0};
		}
	
	}
	
	agicsworld.setUniform('scale',agicsworld.getPointScale());
	
	lod.indexCells();
}
