define (['underscore', 'backbone', 'text!templates/filter.html', 'jstree'], function(_, Backbone, FilterTemplate) {

return Backbone.View.extend({
  className: "filterview",
  
  events: {
	  "keyup .filter-input": "inputChanged",
	  "click .filter-input": "clearInput"
  },
    
  initialize: function(options) {
	  this.template = _.template(FilterTemplate);
	  this.mapState = options.mapState;
	  this.selected = [];
	  
	  //this.listenTo(this.mapState, "change:filterresults", this.showFilterResults);	  
	  //this.filter = {name:'', owner:'', developer:'', energy_purchaser:'', manufacturer:'', selected: []};
  },
	    
  render: function() {
    	this.$el.html(this.template({})); //   this.model.attributes));
			var tree = this.$(".filter-tree").jstree({
				core: {
					themes: {
						icons: false
					}
				},
				checkbox : {
					keep_selected_style : false
				},
				plugins : [ "checkbox" , "contextmenu"]
			}).on("changed.jstree", null, this, function(e,data) {
				e.data.selected = _.clone(data.selected);
				e.data.mapState.set("filter",e.data._get_filter());
			}).jstree(true).select_all(true);
    	return this;
	},
	
	/*
	showFilterResults: function()
	{
		var results = this.mapState.get("filterresults");
		this.$(".results-facilities").html(results.facilities);
		this.$(".results-units").html(results.units);
		this.$(".results-capacity").html(Math.round((results.capacity*100))/100);
	},
	*/
	
	clearInput: function(e)	{
		e.target.value = "";
		this.inputChanged(e);
	},
	
	inputChanged: function(e)
	{
		this.mapState.set("filter",this._get_filter());
	},
	
	_get_filter: function()
	{
		return {
			name: this.$("input[name='filtername']").val().toLowerCase(),
			owner: this.$("input[name='filterowner']").val().toLowerCase(),
			developer: this.$("input[name='filterdeveloper']").val().toLowerCase(),
			purchaser: this.$("input[name='filterpurchaser']").val().toLowerCase(),
			manufacturer: this.$("input[name='filtermanufacturer']").val().toLowerCase(),
			parameters: this.selected
		};
	}
});
});