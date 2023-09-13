
var VertexShader = `
	
	precision mediump float;
	
	uniform float scale;
    uniform float scaleTarget;
    uniform float transitionPercent;
    uniform float scaleTransitionPercent;
    uniform float borderWidth;
    uniform float delay;
	
	
	attribute vec3 pos0;
	attribute vec3 pos1;          // x y z position to which we're transitioning
	attribute vec2 offset;
	attribute float textureIndex; // index of an instance's texture among all textures
	attribute vec3 color;         // unique color for cell; used for raycasting
    attribute float width;        // px width of cell in lod texture
    attribute float height;       // px height of cell in lod texture
    attribute float opacity;      // opacity value for cell
    attribute float selected;     // 1 if the cell is selected else 0
    attribute float highlight;   //하이라이트
    attribute float isvideo;
	attribute float actionstate;

	varying vec3 vColor;          // cell color
    varying float vWidth;         // px width of cell in lod texture
    varying float vHeight;        // px height of cell in lod texture
    varying float vOpacity;       // cell opacity
    varying float vSelected;      // 1 if this cell is selected else 0
    varying float vTextureIndex;  // cell texture idx (varyings can't be int)
	varying vec2 vOffset;
	varying float vborderWidth;
	varying float vHighlight;
	varying float vIsVideo;
	varying vec3 vfragNrm;
	varying vec3 vfragWorldPos;
	varying float vActionState;

	void main() {

		vTextureIndex = textureIndex;
		vColor = color;
	    vWidth = width;
	    vHeight = height;
	    vOffset = offset;
	    vOpacity = opacity;
	    vSelected = selected;
      	vborderWidth = borderWidth;
      	vHighlight = highlight;
      	vIsVideo = isvideo;
		vActionState = actionstate;
	  	
	  
      vfragNrm = (normalMatrix*normal).xyz;
      vfragWorldPos = (modelViewMatrix * vec4(pos1,1.0)).xyz;
      // determine how far this point has proceeded in its transition
      float delayX = (pos1.x + 1.0) / 2.0;
      float delayY = (position.y + 1.0) / 2.0;
      // pos0 has domains -1:1, so the delay sum above is <= 2.0
      float d = ((delayX + delayY) / 2.0) * delay;

      float percent = clamp(transitionPercent - d, 0.0, 1.0);

      // set point position as a mixture between the position + target
      vec3 pos = mix(position, pos1, smoothstep(0., 1., percent));
      
	  vec4 world = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * world;
		
	  float s = mix(scale, scaleTarget, percent);
      float pointSize = s / -world.z;
		
	if (selected > 0.5) {
	        gl_PointSize = pointSize + (pointSize * borderWidth);
      } else {
        gl_PointSize = pointSize;
      }

		
		
		
	}
`;

