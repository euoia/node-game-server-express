function UserList(parentElement) {
	this.users = [];
	
	this.e = $(parentElement).append('<div id="user-list"></div>');
	this.ul = null;
}

UserList.prototype.initUsers = function (usernameArray) {
	var div,
		ul,
		li,
		thisUserList = this;
		
	console.log('initUsers: ' + usernameArray);
	
	
	div = $('<div><h3>users</h3></div>');
	$(this.e).append(div);
	
	this.ul = $('<ul class="unstyled"></ul>');
	$(div).append(this.ul)
	
	usernameArray.forEach (function (e) {
		li = $('<li>' + e + '</li>');
		$(thisUserList.ul).append (li);
		thisUserList.users.push ({
			'username': e,
			'element': li
		});
	});
};

UserList.prototype.removeUser = function (u) {
	var thisUserList = this;
	
	this.users.forEach (function (e, i) {
		if (e.username === u) {
			e.element.remove();
			thisUserList.users.splice (i, 1)
		}
	});
};

UserList.prototype.addUser = function (u) {
	li = $('<li>' + u + '</li>');
	$(this.ul).append (li);
	this.users.push ({
		'username': u,
		'element': li
	});
};

