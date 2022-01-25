define(['backbone'], function(Backbone) {
  	return Backbone.Model.extend({
  		defaults: {
  				filteractive: false,
  				filter : {
	  				name: '',
	  				owner: '',
	  				developer: '',
	  				purchaser: '',
	  				manufacturer: '',
	  				parameters: []
  				},
  				
  				//filteritems: false,
				//filtername: "",
				//filterowner: "",
				//filterdeveloper: "",
				//filterpurchaser: "",
				//filtermanufacturer: "",
				//filterparameters: [],
				searchid: null,
				//controls : {
				//	fitbounds: 0,
				//	newitem: 0
				//},
				controlfit: 0,   // number of times "Fit to Bounds" button has been pressed
				controlnew: 0,   // number of times "New" button has been pressed
				filterresults: {
					facilities:null, 
					units:null, 
					capacity:null
				},
				fetchcompleted: false
	  	},
	  	
	  	increment: function(name)
	  	{
		  	this.set(name,this.get(name)+1);
	  	}
  });
});