var FragmentShader = `
	precision mediump float;
	

	uniform float render;

    uniform float cellAtlasPxPerSide;
    uniform float lodAtlasPxPerSide;
    uniform float cellPxHeight;
    uniform float lodPxHeight;
	uniform float useColor;
    uniform vec3 borderColor;
    uniform sampler2D playTexture;
	uniform float time;
	uniform float actionstart;
	
	varying float vborderWidth;
	varying vec3 vColor;         // cell's color (for gpu picking)
    varying vec2 vOffset;        // cell's offset in px from left, top of tex
    varying float vWidth;        // cell's width in lod tex in px
    varying float vHeight;       // cell's height in lod tex in px
    varying float vOpacity;      // cell's opacity
    varying float vSelected;     // cell's presence (>0.5) or absence (<0.5) from selection
    varying float vTextureIndex; // cell's texture index
	varying float vHighlight;
	varying float vIsVideo;
	varying vec3 vfragNrm;
	varying vec3 vfragWorldPos;
	varying float vActionState;
	
	
	 #ifndef SELECTING
      uniform sampler2D textures[N_TEXTURES]; // array of sampler2Ds
      uniform sampler2D lodTexture; // single sampler2D
    #endif
	float boxDist(vec2 p){
  vec2 d = abs(p)-10.0;
  return length(max(d,vec2(0))) + min(max(1.0,1.0),0.0);
}
	float getGlow(float dist, float radius, float intensity){
	  return pow(radius/dist, intensity);
	}


    void main() {
      vec3 normal = normalize(vfragNrm);
      
      vec3 toCam = normalize(cameraPosition - vfragWorldPos);
      float rimAmt = 1.0-max(0.0,dot(normal,toCam));
      rimAmt = rimAmt * rimAmt;
     
    
      // is this cell a LOD cell? TextureIndex 0 lod = -1
      bool isLod = vTextureIndex < -0.5;

      // 셀 양쪽의 테두리 너비를 얻습니다.
      float borderW = vborderWidth / 2.0;

      // cellPxHeight 는 32이다 (비율??? )
      float w = isLod ? vWidth : vWidth/vHeight*cellPxHeight;
      float h = isLod ? vHeight : cellPxHeight;
	
      // find the length of the cell in its longest dimension (in px)
      float big = max(w, h);

      // set boolean indicating whether to center cells
      bool center = true;

      // find min, max vals of 0:1 scaled x axis to be textured
      float x0 = center ? (big-w)/2.0/big : 0.0;
      float x1 = center ? (w/big)+x0 : w / big;

      // find min, max vals of 0:1 scaled y axis to be textured
      float y0 = center ? (big-h)/2.0/big : 0.0;
      float y1 = center ? (h/big)+y0 : h / big;

      // 셀을 자르고 x 축의 중심에 텍스처를 배치
      if (h > w && (gl_PointCoord.x < x0 || gl_PointCoord.x > x1)) discard;

      // 이 셀의 이미지가 가로 클립 하단 마진 인 경우
      else if (w > h && gl_PointCoord.y < y0 || gl_PointCoord.y > y1) discard;

      // 이 셰이더가 vColor 속성을 사용하는 경우 텍스처 처리를 건너 뜁니다
      if (int(useColor) == 1) gl_FragColor = vec4(vColor, 1.0);
	 
	
      // this cell should be textured
      else {
     
        
        // select된 이미지들 FragColor값 변경
        if (vHighlight > 2.0 &&
           (gl_PointCoord.x < x0 + borderW ||
            gl_PointCoord.x > x1 - borderW ||
            gl_PointCoord.y < y0 + borderW ||
            gl_PointCoord.y > y1 - borderW)) {
			      
          
        } else {

          // get the x and y positions to sample for this cell's texture
          float x = center ? gl_PointCoord.x - x0 : gl_PointCoord.x;
          float y = center ? gl_PointCoord.y - y0 : gl_PointCoord.y;

          // x와 y 위치를 텍스처의 크기로 조정
          vec2 uv = vOffset + vec2(x, y) * big;

          // set variables consumed by fragment tree below
          vec2 scaledUv = isLod ? uv/lodAtlasPxPerSide : uv/cellAtlasPxPerSide;
          
          int textureIndex = isLod ? -1 : int(vTextureIndex);

          // target to be replaced by texture tree
          TEXTURE_LOOKUP_TREE

		  gl_FragColor = mix(gl_FragColor, vec4(0.0), 1.0-vOpacity);


		  if(actionstart>0.5){

			if(vActionState>0.5){
				gl_FragColor.a = 1.0;
			}else{
				gl_FragColor.a = 0.3;
			}

		  }else{
          	gl_FragColor.a = 1.0;
		  }

        }
        
        
      
      }
      
      
      		
		
    }
    


	
`;


var BloomVertexShader = `
	
	precision mediump float;
	
	uniform float scale;
    uniform float scaleTarget;
    uniform float transitionPercent;
    uniform float scaleTransitionPercent;
    uniform float borderWidth;
    uniform float delay;
	
	
	attribute vec3 pos0;
	attribute vec3 pos1;          // x y z position to which we're transitioning
	attribute vec2 offset;
	attribute float textureIndex; // index of an instance's texture among all textures
	attribute vec3 color;         // unique color for cell; used for raycasting
    attribute float width;        // px width of cell in lod texture
    attribute float height;       // px height of cell in lod texture
    attribute float opacity;      // opacity value for cell
    attribute float selected;     // 1 if the cell is selected else 0
    attribute float highlight;   //하이라이트
    attribute float isvideo;
   
    
	varying vec3 vColor;          // cell color
    varying float vWidth;         // px width of cell in lod texture
    varying float vHeight;        // px height of cell in lod texture
    varying float vOpacity;       // cell opacity
    varying float vSelected;      // 1 if this cell is selected else 0
    varying float vTextureIndex;  // cell texture idx (varyings can't be int)
	varying vec2 vOffset;
	varying float vborderWidth;
	varying float vHighlight;
	varying float vIsVideo;
	varying vec3 vfragNrm;
	varying vec3 vfragWorldPos;
	void main() {

		vTextureIndex = textureIndex;
		vColor = color;
	    vWidth = width;
	    vHeight = height;
	    vOffset = offset;
	    vOpacity = opacity;
	    vSelected = selected;
      	vborderWidth = borderWidth;
      	vHighlight = highlight;
      	vIsVideo = isvideo;
	  
	  	
	  
      vfragNrm = (normalMatrix*normal).xyz;
      vfragWorldPos = (modelViewMatrix * vec4(pos1,1.0)).xyz;
      // determine how far this point has proceeded in its transition
      float delayX = (pos1.x + 1.0) / 2.0;
      float delayY = (position.y + 1.0) / 2.0;
      // pos0 has domains -1:1, so the delay sum above is <= 2.0
      float d = ((delayX + delayY) / 2.0) * delay;

      float percent = clamp(transitionPercent - d, 0.0, 1.0);

      // set point position as a mixture between the position + target
      vec3 pos = mix(position, pos1, smoothstep(0., 1., percent));
      
	  vec4 world = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * world;
		
	  float s = mix(scale, scaleTarget, percent);
      float pointSize = s / -world.z;
		
	if (selected > 0.5) {
	        gl_PointSize = pointSize + (pointSize * borderWidth);
      } else {
        gl_PointSize = pointSize;
      }

		
		
		
	}
`;

