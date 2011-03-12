Player = function(id, name, avatar) {
	this.id = id;
	this.name = name;
	this.avatar = avatar;
};

Player.prototype.getId = function() {
	return this.id;
}

Player.prototype.getName = function() {
	return this.name;
}

Player.prototype.getAvatar = function() {
	return this.avatar;
}