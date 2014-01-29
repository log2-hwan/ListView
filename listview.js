"use strict"
var ListView = function(url,noresult,data) {
	var _this = this;
	$.get(url,function(html) {
		_this.html = html;
		if(_this.renderReady) {
			_this.renderTo.apply(_this,_this.renderReady);
			_this.renderReady = null;
		}
	});
	this.renderReady = null;
	this.data = data;
	this.currentSelector = '';
	this.scrolling = false;
	this.noresultText = noresult;
	this.events = {};
	return this;
};

ListView.prototype._emit = function(type,data) {
	if(!this.events[type]) return;
	
	var _this = this;
	this.events[type].forEach(function(listener) {
		listener.call(_this,data);
	});
};

ListView.prototype.on = function(type,cb) {
	if(!this.events[type]) this.events[type] = [];
	
	this.events[type].push(cb);
};

ListView.prototype.off = function(type,cb) {
	if(cb) this.events[type].splice(cb);
	else this.events[type] = [];
};

ListView.prototype.setTappables = function(selectors) {
	this.tappables = selectors;
};

ListView.prototype.addItem = function(el) {
	var _this = this;
	this.data = DOF2.Data.getList(this.dataKey);
	$(_this.currentSelector).find('.noresult').remove();
	var html = _this.html;
	for(var prop in el)
		html = html.replace(new RegExp('{{'+prop+'}}','g'),el[prop]);
	html = html.replace(/{{\$index}}/g,(parseInt(_this.itemLength)+1));
	var node = $(html).appendTo(_this.currentSelector);
	node.css('-webkit-transform','translateY('+_this.itemLength*_this.itemHeight+'px)');
	if(this.tappables) {
		this.tappables.forEach(function(sel) {
			var selected = (sel=='this')?node:node.find(sel);
			selected.tap(function(e) {
				if(_this.scrolling) return;
				_this._emit('tap:'+sel,{node:node,data:el});
			});
		});
	}
	_this.itemLength++;
	$(_this.currentSelector).css('height',(_this.itemLength+1)*_this.itemHeight+'px').parent().jScroll("remove").jScroll(this.scrollable);
	this._emit('renderItem',{node:node,data:el});
	this._emit('change',{});
	
	return node;
};

ListView.prototype.removeItem = function(i) {
	console.log('remove '+i);
	$(this.currentSelector).children().eq(i).remove();
	this.itemLength--;
	this.data.splice(i,1);
	this.reposition();
	
	if(!this.itemLength)
		$(this.currentSelector).html('<li class="noresult">'+this.noresultText+'</li>').parent().jScroll("remove");
	
	this._emit('change',{});
};

ListView.prototype.reposition = function() {
	var _this = this;
	$(this.currentSelector).children().each(function(i) {
		$(this).css('-webkit-transform','translateY('+i*_this.itemHeight+'px)');
	});
	$(this.currentSelector).css('height',(this.itemLength+1)*this.itemHeight+'px').parent().jScroll("refresh");
};

ListView.prototype.render = function(config) {
	this.scrollable = config.scrollable;
	this.itemHeight = config.itemHeight;

	if(!this.html) {
		this.renderReady = arguments;
		return;
	}
	var _this = this;
	
	$(config.selector+' li').remove();
	this.itemLength = 0;
	this.currentSelector = config.selector;
	this.scrollable.onScrollMove = function() { _this.scrolling = true; };
	this.scrollable.onScrollEnd = function() { _this.scrolling = false; };
	if(this.data&&this.data.length>0) {
		this.data.forEach(function(el,i) {
			_this.addItem(el);
		});	
		if(this.scrollable) {
			setTimeout(function() {
				$(_this.currentSelector).parent().jScroll("remove").jScroll(_this.scrollable);
			},100)
		}
	} else {
		$(_this.currentSelector).html('<li class="noresult">'+this.noresultText+'</li>');
	}
	
	this._emit('renderComplete',{});
};