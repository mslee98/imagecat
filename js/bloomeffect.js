function Bloom(obj){
		this.bloomComposer = null;
		this.bloomrender = false;
		this.geometry  = new THREE.BufferGeometry();
		this.material = new THREE.ShaderMaterial({
		uniform:{
			time:Date.now(),
		},
		 vertexShader : boxvertexshader,
    	fragmentShader :  boxfragmentshader 
	 });
	 	this.particles = null;

		
}

Bloom.prototype.init = function(){

	
	let renderScene = new THREE.RenderPass( agicsworld.scene, agicsworld.camera );

	this.bloomPass = new THREE.UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
	this.bloomPass.threshold = 0.21
	this.bloomPass.strength = 3.2
	this.bloomPass.radius = 0.55

	this.bloomComposer = new THREE.EffectComposer( agicsworld.renderer );
	this.bloomComposer.renderToScreen = true;
	this.bloomComposer.addPass( renderScene );
	this.bloomComposer.addPass( this.bloomPass );
			
	const n = data.cells.length;
	let _position = new Float32Array(n*3);
	let _highlight= new Float32Array(n);


	let position = new THREE.BufferAttribute(_position,3,true,1);
	let highlight = new THREE.BufferAttribute(_highlight,3,true,1);



	position.usage = THREE.DynamicDrawUsage;
	this.geometry.setAttribute('position',position);
	this.particles = new THREE.Points(this.geometry,this.material);
	this.particles.name='highlightbox';
	this.particles.layers.set(1);

}

Bloom.prototype.create = function(){
	var position = null;
	agicsworld.scene.traverse(function(child){
		if(child.name ==="atlaspoint"){

			this.particles.geometry.attributes.position = child.geometry.attributes.position.clone();
			this.particles.geometry.attributes.highlight = child.geometry.attributes.highlight.clone();
			this.particles.geometry.attributes.width = child.geometry.attributes.width.clone();
			this.particles.geometry.attributes.height = child.geometry.attributes.height.clone();
			this.particles.geometry.attributes.position.needsUpdate = true;
			this.particles.geometry.attributes.highlight.needsUpdate = true;
			this.particles.geometry.attributes.width.needsUpdate = true;
			this.particles.geometry.attributes.height.needsUpdate = true;
		
		}
	}.bind(this))

	console.log("particle", this.particles);

	agicsworld.scene.add(this.particles);
	agicsworld.objects.push(this.particles);
	this.bloomrender = true;
	
}
Bloom.prototype.reposition = function(){
	agicsworld.scene.traverse(function(child){
		if(child.name ==="atlaspoint"){

			this.particles.geometry.attributes.position = child.geometry.attributes.position.clone();
			this.particles.geometry.attributes.position.needsUpdate = true;
		}

	}.bind(this))
}
Bloom.prototype.delete = function(){
	
	agicsworld.scene.remove(agicsworld.scene.getObjectByName("highlightbox"));
}

Bloom.prototype.visible = function(){
	
	agicsworld.scene.add(this.particles);
}

Bloom.prototype.render = function(){

	  agicsworld.renderer.autoClear = false;
  	  agicsworld.renderer.clear();

	  agicsworld.camera.layers.set(1);
	  this.bloomComposer.render();

	  agicsworld.renderer.clearDepth();
	  agicsworld.camera.layers.set(0);
	  

}