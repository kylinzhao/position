##0.0.1

>基于geoLoaction获取地理信息，推荐使用类似jQuery的事件体系绑定事件
成功回调
* success.position

>支持四种错误事件
* timeout.position 超时，可自定义
* reject.position 用户点击了拒绝定位
* failure.position 定位失败
* nonsupport.position 设备不支持定位

>三种API
* loadPosition 获取设备经纬度
* loadCity 获取设备所属城市（根据IP获取城市名称以及城市中心点经纬度（依赖百度api，需要初始化时传入ak信息））
* loadAddress 获取设备所在的具体位置（依赖百度api，需要初始化时传入ak信息）