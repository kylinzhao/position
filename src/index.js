var TIMEOUT = 3000; //5000;

function Position(){}

Position.prototype.getPosition = function(){
	var isPositionReady = false;
	var _timeoutHandler = setTimeout(function(){
    	if(!isPositionReady){
    		$(document).triggerHandler("timeout.position");

    	}
    },TIMEOUT + 1000);

	if (navigator.geolocation) {
		var me = this;
	    navigator.geolocation.getCurrentPosition(function(data){
	    	isPositionReady = true;
	    	clearTimeout(_timeoutHandler);
	    	me._locationSuccess(data);
	    }, function(error){
	    	clearTimeout(_timeoutHandler);
	    	me._locationError(error);
	    },{
	        // 指示浏览器获取高精度的位置，默认为false
	        enableHighAcuracy: true,
	        // 指定获取地理位置的超时时间，默认不限时，单位为毫秒
	        timeout: TIMEOUT,
	        // 最长有效期，在重复获取地理位置时，此参数指定多久再次获取位置。
	        maximumAge: 3000
	    });
	}else{
		clearTimeout(_timeoutHandler);
	    $(document).triggerHandler("nonsupport.position");
	}
}

Position.prototype._locationSuccess = function(position){
	$(document).triggerHandler("success.position",position);
};

Position.prototype._locationError = function(error){

	switch(error.code){
		case error.TIMEOUT :
			$(document).triggerHandler("timeout.position");
			break;
		case error.PERMISSION_DENIED :
			$(document).triggerHandler("reject.position");
			break;
		case error.POSITION_UNAVAILABLE :
			$(document).triggerHandler("failure.position");
			break;
	}

};

Position.prototype.getAddress = function(obj,callback,type){
	var bObj = obj;
	var mtype = type === "baidu" ? "bd09ll" : "wgs84ll";
	var url = "http://api.map.baidu.com/geocoder/v2/?ak=236224cbc9d5fda0c8ecb7307239052e&coordtype=" + mtype + "&location=" + bObj.lat + "," + bObj.lng + "&output=json&callback=?";
    $.getJSON(url,function( rs ){
    	callback && callback(rs.result);
    });
};

module.exports = Position;