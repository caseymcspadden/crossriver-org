<?php

class User {
  private $logged_in=false;
  private $id=0;
	private $name;
	private $nickname;
	private $email;
	private $created_at;
	private $updated_at;
	private $user_attributes;
	const SALT_LENGTH = 30;
	
	static function CreateUser($connection, $arr)
	{
	  $retval = 0;

	  $salt = User::make_salt($arr["password"]);
	  
	  $encrypted_password = User::encrypt_password($arr["password"], $salt);
	  
	  $stmt = $connection->prepare("INSERT into users (name, nickname, email, encrypted_password, created_at, updated_at, salt, user_attributes) VALUES (? , ? , ? , ? , NOW() , NOW() , ? , ?)");
	  
	  $stmt->bind_param("sssssi", $arr["name"], $arr["nickname"], $arr["email"], $encrypted_password, $salt, $arr["user_attributes"]);
	  
	  try {
	  	$stmt->execute();
	  	$retval = mysqli_insert_id($connection);
	  }
		catch (Exception $e){
			dbg($e->getMessage());
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
	  
	  	$stmt = $connection->prepare("UPDATE users SET name=?, nickname=?, email=?, encrypted_password=?, updated_at=NOW(), salt=?, user_attributes=? WHERE id=?");
	  
	  	$stmt->bind_param("sssssii", $arr["name"], $arr["nickname"], $arr["email"], $encrypted_password, $salt, $arr["user_attributes"], $arr["id"]);
	  }
	  else
	  {
	  	$stmt = $connection->prepare("UPDATE users SET name=?, nickname=?, email=?, updated_at=NOW(), user_attributes=? WHERE id=?");
	  
	  	$stmt->bind_param("sssii", $arr["name"], $arr['nickname'], $arr['email'], $arr['user_attributes'], $arr['id']);
	  }
	  
	  try {
	  	$stmt->execute();
	  }
		catch (Exception $e){
			dbg($e->getMessage());
			$retval=0;
		}
		
		$stmt->close();
		return $retval;
	}
	
	static function AuthenticateWithLogin($connection, $arr)
  {
  	$ret = false;
  	if (!isset($arr['email']) || !isset($arr['password']) || !isset($arr['login']))
  		return $ret;
  
  	$result = $connection->query("SELECT id, encrypted_password, salt FROM users where email=\"$arr[email]\"");
  	if ($row = $result->fetch_assoc())
  	{
  		if ($row['encrypted_password'] == hash('sha256',$row['salt'].$arr['password']))
  			$ret = true;
  	}
  	return $ret;
  }
	
	function __construct($connection) {	
		if ($this->authenticateWithEmailAndPassword($connection, $_POST['login'], $_POST["email"], $_POST["password"]))
			return;
		else if ($this->authenticateWithKey($connection, $_GET['key']))
			return;
		return ($this->authenticateWithCookie($connection, $_COOKIE));
	}

  function isAuthenticated() {
  	return (($this->user_attributes&1) == 1) ? true : false;
  }
  function isAdmin() {
  	return (($this->user_attributes&2) == 2) ? true : false;
  }
  function isLoggedIn() {
    return $this->logged_in;
  }
  function getId() {
    return $this->id;
  }
  function getName() {
    return $this->name;
  }
  function getNickName() {
    return $this->nickname;
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
  function getUserAttributes() {
    return $this->user_attributes;
  }

  static private function make_salt($password)
  {
  	return hash('sha256',$password.uniqid(rand(), true));
	}
  
  static private function encrypt_password($password,$salt)
  {
  	return hash('sha256',$salt.$password);
  }
  
  private function authenticateWithKey($connection, $key)
  {
  	$this->logged_in=false;
  	
  	if (!isset($key))
  		return false;
  	
		$result = $connection->query("SELECT id FROM users WHERE comments=\"$key\"");
		
		$row = $result->fetch_row();
		
		if ($row==NULL)
			return false;

		$stmt = $connection->prepare("SELECT id, name, nickname, email, created_at, updated_at, salt, user_attributes FROM users WHERE id=?");
	  $stmt->bind_param("i", $row[0]);
    try {
    		$stmt->execute();
  	  	$stmt->bind_result($this->id, $this->name, $this->nickname, $this->email, $this->created_at, $this->updated_at, $salt, $this->user_attributes);
  		  $stmt->fetch(); 
  		  $this->user_attributes |= 1; 		
  		  $this->logged_in=true;
				setcookie("uid",$this->id."-".hash('sha256',$this->id.$salt),time()+3600*24*365);
  	}
  	catch (Exception $e) {
  		   dbg($e->getMessage());
  	}
  	$stmt->close();
  	$connection->query("UPDATE users SET comments='', user_attributes=".$this->user_attributes." WHERE id=".$this->id);
  	
  	return $this->logged_in;
  }

  private function authenticateWithCookie($connection, $cookie)
  {
  	$this->logged_in=false;
  	if (isset($cookie) && isset($cookie['uid']))
  	{
  		$id_hash = explode("-",$cookie['uid']);
  		
  		if (sizeof($id_hash) < 2)
  		  return false;
  		
   	  $stmt = $connection->prepare("SELECT id, name, nickname, email, created_at, updated_at, salt, user_attributes FROM users WHERE id=?");
	    $stmt->bind_param("i", $id_hash[0]);
    	try {
    		$stmt->execute();
  	  	$stmt->bind_result($this->id, $this->name, $this->nickname, $this->email, $this->created_at, $this->updated_at, $salt, $this->user_attributes);
  		  $stmt->fetch();  		
  		  if (hash('sha256',$id_hash[0].$salt) == $id_hash[1]) {
  		     $this->logged_in=true;
  		  }
   	  }
  	  catch (Exception $e) {
  		   dbg($e->getMessage());
  	  }
  	  $stmt->close();
	  }
  	return $this->logged_in;
  }

  private function authenticateWithEmailAndPassword($connection, $login, $email, $password)
  {
  	$this->logged_in=false;
  	if (!isset($email) || !isset($password) || !isset($login))
  		return false;
  
  	$stmt = $connection->prepare("SELECT id, name, nickname, encrypted_password, created_at, updated_at, salt, user_attributes FROM users WHERE email=?");
	  $stmt->bind_param("s", $email);
  	$this->logged_in=true;
  	try {
  		$stmt->execute();
  		$stmt->bind_result($this->id, $this->name, $this->nickname, $encrypted_password, $this->created_at, $this->updated_at, $salt, $this->user_attributes);
  		$stmt->fetch();  		
  		if ($encrypted_password == hash('sha256',$salt.$password))
				setcookie("uid",$this->id."-".hash('sha256',$this->id.$salt),time()+3600*24*365);
  		else
  		  $this->logged_in=false;
  	}
  	catch (Exception $e) {
  		dbg($e->getMessage());
  		$this->logged_in=false;
  	}
  	$stmt->close();
  	return $this->logged_in;
  }
};

?>
