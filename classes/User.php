<?php

namespace CrossRiver;

class User {
  private $logged_in=false;
  private $slimApp=null;
  private $id=0;
  private $idclient=0;
	private $name;
	private $username;
	private $email;
	private $created_at;
	private $updated_at;
	private $user_type;
	private $admin;
	const SALT_LENGTH = 30;

	static function CreateUser($connection, $arr)
	{
		$retval = false;

 		$salt = User::make_salt($arr["password"]);
 		
 		$encrypted_password = User::encrypt_password($arr["password"], $salt);
	  	  
 		$stmt = $connection->prepare("INSERT INTO users (name, idclient, username, email, encrypted_password, created_at, updated_at, salt) VALUES (? , ?, ?, ? , ? , NOW() , NOW() , ?)");
	  
 		$stmt->bind_param("sissss", $arr["name"], $arr['idclient'], $arr['username'], $arr["email"], $encrypted_password, $salt);
	  
 		try {
		  $stmt->execute();
		  $retval = mysqli_insert_id($connection);
		}
  		catch (Exception $e){
					//dbg($e->getMessage());
		}
		
		$stmt->close();
		return $retval;
	}
	
	static function UpdateUser($connection, $arr)
	{
		$retval = $arr["id"];
	  
		if ($arr["password"]!="")
		{
	  	$salt = User::make_salt($arr["password"]);
	  	$encrypted_password = User::encrypt_password($arr["password"], $salt);
	  
	  	$stmt = $connection->prepare("UPDATE users SET username=?, name=?, email=?, encrypted_password=?, updated_at=NOW(), salt=? WHERE id=?");
	  
	  	$stmt->bind_param("sssssi", $arr['username'], $arr["name"], $arr["email"], $encrypted_password, $salt, $arr["id"]);
	  }
	  else
	  {
	  	$stmt = $connection->prepare("UPDATE users SET username=?, name=?, email=?, updated_at=NOW() WHERE id=?");
	  
	  	$stmt->bind_param("sssi", $arr['username'], $arr["name"], $arr["email"], $arr["id"]);
	  }
	  
	  try {
	  	$stmt->execute();
	  }
		catch (Exception $e){
			//dbg($e->getMessage());
			$retval=false;
		}
		$stmt->close();
		return $retval;
	}
		
	function __construct($connection,$slimApp=null) {
		$this->slimApp = $slimApp;
		if ($slimApp!=null && $slimApp->request()->params("logout")=="1") {
			$slimApp->setCookie("uid","",time()-3600);
			$this->logged_in=false;
			return;
		}
		if ($this->authenticateWithUserNameAndPassword($connection, isset($_POST['login']) ? $_POST['login'] : 0, isset($_POST["username"]) ? $_POST["username"] : "", isset($_POST["password"]) ? $_POST["password"] : ""))
			return;
		return ($this->authenticateWithCookie($connection, $slimApp==null ? $_COOKIE : $slimApp->request()->cookies()));
	}
	
  function isAdmin() {
  	return ($this->admin == 1) ? true : false;
  }
  function isLoggedIn() {
    return $this->logged_in;
  }
  function getId() {
    return $this->id;
  }
  function getClient() {
    return $this->idclient;
  }
  function getUserName() {
  	return $this->username;
  }
  function getName() {
    return $this->name;
  }
  function getEmail() {
    return $this->email;
  }
  function getCreatedAt() {
    return $this->created_at;
  }
  function getUpdatedAt() {
    return $this->updated_at;
  }
  function getUserType() {
    return $this->user_type;
  }
  
  static public function make_salt($password)
  {
  	return hash('sha256',$password.uniqid(rand(), true));
  }
  
  static public function encrypt_password($password,$salt)
  {
  	return hash('sha256',$salt.$password);
  }
 
  private function authenticateWithCookie($connection, $cookie)
  {
  	$this->logged_in=false;
  	if (isset($cookie) && isset($cookie['uid']))
  	{
  		$id_hash = explode("-",$cookie['uid']);
  		
  		if (sizeof($id_hash) < 2)
  		  return false;
  		
   	  $stmt = $connection->prepare("SELECT id, idclient, username, name, email, created_at, updated_at, salt, admin FROM users WHERE id=?");
	    $stmt->bind_param("i", $id_hash[0]);
    	try {
    		$stmt->execute();
				$stmt->bind_result($this->id, $this->idclient, $this->username, $this->name, $this->email, $this->created_at, $this->updated_at, $salt, $this->admin);
				$stmt->fetch();  	
				if (hash('sha256',$id_hash[0].$salt) == $id_hash[1]) {	
  		  	   $this->logged_in=true;
				}
   	  }
  	  catch (Exception $e) {
  		   //dbg($e->getMessage());
  	  }
  	  $stmt->close();
	  }
  	return $this->logged_in;
  }

  private function authenticateWithUserNameAndPassword($connection, $login, $username, $password)
  {
  	$this->logged_in=false;
  	if (!isset($username) || !isset($password) || !isset($login))
  		return false;
  
  	$stmt = $connection->prepare("SELECT id, idclient, username, email, name, encrypted_password, created_at, updated_at, salt, admin FROM users WHERE username=?");
	  $stmt->bind_param("s", $username);
  	$this->logged_in=true;
  	
  	try {
  		$stmt->execute();
  		$stmt->bind_result($this->id, $this->idclient, $this->username, $this->email, $this->name, $encrypted_password, $this->created_at, $this->updated_at, $salt, $this->admin);
  		$stmt->fetch();
  		if ($encrypted_password == hash('sha256',$salt.$password)) {
	  		if ($this->slimApp!=null)
	  			$this->slimApp->setCookie("uid",$this->id."-".hash('sha256',$this->id.$salt),time()+3600*24*365);
	  		else
	  			setcookie("uid",$this->id."-".hash('sha256',$this->id.$salt),time()+3600*24*365);  		
  		}
  		else
  		  $this->logged_in=false;
   	}
  	catch (Exception $e) {
  		//dbg($e->getMessage());
  		$this->logged_in=false;
  	}
  	
  	$stmt->close();
  	return $this->logged_in;
  } 
};


?>