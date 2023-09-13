function ActionEffect(){
	//10초간 작업이 없을경우  actionbool true로 변
	this.actionbool = false;
	this.idx = 0;
}

ActionEffect.prototype.init = function(){
	this.idx = 0;
}

ActionEffect.prototype.setActionState = function(){
	var cluster_group = data.centroids.centroids[0].cluster_group
	if(this.idx-1===-1){

	}else{
		cluster_group.forEach((id)=>{
			agicsworld.scene.traverse(function(child){
			
			if(child.name ==="atlaspoint"){
				child.geometry.attributes.actionstate.array[id] = 0.0;
				child.geometry.attributes.actionstate.needsUpdate = true;
			}
		})
		})
	}
	cluster_group.forEach((id)=>{
			agicsworld.scene.traverse(function(child){
			
			if(child.name ==="atlaspoint"){
				child.geometry.attributes.actionstate.array[id] = 1.0;
				child.geometry.attributes.actionstate.needsUpdate = true;
	
			}})
	})
}


ActionEffect.prototype.render = function(){
	agicsworld.scene.traverse(function(child){
			
			if(child.name ==="atlaspoint"){
				child.material.uniforms.actionstart = {type:'f',value:1.0};
				child.material.uniforms.needsUpdate  = true;
			}
	})

}