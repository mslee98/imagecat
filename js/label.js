function Label(){
	this.config = {}
}


Label.prototype.init = function(){
	var textpoint = this.makeTextSprite( { fontsize: 24, backgroundColor: {r:255, g:100, b:100, a:1} } );
	textpoint.name="textpoint";
	agicsworld.scene.add( textpoint );

	this.removelabel();
}

Label.prototype.update = function(){
	
}

Label.prototype.removelabel = function(){
	
	agicsworld.scene.children.forEach(function(child,idx){
		if(child.name ==="textpoint"){
			child.geometry.attributes.position.needsUpdate = true;
			child.material.uniforms.visible.value =0;
		}
	})
	
}

Label.prototype.createlabel = function(){
	agicsworld.scene.children.forEach(function(child,idx){
		
		
		if(child.name ==="textpoint"){
			child.geometry.attributes.position.needsUpdate = true;		
			child.material.uniforms.visible.value =1;
		}
	})
}

Label.prototype.makeTextSprite = function(parameters){
if ( parameters === undefined ) parameters = {};
	
	var fontface = parameters.hasOwnProperty("fontface") ? 
		parameters["fontface"] : "Arial";
	
	var fontsize = parameters.hasOwnProperty("fontsize") ? 
		parameters["fontsize"] : 18;
	
	var borderThickness = parameters.hasOwnProperty("borderThickness") ? 
		parameters["borderThickness"] : 5;
	
	var borderColor = parameters.hasOwnProperty("borderColor") ?
		parameters["borderColor"] : { r:0, g:0, b:0, a:1.0 };
	
	var backgroundColor = parameters.hasOwnProperty("backgroundColor") ?
		parameters["backgroundColor"] : { r:255, g:255, b:255, a:1.0 };

	//var spriteAlignment = parameters.hasOwnProperty("alignment") ?
	//	parameters["alignment"] : THREE.SpriteAlignment.topLeft;

var worldcanvas = document.createElement('canvas');		
worldcanvas.width = config.size.texture;
worldcanvas.height = config.size.texture;
var worldctx = worldcanvas.getContext('2d');


textuv = new Float32Array(data.centroids.centroids.length*2)

for (var i = 0; i < data.centroids.centroids.length; i++)
{
	
	var canvas = document.createElement('canvas');
	var context = canvas.getContext('2d');
	
	var centroids = data.centroids.centroids[i];

	
	context.font = "Bold " + fontsize + "px " + fontface;
    
	// get size data (height depends only on font size)
	
	var label = centroids.label
	var labels = label.split(',');
	
	var metrics = context.measureText( labels[0] );
	var textWidth = 293;
	var center = (textWidth-metrics.width)/2
	// background color
	context.fillStyle   = "rgba(" + backgroundColor.r + "," + backgroundColor.g + ","
								  + backgroundColor.b + "," + backgroundColor.a + ")";
	// border color
	context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + ","
								  + borderColor.b + "," + borderColor.a + ")";

	context.lineWidth = borderThickness;
	roundRect(context, borderThickness/2, borderThickness/2, textWidth + borderThickness, fontsize * 1.4 + borderThickness, 6);
	// 1.4 is extra height factor for text below baseline: g,j,p,q.
	
	// text color
	context.fillStyle = "rgba(0, 0, 0, 1.0)";
	context.fillText( labels[0], center, fontsize + borderThickness);
	
	var uv_x = (i%27)*(textWidth + borderThickness)
	var uv_y = parseInt(i/27)*(fontsize * 1.4 + borderThickness)
	
	// canvas contents will be used for a texture
	worldctx.drawImage(canvas, uv_x, uv_y);
	
	textuv[i*2] = uv_x;
	textuv[(i*2)+1] = uv_y;
}
	var texture = new THREE.Texture(worldcanvas)
	texture.needsUpdate = true;
	texture.flipY = false;
	texture.generateMipmaps =false;
	
	texture.magFilter = THREE.LinearFilter;
	texture.minFilter = THREE.LinearFilter;

	
	pos0 = new Float32Array(data.centroids.centroids.length*3)
	
	for (var i = 0; i < data.centroids.centroids.length; i++)
	{
		var centroids = data.centroids.centroids[i];
		var position = data.cells[centroids.idx];

		pos0[i*3] =  position.x;
		pos0[(i*3)+1] = 0;
		pos0[(i*3)+2] = position.z;
	}
	
	
	geometry = new THREE.BufferGeometry();
	
	geometry.setAttribute('position',new THREE.BufferAttribute(pos0,3));
	geometry.setAttribute('textuv',new THREE.BufferAttribute(textuv,2));
	
	var uniforms = 
    {
		textures: { type: "t" 
			,value: texture
			},
		cameraposition:{
			type:"vec3",value:agicsworld.camera.position
		},
		width:{
			type:"float",value:(textWidth + borderThickness)
		},
		height:{
			type:"float",value:fontsize * 1.4 + borderThickness
		},
		visible:{
			type:"float",value:1.0,
		}
    }
	var spriteMaterial = new THREE.ShaderMaterial( 
		{ uniforms: uniforms,
			vertexShader: textVertexshader,
			fragmentShader: textFragementshader,
			} );
	var sprite = new THREE.Points(geometry, spriteMaterial );
	sprite.frustumCulled = false;
	return sprite;	
}