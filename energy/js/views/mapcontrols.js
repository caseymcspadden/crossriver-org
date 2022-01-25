define (['underscore', 'backbone', 'text!templates/mapcontrols.html', 'jqueryui'], function(_, Backbone, ControlsTemplate) {

return Backbone.View.extend({
  events:{
  	"click .map-search": "clearSearch",
  	"click .map-dosearch": "mapSearch",
	},

	initialize: function(options) {
		this.template = _.template(ControlsTemplate);
		this.mapState = options.mapState
		//this.mapView = options.mapView;
		this.searchItem = null;
	  this.listenTo(this.mapState, "change:filterresults", this.showFilterResults);	  
	},
    
  render: function() {
    	this.$el.html(this.template()); //   this.model.attributes));
      var that = this;
			this.$(".map-search" ).autocomplete({
      source: function( request, response ) {
        $.ajax({
          url: "/public/windfarms?namesonly",
          dataType: "json",
          appendTo: this.$el,
          data: {
            term: request.term
          },
          success: function( data ) {
            response( $.map( data, function( item ) {
              return {
                label: item.name,
                value: item.name,
                id: item.id
              }
            }));
          }
        });
      },
      minLength: 3,
      delay:500,
      select: function( event, ui ) {
				that.searchItem = ui.item;
      }
    });
    	
    return this;
	},
	
	showFilterResults: function() {
		var r = this.mapState.get("filterresults");
		if (!r.facilities)
			this.$('.map-summary').html("");
		else
			this.$('.map-summary').html("Facilities: " + r.facilities + ", Units: " + r.units + ", Capacity: " + Math.round(r.capacity*100)/100 + " MW");
	},
	
	clearSearch: function(e) {
		e.target.value = "";
	},
	
	/*
	fitBounds: function(e) {
		this.mapState.increment("controlfit");
		e.preventDefault();
	},
	
	newItem: function(e) {
		this.mapState.increment("controlnew");
		e.preventDefault();
	},
	
	showFilter: function(e) {
		var show = this.mapState.get("filteractive")
		this.$(".map-filtershow").toggleClass("checked").html(show ? "Show Filter" : "Hide Filter");
		this.mapState.set("filteractive", !show);
		e.preventDefault();
	},
	*/
	
	mapSearch: function(e) {
		if (this.searchItem!=null)
			this.mapState.set("searchid",this.searchItem.id);
			//this.mapView.search(this.searchItem.id);
		e.preventDefault();
	}
	
});
});