var TIMEOUT = 3000; //5000;
var jqTrigger = window.$ && $(document) && $(document).triggerHandler || function(){};

// 名词解释
// WGS-84
//
//

function _console(msg){
	window.console && window.console.log(msg);
}

function mergeData(obj,newObj){
	for(var key in newObj){
		if(newObj[key]){
			obj[key] = newObj[key];
		}
	}
}

function Position(opts){
	this.opts = opts;
	this.timeout = opts.timeout || TIMEOUT;
	this.ak = this.opts.ak || "";
}

Position.prototype.getPosition = function(success,fail){
	var geo = {};
	var me = this;
	this.getLatLng({
		success : function(position){
			if(position && position.coords){
				geo.coords = position.coords;
				geo.lat = geo.coords.latitude;
				geo.lng = geo.coords.longitude;
				me.getAddress(geo,function(data){
					geo.formatted_address = data.formatted_address;
					var _address = data.addressComponent;
					mergeData(geo,_address);
					success && success(geo);
				},"gps");
			}else{
				this.getCity(function(data){
					mergeData(geo,data);
					fail && fail(geo);
				});
			}
		},
		fail : function(error){
			geo.error = error;
			geo.errorType = error.code;
			me.getCity(function(data){
				mergeData(geo,data);
				fail && fail(geo);
			});
		}
	});
}

Position.prototype.getLatLng = function(opts){
	var isPositionReady = false;
	var _timeoutHandler = setTimeout(function(){
    	if(!isPositionReady){
    		opts.timeout && opts.timeout();
    		jqTrigger("timeout.position");
    	}
    },this.timeout + 1000);
	if (navigator.geolocation) {
		var me = this;
	    navigator.geolocation.getCurrentPosition(function(data){
	    	isPositionReady = true;
	    	clearTimeout(_timeoutHandler);
	    	me._locationSuccess(data,opts.success);
	    }, function(error){
	    	clearTimeout(_timeoutHandler);
	    	me._locationError(error,opts);
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
		opts.timeout && opts.timeout();
	    jqTrigger("nonsupport.position");
	}
}

Position.prototype._locationSuccess = function(position,success){
	_console(position);
	success && success(position);
	jqTrigger("success.position",position);
};

Position.prototype._locationError = function(error,opts){
	_console(error);
	switch(error.code){
		case error.TIMEOUT :
			opts.timeout && opts.timeout();
			jqTrigger("timeout.position");
			break;
		case error.PERMISSION_DENIED :
			opts.reject && opts.reject();
			jqTrigger("reject.position");
			break;
		case error.POSITION_UNAVAILABLE :
			opts.unavilable && opts.unavilable();
			jqTrigger("failure.position");
			break;
	}
	opts.fail && opts.fail(error)
};

Position.prototype.getAddress = function(obj,callback,type){
	var bObj = obj;
	if(!bObj.lat || !bObj.lng) return;
	var mtype = type === "baidu" ? "bd09ll" : "wgs84ll";
	var url = "http://api.map.baidu.com/geocoder/v2/";
    var params = {
    	ak : this.ak,
    	coordtype : mtype,
    	location : bObj.lat + "," + bObj.lng,
    	output : 'json'
    };
    getJSON(url, params ,function( rs ){
    	callback && callback(rs.result);
    });
};


Position.prototype.getCity = function(successfunc,failfunc){
	var me = this;
	getJSON("http://ws.qunar.com/ips.jcp",{},function(data){
		var city = data.city;
		if(!city){ 
			failfunc && failfunc();
			jqTrigger("loadCityFail.position");
			return;
		}
		var params = {
			address : encodeURIComponent(city),
			output : 'json',
			ak : me.ak
		}
		getJSON("http://api.map.baidu.com/geocoder/v2/",params,function(data){
			var location = data && data.result && data.result.location || false;
			var obj = {
				city : city
			}
			if(location.lat && location.lng){
				obj.lat = location.lat;
				obj.lng = location.lng;
			}
			successfunc && successfunc(obj);
			jqTrigger(obj.location ? "loadCitySuccessWithLocation.position" : "loadCitySuccessWithoutLocation" , obj);
		});
	});
}


var getJSON = (function(){
	
	var seqIndex = 0,
		callbackName = "callback";

	return function(url, params , cb, callback){

		var config = config || {};
		var head = document.head || document.getElementsByTagName("head")[0] || document.documentElement;
	    var request = document.createElement("script");

	    request.async = "false";
	    request.defer = "false";
	    var seq = seqIndex++;
	    var context = {};

	    context.transportType = "JSONP";
	    context.transport = request;
	    context.transportKey = "position_jsonp_" + seq;
	    var sc = cb;
	    if (undefined === window[context.transportKey]) {
	        window[context.transportKey] = function (result) {
	            sc(result);
	            if (head && request.parentNode) {
	                head.removeChild(request);
	            }
	            window[context.transportKey] = null;
	            if (!!window[context.transportKey]) {
	                delete (window[context.transportKey]);
	            }
	        };
	    }

	    request.onload = request.onreadystatechange = function () {
	        if (!request.readyState || /loaded|complete/.test(request.readyState)) {

	            if (context.timeoutId) {
	                try {
	                    clearTimeout(context.timeoutId);
	                } catch (e) {
	                }
	            }
	            request.onload = request.onreadystatechange = null;
	            request.responseText = "";
	            request = undefined;
	            context.transport = null;
	        }
	    };

	    params = (function(){
	    	var arr = [];
	    	for(var key in params){
	    		arr.push(key + "=" + params[key]);
	    	}
	    	return arr;
	    })();
	    params.push((config.callback || callbackName) + "=" + context.transportKey, "_t=" + new Date().getTime());
	    request.src = url + "?" + params.join('&');
	    if (head.firstChild) {
	        head.insertBefore(request, head.firstChild);
	    } else {
	        head.appendChild(request);
	    }
	    //settimeout  处理404等服务器错误或超时
	    config.timeout && (context.timeoutId = setTimeout(function () {
	        request.onload = request.onreadystatechange = null;
	        if (head && request.parentNode) {
	            head.removeChild(request);
	        }
	        window[context.transportKey] = null;
	        if (!!window[context.transportKey]) {
	            delete (window[context.transportKey]);
	        }
	    }, config.timeout));
	}

})();

module.exports = Position;