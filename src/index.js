var TIMEOUT = 3000; //5000;

function _console(msg){
	window.console && window.console.log(msg);
}

function Position(opts){
	this.opts = opts;
	this.timeout = opts.timeout || TIMEOUT;
}

Position.prototype.getPosition = function(){
	var isPositionReady = false;
	var _timeoutHandler = setTimeout(function(){
    	if(!isPositionReady){
    		$(document).triggerHandler("timeout.position");
    	}
    },this.timeout + 1000);
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
	        timeout: me.timeout,
	        // 最长有效期，在重复获取地理位置时，此参数指定多久再次获取位置。
	        maximumAge: 3000
	    });
	}else{
		clearTimeout(_timeoutHandler);
	    $(document).triggerHandler("nonsupport.position");
	}
}

Position.prototype._locationSuccess = function(position){
	_console(position);
	$(document).triggerHandler("success.position",position);
};

Position.prototype._locationError = function(error){
	_console(error);
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
	if(!bObj.lat || !bObj.lng) return;
	var mtype = type === "baidu" ? "bd09ll" : "wgs84ll";
	var url = "http://api.map.baidu.com/geocoder/v2/?ak=" + (this.opts.ak || "") + "&coordtype=" + mtype + "&location=" + bObj.lat + "," + bObj.lng + "&output=json&callback=?";
    $.getJSON(url,function( rs ){
    	callback && callback(rs.result);
    });
};


Position.prototype.getCity = function(successfunc,failfunc){
	var me = this;
	$.getJSON("http://ws.qunar.com/ips.jcp?callback=?",function(data){
		var city = data.city;
		if(!city){ 
			failfunc && failfunc();
			$(document).triggerHandler("loadCityFail.position");
			return;
		}
		$.getJSON("http://api.map.baidu.com/geocoder/v2/?address=" + encodeURIComponent(city) + "&output=json&ak=" + (me.opts.ak || "") + "&callback=?",function(data){
			var obj = {
				city : city,
				location : data && data.result && data.result.location || false
			}
			_console(obj);
			successfunc && successfunc(obj);
			$(document).triggerHandler(obj.location ? "loadCitySuccessWithLocation.position" : "loadCitySuccessWithoutLocation" , obj);
		});
	});
}

module.exports = Position;