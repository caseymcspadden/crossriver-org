<?php
require_once 'Slim/Slim.php';
require_once 'Twig/Autoloader.php';

\Slim\Slim::registerAutoloader();
Twig_Autoloader::register();
$loader = new Twig_Loader_String();
$twig = new Twig_Environment($loader);

require_once 'Slim/Slim-Extras/Log/DateTimeFileWriter.php';
require_once 'Slim/Slim-Extras/Views/Twig.php';
require_once 'classes/User.php';
require_once 'classes/Services.php';
require_once 'classes/Astronomy.php';
require_once 'classes/api.php';

$app = new \Slim\Slim(array(
    'mode' => 'development',
    'log.writer' => new \Slim\Extras\Log\DateTimeFileWriter(array('path' => './logs')),
    'view' => new \Slim\Extras\Views\Twig(),
    'log.enable' => true,
    'debug' => true
    ));
 
$conn = new mysqli("localhost", "user828", "1TyvH6q73oKEBIIN", "crossri2_admin");
$conn->set_charset("utf8"); 

$user = new \CrossRiver\User($conn,$app);

//$response = $app->response();

$options = array(
	//'docroot' => pathinfo($_SERVER['SCRIPT_NAME'],PATHINFO_DIRNAME),
	'docroot' => '',
	'app' => $app,
	'connection' => $conn,
	'user' => $user,
	'topmenu' => ''
);


$authenticate = function($options) {
    return function () use ( $options ) {
        if (!$options['user']->isLoggedIn()) {
            $options['app']->flash('error', 'Login required');
            $options['app']->redirect($options['docroot'].'/');
        }
    };
};


//{if (!$user->isLoggedIn()) $app->redirect($options['docroot']);}

$app->setName('Crossriver');

$app->map('/login' , function() use ($options) {
	if ($options['user']->isLoggedIn())
	{
		if ($options['user']->isAdmin())
			$options['app']->redirect($options['docroot'].'/admin');
		else
			$options['app']->redirect($options['docroot'].'/clients');
	}
	else
		 $options['app']->redirect($options['docroot'].'/');
})->via("GET","POST");

$app->get('/', function() use ($options) {
		echo $options['app']->render('home.html', $options);
	});

$app->map('/backbone/:resource+' , function($resource) use ($options) {
	echo $options['app']->render('backbone.html', $options);
})->via('GET','POST','PUT','DELETE');

$app->map('/services/:resource+' , function($resource) use ($options) {
	if ($options['user']->isLoggedIn() || $resource[0]=="credentials" || $resource[0]=="contact" || $resource[0]=="cities" || $resource[0]=="citynames")
	{
		$services = new \CrossRiver\Services($options,$resource);
		$services->process();
	}
})->via('GET','POST','PUT','DELETE');


$app->map('/astronomy/:resource+' , function($resource) use ($options) {
	$astro = new \CrossRiver\Astronomy($options,$resource);
	$astro->process();
})->via('GET','POST','PUT','DELETE');


$app->map('/public/:resource+' , function($resource) use ($options) {
	$api = new \CrossRiver\Api($options,$resource);
	$api->process();
})->via('GET','POST','PUT','DELETE');

$app->get('/clients/:route+', function($route) use($options) {
		try
		{
			if ($options['user']->getClient()==$route[0])
			{
				$options['client'] = $route[0];
				echo $options['app']->render('clients.html', $options);
			}
		}
		catch (Exception $ex)
		{
			echo $options['app']->render('home.html', $options);
		}
	});

$app->get('/:route+', function($route) use($options) {
		try
		{
			$options['topmenu'] = $route[0];
			$routestr = implode('_',$route);
			echo $options['app']->render($routestr.'.html', $options);
		}
		catch (Exception $ex)
		{
			echo $options['app']->render('home.html', $options);
		}
	});

$app->run();
$conn->close();

?>