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

    this.longPoll();
    this.scrollDown();
}

Chat.prototype.getMessage = function () {
    return $('#form-' + this.room_name + ' :input[name=message]').val();
};

Chat.prototype.clearMessage = function () {
    return $('#form-' + this.room_name + ' :input[name=message]').val('');
};

Chat.prototype.processEvents = function (events) {
    var i,
        message;

    for (i = 0; i < events.length; i += 1) {
        message = events[i];

        switch (message.type) {
            case 'message':
                this.addMessage(message);
                break;
            case 'join':
                this.addJoin(message);
                break;
            default:
                console.error ('unknown message type: ' + message.type);
                break;
        }
    }
};

Chat.prototype.addError = function (errorMessage) {
    $('#chat-' + this.room_name + ' .message-box ul').append(
        "<li class='error-message'>" + errorMessage + "</li>");

    this.scrollDown();
};

Chat.prototype.addMessage = function (event) {
    $('#chat-' + this.room_name + ' .message-box ul').append(
        "<li class='message'>" +
            "<span class='username'>" + event.username + ": </span>" +
            "<span class='message'>" + event.message + "</span>" +
        "</li>"); // TODO Use Jade instead of this

    this.scrollDown();
};

Chat.prototype.addJoin = function (event) {
    $('#chat-' + this.room_name + ' .message-box ul').append(
        "<li class='message'>" +
            "<span class='username'>" + event.username + " joined </span>" +
        "</li>"); // TODO Use Jade instead of this

    this.scrollDown();
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

          this_chat.processEvents (data.events);

        },
        "json");

    this.clearMessage();
}

Chat.prototype.longPoll = function () {
    var chat_obj = this;

    //TODO update the document title to include unread message count if blurred
    $.ajax({
        cache: false,
        type: "POST",
        url: "/chat/pollEvents",
        data: {room_name: chat_obj.room_name },
        dataType: "json",
        error: function () {
            chat_obj.addError("long poll error. trying again...");
            //don't flood the servers on error, wait 10 seconds before retrying
            setTimeout(chat_obj.longPoll, 10*1000);
        },
        success: function (data) {
            //longPoll(data);
            setTimeout(function() {
                chat_obj.longPoll()
            }, 1000);

            chat_obj.processEvents (data.events);
        }
    });
}

Chat.prototype.scrollDown = function () {
    console.log('scrolldown');
    //used to keep the most recent messages visible
   $('#chat-' + this.room_name + ' input.entry').focus();
   $('#chat-' + this.room_name + ' .message-box').animate({scrollTop: 9999}, 400);
}
