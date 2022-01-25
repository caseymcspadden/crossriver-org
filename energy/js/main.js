require (['collections/windfarms', 'models/mapstate', 'views/editfarm', 'views/mapview', 'views/filter', 'views/mapcontrols', 'views/splitview'],
function(WindFarms, MapState, EditFarm, MapView, FilterView, ControlsView, SplitView) {

$(function() {

	window.App = {
  	  Models: {},
	  Collections: {},
	  Views: {}
	};

	var height = $(window).height();

	var windfarms = new WindFarms();
	var mapstate = new MapState();
	
	//var filterview = new FilterView({mapState:mapstate});
	var mapview = new MapView({el:"#main-view", collection: windfarms, mapState:mapstate});
	mapview.render();
	
	//var splitView = new SplitView({el:"#splitter", height:height, leftView: filterview, rightView: mapview});
	//splitView.render();
	windfarms.fetch();
	
	windfarms.fetch({reset:false,success:function() {mapstate.set("fetchcompleted",true);}});

	
	$(window).resize(function(e) {
		mapview.resize();
	});

	//splitView.setHeight(height-80);
	
	
	/*

	$(window).resize(function(e) {
		splitView.setHeight($(window).height());
	});
	
	$('div.body,#CRBody').width($(window).width()-80);
	//$('#gridbody').css('height',''+($(window).height()-220)+'px');
	$('#gridbody').height($(window).height()-220);
	
	$(window).resize(function() {
		$('div.body,#CRBody').width($(window).width()-80);
		$('#gridbody').height($(window).height()-220);
	});
	*/
	
	
	
});
});
