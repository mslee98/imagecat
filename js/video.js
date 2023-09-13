function Video(){
	this.mode = null;
	this.mp4url = "/output/static/js/kinect.mp4";
	this.webmurl = "/output/static/js/kinect.webm";
}

Video.prototype.init = function(){
	var videoelem = document.createElement("video");
	videoelem.id = "video";
	videoelem.crossOrigin= "anonymous"
	videoelem.loop = true;
	videoelem.muted = true;
	videoelem.style.display = "block";
	var sourceMP4 = document.createElement("source");
	sourceMP4.type = "video/mp4";
	sourceMP4.src = this.mp4url;
	var sourceWebm = document.createElement("source");
	sourceWebm.type = "video/webm";
	sourceWebm.src = this.webmurl;
	
	videoelem.appendChild(sourceMP4);
	videoelem.appendChild(sourceWebm);
	
	document.body.appendChild(videoelem);
}

Video.prototype.initVideoShader = function(){
	var video = document.getElementById('video');
	
	video.addEventListener( 'loadedmetadata', function () {

		var texture = new THREE.VideoTexture( video );
		texture.minFilter = THREE.NearestFilter;

		var width = 640, height = 480;
		var nearClipping = 850, farClipping = 4000;

		geometry = new THREE.BufferGeometry();

		var vertices = new Float32Array( width * height * 3 );

		for ( var i = 0, j = 0, l = vertices.length; i < l; i += 3, j ++ ) {

			vertices[ i ] = j % width;
			vertices[ i + 1 ] = Math.floor( j / width );

		}

		geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );

		material = new THREE.ShaderMaterial( {

			uniforms: {

				"map": { value: texture },
				"width": { value: width },
				"height": { value: height },
				"nearClipping": { value: nearClipping },
				"farClipping": { value: farClipping },

				"pointSize": { value: 2 },
				"zOffset": { value: 1000 }

			},
			vertexShader: videoVertexshader,
			fragmentShader: videoFragmentshader,
			blending: THREE.AdditiveBlending,
			depthTest: false, depthWrite: false,
			transparent: true

		} );
	
	})
	
}



Video.prototype.remove = function(){
	
}
