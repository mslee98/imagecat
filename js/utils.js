var apiUrlObj = {local : "http://localhost",
				 dev : "https://www.imagecat.co.kr:8443", 
				 oper : "https://www.imagecat.co.kr:8443"};

var paramObj = {};
function params () {
	location.search.substr(1).split("&").forEach(function(item) {paramObj[item.split("=")[0]] = item.split("=")[1]});
}
