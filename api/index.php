<?php
use \Psr\Http\Message\ServerRequestInterface as Request;
use \Psr\Http\Message\ResponseInterface as Response;

require '../vendor/autoload.php';

// Get container
$container = new \Slim\Container;
$app = new \Slim\App($container);

// Register component on container

$app->get('/test', function($request, $response, $args) {
  $arr = array('a' => 'b', 'c' => 'd');
  $response->getBody()->write(json_encode($arr));
  return $response->withHeader('Content-Type','application/json');
});

// Run app
$app->run();

?>  