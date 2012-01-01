function Chat() {
    this.room_name = null;
}

Chat.prototype.attach = function(room_name) {
    this.room_name = room_name;

    /* Attach to the submit function */
    var this_chat = this;
    $('#form-' + room_name).submit(function() {
        try {
            this_chat.send();
        } catch (err) {
            console.error(err.message)
        }

        return false;
    });
}

Chat.prototype.getMessage = function () {
    return $('#form-' + this.room_name + ' :input[name=message]').val();
};

Chat.prototype.clearMessage = function () {
    return $('#form-' + this.room_name + ' :input[name=message]').val('');
};

Chat.prototype.addError = function (errorMessage) {
    $('#chat-' + this.room_name + ' .message-box ul').append(
        "<li class='error-message'>" + errorMessage + "</li>");
};

Chat.prototype.addMessages = function (messages) {
    var i,
        message;

    for (i = 0; i < messages.length; i += 1) {
        message = messages[i];

        $('#chat-' + this.room_name + ' .message-box ul').append(
            "<li class='message'>" +
                "<span class='username'>" + message.from + ": </span>" +
                "<span class='message'>" + message.message + "</span>" +
            "</li>"); // TODO Use Jade instead of this
    }
};

Chat.prototype.send = function() {
    var this_chat = this;

    jQuery.post("/chat/send",
        {
            message: this.getMessage(),
            room_name: this.room_name
        },
        function (data) {
          if (data.status !== 1) {
            this_chat.addError (data.error);
          }

          this_chat.addMessages (data.messages);

        },
        "json");

    this.clearMessage();
}
