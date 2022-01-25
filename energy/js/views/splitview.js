define (['backbone', 'splitter'], function(Backbone) {

return Backbone.View.extend({
	
	initialize: function(options) {
		this.leftView  = options.leftView;
		this.rightView = options.rightView;
		this.position = options.position || '20%';
		this.initHeight = options.height || 500;
	},
    
	render: function() {
		this.$el.html('<div class="left-view"></div><div class="right-view"><div>').css("height",this.initHeight);
		var that = this;
		$('#splitter').split({
			orientation: 'vertical',
			limit: 10,
			position: this.position, // if there is no percentage it interpret it as pixels
			onDragEnd: function() {that.leftView.trigger('parent.resize'); that.rightView.trigger('parent.resize');}
		});
		this.leftView.setElement(this.$(".left-view")).render();
		this.rightView.setElement(this.$(".right-view")).render();
	},

	setHeight: function(height)
	{
		this.$el.height(height);
		this.leftView.trigger('parent.resize'); 
		this.rightView.trigger('parent.resize');
	}	
});
});