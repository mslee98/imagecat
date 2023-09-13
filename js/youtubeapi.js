function youtubeAPI(){
	this.init();
	this.player = null;
	this.done = false;
	
}

youtubeAPI.prototype.init = function(){
	var tag = document.createElement('script');
	tag.src = "https://www.youtube.com/player_api";
	var firstScriptTag = document.getElementsByTagName('script')[0];
	firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}




youtubeAPI.prototype.onYouTubeIframeAPIReady = function(id){
	
	this.player = new YT.Player('selected-image-parent', {
	    height: '360',
	    width: '900',
	    videoId: id,
	    events: {
	      'onReady': this.onPlayerReady,
	      'onStateChange': this.onPlayerStateChange
	    }
	  });
	
	
}


youtubeAPI.prototype.onPlayerReady =function(event){
	event.target.playVideo();
}

youtubeAPI.prototype.stopVideo = function(){
	this.player.stopVideo();
}

youtubeAPI.prototype.onPlayerStateChange =function(event){
//	if (event.data == YT.PlayerState.PLAYING && !done) {
//	    setTimeout(stopVideo, 6000);
//	    this.done = true;
//	  }
}