var BloomFragmentShader = `
	precision mediump float;
	

	
	varying float vborderWidth;
	varying vec3 vColor;         // cell's color (for gpu picking)
    varying vec2 vOffset;        // cell's offset in px from left, top of tex
    varying float vWidth;        // cell's width in lod tex in px
    varying float vHeight;       // cell's height in lod tex in px
    varying float vOpacity;      // cell's opacity
    varying float vSelected;     // cell's presence (>0.5) or absence (<0.5) from selection
    varying float vTextureIndex; // cell's texture index
	varying float vHighlight;
	varying float vIsVideo;
	varying vec3 vfragNrm;
	varying vec3 vfragWorldPos;
	
	
	


    void main() {
      gl_FragColor = vec4(0.0, 0.5, 1.0, 1.0); // R, G, B, A
      		
		
    }
    


	
`;



var lassoVertexShader = `
	 precision mediump float;


    attribute float length;

    varying float vLength;

    void main() {
      vLength = length;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;
    }

`
	
	
var lassoFragmentShader =`
	  precision mediump float;


    uniform bool render;
    uniform float time;

    varying float vLength;

    void main() {
      if (!render) discard;
      float dashSize = cameraPosition.z / 100.0;
      float gapSize = dashSize * 0.4;
      if (mod(vLength + time, dashSize + gapSize) > dashSize) discard;
      gl_FragColor = vec4(0.9, 0.9, 0.9, 1.0);
    }
	
	
	`
	
	
var sphereVertexShader =`
		varying float y;
		varying vec2 vUv;
		
		void main(){
		vUv = uv;

		gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
		}
	`
	
	
var sphereFragmentShader =`
	uniform vec3 top;
uniform vec3 bottom;
uniform float threshold;
uniform sampler2D sphereTexture;

varying vec2 vUv;


void main(){

	  gl_FragColor = texture2D(sphereTexture,vUv);
	  //gl_FragColor = vec4(0,0,0,1.0);

}
	`
	

	
	
	
var videoVertexshader =`
	uniform sampler2d map;
	
	uniform float width;
	uniform float height;
	uniform float nearClipping,farClipping;
	
	uniform float pointSize;
	uniform float zOffset;
	
	varying vec2 vUv;
	
	const float XtoZ = 1.11146;
	const float YtoZ = 0.83359;
	
	void main() {

				vUv = vec2( position.x / width, position.y / height );

				vec4 color = texture2D( map, vUv );
				float depth = ( color.r + color.g + color.b ) / 3.0;

				// Projection code by @kcmic

				float z = ( 1.0 - depth ) * (farClipping - nearClipping) + nearClipping;

				vec4 pos = vec4(
					( position.x / width - 0.5 ) * z * XtoZ,
					( position.y / height - 0.5 ) * z * YtoZ,
					- z + zOffset,
					1.0);

				gl_PointSize = pointSize;
				gl_Position = projectionMatrix * modelViewMatrix * pos;

			}
	
	
	
	`
	
	
var videoFragmentshader =`
		uniform sampler2D map;



			void main() {

				vec4 color = texture2D( map, vUv );
				gl_FragColor = vec4( color.r, color.g, color.b, 0.2 );

			}
	
	`
	
	

