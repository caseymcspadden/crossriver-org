var app = app || {};

require.config({
    baseUrl: "js",
    paths: {
	    'underscore' : 'lib/underscore-min',
	    'jquery' : 'lib/jquery',
	    'backbone' : 'lib/backbone-min',
	    'marionette' : 'lib.backbone.marionette.min'
    }
    shim: {
        'underscore': {
            exports: '_'
        },
        'backbone': {
            deps: ['underscore', 'jquery'],
            exports: 'Backbone'
        }
        'marionette': {
            deps: ['backbone'],
            exports: 'Marionette'
        }
    },
});


var ENTER_KEY = 13;

require(['jquery'], function($) {

	$(function() {

    	// Kick things off by creating the **App**.
		new app.AppView();

	});
});