var textVertexshader = `
			
			attribute vec2 textuv;
			
			varying vec2 vTextuv;
			
			uniform float visible;
			
			void main() {
				if(int(visible) ==1){
				
				vTextuv = textuv;
				
				 vec4 world = modelViewMatrix * vec4(position, 1.0);
			     gl_PointSize = 2.0 * (40.0/-world.z) ;
				//gl_PointSize = 100.0
				gl_Position = projectionMatrix * world;
				}


			}
`

var textFragementshader = `
	
			uniform float width;
			uniform float height;
			uniform sampler2D textures;
			uniform float visible;
			
			varying vec2 vTextuv;

			void main() {
				if(int(visible) ==1){
				float w = width;
				float h = height;
				
				
				
				float big = max(w, h);
				
				
				
				float x0 = (big-w)/2.0/big;
				float x1 = (w/big)+x0;
				
				float y0 = (big-h)/2.0/big;
				float y1 = (h/big)+y0;
				
				// 셀을 자르고 x 축의 중심에 텍스처를 배치
			    if (h > w && (gl_PointCoord.x < x0 || gl_PointCoord.x > x1)) discard;
			
			    // 이 셀의 이미지가 가로 클립 하단 마진 인 경우
			    else if (w > h && gl_PointCoord.y < y0 || gl_PointCoord.y > y1) discard;
				
				float x = gl_PointCoord.x - x0 ;
		        float y = gl_PointCoord.y - y0 ;
		
		         // x와 y 위치를 텍스처의 크기로 조정
		        vec2 uv = vTextuv + vec2(x+0.008, y+0.008) * big;
				vec2 scaled = uv/8192.0;
				
				//if(gl_PointCoord.x > 0.03 ) discard;
				//if(gl_PointCoord.y>0.01) discard;
				

				gl_FragColor = texture2D(textures,scaled);
				}
			}
`
	
	
var text1Vertexshader = `

	 varying vec2 vUv;
		
		void main() {


			vUv = uv;
			gl_Position =   projectionMatrix *  modelViewMatrix * vec4(position,1.0);


		}
`

var text1Fragementshader = `

		
		uniform sampler2D textures;
		
		varying vec2 vUv;
		
		void main() {
			
			
			
			
			gl_FragColor = texture2D(textures, vUv);

		}
`


var bloomshader = `

		
	varying vec2 vUv;

			void main() {

				vUv = uv;

				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

			}
`


var bloomfragshader = `

		
		uniform sampler2D baseTexture;
			uniform sampler2D bloomTexture;

			varying vec2 vUv;

			void main() {

				gl_FragColor = ( texture2D( baseTexture, vUv ) + vec4( 1.0 ) * texture2D( bloomTexture, vUv ) );

			}
`

var finalshader = `
			varying vec2 vUv;

			void main() {

				vUv = uv;

				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

			}
`
var finalfragmentshader = `
			uniform sampler2D baseTexture;
			uniform sampler2D bloomTexture;

			varying vec2 vUv;

			void main() {

				gl_FragColor = ( texture2D( baseTexture, vUv ) + vec4( 1.0 ) * texture2D( bloomTexture, vUv ) );

			}
`


var boxvertexshader =`
	precision mediump float;
	attribute float highlight;
	attribute float width;
	attribute float height;
	
	varying float vHighlight;
	varying float vWidth;
	varying float vHeight;


	void main() {
	  
	  vHighlight = highlight;
	  vWidth = width;
	  vHeight = height;

	


		if (highlight > 0.5){
			vec4 world = modelViewMatrix * vec4(position, 1.0);
			gl_Position = projectionMatrix * world;
				
			
			float pointSize =   1.25/-world.z;
			
			gl_PointSize = pointSize;
		}

  }
`

var boxfragmentshader =`
	
	precision mediump float;

	uniform float time;
  	

	varying float vHighlight;
	varying float vWidth;
	varying float vHeight;


	void main() {
	
		float w = vWidth;
		float h = vHeight;

		float big = max(w,h);

		float x0 = (big-w)/2.0/big;
		float x1 = (w/big)+x0;

		float y0 = (big-h)/2.0/big ;
        float y1 =  (h/big)+y0 ;

		if (h > w && (gl_PointCoord.x < x0 || gl_PointCoord.x > x1)) discard;

		else if (w > h && gl_PointCoord.y < y0 || gl_PointCoord.y > y1) discard;


		gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0); // R, G, B, A
		
	
   
  }

`